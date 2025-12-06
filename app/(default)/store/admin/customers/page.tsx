// app/(default)/ecommerce/customers/page.tsx
export const metadata = {
  title: 'Customers - Admin',
  description: 'Manage your customers',
}

import CustomersClient from './customers-client'

export default function CustomersPage() {
  return <CustomersClient />
}