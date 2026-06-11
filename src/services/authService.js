import { ApiError, apiRequest } from './apiClient';

const ADMIN_TOKEN_KEY = 'atd_admin_token';
const ADMIN_PROFILE_KEY = 'atd_admin_profile';
const ADMIN_LOGIN_PATH = '/admin/login';

const normalizePathname = (pathname) => {
  const normalized = String(pathname || '').replace(/\/+$/, '');
  return normalized || '/';
};

const getStorage = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
};

const getResponseData = (response) => response?.data?.data || response?.data || response;

function decodeJwtPayload(token) {
  try {
    const [, payload] = String(token || '').split('.');
    if (!payload) return null;
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, '=');
    return JSON.parse(window.atob(paddedPayload));
  } catch {
    return null;
  }
}

function isExpiredToken(token) {
  const payload = decodeJwtPayload(token);
  if (!payload) return true;
  if (!payload.exp) return false;
  return Date.now() >= payload.exp * 1000;
}

function notifyInvalidSession() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('admin-auth:invalid'));
}

function clearAuthData({ notify = false } = {}) {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(ADMIN_TOKEN_KEY);
  storage.removeItem(ADMIN_PROFILE_KEY);
  if (notify) notifyInvalidSession();
}

function readProfile() {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const profile = storage.getItem(ADMIN_PROFILE_KEY);
    return profile ? JSON.parse(profile) : null;
  } catch {
    storage.removeItem(ADMIN_PROFILE_KEY);
    return null;
  }
}

function getStoredToken({ clearOnInvalid = true } = {}) {
  const storage = getStorage();
  const token = storage?.getItem(ADMIN_TOKEN_KEY) || '';

  if (!token) return '';
  if (isExpiredToken(token)) {
    if (clearOnInvalid) clearAuthData({ notify: true });
    return '';
  }

  return token;
}

function pickAuthToken(response) {
  const data = getResponseData(response);
  return (
    data?.token ||
    data?.jwt ||
    data?.access_token ||
    data?.accessToken ||
    data?.admin_token ||
    data?.adminToken ||
    data?.auth?.token ||
    response?.token ||
    ''
  );
}

function sanitizeProfile(profile) {
  if (!profile || typeof profile !== 'object') return null;

  const allowedKeys = [
    'id',
    'admin_id',
    'adminId',
    'username',
    'name',
    'fullName',
    'email',
    'role',
    'permissions',
    'avatar',
    'created_at',
    'createdAt',
  ];

  return allowedKeys.reduce((safeProfile, key) => {
    if (profile[key] !== undefined && profile[key] !== null) {
      safeProfile[key] = profile[key];
    }
    return safeProfile;
  }, {});
}

function pickAdminProfile(response) {
  const data = getResponseData(response);
  return sanitizeProfile(
    data?.admin ||
      data?.profile ||
      data?.adminProfile ||
      data?.admin_profile ||
      data?.user ||
      data?.account ||
      null
  );
}

function storeAuthData({ token, profile }) {
  const storage = getStorage();
  if (!storage) return;

  storage.setItem(ADMIN_TOKEN_KEY, token);

  if (profile && Object.keys(profile).length > 0) {
    storage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(profile));
  } else {
    storage.removeItem(ADMIN_PROFILE_KEY);
  }
}

function isAdminPath(pathname) {
  const normalizedPathname = normalizePathname(pathname);
  return normalizedPathname === '/admin' || normalizedPathname.startsWith('/admin/');
}

function isAdminLoginPath(pathname) {
  return normalizePathname(pathname) === ADMIN_LOGIN_PATH;
}

export async function adminApiRequest(path, options = {}) {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!token) {
    clearAuthData({ notify: true });
    throw new ApiError('Your admin session has expired. Please log in again.', { status: 401 });
  }

  // Protected admin requests must carry the JWT issued by the backend login endpoint.
  headers.set('Authorization', `Bearer ${token}`);

  try {
    return await apiRequest(path, {
      ...options,
      headers,
    });
  } catch (error) {
    if (authService.isAuthorizationError(error)) {
      clearAuthData({ notify: true });
    }
    throw error;
  }
}

export const authService = {
  async login(username, password) {
    const normalizedUsername = String(username || '').trim();
    const normalizedPassword = String(password || '');

    if (!normalizedUsername || !normalizedPassword.trim()) {
      throw new ApiError('Invalid username or password', { status: 400 });
    }

    const response = await apiRequest('/api/admin/auth/login', {
      method: 'POST',
      body: {
        username: normalizedUsername,
        password: normalizedPassword,
      },
    });

    const token = pickAuthToken(response);
    if (!token || isExpiredToken(token)) {
      clearAuthData();
      throw new ApiError('Invalid username or password', { status: 401 });
    }

    const profile = pickAdminProfile(response);
    storeAuthData({ token, profile });
    return { token, profile };
  },

  async logout() {
    clearAuthData();
    return true;
  },

  isAuthenticated() {
    return Boolean(getStoredToken());
  },

  getToken() {
    return getStoredToken();
  },

  getProfile() {
    if (!this.isAuthenticated()) return null;
    return readProfile();
  },

  clearAuthData,

  isAuthorizationError(error) {
    return error?.status === 401 || error?.status === 403;
  },

  getLoginErrorMessage(error) {
    if (!error?.status && /network/i.test(error?.message || '')) {
      return 'Network error. Please check your connection and try again.';
    }

    if (error?.status >= 500) {
      return 'Unable to sign in right now. Please try again.';
    }

    return 'Invalid username or password';
  },

  getAdminRedirectPath(pathname = window.location.pathname) {
    const normalizedPathname = normalizePathname(pathname);

    if (!isAdminPath(normalizedPathname)) return null;
    const isAuthenticated = this.isAuthenticated();

    if (!isAuthenticated && !isAdminLoginPath(normalizedPathname)) return ADMIN_LOGIN_PATH;
    if (isAuthenticated && isAdminLoginPath(normalizedPathname)) return '/admin';
    return null;
  },
};
