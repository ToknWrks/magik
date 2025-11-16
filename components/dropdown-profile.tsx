'use client'

import Link from 'next/link'
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react'

export default function DropdownProfile({ align }: {
  align?: 'left' | 'right'
}) {
  return (
    <Menu as="div" className="relative inline-flex">
      <MenuButton className="inline-flex justify-center items-center group">
        {/* Replace Image with SVG */}
        <svg 
          className="w-8 h-8 rounded-full text-gray-600 dark:text-gray-100" 
          viewBox="0 0 16 16" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
          <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
          <g id="SVGRepo_iconCarrier">
            <path 
              fillRule="evenodd" 
              clipRule="evenodd" 
              d="M8 16L3.54223 12.3383C1.93278 11.0162 1 9.04287 1 6.96005C1 3.11612 4.15607 0 8 0C11.8439 0 15 3.11612 15 6.96005C15 9.04287 14.0672 11.0162 12.4578 12.3383L8 16ZM3 6H5C6.10457 6 7 6.89543 7 8V9L3 7.5V6ZM11 6C9.89543 6 9 6.89543 9 8V9L13 7.5V6H11Z" 
              fill="currentColor"
            />
          </g>
        </svg>
        <div className="flex items-center truncate">
          <span className="truncate ml-2 text-sm font-medium text-gray-600 dark:text-gray-100 group-hover:text-gray-800 dark:group-hover:text-white">Illuminati</span>
          <svg className="w-3 h-3 shrink-0 ml-1 fill-current text-gray-400 dark:text-gray-500" viewBox="0 0 12 12">
            <path d="M5.9 11.4L.5 6l1.4-1.4 4 4 4-4L11.3 6z" />
          </svg>
        </div>
      </MenuButton>
      <Transition
        as="div"
        className={`origin-top-right z-10 absolute top-full min-w-[11rem] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 py-1.5 rounded-lg shadow-lg overflow-hidden mt-1 ${align === 'right' ? 'right-0' : 'left-0'
          }`}
        enter="transition ease-out duration-200 transform"
        enterFrom="opacity-0 -translate-y-2"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-out duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="pt-0.5 pb-2 px-3 mb-1 border-b border-gray-200 dark:border-gray-700/60">
          <div className="font-medium text-gray-800 dark:text-gray-100">Illuminati</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 italic">Administrator</div>
        </div>
        <MenuItems as="ul" className="focus:outline-none">
          <MenuItem as="li">
            {({ active }) => (
              <Link className={`font-medium text-sm flex items-center py-1 px-3 ${active ? 'text-gray-600 dark:text-gray-400' : 'text-gray-500'}`} href="#0">
                Settings
              </Link>
            )}
          </MenuItem>
          <MenuItem as="li">
            {({ active }) => (
              <Link className={`font-medium text-sm flex items-center py-1 px-3 ${active ? 'text-gray-600 dark:text-gray-400' : 'text-gray-500'}`} href="#0">
                Sign Out
              </Link>
            )}
          </MenuItem>
        </MenuItems>
      </Transition>
    </Menu>
  )
}