import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { ShoppingBag, ArrowLeft, MessageCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full text-center space-y-6 bg-white border border-stone-200 p-8 rounded-3xl shadow-sm">
          
          <div className="w-16 h-16 bg-copper/10 text-copper rounded-2xl mx-auto flex items-center justify-center">
            <ShoppingBag className="w-8 h-8" />
          </div>

          <div>
            <span className="text-4xl font-extrabold text-copper font-mono">404</span>
            <h1 className="text-2xl font-extrabold text-stone-900 font-serif mt-2">
              Page Not Found
            </h1>
            <p className="text-xs text-stone-500 mt-2 leading-relaxed">
              The page or product you are looking for might have been removed, renamed, or is temporarily unavailable.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/shop"
              className="flex-1 bg-copper hover:bg-copper-dark text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              Browse Products
            </Link>
            <Link
              href="/"
              className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Go Home
            </Link>
          </div>

          <div className="pt-4 border-t border-stone-100">
            <a
              href="https://wa.me/919949408061"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              <MessageCircle className="w-4 h-4" /> Need assistance? WhatsApp +91 99494 08061
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
