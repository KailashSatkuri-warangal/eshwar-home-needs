'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { 
  Menu, X, ShoppingCart, User, Search, Scale, Landmark,
  Flame, ChevronDown, HelpCircle, FileText, BookOpen
} from 'lucide-react';

export default function Navbar() {
  const { user, cart, isWholesaleMode, toggleWholesaleMode } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryDropdown, setCategoryDropdown] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  const categories = [
    { name: 'Steel Vessels', slug: 'steel-vessels' },
    { name: 'Triply Cookware', slug: 'triply-cookware' },
    { name: 'Brass Products', slug: 'brass' },
    { name: 'Copper Products', slug: 'copper' },
    { name: 'Plastic Household', slug: 'plastic' },
    { name: 'Wooden Kitchenware', slug: 'wooden' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      {/* Top Banner (Wholesale Mode Indicator / Contact info) */}
      <div className="bg-earth text-white py-1.5 px-4 text-xs">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span>📞 Support: +91 99494 08061</span>
            <span className="hidden sm:inline">📍 Free Shipping above ₹1000</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] bg-copper text-white font-bold px-2 py-0.5 rounded-full">
              GST REGISTERED
            </span>
            <Link href="/wholesale" className="hover:text-copper font-medium transition-colors">
              Wholesale Portal
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo / Brand Name */}
          <div className="flex items-center">
            <Link href="/" className="flex flex-col">
              <span className="text-xl font-extrabold text-stone-900 tracking-tight flex items-center gap-1 font-serif">
                ESHwar
                <span className="text-copper text-xs font-sans font-bold px-1.5 py-0.5 rounded-sm bg-copper/10 border border-copper/20">
                  HOME
                </span>
              </span>
              <span className="text-[9px] uppercase tracking-widest text-stone-500 font-bold">
                Smart Retail & Wholesale
              </span>
            </Link>
          </div>

          {/* Search bar (desktop/tablet) */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md relative">
            <input
              type="text"
              placeholder="Search stainless steel, triply, brass, copper..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-full py-1.5 pl-4 pr-10 text-sm focus:outline-none focus:border-copper focus:bg-white transition-colors"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-copper">
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Navigation Links (desktop) */}
          <nav className="hidden lg:flex items-center gap-6">
            {/* Categories Dropdown Trigger */}
            <div className="relative">
              <button 
                onClick={() => setCategoryDropdown(!categoryDropdown)}
                onBlur={() => setTimeout(() => setCategoryDropdown(false), 200)}
                className="flex items-center gap-1 text-sm font-semibold text-stone-700 hover:text-copper transition-colors cursor-pointer"
              >
                Categories <ChevronDown className="w-3.5 h-3.5" />
              </button>
              
              {categoryDropdown && (
                <div className="absolute top-8 left-0 w-48 bg-white border border-stone-200 rounded-lg shadow-md py-1 z-50">
                  {categories.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/shop?category=${c.slug}`}
                      className="block px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 hover:text-copper"
                    >
                      {c.name}
                    </Link>
                  ))}
                  <div className="border-t border-stone-100 my-1" />
                  <Link href="/shop" className="block px-4 py-2 text-xs font-bold text-copper hover:bg-stone-50">
                    View All Products
                  </Link>
                </div>
              )}
            </div>

            <Link href="/wholesale" className="text-sm font-semibold text-stone-700 hover:text-copper transition-colors">
              Wholesale
            </Link>
            <Link href="/scrap" className="text-sm font-semibold text-stone-700 hover:text-copper transition-colors flex items-center gap-1">
              <Scale className="w-4 h-4 text-scrap" /> Sell Scrap
            </Link>
            <Link href="/blog" className="text-sm font-semibold text-stone-700 hover:text-copper transition-colors flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-copper" /> Guides &amp; Blog
            </Link>
          </nav>

          {/* Action icons (Cart, Account, Wholesale toggle) */}
          <div className="flex items-center gap-3">
            {/* Pricing Mode Toggle */}
            <button
              onClick={() => toggleWholesaleMode(!isWholesaleMode)}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                isWholesaleMode 
                  ? 'bg-copper text-white border-copper' 
                  : 'bg-white text-stone-700 border-stone-300 hover:border-copper'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              {isWholesaleMode ? 'Wholesale Pricing' : 'Retail Pricing'}
            </button>

            {/* Cart Icon */}
            <Link href="/cart" className="p-2 text-stone-700 hover:text-copper transition-colors relative">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-copper text-white text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white animate-scale">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Account / Admin button */}
            <Link 
              href={user ? (user.role === 'admin' || user.role === 'staff' ? '/admin' : '/account') : '/account'} 
              className="p-2 text-stone-700 hover:text-copper transition-colors flex items-center gap-1"
            >
              <User className="w-5 h-5" />
              {user && (
                <span className="hidden md:inline text-xs font-semibold text-stone-700">
                  {user.displayName.split(' ')[0]}
                </span>
              )}
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 text-stone-700 hover:text-copper cursor-pointer"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isOpen && (
        <div className="lg:hidden bg-white border-t border-stone-200 px-4 py-4 space-y-3 shadow-inner">
          {/* Mobile Search */}
          <form onSubmit={handleSearch} className="relative w-full">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-lg py-2 pl-4 pr-10 text-sm focus:outline-none focus:border-copper"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Navigation Links */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block px-3 py-1">
              Shop Categories
            </span>
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/shop?category=${c.slug}`}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 hover:text-copper rounded-md"
              >
                {c.name}
              </Link>
            ))}
            
            <div className="border-t border-stone-100 my-2" />
            
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block px-3 py-1">
              Services
            </span>
            <Link
              href="/wholesale"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 hover:text-copper rounded-md"
            >
              Wholesale Catalog & RFQ
            </Link>
            <Link
              href="/scrap"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-scrap hover:bg-teal-50 rounded-md flex items-center gap-1.5"
            >
              <Scale className="w-4 h-4" /> Sell Old Scrap Material
            </Link>
            <Link
              href="/blog"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 hover:text-copper rounded-md flex items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4 text-copper" /> Kitchen Guides &amp; Blog
            </Link>
          </div>

          {/* Mobile Pricing Toggle */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between px-3">
            <span className="text-xs font-semibold text-stone-500">Wholesale Pricing:</span>
            <button
              onClick={() => {
                toggleWholesaleMode(!isWholesaleMode);
                setIsOpen(false);
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                isWholesaleMode 
                  ? 'bg-copper text-white border-copper' 
                  : 'bg-stone-100 text-stone-700 border-stone-300'
              }`}
            >
              {isWholesaleMode ? 'ACTIVE' : 'INACTIVE'}
            </button>
          </div>
        </div>
      )}

      {/* Mobile Sticky Tab-Bar Navigation (Always visible on small screens at the bottom) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 z-40 flex justify-around py-2 px-1 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <Link href="/" className="flex flex-col items-center justify-center text-stone-600 hover:text-copper">
          <Landmark className="w-4.5 h-4.5" />
          <span className="text-[9px] font-semibold mt-1">Home</span>
        </Link>
        <Link href="/shop" className="flex flex-col items-center justify-center text-stone-600 hover:text-copper">
          <Flame className="w-4.5 h-4.5" />
          <span className="text-[9px] font-semibold mt-1">Shop</span>
        </Link>
        <Link href="/scrap" className="flex flex-col items-center justify-center text-stone-600 hover:text-scrap">
          <Scale className="w-4.5 h-4.5 text-scrap" />
          <span className="text-[9px] font-semibold mt-1 text-scrap">Scrap</span>
        </Link>
        <Link href="/cart" className="flex flex-col items-center justify-center text-stone-600 hover:text-copper relative">
          <ShoppingCart className="w-4.5 h-4.5" />
          {cartCount > 0 && (
            <span className="absolute top-0 right-1.5 bg-copper text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
          <span className="text-[9px] font-semibold mt-1">Cart</span>
        </Link>
        <Link 
          href={user ? (user.role === 'admin' || user.role === 'staff' ? '/admin' : '/account') : '/account'} 
          className="flex flex-col items-center justify-center text-stone-600 hover:text-copper"
        >
          <User className="w-4.5 h-4.5" />
          <span className="text-[9px] font-semibold mt-1">Account</span>
        </Link>
      </div>
    </header>
  );
}
