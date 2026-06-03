import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Check, Eye } from 'lucide-react';
import { formatPrice } from '../../../utils/formatPrice';
import { formatOrderDate } from '../../../utils/orderDates';
import { calculateOrderTotal } from '../../../utils/orderTotals';
import { ORDER_STATUS_OPTIONS, ORDER_STATUSES } from '../../../constants/orderContracts';
import { OrderStatus } from './OrderStatus';

const pageVariants = {
  visible: { opacity: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.04 } },
};

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

function AdminSearch({ value, onChange, placeholder = 'Search' }) {
  return (
    <motion.label className="admin-search" variants={itemVariants}>
      <Search size={25} strokeWidth={1.6} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type="search"
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </motion.label>
  );
}

function StatusChip({ filter, count, active, onClick }) {
  const isRejected = [ORDER_STATUSES.CANCELLED, ORDER_STATUSES.FAILED_PAYMENT].includes(filter.id);
  const isComplete = [ORDER_STATUSES.PAID, ORDER_STATUSES.READY_FOR_PICKUP, ORDER_STATUSES.COMPLETED, 'all'].includes(filter.id);
  const Icon = isRejected ? X : Check;

  return (
    <button
      className={`admin-filter-chip ${active ? 'is-active' : ''} ${
        isRejected ? 'is-rejected' : isComplete ? 'is-completed' : 'is-new'
      }`}
      type="button"
      onClick={onClick}
    >
      <Icon size={18} strokeWidth={1.6} />
      <span>{filter.label}</span>
      <strong>{count}</strong>
    </button>
  );
}

function OrderCard({ order, onOpen }) {
  return (
    <motion.article
      className="admin-order-card"
      variants={itemVariants}
      onClick={() => onOpen(order)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onOpen(order);
      }}
      role="button"
      tabIndex={0}
    >
      <header className="admin-order-card-header">
        <div>
          <h3>Order {order.id}</h3>
          <p>{formatOrderDate(order)}</p>
        </div>
        <img src={order.avatar} alt="" className="admin-order-avatar" loading="lazy" decoding="async" />
      </header>
      <div className="admin-order-items">
        {order.items.slice(0, 2).map((item) => (
          <div className="admin-order-item" key={`${order.id}-${item.name}-${item.price}`}>
            <img src={item.image} alt="" className="admin-order-image" loading="lazy" decoding="async" />
            <div className="admin-order-item-copy">
              <div className="admin-order-item-top">
                <h4>{item.name}</h4>
                <span>Qty: {item.quantity}</span>
              </div>
              <p>{item.description}</p>
              <strong>{formatPrice(item.price)}</strong>
            </div>
          </div>
        ))}
      </div>
      <footer className="admin-order-footer">
        <span>X{order.items.length} Items</span>
        <OrderStatus status={order.order_status} />
      </footer>
      <div className="admin-card-meta">
        <span className="admin-card-meta-field" data-label="Customer">{order.customer.name}</span>
        <span className="admin-card-meta-field" data-label="Phone">{order.customer.phone}</span>
        <span className="admin-card-meta-field" data-label="Total">{formatPrice(calculateOrderTotal(order))}</span>
        <span className="admin-card-meta-field" data-label="Payment">{order.paymentStatus}</span>
      </div>
      <button
        className="admin-card-view"
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onOpen(order);
        }}
      >
        <Eye size={15} strokeWidth={1.8} aria-hidden="true" />
        View Details
      </button>
    </motion.article>
  );
}

export default function OrdersTab({ orders, onOpenOrder }) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [deliveryFilter, setDeliveryFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const counts = useMemo(() => getCounts(orders), [orders]);

  const filteredOrders = orders.filter((order) => {
    const query = search.toLowerCase();
    const matchesSearch = [
      order.id,
      order.customer.name,
      order.customer.phone,
      ...order.items.map((item) => item.name),
    ]
      .join(' ')
      .toLowerCase()
      .includes(query);
    const matchesStatus = activeFilter === 'all' || order.order_status === activeFilter;
    const matchesDelivery = deliveryFilter === 'all' || order.deliveryMethod === deliveryFilter;
    const matchesPayment = paymentFilter === 'all' || order.payment_status === paymentFilter;
    return matchesSearch && matchesStatus && matchesDelivery && matchesPayment;
  });

  return (
    <>
      <AdminSearch value={search} onChange={setSearch} placeholder="Search orders, customers, food, phone..." />
      <motion.div className="admin-list-heading" variants={itemVariants}>
        <h1>Orders</h1>
        <div className="admin-inline-filters">
          <select
            className="admin-compact-select"
            value={deliveryFilter}
            onChange={(event) => setDeliveryFilter(event.target.value)}
          >
            <option value="all">All methods</option>
            <option value="Delivery">Delivery</option>
            <option value="Pickup">Pickup</option>
          </select>
          <select
            className="admin-compact-select"
            value={paymentFilter}
            onChange={(event) => setPaymentFilter(event.target.value)}
          >
            <option value="all">All payment status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </motion.div>
      <motion.div className="admin-filter-row" variants={itemVariants} aria-label="Order filters">
        {ORDER_STATUS_OPTIONS.map((filter) => (
          <StatusChip
            filter={filter}
            count={counts[filter.id] ?? 0}
            active={activeFilter === filter.id}
            onClick={() => setActiveFilter(filter.id)}
            key={filter.id}
          />
        ))}
      </motion.div>
      <motion.div className="admin-order-grid" variants={pageVariants}>
        {filteredOrders.map((order) => (
          <OrderCard order={order} key={order.id} onOpen={onOpenOrder} />
        ))}
      </motion.div>
    </>
  );
}
