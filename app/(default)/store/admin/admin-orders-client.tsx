// app/(default)/admin/orders/admin-orders-client.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Boundary } from '@/components/ui/boundary';

interface Order {
  id: number;
  user_id: string | null;
  user_email: string;
  shipping_name: string;
  shipping_address1: string;
  shipping_address2: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  shipping_country: string;
  total: number;
  status: string;
  printful_order_id: string | null;
  printful_status: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  carrier: string | null;
  stripe_payment_id: string | null;
  paypal_order_id: string | null;
  created_at: string;
  items: any[];
  notes: string | null;
}

export default function AdminOrdersClient() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<{ orderId: number; message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders', {
        credentials: 'include',
      });
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
        if (data.error === 'Unauthorized' || data.error === 'Admin access required') {
          router.push('/signin');
        }
      } else {
        setOrders(data.orders || []);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to fetch orders');
      setLoading(false);
    }
  };

  const showMessage = (orderId: number, message: string, type: 'success' | 'error') => {
    setActionMessage({ orderId, message, type });
    setTimeout(() => setActionMessage(null), 5000);
  };

  // Mark payment as received (for crypto payments)
  const handleMarkPaymentReceived = async (orderId: number) => {
    setProcessingId(orderId);
    try {
      const res = await fetch('/api/admin/orders/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: 'submitted', action: 'payment_received' }),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        showMessage(orderId, 'Payment marked as received', 'success');
        fetchOrders();
      } else {
        showMessage(orderId, data.error || 'Failed to update', 'error');
      }
    } catch (err) {
      showMessage(orderId, 'Failed to update status', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // Send order to Printful
  const handleSendToPrintful = async (orderId: number) => {
    setProcessingId(orderId);
    try {
      const res = await fetch('/api/admin/orders/process', {  // Updated path
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        showMessage(orderId, `Sent to Printful! Order ID: ${data.printfulOrderId}`, 'success');
        fetchOrders();
      } else {
        showMessage(orderId, data.error || 'Failed to send to Printful', 'error');
      }
    } catch (err) {
      showMessage(orderId, 'Failed to send to Printful', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // Sync status with Printful
  const handleSyncPrintful = async (orderId: number, printfulOrderId: string) => {
    setProcessingId(orderId);
    try {
      const res = await fetch('/api/admin/orders/sync-printful', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, printfulOrderId }),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        showMessage(orderId, 'Synced with Printful', 'success');
        fetchOrders();
      } else {
        showMessage(orderId, data.error || 'Failed to sync', 'error');
      }
    } catch (err) {
      showMessage(orderId, 'Failed to sync with Printful', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // Update order status
  const handleUpdateStatus = async (orderId: number, status: string) => {
    setProcessingId(orderId);
    try {
      const res = await fetch('/api/admin/orders/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        showMessage(orderId, `Status updated to ${status}`, 'success');
        fetchOrders();
      } else {
        showMessage(orderId, data.error || 'Failed to update status', 'error');
      }
    } catch (err) {
      showMessage(orderId, 'Failed to update status', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // Add tracking info manually
  const handleAddTracking = async (orderId: number) => {
    const trackingNumber = prompt('Enter tracking number:');
    if (!trackingNumber) return;

    const carrier = prompt('Enter carrier (e.g., USPS, UPS, FedEx):');
    if (!carrier) return;

    setProcessingId(orderId);
    try {
      const res = await fetch('/api/admin/orders/add-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, trackingNumber, carrier }),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        showMessage(orderId, 'Tracking info added', 'success');
        fetchOrders();
      } else {
        showMessage(orderId, data.error || 'Failed to add tracking', 'error');
      }
    } catch (err) {
      showMessage(orderId, 'Failed to add tracking', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // Add note to order
  const handleAddNote = async (orderId: number) => {
    const note = prompt('Enter note:');
    if (!note) return;

    try {
      const res = await fetch('/api/admin/orders/add-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, note }),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        showMessage(orderId, 'Note added', 'success');
        fetchOrders();
      } else {
        showMessage(orderId, data.error || 'Failed to add note', 'error');
      }
    } catch (err) {
      showMessage(orderId, 'Failed to add note', 'error');
    }
  };

  // Refund order
  const handleRefund = async (orderId: number) => {
    if (!confirm('Are you sure you want to refund this order? This action cannot be undone.')) return;

    setProcessingId(orderId);
    try {
      const res = await fetch('/api/admin/orders/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        showMessage(orderId, 'Order refunded', 'success');
        fetchOrders();
      } else {
        showMessage(orderId, data.error || 'Failed to refund', 'error');
      }
    } catch (err) {
      showMessage(orderId, 'Failed to refund', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200';
      case 'awaiting_payment':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200';
      case 'shipped':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200';
      case 'delivered':
        return 'bg-green-200 text-green-900 dark:bg-green-700 dark:text-green-100';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200';
      case 'refunded':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getPaymentMethod = (order: Order) => {
    if (order.paypal_order_id) return { method: 'PayPal', id: order.paypal_order_id };
    if (order.stripe_payment_id) return { method: 'Card', id: order.stripe_payment_id };
    if (order.status === 'awaiting_payment') return { method: 'USDC', id: 'Pending' };
    return { method: 'Unknown', id: null };
  };

  if (loading) {
    return (
      <Boundary label="Admin Orders">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Loading orders...</p>
        </div>
      </Boundary>
    );
  }

  if (error) {
    return (
      <Boundary label="Admin Orders">
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
        </div>
      </Boundary>
    );
  }

  return (
    <Boundary label="Admin Orders">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Orders</h1>
          
          {/* Status Filter */}
          <div className="flex gap-2 flex-wrap">
            {['all', 'awaiting_payment', 'submitted', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        {/* Order Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{orders.length}</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
            <p className="text-sm text-orange-600 dark:text-orange-400">Awaiting Pay</p>
            <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">
              {orders.filter(o => o.status === 'awaiting_payment').length}
            </p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">Submitted</p>
            <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">
              {orders.filter(o => o.status === 'submitted').length}
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <p className="text-sm text-blue-600 dark:text-blue-400">Processing</p>
            <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
              {orders.filter(o => o.status === 'processing').length}
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <p className="text-sm text-green-600 dark:text-green-400">Shipped</p>
            <p className="text-2xl font-bold text-green-800 dark:text-green-200">
              {orders.filter(o => o.status === 'shipped').length}
            </p>
          </div>
          <div className="bg-green-100 dark:bg-green-800/20 rounded-lg p-4">
            <p className="text-sm text-green-700 dark:text-green-300">Delivered</p>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
              {orders.filter(o => o.status === 'delivered').length}
            </p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <p className="text-sm text-red-600 dark:text-red-400">Cancelled</p>
            <p className="text-2xl font-bold text-red-800 dark:text-red-200">
              {orders.filter(o => o.status === 'cancelled' || o.status === 'refunded').length}
            </p>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-600 dark:text-gray-400">
            No orders found.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => {
              const payment = getPaymentMethod(order);
              return (
                <div
                  key={order.id}
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden"
                >
                  {/* Action Message */}
                  {actionMessage?.orderId === order.id && (
                    <div className={`px-4 py-2 text-sm ${
                      actionMessage.type === 'success' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200' 
                        : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200'
                    }`}>
                      {actionMessage.message}
                    </div>
                  )}

                  {/* Order Header */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                    onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          Order #{order.id}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                          {payment.method}
                        </span>
                        {order.printful_order_id && (
                          <span className="text-xs text-blue-600 dark:text-blue-400">
                            PF: {order.printful_order_id}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          ${parseFloat(order.total.toString()).toFixed(2)}
                        </p>
                        <span className="text-gray-400">
                          {expandedOrderId === order.id ? '▲' : '▼'}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {new Date(order.created_at).toLocaleString()} • {order.user_email} • {order.shipping_name}
                    </p>
                  </div>

                  {/* Expanded Order Details */}
                  {expandedOrderId === order.id && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                      {/* Customer & Shipping Info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Customer</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{order.shipping_name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{order.user_email}</p>
                          {order.user_id && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">User ID: {order.user_id}</p>
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Shipping Address</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{order.shipping_address1}</p>
                          {order.shipping_address2 && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{order.shipping_address2}</p>
                          )}
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {order.shipping_city}, {order.shipping_state} {order.shipping_zip}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{order.shipping_country}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Payment</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Method: {payment.method}</p>
                          {payment.id && payment.id !== 'Pending' && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 break-all">ID: {payment.id}</p>
                          )}
                        </div>
                      </div>

                      {/* Tracking Info */}
                      {(order.tracking_number || order.carrier) && (
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-6">
                          <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Tracking Information</h4>
                          <p className="text-sm text-green-700 dark:text-green-300">
                            Carrier: {order.carrier || 'N/A'}
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-300">
                            Tracking #: {order.tracking_number || 'N/A'}
                          </p>
                          {order.tracking_url && (
                            <a 
                              href={order.tracking_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-green-600 dark:text-green-400 underline"
                            >
                              Track Package →
                            </a>
                          )}
                        </div>
                      )}

                      {/* Order Items */}
                      <div className="mb-6">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Items</h4>
                        <div className="space-y-2">
                          {order.items.map((item: any, index: number) => (
                            <div key={index} className="flex items-center gap-4 bg-white dark:bg-gray-900 rounded p-3">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {item.size && `Size: ${item.size}`} {item.color && `| Color: ${item.color}`} | Qty: {item.quantity}
                                </p>
                                <p className="text-xs text-gray-500">Variant ID: {item.variantId}</p>
                              </div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                ${(item.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Notes */}
                      {order.notes && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mb-6">
                          <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Notes</h4>
                          <p className="text-sm text-yellow-700 dark:text-yellow-300">{order.notes}</p>
                        </div>
                      )}

                      {/* Printful Status */}
                      {order.printful_order_id && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Printful Status</h4>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            Order ID: {order.printful_order_id}
                          </p>
                          {order.printful_status && (
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              Status: {order.printful_status}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                        {/* Awaiting Payment Actions */}
                        {order.status === 'awaiting_payment' && (
                          <button
                            onClick={() => handleMarkPaymentReceived(order.id)}
                            disabled={processingId === order.id}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm"
                          >
                            {processingId === order.id ? 'Processing...' : '✓ Mark Payment Received'}
                          </button>
                        )}

                        {/* Submitted Actions */}
                        {order.status === 'submitted' && (
                          <button
                            onClick={() => handleSendToPrintful(order.id)}
                            disabled={processingId === order.id}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                          >
                            {processingId === order.id ? 'Sending...' : '🖨️ Send to Printful'}
                          </button>
                        )}

                        {/* Processing Actions */}
                        {order.status === 'processing' && order.printful_order_id && (
                          <>
                            <button
                              onClick={() => handleSyncPrintful(order.id, order.printful_order_id!)}
                              disabled={processingId === order.id}
                              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                            >
                              {processingId === order.id ? 'Syncing...' : '🔄 Sync Printful'}
                            </button>
                            <button
                              onClick={() => handleAddTracking(order.id)}
                              disabled={processingId === order.id}
                              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm"
                            >
                              📦 Add Tracking
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'shipped')}
                              disabled={processingId === order.id}
                              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm"
                            >
                              🚚 Mark Shipped
                            </button>
                          </>
                        )}

                        {/* Shipped Actions */}
                        {order.status === 'shipped' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'delivered')}
                            disabled={processingId === order.id}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm"
                          >
                            ✅ Mark Delivered
                          </button>
                        )}

                        {/* Common Actions */}
                        <button
                          onClick={() => handleAddNote(order.id)}
                          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                        >
                          📝 Add Note
                        </button>

                        {/* Cancel/Refund - only for non-completed orders */}
                        {!['cancelled', 'refunded', 'delivered'].includes(order.status) && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                              disabled={processingId === order.id}
                              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm"
                            >
                              ❌ Cancel
                            </button>
                            {(order.paypal_order_id || order.stripe_payment_id) && (
                              <button
                                onClick={() => handleRefund(order.id)}
                                disabled={processingId === order.id}
                                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 text-sm"
                              >
                                💰 Refund
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Boundary>
  );
}