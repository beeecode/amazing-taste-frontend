import { useEffect, useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import AdminLogin from './components/AdminLogin';
import AdminShell from './components/AdminShell';
import DashboardTab from './components/DashboardTab';
import OrdersTab from './components/OrdersTab';
import HistoryTab from './components/HistoryTab';
import ProductsTab from './components/ProductsTab';
import MessagesTab from './components/MessagesTab';
import SettingsTab from './components/SettingsTab';
import { OrderDetailsModal } from '../../components/modals/OrderDetailsModal';
import { SystemAlertModal } from '../../components/modals/SystemAlertModal';
import { authService } from '../../services/authService';

export default function AdminPage() {
  const {
    isLoggedIn,
    login,
    logout,
    orders,
    products,
    categories,
    messages,
    setMessages,
    settings,
    loading,
    updateSettings,
    systemAlert,
    updateOrderStatus,
    saveProduct,
    deleteProduct,
    saveCategory,
    deleteCategory,
    toggleCategoryVisibility,
    requestConfirm,
    showNotice,
    closeSystemAlert,
    confirmSystemAlert,
  } = useAdmin();

  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const selectedOrder = orders.find((order) => order.id === selectedOrderId);

  useEffect(() => {
    const redirectPath = authService.getAdminRedirectPath(window.location.pathname);
    if (redirectPath) {
      window.history.replaceState({}, '', redirectPath);
    }
  }, [isLoggedIn]);

  const handleStatusChange = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, status);
    } catch (err) {
      showNotice('Update Failed', 'Failed to update order status.');
    }
  };

  const handleLogout = () => {
    requestConfirm({
      title: 'Logout?',
      message: 'Are you sure you want to logout from the admin panel?',
      confirmLabel: 'Logout',
      onConfirm: () => {
        logout();
        setActivePage('dashboard');
      },
    });
  };

  if (!isLoggedIn) {
    return (
      <>
        <AdminLogin showNotice={showNotice} onLogin={login} loading={loading} />
        <SystemAlertModal alert={systemAlert} onCancel={closeSystemAlert} onConfirm={confirmSystemAlert} />
      </>
    );
  }

  const pageContent = {
    dashboard: (
      <DashboardTab
        orders={orders}
        products={products}
        onPageChange={setActivePage}
        onOpenOrder={(order) => setSelectedOrderId(order.id)}
      />
    ),
    orders: <OrdersTab orders={orders} onOpenOrder={(order) => setSelectedOrderId(order.id)} />,
    history: <HistoryTab orders={orders} onOpenOrder={(order) => setSelectedOrderId(order.id)} />,
    products: (
      <ProductsTab
        products={products}
        saveProduct={saveProduct}
        deleteProduct={deleteProduct}
        categories={categories}
        saveCategory={saveCategory}
        deleteCategory={deleteCategory}
        toggleCategoryVisibility={toggleCategoryVisibility}
        requestConfirm={requestConfirm}
        showNotice={showNotice}
      />
    ),
    messages: (
      <MessagesTab messages={messages} setMessages={setMessages} requestConfirm={requestConfirm} />
    ),
    settings: (
      <SettingsTab
        settings={settings}
        updateSettings={updateSettings}
        onLogout={handleLogout}
        showNotice={showNotice}
      />
    ),
  };

  return (
    <AdminShell
      activePage={activePage}
      onPageChange={setActivePage}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      onLogout={handleLogout}
    >
      {pageContent[activePage]}
      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrderId(null)}
        onStatusChange={handleStatusChange}
      />
      <SystemAlertModal alert={systemAlert} onCancel={closeSystemAlert} onConfirm={confirmSystemAlert} />
    </AdminShell>
  );
}
