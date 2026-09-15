import { describe, it, expect } from '@jest/globals';
import { ApiError } from '../src/utils/ApiError.js';

describe('ApiError Factory Methods', () => {
  it('should create a 400 Bad Request error', () => {
    const err = ApiError.badRequest('Invalid input data');
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toBeInstanceOf(Error);
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('BAD_REQUEST');
    expect(err.message).toBe('Invalid input data');
  });

  it('should create a 401 Unauthorized error', () => {
    const err = ApiError.unauthorized('Authentication required');
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
  });

  it('should create a 403 Forbidden error', () => {
    const err = ApiError.forbidden('Access denied');
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });

  it('should create a 404 Not Found error', () => {
    const err = ApiError.notFound('Resource not found');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
  });

  it('should create a 413 Payload Too Large error', () => {
    const err = ApiError.payloadTooLarge('File exceeds maximum size');
    expect(err.statusCode).toBe(413);
    expect(err.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('should create a 429 Too Many Requests error', () => {
    const err = ApiError.tooManyRequests('Rate limit exceeded');
    expect(err.statusCode).toBe(429);
    expect(err.code).toBe('TOO_MANY_REQUESTS');
  });

  it('should create a 403 Quota Exceeded error for zero-cost guardrail', () => {
    const err = ApiError.quotaExceeded('User has consumed 75MB media storage');
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('QUOTA_EXCEEDED');
  });

  it('should create a 403 User Cap Reached error for 100-user platform limit', () => {
    const err = ApiError.userCapReached('Platform registration is closed at 100 users');
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('USER_CAP_REACHED');
  });
});
