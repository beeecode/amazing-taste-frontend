import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, Clock, Minus, Plus, Trash2 } from 'lucide-react';
import { Header } from '../../../components/layout/Header';
import { Footer } from '../../../components/layout/Footer';
import { BackToTop } from '../../../components/ui/BackToTop';
import { FigmaBackgroundIllustrations } from '../../../components/common/FigmaBackgroundIllustrations';
import { LogoLoader } from '../../../components/common/LogoLoader';
import { useCart } from '../../../context/CartContext';
import { getOrderId, orderService } from '../../../services/orderService';
import { getMockSettings } from '../../../services/mockMenuStore';
import { formatPrice } from '../../../utils/formatPrice';
import { calculateOrderSubtotal } from '../../../utils/orderTotals';
import { validateCheckoutFields } from '../../../utils/validation';
import { sectionTransition } from '../../../constants/motion';
import { siteConfig } from '../../../constants/siteConfig';

const deliveryMethods = ['Delivery', 'Pickup'];
const orderTypes = ['Order Now', 'Schedule Order'];
const mealPeriods = ['Breakfast', 'Lunch', 'Dinner'];
const paymentMethods = ['Online Payment'];

const fieldInitialState = {
  fullName: '',
  phoneNumber: '',
  emailAddress: '',
  branch: '',
  deliveryAddress: '',
  orderNote: '',
  orderDate: '',
  orderTime: '',
};

const today = new Date().toISOString().slice(0, 10);

function getCheckoutSettings() {
  const settings = getMockSettings();
  const fallbackBranches = siteConfig.contact.branches.map((branch) => branch.name);
  const branches = String(settings.branches || '')
    .split('\n')
    .map((branch) => branch.split(' - ')[0].trim())
    .filter(Boolean);
  const deliveryFee = Number(settings.deliveryFee) || 1000;

  return {
    branches: branches.length > 0 ? branches : fallbackBranches,
    deliveryFee,
  };
}

function getRecommendedTime(mealPeriod) {
  if (mealPeriod === 'Breakfast') return '08:00';
  if (mealPeriod === 'Lunch') return '13:00';
  if (mealPeriod === 'Dinner') return '19:00';
  return '';
}

function buildPendingOrderSnapshot(order, details) {
  return {
    ...order,
    order_id: getOrderId(order),
    orderNumber: order.orderNumber || order.id || getOrderId(order),
    customerName: details.fullName,
    customer: {
      ...(order.customer || {}),
      name: details.fullName,
      phone: details.phoneNumber,
      email: details.emailAddress,
      address: details.delivery_address,
    },
    deliveryMethod: details.delivery_method === 'delivery' ? 'Delivery' : 'Pickup',
    paymentMethod: details.paymentMethod,
    orderType: details.orderType,
    mealPeriod: details.mealPeriod,
    orderDate: details.orderDate,
    orderTime: details.orderTime,
    subtotal: details.subtotal,
    deliveryFee: details.deliveryFee,
    total: details.total,
    items: details.items,
  };
}

export default function CheckoutPage({ onNavigateHome, onNavigateMenu }) {
  const { cartItems, removeFromCart, updateCartQuantity } = useCart();
  const checkoutSettings = useMemo(getCheckoutSettings, []);
  const [fields, setFields] = useState(() => ({
    ...fieldInitialState,
    branch: checkoutSettings.branches[0] ?? '',
  }));
  const [deliveryMethod, setDeliveryMethod] = useState('Delivery');
  const [orderType, setOrderType] = useState('Order Now');
  const [mealPeriod, setMealPeriod] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Online Payment');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = useMemo(
    () => calculateOrderSubtotal(cartItems),
    [cartItems],
  );
  const activeDeliveryFee = deliveryMethod === 'Delivery' && cartItems.length > 0 ? checkoutSettings.deliveryFee : 0;
  const grandTotal = subtotal + activeDeliveryFee;

  const updateField = (field, value) => {
    setFields((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: null, form: null }));
  };

  const selectDeliveryMethod = (method) => {
    setDeliveryMethod(method);
    setErrors((current) => ({ ...current, deliveryMethod: null, deliveryAddress: null, form: null }));
  };

  const selectMealPeriod = (period) => {
    setMealPeriod(period);
    setFields((current) => ({
      ...current,
      orderTime: current.orderTime || getRecommendedTime(period),
    }));
    setErrors((current) => ({ ...current, mealPeriod: null, form: null }));
  };

  const validateCheckout = () => {
    const nextErrors = validateCheckoutFields({
      fields,
      deliveryMethod,
      paymentMethod,
      orderType,
      mealPeriod,
      cartItems,
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const placeOrder = async (event) => {
    event.preventDefault();

    if (!validateCheckout()) return;

    setIsSubmitting(true);
    try {
      const deliveryPayload = {
        delivery_method: deliveryMethod === 'Delivery' ? 'delivery' : 'pickup',
        delivery_address: deliveryMethod === 'Delivery' ? fields.deliveryAddress.trim() : null,
      };
      const orderDetails = {
        fullName: fields.fullName.trim(),
        phoneNumber: fields.phoneNumber.trim(),
        emailAddress: fields.emailAddress.trim(),
        branch: fields.branch.trim(),
        ...deliveryPayload,
        orderNote: fields.orderNote.trim(),
        orderType,
        mealPeriod,
        orderDate: fields.orderDate,
        orderTime: fields.orderTime,
        paymentMethod,
        items: cartItems,
        subtotal,
        deliveryFee: activeDeliveryFee,
        total: grandTotal,
      };

      // Payment flow: create the backend order first, then initialize Paystack through the backend.
      const receipt = await orderService.placeOrder(orderDetails);
      const orderId = getOrderId(receipt);
      const pendingSnapshot = buildPendingOrderSnapshot(receipt, orderDetails);

      sessionStorage.setItem('amazingTastePendingOrder', JSON.stringify(pendingSnapshot));
      sessionStorage.setItem('amazingTastePendingCart', JSON.stringify(cartItems));

      const paymentSession = await orderService.initializePaystack(orderId);
      window.location.assign(paymentSession.authorization_url);
    } catch (err) {
      setErrors((current) => ({
        ...current,
        form: err.message || 'Payment could not start. Please try again.',
      }));
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header orderHref="/checkout" onHomeClick={onNavigateHome} onMenuClick={onNavigateMenu} />
      <main id="landing-page-root" className="checkout-page">
        <FigmaBackgroundIllustrations />
        <section id="checkout" className="checkout-shell">
          <motion.form
            className="checkout-layout"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={sectionTransition}
            onSubmit={placeOrder}
          >
            <div className="checkout-form-card">
              <CheckoutSection title="Customer Information">
                <div className="checkout-field-grid">
                  <CheckoutField
                    error={errors.fullName}
                    label="Full Name"
                    placeholder="Enter your full name"
                    value={fields.fullName}
                    onChange={(value) => updateField('fullName', value)}
                    disabled={isSubmitting}
                  />
                  <CheckoutField
                    error={errors.phoneNumber}
                    label="Phone Number"
                    placeholder="Enter your phone number"
                    type="tel"
                    value={fields.phoneNumber}
                    onChange={(value) => updateField('phoneNumber', value)}
                    disabled={isSubmitting}
                  />
                  <CheckoutField
                    error={errors.emailAddress}
                    label="Email Address"
                    placeholder="Enter your email address"
                    type="email"
                    value={fields.emailAddress}
                    onChange={(value) => updateField('emailAddress', value)}
                    disabled={isSubmitting}
                  />
                </div>
              </CheckoutSection>

              <CheckoutSection title="Branch" error={errors.branch}>
                <OptionGrid>
                  {checkoutSettings.branches.map((branch) => (
                    <OptionButton
                      isActive={fields.branch === branch}
                      key={branch}
                      label={branch}
                      onClick={() => updateField('branch', branch)}
                      disabled={isSubmitting}
                    />
                  ))}
                </OptionGrid>
              </CheckoutSection>

              <CheckoutSection title="Delivery Method" error={errors.deliveryMethod}>
                <OptionGrid>
                  {deliveryMethods.map((method) => (
                    <OptionButton
                      isActive={deliveryMethod === method}
                      key={method}
                      label={method}
                      onClick={() => selectDeliveryMethod(method)}
                      disabled={isSubmitting}
                    />
                  ))}
                </OptionGrid>
                <AnimatePresence mode="wait">
                  {deliveryMethod === 'Delivery' ? (
                    <motion.div
                      className="checkout-field-grid"
                      key="delivery-fields"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={sectionTransition}
                    >
                      <CheckoutField
                        error={errors.deliveryAddress}
                        label="Delivery Address"
                        placeholder="Enter your full delivery address"
                        value={fields.deliveryAddress}
                        onChange={(value) => updateField('deliveryAddress', value)}
                        helpText="Please include street, area, and any useful direction."
                        disabled={isSubmitting}
                      />
                    </motion.div>
                  ) : (
                    <motion.p
                      className="checkout-note"
                      key="pickup-note"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={sectionTransition}
                    >
                      You will pick up your order from Amazing Taste Delicacies restaurant.
                    </motion.p>
                  )}
                </AnimatePresence>
                <CheckoutField
                  label="Order Note"
                  placeholder="Optional note for the restaurant"
                  value={fields.orderNote}
                  onChange={(value) => updateField('orderNote', value)}
                  disabled={isSubmitting}
                />
              </CheckoutSection>

              <CheckoutSection title="Order Timing">
                <OptionGrid>
                  {orderTypes.map((type) => (
                    <OptionButton
                      isActive={orderType === type}
                      key={type}
                      label={type}
                      onClick={() => setOrderType(type)}
                      disabled={isSubmitting}
                    />
                  ))}
                </OptionGrid>
                <AnimatePresence>
                  {orderType === 'Schedule Order' ? (
                    <motion.div
                      className="schedule-panel"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={sectionTransition}
                    >
                      <OptionGrid>
                        {mealPeriods.map((period) => (
                          <OptionButton
                            isActive={mealPeriod === period}
                            key={period}
                            label={period}
                            onClick={() => selectMealPeriod(period)}
                            disabled={isSubmitting}
                          />
                        ))}
                      </OptionGrid>
                      {errors.mealPeriod ? <span className="field-error">{errors.mealPeriod}</span> : null}
                      <div className="checkout-field-grid">
                        <CheckoutField
                          error={errors.orderDate}
                          icon={<CalendarDays size={18} />}
                          label="Select Order Date"
                          min={today}
                          type="date"
                          value={fields.orderDate}
                          onChange={(value) => updateField('orderDate', value)}
                          disabled={isSubmitting}
                        />
                        <CheckoutField
                          error={errors.orderTime}
                          icon={<Clock size={18} />}
                          label="Select Order Time"
                          type="time"
                          value={fields.orderTime}
                          onChange={(value) => updateField('orderTime', value)}
                          disabled={isSubmitting}
                        />
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </CheckoutSection>

              <CheckoutSection title="Payment Method" error={errors.paymentMethod}>
                <OptionGrid>
                  {paymentMethods.map((method) => (
                    <OptionButton
                      isActive={paymentMethod === method}
                      key={method}
                      label={method}
                      onClick={() => setPaymentMethod(method)}
                      disabled={isSubmitting}
                    />
                  ))}
                </OptionGrid>
              </CheckoutSection>
            </div>

            <motion.aside
              className="order-summary-card"
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={sectionTransition}
            >
              <h2>Order Summary</h2>
              {cartItems.length > 0 ? (
                <>
                  <div className="summary-items">
                    {cartItems.map((item) => (
                      <article className="summary-item" key={item.id}>
                        <img src={item.image} alt={item.name} loading="lazy" decoding="async" />
                        <div>
                          <h3>{item.name}</h3>
                          <span>{formatPrice(item.price, item.currency)} each</span>
                          <strong>{formatPrice(item.price * item.quantity, item.currency)}</strong>
                          <div className="summary-controls">
                            <button type="button" onClick={() => updateCartQuantity(item.id, item.quantity - 1)} disabled={isSubmitting}>
                              <Minus size={14} />
                            </button>
                            <span>{item.quantity}</span>
                            <button type="button" onClick={() => updateCartQuantity(item.id, item.quantity + 1)} disabled={isSubmitting}>
                              <Plus size={14} />
                            </button>
                            <button type="button" aria-label={`Remove ${item.name}`} onClick={() => removeFromCart(item.id)} disabled={isSubmitting}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                  <SummaryLine label="Subtotal" value={formatPrice(subtotal)} />
                  <SummaryLine label="Delivery fee" value={formatPrice(activeDeliveryFee)} />
                  <SummaryLine isStrong label="Grand total" value={formatPrice(grandTotal)} />
                  <div className="checkout-detail-list">
                    <span>Branch: {fields.branch}</span>
                    <span>Delivery Method: {deliveryMethod}</span>
                    {deliveryMethod === 'Delivery' ? (
                      <span>Delivery Address: {fields.deliveryAddress || 'Not selected'}</span>
                    ) : null}
                    <span>Order Type: {orderType}</span>
                    {orderType === 'Schedule Order' ? (
                      <>
                        <span>Meal Period: {mealPeriod || 'Not selected'}</span>
                        <span>Date: {fields.orderDate || 'Not selected'}</span>
                        <span>Time: {fields.orderTime || 'Not selected'}</span>
                      </>
                    ) : null}
                    <span>Payment Method: {paymentMethod}</span>
                  </div>
                  {errors.form ? <p className="checkout-form-error">{errors.form}</p> : null}
                  <motion.button
                    className="place-order-button"
                    type="submit"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <LogoLoader compact text="Starting secure payment..." /> : 'Continue to Paystack'}
                  </motion.button>
                </>
              ) : (
                <div className="checkout-empty-cart">
                  <p>Your cart is empty. Please go back to the menu and add food items.</p>
                  <button type="button" onClick={onNavigateMenu}>
                    Back to Menu
                  </button>
                </div>
              )}
            </motion.aside>
          </motion.form>
        </section>
      </main>
      <Footer />
      <BackToTop />


    </>
  );
}

function CheckoutSection({ children, error, title }) {
  return (
    <section className="checkout-section-card">
      <h2>{title}</h2>
      {children}
      {error ? <span className="field-error">{error}</span> : null}
    </section>
  );
}

function CheckoutField({ error, helpText, icon, label, onChange, disabled, ...props }) {
  return (
    <label className="checkout-field">
      <span>{label}</span>
      <div>
        {icon}
        <input
          {...props}
          disabled={disabled}
          autoComplete={props.autoComplete || 'on'}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      {error ? <small>{error}</small> : null}
      {helpText ? <small className="checkout-field-help">{helpText}</small> : null}
    </label>
  );
}

function OptionGrid({ children }) {
  return <div className="checkout-option-grid">{children}</div>;
}

function OptionButton({ isActive, label, onClick, disabled }) {
  return (
    <motion.button
      className={isActive ? 'is-active' : ''}
      type="button"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </motion.button>
  );
}

function SummaryLine({ isStrong = false, label, value }) {
  return (
    <div className={`summary-line ${isStrong ? 'is-strong' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
