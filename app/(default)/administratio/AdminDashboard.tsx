// app/administratio/AdminDashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { SelectedItemsProvider } from '@/app/selected-items-context';
import SearchForm from '@/components/search-form';
import DeleteButton from '@/components/delete-button';
import FilterButton from './dropdown-filter';
import ArticlesTable from './ArticlesTable';
import PaginationClassic from '@/components/pagination-classic';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import TemplatesTable from './TemplatesTable';

// Update Article interface to include type
export interface Article {
  id: string
  title: string
  slug: string
  status: 'draft' | 'published' | 'verified' | 'debunked' | 'partially debunked'
  category: string
  content: string
  pre_summary: string
  post_summary: string
  created_at: string
  type: 'article' | 'template' 
}

interface Template {
  id: string
  title: string
  slug: string
  status: string
  category: string
  content: string
  created_at: string
  type: 'article' | 'template'  // Allow both
  key_facts?: string[]
  debunking_points?: string[]
  sources?: string[]
  difficulty_level?: string
  is_active?: boolean
  content_type?: string
  article_content?: string
}

function AdminDashboardContent() {
  const [articles, setArticles] = useState<(Article | Template)[]>([]);
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [templates, setTemplatess] = useState<Template[]>([]);

  // Add state for the form
  const [articleForm, setArticleForm] = useState<{
    title: string;
    slug: string;
    status: 'draft' | 'published' | 'verified' | 'debunked' | 'partially debunked';  // Update
    category: string;
    pre_summary: string; // Add
    post_summary: string; // Add
    sections: { title: string; items: { date: string; content: string }[] }[];
    type: 'article' | 'template';
  }>({
    title: '',
    slug: '',
    status: 'draft' as 'draft' | 'published' | 'verified' | 'debunked' | 'partially debunked',  // Update
    category: '',
    pre_summary: '',
    post_summary: '',
    sections: [{ title: '', items: [{ date: '', content: '' }] }],
    type: 'article'
  });

  // Update contentType to distinguish
  const [contentType, setContentType] = useState<'all' | 'articles' | 'templates'>('all');

  // Add search state and logic
  const [searchTerm, setSearchTerm] = useState('');

  // Add state for template form
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    title: '',
    slug: '',
    category: '',
    status: 'draft',
    key_facts: '',
    debunking_points: '',
    sources: '',
    difficulty_level: 'medium',
    is_active: true,  // Keep for availability
    content_type: 'ai',  // Add for content type
    article_content: '',
  });

  // Add state for filter
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

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
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  
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
    const apiRoute = articleForm.type === 'template' ? '/api/admin/templates' : '/api/admin/articles';
    const res = await fetch(apiRoute, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const result = await res.json();
    setArticles(prev => editingArticle ? prev.map(a => a.id === result.article.id ? result.article : a) : [...prev, result.article]);
    setShowArticleForm(false);
    setEditingArticle(null);
  };
  
  const handleEditArticle = (article: Article) => {
    setArticleForm({
      title: article.title,
      slug: article.slug,
      status: article.status,
      category: article.category,
      pre_summary: article.pre_summary || '',
      post_summary: article.post_summary || '',
      sections: JSON.parse(article.content) || [{ title: '', items: [{ date: '', content: '' }] }],
      type: 'article'
    });
    setEditingArticle(article);
    setShowArticleForm(true);
  };

  const handleEditTemplate = (template: Template) => {
    setTemplateForm({
      title: template.title,
      slug: template.slug,
      category: template.category,
      status: template.status,
      key_facts: template.key_facts?.join('\n') || '',
      debunking_points: template.debunking_points?.join('\n') || '',
      sources: template.sources?.join('\n') || '',
      difficulty_level: template.difficulty_level || 'medium',
      is_active: template.is_active ?? true,
      content_type: template.content_type || 'ai',
      article_content: template.article_content || '',
    });
    setEditingTemplate(template);
    setShowTemplateForm(true);
  };

  const handleDelete = async (id: string) => {
    const item = articles.find(a => a.id === id);
    const apiRoute = item?.type === 'template' ? '/api/admin/templates' : '/api/admin/articles';
    await fetch(`${apiRoute}/${id}`, { method: 'DELETE' });
    setArticles(prev => prev.filter(a => a.id !== id));
  };

  // Add handleTemplateSubmit
  interface TemplateFormData {
    title: string;
    content: string;
  }

  interface TemplateForm {
    title: string;
    slug: string;
    category: string;
    status: string;
    key_facts: string;
    debunking_points: string;
    sources: string;
    difficulty_level: string;
    is_active: boolean;
    content_type: string;
    article_content: string;
  }

  interface TemplateResponse {
    template: Template;
  }

  const handleTemplateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const method = editingTemplate ? 'PUT' : 'POST';
    const body = editingTemplate ? { ...templateForm, id: editingTemplate.id } : templateForm;
    const res = await fetch(editingTemplate ? `/api/admin/templates/${editingTemplate.id}` : '/api/admin/templates', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) {
      const result = await res.json();
      setArticles(prev => editingTemplate ? prev.map(a => a.id === result.template.id ? result.template : a) : [...prev, result.template]);
      setShowTemplateForm(false);
      setEditingTemplate(null);
    } else {
      console.error('Template creation failed');
    }
  };

  // Update fetch function
  useEffect(() => {
    const fetchContent = async () => {
      try {
        if (contentType === 'all') {
          const [articlesRes, templatesRes] = await Promise.all([
            fetch('/api/admin/articles'),
            fetch('/api/admin/templates')
          ]);
          const articlesData = await articlesRes.json();
          const templatesData = await templatesRes.json();
            const combined = [
            ...(articlesData.articles || []).map((a: Article) => ({ ...a, type: 'article' })),
            ...(templatesData.templates || []).map((t: Template) => ({ ...t, type: 'template' }))
            ];
          setArticles(combined);
        } else {
          const res = await fetch(`/api/admin/${contentType}`);
          const data = await res.json();
          setArticles((data[contentType] || []).map((item: Partial<Article>) => ({ ...item, type: contentType.slice(0, -1) })));
        }
      } catch (error) {
        console.error('Fetch error:', error);
      }
    };
    fetchContent();
  }, [contentType]);

  // Update fetch or filter articles based on search
  const filteredArticles = articles.filter(article => {
    console.log('Filtering article:', article);  // Add logging
    if (filter === 'published') return article.status === 'published';
    if (filter === 'draft') return article.status === 'draft';
    return true;  // All
  }).filter(article => {
    console.log('Searching article:', article);  // Add logging
    return (article?.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
           (article?.slug?.toLowerCase() || '').includes(searchTerm.toLowerCase());
  });

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
          <input
            type="text"
            placeholder="Search articles…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          {/* Create article button */}
          <button 
            onClick={() => setShowArticleForm(true)}
            className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white"
          >
            <svg className="fill-current shrink-0 xs:hidden" width="16" height="16" viewBox="0 0 16 16">
              <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4-1 1-1h6v6c0-.6.4-1 1-1s1 .4 1 1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
            </svg>
            <span className="max-xs:sr-only">Create Article</span>
          </button>
          {/* Create article button */}
          <button 
            onClick={() => setShowTemplateForm(true)}
            className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white"
          >
            <svg className="fill-current shrink-0 xs:hidden" width="16" height="16" viewBox="0 0 16 16">
              <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4-1 1-1h6v6c0-.6.4-1 1-1s1 .4 1 1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
            </svg>
            <span className="max-xs:sr-only">Create Template</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="sm:flex sm:justify-between sm:items-center mb-5">
        {/* Left side */}
        <div className="mb-4 sm:mb-0">
          <ul className="flex flex-wrap -m-1">
            <li className="m-1">
              <button onClick={() => { setFilter('all'); setContentType('all'); }} className={`inline-flex items-center justify-center text-sm font-medium leading-5 rounded-full px-3 py-1 border border-transparent shadow-sm ${filter === 'all' ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-800' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400'} transition`}>All <span className="ml-1 text-gray-400 dark:text-gray-500">{filteredArticles.length}</span></button>
            </li>
            <li className="m-1">
              <button onClick={() => setContentType('articles')} className={`inline-flex items-center justify-center text-sm font-medium leading-5 rounded-full px-3 py-1 border border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm ${contentType === 'articles' ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-800' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400'} transition`}>Articles</button>
            </li>
            <li className="m-1">
              <button onClick={() => setContentType('templates')} className={`inline-flex items-center justify-center text-sm font-medium leading-5 rounded-full px-3 py-1 border border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm ${contentType === 'templates' ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-800' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400'} transition`}>Templates</button>
            </li>
            <li className="m-1">
              <button onClick={() => setFilter('published')} className={`inline-flex items-center justify-center text-sm font-medium leading-5 rounded-full px-3 py-1 border border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm ${filter === 'published' ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-800' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400'} transition`}>Published <span className="ml-1 text-gray-400 dark:text-gray-500">{articles.filter(a => a?.status === 'published').length}</span></button>
            </li>
            <li className="m-1">
              <button onClick={() => setFilter('draft')} className={`inline-flex items-center justify-center text-sm font-medium leading-5 rounded-full px-3 py-1 border border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm ${filter === 'draft' ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-800' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400'} transition`}>Draft <span className="ml-1 text-gray-400 dark:text-gray-500">{articles.filter(a => a?.status === 'draft').length}</span></button>
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
      {contentType === 'articles' && <ArticlesTable articles={articles.filter(a => a.type === 'article') as Article[]} onEdit={handleEditArticle} onDelete={handleDelete} />}
      {contentType === 'templates' && <TemplatesTable templates={articles.filter(a => a.type === 'template') as Template[]} onEdit={handleEditTemplate} onDelete={handleDelete} />}
      {contentType === 'all' && (
        <>
          <ArticlesTable articles={articles.filter(a => a.type === 'article') as Article[]} onEdit={handleEditArticle} onDelete={handleDelete} />
          <TemplatesTable templates={articles.filter(a => a.type === 'template') as Template[]} onEdit={handleEditTemplate} onDelete={handleDelete} />
        </>
      )}

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
                  <option value="verified">Verified</option>
                  <option value="debunked">Debunked</option>
                  <option value="partially debunked">Partially Debunked</option>
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

      {/* Template Form Modal */}
      {showTemplateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-none p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-6">{editingArticle ? 'Edit Template' : 'Create Template'}</h2>
            <form onSubmit={handleTemplateSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={templateForm.title}
                  onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Slug</label>
                <input
                  type="text"
                  value={templateForm.slug}
                  onChange={(e) => setTemplateForm({ ...templateForm, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Category</label>
                <input
                  type="text"
                  value={templateForm.category}
                  onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={templateForm.status}
                  onChange={(e) => setTemplateForm({ ...templateForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Key Facts</label>
                <textarea
                  value={templateForm.key_facts}
                  onChange={(e) => setTemplateForm({ ...templateForm, key_facts: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  rows={3}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Debunking Points</label>
                <textarea
                  value={templateForm.debunking_points}
                  onChange={(e) => setTemplateForm({ ...templateForm, debunking_points: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  rows={3}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Sources</label>
                <textarea
                  value={templateForm.sources}
                  onChange={(e) => setTemplateForm({ ...templateForm, sources: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  rows={3}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Difficulty Level</label>
                <select
                  value={templateForm.difficulty_level}
                  onChange={(e) => setTemplateForm({ ...templateForm, difficulty_level: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={templateForm.is_active}
                    onChange={(e) => setTemplateForm({ ...templateForm, is_active: e.target.checked })}
                    className="form-checkbox"
                  />
                  <span className="ml-2">Is Active</span>
                </label>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Content Type</label>
                <select
                  value={templateForm.content_type}
                  onChange={(e) => setTemplateForm({ ...templateForm, content_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="ai">AI Generated</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Article Content</label>
                <MDEditor
                  value={templateForm.article_content}
                  onChange={(value) => setTemplateForm({ ...templateForm, article_content: value || '' })}
                  preview="live"
                  hideToolbar={false}
                  visibleDragbar={false}
                  className="dark:bg-gray-800"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Save</button>
                <button type="button" onClick={() => setShowTemplateForm(false)} className="px-4 py-2 bg-gray-600 text-white rounded">Cancel</button>
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
