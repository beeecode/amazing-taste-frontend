/**
 * Mock authentication service handling admin login and logout flow.
 * Once connected to the backend, these functions will call actual REST APIs (e.g., /api/auth/login).
 * This localStorage flag is development-only and must not be treated as production security.
 */

const MOCK_ADMIN_AUTH_KEY = 'amazingTasteAdmin';
const ADMIN_ROUTES = new Set(['/admin', '/admin/login']);

const normalizePathname = (pathname) => {
  const normalized = String(pathname || '').replace(/\/+$/, '');
  return normalized || '/';
};

export const authService = {
  /**
   * Log in the admin user.
   * @param {string} email - Email or username
   * @param {string} password - Password
   * @returns {Promise<boolean>}
   */
  async login(email, password) {
    return new Promise((resolve, reject) => {
      // Simulate API latency
      setTimeout(() => {
        if (!email.trim() || !password.trim()) {
          reject(new Error('Enter your email or username and password.'));
        } else {
          window.localStorage.setItem(MOCK_ADMIN_AUTH_KEY, 'active');
          resolve(true);
        }
      }, 500);
    });
  },

  /**
   * Log out the admin user.
   * @returns {Promise<boolean>}
   */
  async logout() {
    return new Promise((resolve) => {
      setTimeout(() => {
        window.localStorage.removeItem(MOCK_ADMIN_AUTH_KEY);
        resolve(true);
      }, 300);
    });
  },

  /**
   * Check if user is currently authenticated.
   * @returns {boolean}
   */
  isAuthenticated() {
    return window.localStorage.getItem(MOCK_ADMIN_AUTH_KEY) === 'active';
  },

  getAdminRedirectPath(pathname = window.location.pathname) {
    const normalizedPathname = normalizePathname(pathname);

    if (!ADMIN_ROUTES.has(normalizedPathname)) return null;
    const isAuthenticated = this.isAuthenticated();

    if (!isAuthenticated && normalizedPathname === '/admin') return '/admin/login';
    if (isAuthenticated && normalizedPathname === '/admin/login') return '/admin';
    return null;
  },
};
