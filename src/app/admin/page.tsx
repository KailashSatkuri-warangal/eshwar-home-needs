'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { 
  MOCK_CATEGORIES, MOCK_PRODUCTS, MOCK_SCRAP_RATES, MOCK_REVIEWS 
} from '@/lib/mockData';
import { 
  IndianRupee, Package, FileText, Scale, AlertTriangle, 
  TrendingUp, Users, ArrowUpRight, TrendingDown 
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [seeding, setSeeding] = useState(false);
  const [stats, setStats] = useState({
    todaySales: 24890,
    ordersCount: 14,
    wholesaleEnquiries: 8,
    pendingQuotes: 3,
    scrapRequests: 6,
    scrapPayouts: 8200,
    lowStockCount: 4,
    customersCount: 182,
  });

  const handleSeedDatabase = async () => {
    if (seeding) return;
    if (!confirm('Are you sure you want to seed the database with categories, products, scrap rates, and reviews?')) return;
    setSeeding(true);
    try {
      // 1. Seed Categories
      for (const cat of MOCK_CATEGORIES) {
        await setDoc(doc(db, 'categories', cat.id), cat);
      }

      // 2. Seed Products
      for (const prod of MOCK_PRODUCTS) {
        await setDoc(doc(db, 'products', prod.id), {
          ...prod,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // 3. Seed Scrap Rates
      for (const rate of MOCK_SCRAP_RATES) {
        await setDoc(doc(db, 'scrapRates', rate.id), {
          ...rate,
          updatedAt: new Date(),
        });
      }

      // 4. Seed Reviews
      for (const rev of MOCK_REVIEWS) {
        await setDoc(doc(db, 'reviews', rev.id), {
          ...rev,
          createdAt: new Date(),
        });
      }

      // Seeding completed successfully
      alert('Database successfully seeded with ESHwar Home Needs starter data! You can now visit /shop or /admin/products.');
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Seeding failed: ' + (err as Error).message);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-stone-100 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 font-serif">Back-Office Analytics</h1>
          <p className="text-xs text-stone-500 mt-0.5">Real-time statistics of retail orders, wholesale requests, and scrap buying volumes</p>
        </div>
        <button
          onClick={handleSeedDatabase}
          disabled={seeding}
          className="bg-copper hover:bg-copper-dark text-white font-bold px-4 py-2.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
        >
          {seeding ? 'Seeding Firestore...' : 'Seed Starter Products'}
        </button>
      </div>

      {/* Overview Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Today's Sales */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-stone-400 block">Today's Revenue</span>
            <h3 className="text-2xl font-extrabold text-stone-900">₹{stats.todaySales.toLocaleString('en-IN')}</h3>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> +12.4% vs yesterday
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-copper/10 text-copper flex items-center justify-center">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>

        {/* Orders Count */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-stone-400 block">Retail Orders</span>
            <h3 className="text-2xl font-extrabold text-stone-900">{stats.ordersCount}</h3>
            <span className="text-[10px] text-stone-500 font-medium">9 orders processing</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Quotations */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-stone-400 block">Pending Quotes</span>
            <h3 className="text-2xl font-extrabold text-stone-900">{stats.pendingQuotes}</h3>
            <span className="text-[10px] text-amber-600 font-bold block">Action required</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Scrap requests */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-stone-400 block">Scrap Requests</span>
            <h3 className="text-2xl font-extrabold text-stone-900">{stats.scrapRequests}</h3>
            <span className="text-[10px] text-emerald-600 font-bold block">3 pickups scheduled</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center">
            <Scale className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Charts & Warning Lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Chart (2/3 width) */}
        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider border-b border-stone-100 pb-2">
            Weekly Sales Volume (₹)
          </h3>
          
          {/* Custom Styled Graph using Flex Box */}
          <div className="h-56 flex items-end justify-between gap-4 pt-6 px-4">
            {[
              { day: 'Mon', val: 12000, height: '40%' },
              { day: 'Tue', val: 18500, height: '60%' },
              { day: 'Wed', val: 15400, height: '50%' },
              { day: 'Thu', val: 22100, height: '75%' },
              { day: 'Fri', val: 24890, height: '85%' },
              { day: 'Sat', val: 29000, height: '100%' },
            ].map((bar) => (
              <div key={bar.day} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                {/* Tooltip value */}
                <span className="text-[9px] font-bold text-stone-700 bg-stone-100 px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  ₹{bar.val / 1000}k
                </span>
                {/* Bar */}
                <div 
                  className="w-full bg-copper/20 hover:bg-copper rounded-t-sm transition-all duration-300"
                  style={{ height: bar.height }}
                />
                <span className="text-[10px] text-stone-400 font-semibold">{bar.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts (1/3 width) */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-1.5 border-b border-stone-100 pb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
              Inventory Alert
            </h3>
          </div>

          <div className="space-y-3.5 text-xs text-stone-600">
            {[
              { name: 'Triply Kadai 3L', stock: 4, threshold: 5 },
              { name: 'Copper Water Bottle 1L', stock: 12, threshold: 15 },
              { name: 'Stainless Steel Topes', stock: 8, threshold: 10 },
              { name: 'Brass Urli Decor', stock: 2, threshold: 3 },
            ].map((item) => (
              <div key={item.name} className="flex justify-between items-center bg-amber-50/50 p-2.5 rounded-lg border border-amber-100/50">
                <div>
                  <span className="font-bold text-stone-800 block">{item.name}</span>
                  <span className="text-[10px] text-stone-400 block mt-0.5">Threshold: {item.threshold} units</span>
                </div>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                  Stock: {item.stock}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 text-center">
            <Link 
              href="/admin/products"
              className="text-[10px] font-bold text-copper hover:underline uppercase"
            >
              Manage stock levels
            </Link>
          </div>
        </div>

      </div>

      {/* B2B vs Scrap Volume Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Recent wholesale RFQ notifications list */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider border-b border-stone-100 pb-2">
            Recent Wholesale Quotations
          </h3>
          <div className="space-y-3 text-xs text-stone-600">
            {[
              { company: 'Taj Hotel Bengaluru', items: 3, val: 42000, date: '1 hr ago' },
              { company: 'Golden Caterers', items: 5, val: 28500, date: '3 hrs ago' },
              { company: 'Karthik Rao (Merchant)', items: 1, val: 12900, date: 'Yesterday' },
            ].map((q, index) => (
              <div key={index} className="flex justify-between items-center py-1.5 border-b border-stone-100 last:border-0">
                <div>
                  <span className="font-semibold text-stone-800 block">{q.company}</span>
                  <span className="text-[10px] text-stone-400 mt-0.5 block">{q.items} products requested • {q.date}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-stone-950 block">₹{q.val.toLocaleString('en-IN')}</span>
                  <Link href="/admin/quotes" className="text-[9px] text-copper hover:underline font-bold block mt-0.5">
                    Edit Quote →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Scrap Bookings */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider border-b border-stone-100 pb-2">
            Pending Scrap Pickups
          </h3>
          <div className="space-y-3 text-xs text-stone-600">
            {[
              { client: 'Priya Sharma', material: 'Copper (10 kg)', slot: 'Today, 1PM', status: 'SCHEDULED' },
              { client: 'Yusuf Ali', material: 'Brass (15 kg)', slot: 'Tomorrow, 10AM', status: 'SCHEDULED' },
              { client: 'Mohit Reddy', material: 'Stainless Steel (25 kg)', slot: '15-Aug, 4PM', status: 'REQUESTED' },
            ].map((scrp, index) => (
              <div key={index} className="flex justify-between items-center py-1.5 border-b border-stone-100 last:border-0">
                <div>
                  <span className="font-semibold text-stone-800 block">{scrp.client}</span>
                  <span className="text-[10px] text-stone-400 mt-0.5 block">Material: {scrp.material} • Slot: {scrp.slot}</span>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                    scrp.status === 'SCHEDULED' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {scrp.status}
                  </span>
                  <Link href="/admin/scrap" className="text-[9px] text-copper hover:underline font-bold block mt-1.5">
                    Assign Collector →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
