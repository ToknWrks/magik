'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react';

export default function DropdownProfile({ align }: { align?: 'left' | 'right' }) {
  interface User {
    name?: string;
    username?: string;
    role?: 'admin' | 'member';
  }

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
        <svg className="w-8 h-8 rounded-full text-gray-600 dark:text-gray-100" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
          <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
          <g id="SVGRepo_iconCarrier">
            <path fillRule="evenodd" clipRule="evenodd" d="M8 16L3.54223 12.3383C1.93278 11.0162 1 9.04287 1 6.96005C1 3.11612 4.15607 0 8 0C11.8439 0 15 3.11612 15 6.96005C15 9.04287 14.0672 11.0162 12.4578 12.3383L8 16ZM3 6H5C6.10457 6 7 6.89543 7 8V9L3 7.5V6ZM11 6C9.89543 6 9 6.89543 9 8V9L13 7.5V6H11Z" fill="currentColor" />
          </g>
        </svg>
        <div className="flex items-center truncate">
          <span className="truncate ml-2 text-sm font-medium text-gray-600 dark:text-gray-100 group-hover:text-gray-800 dark:group-hover:text-white">
            {user ? user.username || 'User' : 'Sign In'}
          </span>
          <svg className="w-3 h-3 shrink-0 ml-1 fill-current text-gray-400 dark:text-gray-500" viewBox="0 0 12 12">
            <path d="M5.9 11.4L.5 6l1.4-1.4 4 4 4-4L11.3 6z" />
          </svg>
        </div>
      </MenuButton>
      <Transition as="div" className={`origin-top-right z-10 absolute top-full min-w-[11rem] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 py-1.5 rounded-lg shadow-lg overflow-hidden mt-1 ${align === 'right' ? 'right-0' : 'left-0'}`}>
        <MenuItems className="text-sm font-medium text-gray-900 dark:text-gray-100 divide-y divide-gray-200 dark:divide-gray-700/60">
          {user ? (
            <>
              <div className="px-3 py-3">
                <div className="font-medium text-gray-800 dark:text-gray-200">{user.username || 'User'}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 italic">{user.role === 'admin' ? 'Administrator' : 'Member'}</div>
              </div>
              <div className="py-2">
                <MenuItem>
                  
                    <Link href="/profile" className={`flex items-center py-1 px-3 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'} hover:text-gray-900 dark:hover:text-gray-100`}>
                      <svg className="w-4 h-4 fill-current shrink-0 mr-2" viewBox="0 0 16 16">
                        <path d="M11.7.3c-.4-.4-1-.4-1.4 0l-10 10c-.2.2-.3.4-.3.7v4c0 .6.4 1 1 1h4c.3 0 .5-.1.7-.3l10-10c.4-.4.4-1 0-1.4l-4-4zM4.6 14H2v-2.6l8-8L12.6 6l-8 8zM13 4.4L11.6 3 13 1.6 14.4 3 13 4.4z" />
                      </svg>
                      <span>Profile</span>
                    </Link>
                  
                </MenuItem>
                <MenuItem>
                  
                    <button onClick={handleLogout} className={`flex items-center py-1 px-3 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'} hover:text-gray-900 dark:hover:text-gray-100`}>
                      <svg className="w-4 h-4 fill-current shrink-0 mr-2" viewBox="0 0 16 16">
                        <path d="M8 16L3.54223 12.3383C1.93278 11.0162 1 9.04287 1 6.96005C1 3.11612 4.15607 0 8 0C11.8439 0 15 3.11612 15 6.96005C15 9.04287 14.0672 11.0162 12.4578 12.3383L8 16ZM3 6H5C6.10457 6 7 6.89543 7 8V9L3 7.5V6ZM11 6C9.89543 6 9 6.89543 9 8V9L13 7.5V6H11Z" />
                      </svg>
                      <span>Sign Out</span>
                    </button>
               
                </MenuItem>
              </div>
            </>
          ) : (
            <div className="py-2">
              <MenuItem>
               
                  <Link href="/signin" className={`flex items-center py-1 px-3 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'} hover:text-gray-900 dark:hover:text-gray-100`}>
                    <svg className="w-4 h-4 fill-current shrink-0 mr-2" viewBox="0 0 16 16">
                      <path d="M8 16L3.54223 12.3383C1.93278 11.0162 1 9.04287 1 6.96005C1 3.11612 4.15607 0 8 0C11.8439 0 15 3.11612 15 6.96005C15 9.04287 14.0672 11.0162 12.4578 12.3383L8 16ZM3 6H5C6.10457 6 7 6.89543 7 8V9L3 7.5V6ZM11 6C9.89543 6 9 6.89543 9 8V9L13 7.5V6H11Z" />
                    </svg>
                    <span>Sign In</span>
                  </Link>
              
              </MenuItem>
            </div>
          )}
        </MenuItems>
      </Transition>
    </Menu>
  );
}