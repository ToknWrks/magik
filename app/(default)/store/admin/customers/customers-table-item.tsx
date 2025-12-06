'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Customer } from './customers-client'

interface CustomersTableItemProps {
  customer: Customer
  onCheckboxChange: (id: string, checked: boolean) => void
  isSelected: boolean
  onDelete: (id: string) => void
  onUpdateRole: (id: string, role: string) => void
}

export default function CustomersTableItem({ 
  customer, 
  onCheckboxChange, 
  isSelected,
  onDelete,
  onUpdateRole,
}: CustomersTableItemProps) {
  const [fav, setFav] = useState(customer.fav || false)
  const [menuOpen, setMenuOpen] = useState(false)

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCheckboxChange(customer.id, e.target.checked)
  }

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num)
  }

  const getInitials = (username: string, email: string) => {
    if (username) {
      return username.slice(0, 2).toUpperCase()
    }
    return email.slice(0, 2).toUpperCase()
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400'
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400'
    }
  }

  return (
    <tr>
      <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap w-px">
        <div className="flex items-center">
          <label className="inline-flex">
            <span className="sr-only">Select</span>
            <input 
              className="form-checkbox" 
              type="checkbox" 
              onChange={handleCheckboxChange} 
              checked={isSelected} 
            />
          </label>
        </div>
      </td>
      <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap w-px">
        <button onClick={() => setFav(!fav)}>
          <svg 
            className={`shrink-0 fill-current ${fav ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'}`} 
            width="16" 
            height="16" 
            viewBox="0 0 16 16"
          >
            <path d="M8 0L6 5.934H0l4.89 3.954L2.968 16 8 12.223 13.032 16 11.11 9.888 16 5.934h-6L8 0z" />
          </svg>
        </button>
      </td>
      <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-10 h-10 shrink-0 mr-2 sm:mr-3 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {getInitials(customer.username, customer.email)}
            </span>
          </div>
          <div className="font-medium text-gray-800 dark:text-gray-100">
            {customer.username || customer.email.split('@')[0]}
          </div>
        </div>
      </td>
      <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
        <div className="text-left">{customer.email}</div>
      </td>
      <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
        <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleColor(customer.role)}`}>
          {customer.role}
        </div>
      </td>
      <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
        <div className="text-center">{customer.order_count}</div>
      </td>
      <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
        <div className="text-left">
          {customer.last_order_id ? (
            <Link 
              href={`/admin/orders`}
              className="font-medium text-sky-600 hover:text-sky-700"
            >
              #{customer.last_order_id}
            </Link>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      </td>
      <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
        <div className="text-left font-medium text-green-600">
          {formatCurrency(customer.total_spent)}
        </div>
      </td>
      <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
        <div className="text-center">
          {parseInt(customer.refund_count) > 0 ? (
            <span className="text-red-500">{customer.refund_count}</span>
          ) : (
            '-'
          )}
        </div>
      </td>
      <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap w-px">
        <div className="relative">
          <button 
            className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 rounded-full"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className="sr-only">Menu</span>
            <svg className="w-8 h-8 fill-current" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="2" />
              <circle cx="10" cy="16" r="2" />
              <circle cx="22" cy="16" r="2" />
            </svg>
          </button>
          
          {menuOpen && (
            <>
              {/* Backdrop to close menu */}
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
                <ul className="py-1">
                  {customer.role !== 'admin' && (
                    <li>
                      <button 
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={() => {
                          onUpdateRole(customer.id, 'admin')
                          setMenuOpen(false)
                        }}
                      >
                        Make Admin
                      </button>
                    </li>
                  )}
                  {customer.role === 'admin' && (
                    <li>
                      <button 
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={() => {
                          onUpdateRole(customer.id, 'member')
                          setMenuOpen(false)
                        }}
                      >
                        Remove Admin
                      </button>
                    </li>
                  )}
                  <li>
                    <button 
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={() => {
                        onDelete(customer.id)
                        setMenuOpen(false)
                      }}
                    >
                      Delete
                    </button>
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}