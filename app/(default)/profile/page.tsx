// app/(default)/profile/page.tsx
import ProfileClient from './profile-client'

export const metadata = {
  title: 'My Profile - Illuminati',
  description: 'Manage your account settings',
}

export default function ProfilePage() {
  return <ProfileClient />
}