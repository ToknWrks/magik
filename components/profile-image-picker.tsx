'use client';

// components/ProfileImagePicker.tsx
// Modal that shows the avatar inventory (profile_images table) as a thumbnail
// grid. Selecting one hands the public path back to the parent via onSelected.
import { useEffect, useState } from 'react';

interface PickerImage {
  id: string;
  path: string;
}

export default function ProfileImagePicker({
  open,
  currentPath,
  onClose,
  onSelected,
  onUpload,
}: {
  open: boolean;
  currentPath: string | null;
  onClose: () => void;
  onSelected: (path: string) => void;
  onUpload?: () => void;
}) {
  const [images, setImages] = useState<PickerImage[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError('');
    fetch(`/api/profile-images?page=${page}`, { credentials: 'include' })
      .then(async r => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then(data => {
        setImages(data.images || []);
        setPages(data.pages || 1);
      })
      .catch(() => setError('Failed to load images. Please try again.'))
      .finally(() => setLoading(false));
  }, [open, page]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div className="relative flex min-h-full items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700/60">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Choose your profile image</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Pick from the Illuminati collection</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Grid */}
          <div className="grow overflow-y-auto px-6 py-5">
            {loading ? (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                {Array.from({ length: 18 }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-10 text-sm text-red-500">{error}</div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                {onUpload && (
                  <button
                    onClick={onUpload}
                    className="aspect-square rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-1.5 text-gray-400 dark:text-gray-500 hover:border-yellow-600 hover:text-yellow-700 dark:hover:text-yellow-500 transition-colors"
                    aria-label="Upload your own image"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="text-[10px] font-medium leading-tight text-center px-1">Upload your own</span>
                  </button>
                )}
                {images.map(img => (
                  <button
                    key={img.id}
                    onClick={() => onSelected(img.path)}
                    className={`relative aspect-square rounded-xl overflow-hidden group focus:outline-none transition-all ${
                      currentPath === img.path
                        ? 'ring-2 ring-yellow-600 ring-offset-2 ring-offset-white dark:ring-offset-gray-800'
                        : 'hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600'
                    }`}
                    aria-label="Select this image"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.path}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    {currentPath === img.path && (
                      <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-yellow-600 rounded-full flex items-center justify-center shadow">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer / pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 dark:border-gray-700/60">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Previous
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Page {page} of {pages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page >= pages || loading}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
