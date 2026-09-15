// components/dropdown-profile.tsx
'use client'

import { useState, useEffect } from 'react'
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react'
import Link from 'next/link'

interface User {
  name?: string;
  username?: string;
  email?: string;
  role?: 'admin' | 'member';
}

export default function DropdownProfile({
  align,
}: {
  align?: 'left' | 'right'
}) {
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      fetch('/api/credits/balance', { credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then(d => d && setCredits(d.balance))
        .catch(() => {});
    } else {
      // Wallet sign-in and other flows may not write localStorage —
      // fall back to the session cookie.
      fetch('/api/auth/me', { credentials: 'include' })
        .then(r => r.json())
        .then(d => {
          if (d.user) {
            setUser(d.user);
            try { localStorage.setItem('user', JSON.stringify(d.user)); } catch { /* private mode */ }
            fetch('/api/credits/balance', { credentials: 'include' })
              .then(r => r.ok ? r.json() : null)
              .then(x => x && setCredits(x.balance))
              .catch(() => {});
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('user');
    window.location.href = '/signin';
  };

  return (
    <Menu as="div" className="relative inline-flex">
      <MenuButton className="inline-flex justify-center items-center group">
        {/* Container matches other header icon buttons */}
        <div className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 lg:hover:bg-gray-200 dark:hover:bg-gray-700/50 dark:lg:hover:bg-gray-800 rounded-full">
          {/* Alien icon - sized to match other header icons */}
          <svg className="w-4 h-4 text-gray-500/80 dark:text-gray-400/80" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M8 16L3.54223 12.3383C1.93278 11.0162 1 9.04287 1 6.96005C1 3.11612 4.15607 0 8 0C11.8439 0 15 3.11612 15 6.96005C15 9.04287 14.0672 11.0162 12.4578 12.3383L8 16ZM3 6H5C6.10457 6 7 6.89543 7 8V9L3 7.5V6ZM11 6C9.89543 6 9 6.89543 9 8V9L13 7.5V6H11Z" fill="currentColor" />
          </svg>
        </div>
        <div className="flex items-center truncate">
          <span className="truncate ml-2 text-sm font-medium text-gray-600 dark:text-gray-100 group-hover:text-gray-800 dark:group-hover:text-white">
            {user ? user.username || 'User' : 'Sign In'}
          </span>
          <svg className="w-3 h-3 shrink-0 ml-1 fill-current text-gray-400 dark:text-gray-500" viewBox="0 0 12 12">
            <path d="M5.9 11.4L.5 6l1.4-1.4 4 4 4-4L11.3 6z" />
          </svg>
        </div>
      </MenuButton>

      <Transition 
        as="div" 
        className={`origin-top-right z-10 absolute top-full min-w-[11rem] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 py-1.5 rounded-lg shadow-lg overflow-hidden mt-1 ${align === 'right' ? 'right-0' : 'left-0'}`}
        enter="transition ease-out duration-200 transform"
        enterFrom="opacity-0 -translate-y-2"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-out duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <MenuItems className="text-sm font-medium text-gray-600 dark:text-gray-300 divide-y divide-gray-200 dark:divide-gray-700/60 focus:outline-none">
          {user ? (
            <>
              {/* User Info */}
              <div className="px-3 py-2">
                <span className="block text-gray-800 dark:text-gray-100">{user.username || 'User'}</span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">{user.email}</span>
                <span className="block text-xs text-gray-400 dark:text-gray-500 italic mt-0.5">
                  {user.role === 'admin' ? 'Administrator' : 'Member'}
                </span>
                {credits !== null && (
                  <Link href="/credits" className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs font-medium text-yellow-700 dark:text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" />
                    </svg>
                    {credits} tokens
                  </Link>
                )}
              </div>

              {/* User Links */}
              <ul className="py-1">
                <li>
                  <MenuItem>
                    {({ active }) => (
                      <Link
                        className={`flex items-center px-3 py-1.5 ${active ? 'bg-gray-50 dark:bg-gray-700/50' : ''}`}
                        href="/profile"
                      >
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        My Profile
                      </Link>
                    )}
                  </MenuItem>
                </li>
                <li>
                  <MenuItem>
                    {({ active }) => (
                      <Link
                        className={`flex items-center px-3 py-1.5 ${active ? 'bg-gray-50 dark:bg-gray-700/50' : ''}`}
                        href="/sigil-creator/collection"
                      >
                        <span className="astrology-symbol w-4 mr-2 text-gray-400 text-sm leading-none text-center">{"\u26E4"}</span>
                        My Sigils
                      </Link>
                    )}
                  </MenuItem>
                </li>
                <li>
                  <MenuItem>
                    {({ active }) => (
                      <Link
                        className={`flex items-center px-3 py-1.5 ${active ? 'bg-gray-50 dark:bg-gray-700/50' : ''}`}
                        href="/settings/readings"
                      >
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        My Readings
                      </Link>
                    )}
                  </MenuItem>
                </li>
                <li>
                  <MenuItem>
                    {({ active }) => (
                      <Link
                        className={`flex items-center px-3 py-1.5 ${active ? 'bg-gray-50 dark:bg-gray-700/50' : ''}`}
                        href="/spiritual-coaching/sessions"
                      >
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                        My Sessions
                      </Link>
                    )}
                  </MenuItem>
                </li>
                <li>
                  <MenuItem>
                    {({ active }) => (
                      <Link
                        className={`flex items-center px-3 py-1.5 ${active ? 'bg-gray-50 dark:bg-gray-700/50' : ''}`}
                        href="/credits"
                      >
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Buy Tokens
                      </Link>
                    )}
                  </MenuItem>
                </li>
                <li>
                  <MenuItem>
                    {({ active }) => (
                      <Link
                        className={`flex items-center px-3 py-1.5 ${active ? 'bg-gray-50 dark:bg-gray-700/50' : ''}`}
                        href="/store/my/orders"
                      >
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        My Orders
                      </Link>
                    )}
                  </MenuItem>
                </li>
                <li>
                  <MenuItem>
                    {({ active }) => (
                      <a
                        className={`flex items-center px-3 py-1.5 ${active ? 'bg-gray-50 dark:bg-gray-700/50' : ''}`}
                        href="https://x.com/illuminatico"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        @illuminatico
                      </a>
                    )}
                  </MenuItem>
                </li>
              </ul>

              {/* Admin Links */}
              {user.role === 'admin' && (
                <ul className="py-1">
                  <li>
                    <MenuItem>
                      {({ active }) => (
                        <Link
                          className={`flex items-center px-3 py-1.5 ${active ? 'bg-gray-50 dark:bg-gray-700/50' : ''}`}
                          href="/store/admin/"
                        >
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Manage Orders
                        </Link>
                      )}
                    </MenuItem>
                  </li>
                  <li>
                    <MenuItem>
                      {({ active }) => (
                        <Link
                          className={`flex items-center px-3 py-1.5 ${active ? 'bg-gray-50 dark:bg-gray-700/50' : ''}`}
                          href="/administratio"
                        >
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Admin Dashboard
                        </Link>
                      )}
                    </MenuItem>
                  </li>
                </ul>
              )}

              {/* Logout */}
              <ul className="py-1">
                <li>
                  <MenuItem>
                    {({ active }) => (
                      <button
                        className={`flex items-center w-full px-3 py-1.5 text-left text-red-600 dark:text-red-400 ${active ? 'bg-gray-50 dark:bg-gray-700/50' : ''}`}
                        onClick={handleLogout}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    )}
                  </MenuItem>
                </li>
              </ul>
            </>
          ) : (
            <ul className="py-1">
              <li>
                <MenuItem>
                  {({ active }) => (
                    <Link
                      className={`flex items-center px-3 py-1.5 ${active ? 'bg-gray-50 dark:bg-gray-700/50' : ''}`}
                      href="/signin"
                    >
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Sign In
                    </Link>
                  )}
                </MenuItem>
              </li>
              
            </ul>
          )}
        </MenuItems>
      </Transition>
    </Menu>
  )
}