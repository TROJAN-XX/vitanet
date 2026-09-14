/**
 * API client for VitaNet backend.
 * Handles access token injection, refresh on 401, and consistent error shaping.
 * Access token is stored in memory only (never localStorage).
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/** In-memory access token — never persisted to localStorage */
let accessToken = null;

/**
 * Set the in-memory access token.
 * @param {string|null} token
 */
export function setAccessToken(token) {
  accessToken = token;
}

/**
 * Get the current access token.
 * @returns {string|null}
 */
export function getAccessToken() {
  return accessToken;
}

/**
 * Core fetch wrapper with auth, refresh, and error handling.
 * @param {string} path - API path (e.g., '/auth/login')
 * @param {RequestInit & { skipAuth?: boolean }} options
 * @returns {Promise<any>}
 */
async function request(path, options = {}) {
  const { skipAuth = false, ...fetchOptions } = options;

  const url = `${API_BASE}${path}`;

  const headers = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  if (!skipAuth && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const config = {
    ...fetchOptions,
    headers,
    credentials: 'include', // Send HttpOnly cookies
  };

  let res = await fetch(url, config);

  // If 401, try refreshing the token once
  if (res.status === 401 && !skipAuth && !path.includes('/auth/refresh')) {
    const refreshed = await refreshToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      res = await fetch(url, { ...config, headers });
    }
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const error = new Error(data?.error?.message || `Request failed: ${res.status}`);
    error.status = res.status;
    error.code = data?.error?.code;
    error.details = data?.error?.details;
    error.requestId = data?.requestId;
    throw error;
  }

  return data;
}

/**
 * Attempt to refresh the access token using the HttpOnly cookie.
 * @returns {Promise<boolean>}
 */
async function refreshToken() {
  try {
    const data = await request('/auth/refresh', {
      method: 'POST',
      skipAuth: true,
    });
    if (data?.data?.accessToken) {
      setAccessToken(data.data.accessToken);
      return true;
    }
    return false;
  } catch {
    setAccessToken(null);
    return false;
  }
}

/** API helper methods */
const api = {
  get: (path, options) => request(path, { method: 'GET', ...options }),

  post: (path, body, options) =>
    request(path, { method: 'POST', body: JSON.stringify(body), ...options }),

  patch: (path, body, options) =>
    request(path, { method: 'PATCH', body: JSON.stringify(body), ...options }),

  delete: (path, options) => request(path, { method: 'DELETE', ...options }),

  /** Upload directly to R2 using presigned PUT URL (bypasses API) */
  uploadToPresignedUrl: async (presignedUrl, file, contentType) => {
    const res = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': contentType,
      },
    });
    if (!res.ok) {
      throw new Error(`Upload failed: ${res.status}`);
    }
    return true;
  },
};

export default api;
