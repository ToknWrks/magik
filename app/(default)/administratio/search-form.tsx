// components/admin-search-form.tsx
'use client'

import { useState } from 'react'

interface AdminSearchFormProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
}

export default function AdminSearchForm({ 
  placeholder = 'Search…',
  value = '',
  onChange
}: AdminSearchFormProps) {
  return (
    <form className="relative" onSubmit={(e) => e.preventDefault()}>
      <label htmlFor="admin-search" className="sr-only">Search</label>
      <input 
        id="admin-search" 
        className="form-input pl-9 bg-white dark:bg-gray-800" 
        type="search" 
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      />
      <button className="absolute inset-0 right-auto group" type="submit" aria-label="Search">
        <svg className="shrink-0 fill-current text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400 ml-3 mr-2" width="16" height="16" viewBox="0 0 16 16">
          <path d="M7 14c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zM7 2C4.243 2 2 4.243 2 7s2.243 5 5 5 5-2.243 5-5-2.243-5-5-5z" />
          <path d="M15.707 14.293L13.314 11.9a8.019 8.019 0 01-1.414 1.414l2.393 2.393a.997.997 0 001.414 0 .999.999 0 000-1.414z" />
        </svg>
      </button>
      {value && (
        <button 
          type="button"
          onClick={() => onChange?.('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </form>
  )
}