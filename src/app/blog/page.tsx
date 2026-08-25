'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { BlogPost } from '@/types';
import { getDbDocs } from '@/lib/services/db';
import { MOCK_BLOG_POSTS } from '@/lib/mockData';
import {
  BookOpen, Clock, Calendar, Eye, ArrowRight, Search,
  Sparkles, Tag, ChevronRight, Share2, Award, Flame
} from 'lucide-react';
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd';

const CATEGORIES = [
  'All Articles',
  'Cookware Guides',
  'Health & Copper',
  'Scrap & Recycling',
  'Kitchen Tips',
  'Wholesale Insights'
];

export default function BlogIndexPage() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All Articles');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadBlogs() {
      try {
        const docs = await getDbDocs('blogs');
        if (docs && docs.length > 0) {
          const publishedOnly = (docs as BlogPost[]).filter(b => b.published !== false);
          setBlogs(publishedOnly.length > 0 ? publishedOnly : MOCK_BLOG_POSTS);
        } else {
          setBlogs(MOCK_BLOG_POSTS);
        }
      } catch (err) {
        console.warn('Error loading blogs from database:', err);
        setBlogs(MOCK_BLOG_POSTS);
      } finally {
        setLoading(false);
      }
    }
    loadBlogs();
  }, []);

  const filteredBlogs = blogs.filter((blog) => {
    const matchesCategory =
      selectedCategory === 'All Articles' || blog.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.keywords?.some(k => k.toLowerCase().includes(searchQuery.toLowerCase())) ||
      blog.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const featuredBlog = blogs[0];

  return (
    <div className="flex flex-col min-h-screen bg-cream">
      <Navbar />

      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.eshwarhomeneeds.shop' },
          { name: 'Blog & Kitchen Guides', url: 'https://www.eshwarhomeneeds.shop/blog' },
        ]}
      />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-copper/10 text-copper border border-copper/20">
            <BookOpen className="w-3.5 h-3.5" /> Kitchenware Guides &amp; Metal Insights
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-stone-900 font-serif tracking-tight">
            The ESHwar Journal &amp; Guides
          </h1>
          <p className="text-sm sm:text-base text-stone-600 font-medium leading-relaxed">
            Expert cookware advice, Ayurvedic copper wellness guides, daily metal scrap market insights, and bulk commercial kitchenware strategies.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-lg mx-auto pt-2">
            <Search className="absolute left-4 top-5 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guides (e.g. triply steel, copper bottle, scrap rates)..."
              className="w-full bg-white border border-stone-300 rounded-2xl pl-11 pr-4 py-3.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-copper/40 shadow-xs"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-copper text-white shadow-sm'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Featured Story (Shown if on 'All Articles' and no search) */}
        {selectedCategory === 'All Articles' && !searchQuery && featuredBlog && (
          <div className="mb-12 bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow grid grid-cols-1 lg:grid-cols-12 gap-0">
            <div className="lg:col-span-6 relative h-64 sm:h-80 lg:h-auto overflow-hidden bg-stone-100">
              <img
                src={featuredBlog.featuredImage || '/shop/IMG_1626636968308250350 (1).jpg'}
                alt={featuredBlog.imageCaption || featuredBlog.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-4 left-4 bg-amber-500 text-stone-950 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                <Flame className="w-3 h-3" /> Featured Story
              </span>
            </div>

            <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-copper/10 text-copper px-2.5 py-0.5 rounded-md">
                    {featuredBlog.category}
                  </span>
                  <span className="text-xs text-stone-400">•</span>
                  <span className="text-xs text-stone-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {featuredBlog.readTimeMinutes || 5} min read
                  </span>
                </div>

                <Link href={`/blog/${featuredBlog.slug}`}>
                  <h2 className="text-xl sm:text-2xl font-bold text-stone-900 hover:text-copper transition-colors font-serif leading-snug">
                    {featuredBlog.title}
                  </h2>
                </Link>

                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed line-clamp-3">
                  {featuredBlog.excerpt}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
                  <span className="font-bold text-stone-800">{featuredBlog.author || 'Kailash Satkuri'}</span>
                  <span>•</span>
                  <span>{new Date(featuredBlog.publishedAt || Date.now()).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>

                <Link
                  href={`/blog/${featuredBlog.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-copper hover:text-copper-dark group"
                >
                  Read Full Guide
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Article Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-3xl border border-stone-200 p-4 space-y-4 animate-pulse">
                <div className="bg-stone-200 h-48 rounded-2xl w-full" />
                <div className="h-4 bg-stone-200 rounded w-3/4" />
                <div className="h-3 bg-stone-200 rounded w-full" />
                <div className="h-3 bg-stone-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-3xl p-12 text-center space-y-3">
            <BookOpen className="w-8 h-8 text-stone-300 mx-auto" />
            <h3 className="text-base font-bold text-stone-800">No articles match your search</h3>
            <p className="text-xs text-stone-500">Try searching for different keywords or select "All Articles".</p>
            <button
              onClick={() => {
                setSelectedCategory('All Articles');
                setSearchQuery('');
              }}
              className="bg-stone-900 text-white text-xs font-bold px-4 py-2 rounded-xl"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBlogs.map((blog) => (
              <article
                key={blog.id}
                className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col group"
              >
                <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-stone-100">
                  <img
                    src={blog.featuredImage || '/shop/IMG_1626636968308250350 (1).jpg'}
                    alt={blog.imageCaption || blog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs text-stone-800 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md shadow-2xs">
                    {blog.category}
                  </span>
                </div>

                <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[11px] text-stone-400">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" /> {blog.readTimeMinutes || 5} min read
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(blog.publishedAt || Date.now()).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    <Link href={`/blog/${blog.slug}`}>
                      <h3 className="font-bold text-stone-900 text-base group-hover:text-copper transition-colors line-clamp-2 leading-snug">
                        {blog.title}
                      </h3>
                    </Link>

                    <p className="text-xs text-stone-500 leading-relaxed line-clamp-3">
                      {blog.excerpt}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs">
                    <div className="flex flex-wrap gap-1">
                      {blog.tags?.slice(0, 2).map((tag, tIdx) => (
                        <span key={tIdx} className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <Link
                      href={`/blog/${blog.slug}`}
                      className="text-copper font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                    >
                      Read <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
