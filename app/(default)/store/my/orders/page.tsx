// app/(default)/store/my/orders/page.tsx
import MyOrdersClient from './my-orders-client'

export const metadata = {
  title: 'My Orders - Illuminati Store',
  description: 'View your order history',
}

export default function MyOrdersPage() {
  return <MyOrdersClient />
}