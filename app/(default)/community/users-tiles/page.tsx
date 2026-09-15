// app/(default)/community/users-tiles/page.tsx
// ADMIN-ONLY directory view (tiles layout). Server component checks the role
// from the session cookie before rendering anything — non-admins get redirected.
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { pool } from '@/lib/db';
import UsersTilesClient from './users-tiles-client';

export const metadata = {
  title: 'Users Tiles - Illuminati',
}

export const dynamic = 'force-dynamic';

export default async function UsersTiles() {
  const userId = (await cookies()).get('user_id')?.value;
  if (!userId) redirect('/signin');

  const result = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
  if (result.rows.length === 0) redirect('/signin');
  if (result.rows[0].role !== 'admin') {
    // Hide the page's existence from non-admins — bounce to the member directory
    redirect('/community/users-tabs');
  }

  return <UsersTilesClient />
}
