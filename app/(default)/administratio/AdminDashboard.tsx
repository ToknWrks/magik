// app/administratio/AdminDashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { SelectedItemsProvider } from '@/app/selected-items-context';
import SearchForm from '@/components/search-form';
import DeleteButton from '@/components/delete-button';
import FilterButton from '@/components/dropdown-filter';
import ArticlesTable from './ArticlesTable';
import PaginationClassic from '@/components/pagination-classic';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';

import type { Article } from './ArticlesTable';

function AdminDashboardContent() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [showArticleForm, setShowArticleForm] = useState(false);

  // Add state for the form
  const [articleForm, setArticleForm] = useState<{
    title: string;
    slug: string;
    status: 'draft' | 'published' | 'Verified' | 'Debunked' | 'Partially Debunked';  // Update
    category: string;
    pre_summary: string; // Add
    post_summary: string; // Add
    sections: { title: string; items: { date: string; content: string }[] }[];
  }>({
    title: '',
    slug: '',
    status: 'draft' as 'draft' | 'published' | 'Verified' | 'Debunked' | 'Partially Debunked',  // Update
    category: '',
    pre_summary: '', 
    post_summary: '', 
    sections: [{ title: '', items: [{ date: '', content: '' }] }]
  });

  // Functions to manage sections and items
  const addSection = () => {
    setArticleForm(prev => ({
      ...prev,
      sections: [...prev.sections, { title: '', items: [{ date: '', content: '' }] }]
    }));
  };

  const removeSection = (index: number): void => {
    setArticleForm(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index)
    }));
  };

  const addItem = (sectionIndex: number): void => {
    setArticleForm(prev => {
      const newSections = [...prev.sections];
      newSections[sectionIndex].items.push({ date: '', content: '' });
      return { ...prev, sections: newSections };
    });
  };

  const removeItem = (sectionIndex: number, itemIndex: number): void => {
    setArticleForm(prev => {
      const newSections = [...prev.sections];
      newSections[sectionIndex].items = newSections[sectionIndex].items.filter((_, i) => i !== itemIndex);
      return { ...prev, sections: newSections };
    });
  };

  const updateSection = (sectionIndex: number, field: 'title', value: string) => {
    setArticleForm(prev => {
      const newSections = [...prev.sections];
      newSections[sectionIndex][field] = value;
      return { ...prev, sections: newSections };
    });
  };

  const updateItem = (sectionIndex: number, itemIndex: number, field: keyof typeof articleForm.sections[0]['items'][0], value: string) => {
    setArticleForm(prev => {
      const newSections = [...prev.sections];
      newSections[sectionIndex].items[itemIndex][field] = value;
      return { ...prev, sections: newSections };
    });
  };

  // Handle form submit
  interface ArticleFormData {
    title: string;
    slug: string;
    content: string;
    status: 'draft' | 'published';
    category: string;
  }

  interface ArticleResponse {
    article: Article;
  }

  const handleArticleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = {
      title: articleForm.title,
      slug: articleForm.slug,
      content: JSON.stringify(articleForm.sections),
      pre_summary: articleForm.pre_summary,
      post_summary: articleForm.post_summary,
      status: articleForm.status,
      category: articleForm.category,
    };
    const method = editingArticle ? 'PUT' : 'POST';
    const body = editingArticle ? { ...data, id: editingArticle.id } : data;
    const res = await fetch('/api/admin/articles', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = await res.json();
    setArticles(prev => editingArticle ? prev.map(a => a.id === result.article.id ? result.article : a) : [...prev, result.article]);
    setShowArticleForm(false);
    setEditingArticle(null);
  };
  
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  const handleEdit = (article: Article) => {
    setArticleForm({
      title: article.title,
      slug: article.slug,
      status: article.status as 'draft' | 'published' | 'Verified' | 'Debunked' | 'Partially Debunked',  // Update
      category: article.category,
      pre_summary: article.pre_summary || '',  // Add
      post_summary: article.post_summary || '',  // Add
      sections: JSON.parse(article.content) || [{ title: '', items: [{ date: '', content: '' }] }]
    });
    setEditingArticle(article);
    setShowArticleForm(true);
  };

  const handleDelete = async (id: string) => {
    await fetch('/api/admin/articles', { method: 'DELETE', body: JSON.stringify({ id }) });
    setArticles(prev => prev.filter(a => a.id !== id));
  };

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const res = await fetch('/api/admin/articles');
        console.log('Response status:', res.status);
        const text = await res.text();  // Get text first
        console.log('Response text:', text);
        const data = JSON.parse(text);  // Then parse
        console.log('Fetched data:', data);
        setArticles(data.articles || []);
      } catch (error) {
        console.error('Fetch error:', error);
      }
    };
    fetchArticles();
  }, []);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      {/* Page header */}
      <div className="sm:flex sm:justify-between sm:items-center mb-5">
        {/* Left: Title */}
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Admin Dashboard</h1>
        </div>

        {/* Right: Actions */}
        <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
          {/* Search form */}
          <SearchForm placeholder="Search articles…" />
          {/* Create article button */}
          <button 
            onClick={() => setShowArticleForm(true)}
            className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white"
          >
            <svg className="fill-current shrink-0 xs:hidden" width="16" height="16" viewBox="0 0 16 16">
              <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
            </svg>
            <span className="max-xs:sr-only">Create Article</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="sm:flex sm:justify-between sm:items-center mb-5">
        {/* Left side */}
        <div className="mb-4 sm:mb-0">
          <ul className="flex flex-wrap -m-1">
            <li className="m-1">
              <button className="inline-flex items-center justify-center text-sm font-medium leading-5 rounded-full px-3 py-1 border border-transparent shadow-sm bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-800 transition">All <span className="ml-1 text-gray-400 dark:text-gray-500">{articles.length}</span></button>
            </li>
            <li className="m-1">
              <button className="inline-flex items-center justify-center text-sm font-medium leading-5 rounded-full px-3 py-1 border border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 transition">Published <span className="ml-1 text-gray-400 dark:text-gray-500">{articles.filter(a => a.status === 'published').length}</span></button>
            </li>
            <li className="m-1">
              <button className="inline-flex items-center justify-center text-sm font-medium leading-5 rounded-full px-3 py-1 border border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 transition">Draft <span className="ml-1 text-gray-400 dark:text-gray-500">{articles.filter(a => a.status === 'draft').length}</span></button>
            </li>
          </ul>
        </div>

        {/* Right side */}
        <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
          {/* Delete button */}
          <DeleteButton />
          {/* Filter button */}
          <FilterButton align="right" />
        </div>
      </div>

      {/* Table */}
      <ArticlesTable articles={articles} onEdit={handleEdit} onDelete={handleDelete} />

      {/* Pagination */}
      <div className="mt-8">
        <PaginationClassic />
      </div>

      {/* Article Form Modal */}
      {showArticleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-none p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-6">{editingArticle ? 'Edit Article' : 'Create Article'}</h2>
            <form onSubmit={handleArticleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Title</label>
                <input
                  type="text"
                  value={articleForm.title}
                  onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Slug</label>
                <input
                  type="text"
                  value={articleForm.slug}
                  onChange={(e) => setArticleForm({ ...articleForm, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Pre-Summary</label>
                <textarea
                  value={articleForm.pre_summary}
                  onChange={(e) => setArticleForm({ ...articleForm, pre_summary: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  rows={3}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Post-Summary</label>
                <MDEditor
                  value={articleForm.post_summary}
                  onChange={(value) => setArticleForm({ ...articleForm, post_summary: value || '' })}
                  preview="live"
                  hideToolbar={false}
                  visibleDragbar={false}
                  className="dark:bg-gray-400"
                />
              </div>

              {/* Sections */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Sections</label>
                {articleForm.sections.map((section, sIndex) => (
                  <div key={sIndex} className="border border-gray-300 rounded p-4 mb-4">
                    <div className="flex justify-between mb-2">
                      <input
                        type="text"
                        placeholder="Section Title"
                        value={section.title}
                        onChange={(e) => updateSection(sIndex, 'title', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded mr-2 dark:bg-gray-700 dark:text-gray-100"
                      />
                      <button type="button" onClick={() => removeSection(sIndex)} className="px-2 py-1 bg-red-600 text-white rounded">Remove Section</button>
                    </div>
                    {section.items.map((item, iIndex) => (
                      <div key={iIndex} className="mb-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Date"
                            value={item.date}
                            onChange={(e) => updateItem(sIndex, iIndex, 'date', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded mr-2 dark:bg-gray-700 dark:text-gray-100"
                          />
                          <textarea
                            placeholder="Content"
                            value={item.content}
                            onChange={(e) => updateItem(sIndex, iIndex, 'content', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded mr-2 dark:bg-gray-700 dark:text-gray-100"
                            rows={3}
                          />
                          <button type="button" onClick={() => removeItem(sIndex, iIndex)} className="px-2 py-1 bg-red-600 text-white rounded">Remove</button>
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={() => addItem(sIndex)} className="px-4 py-2 bg-gray-700 text-white rounded">Add Item</button>
                  </div>
                ))}
                <button type="button" onClick={addSection} className="px-4 py-2 bg-gray-600 text-white rounded">Add Section</button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={articleForm.status}
                  onChange={(e) => setArticleForm({ ...articleForm, status: e.target.value as any })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded mr-2 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="Verified">Verified</option>
                  <option value="Debunked">Debunked</option>
                  <option value="Partially Debunked">Partially Debunked</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Category</label>
                <input
                  type="text"
                  value={articleForm.category}
                  onChange={(e) => setArticleForm({ ...articleForm, category: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded mr-2 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Save</button>
                <button type="button" onClick={() => setShowArticleForm(false)} className="px-4 py-2 bg-gray-600 text-white rounded">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <SelectedItemsProvider>
      <AdminDashboardContent />
    </SelectedItemsProvider>
  )
}


