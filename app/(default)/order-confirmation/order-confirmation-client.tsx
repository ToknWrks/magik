// app/(default)/order-confirmation/order-confirmation-client.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Boundary } from '@/components/ui/boundary';

export default function OrderConfirmationClient() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');

  return (
    <Boundary label="Order Confirmation">
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="text-6xl mb-6">✓</div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Thank You for Your Order!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          Order #{orderId}
        </p>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          We've received your order and will send you a confirmation email shortly.
        </p>
        <Link
          href="/store"
          className="inline-block px-6 py-3 bg-gray-800 text-white rounded hover:bg-gray-900 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-100"
        >
          Continue Shopping
        </Link>
      </div>
    </Boundary>
  );
}