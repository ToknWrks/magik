// app/(default)/checkout/checkout-client.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/cart-context';
import { Boundary } from '@/components/ui/boundary';
import Link from 'next/link';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { loadStripe } from '@stripe/stripe-js';
import { 
  Elements, 
  CardNumberElement, 
  CardExpiryElement, 
  CardCvcElement, 
  useStripe, 
  useElements 
} from '@stripe/react-stripe-js';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

interface User {
  id: number;
  email: string;
  username: string;
  role: string;
}

// Card input styling
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1f2937',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      fontSmoothing: 'antialiased',
      '::placeholder': {
        color: '#9ca3af',
      },
      backgroundColor: 'transparent',
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
};

// Credit Card Form Component
function CardPaymentForm({ 
  total, 
  onSuccess, 
  formData, 
  items, 
  createAccount, 
  password,
  onCancel 
}: {
  total: number;
  onSuccess: (orderId: string) => void;
  formData: any;
  items: any[];
  createAccount: boolean;
  password: string;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [cardComplete, setCardComplete] = useState({
    cardNumber: false,
    cardExpiry: false,
    cardCvc: false,
  });

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    
    // Watch for changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: isDarkMode ? '#f3f4f6' : '#1f2937',
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        fontSmoothing: 'antialiased',
        '::placeholder': {
          color: isDarkMode ? '#6b7280' : '#9ca3af',
        },
      },
      invalid: {
        color: '#ef4444',
        iconColor: '#ef4444',
      },
    },
  };

  const isCardComplete = cardComplete.cardNumber && cardComplete.cardExpiry && cardComplete.cardCvc;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      setError('Payment system not ready. Please try again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create payment intent
      const intentRes = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total }),
      });

      const { clientSecret, error: intentError } = await intentRes.json();

      if (intentError) {
        setError(intentError);
        setLoading(false);
        return;
      }

      // Confirm payment with card
      const cardNumber = elements.getElement(CardNumberElement);
      if (!cardNumber) {
        setError('Card information not found');
        setLoading(false);
        return;
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardNumber,
          billing_details: {
            name: formData.name,
            email: formData.email,
            address: {
              line1: formData.address1,
              line2: formData.address2 || undefined,
              city: formData.city,
              state: formData.state,
              postal_code: formData.zip,
              country: formData.country,
            },
          },
        },
      });

      if (confirmError) {
        setError(confirmError.message || 'Payment failed');
        setLoading(false);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        // Create order
        const orderRes = await fetch('/api/orders/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            items,
            total,
            stripePaymentId: paymentIntent.id,
            createAccount,
            password: createAccount ? password : undefined,
          }),
        });

        const orderData = await orderRes.json();
        if (orderData.success) {
          onSuccess(orderData.orderId);
        } else {
          setError(orderData.error || 'Failed to create order');
        }
      } else {
        setError('Payment was not completed');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <button
        type="button"
        onClick={onCancel}
        className="text-sm text-gray-600 dark:text-gray-400 hover:underline mb-2"
      >
        ← Choose different method
      </button>

      <h4 className="font-semibold text-gray-900 dark:text-gray-100">
        Enter Card Details
      </h4>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Card Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Card Number
        </label>
        <div className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900">
          <CardNumberElement 
            options={cardElementOptions}
            onChange={(e) => setCardComplete(prev => ({ ...prev, cardNumber: e.complete }))}
          />
        </div>
      </div>

      {/* Expiry and CVC */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Expiry Date
          </label>
          <div className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900">
            <CardExpiryElement 
              options={cardElementOptions}
              onChange={(e) => setCardComplete(prev => ({ ...prev, cardExpiry: e.complete }))}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            CVC
          </label>
          <div className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900">
            <CardCvcElement 
              options={cardElementOptions}
              onChange={(e) => setCardComplete(prev => ({ ...prev, cardCvc: e.complete }))}
            />
          </div>
        </div>
      </div>

      {/* Pay Button */}
      <button
        type="submit"
        disabled={!stripe || !isCardComplete || loading}
        className={`w-full py-3 px-6 rounded-lg text-lg font-medium transition-colors ${
          loading || !isCardComplete
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700'
            : 'bg-gray-800 text-white hover:bg-gray-900 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-100'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing...
          </span>
        ) : (
          `Pay $${total.toFixed(2)}`
        )}
      </button>

      {/* Security note */}
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center flex items-center justify-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Secured by Stripe
      </p>
    </form>
  );
}

function PaymentOptions({ formData, items, total, onSuccess, createAccount, password }: { 
  formData: any; 
  items: any[]; 
  total: number; 
  onSuccess: (orderId: string) => void;
  createAccount: boolean;
  password: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'paypal' | 'crypto' | null>(null);

  const handlePayPalApprove = async (data: any, actions: any) => {
    setLoading(true);
    setError('');
    try {
      const details = await actions.order?.capture();

      const orderRes = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items,
          total,
          paypalOrderId: details?.id,
          createAccount,
          password: createAccount ? password : undefined,
        }),
      });

      const orderData = await orderRes.json();
      if (orderData.success) {
        onSuccess(orderData.orderId);
      } else {
        setError(orderData.error || 'Failed to create order');
      }
    } catch (err) {
      console.error('PayPal error:', err);
      setError('Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCryptoPayment = async () => {
    setLoading(true);
    setError('');
    try {
      const orderRes = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items,
          total,
          cryptoType: 'USDC',
          cryptoPayment: true,
          createAccount,
          password: createAccount ? password : undefined,
        }),
      });

      const orderData = await orderRes.json();
      if (orderData.success) {
        onSuccess(orderData.orderId);
      } else {
        setError(orderData.error || 'Failed to create order');
      }
    } catch (err) {
      setError('Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Choose Payment Method
      </h3>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {loading && !selectedMethod && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Processing...</p>
        </div>
      )}

      {/* Payment Method Selection */}
      {!selectedMethod && !loading && (
        <div className="space-y-3">
          {/* Credit Card Button */}
          {stripePromise && (
            <button
              onClick={() => setSelectedMethod('card')}
              className="w-full py-3 px-6 bg-gray-800 hover:bg-gray-900 dark:bg-gray-200 dark:hover:bg-gray-100 text-white dark:text-gray-900 font-semibold rounded-lg flex items-center justify-center gap-3 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Credit / Debit Card
            </button>
          )}

          {/* PayPal Button */}
          {paypalClientId && (
            <button
              onClick={() => setSelectedMethod('paypal')}
              className="w-full py-3 px-6 bg-[#FFC439] hover:bg-[#f0b72e] text-[#003087] font-semibold rounded-lg flex items-center justify-center gap-3 transition-colors"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.773.773 0 0 1 .763-.642h6.923c2.321 0 4.052.52 5.126 1.545 1.073 1.025 1.457 2.476 1.14 4.311-.408 2.357-1.355 4.136-2.814 5.285-1.459 1.15-3.41 1.733-5.797 1.733h-1.56a.773.773 0 0 0-.764.642l-.939 4.743zm9.273-12.378c-.178 1.029-.592 1.8-1.231 2.292-.639.493-1.509.74-2.585.74h-.663l.663-3.394h.663c.877 0 1.551.154 2.01.461.459.307.688.812.688 1.516l-.045.385z"/>
              </svg>
              Pay with PayPal
            </button>
          )}

          {/* Crypto Button */}
          <button
            onClick={() => setSelectedMethod('crypto')}
            className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg flex items-center justify-center gap-3 transition-colors"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            </svg>
            Pay with USDC
          </button>
        </div>
      )}

      {/* Credit Card Form */}
      {selectedMethod === 'card' && stripePromise && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <Elements stripe={stripePromise}>
            <CardPaymentForm
              total={total}
              onSuccess={onSuccess}
              formData={formData}
              items={items}
              createAccount={createAccount}
              password={password}
              onCancel={() => setSelectedMethod(null)}
            />
          </Elements>
        </div>
      )}

      {/* PayPal Checkout */}
      {selectedMethod === 'paypal' && paypalClientId && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <button
            onClick={() => setSelectedMethod(null)}
            className="text-sm text-gray-600 dark:text-gray-400 hover:underline mb-4"
          >
            ← Choose different method
          </button>
          
          <PayPalScriptProvider 
            options={{ 
              clientId: paypalClientId,
              currency: 'USD',
              intent: 'capture',
            }}
          >
            <PayPalButtons
              style={{ layout: 'vertical', shape: 'rect', label: 'paypal', height: 50, color: 'gold' }}
              disabled={loading}
              forceReRender={[total]}
              createOrder={(data, actions) => {
                return actions.order.create({
                  intent: 'CAPTURE',
                  purchase_units: [{ amount: { currency_code: 'USD', value: total.toFixed(2) } }],
                });
              }}
              onApprove={handlePayPalApprove}
              onError={() => setError('PayPal payment failed')}
            />
          </PayPalScriptProvider>
        </div>
      )}

      {/* Crypto Checkout */}
      {selectedMethod === 'crypto' && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <button
            onClick={() => setSelectedMethod(null)}
            className="text-sm text-gray-600 dark:text-gray-400 hover:underline mb-4"
          >
            ← Choose different method
          </button>

          <div className="text-center">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Pay with USDC</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Payment instructions will appear on your order confirmation.
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
              <p className="text-sm">Total: <strong>${total.toFixed(2)} USDC</strong></p>
            </div>
            <button
              onClick={handleCryptoPayment}
              disabled={loading}
              className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Submit Order'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutClient() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const [step, setStep] = useState<'shipping' | 'payment'>('shipping');
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    shippingMethod: 'STANDARD', // Add this
  });

  // Check if user is logged in
  useEffect(() => {
    console.log('Checking user authentication...');
    fetch('/api/auth/me', {
      credentials: 'include', // Important: include cookies
    })
      .then(res => res.json())
      .then(data => {
        console.log('Auth response:', data);
        if (data.user) {
          setUser(data.user);
          setFormData(prev => ({
            ...prev,
            email: data.user.email || prev.email,
            name: data.user.username || prev.name,
          }));
        }
        setUserLoading(false);
      })
      .catch((err) => {
        console.error('Auth check failed:', err);
        setUserLoading(false);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (createAccount && password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    if (createAccount && password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    
    setStep('payment');
  };

  const handlePaymentSuccess = (orderId: string) => {
    clearCart();
    router.push(`/order-confirmation?id=${orderId}`);
  };

  if (userLoading) {
    return (
      <Boundary label="Checkout">
        <div className="text-center py-12">Loading...</div>
      </Boundary>
    );
  }

  if (items.length === 0) {
    return (
      <Boundary label="Checkout">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Your cart is empty.</p>
          <Link 
            href="/store" 
            className="inline-block px-6 py-3 bg-gray-800 text-white rounded hover:bg-gray-900"
          >
            Continue Shopping
          </Link>
        </div>
      </Boundary>
    );
  }

  return (
    <Boundary label="Checkout">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Checkout</h1>

        {/* User Status Banner */}
        {user ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✓ Logged in as <strong>{user.email}</strong>. Your order will be saved to your account.
            </p>
          </div>
        ) : (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Already have an account? <Link href="/signin" className="font-medium underline">Sign in</Link> for faster checkout and order tracking.
            </p>
          </div>
        )}

        {/* Progress Steps */}
        <div className="flex items-center mb-8">
          <div className={`flex items-center ${step === 'shipping' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500'}`}>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
              step === 'shipping' 
                ? 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900' 
                : 'bg-green-500 text-white'
            }`}>
              {step === 'payment' ? '✓' : '1'}
            </span>
            <span>Shipping</span>
          </div>
          <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600 mx-4"></div>
          <div className={`flex items-center ${step === 'payment' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500'}`}>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
              step === 'payment' 
                ? 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900' 
                : 'bg-gray-300 dark:bg-gray-600'
            }`}>
              2
            </span>
            <span>Payment</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Form Section */}
          <div>
            {step === 'shipping' && (
              <form onSubmit={handleShippingSubmit} className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Shipping Information
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={!!user}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${user ? 'opacity-60 cursor-not-allowed' : ''}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="address1"
                    value={formData.address1}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Address 2 (Optional)
                  </label>
                  <input
                    type="text"
                    name="address2"
                    value={formData.address2}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ZIP Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="zip"
                      value={formData.zip}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                      <option value="AU">Australia</option>
                    </select>
                  </div>
                </div>

                {/* Shipping Method - Standard Only */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Shipping Method
                  </label>
                  <div className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="shippingMethod"
                        value="STANDARD"
                        checked={true}
                        readOnly
                        className="form-radio h-4 w-4"
                      />
                      <div className="ml-3">
                        <span className="font-medium text-gray-900 dark:text-gray-100">Standard Shipping</span>
                        <p className="text-sm text-gray-500 dark:text-gray-400">5-10 business days</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Create Account Option (only for guests) */}
                {!user && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createAccount}
                        onChange={(e) => setCreateAccount(e.target.checked)}
                        className="form-checkbox h-5 w-5 text-gray-800 dark:text-gray-200"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Create an account to track your orders
                      </span>
                    </label>

                    {createAccount && (
                      <div className="mt-4 space-y-4 pl-7">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Password <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required={createAccount}
                            minLength={6}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Confirm Password <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required={createAccount}
                            minLength={6}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          />
                          {password && confirmPassword && password !== confirmPassword && (
                            <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 px-6 bg-gray-800 text-white rounded hover:bg-gray-900 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-100 mt-4"
                >
                  Continue to Payment
                </button>
              </form>
            )}

            {step === 'payment' && (
              <div>
                <button
                  onClick={() => setStep('shipping')}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:underline mb-4 flex items-center"
                >
                  ← Back to Shipping
                </button>

                <PaymentOptions
                  formData={formData}
                  items={items}
                  total={total}
                  onSuccess={handlePaymentSuccess}
                  createAccount={createAccount}
                  password={password}
                />
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg h-fit">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Order Summary
            </h2>
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.id} className="flex gap-4">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-16 h-16 object-cover rounded" 
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{item.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.size && `${item.size}`} {item.color && `/ ${item.color}`} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="text-gray-900 dark:text-gray-100">${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                <span className="text-gray-900 dark:text-gray-100">Lower 48 States Only. USA.</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-gray-100 pt-2 border-t border-gray-200 dark:border-gray-700">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Boundary>
  );
}