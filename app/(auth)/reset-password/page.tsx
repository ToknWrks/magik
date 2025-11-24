'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthHeader from '../auth-header';
import AuthImage from '../auth-image';

function ResetPasswordForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      // Show password reset form
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (token) {
      // Reset password with token
      if (password !== confirmPassword) {
        setMessage('Passwords do not match.');
        return;
      }
      const res: Response = await fetch('/api/auth/reset-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      if (res.ok) {
        setMessage('Password reset successfully.');
      } else {
        setMessage('Error resetting password.');
      }
    } else {
      // Send reset link
      const res: Response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setMessage('Reset link sent to your email.');
      } else {
        setMessage('Error sending reset link.');
      }
    }
  };

  return (
    <main className="bg-white dark:bg-gray-900">
      <div className="relative md:flex">
        <div className="md:w-1/2">
          <div className="min-h-[100dvh] h-full flex flex-col after:flex-1">
            <AuthHeader />
            <div className="max-w-sm mx-auto w-full px-4 py-8">
              <h1 className="text-3xl text-gray-800 dark:text-gray-100 font-bold mb-6">
                {token ? 'Set New Password' : 'Reset your Password'}
              </h1>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {!token && (
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="email">Email Address <span className="text-red-500">*</span></label>
                      <input
                        id="email"
                        className="form-input w-full"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  )}
                  {token && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="password">New Password</label>
                        <input
                          id="password"
                          className="form-input w-full"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="confirmPassword">Confirm Password</label>
                        <input
                          id="confirmPassword"
                          className="form-input w-full"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                    </>
                  )}
                </div>
                {message && <p className="text-green-500 mt-2">{message}</p>}
                <div className="flex justify-end mt-6">
                  <button type="submit" className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white whitespace-nowrap">
                    {token ? 'Reset Password' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <AuthImage />
      </div>
    </main>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
