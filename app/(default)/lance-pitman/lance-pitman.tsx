// app/lance-pitman/lance-pitman-client.tsx
'use client';

import { useState } from 'react';
import { Boundary } from '@/components/ui/boundary';

interface VideoTab {
  id: string;
  title: string;
  description: string;
  videoId: string;
  duration: string;
  publishedDate: string;
  thumbnail?: string;
  platform: 'youtube' | 'vimeo'; // Add platform field
  isClip?: boolean; // Add this to distinguish clips from regular videos
  clipId?: string;  // Add this for clip IDs
  startTime?: number; // Add this for start times
  endTime?: number; 
}

const videoTabs: VideoTab[] = [

  {
    id: 'Illuminati Post',
    title: 'Post Illuminati ',
    description: 'Lance Pitman Snowboarding ',
    videoId: '91773705',
    duration: '4:15',
    publishedDate: '2001-10-15',
    startTime: 1, // Start at 90 seconds (1:30)
    endTime: 250,
    platform: 'vimeo',
    
  },

  {
    id: 'Illuminati Snowboards',
    title: 'Illuminati ',
    description: 'Lance Pitman Snowboard Video Part - Illuminati Snowboards',
    videoId: '2UbKTmiTb9Y',
    duration: '1:15',
    publishedDate: '2001-10-15',
    startTime: 67, // Start at 90 seconds (1:30)
    endTime: 148,
    platform: 'youtube',
    
  },

  {
    id: 'Community Project',
    title: 'Community Project',
    description: 'Lance Pitman Snowboard Video Part - Community Project',
    videoId: 'rbE80Sq8gKI',
    duration: '50',
    publishedDate: '2024-01-22',
    startTime: 1226, // Start at 2:15
    endTime: 1276,
    platform: 'youtube',
  },

  {
    id: 'This Time',
    title: 'This Time',
    description: 'Lance Pitman Snowboard Video Part - This Time',
    videoId: 'umY9lMlwwQU',
    duration: '3:15',
    publishedDate: '2001-10-15',
    startTime: 1269, // Start at 90 seconds (1:30)
    endTime: 1461,
    platform: 'youtube',
    
  },
  
  // Regular videos without isClip flag
  {
    id: 'Golden Circle',
    title: 'Golden Circle',
    description: 'Lance Pitman Snowboard Video Part - Golden Circle',
    videoId: 'zNpGq0bAMps',
    duration: '1:45',
    publishedDate: '2024-01-30',
    startTime: 1278, 
    endTime: 1365,
    platform: 'youtube',
    
  },
  // For videos that start at specific times
  {
    id: '1999',
    title: '1999',
    description: 'Lance Pitman Snowboard Video Part - 1999',
    videoId: 'xzocv1ApMEE',
    duration: '1:15',
    publishedDate: '2024-01-15',
    startTime: 525,
    endTime: 600,
    platform: 'youtube',
  },
 
  {
    id: 'Blacklight',
    title: 'Blacklight',
    description: 'Lance Pitman Snowboard Video Part - Blacklight',
    videoId: 'BWsdbmQOgEw',
    duration: '2:00',
    publishedDate: '2024-01-20',
    startTime: 1750,
    endTime: 1900,
    platform: 'youtube',
  },

  {
    id: 'Voice',
    title: 'Voice',
    description: 'Lance Pitman Snowboard Video Part - Voice',
    videoId: 'okSa7KjnOGU',
    duration: '1:00',
    publishedDate: '2024-01-15',
    startTime: 810,
    endTime: 910,
    platform: 'youtube',
  },

  {
    id: 'Got Game',
    title: 'Got Game',
    description: 'Lance Pitman Snowboard Video Part - Got Game',
    videoId: 'buMYmB3XpYU',
    duration: '4:00',
    publishedDate: '2024-01-15',
    startTime: 569,
    endTime: 800,
    platform: 'youtube',
  },
 
  {
    id: 'Foreshadow',
    title: 'Foreshadow',
    description: 'Lance Pitman Snowboard Video Part -  Foreshadow',
    videoId: '31770941',
    duration: '2:15',
    publishedDate: '2024-01-18',
    startTime: 213,
    endTime: 600,
    platform: 'vimeo',
  },

  {
    id: 'Goin for Broke',
    title: 'Goin For Broke',
    description: 'Lance Pitman Snowboard Video Part - Goin For Broke',
    videoId: 'BKr8PZmzUYM',
    duration: '1:30',
    publishedDate: '2024-01-15',
    startTime: 520,
    endTime: 690,
    platform: 'youtube',
  },

  {
    id: 'The Regulators',
    title: 'The Regulators',
    description: 'Lance Pitman Snowboard Video Part -  The Regulators',
    videoId: 'x0f24kyi1XY',
    duration: '2:15',
    publishedDate: '2024-01-18',
    startTime: 800,
    endTime: 1200,
    platform: 'youtube',
  },
];

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m${remainingSeconds}s`;
}

export default function LancePitman() {
  const [activeTab, setActiveTab] = useState(videoTabs[0].id);

  const activeVideo = videoTabs.find(tab => tab.id === activeTab);

  return (
    <Boundary label="Lance Pitman - Snowboard Parts">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Lance Pitman - Snowboard Video Parts
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Video parts throughout the years from Lance Pitman's younger days. 
          </p>
        </div>

        {/* Video Player */}
        <div className="mb-8">
          <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden shadow-lg">
            {activeVideo && (
              <iframe
                src={
                  activeVideo.platform === 'vimeo'
                    ? (() => {
                        // Vimeo embed URL construction
                        let vimeoUrl = `https://player.vimeo.com/video/${activeVideo.videoId}`;
                        const params = [];
                        
                        if (activeVideo.startTime) {
                          params.push(`#t=${formatTime(activeVideo.startTime)}`);
                        }
                        
                        // Vimeo doesn't support end time in embed, but we can use time hash
                        return vimeoUrl + (params.length ? params.join('') : '');
                      })()
                    : activeVideo.isClip && activeVideo.clipId
                    ? `https://www.youtube.com/embed/${activeVideo.videoId}?clip=${activeVideo.clipId}`
                    : (() => {
                        // YouTube embed URL construction
                        const params = [];
                        if (activeVideo.startTime) params.push(`start=${activeVideo.startTime}`);
                        if (activeVideo.endTime) params.push(`end=${activeVideo.endTime}`);
                        return `https://www.youtube.com/embed/${activeVideo.videoId}${params.length ? `?${params.join('&')}` : ''}`;
                      })()
                }
                title={activeVideo.title}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
          
          {/* Video Info */}
          {activeVideo && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {activeVideo.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                {activeVideo.description}
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>Duration: {activeVideo.duration}</span>
                <span>Published: {new Date(activeVideo.publishedDate).toLocaleDateString()}</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                  activeVideo.platform === 'youtube' 
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                }`}>
                  {activeVideo.platform === 'youtube' ? 'YouTube' : 'Vimeo'}
                </span>
                {(activeVideo.startTime || activeVideo.endTime) && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                    {activeVideo.startTime ? `Starts at ${formatTime(activeVideo.startTime)}` : ''}
                    {activeVideo.startTime && activeVideo.endTime ? ' - ' : ''}
                    {activeVideo.endTime ? `Ends at ${formatTime(activeVideo.endTime)}` : ''}
                  </span>
                )}
                {activeVideo.isClip && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                    Clip
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {videoTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.title}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {activeVideo && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Current Video Details */}
              <div className="lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  About This page - Lance started Illuminati Snowboards in 1999 and that has evolved into this website. 
                </h3>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                    {activeVideo.description}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    Lances snowboard parts showcase his evolution as a snowboarder and his unique style on the board. From technical tricks to smooth lines, each video part reflects his passion for snowboarding and his contribution to the sport. His journey from snowboarder to entrepreneur to breathwork facilitator is inspiring and shows his dedication to personal growth and helping others, something that he believes snowboarding taught him.
                  </p>
                </div>
              </div>

              {/* Playlist */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Full Series
                </h3>
                <div className="space-y-3">
                  {videoTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-16 h-12 rounded flex-shrink-0 flex items-center justify-center text-xs font-medium ${
                          activeTab === tab.id
                            ? 'bg-amber-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                          {tab.duration}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-medium text-sm leading-tight mb-1 ${
                            activeTab === tab.id
                              ? 'text-amber-900 dark:text-amber-100'
                              : 'text-gray-900 dark:text-gray-100'
                          }`}>
                            {tab.title}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-1">
                            {tab.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${
                              tab.platform === 'youtube' 
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            }`}>
                              {tab.platform === 'youtube' ? 'YT' : 'VM'}
                            </span>
                            {(tab.startTime || tab.endTime) && (
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                {tab.startTime ? `${formatTime(tab.startTime)}` : ''}
                                {tab.startTime && tab.endTime ? '-' : ''}
                                {tab.endTime ? `${formatTime(tab.endTime)}` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            For more content from Lance Pitman, visit our{' '}
            <a 
              href="/astrology" 
              className="text-amber-600 dark:text-amber-400 hover:underline"
            >
              Astrology Archive
            </a>
          </p>
        </div>
      </div>
    </Boundary>
  );
}