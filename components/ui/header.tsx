'use client'

import { useState, useRef } from 'react'
import { useAppProvider } from '@/app/app-provider'

// Add imports for Dialog components
import { Dialog, DialogPanel, Transition } from '@headlessui/react'

import SearchModal from '@/components/search-modal'
import Notifications from '@/components/dropdown-notifications'
import DropdownHelp from '@/components/dropdown-help'
import ThemeToggle from '@/components/theme-toggle'
import DropdownProfile from '@/components/dropdown-profile'

export default function Header({
  variant = 'default',
}: {
  variant?: 'default' | 'v2' | 'v3'
}) {

  const { sidebarOpen, setSidebarOpen } = useAppProvider()
  const [searchModalOpen, setSearchModalOpen] = useState<boolean>(false)
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggleMeditation = () => {
    if (audioPlaying) {
      audioRef.current?.pause();
      setAudioPlaying(false);
    } else {
      audioRef.current?.play();
      setAudioPlaying(true);
    }
  };

  return (
    <>
      <header className={`sticky top-0 before:absolute before:inset-0 before:backdrop-blur-md max-lg:before:bg-white/90 dark:max-lg:before:bg-black before:-z-10 z-30 ${variant === 'v2' || variant === 'v3' ? 'before:bg-white after:absolute after:h-px after:inset-x-0 after:top-full after:bg-gray-200 dark:after:bg-gray-700/60 after:-z-10' : 'max-lg:shadow-sm lg:before:bg-white dark:lg:before:bg-black'} ${variant === 'v2' ? 'dark:before:bg-black' : ''} ${variant === 'v3' ? 'dark:before:bg-black' : ''}`}>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className={`flex items-center justify-between h-16 ${variant === 'v2' || variant === 'v3' ? '' : ''}`}>

            {/* Header: Left side */}
            <div className="flex">

              {/* Hamburger button */}
              <button
                className="text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 lg:hidden"
                aria-controls="sidebar"
                aria-expanded={sidebarOpen}
                onClick={() => { setSidebarOpen(!sidebarOpen) }}
              >
                <span className="sr-only">Open sidebar</span>
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <rect x="4" y="5" width="16" height="2" />
                  <rect x="4" y="11" width="16" height="2" />
                  <rect x="4" y="17" width="16" height="2" />
                </svg>
              </button>

            </div>

            {/* Header: Right side */}
            <div className="flex items-center space-x-3">
              <div>
                {/*
                <button
                  className={`w-8 h-8 flex items-center justify-center hover:bg-gray-100 lg:hover:bg-gray-200 dark:hover:bg-gray-700/50 dark:lg:hover:bg-gray-800 rounded-full ml-3 ${searchModalOpen && 'bg-gray-200 dark:bg-gray-800'}`}
                  onClick={() => { setSearchModalOpen(true) }}
                >
                  <span className="sr-only">Search</span>
                  <svg className="w-4 h-4 text-gray-500/80 dark:text-gray-400/80" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                <SearchModal isOpen={searchModalOpen} setIsOpen={setSearchModalOpen} />
              */}
              </div>
              <div>
              <button
                onClick={toggleMeditation}
                className={`w-8 h-8 flex items-center justify-center hover:bg-gray-100 lg:hover:bg-gray-200 dark:hover:bg-gray-700/50 dark:lg:hover:bg-gray-800 rounded-full ml-3 ${audioPlaying ? 'text-yellow-700' : ''}`}
              >
                <svg className={`w-4 h-4 ${audioPlaying ? 'text-yellow-700' : 'text-gray-500/80 dark:text-gray-400/80'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                  <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                  <g id="SVGRepo_iconCarrier">
                    <path d="M2 12.124C2 6.53269 6.47713 2 11.9999 2C17.5228 2 21.9999 6.53269 21.9999 12.124L21.9999 17.3675C22.0002 18.1844 22.0004 18.7446 21.8568 19.2364C21.576 20.1982 20.9046 20.9937 20.01 21.4245C19.5525 21.6449 19.0059 21.732 18.2088 21.8591L18.0789 21.8799C17.7954 21.9252 17.5532 21.9639 17.3522 21.9839C17.1431 22.0047 16.9299 22.0111 16.7118 21.9676C15.9942 21.8245 15.4024 21.3126 15.1508 20.6172C15.0744 20.4059 15.0474 20.1916 15.035 19.9793C15.0232 19.7753 15.0232 19.527 15.0232 19.2365L15.0231 15.0641C15.0226 14.6386 15.0222 14.2725 15.1195 13.959C15.3422 13.2416 15.9238 12.6975 16.6477 12.5292C16.9641 12.4556 17.3246 12.4849 17.7435 12.5189L17.8367 12.5264L17.9465 12.5352C18.7302 12.5975 19.2664 12.6402 19.7216 12.8106C20.0415 12.9304 20.3381 13.0953 20.6046 13.2976V12.124C20.6046 7.31288 16.7521 3.41266 11.9999 3.41266C7.24776 3.41266 3.39534 7.31288 3.39534 12.124V13.2976C3.66176 13.0953 3.95843 12.9304 4.27829 12.8106C4.73345 12.6402 5.26965 12.5975 6.05335 12.5352L6.16318 12.5264L6.25641 12.5189C6.67534 12.4849 7.03581 12.4556 7.35224 12.5292C8.07612 12.6975 8.65766 13.2416 8.88039 13.959C8.97774 14.2725 8.9773 14.6386 8.97678 15.0641L8.97671 19.2365C8.97671 19.527 8.97672 19.7753 8.96487 19.9793C8.95254 20.1916 8.9255 20.4059 8.84906 20.6172C8.59754 21.3126 8.00574 21.8245 7.28812 21.9676C7.07001 22.0111 6.85675 22.0047 6.64768 21.9839C6.44671 21.9639 6.20449 21.9252 5.92102 21.8799L5.79106 21.8591C4.99399 21.732 4.44737 21.6449 3.98991 21.4245C3.09534 20.9937 2.42388 20.1982 2.14308 19.2364C2.02467 18.8309 2.00404 18.3788 2.0006 17.7747L2 17.5803V12.124Z" fill="currentColor" />
                    <path fillRule="evenodd" clipRule="evenodd" d="M11.9999 5.75C12.4142 5.75 12.7499 6.08579 12.7499 6.5L12.7499 11.5C12.7499 11.9142 12.4142 12.25 11.9999 12.25C11.5857 12.25 11.2499 11.9142 11.2499 11.5L11.2499 6.5C11.2499 6.08579 11.5857 5.75 11.9999 5.75Z" fill="currentColor" />
                    <path fillRule="evenodd" clipRule="evenodd" d="M14.9999 7.25C15.4142 7.25 15.7499 7.58579 15.7499 8V10C15.7499 10.4142 15.4142 10.75 14.9999 10.75C14.5857 10.75 14.2499 10.4142 14.2499 10V8C14.2499 7.58579 14.5857 7.25 14.9999 7.25Z" fill="currentColor" />
                    <path fillRule="evenodd" clipRule="evenodd" d="M8.99995 7.25C9.41416 7.25 9.74995 7.58579 9.74995 8L9.74995 10C9.74995 10.4142 9.41416 10.75 8.99995 10.75C8.58573 10.75 8.24995 10.4142 8.24995 10L8.24995 8C8.24995 7.58579 8.58573 7.25 8.99995 7.25Z" fill="currentColor" />
                  </g>
                </svg>
              </button>
              </div>
              <Notifications align="right" />
              <DropdownHelp align="right" />
              <ThemeToggle />
              {/* Divider */}
              <hr className="w-px h-6 bg-gray-200 dark:bg-gray-700/60 border-none" />
              <DropdownProfile align="right" />
            </div>

          </div>
        </div>
      </header>

      <audio ref={audioRef} src="/audio/meditation20.mp3" preload="none"></audio>
    </>
  )
}
