'use client'

import { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

export default function Datepicker({ align }: {
  align?: 'left' | 'right'
}) {
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 6)))
  const [endDate, setEndDate] = useState(new Date())

  return (
    <div className="relative">
      <DatePicker
        selected={startDate}
        onChange={(dates) => {
          const [start, end] = dates
          if (start) setStartDate(start)
          if (end) setEndDate(end)
        }}
        startDate={startDate}
        endDate={endDate}
        selectsRange
        className="form-input pl-9 dark:bg-gray-800 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 font-medium w-[15.5rem]"
      />
      <div className="absolute inset-0 right-auto flex items-center pointer-events-none">
        <svg className="fill-current text-gray-400 dark:text-gray-500 ml-3" width="16" height="16" viewBox="0 0 16 16">
          <path d="M5 4a1 1 0 0 0 0 2h6a1 1 0 1 0 0-2H5Z" />
          <path d="M4 0a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4V4a4 4 0 0 0-4-4H4ZM2 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4Z" />
        </svg>
      </div>
    </div>
  )
}