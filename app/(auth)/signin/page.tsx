'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import AuthHeader from '../auth-header';
import AuthImage from '../auth-image';
import WalletAuthButton from '@/components/web3/WalletAuthButton';

function SignInForm() {
  const searchParams = useSearchParams();
  // mode: 'signin' | 'signup' — signup lives here so users can skip onboarding
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');

    if (mode === 'signin') {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        const redirect = searchParams.get('redirect') ?? '/profile';
        window.location.href = redirect;
      } else {
        setError(data.error ?? '');
      }
    } else {
      // Direct signup — account only, no onboarding, no payment
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username: username || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        // Register doesn't log in — sign in immediately with the new credentials
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const loginData = await loginRes.json();
        if (loginData.success) {
          localStorage.setItem('user', JSON.stringify(loginData.user));
          const redirect = searchParams.get('redirect') ?? '/profile';
          window.location.href = redirect;
        } else {
          // Account created but auto-login failed — send to sign in
          setMode('signin');
          setError('Account created! Please sign in.');
        }
      } else {
        setError(data.error ?? 'Could not create account');
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
                {mode === 'signin' ? 'Welcome Home' : 'Join the Order'}
              </h1>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {mode === 'signup' && (
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="username">Username <span className="text-gray-400">(optional)</span></label>
                      <input
                        id="username"
                        className="form-input w-full"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="email">Email Address</label>
                    <input
                      id="email"
                      className="form-input w-full"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="password">Password</label>
                    <input
                      id="password"
                      className="form-input w-full"
                      type="password"
                      autoComplete="on"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                {error && <p className="text-red-500 mt-2">{error}</p>}
                <div className="flex items-center justify-between mt-6">
                  <div className="mr-1">
                    {mode === 'signin' ? (
                      <Link className="text-sm underline hover:no-underline" href="/reset-password">Forgot Password?</Link>
                    ) : (
                      <button type="button" className="text-sm underline hover:no-underline" onClick={() => { setMode('signin'); setError(''); }}>
                        ← Back to Sign In
                      </button>
                    )}
                  </div>
                  <button type="submit" className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white">
                    {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  </button>
                </div>
                <div className="pt-5 mt-6 border-t border-gray-100 dark:border-gray-700/60">
                  <WalletAuthButton label="⛓ Connect Wallet to Sign In" className="w-full" />
                  <div className="text-sm text-gray-500 dark:text-gray-400 text-center mt-4">
                    {mode === 'signin' ? (
                      <>
                        Don&apos;t have an account?{' '}
                        <button type="button" className="font-medium text-yellow-700 hover:text-yellow-800 dark:hover:text-yellow-800" onClick={() => { setMode('signup'); setError(''); }}>
                          Sign up
                        </button>
                      </>
                    ) : (
                      <>
                        Already a member?{' '}
                        <button type="button" className="font-medium text-yellow-700 hover:text-yellow-800 dark:hover:text-yellow-800" onClick={() => { setMode('signin'); setError(''); }}>
                          Sign in
                        </button>
                      </>
                    )}
                  </div>
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

export default function SignIn() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
