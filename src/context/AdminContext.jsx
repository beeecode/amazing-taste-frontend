import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import { authService } from '../services/authService';

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(() => authService.isAuthenticated());
  const [adminProfile, setAdminProfile] = useState(() => authService.getProfile());
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [messages, setMessages] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [systemAlert, setSystemAlert] = useState(null);

  const syncAuthState = useCallback(() => {
    const authenticated = authService.isAuthenticated();
    setIsLoggedIn(authenticated);
    setAdminProfile(authenticated ? authService.getProfile() : null);
    return authenticated;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const intervalId = window.setInterval(syncAuthState, 60000);
    window.addEventListener('admin-auth:invalid', syncAuthState);
    window.addEventListener('focus', syncAuthState);
    window.addEventListener('storage', syncAuthState);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('admin-auth:invalid', syncAuthState);
      window.removeEventListener('focus', syncAuthState);
      window.removeEventListener('storage', syncAuthState);
    };
  }, [syncAuthState]);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const session = await authService.login(username, password);
      setIsLoggedIn(true);
      setAdminProfile(session.profile || authService.getProfile());
      return true;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setIsLoggedIn(false);
      setAdminProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // Load admin data once authenticated
  const loadAdminData = async () => {
    if (!isLoggedIn) return;
    if (!authService.isAuthenticated()) {
      setIsLoggedIn(false);
      setAdminProfile(null);
      return;
    }

    setLoading(true);
    try {
      const [o, p, c, m, s] = await Promise.all([
        adminService.getOrders(),
        adminService.getProducts(),
        adminService.getCategories(),
        adminService.getMessages(),
        adminService.getSettings(),
      ]);
      setOrders(o);
      setProducts(p);
      setCategories(c);
      setMessages(m);
      setSettings(s);
    } catch (err) {
      if (authService.isAuthorizationError(err)) {
        await logout();
        showNotice('Session Expired', 'Please log in again to continue.');
      } else {
        console.error('Failed to load admin data:', err);
        showNotice('Admin Data Unavailable', 'We could not load admin data. Please refresh and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [isLoggedIn]);

  // Operations
  const updateOrderStatus = async (orderId, status) => {
    const updated = await adminService.updateOrderStatus(orderId, status);
    setOrders((current) =>
      current.map((order) => (order.id === orderId ? { ...order, ...updated } : order))
    );
  };

  const saveProduct = async (product) => {
    const saved = await adminService.saveProduct(product);
    setProducts((current) =>
      current.some((item) => item.id === saved.id)
        ? current.map((item) => (item.id === saved.id ? saved : item))
        : [saved, ...current]
    );
  };

  const deleteProduct = async (productId) => {
    await adminService.deleteProduct(productId);
    setProducts((current) => current.filter((item) => item.id !== productId));
  };

  const saveCategory = async (categoryName, oldCategoryName = null) => {
    const updated = await adminService.saveCategory(categoryName, oldCategoryName);
    setCategories(updated);
  };

  const deleteCategory = async (categoryName) => {
    try {
      await adminService.deleteCategory(categoryName);
      setCategories((current) => current.filter((cat) => cat.id !== categoryName));
    } catch (err) {
      showNotice('Category Not Deleted', err.message || 'This category cannot be deleted yet.');
    }
  };

  const toggleCategoryVisibility = async (categoryId) => {
    const updated = await adminService.toggleCategoryVisibility(categoryId);
    setCategories(updated);
  };

  const deleteMessage = async (messageId) => {
    await adminService.deleteMessage(messageId);
    setMessages((current) => current.filter((msg) => msg.id !== messageId));
  };

  const markMessageAsRead = async (messageId) => {
    await adminService.markMessageAsRead(messageId);
    setMessages((current) =>
      current.map((msg) => (msg.id === messageId ? { ...msg, read: true } : msg))
    );
  };

  const updateSettings = async (nextSettings) => {
    const updated = await adminService.updateSettings(nextSettings);
    setSettings(updated);
  };

  const requestConfirm = ({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm }) => {
    setSystemAlert({ type: 'danger', title, message, confirmLabel, cancelLabel, onConfirm });
  };

  const showNotice = (title, message) => {
    setSystemAlert({ type: 'info', title, message, confirmLabel: 'OK' });
  };

  const closeSystemAlert = () => setSystemAlert(null);
  const confirmSystemAlert = () => {
    systemAlert?.onConfirm?.();
    setSystemAlert(null);
  };

  const value = {
    isLoggedIn,
    adminProfile,
    login,
    logout,
    orders,
    setOrders,
    products,
    setProducts,
    categories,
    setCategories,
    messages,
    setMessages,
    settings,
    setSettings,
    loading,
    systemAlert,
    setSystemAlert,
    updateOrderStatus,
    saveProduct,
    deleteProduct,
    saveCategory,
    deleteCategory,
    toggleCategoryVisibility,
    deleteMessage,
    markMessageAsRead,
    updateSettings,
    requestConfirm,
    showNotice,
    closeSystemAlert,
    confirmSystemAlert,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
