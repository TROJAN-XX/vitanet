import { verifyAccessToken } from '../services/tokenService.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * JWT authentication middleware.
 * Extracts Bearer token from Authorization header, verifies it,
 * and attaches user document to req.user.
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw ApiError.unauthorized('Missing access token');
    }

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);

    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    if (user.accountStatus === 'banned') {
      throw ApiError.forbidden('Account has been banned');
    }

    if (user.accountStatus === 'suspended') {
      throw ApiError.forbidden('Account is suspended');
    }

    if (user.accountStatus === 'deleted') {
      throw ApiError.unauthorized('Account has been deleted');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Invalid or expired access token');
    }
    throw err;
  }
}

/**
 * Optional auth — attaches user if token present but doesn't require it.
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        const payload = verifyAccessToken(token);
        const user = await User.findById(payload.sub);
        if (user && !['banned', 'deleted'].includes(user.accountStatus)) {
          req.user = user;
        }
      }
    }
  } catch {
    // Token invalid — continue without user
  }
  next();
}

/**
 * Role-based authorization middleware factory.
 * @param {...string} roles - Allowed roles
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden('Insufficient permissions');
    }
    next();
  };
}

/**
 * Require verified email for publishing actions.
 */
export function requireVerifiedEmail(req, res, next) {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  if (!req.user.isEmailVerified) {
    throw ApiError.forbidden('Email verification required');
  }
  if (req.user.accountStatus !== 'active') {
    throw ApiError.forbidden('Account is not active');
  }
  next();
}
