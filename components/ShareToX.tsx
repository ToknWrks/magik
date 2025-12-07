// app/components/ShareToX.tsx
'use client';

interface ShareToXProps {
  title: string;
  url?: string;
  hashtags?: string[];
  className?: string;
}

export default function ShareToX({ 
  title, 
  url, 
  hashtags = ['realilluminati'],
  className = ''
}: ShareToXProps) {
  const handleShare = () => {
    const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    const hashtagString = hashtags.length > 0 ? ` ${hashtags.map(h => `#${h}`).join(' ')}` : '';
    const tweetText = encodeURIComponent(`${title}${hashtagString} ${currentUrl}`);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  };

  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center gap-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-xs ${className}`}
      title="Share on X"
    >
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
      <span>Share</span>
    </button>
  );
}