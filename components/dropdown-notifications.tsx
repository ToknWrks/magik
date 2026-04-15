'use client'

import { useState, useEffect } from 'react'
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react'

interface Quote {
  quote: string;
  author: string;
}

interface TransitData {
  aspects: { label: string; orb: string }[];
  skyline: string;
}

export default function DropdownNotifications({ align }: {
  align?: 'left' | 'right'
}) {
  const [stoicQuote, setStoicQuote] = useState<Quote | null>(null);
  const [rumiQuote, setRumiQuote] = useState<Quote | null>(null);
  const [transit, setTransit] = useState<TransitData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchQuotes = () => {
    setLoading(true);
    fetch('/api/stoic')
      .then(res => res.json())
      .then(data => {
        setStoicQuote(data.data.stoic);
        setRumiQuote(data.data.rumi);
        setTransit(data.data.transit ?? null);
        setLoading(false);
      })
      .catch(error => {
        console.error('Fetch error:', error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  const tweetQuote = (quote: Quote): void => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(quote.quote + ' - ' + quote.author + ' #realilluminati https://illuminati.earth')}`;
    window.open(url, '_blank');
  };

  const tweetTransit = (t: TransitData): void => {
    const top = t.aspects[0] ? `${t.aspects[0].label} (${t.aspects[0].orb})` : t.skyline;
    const text = `Today's sky: ${top}  ${t.skyline}  #Archetypal #Astrology https://illuminati.earth`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
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
            className={`z-10 fixed left-4 right-4 top-16 sm:absolute sm:top-full sm:w-80 sm:mt-1 ${
              align === 'right' ? 'sm:right-0 sm:left-auto' : 'sm:left-0 sm:right-auto'
            } bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 py-1.5 rounded-lg shadow-lg overflow-hidden`}
            enter="transition ease-out duration-200 transform"
            enterFrom="opacity-0 -translate-y-2"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-out duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <MenuItems className="focus:outline-none">
              {/* Header */}
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700/60 flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Daily Wisdom
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fetchQuotes();
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Get new quotes"
                >
                  <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>

              {loading ? (
                <div className="px-4 py-8 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mx-auto"></div>
                  <p className="text-xs text-gray-400 mt-2">Loading wisdom...</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
                  {/* Stoic Quote */}
                  {stoicQuote && (
                    <MenuItem>
                      <div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                        <div className="flex items-start gap-3">
                          <div className="shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">S</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 dark:text-gray-200 italic leading-relaxed">
                              "{stoicQuote.quote}"
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
                              — {stoicQuote.author}
                            </p>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                tweetQuote(stoicQuote);
                              }}
                              className="mt-2 text-xs text-gray-400 hover:text-blue-500 flex items-center gap-1 transition-colors"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                              </svg>
                              Share
                            </button>
                          </div>
                        </div>
                      </div>
                    </MenuItem>
                  )}

                  {/* Rumi Quote */}
                  {rumiQuote && (
                    <MenuItem>
                      <div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                        <div className="flex items-start gap-3">
                          <div className="shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <span className="text-purple-600 dark:text-purple-400 text-xs font-bold">R</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 dark:text-gray-200 italic leading-relaxed">
                              "{rumiQuote.quote}"
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
                              — {rumiQuote.author}
                            </p>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                tweetQuote(rumiQuote);
                              }}
                              className="mt-2 text-xs text-gray-400 hover:text-blue-500 flex items-center gap-1 transition-colors"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                              </svg>
                              Share
                            </button>
                          </div>
                        </div>
                      </div>
                    </MenuItem>
                  )}

                  {/* Today's Transits */}
                  {transit && transit.aspects.length > 0 && (
                    <MenuItem>
                      <div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                        <div className="flex items-start gap-3">
                          <div className="shrink-0 w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                            <span className="text-yellow-600 dark:text-yellow-400 text-sm">✦</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <a href="/astrology/transits" className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block hover:text-yellow-600 dark:hover:text-yellow-400">
                              Today's Sky
                            </a>
                            <ul className="space-y-1">
                              {transit.aspects.map((a, i) => (
                                <li key={i} className="flex items-center justify-between gap-2">
                                  <span className="text-xs text-gray-700 dark:text-gray-300">{a.label}</span>
                                  <span className="text-xs text-gray-400 shrink-0">{a.orb}</span>
                                </li>
                              ))}
                            </ul>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 tracking-wider">
                              {transit.skyline}
                            </p>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                tweetTransit(transit);
                              }}
                              className="mt-2 text-xs text-gray-400 hover:text-blue-500 flex items-center gap-1 transition-colors"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                              </svg>
                              Share
                            </button>
                          </div>
                        </div>
                      </div>
                    </MenuItem>
                  )}
                </div>
              )}
            </MenuItems>
          </Transition>
        </>
      )}
    </Menu>
  );
}
