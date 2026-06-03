import { motion } from 'framer-motion';
import {
  Banknote,
  CalendarDays,
  ChefHat,
  CircleCheck,
  CircleX,
  Clock,
  CreditCard,
  Eye,
  History,
  PackageCheck,
  PackageX,
  Plus,
  Settings2,
  ShoppingBag,
  TrendingUp,
  Utensils,
} from 'lucide-react';
import { formatPrice } from '../../../utils/formatPrice';
import { formatOrderDate, getOrderDateKey } from '../../../utils/orderDates';
import { calculateOrderTotal } from '../../../utils/orderTotals';
import { ORDER_STATUS_OPTIONS, ORDER_STATUSES, PAYMENT_STATUSES } from '../../../constants/orderContracts';
import { OrderStatus } from './OrderStatus';

const itemVariants = {
  visible: { opacity: 1, y: 0, transition: { duration: 0.36, ease: [0.22, 1, 0.36, 1] } },
};

function getCounts(orders) {
  return ORDER_STATUS_OPTIONS.reduce((counts, filter) => {
    if (filter.id === 'all') counts[filter.id] = orders.length;
    else counts[filter.id] = orders.filter((order) => order.order_status === filter.id).length;
    return counts;
  }, {});
}

export default function DashboardTab({ orders, products, onPageChange, onOpenOrder }) {
  const paidOrders = orders.filter((order) => order.payment_status === PAYMENT_STATUSES.PAID);
  const totalRevenue = paidOrders.reduce((sum, order) => sum + calculateOrderTotal(order), 0);
  const pendingPayment = orders
    .filter((order) => order.payment_status === PAYMENT_STATUSES.PENDING)
    .reduce((sum, order) => sum + calculateOrderTotal(order), 0);
  const today = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter((order) => getOrderDateKey(order) === today);
  const todayRevenue = todayOrders
    .filter((order) => order.payment_status === PAYMENT_STATUSES.PAID)
    .reduce((sum, order) => sum + calculateOrderTotal(order), 0);
  const counts = getCounts(orders);
  const pendingOrderCount =
    (counts[ORDER_STATUSES.PAID] || 0) +
    (counts[ORDER_STATUSES.PREPARING] || 0) +
    (counts[ORDER_STATUSES.READY_FOR_PICKUP] || 0) +
    (counts[ORDER_STATUSES.OUT_FOR_DELIVERY] || 0);
  
  const metrics = [
    { label: 'Total Orders', value: orders.length, Icon: ShoppingBag },
    { label: "Today's Orders", value: todayOrders.length, Icon: CalendarDays },
    { label: 'Pending Orders', value: pendingOrderCount, Icon: Clock },
    { label: 'Completed Orders', value: counts[ORDER_STATUSES.COMPLETED] || 0, Icon: CircleCheck },
    { label: 'Cancelled Orders', value: counts[ORDER_STATUSES.CANCELLED] || 0, Icon: CircleX },
    { label: 'Preparing Orders', value: counts[ORDER_STATUSES.PREPARING] || 0, Icon: ChefHat },
    { label: 'Total Revenue', value: formatPrice(totalRevenue), Icon: Banknote },
    { label: "Today's Revenue", value: formatPrice(todayRevenue), Icon: TrendingUp },
    { label: 'Pending Payment', value: formatPrice(pendingPayment), Icon: CreditCard },
    { label: 'Most Ordered Food', value: 'Jollof Rice', Icon: Utensils },
    { label: 'Available Menu Items', value: products.filter((item) => item.available).length, Icon: PackageCheck },
    { label: 'Unavailable Menu Items', value: products.filter((item) => !item.available).length, Icon: PackageX },
  ];
  const recentOrders = orders.filter((order) => order.payment_status === PAYMENT_STATUSES.PAID).slice(0, 4);

  return (
    <>
      <motion.div className="admin-list-heading" variants={itemVariants}>
        <h1>Dashboard</h1>
      </motion.div>
      <div className="admin-metric-grid">
        {metrics.map(({ label, value, Icon }) => (
          <article className="admin-metric-card" key={label}>
            <div className="admin-metric-card-head">
              <span className="admin-metric-label">{label}</span>
              <span className="admin-metric-icon" aria-hidden="true">
                <Icon size={22} strokeWidth={1.8} />
              </span>
            </div>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
      <div className="admin-quick-actions">
        <button className="admin-primary-button" type="button" onClick={() => onPageChange('orders')}>
          <Eye size={15} strokeWidth={1.8} aria-hidden="true" />
          View Orders
        </button>
        <button className="admin-primary-button" type="button" onClick={() => onPageChange('products')}>
          <Plus size={15} strokeWidth={1.8} aria-hidden="true" />
          Add Menu Item
        </button>
        <button className="admin-primary-button" type="button" onClick={() => onPageChange('orders')}>
          <History size={15} strokeWidth={1.8} aria-hidden="true" />
          View Preparing Orders
        </button>
        <button className="admin-primary-button" type="button" onClick={() => onPageChange('settings')}>
          <Settings2 size={15} strokeWidth={1.8} aria-hidden="true" />
          Open Settings
        </button>
      </div>
      <motion.div className="admin-list-heading" variants={itemVariants}>
        <h1>Recent Orders</h1>
      </motion.div>
      <div className="admin-table-card">
        {recentOrders.map((order) => (
          <button className="admin-table-row admin-recent-row" type="button" onClick={() => onOpenOrder(order)} key={order.id}>
            <span className="admin-mobile-field" data-label="Order">{order.id}</span>
            <span className="admin-mobile-field" data-label="Customer">{order.customer.name}</span>
            <span className="admin-mobile-field" data-label="Phone">{order.customer.phone}</span>
            <span className="admin-mobile-field" data-label="Items">{order.items.map((item) => item.name).join(', ')}</span>
            <strong className="admin-mobile-field" data-label="Total">{formatPrice(calculateOrderTotal(order))}</strong>
            <span className="admin-mobile-field" data-label="Payment">{order.paymentStatus}</span>
            <span className="admin-mobile-field" data-label="Status">
              <OrderStatus status={order.order_status} />
            </span>
            <span className="admin-mobile-field" data-label="Timing">{order.orderType}</span>
            <span className="admin-mobile-field" data-label="Method">{order.deliveryMethod}</span>
            <span className="admin-mobile-field" data-label="Date">{formatOrderDate(order)}</span>
            <span className="admin-mobile-row-action">View Details</span>
          </button>
        ))}
      </div>
    </>
  );
}
