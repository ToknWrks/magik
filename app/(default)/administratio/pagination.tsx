'use client'

interface PaginationClassicProps {
  currentPage: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
}

export default function PaginationClassic({ 
  currentPage, 
  totalItems, 
  itemsPerPage, 
  onPageChange 
}: PaginationClassicProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  if (totalItems === 0) {
    return null
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <nav className="mb-4 sm:mb-0 sm:order-1" role="navigation" aria-label="Navigation">
        <ul className="flex justify-center">
          <li className="ml-3 first:ml-0">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className={`btn bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700/60 ${
                currentPage === 1
                  ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  : 'text-gray-800 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              &lt;- Previous
            </button>
          </li>
          <li className="ml-3 first:ml-0">
            <button
              type="button"
              onClick={handleNext}
              disabled={currentPage >= totalPages}
              className={`btn bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700/60 ${
                currentPage >= totalPages
                  ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  : 'text-gray-800 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Next -&gt;
            </button>
          </li>
        </ul>
      </nav>
      <div className="text-sm text-gray-500 text-center sm:text-left">
        Showing <span className="font-medium text-gray-600 dark:text-gray-300">{startItem}</span> to{' '}
        <span className="font-medium text-gray-600 dark:text-gray-300">{endItem}</span> of{' '}
        <span className="font-medium text-gray-600 dark:text-gray-300">{totalItems}</span> results
      </div>
    </div>
  )
}