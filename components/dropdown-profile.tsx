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

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
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