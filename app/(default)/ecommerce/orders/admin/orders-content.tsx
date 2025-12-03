// app/(default)/ecommerce/orders/orders-content.tsx
'use client'

import { useState, useEffect } from 'react'
import DeleteButton from '@/components/delete-button'
import DateSelect from '@/components/date-select'
import FilterButton from '@/components/dropdown-filter'
import OrdersTable from './orders-table'
import PaginationClassic from '@/components/pagination-classic'

export interface Order {
  id: number
  user_id: number | null
  user_email: string
  shipping_name: string
  shipping_address1: string
  shipping_address2: string
  shipping_city: string
  shipping_state: string
  shipping_zip: string
  shipping_country: string
  total: number
  status: string
  printful_order_id: string | null
  stripe_payment_id: string | null
  paypal_order_id: string | null
  created_at: string
  items: any[]
}

export default function OrdersContent() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders', {
        credentials: 'include',
      })
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

  const getPaymentType = (order: Order) => {
    if (order.paypal_order_id) return 'PayPal'
    if (order.stripe_payment_id) return 'Card'
    if (order.status === 'awaiting_payment') return 'USDC'
    return 'Unknown'
  }

  // Transform orders to match table format
  const transformedOrders = orders.map(order => ({
    id: order.id,
    order: `#${order.id}`,
    date: new Date(order.created_at).toLocaleDateString(),
    customer: order.shipping_name,
    email: order.user_email,
    total: `$${parseFloat(order.total.toString()).toFixed(2)}`,
    status: order.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    items: order.items.length.toString(),
    location: `${order.shipping_city}, ${order.shipping_state} ${order.shipping_country}`,
    type: getPaymentType(order),
    description: order.items.map(i => `${i.name} (${i.quantity})`).join(', '),
    rawOrder: order, // Keep original data for actions
  }))

  const filteredOrders = filter === 'all' 
    ? transformedOrders 
    : transformedOrders.filter(o => o.rawOrder.status === filter)

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Loading orders...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      {/* Page header */}
      <div className="sm:flex sm:justify-between sm:items-center mb-8">
        {/* Left: Title */}
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Orders</h1>
        </div>

        {/* Right: Actions */}
        <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
          {/* Status Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="form-select"
          >
            <option value="all">All Orders</option>
            <option value="submitted">Submitted</option>
            <option value="awaiting_payment">Awaiting Payment</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Refresh button */}
          <button 
            onClick={fetchOrders}
            className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white"
          >
            <svg className="fill-current shrink-0" width="16" height="16" viewBox="0 0 16 16">
              <path d="M4.3 4.5c1.9-1.9 5.1-1.9 7 0 .7.7 1.2 1.7 1.4 2.7l2-.3c-.2-1.5-.9-2.8-1.9-3.8C10.1.4 5.7.4 2.9 3.1L.7.9 0 7.3l6.4-.7-2.1-2.1zM15.6 8.7l-6.4.7 2.1 2.1c-1.9 1.9-5.1 1.9-7 0-.7-.7-1.2-1.7-1.4-2.7l-2 .3c.2 1.5.9 2.8 1.9 3.8 1.4 1.4 3.1 2 4.9 2 1.8 0 3.6-.7 4.9-2l2.2 2.2.8-6.4z" />
            </svg>
            <span className="hidden xs:block ml-2">Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{orders.length}</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 shadow-sm rounded-xl p-4">
          <p className="text-sm text-yellow-600 dark:text-yellow-400">Pending</p>
          <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">
            {orders.filter(o => o.status === 'submitted' || o.status === 'awaiting_payment').length}
          </p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 shadow-sm rounded-xl p-4">
          <p className="text-sm text-blue-600 dark:text-blue-400">Processing</p>
          <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
            {orders.filter(o => o.status === 'processing').length}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 shadow-sm rounded-xl p-4">
          <p className="text-sm text-green-600 dark:text-green-400">Shipped</p>
          <p className="text-2xl font-bold text-green-800 dark:text-green-200">
            {orders.filter(o => o.status === 'shipped').length}
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 shadow-sm rounded-xl p-4">
          <p className="text-sm text-red-600 dark:text-red-400">Cancelled</p>
          <p className="text-2xl font-bold text-red-800 dark:text-red-200">
            {orders.filter(o => o.status === 'cancelled').length}
          </p>
        </div>
      </div>

      {/* Table */}
      <OrdersTable orders={filteredOrders} onRefresh={fetchOrders} />

      {/* Pagination */}
      <div className="mt-8">
        <PaginationClassic />
      </div>    
    </div>
  )
}