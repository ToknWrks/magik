'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react'

export default function DropdownNotifications({ align }: {
  align?: 'left' | 'right'
}) {
  const [quotes, setQuotes] = useState<{ quote: string; author: string }[]>([]);

  useEffect(() => {
    fetch('/api/stoic')
      .then(res => res.json())
      .then(data => {
        console.log('Fetched data:', data);
        setQuotes([data.data]); // Access nested data
      })
      .catch(error => console.error('Fetch error:', error));
  }, []);

  interface Quote {
    quote: string;
    author: string;
  }

  const tweetQuote = (quote: Quote): void => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(quote.quote + ' - ' + quote.author + ' #realilluminati https://illuminati.earth')}`;
    window.open(url, '_blank');
  };

  return (
    <Menu as="div" className="relative inline-flex">
      {({ open }) => (
        <>
          <MenuButton
            className={`w-8 h-8 flex items-center justify-center hover:bg-gray-100 lg:hover:bg-gray-200 dark:hover:bg-gray-700/50 dark:lg:hover:bg-gray-800 rounded-full ${
              open && 'bg-gray-200 dark:bg-gray-800'
            }`}
          >
            <span className="sr-only">Notifications</span>
            <svg
              className="fill-current text-gray-500/80 dark:text-gray-400/80"
              width={16}
              height={16}
              viewBox="0 0 16 16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M7 0a7 7 0 0 0-7 7c0 1.202.308 2.33.84 3.316l-.789 2.368a1 1 0 0 0 1.265 1.265l2.595-.865a1 1 0 0 0-.632-1.898l-.698.233.3-.9a1 1 0 0 0-.104-.85A4.97 4.97 0 0 1 2 7a5 5 0 0 1 5-5 4.99 4.99 0 0 1 4.093 2.135 1 1 0 1 0 1.638-1.148A6.99 6.99 0 0 0 7 0Z" />
              <path d="M11 6a5 5 0 0 0 0 10c.807 0 1.567-.194 2.24-.533l1.444.482a1 1 0 0 0 1.265-1.265l-.482-1.444A4.962 4.962 0 0 0 16 11a5 5 0 0 0-5-5Zm-3 5a3 3 0 0 1 6 0c0 .588-.171 1.134-.466 1.6a1 1 0 0 0-.115.82 1 1 0 0 0-.82.114A2.973 2.973 0 0 1 11 14a3 3 0 0 1-3-3Z" />
            </svg>
            <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-yellow-700 border-2 border-gray-100 dark:border-gray-900 rounded-full"></div>
          </MenuButton>
          <Transition
            as="div"
            className={`origin-top-right z-10 absolute top-full -mr-48 sm:mr-0 min-w-[20rem] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 py-1.5 rounded-lg shadow-lg overflow-hidden mt-1 ${
              align === 'right' ? 'right-0' : 'left-0'
            }`}
            enter="transition ease-out duration-200 transform"
            enterFrom="opacity-0 -translate-y-2"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-out duration-150 transform"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 -translate-y-2"
          >
            <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase pt-1.5 pb-2 px-4">
              Stoic Quotes
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700/60">
              {quotes.map((quote, index) => (
                <MenuItem key={index}>
                  <div className="flex flex-col py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-700/20">
                    <div className="grow">
                      <div className="text-sm mb-1">{quote.quote}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">- {quote.author}</div>
                    </div>
                    <button
                      onClick={() => tweetQuote(quote)}
                      className="mt-2 px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-xs hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      Post on X
                    </button>
                  </div>
                </MenuItem>
              ))}
            </div>
          </Transition>
        </>
      )}
    </Menu>
  )
}
