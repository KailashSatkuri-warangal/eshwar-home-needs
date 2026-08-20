'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import {
  MOCK_CATEGORIES,
  MOCK_PRODUCTS,
  MOCK_SCRAP_RATES,
  MOCK_REVIEWS
} from '@/lib/mockData';
import { useApp } from '@/context/AppContext';
import {
  Scale, Landmark, Award, ShieldCheck, HeartHandshake,
  ArrowRight, Star, Quote, CheckCircle2, MessageCircle
} from 'lucide-react';
import WhatsAppCTA from '@/components/ui/WhatsAppCTA';

export default function HomePage() {
  const { addToCart, isWholesaleMode } = useApp();

  // Get featured products
  const featuredProducts = MOCK_PRODUCTS.filter(p => p.featured);
  const bestSellers = MOCK_PRODUCTS.filter(p => p.bestseller);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* 1. HERO SECTION */}
      <section className="relative bg-gradient-to-br from-cream to-[#f0e6d6] py-16 sm:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Soft decorative shapes to simulate metal reflections */}
        <div className="absolute top-1/2 -right-32 w-96 h-96 rounded-full bg-copper/5 blur-3xl" />
        <div className="absolute top-1/4 -left-32 w-80 h-80 rounded-full bg-brass/5 blur-3xl" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-copper/10 text-copper border border-copper/25">
              <Award className="w-3.5 h-3.5" /> Est. 2011 — Warangal's Trusted Store
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-stone-900 leading-tight font-serif">
              Quality Home &amp; Kitchen Products <br />
              <span className="text-copper">For Every Need.</span>
            </h1>

            <p className="text-base sm:text-lg text-stone-600 max-w-xl mx-auto lg:mx-0 font-medium">
              Explore authentic stainless steel vessels, heavy tri-ply cookware, pure brass urlis, and pure hammered copper bottles. Request wholesale quotation sheets or schedule doorstep scrap collections instantly.
            </p>

            <div className="flex flex-wrap justify-center lg:justify-start gap-4">
              <Link
                href="/shop"
                className="bg-copper hover:bg-copper-dark text-white font-bold px-6 py-3 rounded-lg shadow-sm hover:shadow transition-all duration-200 text-sm flex items-center gap-2 group"
              >
                Shop Products
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/wholesale"
                className="bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 font-bold px-6 py-3 rounded-lg text-sm flex items-center gap-2"
              >
                <Landmark className="w-4 h-4 text-copper" /> Wholesale Enquiry
              </Link>
              <Link
                href="/scrap"
                className="bg-scrap hover:bg-scrap-dark text-white font-bold px-6 py-3 rounded-lg shadow-sm text-sm flex items-center gap-2"
              >
                <Scale className="w-4 h-4" /> Sell Your Scrap
              </Link>
            </div>
          </div>

          {/* Hero Image Container */}
          <div className="relative aspect-video lg:aspect-square max-w-[500px] mx-auto w-full rounded-2xl overflow-hidden border border-stone-200 bg-white p-4 shadow-md flex items-center justify-center">
            <img
              src="https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&auto=format&fit=crop&q=80"
              alt="Premium Cookware Selection"
              className="w-full h-full object-cover rounded-xl"
            />
            {/* Quick stats floating tag */}
            <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-xs border border-stone-200 rounded-xl p-3 shadow-md flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-copper/10 flex items-center justify-center text-copper">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-stone-800 block">100% Pure Metals</span>
                <span className="text-[10px] text-stone-500 block">Lab Tested &amp; Food Grade</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SHOP BY CATEGORY */}
      <section className="py-16 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif">Shop by Category</h2>
            <p className="text-xs text-stone-500 mt-1">Explore our wide selection of domestic and professional kitchen needs</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {MOCK_CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className="group flex flex-col items-center text-center p-4 rounded-xl border border-stone-100 hover:border-copper/30 hover:shadow-xs transition-all bg-cream/40"
              >
                <div className="w-20 h-20 rounded-full overflow-hidden mb-3 border border-stone-200/60 bg-white flex items-center justify-center">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <span className="text-xs font-bold text-stone-800 group-hover:text-copper transition-colors">
                  {cat.name}
                </span>
                <span className="text-[9px] text-stone-400 mt-0.5">
                  {cat.subcategories.length} items
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS & BEST SELLERS */}
      <section className="py-16 bg-cream/30 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif">Featured Products</h2>
              <p className="text-xs text-stone-500 mt-1">Handpicked cookware and vessels for healthy cooking</p>
            </div>
            <Link href="/shop" className="text-xs font-bold text-copper hover:text-copper-dark flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.slice(0, 4).map((product) => {
              const activePrice = isWholesaleMode ? product.wholesalePrice : (product.discountPrice || product.retailPrice);
              const hasDiscount = !isWholesaleMode && product.discountPrice;

              return (
                <div key={product.id} className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
                  <Link href={`/shop/${product.id}`} className="block relative aspect-square bg-stone-50 overflow-hidden border-b border-stone-100">
                    <img
                      src={product.originalImage}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.has360 && (
                      <span className="absolute bottom-2 left-2 bg-copper/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                        360° VIEW
                      </span>
                    )}
                    {hasDiscount && (
                      <span className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                        SAVE {Math.round(((product.retailPrice - product.discountPrice!) / product.retailPrice) * 100)}%
                      </span>
                    )}
                  </Link>

                  <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">{product.categoryId.replace('-', ' ')}</span>
                      <Link href={`/shop/${product.id}`} className="font-bold text-stone-800 text-sm hover:text-copper transition-colors line-clamp-2 leading-tight">
                        {product.name}
                      </Link>

                      {/* Ratings */}
                      <div className="flex items-center gap-1 mt-1">
                        <div className="flex text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <Star className="w-3.5 h-3.5 fill-current opacity-50" />
                        </div>
                        <span className="text-[10px] text-stone-500 font-semibold">(4.6)</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-base font-extrabold text-stone-900">
                            ₹{activePrice}
                          </span>
                          {hasDiscount && (
                            <span className="text-[11px] text-stone-400 line-through ml-1.5 font-medium">
                              ₹{product.retailPrice}
                            </span>
                          )}
                          <span className="text-[9px] text-stone-400 block mt-0.5 font-medium">
                            {isWholesaleMode ? `Wholesale (Min Qty: ${product.wholesaleMinQty})` : 'Retail price incl. GST'}
                          </span>
                        </div>
                      </div>

                      {/* Add to Cart button */}
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
        </div>
      </section>

      {/* 4. WHOLESALE PERKS CTA SECTION */}
      <section className="py-16 bg-gradient-to-br from-earth to-stone-900 text-white px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-12 items-center relative">
          <div className="lg:col-span-3 space-y-6">
            <span className="inline-flex items-center gap-1 bg-copper/20 border border-copper/30 px-3 py-1 rounded-full text-xs font-bold text-copper-light">
              <Landmark className="w-3.5 h-3.5" /> BULK DEALER RATES
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-serif leading-tight">
              Are you a Retailer, Caterer, <br />
              or Hotel Business Owner?
            </h2>
            <p className="text-stone-300 text-sm max-w-xl leading-relaxed">
              Get special B2B commercial rates, zero logistics headache, and GST compliance invoices on all kitchenware orders. Registered business accounts gain access to custom credit configurations, proforma quotation sheets, and bulk target-price negotiation features directly from our portal.
            </p>

            <div className="grid grid-cols-3 gap-4 py-2">
              <div className="border-l-2 border-copper pl-3">
                <span className="text-xl font-bold text-white block">35%+</span>
                <span className="text-[10px] text-stone-400">Margin Savings</span>
              </div>
              <div className="border-l-2 border-copper pl-3">
                <span className="text-xl font-bold text-white block">GSTIN</span>
                <span className="text-[10px] text-stone-400">Ready Invoices</span>
              </div>
              <div className="border-l-2 border-copper pl-3">
                <span className="text-xl font-bold text-white block">Credit</span>
                <span className="text-[10px] text-stone-400">Admin Approved</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/wholesale"
                className="inline-flex items-center gap-2 bg-copper hover:bg-copper-dark text-white font-bold px-6 py-3 rounded-lg text-xs tracking-wider uppercase transition-colors"
              >
                Request wholesale catalog
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Styled Form Placeholder/Widget */}
          <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xs">
            <h3 className="text-lg font-bold mb-4 font-serif">Quick Wholesale RFQ</h3>
            <div className="space-y-3.5 text-stone-300 text-xs">
              <div>
                <label className="text-[10px] text-stone-400 uppercase tracking-wider block mb-1">Company Name</label>
                <input type="text" disabled placeholder="Enter your business/hotel name" className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-stone-400 uppercase tracking-wider block mb-1">Phone Number</label>
                <input type="text" disabled placeholder="e.g., +91 99000 12345" className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-stone-400 uppercase tracking-wider block mb-1">Material Category Needed</label>
                <select disabled className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 focus:outline-none text-stone-400">
                  <option>Stainless Steel Vessels (Topes/Plates)</option>
                </select>
              </div>
              <div className="pt-2">
                <Link href="/wholesale" className="w-full py-2.5 bg-white text-stone-900 hover:bg-stone-100 font-bold rounded text-xs block text-center">
                  Fill Bulk RFQ Sheet
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SELL YOUR OLD SCRAP CTA SECTION */}
      <section className="py-16 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto bg-stone-50 border border-stone-200 rounded-3xl p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">

          <div className="lg:col-span-3 space-y-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-scrap/10 text-scrap border border-scrap/20">
              ♻️ Eco-Friendly Scrap Portal
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif leading-tight">
              Turn Your Old Metal &amp; Kitchenware Scrap <br />
              <span className="text-scrap">Into Cash Payouts!</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Do you have old steel vessels, copper bottles, brass items, or aluminium cookware lying in your storeroom? We buy recyclable metal scraps at the best daily rates in Bangalore. Simply upload a picture, calculate your estimate, and book a certified collector pickup instantly!
            </p>

            <div className="flex flex-wrap gap-4 text-xs font-semibold text-stone-700">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-scrap" /> Certified digital scales</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-scrap" /> Best rates guaranteed</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-scrap" /> Free home pickup</span>
            </div>

            <div className="pt-2 flex gap-4">
              <Link
                href="/scrap"
                className="bg-scrap hover:bg-scrap-dark text-white font-bold px-6 py-3 rounded-lg text-xs tracking-wider uppercase transition-colors"
              >
                Estimate &amp; Book Pickup
              </Link>
              <Link
                href="/scrap"
                className="bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 font-bold px-6 py-3 rounded-lg text-xs transition-colors"
              >
                Check Scrap Rates
              </Link>
            </div>
          </div>

          {/* Quick Rates Cards Mini-Panel */}
          <div className="lg:col-span-2 bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">Live Estimate Rates Today</h4>
            <div className="space-y-2.5">
              {MOCK_SCRAP_RATES.slice(0, 4).map((rate) => (
                <div key={rate.id} className="flex justify-between items-center text-xs border-b border-stone-100 pb-2">
                  <span className="font-semibold text-stone-700">{rate.material.split(' ')[0]}</span>
                  <div className="text-right">
                    <span className="font-bold text-stone-900">₹{rate.currentRate}/kg</span>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/scrap" className="block text-center text-[10px] font-bold text-scrap hover:text-scrap-dark uppercase mt-4">
              View full price chart
            </Link>
          </div>

        </div>
      </section>

      {/* 6. WHY CHOOSE US */}
      <section className="py-16 bg-cream/10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif">Why Choose ESHwar Home Needs</h2>
            <p className="text-xs text-stone-500 mt-1">We blend traditional Indian craftsmanship with modern digital convenience</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border border-stone-200 rounded-2xl p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-copper/10 text-copper flex items-center justify-center mx-auto">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base font-serif text-stone-950">Traditional &amp; Modern Quality</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Handcrafted pure copper and brass urlis representing age-old wellness wisdom, sitting alongside professional tri-ply induction-ready kitchen sets.
              </p>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-copper/10 text-copper flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base font-serif text-stone-950">100% Secure B2B/B2C Platform</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Secure payment gateways, client-side encryption, and GST-ready automated invoices. We never compromise on authentication security.
              </p>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-copper/10 text-copper flex items-center justify-center mx-auto">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base font-serif text-stone-950">Full Circle Recycling Loop</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                We don't just sell kitchenware; we buy back old worn-out steel, copper, and brass scraps, supporting local sustainability and circular economy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CUSTOMER REVIEWS */}
      <section className="py-16 bg-white px-4 sm:px-6 lg:px-8 border-t border-stone-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif">What Our Customers Say</h2>
            <p className="text-xs text-stone-500 mt-1">Read reviews from retail housewives, caterers, and wholesale partners</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {MOCK_REVIEWS.map((review) => (
              <div key={review.id} className="bg-cream/20 border border-stone-200/50 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex text-amber-500">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs text-stone-600 italic leading-relaxed">
                    "{review.reviewText}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-stone-100">
                  <div className="w-8 h-8 rounded-full bg-copper/20 flex items-center justify-center text-copper font-bold text-xs uppercase">
                    {review.userName.charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-xs text-stone-800 block">{review.userName}</span>
                    <span className="text-[10px] text-emerald-600 font-semibold block">✓ Verified Purchase</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Floating WhatsApp Quick Action Button */}
      <div className="fixed bottom-20 right-4 z-40 lg:bottom-6">
        <WhatsAppCTA
          productName="General Enquiry"
          sku="ESH-GEN"
          type="general"
          className="shadow-lg rounded-full !py-3 !px-4 hover:scale-105 transition-transform"
        />
      </div>

      <Footer />
    </div>
  );
}
