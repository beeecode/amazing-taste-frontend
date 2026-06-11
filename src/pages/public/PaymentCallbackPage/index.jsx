import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, MessageSquare, RefreshCw, ShoppingBag } from 'lucide-react';
import { Header } from '../../../components/layout/Header';
import { Footer } from '../../../components/layout/Footer';
import { BackToTop } from '../../../components/ui/BackToTop';
import { FigmaBackgroundIllustrations } from '../../../components/common/FigmaBackgroundIllustrations';
import { LogoLoader } from '../../../components/common/LogoLoader';
import { useCart } from '../../../context/CartContext';
import { formatPrice } from '../../../utils/formatPrice';
import { getOrderId, orderService } from '../../../services/orderService';

function getPaystackReference() {
  const params = new URLSearchParams(window.location.search);
  const queryReference = params.get('reference') || params.get('trxref');
  if (queryReference) return queryReference;

  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const lastPathPart = pathParts[pathParts.length - 1];
  return lastPathPart && !['callback', 'payment-callback', 'success'].includes(lastPathPart)
    ? decodeURIComponent(lastPathPart)
    : '';
}

function readPendingOrder() {
  try {
    const stored = sessionStorage.getItem('amazingTastePendingOrder');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function DetailRow({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value || '-'}</strong>
    </div>
  );
}

export default function PaymentCallbackPage({ onNavigateCheckout, onNavigateHome, onNavigateMenu }) {
  const { clearCart } = useCart();
  const reference = useMemo(getPaystackReference, []);
  const pendingOrder = useMemo(readPendingOrder, []);
  const verificationStarted = useRef(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [status, setStatus] = useState('verifying');
  const [error, setError] = useState('');
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (verificationStarted.current) return;
    verificationStarted.current = true;

    if (!reference) {
      setStatus('failed');
      setError('Payment reference is missing. Please retry checkout.');
      return;
    }

    async function verifyPayment() {
      try {
        // Payment flow: the frontend sends only the reference to the backend verifier.
        const result = await orderService.verifyPaystackPayment(reference);
        setPaymentResult(result);

        if (!result.success) {
          setStatus('failed');
          setError(result.message || 'Payment was not successful. Please retry payment.');
          return;
        }

        sessionStorage.setItem(
          'amazingTasteLastOrder',
          JSON.stringify({
            ...(pendingOrder || {}),
            ...(result.order || {}),
            order_id: result.order_id,
            orderNumber: result.order_id || getOrderId(result.order) || pendingOrder?.orderNumber,
            paymentReference: result.reference,
            paymentStatus: result.payment_status,
            total: result.amount_paid ?? pendingOrder?.total,
            whatsapp_url: result.whatsapp_url,
          }),
        );
        sessionStorage.removeItem('amazingTastePendingOrder');
        sessionStorage.removeItem('amazingTastePendingCart');
        clearCart();
        setStatus('success');
      } catch (err) {
        setStatus('failed');
        setError(err.message || 'Unable to verify payment. Please try again.');
      }
    }

    verifyPayment();
  }, [clearCart, pendingOrder, reference]);

  const retryOrderId = paymentResult?.order_id || getOrderId(paymentResult?.order) || getOrderId(pendingOrder);

  const retryPayment = async () => {
    if (!retryOrderId) {
      onNavigateCheckout?.();
      return;
    }

    setIsRetrying(true);
    setError('');
    try {
      const paymentSession = await orderService.initializePaystack(retryOrderId);
      window.location.assign(paymentSession.authorization_url);
    } catch (err) {
      setError(err.message || 'Payment could not restart. Please return to checkout and try again.');
      setIsRetrying(false);
    }
  };

  const paidAmount = paymentResult?.amount_paid ?? pendingOrder?.total;
  const orderId = paymentResult?.order_id || getOrderId(paymentResult?.order) || getOrderId(pendingOrder);

  return (
    <>
      <Header
        orderHref="/menu"
        onHomeClick={onNavigateHome}
        onMenuClick={onNavigateMenu}
        onOrderClick={onNavigateMenu}
      />
      <main id="landing-page-root" className="checkout-page">
        <FigmaBackgroundIllustrations />
        <section id="payment-callback" className="checkout-shell payment-callback-shell">
          <article className={`order-success-modal payment-callback-card is-${status}`}>
            {status === 'verifying' ? (
              <div className="payment-callback-loading">
                <LogoLoader text="Verifying payment..." />
                <p>Please wait while we confirm your transaction securely.</p>
              </div>
            ) : status === 'success' ? (
              <>
                <span className="payment-callback-icon is-success">
                  <CheckCircle2 size={30} aria-hidden="true" />
                </span>
                <h2>Payment successful</h2>
                <p>Your order has been confirmed. Amazing Taste Delicacies will begin processing it shortly.</p>

                <div className="payment-summary-grid">
                  <DetailRow label="Order ID" value={orderId} />
                  <DetailRow label="Payment Reference" value={paymentResult?.reference || reference} />
                  <DetailRow label="Amount Paid" value={formatPrice(paidAmount, paymentResult?.currency)} />
                  <DetailRow label="Payment Status" value={paymentResult?.payment_status || 'paid'} />
                </div>

                <div className="success-actions payment-callback-actions">
                  {paymentResult?.whatsapp_url ? (
                    <a
                      className="place-order-button payment-whatsapp-action"
                      href={paymentResult.whatsapp_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageSquare size={18} aria-hidden="true" />
                      Send Order to WhatsApp
                    </a>
                  ) : null}
                  <button type="button" className="place-order-button" onClick={onNavigateMenu}>
                    <ShoppingBag size={18} aria-hidden="true" />
                    Back to Menu
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="payment-callback-icon is-failed">
                  <AlertCircle size={30} aria-hidden="true" />
                </span>
                <h2>Payment could not be verified</h2>
                <p>{error || 'Payment verification failed. Please retry payment or return to checkout.'}</p>

                <div className="payment-summary-grid">
                  <DetailRow label="Payment Reference" value={reference} />
                  <DetailRow label="Order ID" value={orderId} />
                  <DetailRow label="Payment Status" value={paymentResult?.payment_status || 'failed'} />
                </div>

                <div className="success-actions payment-callback-actions">
                  <button
                    type="button"
                    className="place-order-button"
                    onClick={retryPayment}
                    disabled={isRetrying}
                  >
                    {isRetrying ? (
                      <LogoLoader compact text="Restarting payment..." />
                    ) : (
                      <>
                        <RefreshCw size={18} aria-hidden="true" />
                        Retry Payment
                      </>
                    )}
                  </button>
                  <button type="button" className="checkout-secondary-action" onClick={onNavigateCheckout}>
                    Return to Checkout
                  </button>
                </div>
              </>
            )}
          </article>
        </section>
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
