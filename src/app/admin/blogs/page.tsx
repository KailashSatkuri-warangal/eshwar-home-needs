'use client';

import React, { useState, useEffect } from 'react';
import { BlogPost } from '@/types';
import { getDbDocs, setDbDoc, deleteDbDoc } from '@/lib/services/db';
import { MOCK_BLOG_POSTS } from '@/lib/mockData';
import { useApp } from '@/context/AppContext';
import {
  Sparkles, Plus, Edit, Trash2, Eye, ExternalLink,
  CheckCircle2, Search, ArrowRight, BookOpen, Lightbulb,
  FileText, Tag, BarChart3, HelpCircle, RefreshCw
} from 'lucide-react';
import Link from 'next/link';

export default function AdminBlogsPage() {
  const { showToast } = useApp();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [topicInput, setTopicInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('Cookware Guides');
  const [suggestedTopics, setSuggestedTopics] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Editor Modal State
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    setLoading(true);
    try {
      const docs = await getDbDocs('blogs');
      if (docs && docs.length > 0) {
        setBlogs(docs as BlogPost[]);
      } else {
        // Fallback to initial mock posts
        setBlogs(MOCK_BLOG_POSTS);
      }
    } catch (e) {
      console.warn('Error loading blogs:', e);
      setBlogs(MOCK_BLOG_POSTS);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchTopicSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const res = await fetch('/api/ai/generate-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'suggest_topics' }),
      });
      const data = await res.json();
      if (data.success && data.topics) {
        setSuggestedTopics(data.topics);
        showToast('Generated fresh trending topic suggestions!', 'success');
      }
    } catch (err) {
      showToast('Could not fetch suggestions.', 'error');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleGenerateWithAi = async (customTopic?: string, customCategory?: string) => {
    const finalTopic = customTopic || topicInput.trim();
    if (!finalTopic) {
      showToast('Please type a blog topic or click a suggested idea.', 'error');
      return;
    }

    setGenerating(true);
    showToast(`🤖 Gemini AI is writing comprehensive SEO article for: "${finalTopic}"...`, 'info');

    try {
      const res = await fetch('/api/ai/generate-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: finalTopic,
          category: customCategory || categoryInput,
        }),
      });

      const data = await res.json();
      if (data.success && data.blog) {
        setEditingBlog(data.blog);
        setIsEditorOpen(true);
        showToast('✨ Article generated successfully! Review and publish.', 'success');
      } else {
        showToast(data.error || 'Failed to generate article.', 'error');
      }
    } catch (err) {
      showToast('Error communicating with Gemini AI.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveBlog = async (publishNow = true) => {
    if (!editingBlog || !editingBlog.title || !editingBlog.content) {
      showToast('Article title and content are required.', 'error');
      return;
    }

    const blogToSave: BlogPost = {
      ...editingBlog,
      id: editingBlog.id || editingBlog.slug || `blog_${Date.now()}`,
      slug: editingBlog.slug || editingBlog.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      published: publishNow,
      updatedAt: new Date().toISOString(),
      publishedAt: editingBlog.publishedAt || new Date().toISOString(),
    };

    try {
      await setDbDoc('blogs', blogToSave.id, blogToSave);
      showToast(publishNow ? '🎉 Blog published live!' : 'Blog saved as draft.', 'success');
      setIsEditorOpen(false);
      setEditingBlog(null);
      loadBlogs();
    } catch (e) {
      showToast('Failed to save blog post.', 'error');
    }
  };

  const handleDeleteBlog = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await deleteDbDoc('blogs', id);
      showToast('Article deleted.', 'info');
      setBlogs(prev => prev.filter(b => b.id !== id));
    } catch (e) {
      showToast('Failed to delete article.', 'error');
    }
  };

  // SEO Score Calculations
  const calculateSeoScore = (blog: BlogPost) => {
    let score = 0;
    if (blog.title && blog.title.length >= 40 && blog.title.length <= 70) score += 20;
    else if (blog.title) score += 10;

    if (blog.excerpt && blog.excerpt.length >= 100 && blog.excerpt.length <= 165) score += 20;
    else if (blog.excerpt) score += 10;

    if (blog.content && blog.content.length > 1500) score += 25;
    else if (blog.content && blog.content.length > 600) score += 15;

    if (blog.keywords && blog.keywords.length >= 3) score += 15;
    if (blog.faqs && blog.faqs.length >= 2) score += 20;

    return Math.min(score, 100);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5" /> Gemini 3.6 Flash Powered
            </span>
            <span className="text-xs text-stone-400 font-mono">Google SEO Ranking Booster</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-serif mt-1">
            AI Blog Studio &amp; SEO Engine
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Generate 1,200+ word Google search-ranking articles, rich snippet FAQ schemas, and buying guides with 1 click.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/blog"
            target="_blank"
            className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all"
          >
            <Eye className="w-4 h-4" /> View Live Blog
          </Link>
          <button
            onClick={() => {
              setEditingBlog({
                id: '',
                slug: '',
                title: '',
                excerpt: '',
                content: '',
                featuredImage: '/shop/IMG_1626636968308250350 (1).jpg',
                category: 'Cookware Guides',
                tags: [],
                keywords: [],
                author: 'Kailash Satkuri',
                published: true,
                publishedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                readTimeMinutes: 5,
                views: 0,
                faqs: [],
              });
              setIsEditorOpen(true);
            }}
            className="bg-stone-900 hover:bg-black text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Write Blank Article
          </button>
        </div>
      </div>

      {/* 1-Click AI Generator Section */}
      <div className="bg-gradient-to-br from-amber-50/70 via-cream to-white border border-amber-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-copper" />
          <h2 className="text-lg font-extrabold text-stone-900 font-serif">
            Generate SEO Article with Gemini AI
          </h2>
        </div>
        <p className="text-xs text-stone-600 mb-6">
          Type any product, buying question, or metal recycling keyword. Gemini AI will write a complete, search-optimized article with H2 headings, comparison tables, and FAQ rich snippets.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-8">
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="e.g. Why Tri-ply Stainless Steel Kadai is Best for Deep Frying & Biryani"
              className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-copper/40 focus:border-copper"
            />
          </div>
          <div className="md:col-span-2">
            <select
              value={categoryInput}
              onChange={(e) => setCategoryInput(e.target.value)}
              className="w-full bg-white border border-stone-300 rounded-xl px-3 py-3 text-xs font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-copper/40"
            >
              <option value="Cookware Guides">Cookware Guides</option>
              <option value="Health & Copper">Health &amp; Copper</option>
              <option value="Scrap & Recycling">Scrap &amp; Recycling</option>
              <option value="Kitchen Tips">Kitchen Tips</option>
              <option value="Wholesale Insights">Wholesale Insights</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <button
              onClick={() => handleGenerateWithAi()}
              disabled={generating}
              className="w-full bg-copper hover:bg-copper-dark text-white font-bold px-4 py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Writing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> 1-Click Generate
                </>
              )}
            </button>
          </div>
        </div>

        {/* Daily Trending Topics Pills */}
        <div className="mt-6 pt-5 border-t border-amber-200/60">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-600" /> Daily High-Traffic Search Topics in Telangana
            </span>
            <button
              onClick={handleFetchTopicSuggestions}
              disabled={loadingSuggestions}
              className="text-[11px] font-bold text-copper hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${loadingSuggestions ? 'animate-spin' : ''}`} /> Refresh Topics
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {(suggestedTopics.length > 0 ? suggestedTopics : [
              { topic: 'Tri-ply Stainless Steel vs Non-Stick: Complete Health & Lifespan Guide', category: 'Cookware Guides' },
              { topic: '10 Ayurvedic & Scientific Benefits of Drinking from Pure Copper Bottles', category: 'Health & Copper' },
              { topic: 'How Digital Doorstep Scrap Metal Rates are Calculated in Warangal', category: 'Scrap & Recycling' },
              { topic: 'How to Season, Clean & Maintain Traditional Brass Urlis and Diyas', category: 'Kitchen Tips' },
              { topic: 'Wholesale Kitchen Utensils Buying Guide for Hotels, Caterers & Hostels', category: 'Wholesale Insights' },
            ]).map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTopicInput(item.topic);
                  setCategoryInput(item.category);
                  handleGenerateWithAi(item.topic, item.category);
                }}
                disabled={generating}
                className="bg-white/80 hover:bg-white border border-stone-200 hover:border-copper/40 text-stone-700 hover:text-copper px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>{item.topic}</span>
                <ArrowRight className="w-3 h-3 shrink-0 opacity-40" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Published Articles List */}
      <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="p-6 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Published Blog Articles</h2>
            <p className="text-xs text-stone-500">Live articles indexed by Google with Schema.org rich snippets.</p>
          </div>
          <span className="text-xs font-bold bg-stone-100 text-stone-600 px-3 py-1.5 rounded-full">
            {blogs.length} Articles Live
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-stone-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-copper" />
            Loading blog database...
          </div>
        ) : blogs.length === 0 ? (
          <div className="p-12 text-center text-stone-500 text-sm">
            No articles found. Click "1-Click Generate" above to write your first article with Gemini AI!
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {blogs.map((blog) => {
              const score = calculateSeoScore(blog);
              return (
                <div key={blog.id} className="p-5 sm:p-6 hover:bg-stone-50/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-copper/10 text-copper px-2 py-0.5 rounded-md">
                        {blog.category}
                      </span>
                      <span className="text-xs text-stone-400">•</span>
                      <span className="text-xs text-stone-500">{blog.readTimeMinutes || 5} min read</span>
                      <span className="text-xs text-stone-400">•</span>
                      <span className="text-xs text-stone-500">{blog.views || 0} views</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        score >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        SEO Score: {score}/100
                      </span>
                    </div>

                    <h3 className="font-bold text-stone-900 text-base leading-snug">
                      {blog.title}
                    </h3>
                    <p className="text-xs text-stone-500 line-clamp-2">
                      {blog.excerpt}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {blog.tags?.slice(0, 4).map((tag, tIdx) => (
                        <span key={tIdx} className="text-[10px] font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                    <Link
                      href={`/blog/${blog.slug}`}
                      target="_blank"
                      className="p-2 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                      title="View Public Article"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => {
                        setEditingBlog(blog);
                        setIsEditorOpen(true);
                      }}
                      className="p-2 text-copper hover:text-copper-dark bg-amber-50 hover:bg-amber-100 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                      title="Edit Article"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteBlog(blog.id, blog.title)}
                      className="p-2 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                      title="Delete Article"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {isEditorOpen && editingBlog && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-stone-950 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold font-mono tracking-wider">
                  {editingBlog.id ? 'Edit Article' : 'Review & Publish AI Article'}
                </h2>
                <span className="text-xs bg-stone-800 text-amber-300 px-2 py-0.5 rounded font-mono">
                  SEO: {calculateSeoScore(editingBlog)}/100
                </span>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="text-stone-400 hover:text-white text-xs bg-stone-800 px-2.5 py-1 rounded cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-grow text-xs">
              {/* Title */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Article Title (H1 / Google Title Tag)
                </label>
                <input
                  type="text"
                  value={editingBlog.title}
                  onChange={(e) => setEditingBlog({ ...editingBlog, title: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-copper/40"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Length: {editingBlog.title?.length || 0} chars (Optimal: 50–60 characters)
                </span>
              </div>

              {/* Slug & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">URL Slug (e.g. /blog/my-slug)</label>
                  <input
                    type="text"
                    value={editingBlog.slug}
                    onChange={(e) => setEditingBlog({ ...editingBlog, slug: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-mono text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-copper/40"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Category</label>
                  <select
                    value={editingBlog.category}
                    onChange={(e) => setEditingBlog({ ...editingBlog, category: e.target.value as any })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-copper/40"
                  >
                    <option value="Cookware Guides">Cookware Guides</option>
                    <option value="Health & Copper">Health &amp; Copper</option>
                    <option value="Scrap & Recycling">Scrap &amp; Recycling</option>
                    <option value="Kitchen Tips">Kitchen Tips</option>
                    <option value="Wholesale Insights">Wholesale Insights</option>
                  </select>
                </div>
              </div>

              {/* Excerpt / Meta Description */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Google Meta Description / Excerpt
                </label>
                <textarea
                  rows={2}
                  value={editingBlog.excerpt}
                  onChange={(e) => setEditingBlog({ ...editingBlog, excerpt: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-copper/40"
                />
                <span className="text-[10px] text-stone-400 mt-0.5 block">
                  Length: {editingBlog.excerpt?.length || 0} chars (Optimal: 140–160 characters)
                </span>
              </div>

              {/* Featured Image & Caption */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Featured Image URL</label>
                  <input
                    type="text"
                    value={editingBlog.featuredImage}
                    onChange={(e) => setEditingBlog({ ...editingBlog, featuredImage: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-mono text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-copper/40"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Image Alt Text / Caption (SEO)</label>
                  <input
                    type="text"
                    value={editingBlog.imageCaption || ''}
                    onChange={(e) => setEditingBlog({ ...editingBlog, imageCaption: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-copper/40"
                  />
                </div>
              </div>

              {/* Content Markdown Editor */}
              <div>
                <label className="font-bold text-stone-700 block mb-1 flex items-center justify-between">
                  <span>Article Body (Markdown / HTML)</span>
                  <span className="text-stone-400 font-normal">
                    {editingBlog.content?.split(/\s+/).length || 0} words
                  </span>
                </label>
                <textarea
                  rows={12}
                  value={editingBlog.content}
                  onChange={(e) => setEditingBlog({ ...editingBlog, content: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 font-mono text-xs leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-copper/40"
                />
              </div>

              {/* Keywords & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Target Keywords (comma separated)</label>
                  <input
                    type="text"
                    value={editingBlog.keywords?.join(', ') || ''}
                    onChange={(e) => setEditingBlog({
                      ...editingBlog,
                      keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean)
                    })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-copper/40"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Category Tags (comma separated)</label>
                  <input
                    type="text"
                    value={editingBlog.tags?.join(', ') || ''}
                    onChange={(e) => setEditingBlog({
                      ...editingBlog,
                      tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                    })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-copper/40"
                  />
                </div>
              </div>

              {/* FAQs Section */}
              {editingBlog.faqs && editingBlog.faqs.length > 0 && (
                <div className="border border-stone-200 rounded-2xl p-4 bg-stone-50/50 space-y-3">
                  <h4 className="font-bold text-stone-800 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-copper" /> Google FAQ Rich Snippet Questions ({editingBlog.faqs.length})
                  </h4>
                  {editingBlog.faqs.map((faq, fIdx) => (
                    <div key={fIdx} className="bg-white p-3 rounded-xl border border-stone-200 space-y-1">
                      <p className="font-bold text-stone-900">Q: {faq.question}</p>
                      <p className="text-stone-600 text-[11px] leading-relaxed">A: {faq.answer}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between shrink-0">
              <button
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 text-stone-600 hover:text-stone-900 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSaveBlog(false)}
                  className="bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer transition-all"
                >
                  Save as Draft
                </button>
                <button
                  onClick={() => handleSaveBlog(true)}
                  className="bg-copper hover:bg-copper-dark text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" /> Publish to Live Blog
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
