'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from '@/lib/mockData';
import { useApp } from '@/context/AppContext';
import { getDbDocs } from '@/lib/services/db';
import { Product, Category } from '@/types';
import { parseNaturalLanguageSearch, StructuredFilters } from '@/lib/services/aiSearch';
import { 
  Search, SlidersHorizontal, Star, RotateCw, X, Sparkles, 
  HelpCircle, ArrowUpDown, Bookmark, BookmarkCheck
} from 'lucide-react';
import Link from 'next/link';

function ShopContent() {
  const { addToCart, isWholesaleMode, wishlist, toggleWishlist, showToast } = useApp();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Search and Filter States
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState('');
  
  // AI Search States
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFilters, setAiFilters] = useState<StructuredFilters | null>(null);

  // Standard Filter values
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(3000);
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [inductionOnly, setInductionOnly] = useState<boolean>(false);

  // Load products from Firestore on mount (with local JSON fallback)
  useEffect(() => {
    const fetchProducts = async () => {
      const list = await getDbDocs('products');
      if (list.length > 0) {
        setProducts(list as Product[]);
      }
    };
    fetchProducts();
  }, []);

  // Set initial filters from URL params
  useEffect(() => {
    const q = searchParams.get('q');
    const cat = searchParams.get('category');
    if (q) {
      setSearchQuery(q);
    }
    if (cat) {
      setSelectedCategory(cat);
    }
  }, [searchParams]);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...products];

    // 1. Text Search Filter (name, SKU, tags, keywords)
    const activeTextSearch = searchQuery.toLowerCase().trim();
    if (activeTextSearch) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(activeTextSearch) ||
          p.sku.toLowerCase().includes(activeTextSearch) ||
          p.material.toLowerCase().includes(activeTextSearch) ||
          p.tags.some((t) => t.toLowerCase().includes(activeTextSearch)) ||
          p.keywords.some((k) => k.toLowerCase().includes(activeTextSearch))
      );
    }

    // 2. AI Applied Filters (from AI Search translation)
    if (aiFilters) {
      if (aiFilters.searchTerm) {
        const term = aiFilters.searchTerm.toLowerCase();
        result = result.filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            p.description.toLowerCase().includes(term)
        );
      }
      if (aiFilters.material) {
        result = result.filter((p) => p.material === aiFilters.material);
      }
      if (aiFilters.maxPrice) {
        result = result.filter((p) => {
          const price = isWholesaleMode ? p.wholesalePrice : (p.discountPrice || p.retailPrice);
          return price <= (aiFilters.maxPrice || 3000);
        });
      }
      if (aiFilters.capacity) {
        result = result.filter((p) => p.capacity && p.capacity <= (aiFilters.capacity || 0));
      }
      if (aiFilters.inductionCompatible) {
        result = result.filter((p) => p.specifications['Induction Friendly'] === 'Yes');
      }
      if (aiFilters.lidIncluded) {
        result = result.filter((p) => p.specifications['Lid Included'] === 'Yes');
      }
    }

    // 3. Category Sidebar Filter
    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.categoryId === selectedCategory);
    }

    // 4. Material Sidebar Filter
    if (selectedMaterial !== 'all') {
      result = result.filter((p) => p.material === selectedMaterial);
    }

    // 5. Induction Compatibility checkbox
    if (inductionOnly) {
      result = result.filter((p) => p.specifications['Induction Friendly'] === 'Yes');
    }

    // 6. Max Price range filter
    result = result.filter((p) => {
      const price = isWholesaleMode ? p.wholesalePrice : (p.discountPrice || p.retailPrice);
      return price <= maxPrice;
    });

    // 7. Sort Order
    if (sortBy === 'price-low') {
      result.sort((a, b) => {
        const pA = isWholesaleMode ? a.wholesalePrice : (a.discountPrice || a.retailPrice);
        const pB = isWholesaleMode ? b.wholesalePrice : (b.discountPrice || b.retailPrice);
        return pA - pB;
      });
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => {
        const pA = isWholesaleMode ? a.wholesalePrice : (a.discountPrice || a.retailPrice);
        const pB = isWholesaleMode ? b.wholesalePrice : (b.discountPrice || b.retailPrice);
        return pB - pA;
      });
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)); // mock sorting by rating
    } else if (sortBy === 'newest') {
      result.sort((a, b) => b.id.localeCompare(a.id));
    }

    setFilteredProducts(result);
  }, [products, searchQuery, aiFilters, selectedCategory, selectedMaterial, maxPrice, sortBy, inductionOnly, isWholesaleMode]);

  // AI Natural Language Search Submission
  const handleAiSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    setAiLoading(true);
    try {
      // Call client service (which wraps either live Gemini or local regex fallback)
      const parsedFilters = await parseNaturalLanguageSearch(aiQuery.trim());
      console.log('AI Translated search filters:', parsedFilters);
      
      // Update states to reflect AI discoveries
      setAiFilters(parsedFilters);
      
      // Sync GUI filters with AI output where applicable
      if (parsedFilters.material) setSelectedMaterial(parsedFilters.material);
      if (parsedFilters.maxPrice) setMaxPrice(parsedFilters.maxPrice);
      if (parsedFilters.inductionCompatible) setInductionOnly(true);
      
      showToast('AI Search Applied!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to parse query, trying standard search.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const clearAiFilters = () => {
    setAiFilters(null);
    setAiQuery('');
    setSelectedMaterial('all');
    setInductionOnly(false);
    setMaxPrice(3000);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Page Title */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-stone-900 font-serif">Product Catalog</h1>
            <p className="text-xs text-stone-500 mt-0.5">Browse healthy cookware and home vessels</p>
          </div>
          
          {/* Active pricing badge warning */}
          <div className="bg-stone-100 rounded-lg px-3 py-1.5 border border-stone-200 text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-copper animate-ping" />
            <span className="font-semibold text-stone-700">
              Pricing Mode: {isWholesaleMode ? 'Wholesale (Commercial)' : 'Retail (GST Included)'}
            </span>
          </div>
        </div>

        {/* AI SEARCH ASSISTANT BOX */}
        <div className="mb-8 bg-gradient-to-r from-[#faf5ef] to-[#fbf9f6] border border-copper/30 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-copper/5 rounded-full blur-xl" />
          
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-copper" />
            <h3 className="text-sm font-bold text-stone-900">✨ AI Search Assistant (Beta)</h3>
          </div>
          
          <form onSubmit={handleAiSearchSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Ask naturally, e.g., 'I need a 3 litre copper bottle under 1000' or 'induction kadai with lid'"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              className="flex-1 bg-white border border-stone-300 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-copper"
            />
            <button
              type="submit"
              disabled={aiLoading}
              className="bg-copper hover:bg-copper-dark text-white font-bold px-5 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {aiLoading ? (
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <span>Translate</span>
                </>
              )}
            </button>
          </form>

          {/* Examples hints */}
          <div className="mt-2.5 flex flex-wrap gap-2 text-[10px] text-stone-500 items-center">
            <span className="font-semibold">Try asking:</span>
            <button 
              onClick={() => setAiQuery("induction triply kadai under 2500")}
              className="text-copper hover:underline cursor-pointer"
            >
              "induction triply kadai under 2500"
            </button>
            <span>•</span>
            <button 
              onClick={() => setAiQuery("pure copper water flask")}
              className="text-copper hover:underline cursor-pointer"
            >
              "pure copper water flask"
            </button>
          </div>

          {/* Active AI Filters Details Bar */}
          {aiFilters && (
            <div className="mt-4 pt-3 border-t border-stone-200/50 flex flex-wrap items-center justify-between gap-3 bg-white/70 rounded-lg p-2.5">
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-stone-700">
                <span className="font-bold text-copper uppercase tracking-wider">AI Detected Filters:</span>
                {aiFilters.searchTerm && <span className="bg-stone-100 px-2 py-0.5 rounded">Term: "{aiFilters.searchTerm}"</span>}
                {aiFilters.material && <span className="bg-stone-100 px-2 py-0.5 rounded">Material: {aiFilters.material}</span>}
                {aiFilters.maxPrice && <span className="bg-stone-100 px-2 py-0.5 rounded">Max Price: ₹{aiFilters.maxPrice}</span>}
                {aiFilters.inductionCompatible && <span className="bg-stone-100 px-2 py-0.5 rounded">Induction Only</span>}
                {aiFilters.lidIncluded && <span className="bg-stone-100 px-2 py-0.5 rounded">Lid Included</span>}
              </div>
              <button
                onClick={clearAiFilters}
                className="text-[10px] font-bold text-red-600 hover:text-red-700 flex items-center gap-0.5 cursor-pointer"
              >
                Clear AI Filter <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* SIDEBAR FILTERS & CATALOG GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* 1. Sidebar Filters */}
          <div className="space-y-6 lg:border-r lg:border-stone-200 lg:pr-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <span className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-copper" /> Filters
              </span>
              {(selectedCategory !== 'all' || selectedMaterial !== 'all' || inductionOnly || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedMaterial('all');
                    setInductionOnly(false);
                    setSearchQuery('');
                    clearAiFilters();
                  }}
                  className="text-[10px] text-red-600 font-bold hover:underline"
                >
                  Reset All
                </button>
              )}
            </div>

            {/* Keyword Search */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-2">Search Catalog</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Keyword search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-lg pl-3 pr-8 py-1.5 text-xs focus:outline-none focus:border-copper"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Category selection */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-2">Categories</label>
              <div className="space-y-1.5">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full text-left text-xs px-2.5 py-1.5 rounded-md font-semibold transition-colors ${
                    selectedCategory === 'all' ? 'bg-copper/10 text-copper' : 'hover:bg-stone-100 text-stone-600'
                  }`}
                >
                  All Categories
                </button>
                {MOCK_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`w-full text-left text-xs px-2.5 py-1.5 rounded-md font-semibold transition-colors ${
                      selectedCategory === c.id ? 'bg-copper/10 text-copper' : 'hover:bg-stone-100 text-stone-600'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Material selection */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-2">Materials</label>
              <select
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1.5 text-xs text-stone-700 focus:outline-none focus:border-copper"
              >
                <option value="all">All Materials</option>
                <option value="stainless_steel">Stainless Steel</option>
                <option value="triply">Triply Cookware</option>
                <option value="brass">Pure Brass</option>
                <option value="copper">Pure Copper</option>
                <option value="plastic">Domestic Plastic</option>
                <option value="wooden">Kitchen Wooden</option>
              </select>
            </div>

            {/* Price slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Max Budget</label>
                <span className="text-xs font-bold text-stone-800">Under ₹{maxPrice}</span>
              </div>
              <input
                type="range"
                min="200"
                max="5000"
                step="100"
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                className="w-full accent-copper cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-stone-400 font-semibold mt-1">
                <span>₹200</span>
                <span>₹5,000+</span>
              </div>
            </div>

            {/* Induction toggle */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="induction"
                checked={inductionOnly}
                onChange={(e) => setInductionOnly(e.target.checked)}
                className="accent-copper cursor-pointer"
              />
              <label htmlFor="induction" className="text-xs font-semibold text-stone-700 cursor-pointer">
                Induction Compatible Base
              </label>
            </div>

          </div>

          {/* 2. Products Grid */}
          <div className="lg:col-span-3">
            
            {/* Sorting and metrics */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 mb-6">
              <span className="text-xs font-semibold text-stone-500">
                Showing {filteredProducts.length} items of {products.length} products
              </span>
              
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-stone-50 border border-stone-300 rounded px-2 py-1 text-xs text-stone-700 focus:outline-none"
                >
                  <option value="relevance">Sort by: Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="newest">Newest Arrivals</option>
                </select>
              </div>
            </div>

            {/* Catalog Grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => {
                  const activePrice = isWholesaleMode ? product.wholesalePrice : (product.discountPrice || product.retailPrice);
                  const hasDiscount = !isWholesaleMode && product.discountPrice;
                  const isWish = wishlist.includes(product.id);

                  return (
                    <div 
                      key={product.id} 
                      className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative"
                    >
                      {/* Wishlist Button */}
                      <button
                        onClick={() => toggleWishlist(product.id)}
                        className="absolute top-3 right-3 z-10 p-1.5 bg-white/80 hover:bg-white rounded-full border border-stone-200 text-stone-500 hover:text-red-500 transition-colors shadow-xs"
                      >
                        {isWish ? (
                          <BookmarkCheck className="w-4 h-4 text-copper" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </button>

                      {/* Product Image Link */}
                      <Link href={`/shop/${product.id}`} className="block relative aspect-square bg-stone-50 overflow-hidden border-b border-stone-100">
                        <img 
                          src={product.originalImage} 
                          alt={product.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {product.has360 && (
                          <span className="absolute bottom-2 left-2 bg-copper/95 text-white text-[9px] font-bold px-2 py-0.5 rounded-sm shadow-xs">
                            360° MODEL
                          </span>
                        )}
                        {hasDiscount && (
                          <span className="absolute top-3 left-3 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-sm">
                            SAVE {Math.round(((product.retailPrice - product.discountPrice!) / product.retailPrice) * 100)}%
                          </span>
                        )}
                      </Link>

                      <div className="p-4 space-y-2.5 flex-grow flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-stone-400">
                            <span>{product.material.replace('_', ' ')}</span>
                            <span>SKU: {product.sku.split('-').pop()}</span>
                          </div>
                          
                          <Link href={`/shop/${product.id}`} className="font-bold text-stone-800 text-sm hover:text-copper transition-colors line-clamp-2 mt-1 leading-tight">
                            {product.name}
                          </Link>
                          
                          <div className="flex items-center gap-1 mt-1.5">
                            <div className="flex text-amber-500">
                              <Star className="w-3.5 h-3.5 fill-current" />
                              <Star className="w-3.5 h-3.5 fill-current" />
                              <Star className="w-3.5 h-3.5 fill-current" />
                              <Star className="w-3.5 h-3.5 fill-current" />
                              <Star className="w-3.5 h-3.5 fill-current opacity-55" />
                            </div>
                            <span className="text-[10px] text-stone-400 font-bold">(4.6)</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-baseline pt-1">
                            <div>
                              <span className="text-base font-extrabold text-stone-900">
                                ₹{activePrice}
                              </span>
                              {hasDiscount && (
                                <span className="text-xs text-stone-400 line-through ml-1.5">
                                  ₹{product.retailPrice}
                                </span>
                              )}
                              <span className="text-[9px] text-stone-400 block mt-0.5">
                                {isWholesaleMode ? `Wholesale Tier (Min Qty: ${product.wholesaleMinQty})` : 'Retail (inclusive of GST)'}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => addToCart(product, 1)}
                            className="w-full py-2 bg-stone-100 hover:bg-copper hover:text-white text-stone-800 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-stone-50 border border-stone-200 rounded-2xl">
                <SlidersHorizontal className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <h3 className="font-bold text-stone-800 text-sm">No Products Found</h3>
                <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                  We couldn't find items matching your search criteria. Try modifying your sidebar filters or clearing AI query strings.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedMaterial('all');
                    setInductionOnly(false);
                    setSearchQuery('');
                    clearAiFilters();
                  }}
                  className="mt-4 px-4 py-2 bg-copper hover:bg-copper-dark text-white font-bold rounded-lg text-xs"
                >
                  Clear All Filters
                </button>
              </div>
            )}

          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <RotateCw className="w-8 h-8 text-copper animate-spin" />
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}
