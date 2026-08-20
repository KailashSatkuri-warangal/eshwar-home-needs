'use client';

import React, { use, useState, useEffect } from 'react';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import Interactive360Viewer from '@/components/ui/Interactive360Viewer';
import WhatsAppCTA from '@/components/ui/WhatsAppCTA';
import { MOCK_PRODUCTS, MOCK_REVIEWS } from '@/lib/mockData';
import { useApp } from '@/context/AppContext';
import { generateAIProductViews } from '@/lib/services/aiImage';
import { Product, Review } from '@/types';
import { 
  Star, ShoppingCart, Scale, ShieldCheck, HeartHandshake, 
  Truck, ArrowLeftRight, Clock, StarHalf, MessageSquare, 
  RotateCw, Plus, Minus
} from 'lucide-react';
import Link from 'next/link';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  
  const { addToCart, isWholesaleMode, showToast } = useApp();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [views, setViews] = useState<string[]>([]);
  const [loadingViews, setLoadingViews] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'care' | 'shipping'>('desc');
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    // Find product in seed data
    const foundProduct = MOCK_PRODUCTS.find((p) => p.id === productId);
    if (foundProduct) {
      setProduct(foundProduct);
      
      // Filter related products in same category
      const related = MOCK_PRODUCTS.filter((p) => p.categoryId === foundProduct.categoryId && p.id !== foundProduct.id);
      setRelatedProducts(related);

      // Filter reviews for this product
      const productReviews = MOCK_REVIEWS.filter((r) => r.productId === foundProduct.id);
      setReviews(productReviews);

      // Generate AI 360-degree views if enabled and not already generated
      if (foundProduct.has360) {
        setLoadingViews(true);
        generateAIProductViews(foundProduct.id, foundProduct.name, foundProduct.originalImage)
          .then((generated) => {
            setViews(generated);
          })
          .catch((err) => {
            console.error('Error generating AI views:', err);
            showToast('AI views could not load. Displaying standard photo.', 'error');
          })
          .finally(() => {
            setLoadingViews(false);
          });
      }
    }
  }, [productId]);

  if (!product) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center py-20 px-4">
          <h2 className="text-xl font-bold text-stone-800">Product Not Found</h2>
          <p className="text-sm text-stone-500 mt-1">The item you requested does not exist in our catalog.</p>
          <Link href="/shop" className="mt-4 bg-copper text-white px-5 py-2 rounded-lg text-xs font-bold">
            Back to Catalog
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const activePrice = isWholesaleMode ? product.wholesalePrice : (product.discountPrice || product.retailPrice);
  const hasDiscount = !isWholesaleMode && product.discountPrice;
  const isLowStock = product.stockQuantity <= product.lowStockThreshold;

  // Render spec values
  const specKeys = Object.keys(product.specifications);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Back Link */}
        <Link href="/shop" className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-copper font-semibold mb-6">
          ← Back to Shop Catalog
        </Link>

        {/* Product details grid (Image gallery left, information right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          
          {/* Left Column: AI 360 Viewer or Original Image */}
          <div className="flex flex-col items-center">
            {product.has360 ? (
              loadingViews ? (
                <div className="w-full aspect-square max-w-[420px] bg-white rounded-2xl border border-stone-200 shadow-xs flex flex-col items-center justify-center">
                  <RotateCw className="w-8 h-8 text-copper animate-spin mb-2" />
                  <span className="text-xs text-stone-400 font-medium">Reconstructing 3D Angles...</span>
                </div>
              ) : (
                <Interactive360Viewer views={views} productName={product.name} />
              )
            ) : (
              <div className="relative w-full aspect-square max-w-[420px] bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs p-6 flex items-center justify-center">
                <img 
                  src={product.originalImage} 
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>

          {/* Right Column: Product Info & Buy controls */}
          <div className="space-y-6">
            <div>
              <span className="text-[10px] uppercase font-bold text-copper tracking-wider block bg-copper/5 border border-copper/10 px-2 py-0.5 rounded-full w-max mb-2">
                {product.categoryId.replace('-', ' ')}
              </span>
              
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-serif leading-tight">
                {product.name}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-xs mt-2.5 text-stone-500">
                <span>SKU: <strong className="text-stone-700">{product.sku}</strong></span>
                <span>Material: <strong className="text-stone-700 capitalize">{product.material.replace('_', ' ')}</strong></span>
                
                {/* Rating summary */}
                <div className="flex items-center gap-1">
                  <div className="flex text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <StarHalf className="w-3.5 h-3.5 fill-current" />
                  </div>
                  <span className="font-bold text-stone-700">4.6</span>
                  <span className="text-stone-400">({reviews.length} reviews)</span>
                </div>
              </div>
            </div>

            {/* Price Info Box */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-3">
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="text-3xl font-extrabold text-stone-900">
                    ₹{activePrice}
                  </span>
                  {hasDiscount && (
                    <span className="text-sm text-stone-400 line-through ml-2 font-medium">
                      ₹{product.retailPrice}
                    </span>
                  )}
                  <span className="text-[10px] text-stone-400 block mt-1 font-medium">
                    {isWholesaleMode ? `Wholesale pricing (Minimum order qty: ${product.wholesaleMinQty} units)` : 'Retail pricing (includes GST)'}
                  </span>
                </div>

                {/* Stock Tag */}
                <div>
                  {product.stockQuantity > 0 ? (
                    isLowStock ? (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full">
                        Low Stock ({product.stockQuantity} Left)
                      </span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full">
                        In Stock ({product.stockQuantity} Units)
                      </span>
                    )
                  ) : (
                    <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2.5 py-1 rounded-full">
                      Out of Stock
                    </span>
                  )}
                </div>
              </div>

              {/* Wholesale notification if in retail mode */}
              {!isWholesaleMode && (
                <div className="text-[11px] text-stone-500 bg-white/70 border border-stone-200/50 p-2.5 rounded-lg">
                  💡 <strong>Save up to 35%</strong> with Wholesale rates. Minimum wholesale quantity for this product is <strong>{product.wholesaleMinQty} units</strong>. Toggle "Wholesale Pricing" or visit our wholesale RFQ portal.
                </div>
              )}
            </div>

            {/* Quantity Selector & Action Buttons */}
            {product.stockQuantity > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-stone-600">Select Quantity:</span>
                  <div className="flex items-center border border-stone-300 bg-white rounded-lg overflow-hidden w-max">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 hover:bg-stone-50 text-stone-500 focus:outline-none"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-4 text-sm font-bold text-stone-800">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-2 hover:bg-stone-50 text-stone-500 focus:outline-none"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {isWholesaleMode && quantity < product.wholesaleMinQty && (
                    <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2.5 py-1 rounded">
                      ⚠️ Qty below wholesale limit ({product.wholesaleMinQty})
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      addToCart(product, quantity);
                    }}
                    className="flex-1 min-w-[150px] bg-stone-900 hover:bg-stone-800 text-white font-bold py-3 px-6 rounded-lg text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" /> Add to Cart
                  </button>

                  {/* Wholesale Quote button vs Retail direct checkout */}
                  {isWholesaleMode ? (
                    <Link 
                      href="/wholesale"
                      className="flex-1 min-w-[150px] bg-copper hover:bg-copper-dark text-white font-bold py-3 px-6 rounded-lg text-sm flex items-center justify-center gap-2 shadow-sm transition-colors text-center"
                    >
                      <Scale className="w-4 h-4" /> Request Wholesale Quote
                    </Link>
                  ) : (
                    <WhatsAppCTA 
                      productName={product.name} 
                      sku={product.sku} 
                      quantity={quantity} 
                      className="flex-1 min-w-[150px]"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Care, specs, shipping info tab panel */}
            <div className="border border-stone-200 bg-white rounded-2xl overflow-hidden shadow-xs">
              <div className="flex border-b border-stone-200 text-xs font-semibold bg-stone-50/50">
                <button
                  onClick={() => setActiveTab('desc')}
                  className={`flex-1 py-3 text-center border-b-2 transition-all ${
                    activeTab === 'desc' ? 'border-copper text-copper bg-white' : 'border-transparent text-stone-500 hover:text-stone-700'
                  }`}
                >
                  Description
                </button>
                <button
                  onClick={() => setActiveTab('specs')}
                  className={`flex-1 py-3 text-center border-b-2 transition-all ${
                    activeTab === 'specs' ? 'border-copper text-copper bg-white' : 'border-transparent text-stone-500 hover:text-stone-700'
                  }`}
                >
                  Specifications
                </button>
                <button
                  onClick={() => setActiveTab('care')}
                  className={`flex-1 py-3 text-center border-b-2 transition-all ${
                    activeTab === 'care' ? 'border-copper text-copper bg-white' : 'border-transparent text-stone-500 hover:text-stone-700'
                  }`}
                >
                  Care Instructions
                </button>
                <button
                  onClick={() => setActiveTab('shipping')}
                  className={`flex-1 py-3 text-center border-b-2 transition-all ${
                    activeTab === 'shipping' ? 'border-copper text-copper bg-white' : 'border-transparent text-stone-500 hover:text-stone-700'
                  }`}
                >
                  Shipping &amp; Return
                </button>
              </div>

              <div className="p-5 text-xs text-stone-600 leading-relaxed min-h-[140px]">
                {activeTab === 'desc' && (
                  <p>{product.description}</p>
                )}

                {activeTab === 'specs' && (
                  <div className="divide-y divide-stone-100">
                    <div className="py-1.5 grid grid-cols-3">
                      <span className="font-semibold text-stone-500">Unit / Quantity</span>
                      <span className="col-span-2 text-stone-800 capitalize">{product.unit} (Weight: {product.weight || 'N/A'} kg)</span>
                    </div>
                    <div className="py-1.5 grid grid-cols-3">
                      <span className="font-semibold text-stone-500">HSN Code</span>
                      <span className="col-span-2 text-stone-800">{product.hsnCode} (GST: {product.gstRate}%)</span>
                    </div>
                    {specKeys.map((k) => (
                      <div key={k} className="py-1.5 grid grid-cols-3">
                        <span className="font-semibold text-stone-500">{k}</span>
                        <span className="col-span-2 text-stone-800">{String(product.specifications[k])}</span>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'care' && (
                  <p>{product.careInstructions || 'Wash with soft sponge using warm water and liquid dishwash detergent. Dry immediately after washing. For pure copper and brass urlis, use pitambari cleaning powder, tamarind pulp, or lime juice regularly to retain golden glossy metallic shine.'}</p>
                )}

                {activeTab === 'shipping' && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Truck className="w-4 h-4 text-copper shrink-0" />
                      <div>
                        <strong className="text-stone-800 block text-[11px]">Free Shipping above ₹1000</strong>
                        <span>Doorstep logistics delivery within Bengaluru in 2-3 business days. Out-of-station delivery in 5-7 business days.</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <ArrowLeftRight className="w-4 h-4 text-copper shrink-0" />
                      <div>
                        <strong className="text-stone-800 block text-[11px]">7-Day Replacement Policy</strong>
                        <span>If you receive a damaged/dent cookware or if size is mismatching, contact support within 7 days for free replacement.</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Dynamic Reviews Section */}
        <section className="mt-16 border-t border-stone-200 pt-10">
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare className="w-5 h-5 text-copper" />
            <h2 className="text-xl font-bold text-stone-900 font-serif">Customer Reviews</h2>
          </div>
          
          {reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((rev) => (
                <div key={rev.id} className="bg-white border border-stone-200 rounded-xl p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex text-amber-500">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <span className="text-[10px] text-stone-400">Verified Buyer</span>
                  </div>
                  <p className="text-xs text-stone-600 italic">"{rev.reviewText}"</p>
                  <span className="text-xs font-bold text-stone-800 block">— {rev.userName}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-stone-50 border border-stone-200 rounded-xl">
              <span className="text-xs text-stone-500">There are no reviews for this product yet. Be the first to buy and share feedback!</span>
            </div>
          )}
        </section>

        {/* Related Products list */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 border-t border-stone-200 pt-10">
            <h2 className="text-xl font-bold text-stone-900 font-serif mb-6">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.slice(0, 4).map((related) => {
                const relPrice = isWholesaleMode ? related.wholesalePrice : (related.discountPrice || related.retailPrice);
                return (
                  <div key={related.id} className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
                    <Link href={`/shop/${related.id}`} className="aspect-square bg-stone-50 block overflow-hidden">
                      <img 
                        src={related.originalImage} 
                        alt={related.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </Link>
                    <div className="p-4 space-y-2">
                      <Link href={`/shop/${related.id}`} className="font-bold text-stone-800 text-xs hover:text-copper transition-colors line-clamp-2 leading-tight">
                        {related.name}
                      </Link>
                      <div className="flex justify-between items-center pt-1">
                        <span className="font-extrabold text-stone-900 text-xs">₹{relPrice}</span>
                        <span className="text-[9px] text-stone-400 capitalize">{related.material.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </main>

      <Footer />
    </div>
  );
}
