'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, MessageCircle, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="bg-white border border-stone-200 rounded-3xl max-w-md w-full p-8 text-center shadow-lg space-y-6">
        
        {/* Badge */}
        <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl mx-auto flex items-center justify-center">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-bold text-copper uppercase tracking-widest block mb-1 font-mono">
            System Notice
          </span>
          <h1 className="text-2xl font-extrabold text-stone-900 font-serif">
            Something Went Wrong
          </h1>
          <p className="text-sm text-stone-500 mt-2 leading-relaxed">
            We encountered a temporary hiccup while processing your request. Please try refreshing or contact our support team.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="flex-1 bg-copper hover:bg-copper-dark text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
          <Link
            href="/"
            className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
          >
            <Home className="w-4 h-4" /> Home
          </Link>
        </div>

        {/* WhatsApp Contact */}
        <div className="pt-4 border-t border-stone-100">
          <a
            href="https://wa.me/919949408061?text=Hi%20ESHwar%20Home%20Needs,%20I%20need%20help%20with%20an%20issue%20on%20the%20website."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            <MessageCircle className="w-4 h-4" /> Need quick help? WhatsApp us at +91 99494 08061
          </a>
        </div>
      </div>
    </div>
  );
}
