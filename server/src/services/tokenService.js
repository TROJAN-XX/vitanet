import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import env from '../config/env.js';
import {
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY_MS,
  MAX_SESSIONS_PER_USER,
} from '../config/constants.js';
import Session from '../models/Session.js';

/**
 * Generate a 15-minute access JWT.
 * @param {{ id: string, role: string }} user
 * @returns {string}
 */
export function generateAccessToken(user) {
  return jwt.sign(
    { sub: user.id || user._id, role: user.role },
    env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

/**
 * Verify an access JWT.
 * @param {string} token
 * @returns {{ sub: string, role: string, iat: number, exp: number }}
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

/**
 * Generate a cryptographically random refresh token string.
 * @returns {string}
 */
export function generateRefreshTokenString() {
  return crypto.randomBytes(48).toString('base64url');
}

/**
 * Hash a refresh token for storage (never store plaintext).
 * @param {string} token
 * @returns {string}
 */
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Create and persist a new refresh token session.
 * Enforces per-user session limit by removing oldest sessions.
 * @param {string} userId
 * @param {string} userAgent
 * @param {string} ip
 * @returns {Promise<{ refreshToken: string, session: object }>}
 */
export async function createRefreshSession(userId, userAgent, ip) {
  const refreshToken = generateRefreshTokenString();
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

  // Enforce session limit — remove oldest if at cap
  const sessionCount = await Session.countDocuments({ userId, revokedAt: null });
  if (sessionCount >= MAX_SESSIONS_PER_USER) {
    const oldest = await Session.findOne({ userId, revokedAt: null })
      .sort({ createdAt: 1 });
    if (oldest) {
      oldest.revokedAt = new Date();
      await oldest.save();
    }
  }

  const session = await Session.create({
    userId,
    tokenHash,
    expiresAt,
    userAgentHash: userAgent ? hashToken(userAgent) : null,
    ipHash: ip ? hashToken(ip) : null,
  });

  return { refreshToken, session };
}

/**
 * Validate and rotate a refresh token.
 * Returns new access + refresh tokens, or null if invalid.
 * @param {string} refreshToken
 * @returns {Promise<{ accessToken: string, refreshToken: string, user: object } | null>}
 */
export async function rotateRefreshToken(refreshToken, user) {
  const tokenHash = hashToken(refreshToken);

  // Find and revoke the old session
  const session = await Session.findOneAndUpdate(
    { tokenHash, revokedAt: null, expiresAt: { $gt: new Date() } },
    { revokedAt: new Date() },
    { new: false }
  );

  if (!session) return null;

  // Verify session belongs to user
  if (session.userId.toString() !== (user.id || user._id).toString()) {
    return null;
  }

  // Create new session (rotation)
  const { refreshToken: newRefresh } =
    await createRefreshSession(user.id || user._id, null, null);

  const accessToken = generateAccessToken(user);

  return { accessToken, refreshToken: newRefresh };
}

/**
 * Revoke a refresh token (logout).
 * @param {string} refreshToken
 */
export async function revokeRefreshToken(refreshToken) {
  const tokenHash = hashToken(refreshToken);
  await Session.updateOne(
    { tokenHash, revokedAt: null },
    { revokedAt: new Date() }
  );
}

/**
 * Revoke all sessions for a user.
 * @param {string} userId
 */
export async function revokeAllUserSessions(userId) {
  await Session.updateMany(
    { userId, revokedAt: null },
    { revokedAt: new Date() }
  );
}
