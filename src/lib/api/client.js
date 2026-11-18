import { getAccessToken } from './auth-token';
import { ApiError } from './errors';

export async function apiFetch(path, { admin = false, body, ...options } = {}) {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json, application/problem+json');
  headers.set('Accept-Language', 'en');
  const multipart = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body !== undefined && !multipart) {
    headers.set('Content-Type', 'application/json');
  }
  async function send(refresh) {
    if (admin) {
      let token;
      try {
        token = await getAccessToken(refresh);
      } catch {
        token = null;
      }
      if (!token) {
        return null;
      }
      headers.set('Authorization', 'Bearer ' + token);
    }
    return fetch(
      (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/+$/, '') + path,
      { ...options, headers, body: body === undefined || multipart ? body : JSON.stringify(body) },
    );
  }
  let response;
  try {
    response = await send(false);
    if (admin && response?.status === 401) {
      response = await send(true);
    }
  } catch {
    throw new ApiError('Unable to connect to the server. Check the backend and CORS settings.');
  }
  if (!response || response.status === 401) {
    if (admin && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth-expired'));
    }
    throw new ApiError('Your session has expired. Please sign in again.', { status: 401 });
  }
  const raw = response.status === 204 ? '' : await response.text();
  let data = raw;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {}
  if (!response.ok) {
    throw new ApiError(
      response.status === 403
        ? 'This account does not have ADMIN access.'
        : data?.detail ||
            data?.title ||
            (response.status === 404 ? 'Not found.' : 'Server error (' + response.status + ')'),
      { status: response.status, data },
    );
  }
  return data;
}
