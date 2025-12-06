// app/(default)/ecommerce/customers/customers-client.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SelectedItemsProvider } from '@/app/selected-items-context'
import DeleteButton from '@/components/delete-button'
import DateSelect from '@/components/date-select'
import FilterButton from '@/components/dropdown-filter'
import CustomersTable from './customers-table'
import PaginationClassic from '@/components/pagination-classic'

export interface Customer {
  id: string
  email: string
  username: string
  role: string
  created_at: string
  order_count: string
  total_spent: string
  last_order_date: string | null
  last_order_id: number | null
  refund_count: string
  fav?: boolean
}

function CustomersContent() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/admin/users', {  // Changed from /api/admin/customers
        credentials: 'include',
      })
      const data = await res.json()

      if (data.error) {
        setError(data.error)
        if (data.error === 'Unauthorized' || data.error === 'Admin access required') {
          router.push('/signin')
        }
      } else {
        // Map users to customers format
        setCustomers(data.users.map((u: any) => ({ 
          ...u, 
          fav: false 
        })))
      }
      setLoading(false)
    } catch (err) {
      console.error('Error fetching customers:', err)
      setError('Failed to fetch customers')
      setLoading(false)
    }
  }

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return

    try {
      await fetch(`/api/admin/users?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      fetchCustomers()
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const handleUpdateRole = async (id: string, role: string) => {
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: id, role }),
        credentials: 'include',
      })
      fetchCustomers()
    } catch (err) {
      console.error('Update role error:', err)
    }
  }

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Loading customers...</p>
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
          <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Customers</h1>
        </div>

        {/* Right: Actions */}
        <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
          <DeleteButton />
          <DateSelect />
          <FilterButton align="right" />
          <button 
            onClick={fetchCustomers}
            className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white"
          >
            <svg className="fill-current shrink-0 w-4 h-4" viewBox="0 0 16 16">
              <path d="M14.15 4.65a.75.75 0 00-1.3-.75l-.6 1.05A5.5 5.5 0 003.5 8a.75.75 0 001.5 0 4 4 0 016.35-3.25l-.6 1.05a.75.75 0 00.65 1.13h2.1a.75.75 0 00.75-.75v-2.1a.75.75 0 00-.1-.43zm-12.3 6.7a.75.75 0 001.3.75l.6-1.05A5.5 5.5 0 0012.5 8a.75.75 0 00-1.5 0 4 4 0 01-6.35 3.25l.6-1.05a.75.75 0 00-.65-1.13H2.5a.75.75 0 00-.75.75v2.1c0 .16.04.3.1.43z"/>
            </svg>
            <span className="max-xs:sr-only ml-2">Refresh</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <CustomersTable 
        customers={customers} 
        onDelete={handleDeleteCustomer}
        onUpdateRole={handleUpdateRole}
      />

      {/* Pagination */}
      <div className="mt-8">
        <PaginationClassic />
      </div>
    </div>
  )
}

export default function CustomersClient() {
  return (
    <SelectedItemsProvider>
      <CustomersContent />
    </SelectedItemsProvider>
  )
}