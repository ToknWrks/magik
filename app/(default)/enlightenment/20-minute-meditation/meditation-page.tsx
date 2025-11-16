// app/meditation/meditation-page.tsx
'use client';

export default function MeditationPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          20-Minute Meditation
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Take a moment to relax and center yourself with this guided meditation.
        </p>
        
        <audio controls className="w-full">
          <source src="/audio/meditation20.mp3" type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
        
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
          Duration: ~20 minutes
        </p>
        
        <p className="text-xs text-gray-400 dark:text-gray-600 mt-8">
          Attribution: This meditation is inspired by mindful breathing practices from{' '}
          <a 
            href="https://archive.org/details/Music-20Min" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Internet Archive
          </a>.
        </p>
      </div>
    </div>
  );
}