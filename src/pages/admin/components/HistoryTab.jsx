import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { formatPrice } from '../../../utils/formatPrice';
import { formatOrderDate, getOrderDateKey, getOrderTimeKey } from '../../../utils/orderDates';
import { calculateOrderTotal } from '../../../utils/orderTotals';
import { HISTORY_ORDER_STATUSES, PAYMENT_STATUSES } from '../../../constants/orderContracts';
import { OrderStatus } from './OrderStatus';

const itemVariants = {
  visible: { opacity: 1, y: 0, transition: { duration: 0.36, ease: [0.22, 1, 0.36, 1] } },
};

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

export default function HistoryTab({ orders, onOpenOrder }) {
  const [filters, setFilters] = useState({
    query: '',
    status: 'all',
    payment: 'all',
    delivery: 'all',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
  });

  const historyOrders = orders.filter((order) => {
    if (!HISTORY_ORDER_STATUSES.includes(order.order_status)) return false;
    const orderDate = getOrderDateKey(order);
    const orderTime = getOrderTimeKey(order);
    const query = filters.query.toLowerCase();
    return (
      [
        order.id,
        order.customer.name,
        order.customer.phone,
        ...order.items.map((item) => item.name),
      ]
        .join(' ')
        .toLowerCase()
        .includes(query) &&
      (filters.status === 'all' || order.order_status === filters.status) &&
      (filters.payment === 'all' || order.payment_status === filters.payment) &&
      (filters.delivery === 'all' || order.deliveryMethod === filters.delivery) &&
      (!filters.startDate || orderDate >= filters.startDate) &&
      (!filters.endDate || orderDate <= filters.endDate) &&
      (!filters.startTime || orderTime >= filters.startTime) &&
      (!filters.endTime || orderTime <= filters.endTime)
    );
  });

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  return (
    <>
      <AdminSearch
        value={filters.query}
        onChange={(value) => updateFilter('query', value)}
        placeholder="Search history by order, customer, phone..."
      />
      <motion.div className="admin-list-heading" variants={itemVariants}>
        <h1>Order History</h1>
      </motion.div>
      <div className="admin-history-filters">
        <input
          type="date"
          value={filters.startDate}
          onChange={(event) => updateFilter('startDate', event.target.value)}
          aria-label="Start Date"
        />
        <input
          type="date"
          value={filters.endDate}
          onChange={(event) => updateFilter('endDate', event.target.value)}
          aria-label="End Date"
        />
        <input
          type="time"
          value={filters.startTime}
          onChange={(event) => updateFilter('startTime', event.target.value)}
          aria-label="Start Time"
        />
        <input
          type="time"
          value={filters.endTime}
          onChange={(event) => updateFilter('endTime', event.target.value)}
          aria-label="End Time"
        />
        <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
          <option value="all">All status</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="failed_payment">Failed Payment</option>
        </select>
        <select value={filters.payment} onChange={(event) => updateFilter('payment', event.target.value)}>
          <option value="all">All payment status</option>
          <option value={PAYMENT_STATUSES.PENDING}>Pending</option>
          <option value={PAYMENT_STATUSES.PAID}>Paid</option>
          <option value={PAYMENT_STATUSES.FAILED}>Failed</option>
        </select>
        <select value={filters.delivery} onChange={(event) => updateFilter('delivery', event.target.value)}>
          <option value="all">All delivery</option>
          <option value="Delivery">Delivery</option>
          <option value="Pickup">Pickup</option>
        </select>
      </div>
      <motion.div className="admin-table-card" variants={itemVariants}>
        {historyOrders.map((order) => (
          <button className="admin-table-row" type="button" onClick={() => onOpenOrder(order)} key={order.id}>
            <span className="admin-mobile-field" data-label="Order">{order.id}</span>
            <span className="admin-mobile-field" data-label="Customer">{order.customer.name}</span>
            <span className="admin-mobile-field" data-label="Phone">{order.customer.phone}</span>
            <span className="admin-mobile-field" data-label="Date">{formatOrderDate(order)}</span>
            <span className="admin-mobile-field" data-label="Items">{order.items.map((item) => item.name).join(', ')}</span>
            <strong className="admin-mobile-field" data-label="Total">{formatPrice(calculateOrderTotal(order))}</strong>
            <span className="admin-mobile-field" data-label="Payment">{order.paymentStatus}</span>
            <span className="admin-mobile-field" data-label="Status">
              <OrderStatus status={order.order_status} />
            </span>
            <span className="admin-mobile-row-action">View Details</span>
          </button>
        ))}
      </motion.div>
    </>
  );
}
