// app/articles/[slug]/article-client.tsx
'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';

interface Article {
  title: string;
  content: string; // JSON string of sections
  status: string;
  category: string;
  pre_summary?: string;
  post_summary?: string;
  created_at: string
  type: 'article' | 'template'
}

interface SectionItem {
  date: string;
  content: string;
}

interface Section {
  title: string;
  items: SectionItem[];
}

interface ArticleClientProps {
  article: Article;
}

export default function ArticleClient({ article }: ArticleClientProps) {
  let sections = [];
  try {
    sections = JSON.parse(article.content); // Parse sections
  } catch (error) {
    console.error('Invalid JSON in article content:', error);
    sections = [{ title: 'Content', items: [{ date: '', content: article.content }] }]; // Fallback
  }

  return (
    <div className="relative bg-white dark:bg-gray-900 h-full">
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
        <div className="max-w-3xl m-auto">
          <div className="xl:-translate-x-16">
            {/* Article Title */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{article.title}</h1>
              <div className="flex justify-center mt-4">
                <div className="text-xs inline-flex font-medium bg-green-500/20 text-green-700 rounded-full text-center px-2.5 py-1">
                  {article.status}
                </div>
              </div>
            </div>

            {/* Pre-Summary */}
            {article.pre_summary && (
              <div className="mb-8">
                <p className="text-gray-600 dark:text-gray-400 text-center">{article.pre_summary}</p>
              </div>
            )}

            {sections.map((section: any, sIndex: number) => (
              <article key={sIndex} className="pt-6">
                <div className="xl:flex">
                  <div className="w-32 shrink-0">
                    <h2 className="text-xl leading-snug font-bold text-gray-800 dark:text-gray-100 xl:leading-7 mb-4 xl:mb-0">
                      {section.title}
                    </h2>
                  </div>
                  <div className="grow pb-6 border-b border-gray-200 dark:border-black">
                    <header>
                      <div className="flex flex-nowrap items-center space-x-2 mb-6">
                        <div className="text-xs inline-flex font-medium bg-black-500/20 text-green-700 rounded-full text-center px-2.5 py-1">
                         
                        </div>
                      </div>
                    </header>
                    <ul className="-my-2">
                      {section.items.map((item: any, iIndex: number) => (
                        <li key={iIndex} className="relative py-2">
                          <div className="flex items-center mb-1">
                            <div className="absolute left-0 h-full w-0.5 bg-gray-200 dark:bg-gray-700 self-start ml-2.5 -translate-x-1/2 translate-y-3" aria-hidden="true"></div>
                            <div className="absolute left-0 rounded-full bg-yellow-700" aria-hidden="true">
                              <svg className="fill-current text-white" width="20" height="20" viewBox="0 0 20 20">
                                <path d="M14.4 8.4L13 7l-4 4-2-2-1.4 1.4L9 13.8z" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 pl-9">{item.date}</h3>
                          </div>
                          <div className="pl-9">
                            <ReactMarkdown remarkPlugins={[remarkBreaks]}>{item.content}</ReactMarkdown>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            ))}

            {/* Post-Summary */}
            {article.post_summary && (
              <div className="mt-8">
                <p className="text-gray-600 dark:text-gray-400 text-center">{article.post_summary}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}