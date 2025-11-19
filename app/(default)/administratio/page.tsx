// app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import AdminDashboard from './AdminDashboard';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is admin from localStorage
    const storedUser = localStorage.getItem('user');
    console.log('Admin check - stored user:', storedUser);
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        console.log('Parsed user:', user);
        console.log('User role:', user.role);
        
        if (user.role === 'admin') {
          setIsAdmin(true);
          console.log('User is admin - allowing access');
        } else {
          console.log('User is not admin');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        // Clear corrupted data
        localStorage.removeItem('user');
      }
    } else {
      console.log('No user data in localStorage');
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          You need admin privileges to access this page.
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Current user role: {(() => {
            const user = localStorage.getItem('user');
            if (user) {
              try {
                return JSON.parse(user).role || 'none';
              } catch {
                return 'corrupted';
              }
            }
            return 'not logged in';
          })()}
        </p>
        <div className="space-x-4">
          <button
            onClick={() => {
              localStorage.removeItem('user');
              window.location.reload();
            }}
            className="text-red-600 hover:text-red-800"
          >
            Clear Login Data
          </button>
          <a
            href="/"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    );
  }

  return <AdminDashboard />;
}