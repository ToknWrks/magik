'use client'

import { useState } from 'react'
import { Order } from './orders-table'
import { OrdersProperties } from './orders-properties'

interface OrdersTableItemProps {
  order: Order
  onCheckboxChange: (id: number, checked: boolean) => void
  isSelected: boolean
  onRefresh: () => void
}

export default function OrdersTableItem({ order, onCheckboxChange, isSelected, onRefresh }: OrdersTableItemProps) {
  const [processing, setProcessing] = useState(false)

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {        
    onCheckboxChange(order.id, e.target.checked)
  }

  const { 
    descriptionOpen,
    setDescriptionOpen,
    statusColor,
    typeIcon,    
  } = OrdersProperties()

  const handleProcessOrder = async () => {
    setProcessing(true)
    try {
      const res = await fetch('/api/orders/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
        credentials: 'include',
      })
      const data = await res.json()
      if (data.success) {
        onRefresh()
      } else {
        alert(`Failed to process order: ${data.error}`)
      }
    } catch (err) {
      alert('Failed to process order')
    } finally {
      setProcessing(false)
    }
  }

  const handleUpdateStatus = async (status: string) => {
    try {
      const res = await fetch('/api/admin/orders/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, status }),
        credentials: 'include',
      })
      const data = await res.json()
      if (data.success) {
        onRefresh()
      } else {
        alert(`Failed to update status: ${data.error}`)
      }
    } catch (err) {
      alert('Failed to update status')
    }
  }

  const getStatusStyle = (status: string) => {
    const normalizedStatus = status.toLowerCase().replace(' ', '_')
    switch (normalizedStatus) {
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

  return (
    <tbody className="text-sm">
      {/* Row */}
      <tr>
        <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap w-px">
          <div className="flex items-center">
            <label className="inline-flex">
              <span className="sr-only">Select</span>
              <input className="form-checkbox" type="checkbox" onChange={handleCheckboxChange} checked={isSelected} />
            </label>
          </div>
        </td>
        <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
        <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
          <div className="flex items-center text-gray-800">
            <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full mr-2 sm:mr-3">
              <svg className="w-5 h-5 fill-current text-gray-400" viewBox="0 0 16 16">
                <path d="M4.3 4.5c1.9-1.9 5.1-1.9 7 0 .7.7 1.2 1.7 1.4 2.7l2-.3c-.2-1.5-.9-2.8-1.9-3.8C10.1.4 5.7.4 2.9 3.1L.7.9 0 7.3l6.4-.7-2.1-2.1zM15.6 8.7l-6.4.7 2.1 2.1c-1.9 1.9-5.1 1.9-7 0-.7-.7-1.2-1.7-1.4-2.7l-2 .3c.2 1.5.9 2.8 1.9 3.8 1.4 1.4 3.1 2 4.9 2 1.8 0 3.6-.7 4.9-2l2.2 2.2.8-6.4z" />
              </svg>
            </div>
            <div className="font-medium text-sky-600">{order.order}</div>
          </div>
        </td>
          <div>{order.date}</div>
        </td>
        <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
          <div className="font-medium text-gray-800 dark:text-gray-100">{order.customer}</div>
          <div className="text-xs text-gray-500">{order.email}</div>
        </td>
        <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
          <div className="text-left font-medium text-green-600">{order.total}</div>
        </td>
        <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
          <div className={`inline-flex font-medium rounded-full text-center px-2.5 py-0.5 ${getStatusStyle(order.status)}`}>
            {order.status}
          </div>
        </td>
        <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
          <div className="text-center">{order.items}</div>
        </td>
        <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
          <div className="text-left">{order.location}</div>
        </td>
        <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
          <div className="flex items-center">
            {typeIcon(order.type)}
            <div>{order.type}</div>
          </div>
        </td>
        <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
          <div className="flex items-center gap-2">
            {order.rawOrder.status === 'submitted' && (
              <button
                onClick={handleProcessOrder}
                disabled={processing}
                className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {processing ? '...' : 'Process'}
              </button>
            )}
            {order.rawOrder.status === 'awaiting_payment' && (
              <button
                onClick={() => handleUpdateStatus('submitted')}
                className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
              >
                Paid
              </button>
            )}
            {order.rawOrder.status !== 'cancelled' && order.rawOrder.status !== 'shipped' && (
              <button
                onClick={() => handleUpdateStatus('cancelled')}
                className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
              >
                Cancel
              </button>
            )}
            <button
              className={`text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 ${descriptionOpen && 'rotate-180'}`}
              aria-expanded={descriptionOpen}
              onClick={() => setDescriptionOpen(!descriptionOpen)}
              aria-controls={`description-${order.id}`}
            >
              <span className="sr-only">Details</span>
              <svg className="w-8 h-8 fill-current" viewBox="0 0 32 32">
                <path d="M16 20l-5.4-5.4 1.4-1.4 4 4 4-4 1.4 1.4z" />
              </svg>
            </button>
          </div>
        </td>
      </tr>
      {/* Expanded details */}
      <tr id={`description-${order.id}`} role="region" className={`${!descriptionOpen && 'hidden'}`}>
        <td colSpan={10} className="px-2 first:pl-5 last:pr-5 py-3">
          <div className="bg-gray-50 dark:bg-gray-950/[0.15] dark:text-gray-400 p-4 -mt-3 rounded">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Shipping Address</h4>
                <p className="text-sm">{order.rawOrder.shipping_address1}</p>
                {order.rawOrder.shipping_address2 && <p className="text-sm">{order.rawOrder.shipping_address2}</p>}
                <p className="text-sm">{order.rawOrder.shipping_city}, {order.rawOrder.shipping_state} {order.rawOrder.shipping_zip}</p>
                <p className="text-sm">{order.rawOrder.shipping_country}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Items</h4>
                <ul className="text-sm space-y-1">
                  {order.rawOrder.items.map((item: any, index: number) => (
                    <li key={index}>
                      {item.name} - {item.size && `${item.size}`} {item.color && `/ ${item.color}`} × {item.quantity}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Payment</h4>
                <p className="text-sm">Method: {order.type}</p>
                {order.rawOrder.paypal_order_id && <p className="text-sm">PayPal: {order.rawOrder.paypal_order_id}</p>}
                {order.rawOrder.stripe_payment_id && <p className="text-sm">Stripe: {order.rawOrder.stripe_payment_id}</p>}
                {order.rawOrder.printful_order_id && <p className="text-sm">Printful: {order.rawOrder.printful_order_id}</p>}
              </div>
            </div>
          </div>
        </td>
      </tr>
    </tbody>
  )
}