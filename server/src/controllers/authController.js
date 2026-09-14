import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import User from '../models/User.js';
import EmailToken from '../models/EmailToken.js';
import env from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import {
  USERNAME_MIN_CHARS, USERNAME_MAX_CHARS,
  PASSWORD_MIN_CHARS, PASSWORD_MAX_CHARS,
  GLOBAL_USER_CAP, EMAIL_TOKEN_EXPIRY_MS,
} from '../config/constants.js';
import {
  generateAccessToken, createRefreshSession,
  revokeRefreshToken, revokeAllUserSessions,
  hashToken,
} from '../services/tokenService.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';
import { REFRESH_TOKEN_EXPIRY_MS } from '../config/constants.js';
import AuditEvent from '../models/AuditEvent.js';

// ── Validation Schemas ──

const registerSchema = z.object({
  username: z.string().min(USERNAME_MIN_CHARS).max(USERNAME_MAX_CHARS)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email(),
  password: z.string().min(PASSWORD_MIN_CHARS).max(PASSWORD_MAX_CHARS),
  displayName: z.string().max(50).optional().default(''),
  turnstileToken: z.string().optional(),
  ageConfirmation: z.literal(true, { errorMap: () => ({ message: 'You must confirm you are 18 or older' }) }),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  turnstileToken: z.string().optional(),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
  turnstileToken: z.string().optional(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(PASSWORD_MIN_CHARS).max(PASSWORD_MAX_CHARS),
});

// ── Cookie Config ──
function getRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: REFRESH_TOKEN_EXPIRY_MS,
    path: '/api/v1/auth',
    signed: true,
  };
}

// ── Helpers ──
function normalizeEmail(email) {
  return email.toLowerCase().trim();
}

function normalizeUsername(username) {
  return username.toLowerCase().trim();
}

function sanitizeUserForClient(user) {
  const obj = user.toJSON ? user.toJSON() : { ...user };
  delete obj.passwordHash;
  delete obj.emailNormalized;
  delete obj.usernameNormalized;
  return obj;
}

// ── Controllers ──

/**
 * POST /auth/register
 */
export async function register(req, res) {
  const data = registerSchema.parse(req.body);

  // Check user cap
  const userCount = await User.countDocuments({ accountStatus: { $ne: 'deleted' } });
  if (userCount >= (env.GLOBAL_USER_CAP || GLOBAL_USER_CAP)) {
    throw ApiError.userCapReached('Registration is currently closed. User limit reached.');
  }

  // Check uniqueness
  const emailNorm = normalizeEmail(data.email);
  const usernameNorm = normalizeUsername(data.username);

  const existing = await User.findOne({
    $or: [{ emailNormalized: emailNorm }, { usernameNormalized: usernameNorm }],
  });

  if (existing) {
    // Generic message to prevent enumeration
    throw ApiError.conflict('An account with this email or username already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(data.password, 12);

  // Create user
  const user = await User.create({
    username: data.username,
    usernameNormalized: usernameNorm,
    email: data.email,
    emailNormalized: emailNorm,
    passwordHash,
    displayName: data.displayName || data.username,
    accountStatus: 'pending_verification',
  });

  // Generate verification token
  const verifyToken = crypto.randomBytes(32).toString('hex');
  await EmailToken.create({
    userId: user._id,
    tokenHash: hashToken(verifyToken),
    purpose: 'email_verification',
    expiresAt: new Date(Date.now() + EMAIL_TOKEN_EXPIRY_MS),
  });

  // Send verification email (non-blocking)
  sendVerificationEmail(data.email, verifyToken).catch(err => {
    console.error('[AUTH] Failed to send verification email:', err.message);
  });

  // Audit
  await AuditEvent.create({
    actorUserId: user._id,
    action: 'user_register',
    targetType: 'user',
    targetId: user._id,
  });

  res.status(201).json({
    success: true,
    data: {
      message: 'Account created. Check your email to verify your account.',
      userId: user._id,
    },
    requestId: req.requestId,
  });
}

/**
 * POST /auth/verify-email
 */
export async function verifyEmail(req, res) {
  const { token } = verifyEmailSchema.parse(req.body);
  const tokenHash = hashToken(token);

  const emailToken = await EmailToken.findOne({
    tokenHash,
    purpose: 'email_verification',
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (!emailToken) {
    throw ApiError.badRequest('Invalid or expired verification link');
  }

  const user = await User.findById(emailToken.userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  // Activate user
  user.isEmailVerified = true;
  if (user.accountStatus === 'pending_verification') {
    user.accountStatus = 'active';
  }
  await user.save();

  // Mark token used
  emailToken.usedAt = new Date();
  await emailToken.save();

  res.json({
    success: true,
    data: { message: 'Email verified successfully. You can now log in.' },
    requestId: req.requestId,
  });
}

/**
 * POST /auth/resend-verification
 */
export async function resendVerification(req, res) {
  const { email } = z.object({ email: z.string().email() }).parse(req.body);
  const emailNorm = normalizeEmail(email);

  const user = await User.findOne({ emailNormalized: emailNorm });

  // Always return success to prevent enumeration
  if (!user || user.isEmailVerified) {
    return res.json({
      success: true,
      data: { message: 'If the email exists and is unverified, a verification link has been sent.' },
      requestId: req.requestId,
    });
  }

  // Invalidate old tokens
  await EmailToken.updateMany(
    { userId: user._id, purpose: 'email_verification', usedAt: null },
    { usedAt: new Date() }
  );

  const verifyToken = crypto.randomBytes(32).toString('hex');
  await EmailToken.create({
    userId: user._id,
    tokenHash: hashToken(verifyToken),
    purpose: 'email_verification',
    expiresAt: new Date(Date.now() + EMAIL_TOKEN_EXPIRY_MS),
  });

  sendVerificationEmail(user.email, verifyToken).catch(err => {
    console.error('[AUTH] Failed to send verification email:', err.message);
  });

  res.json({
    success: true,
    data: { message: 'If the email exists and is unverified, a verification link has been sent.' },
    requestId: req.requestId,
  });
}

/**
 * POST /auth/login
 */
export async function login(req, res) {
  const data = loginSchema.parse(req.body);
  const emailNorm = normalizeEmail(data.email);

  // Generic error message prevents enumeration
  const genericError = 'Invalid email or password';

  const user = await User.findOne({ emailNormalized: emailNorm }).select('+passwordHash');
  if (!user) {
    // Still hash to prevent timing attacks
    await bcrypt.hash('dummy', 12);
    throw ApiError.unauthorized(genericError);
  }

  if (user.accountStatus === 'banned') {
    throw ApiError.forbidden('Account has been banned');
  }

  if (user.accountStatus === 'deleted') {
    await bcrypt.hash('dummy', 12);
    throw ApiError.unauthorized(genericError);
  }

  const isMatch = await bcrypt.compare(data.password, user.passwordHash);
  if (!isMatch) {
    throw ApiError.unauthorized(genericError);
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const { refreshToken } = await createRefreshSession(
    user._id,
    req.get('user-agent'),
    req.ip
  );

  // Update last login
  user.lastLoginAt = new Date();
  await user.save();

  // Audit
  await AuditEvent.create({
    actorUserId: user._id,
    action: 'user_login',
    targetType: 'user',
    targetId: user._id,
  });

  // Set refresh token as HttpOnly cookie
  res.cookie('refreshToken', refreshToken, getRefreshCookieOptions());

  res.json({
    success: true,
    data: {
      accessToken,
      user: sanitizeUserForClient(user),
    },
    requestId: req.requestId,
  });
}

/**
 * POST /auth/refresh
 */
export async function refresh(req, res) {
  const refreshTokenValue = req.signedCookies?.refreshToken;
  if (!refreshTokenValue) {
    throw ApiError.unauthorized('No refresh token');
  }

  const tokenHash = hashToken(refreshTokenValue);

  // Find the session
  const { default: Session } = await import('../models/Session.js');
  const session = await Session.findOne({
    tokenHash,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (!session) {
    // Clear the invalid cookie
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(session.userId);
  if (!user || ['banned', 'deleted'].includes(user.accountStatus)) {
    session.revokedAt = new Date();
    await session.save();
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    throw ApiError.unauthorized('Account unavailable');
  }

  // Revoke old session
  session.revokedAt = new Date();
  await session.save();

  // Create new session (rotation)
  const accessToken = generateAccessToken(user);
  const { refreshToken: newRefreshToken } = await createRefreshSession(
    user._id,
    req.get('user-agent'),
    req.ip
  );

  res.cookie('refreshToken', newRefreshToken, getRefreshCookieOptions());

  res.json({
    success: true,
    data: {
      accessToken,
      user: sanitizeUserForClient(user),
    },
    requestId: req.requestId,
  });
}

/**
 * POST /auth/logout
 */
export async function logout(req, res) {
  const refreshTokenValue = req.signedCookies?.refreshToken;
  if (refreshTokenValue) {
    await revokeRefreshToken(refreshTokenValue);
  }

  res.clearCookie('refreshToken', { path: '/api/v1/auth' });

  res.json({
    success: true,
    data: { message: 'Logged out successfully' },
    requestId: req.requestId,
  });
}

/**
 * POST /auth/forgot-password
 */
export async function forgotPassword(req, res) {
  const { email } = forgotPasswordSchema.parse(req.body);
  const emailNorm = normalizeEmail(email);

  // Always return success to prevent enumeration
  const successMsg = 'If the email exists, a password reset link has been sent.';

  const user = await User.findOne({ emailNormalized: emailNorm });
  if (!user || user.accountStatus === 'deleted') {
    return res.json({
      success: true,
      data: { message: successMsg },
      requestId: req.requestId,
    });
  }

  // Invalidate old reset tokens
  await EmailToken.updateMany(
    { userId: user._id, purpose: 'password_reset', usedAt: null },
    { usedAt: new Date() }
  );

  const resetToken = crypto.randomBytes(32).toString('hex');
  await EmailToken.create({
    userId: user._id,
    tokenHash: hashToken(resetToken),
    purpose: 'password_reset',
    expiresAt: new Date(Date.now() + EMAIL_TOKEN_EXPIRY_MS),
  });

  sendPasswordResetEmail(user.email, resetToken).catch(err => {
    console.error('[AUTH] Failed to send password reset email:', err.message);
  });

  res.json({
    success: true,
    data: { message: successMsg },
    requestId: req.requestId,
  });
}

/**
 * POST /auth/reset-password
 */
export async function resetPassword(req, res) {
  const { token, password } = resetPasswordSchema.parse(req.body);
  const tokenHash = hashToken(token);

  const emailToken = await EmailToken.findOne({
    tokenHash,
    purpose: 'password_reset',
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (!emailToken) {
    throw ApiError.badRequest('Invalid or expired reset link');
  }

  const user = await User.findById(emailToken.userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  // Update password
  user.passwordHash = await bcrypt.hash(password, 12);
  await user.save();

  // Mark token used
  emailToken.usedAt = new Date();
  await emailToken.save();

  // Revoke all existing sessions (force re-login)
  await revokeAllUserSessions(user._id);

  res.json({
    success: true,
    data: { message: 'Password reset successfully. Please log in with your new password.' },
    requestId: req.requestId,
  });
}

/**
 * GET /auth/me
 */
export async function getMe(req, res) {
  res.json({
    success: true,
    data: { user: sanitizeUserForClient(req.user) },
    requestId: req.requestId,
  });
}
