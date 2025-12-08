// hooks/useAutoLinks.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import React from 'react';
import Link from 'next/link';

interface KeywordLink {
  keyword: string;
  slug: string;
  type: 'mystery' | 'enlightenment';
}

// Cache keywords across renders
let cachedKeywords: KeywordLink[] | null = null;

export function useAutoLinks(): {
  processAutoLinks: (text: string, currentSlug?: string) => React.ReactNode[];
  loaded: boolean;
} {
  const [keywords, setKeywords] = useState<KeywordLink[]>(cachedKeywords || []);
  const [loaded, setLoaded] = useState<boolean>(!!cachedKeywords);

  useEffect(() => {
    if (cachedKeywords) {
      console.log('Using cached keywords:', cachedKeywords.length);
      setKeywords(cachedKeywords);
      setLoaded(true);
      return;
    }

    const fetchKeywords = async () => {
      try {
        console.log('Fetching keywords...');
        const res = await fetch('/api/keywords');
        const data = await res.json();
        console.log('Keywords fetched:', data);
        const fetchedKeywords: KeywordLink[] = data.keywords || [];
        cachedKeywords = fetchedKeywords;
        setKeywords(fetchedKeywords);
      } catch (error) {
        console.error('Failed to fetch keywords:', error);
        cachedKeywords = [];
        setKeywords([]);
      } finally {
        setLoaded(true);
      }
    };

    fetchKeywords();
  }, []);

  const processAutoLinks = useCallback(
    (text: string, currentSlug?: string): React.ReactNode[] => {
      console.log('processAutoLinks called:', { 
        textLength: text?.length, 
        keywordsCount: keywords.length,
        currentSlug 
      });

      if (!text || keywords.length === 0) {
        return [text];
      }

      // Sort by keyword length (longest first)
      const sortedKeywords = [...keywords].sort(
        (a, b) => b.keyword.length - a.keyword.length
      );

      let result: React.ReactNode[] = [text];
      let linksCreated = 0;

      sortedKeywords.forEach(({ keyword, slug, type }) => {
        if (slug === currentSlug) return;

        const newResult: React.ReactNode[] = [];

        result.forEach((segment, segIndex) => {
          if (typeof segment !== 'string') {
            newResult.push(segment);
            return;
          }

          const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`\\b(${escapedKeyword})\\b`, 'gi');
          const parts = segment.split(regex);

          parts.forEach((part, partIndex) => {
            if (!part) return;

            if (part.toLowerCase() === keyword.toLowerCase()) {
              linksCreated++;
              const href = slug;

              newResult.push(
                <Link
                  key={`link-${segIndex}-${partIndex}-${linksCreated}`}
                  href={href}
                  className="text-amber-600 dark:text-amber-400 hover:underline"
                >
                  {part}
                </Link>
              );
            } else {
              newResult.push(part);
            }
          });
        });

        result = newResult;
      });

      console.log('Links created:', linksCreated);
      return result;
    },
    [keywords]
  );

  return { processAutoLinks, loaded };
}