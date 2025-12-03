'use client'

import { ReactElement, useState } from 'react'

export const OrdersProperties = () => {
  const [descriptionOpen, setDescriptionOpen] = useState<boolean>(false)

  const statusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'shipped':
      case 'delivered':
        return 'bg-green-500/20 text-green-700'
      case 'cancelled':
        return 'bg-red-500/20 text-red-700'
      case 'processing':
        return 'bg-blue-500/20 text-blue-700'
      case 'awaiting_payment':
        return 'bg-orange-500/20 text-orange-700'
      case 'submitted':
        return 'bg-yellow-500/20 text-yellow-700'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
    }
  }

  const typeIcon = (type: string): ReactElement => {
    switch (type) {
      case 'PayPal':
        return (
          <svg className="fill-current text-blue-500 shrink-0 mr-2" width="16" height="16" viewBox="0 0 24 24">
            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.773.773 0 0 1 .763-.642h6.923c2.321 0 4.052.52 5.126 1.545 1.073 1.025 1.457 2.476 1.14 4.311-.408 2.357-1.355 4.136-2.814 5.285-1.459 1.15-3.41 1.733-5.797 1.733h-1.56a.773.773 0 0 0-.764.642l-.939 4.743z"/>
          </svg>
        )
      case 'Card':
        return (
          <svg className="fill-current text-gray-400 dark:text-gray-500 shrink-0 mr-2" width="16" height="16" viewBox="0 0 16 16">
            <path d="M0 3a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H2a2 2 0 01-2-2V3zm2-1a1 1 0 00-1 1v1h14V3a1 1 0 00-1-1H2zm13 4H1v7a1 1 0 001 1h12a1 1 0 001-1V6z"/>
          </svg>
        )
      case 'USDC':
        return (
          <svg className="fill-current text-blue-400 shrink-0 mr-2" width="16" height="16" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
          </svg>
        )
      default:
        return (
          <svg className="fill-current text-gray-400 dark:text-gray-500 shrink-0 mr-2" width="16" height="16" viewBox="0 0 16 16">
            <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm0 14A6 6 0 118 2a6 6 0 010 12z"/>
          </svg>
        )
    }
  } 

  return {
    descriptionOpen,
    setDescriptionOpen,
    statusColor,
    typeIcon,
  }
}
