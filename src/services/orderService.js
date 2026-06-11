import {
  getMockOrders,
  markMockOrderFailed,
  markMockOrderPaid,
  updateMockOrderStatus,
} from './mockOrderStore';
import { apiRequest } from './apiClient';
import { isValidEmail, isValidPhone } from '../utils/validation';

function getResponseData(response) {
  return response?.data?.data || response?.data || response;
}

export function getOrderId(order) {
  return (
    order?.order_id ||
    order?.orderId ||
    order?.id ||
    order?.orderNumber ||
    order?.order?.id ||
    order?.order?.order_id ||
    order?.data?.order_id ||
    order?.data?.id ||
    order?.metadata?.order_id ||
    order?.metadata?.orderId ||
    order?.metadata?.order?.id
  );
}

function normalizeCreatedOrder(response) {
  const data = getResponseData(response);
  return data?.order || data;
}

function normalizePaystackInitialization(response) {
  const data = getResponseData(response);
  const authorizationUrl =
    data?.authorization_url ||
    data?.authorizationUrl ||
    data?.payment_url ||
    data?.paymentUrl;

  return {
    ...data,
    authorization_url: authorizationUrl,
    access_code: data?.access_code || data?.accessCode,
    reference: data?.reference,
  };
}

function normalizeAmount(amount, { isKobo = false } = {}) {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) return null;
  return isKobo ? numericAmount / 100 : numericAmount;
}

function normalizePaymentVerification(response, fallbackReference) {
  const data = getResponseData(response);
  const order = data?.order || response?.order || {};
  const payment = data?.payment || data?.transaction || data;
  const explicitAmount =
    payment?.amount_paid ??
    payment?.amountPaid ??
    payment?.paid_amount ??
    payment?.paidAmount ??
    data?.amount_paid ??
    data?.amountPaid ??
    data?.paid_amount ??
    data?.paidAmount;
  const paystackAmount = payment?.amount ?? data?.amount;
  const rawStatus = String(
    payment?.payment_status ||
      payment?.paymentStatus ||
      payment?.status ||
      data?.payment_status ||
      data?.status ||
      '',
  ).toLowerCase();
  const successfulStatuses = ['success', 'paid', 'successful'];
  const failedStatuses = ['failed', 'failure', 'abandoned', 'cancelled', 'canceled'];
  const hasSuccessfulStatus = successfulStatuses.includes(rawStatus);
  const hasFailedStatus = failedStatuses.includes(rawStatus);
  const isSuccessful =
    hasSuccessfulStatus ||
    (!hasFailedStatus && !rawStatus && (response?.success === true || response?.status === true));
  const rawAmount = explicitAmount ?? paystackAmount ?? order?.total;

  return {
    ...data,
    success: isSuccessful,
    order,
    order_id: getOrderId(data) || getOrderId(order),
    reference: payment?.reference || data?.reference || fallbackReference,
    amount_paid: normalizeAmount(rawAmount, { isKobo: explicitAmount == null && paystackAmount != null }),
    currency: payment?.currency || data?.currency || order?.currency || 'NGN',
    payment_status: isSuccessful ? 'paid' : rawStatus || 'failed',
    whatsapp_url: data?.whatsapp_url || data?.whatsappUrl || order?.whatsapp_url,
    message: data?.message || response?.message,
    raw: response,
  };
}

/**
 * Service to manage customer order placement.
 * Customer checkout uses backend API endpoints only; mock helpers remain for local admin seed data.
 */
export const orderService = {
  async listAdminOrders() {
    return getMockOrders();
  },

  async updateStatus(orderId, status) {
    return updateMockOrderStatus(orderId, status);
  },

  /**
   * Create a pending order before payment.
   * @param {Object} orderDetails - Customer information, items, delivery, payment
   * @returns {Promise<Object>} The pending order info
   */
  async placeOrder(orderDetails) {
    if (
      !String(orderDetails.fullName || '').trim() ||
      !isValidPhone(orderDetails.phoneNumber) ||
      !isValidEmail(orderDetails.emailAddress) ||
      !orderDetails.branch ||
      !Array.isArray(orderDetails.items) ||
      orderDetails.items.length === 0
    ) {
      throw new Error('Required fields are missing or the cart is empty.');
    }

    if (orderDetails.delivery_method === 'delivery' && !String(orderDetails.delivery_address || '').trim()) {
      throw new Error('Delivery address is required.');
    }

    const response = await apiRequest('/api/orders', {
      method: 'POST',
      body: orderDetails,
    });

    return normalizeCreatedOrder(response);
  },

  async initializePaystack(orderId) {
    if (!orderId) {
      throw new Error('Order was created, but the payment session could not start.');
    }

    const response = await apiRequest('/api/paystack/initialize', {
      method: 'POST',
      body: { order_id: orderId },
    });
    const initialization = normalizePaystackInitialization(response);

    if (!initialization.authorization_url) {
      throw new Error('Payment could not start because Paystack did not return a checkout link.');
    }

    return initialization;
  },

  async verifyPaystackPayment(reference) {
    if (!reference) {
      throw new Error('Payment reference is missing. Please retry checkout.');
    }

    const response = await apiRequest(`/api/paystack/verify/${encodeURIComponent(reference)}`);
    return normalizePaymentVerification(response, reference);
  },

  async confirmMockPayment(orderId) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(markMockOrderPaid(orderId)), 500);
    });
  },

  async failMockPayment(orderId) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(markMockOrderFailed(orderId)), 350);
    });
  },
};
