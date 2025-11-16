'use client'; // Mark as client component

import IlluminatiArchive from './IlluminatiArchive'; // Adjust path as needed

// Placeholder for LinkStatus if not defined elsewhere
function LinkStatus() {
  return <span className="text-xs text-gray-500">Link</span>;
}

export default function DashboardClient() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-20 pb-8 w-full max-w-[96rem] mx-auto">  {/* Increased pt-8 to pt-20 for more top space */}
      {/* Dashboard actions */}
      <div className="sm:flex sm:justify-between sm:items-center mb-8">
        {/* Left: Title */}
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Dashboard</h1>
        </div>
        {/* Right: Actions */}
        <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
          {/* Add view button */}
          <button className="btn bg-gray-950 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white">
            <svg className="fill-current shrink-0 xs:hidden" width="16" height="16" viewBox="0 0 16 16">
              <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
            </svg>
            <span className="max-xs:sr-only">Add View</span>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-12 gap-6">
        {/* Illuminati Archive Section */}
        <div className="col-span-12 pt-8"> {/* Changed mt-8 to pt-8 for top padding inside the div */}
          <IlluminatiArchive />
        </div>
      </div>
    </div>
  );
}