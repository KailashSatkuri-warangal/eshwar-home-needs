'use client';

import React from 'react';
import Link from 'next/link';
import { Landmark, Phone, Mail, Clock, MapPin, ArrowUpRight } from 'lucide-react';
import { BUSINESS_DETAILS } from '@/lib/services/invoice';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-stone-900 text-stone-300 pt-12 pb-20 lg:pb-12 border-t-4 border-copper">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        
        {/* About & Brand Info */}
        <div className="space-y-4">
          <Link href="/" className="flex flex-col">
            <span className="text-xl font-extrabold text-white tracking-tight flex items-center gap-1 font-serif">
              ESHwar
              <span className="text-copper text-xs font-sans font-bold px-1.5 py-0.5 rounded-sm bg-copper/20 border border-copper/30">
                HOME
              </span>
            </span>
            <span className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">
              Smart Retail & Wholesale
            </span>
          </Link>
          
          <p className="text-xs text-stone-400 leading-relaxed">
            Your trusted local destination for authentic stainless steel utensils, tri-ply cookware, pure brass, copper kitchen needs, and smart recycling scrap payouts in Hanumakonda since 2011.
          </p>

          <div className="text-xs text-stone-400 space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-copper" />
              <span>Mon - Sat: 9:30 AM - 8:30 PM (Sun Holiday)</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-copper" />
              <span>{BUSINESS_DETAILS.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-copper" />
              <span className="break-all">{BUSINESS_DETAILS.email}</span>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 font-serif">
            Quick Links
          </h4>
          <ul className="space-y-2 text-xs font-semibold">
            <li>
              <Link href="/shop" className="hover:text-copper transition-colors">Product Catalog</Link>
            </li>
            <li>
              <Link href="/wholesale" className="hover:text-copper transition-colors">Wholesale Program & RFQ</Link>
            </li>
            <li>
              <Link href="/scrap" className="hover:text-scrap-light transition-colors text-scrap-light">Sell Old Scrap Online</Link>
            </li>
            <li>
              <Link href="/account" className="hover:text-copper transition-colors">My Customer Account</Link>
            </li>
          </ul>
        </div>

        {/* Categories Shortcut */}
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 font-serif">
            Categories
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/shop?category=steel-vessels" className="hover:text-copper transition-colors">Steel Vessels & Topes</Link>
            </li>
            <li>
              <Link href="/shop?category=triply-cookware" className="hover:text-copper transition-colors">Triply Kadais & Frypans</Link>
            </li>
            <li>
              <Link href="/shop?category=brass" className="hover:text-copper transition-colors">Traditional Brass Urlis</Link>
            </li>
            <li>
              <Link href="/shop?category=copper" className="hover:text-copper transition-colors">Hammered Copper Bottles</Link>
            </li>
            <li>
              <Link href="/shop?category=plastic" className="hover:text-copper transition-colors">Kitchen Plastic Organizers</Link>
            </li>
          </ul>
        </div>

        {/* Location & Styled Offline Maps Block */}
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 font-serif">
            Store Location
          </h4>
          <div className="bg-stone-800 rounded-xl p-3 border border-stone-700 space-y-3">
            <div className="flex gap-2">
              <MapPin className="w-4 h-4 text-copper shrink-0 mt-0.5" />
              <p className="text-[11px] text-stone-300 leading-normal">
                {BUSINESS_DETAILS.address}
              </p>
            </div>
            
            {/* Styled Map Preview Box */}
            <a 
              href="https://maps.app.goo.gl/m1BTU3YJSxmDKnnd6" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group block relative w-full h-24 bg-stone-700 rounded-lg overflow-hidden border border-stone-600 flex items-center justify-center cursor-pointer"
            >
              {/* Abstract Map Grid Lines using inline CSS grid background */}
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
              
              {/* Simulated Map Markers and labels */}
              <div className="absolute top-1/3 left-1/3 w-3 h-3 bg-red-600 rounded-full animate-ping" />
              <div className="absolute top-1/3 left-1/3 w-2.5 h-2.5 bg-red-500 rounded-full border border-white" />
              <span className="absolute top-1/2 left-1/3 mt-1.5 ml-1 text-[8px] font-bold bg-stone-900/90 text-white px-1.5 py-0.5 rounded shadow-sm">
                ESHwar Shop
              </span>

              <div className="absolute bottom-2 right-2 bg-stone-900/85 text-[8px] text-white px-2 py-0.5 rounded flex items-center gap-0.5 font-bold group-hover:bg-copper transition-colors">
                Open Maps
                <ArrowUpRight className="w-2.5 h-2.5" />
              </div>
            </a>
          </div>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-stone-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-stone-500">
        <p>© {currentYear} {BUSINESS_DETAILS.name}. All Rights Reserved.</p>
        <div className="flex gap-6">
          <Link href="/privacy" className="hover:text-copper transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-copper transition-colors">Terms of Service</Link>
          <span>GSTIN: {BUSINESS_DETAILS.gstin}</span>
        </div>
      </div>
    </footer>
  );
}
