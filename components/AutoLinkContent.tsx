// components/AutoLinkContent.tsx
'use client';

import Link from 'next/link';

interface KeywordLink {
  keyword: string;
  slug: string;
  type: 'mystery' | 'enlightenment';
}

// Define your keyword mappings
const keywordLinks: KeywordLink[] = [
  { keyword: 'Illuminati', slug: 'illuminati-history', type: 'mystery' },
  { keyword: 'meditation', slug: 'the-benefits-of-meditation', type: 'enlightenment' },
  { keyword: 'mindfulness', slug: 'mindfulness-practice', type: 'enlightenment' },
  { keyword: 'MK Ultra', slug: 'mk-ultra', type: 'mystery' },
  // Add more as needed
];

export function processAutoLinks(text: string): React.ReactNode[] {
  if (!text) return [text];
  
  let result: React.ReactNode[] = [text];
  
  keywordLinks.forEach(({ keyword, slug, type }) => {
    const newResult: React.ReactNode[] = [];
    
    result.forEach((segment, index) => {
      if (typeof segment !== 'string') {
        newResult.push(segment);
        return;
      }
      
      const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
      const parts = segment.split(regex);
      
      parts.forEach((part, partIndex) => {
        if (part.toLowerCase() === keyword.toLowerCase()) {
          const href = type === 'enlightenment' ? `/enlightenment/${slug}` : `/mysteries/${slug}`;
          newResult.push(
            <Link 
              key={`${index}-${partIndex}`}
              href={href}
              className="text-amber-600 dark:text-amber-400 hover:underline"
            >
              {part}
            </Link>
          );
        } else if (part) {
          newResult.push(part);
        }
      });
    });
    
    result = newResult;
  });
  
  return result;
}