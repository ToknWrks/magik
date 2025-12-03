// app/(default)/store/my/orders/my-orders-client.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Boundary } from '@/components/ui/boundary'

interface OrderItem {
  name: string
  size?: string
  color?: string
  quantity: number
  price: number
  image: string
}

interface Order {
  id: number
  total: number
  status: string
  created_at: string
  items: OrderItem[]
  shipping_name: string
  shipping_address1: string
  shipping_address2?: string
  shipping_city: string
  shipping_state: string
  shipping_zip: string
  shipping_country: string
  printful_order_id?: string
}

export default function MyOrdersClient() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders/my-orders', {
        credentials: 'include',
      })
      
      // Handle unauthorized
      if (res.status === 401) {
        router.push('/signin')
        return
      }
      
      const data = await res.json()

      if (data.error) {
        setError(data.error)
      } else {
        setOrders(data.orders || [])
      }
      setLoading(false)
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError('Failed to fetch orders')
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-400'
      case 'awaiting_payment':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-800/30 dark:text-orange-400'
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-400'
      case 'shipped':
        return 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400'
      case 'delivered':
        return 'bg-green-200 text-green-900 dark:bg-green-700/30 dark:text-green-300'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
    }
  }

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading) {
    return (
      <Boundary label="My Orders">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Loading orders...</p>
        </div>
      </Boundary>
    )
  }

  if (error) {
    return (
      <Boundary label="My Orders">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <Link
            href="/store"
            className="inline-block px-6 py-3 bg-gray-800 text-white rounded hover:bg-gray-900"
          >
            Continue Shopping
          </Link>
        </div>
      </Boundary>
    )
  }

  if (orders.length === 0) {
    return (
      <Boundary label="My Orders">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">No Orders Yet</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You haven't placed any orders. Start shopping to see your orders here!
          </p>
          <Link
            href="/store"
            className="inline-block px-6 py-3 bg-gray-800 text-white rounded hover:bg-gray-900 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-100"
          >
            Browse Store
          </Link>
        </div>
      </Boundary>
    )
  }

  return (
    <Boundary label="My Orders">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Orders</h1>
          <Link
            href="/store"
            className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
          >
            Continue Shopping →
          </Link>
        </div>

        <div className="space-y-4">
          {orders.map(order => (
            <div
              key={order.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden"
            >
              {/* Order Header */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        Order #{order.id}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      ${parseFloat(order.total.toString()).toFixed(2)}
                    </p>
                    <span className="text-gray-400 transition-transform duration-200" style={{
                      transform: expandedOrderId === order.id ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="flex gap-2 mt-3 overflow-x-auto">
                  {order.items.slice(0, 4).map((item, index) => (
                    <img
                      key={index}
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ))}
                  {order.items.length > 4 && (
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center text-sm text-gray-600 dark:text-gray-400">
                      +{order.items.length - 4}
                    </div>
                  )}
                </div>
              </div>

              {/* Expanded Order Details */}
              {expandedOrderId === order.id && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/50">
                  {/* Order Items */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Items</h4>
                    <div className="space-y-3">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-lg p-3">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-gray-100">{item.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {item.size && `Size: ${item.size}`}
                              {item.size && item.color && ' | '}
                              {item.color && `Color: ${item.color}`}
                              {' | '}Qty: {item.quantity}
                            </p>
                          </div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Shipping Address</h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p>{order.shipping_name}</p>
                      <p>{order.shipping_address1}</p>
                      {order.shipping_address2 && <p>{order.shipping_address2}</p>}
                      <p>{order.shipping_city}, {order.shipping_state} {order.shipping_zip}</p>
                      <p>{order.shipping_country}</p>
                    </div>
                  </div>

                  {/* USDC Payment Instructions */}
                  {order.status === 'awaiting_payment' && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                      <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Payment Instructions for Ethereum L1, Base, Arbitrum, Polygon, Avalanche.</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                        Please send exactly <strong>${parseFloat(order.total.toString()).toFixed(2)} USDC</strong> to the following address :
                      </p>
                      <div className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded p-3 font-mono text-sm break-all mb-2">
                      0x9D82E8552eca216c058b658Be1B090cEAEc36b48
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('0x9D82E8552eca216c058b658Be1B090cEAEc36b48')
                          alert('Address copied!')
                        }}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Copy Address
                      </button>
                      <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Payment Instructions for Noble USDC.</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                        Please send exactly <strong>${parseFloat(order.total.toString()).toFixed(2)} USDC</strong> to the following address :
                      </p>
                      <div className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded p-3 font-mono text-sm break-all mb-2">
                      noble1g40hu4wfcdlgh7ehj399lfycuwmmxqkpqky5th
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('noble1g40hu4wfcdlgh7ehj399lfycuwmmxqkpqky5th')
                          alert('Address copied!')
                        }}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Copy Address
                      </button>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-3">
                        Your order will be processed once payment is confirmed (usually 10-30 minutes).
                      </p>
                    </div>
                  )}

                  {/* Order Summary */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                      <span className="text-gray-900 dark:text-gray-100">${parseFloat(order.total.toString()).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                      <span className="text-gray-900 dark:text-gray-100">Included</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
                      <span className="text-gray-900 dark:text-gray-100">Total</span>
                      <span className="text-gray-900 dark:text-gray-100">${parseFloat(order.total.toString()).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Tracking Info */}
                  {order.printful_order_id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Fulfillment ID: {order.printful_order_id}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Boundary>
  )
}