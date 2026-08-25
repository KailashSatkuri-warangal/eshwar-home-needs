'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { BlogPost, Product } from '@/types';
import { getDbDocs } from '@/lib/services/db';
import { MOCK_BLOG_POSTS, MOCK_PRODUCTS } from '@/lib/mockData';
import { ArticleJsonLd, FaqJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import {
  Clock, Calendar, Share2, ArrowLeft, Tag,
  CheckCircle2, Sparkles, MessageCircle, HelpCircle,
  ExternalLink, ShoppingBag, ArrowRight, RefreshCw, BookOpen
} from 'lucide-react';

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPost() {
      if (!slug) return;
      setLoading(true);

      try {
        // 1. Check dynamic database first
        const docs = await getDbDocs('blogs');
        if (docs && docs.length > 0) {
          const found = (docs as BlogPost[]).find(
            (b) => b.slug === slug || b.id === slug
          );
          if (found) {
            setPost(found);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Could not fetch from database, checking mock:', err);
      }

      // 2. Check seed mock data fallback
      const mockFound = MOCK_BLOG_POSTS.find((p) => p.slug === slug || p.id === slug);
      if (mockFound) {
        setPost(mockFound);
      } else {
        setPost(null);
      }
      setLoading(false);
    }

    loadPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-cream">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center p-12 text-center">
          <RefreshCw className="w-8 h-8 text-copper animate-spin mb-3" />
          <p className="text-stone-600 text-sm font-medium">Loading article...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col min-h-screen bg-cream">
        <Navbar />
        <main className="flex-grow max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
          <div className="w-16 h-16 bg-amber-100 text-copper rounded-full flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 font-serif">Article Not Found</h1>
          <p className="text-sm text-stone-500 max-w-md mx-auto">
            The article you are looking for might have been moved or is still being published.
          </p>
          <div className="pt-4">
            <Link
              href="/blog"
              className="bg-copper hover:bg-copper-dark text-white text-xs font-bold px-6 py-3 rounded-xl transition-all shadow-sm"
            >
              Browse All Kitchen Guides
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const relatedProducts = (post.relatedProductIds || [])
    .map((id: string) => MOCK_PRODUCTS.find((p) => p.id === id))
    .filter(Boolean) as Product[];

  const shareText = encodeURIComponent(
    `Check out this guide: "${post.title}" on ESHwar Home Needs!\nhttps://www.eshwarhomeneeds.shop/blog/${post.slug}`
  );

  return (
    <div className="flex flex-col min-h-screen bg-cream">
      <Navbar />

      {/* Schema.org Structured Data for Google Rich Snippets */}
      <ArticleJsonLd post={post} />
      {post.faqs && <FaqJsonLd faqs={post.faqs} />}
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.eshwarhomeneeds.shop' },
          { name: 'Blog & Guides', url: 'https://www.eshwarhomeneeds.shop/blog' },
          { name: post.title, url: `https://www.eshwarhomeneeds.shop/blog/${post.slug}` },
        ]}
      />

      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-copper transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to all articles
          </Link>
        </div>

        {/* Article Container */}
        <article className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-8">
          {/* Header Metadata */}
          <div className="space-y-4 border-b border-stone-100 pb-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-copper/10 text-copper px-3 py-1 rounded-md">
                {post.category}
              </span>
              <span className="text-xs text-stone-400">•</span>
              <span className="text-xs text-stone-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-stone-400" /> {post.readTimeMinutes || 5} min read
              </span>
              <span className="text-xs text-stone-400">•</span>
              <span className="text-xs text-stone-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />{' '}
                {new Date(post.publishedAt || Date.now()).toLocaleDateString('en-IN', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-900 font-serif leading-tight">
              {post.title}
            </h1>

            <p className="text-sm sm:text-base text-stone-600 font-medium leading-relaxed">
              {post.excerpt}
            </p>

            {/* Author & Share Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-stone-100 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-copper/15 text-copper font-bold flex items-center justify-center font-serif text-base border border-copper/30">
                  {post.author ? post.author.charAt(0) : 'E'}
                </div>
                <div>
                  <span className="font-bold text-stone-900 block">{post.author || 'Kailash Satkuri'}</span>
                  <span className="text-[11px] text-stone-500">ESHwar Home Needs Editor</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://wa.me/?text=${shareText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-all"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Share on WhatsApp
                </a>
              </div>
            </div>
          </div>

          {/* Featured Image */}
          <div className="rounded-2xl overflow-hidden bg-stone-100 border border-stone-200">
            <img
              src={post.featuredImage || '/shop/IMG_1626636968308250350 (1).jpg'}
              alt={post.imageCaption || post.title}
              className="w-full max-h-[420px] object-cover"
            />
            {post.imageCaption && (
              <p className="p-3 text-[11px] text-stone-500 bg-stone-50 text-center italic border-t border-stone-200">
                {post.imageCaption}
              </p>
            )}
          </div>

          {/* Main Article Body */}
          <div className="prose prose-stone max-w-none text-stone-800 leading-relaxed text-sm sm:text-base space-y-6">
            {(post.content || '').split('\n\n').map((paragraph: string, pIdx: number) => {
              const trimmed = paragraph.trim();

              // Subheading H2
              if (trimmed.startsWith('## ')) {
                return (
                  <h2 key={pIdx} className="text-xl sm:text-2xl font-bold text-stone-900 font-serif pt-4 pb-2 border-b border-stone-200">
                    {trimmed.replace(/^##\s+/, '')}
                  </h2>
                );
              }

              // Subheading H3
              if (trimmed.startsWith('### ')) {
                return (
                  <h3 key={pIdx} className="text-lg font-bold text-copper font-serif pt-2">
                    {trimmed.replace(/^###\s+/, '')}
                  </h3>
                );
              }

              // Divider
              if (trimmed === '---') {
                return <hr key={pIdx} className="border-stone-200 my-6" />;
              }

              // Table detection
              if (trimmed.includes('|') && trimmed.includes('\n')) {
                const rows = trimmed.split('\n').filter((r: string) => r.trim().startsWith('|'));
                if (rows.length >= 2) {
                  const headers = rows[0].split('|').filter((c: string) => c.trim().length > 0).map((c: string) => c.trim());
                  const bodyRows = rows.slice(2).map((r: string) => r.split('|').filter((c: string) => c.trim().length > 0).map((c: string) => c.trim()));

                  return (
                    <div key={pIdx} className="overflow-x-auto my-6 rounded-xl border border-stone-200 shadow-2xs">
                      <table className="min-w-full text-xs sm:text-sm divide-y divide-stone-200 text-left">
                        <thead className="bg-stone-100 font-bold text-stone-900">
                          <tr>
                            {headers.map((h: string, hIdx: number) => (
                              <th key={hIdx} className="px-4 py-3">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 bg-white">
                          {bodyRows.map((bRow: string[], rIdx: number) => (
                            <tr key={rIdx} className="hover:bg-stone-50">
                              {bRow.map((cell: string, cIdx: number) => (
                                <td key={cIdx} className="px-4 py-2.5 text-stone-700">{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                }
              }

              // Bullet list detection
              if (trimmed.startsWith('- ') || trimmed.startsWith('1. ')) {
                const listItems = trimmed.split('\n');
                return (
                  <ul key={pIdx} className="space-y-2 pl-5 list-disc text-stone-700">
                    {listItems.map((li: string, lIdx: number) => (
                      <li key={lIdx} className="leading-relaxed">
                        {li.replace(/^[-*]\s+|\d+\.\s+/, '')}
                      </li>
                    ))}
                  </ul>
                );
              }

              // Standard Paragraph
              return (
                <p key={pIdx} className="leading-relaxed text-stone-700">
                  {trimmed}
                </p>
              );
            })}
          </div>

          {/* Related Products CTA Section */}
          {relatedProducts.length > 0 && (
            <div className="bg-gradient-to-br from-amber-50/80 to-cream border border-amber-200/80 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-copper" />
                <h3 className="text-base font-bold text-stone-900 font-serif">
                  Featured Products Mentioned in This Guide
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedProducts.map((prod: any) => (
                  <Link
                    key={prod.id}
                    href={`/shop/${prod.id}`}
                    className="bg-white border border-stone-200 rounded-xl p-3 flex flex-col justify-between hover:shadow-md hover:border-copper/40 transition-all group"
                  >
                    <div className="aspect-square bg-stone-100 rounded-lg overflow-hidden mb-2">
                      <img
                        src={prod.originalImage || '/shop/IMG_1626636968308250350 (1).jpg'}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-stone-900 line-clamp-2 group-hover:text-copper transition-colors">
                        {prod.name}
                      </h4>
                      <p className="text-copper font-bold text-xs mt-1">
                        ₹{prod.discountPrice || prod.retailPrice}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Google Search FAQ Rich Snippet Accordion */}
          {post.faqs && post.faqs.length > 0 && (
            <div className="border-t border-stone-200 pt-8 space-y-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-copper" />
                <h3 className="text-lg font-bold text-stone-900 font-serif">
                  Frequently Asked Questions (FAQs)
                </h3>
              </div>

              <div className="divide-y divide-stone-200 border border-stone-200 rounded-2xl overflow-hidden">
                {post.faqs.map((faq: { question: string; answer: string }, fIdx: number) => (
                  <div key={fIdx} className="p-4 sm:p-5 bg-white space-y-2">
                    <h4 className="font-bold text-stone-900 text-sm flex items-start gap-2">
                      <span className="text-copper">Q:</span> {faq.question}
                    </h4>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed pl-5">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags & Keywords */}
          <div className="border-t border-stone-100 pt-6 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-stone-400 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" /> Topics:
            </span>
            {post.tags?.map((tag: string, idx: number) => (
              <span key={idx} className="bg-stone-100 text-stone-700 px-2.5 py-1 rounded-lg text-xs font-medium">
                #{tag}
              </span>
            ))}
          </div>

          {/* Store CTA Footer Box */}
          <div className="bg-stone-900 text-white rounded-2xl p-6 sm:p-8 text-center space-y-4">
            <h3 className="text-lg sm:text-xl font-bold font-serif">
              Visit ESHwar Home Needs in Hanumakonda
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 max-w-xl mx-auto leading-relaxed">
              Explore authentic stainless steel vessels, certified tri-ply cookware, pure brass urlis, and doorstep scrap collection services with digital scale guarantee.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link
                href="/shop"
                className="bg-copper hover:bg-copper-dark text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all"
              >
                Browse Product Catalog
              </Link>
              <a
                href="https://wa.me/919949408061"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold px-5 py-2.5 rounded-xl transition-all"
              >
                WhatsApp Inquiry (+91 99494 08061)
              </a>
            </div>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
