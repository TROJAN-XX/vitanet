/**
 * Custom API error class with HTTP status code and error code.
 * Used by the centralized error handler middleware.
 */
export class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} code - Machine-readable error code (e.g., 'VALIDATION_ERROR')
   * @param {string} message - Human-readable error message
   * @param {object} [details] - Optional additional details
   */
  constructor(statusCode, code, message, details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(message = 'Bad request', details) {
    return new ApiError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, 'NOT_FOUND', message);
  }

  static conflict(message = 'Conflict') {
    return new ApiError(409, 'CONFLICT', message);
  }

  static tooManyRequests(message = 'Too many requests') {
    return new ApiError(429, 'TOO_MANY_REQUESTS', message);
  }

  static payloadTooLarge(message = 'Payload too large') {
    return new ApiError(413, 'PAYLOAD_TOO_LARGE', message);
  }

  static unprocessable(message = 'Unprocessable entity', details) {
    return new ApiError(422, 'UNPROCESSABLE_ENTITY', message, details);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, 'INTERNAL_ERROR', message);
  }

  static quotaExceeded(message = 'Quota exceeded') {
    return new ApiError(403, 'QUOTA_EXCEEDED', message);
  }

  static userCapReached(message = 'User registration cap reached') {
    return new ApiError(403, 'USER_CAP_REACHED', message);
  }

  static mediaCapReached(message = 'Global media storage cap reached') {
    return new ApiError(403, 'MEDIA_CAP_REACHED', message);
  }
}
