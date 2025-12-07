// components/AutoLinkMarkdown.tsx
'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAutoLinks } from '@/hooks/useAutoLinks';

interface AutoLinkMarkdownProps {
  content: string;
  currentSlug?: string;
}

export default function AutoLinkMarkdown({ content, currentSlug }: AutoLinkMarkdownProps) {
  const { processAutoLinks, loaded } = useAutoLinks();

  const components = {
    h1: ({ children }: any) => (
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4">
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-10 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mt-6 mb-3">
        {children}
      </h3>
    ),
    h4: ({ children }: any) => (
      <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-4 mb-2">
        {children}
      </h4>
    ),
    p: ({ children }: any) => {
      // Process text nodes for auto-links
      const processedChildren = React.Children.map(children, child => {
        if (typeof child === 'string' && loaded) {
          return processAutoLinks(child, currentSlug);
        }
        return child;
      });

      return (
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
          {processedChildren}
        </p>
      );
    },
    strong: ({ children }: any) => (
      <strong className="font-semibold text-gray-900 dark:text-gray-100">
        {children}
      </strong>
    ),
    em: ({ children }: any) => (
      <em className="italic text-gray-700 dark:text-gray-300">
        {children}
      </em>
    ),
    a: ({ href, children }: any) => (
      <a
        href={href}
        className="text-amber-600 dark:text-amber-400 hover:underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
    ul: ({ children }: any) => (
      <ul className="my-4 ml-4 space-y-2">
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol className="my-4 ml-4 space-y-2 list-decimal list-inside">
        {children}
      </ol>
    ),
    li: ({ children }: any) => {
      // Process text nodes for auto-links in list items too
      const processedChildren = React.Children.map(children, child => {
        if (typeof child === 'string' && loaded) {
          return processAutoLinks(child, currentSlug);
        }
        return child;
      });

      return (
        <li className="text-gray-700 dark:text-gray-300 flex items-start gap-2">
          <span className="text-amber-500 mt-1.5">•</span>
          <span>{processedChildren}</span>
        </li>
      );
    },
    blockquote: ({ children }: any) => (
      <blockquote className="my-6 pl-4 border-l-4 border-amber-500 bg-gray-50 dark:bg-gray-800/50 py-3 pr-4 rounded-r-lg">
        <div className="italic text-gray-600 dark:text-gray-400">
          {children}
        </div>
      </blockquote>
    ),
    hr: () => (
      <hr className="my-8 border-gray-200 dark:border-gray-700" />
    ),
    code: ({ children }: any) => (
      <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm text-gray-800 dark:text-gray-200">
        {children}
      </code>
    ),
    pre: ({ children }: any) => (
      <pre className="my-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto">
        {children}
      </pre>
    ),
  };

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  );
}