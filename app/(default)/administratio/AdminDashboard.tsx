// app/administratio/AdminDashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { SelectedItemsProvider } from '@/app/selected-items-context';
import DeleteButton from '@/components/delete-button';
import FilterButton from './dropdown-filter';
import ArticlesTable from './ArticlesTable';
import PaginationClassic from './pagination';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import TemplatesTable from './TemplatesTable';
import AdminSearchForm from './search-form';
import ArticleFormModal, { ArticleFormData, Article as ArticleType } from './ArticleFormModal';
import TemplateFormModal, { TemplateFormData, Template as TemplateType } from './TemplateFormModal';
import EnlightenmentFormModal, { EnlightenmentFormData, EnlightenmentTemplate } from './EnlightenmentFormModal';
import EnlightenmentTable from './EnlightenmentTable';

// Rename Article and Template interfaces
export interface DashboardArticle {
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

interface DashboardTemplate {
  id: string
  title: string
  slug: string
  status: string
  category: string
  content: string
  created_at: string
  type: 'article' | 'template'
  key_facts?: string[]
  debunking_points?: string[]
  sources?: string[]
  difficulty_level?: string
  is_active?: boolean
  content_type?: string
  article_content?: string
}

function AdminDashboardContent() {
  const [articles, setArticles] = useState<(DashboardArticle | DashboardTemplate)[]>([]);
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [templates, setTemplates] = useState<DashboardTemplate[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Or make this configurable

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
  const [contentType, setContentType] = useState<'all' | 'articles' | 'templates' | 'enlightenment'>('all');

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

  // Add state for enlightenment form
  const [showEnlightenmentForm, setShowEnlightenmentForm] = useState(false);
  const [editingEnlightenment, setEditingEnlightenment] = useState<EnlightenmentTemplate | null>(null);
  const [enlightenmentTemplates, setEnlightenmentTemplates] = useState<EnlightenmentTemplate[]>([]);

  // Add state for filter
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  // Filter content based on search term
  const filteredContent = (contentType === 'enlightenment' ? enlightenmentTemplates : articles)
  .filter(item => 
    searchTerm === '' ||
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginate filtered content
  const paginatedContent = filteredContent.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, contentType]);

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
  interface ArticleResponse {
    article: DashboardArticle;
  }
  const [editingArticle, setEditingArticle] = useState<DashboardArticle | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<DashboardTemplate | null>(null);
  
  const handleArticleSubmit = async (data: ArticleFormData) => {
    try {
      const payload = {
        title: data.title,
        slug: data.slug,
        content: JSON.stringify(data.sections),
        pre_summary: data.pre_summary,
        post_summary: data.post_summary,
        status: data.status,
        category: data.category,
      };
      
      // For updates, include the id in the payload
      if (editingArticle) {
        (payload as any).id = editingArticle.id;
      }
      
      const method = editingArticle ? 'PUT' : 'POST';
      const url = '/api/admin/articles';  // Always use the same URL
      
      console.log('Saving article:', method, payload);
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      
      // Check response
      const text = await res.text();
      console.log('Response:', res.status, text);
      
      if (!res.ok) {
        let errorMessage = 'Failed to save article';
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // text wasn't JSON
        }
        throw new Error(errorMessage);
      }
      
      // Refresh content
      const articlesRes = await fetch('/api/admin/articles', { credentials: 'include' });
      const templatesRes = await fetch('/api/admin/templates', { credentials: 'include' });
      const articlesData = await articlesRes.json();
      const templatesData = await templatesRes.json();
      const combined = [
        ...(articlesData.articles || []).map((a: ArticleType) => ({ ...a, type: 'article' as const })),
        ...(templatesData.templates || []).map((t: TemplateType) => ({ ...t, type: 'template' as const }))
      ];
      setArticles(combined);
      setShowArticleForm(false);
      setEditingArticle(null);
    } catch (error) {
      console.error('Article save error:', error);
      throw error;
    }
  };
  
  const handleEditArticle = (article: DashboardArticle) => {
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

  const handleEditTemplate = (template: DashboardTemplate) => {
    setTemplateForm({
      title: template.title,
      slug: template.slug,
      category: template.category,
      status: template.status,
      key_facts: template.key_facts?.join('\n') || '',
      debunking_points: template.key_facts?.join('\n') || '',
      sources: template.sources?.join('\n') || '',
      difficulty_level: template.difficulty_level || 'medium',
      is_active: template.is_active ?? true,
      content_type: template.content_type || 'ai',
      article_content: template.article_content || '',
    });
    setEditingTemplate(template);
    setShowTemplateForm(true);
  };

  const handleEditEnlightenment = (template: EnlightenmentTemplate) => {
    setEditingEnlightenment(template);
    setShowEnlightenmentForm(true);
  };

  // Delete article
  const handleDeleteArticle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) {
      return;
    }
    
    try {
      // Use the main route with id in body (matching your existing DELETE handler)
      const res = await fetch('/api/admin/articles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }
      
      // Remove from local state
      setArticles(articles.filter(a => a.id !== id));
      
      console.log('Article deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete article: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Delete template
  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }
    
    try {
      const res = await fetch(`/api/admin/templates/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('API route not found');
      }
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || data.details || 'Failed to delete');
      }
      
      // Remove from local state
      setArticles(articles.filter(a => a.id !== id));
      
      console.log('Template deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete template: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleDeleteEnlightenment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this teaching?')) return;
    
    try {
      const res = await fetch(`/api/admin/enlightenment/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!res.ok) throw new Error('Failed to delete');
      
      setEnlightenmentTemplates(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete teaching');
    }
  };

  // Add handleTemplateSubmit
  const handleTemplateSubmit = async (data: TemplateFormData) => {
    const method = editingTemplate ? 'PUT' : 'POST';
    const url = editingTemplate 
      ? `/api/admin/templates/${editingTemplate.id}` 
      : '/api/admin/templates';
    
    // Don't split here - send as-is, let the API handle the conversion
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),  // Send data directly without splitting
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to save template');
    }
    
    // Refresh content
    const articlesRes = await fetch('/api/admin/articles', { credentials: 'include' });
    const templatesRes = await fetch('/api/admin/templates', { credentials: 'include' });
    const articlesData = await articlesRes.json();
    const templatesData = await templatesRes.json();
    const combined = [
      ...(articlesData.articles || []).map((a: ArticleType) => ({ ...a, type: 'article' as const })),
      ...(templatesData.templates || []).map((t: TemplateType) => ({ ...t, type: 'template' as const }))
    ];
    setArticles(combined);
    setShowTemplateForm(false);
    setEditingTemplate(null);
  };

  const handleEnlightenmentSubmit = async (data: EnlightenmentFormData) => {
    try {
      console.log('Enlightenment submit data:', data); // Add logging
      
      const method = editingEnlightenment ? 'PUT' : 'POST';
      const url = editingEnlightenment 
        ? `/api/admin/enlightenment/${editingEnlightenment.id}` 
        : '/api/admin/enlightenment';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save teaching');
      }
      
      // Refresh content
      const enlightenmentRes = await fetch('/api/admin/enlightenment', { credentials: 'include' });
      const enlightenmentData = await enlightenmentRes.json();
      setEnlightenmentTemplates(
        (enlightenmentData.templates || []).map((e: EnlightenmentTemplate) => ({ ...e, type: 'enlightenment' }))
      );
      
      setShowEnlightenmentForm(false);
      setEditingEnlightenment(null);
    } catch (error) {
      console.error('Enlightenment save error:', error);
      throw error;
    }
  };

  // Update fetch function
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const [articlesRes, templatesRes, enlightenmentRes] = await Promise.all([
          fetch('/api/admin/articles', { credentials: 'include' }),
          fetch('/api/admin/templates', { credentials: 'include' }),
          fetch('/api/admin/enlightenment', { credentials: 'include' }),
        ]);
        
        const articlesData = await articlesRes.json();
        const templatesData = await templatesRes.json();
        const enlightenmentData = await enlightenmentRes.json();
        
        const combined = [
          ...(articlesData.articles || []).map((a: DashboardArticle) => ({ ...a, type: 'article' })),
          ...(templatesData.templates || []).map((t: DashboardTemplate) => ({ ...t, type: 'template' })),
          ...(enlightenmentData.templates || []).map((e: EnlightenmentTemplate) => ({ ...e, type: 'enlightenment' })),
        ];
        setArticles(combined);
        setEnlightenmentTemplates(
          (enlightenmentData.templates || []).map((e: EnlightenmentTemplate) => ({ ...e, type: 'enlightenment' }))
        );
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
          <AdminSearchForm 
            placeholder="Search content..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
          {/* Create article button */}
          <button 
            onClick={() => {
              setEditingArticle(null);
              setShowArticleForm(true);
            }}
            className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white"
          >
            <svg className="fill-current shrink-0 xs:hidden" width="16" height="16" viewBox="0 0 16 16">
              <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
            </svg>
            <span className="max-xs:sr-only ml-2">Create Article</span>
          </button>
          {/* Create template button */}
          <button 
            onClick={() => {
              setEditingTemplate(null);
              setShowTemplateForm(true);
            }}
            className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white"
          >
            <svg className="fill-current shrink-0 xs:hidden" width="16" height="16" viewBox="0 0 16 16">
              <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
            </svg>
            <span className="max-xs:sr-only ml-2">Create Template</span>
          </button>
          {/* Create enlightenment button */}
          <button 
            onClick={() => {
              setEditingEnlightenment(null);
              setShowEnlightenmentForm(true);
            }}
            className="btn bg-purple-600 text-white hover:bg-purple-700"
          >
            <svg className="fill-current shrink-0 xs:hidden" width="16" height="16" viewBox="0 0 16 16">
              <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
            </svg>
            <span className="max-xs:sr-only ml-2">Create Teaching</span>
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
              <button onClick={() => setContentType('enlightenment')} className={`inline-flex items-center justify-center text-sm font-medium leading-5 rounded-full px-3 py-1 border border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm ${contentType === 'enlightenment' ? 'bg-purple-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400'} transition`}>Enlightenment</button>
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
      {contentType === 'articles' && (
        <ArticlesTable 
          articles={paginatedContent.filter(a => a.type === 'article') as DashboardArticle[]} 
          onEdit={handleEditArticle} 
          onDelete={handleDeleteArticle}  // Use article delete
        />
      )}
      {contentType === 'templates' && (
        <TemplatesTable 
          templates={paginatedContent.filter(a => a.type === 'template') as DashboardTemplate[]} 
          onEdit={handleEditTemplate} 
          onDelete={handleDeleteTemplate}  // Use template delete
        />
      )}
      {contentType === 'enlightenment' && (
        <EnlightenmentTable 
          templates={paginatedContent as EnlightenmentTemplate[]}
          onEdit={handleEditEnlightenment}
          onDelete={handleDeleteEnlightenment}
        />
      )}
      {contentType === 'all' && (
        <>
          {paginatedContent.filter(a => a.type === 'article').length > 0 && (
            <ArticlesTable 
              articles={paginatedContent.filter(a => a.type === 'article') as DashboardArticle[]} 
              onEdit={handleEditArticle} 
              onDelete={handleDeleteArticle}
            />
          )}
          
          {/* Divider between Articles and Templates */}
          {paginatedContent.filter(a => a.type === 'article').length > 0 && 
           paginatedContent.filter(a => a.type === 'template').length > 0 && (
            <div className="my-2 border-t border-gray-900 dark:border-gray-900"></div>
          )}
          
          {paginatedContent.filter(a => a.type === 'template').length > 0 && (
            <TemplatesTable 
              templates={paginatedContent.filter(a => a.type === 'template') as DashboardTemplate[]} 
              onEdit={handleEditTemplate} 
              onDelete={handleDeleteTemplate}
            />
          )}
        </>
      )}

      {/* Pagination */}
<div className="mt-8">
  <PaginationClassic 
    currentPage={currentPage}
    totalItems={filteredContent.length}
    itemsPerPage={itemsPerPage}
    onPageChange={setCurrentPage}
  />
</div>
      {/* Article Form Modal */}
<ArticleFormModal
  isOpen={showArticleForm}
  onClose={() => {
    setShowArticleForm(false);
    setEditingArticle(null);
  }}
  onSave={handleArticleSubmit}
  editingArticle={editingArticle}
/>

{/* Template Form Modal */}
<TemplateFormModal
  isOpen={showTemplateForm}
  onClose={() => {
    setShowTemplateForm(false);
    setEditingTemplate(null);
  }}
  onSave={handleTemplateSubmit}
  editingTemplate={editingTemplate}
/>

{/* Enlightenment Form Modal */}
<EnlightenmentFormModal
  isOpen={showEnlightenmentForm}
  onClose={() => {
    setShowEnlightenmentForm(false);
    setEditingEnlightenment(null);
  }}
  onSave={handleEnlightenmentSubmit}
  editingTemplate={editingEnlightenment}
/>

      
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
