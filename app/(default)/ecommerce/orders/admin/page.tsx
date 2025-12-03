// app/(default)/ecommerce/orders/page.tsx
export const metadata = {
  title: 'Orders - Illuminati Store',
  description: 'Manage store orders',
}

import { SelectedItemsProvider } from '@/app/selected-items-context'
import OrdersContent from './orders-content'

export default function Orders() {
  return (
    <SelectedItemsProvider>
      <OrdersContent />
    </SelectedItemsProvider>
  )
}