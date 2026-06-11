const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = details.status;
    this.payload = details.payload;
  }
}

function buildApiUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

function getStringMessage(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(getStringMessage).find(Boolean) || '';
  if (typeof value === 'object') {
    return (
      getStringMessage(value.message) ||
      getStringMessage(value.error) ||
      getStringMessage(Object.values(value))
    );
  }
  return String(value);
}

function getErrorMessage(payload, fallback) {
  return (
    getStringMessage(payload?.message) ||
    getStringMessage(payload?.error) ||
    getStringMessage(payload?.errors) ||
    getStringMessage(payload) ||
    fallback
  );
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const hasBody = options.body !== undefined && options.body !== null;
  const body = hasBody && typeof options.body !== 'string'
    ? JSON.stringify(options.body)
    : options.body;

  if (hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response;
  try {
    response = await fetch(buildApiUrl(path), {
      credentials: 'include',
      ...options,
      headers,
      body,
    });
  } catch {
    throw new ApiError('Network error. Please check your connection and try again.');
  }

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => '');

  if (!response.ok) {
    throw new ApiError(getErrorMessage(payload, 'Request failed. Please try again.'), {
      status: response.status,
      payload,
    });
  }

  return payload;
}
