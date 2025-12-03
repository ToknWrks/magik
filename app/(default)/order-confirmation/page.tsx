// app/(default)/order-confirmation/page.tsx
import { Suspense } from 'react';
import OrderConfirmationClient from './order-confirmation-client';

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrderConfirmationClient />
    </Suspense>
  );
}