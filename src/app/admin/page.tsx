'use client';

import React, { useState, useEffect } from 'react';
import { getDbDocs, setDbDoc, subscribeDbCollection } from '@/lib/services/db';
import { Order, Quote, ScrapRequest, Product } from '@/types';
import { 
  MOCK_CATEGORIES, MOCK_PRODUCTS, MOCK_SCRAP_RATES, MOCK_REVIEWS 
} from '@/lib/mockData';
import { 
  IndianRupee, Package, FileText, Scale, AlertTriangle, 
  TrendingUp, Users, ArrowUpRight, TrendingDown, RefreshCw 
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [seeding, setSeeding] = useState(false);
  const [loadingDb, setLoadingDb] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [scrapRequests, setScrapRequests] = useState<ScrapRequest[]>([]);
  const [customersCount, setCustomersCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  const [stats, setStats] = useState({
    todaySales: 0,
    ordersCount: 0,
    wholesaleEnquiries: 0,
    pendingQuotes: 0,
    scrapRequests: 0,
    scrapPayouts: 0,
    lowStockCount: 0,
    customersCount: 0,
  });

  // 1. Subscribe to all collections in real-time
  useEffect(() => {
    setLoadingDb(true);

    const unsubOrders = subscribeDbCollection('orders', (allOrders: Order[]) => {
      setOrders(allOrders);
      setLoadingDb(false);
    });

    const unsubQuotes = subscribeDbCollection('quotes', (allQuotes: Quote[]) => {
      setQuotes(allQuotes);
    });

    const unsubScraps = subscribeDbCollection('scrapRequests', (allScraps: ScrapRequest[]) => {
      setScrapRequests(allScraps);
    });

    const unsubUsers = subscribeDbCollection('users', (allUsers: any[]) => {
      const customerList = allUsers.filter(u => u.role === 'customer') || [];
      setCustomersCount(customerList.length || allUsers.length || 0);
    });

    const unsubProducts = subscribeDbCollection('products', (allProducts: Product[]) => {
      const lowStockVal = allProducts.filter(p => p.stockQuantity <= (p.lowStockThreshold || 5)).length;
      setLowStockCount(lowStockVal);
    });

    return () => {
      unsubOrders();
      unsubQuotes();
      unsubScraps();
      unsubUsers();
      unsubProducts();
    };
  }, []);

  // 2. Reactively compute aggregate metrics
  useEffect(() => {
    // Today's Sales
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);
    const todaySalesVal = orders
      .filter(o => {
        const date = o.createdAt?.seconds 
          ? new Date(o.createdAt.seconds * 1000) 
          : new Date(o.createdAt as string);
        return date >= startOfDay;
      })
      .reduce((sum, o) => sum + (o.grandTotal || 0), 0);

    // Pending Quotes
    const pendingQ = quotes.filter(q => q.status === 'REQUESTED').length;

    // Scrap Requests
    const pendingS = scrapRequests.filter(s => s.status === 'REQUESTED' || s.status === 'SCHEDULED').length;

    // Scrap Payouts
    const payoutsVal = scrapRequests
      .filter(s => s.status === 'PAYMENT_COMPLETED')
      .reduce((sum, s) => sum + (s.finalAmount || 0), 0);

    setStats({
      todaySales: todaySalesVal,
      ordersCount: orders.length,
      wholesaleEnquiries: quotes.length,
      pendingQuotes: pendingQ,
      scrapRequests: pendingS,
      scrapPayouts: payoutsVal,
      lowStockCount: lowStockCount,
      customersCount: customersCount,
    });
  }, [orders, quotes, scrapRequests, customersCount, lowStockCount]);

  const handleSeedDatabase = async () => {
    if (seeding) return;
    if (!confirm('Are you sure you want to seed the database with categories, products, scrap rates, and reviews?')) return;
    setSeeding(true);
    try {
      // 1. Seed Categories
      for (const cat of MOCK_CATEGORIES) {
        await setDbDoc('categories', cat.id, cat);
      }

      // 2. Seed Products
      for (const prod of MOCK_PRODUCTS) {
        await setDbDoc('products', prod.id, {
          ...prod,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // 3. Seed Scrap Rates
      for (const rate of MOCK_SCRAP_RATES) {
        await setDbDoc('scrapRates', rate.id, {
          ...rate,
          updatedAt: new Date(),
        });
      }

      // 4. Seed Reviews
      for (const rev of MOCK_REVIEWS) {
        await setDbDoc('reviews', rev.id, {
          ...rev,
          createdAt: new Date(),
        });
      }

      // Seeding completed successfully
      alert('Database successfully seeded with ESHwar Home Needs starter data!');
    } catch (err) {
      console.error(err);
      alert('Seeding failed: ' + (err as Error).message);
    } finally {
      setSeeding(false);
    }
  };

  const getWeeklyChartData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const chartData = [];
    
    // We'll show the last 6 days including today
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - i);
      targetDate.setHours(0,0,0,0);
      
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayName = days[targetDate.getDay()];
      
      const daySales = orders
        .filter(o => {
          const date = o.createdAt?.seconds 
            ? new Date(o.createdAt.seconds * 1000) 
            : new Date(o.createdAt as string);
          return date >= targetDate && date < nextDate;
        })
        .reduce((sum, o) => sum + (o.grandTotal || 0), 0);
        
      chartData.push({
        day: dayName,
        val: daySales,
      });
    }
    
    // Calculate heights relative to max value
    const maxVal = Math.max(...chartData.map(d => d.val), 1000); // at least 1000 scale
    return chartData.map(d => ({
      ...d,
      height: `${Math.max(5, (d.val / maxVal) * 100)}%`,
    }));
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-stone-100 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 font-serif">Back-Office Analytics</h1>
          <p className="text-xs text-stone-500 mt-0.5">Real-time statistics of retail orders, wholesale requests, and scrap buying volumes</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/50 px-3 py-1.5 rounded-full text-[10px] font-bold">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span>Live Sync Active</span>
          </div>
          <button
            onClick={handleSeedDatabase}
            disabled={seeding}
            className="bg-copper hover:bg-copper-dark text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            {seeding ? 'Seeding...' : 'Seed Starter Products'}
          </button>
        </div>
      </div>

      {/* Overview Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Today's Sales */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-stone-400 block">Today's Revenue</span>
            <h3 className="text-2xl font-extrabold text-stone-900">₹{stats.todaySales.toLocaleString('en-IN')}</h3>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> Live calculations
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
            <span className="text-[10px] text-stone-500 font-medium">Total database count</span>
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
            <span className="text-[10px] text-amber-600 font-bold block">Need review</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Scrap requests */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-stone-400 block">Active Pickups</span>
            <h3 className="text-2xl font-extrabold text-stone-900">{stats.scrapRequests}</h3>
            <span className="text-[10px] text-emerald-600 font-bold block">Scheduled collections</span>
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
            {getWeeklyChartData().map((bar) => (
              <div key={bar.day} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                {/* Tooltip value */}
                <span className="text-[9px] font-bold text-stone-700 bg-stone-100 px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  ₹{bar.val.toLocaleString('en-IN')}
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
            {lowStockCount > 0 ? (
              <p className="text-[10px] text-amber-700 font-semibold p-2 bg-amber-50 rounded border border-amber-100">
                ⚠️ Low stock items found in catalog: {lowStockCount} items below threshold.
              </p>
            ) : (
              <p className="text-[10px] text-emerald-700 font-semibold p-2 bg-emerald-50 rounded border border-emerald-100 text-center">
                ✅ Inventory healthy! No items low on stock.
              </p>
            )}
            <div className="pt-2 text-center">
              <Link 
                href="/admin/products"
                className="text-[10px] font-bold text-copper hover:underline uppercase"
              >
                Manage Product Catalog
              </Link>
            </div>
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
            {quotes
              .sort((a, b) => {
                const timeA = a.createdAt?.seconds || (typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() / 1000 : 0) || 0;
                const timeB = b.createdAt?.seconds || (typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() / 1000 : 0) || 0;
                return timeB - timeA;
              })
              .slice(0, 3)
              .map((q) => (
                <div key={q.id} className="flex justify-between items-center py-1.5 border-b border-stone-100 last:border-0">
                  <div>
                    <span className="font-semibold text-stone-800 block">{q.customerDetails.companyName || q.customerDetails.name}</span>
                    <span className="text-[10px] text-stone-400 mt-0.5 block">{q.items.length} products requested • ID: {q.id.toUpperCase()}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-stone-950 block">₹{(q.grandTotal || 0).toLocaleString('en-IN')}</span>
                    <Link href="/admin/quotes" className="text-[9px] text-copper hover:underline font-bold block mt-0.5">
                      Configure Quote →
                    </Link>
                  </div>
                </div>
              ))}
            {quotes.length === 0 && (
              <div className="text-center py-6 text-stone-400">No quotation requests found.</div>
            )}
          </div>
        </div>

        {/* Recent Scrap Bookings */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider border-b border-stone-100 pb-2">
            Pending Scrap Pickups
          </h3>
          <div className="space-y-3 text-xs text-stone-600">
            {scrapRequests
              .filter(s => s.status === 'REQUESTED' || s.status === 'SCHEDULED')
              .sort((a, b) => {
                const timeA = a.createdAt?.seconds || (typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() / 1000 : 0) || 0;
                const timeB = b.createdAt?.seconds || (typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() / 1000 : 0) || 0;
                return timeB - timeA;
              })
              .slice(0, 3)
              .map((scrp) => (
                <div key={scrp.id} className="flex justify-between items-center py-1.5 border-b border-stone-100 last:border-0">
                  <div>
                    <span className="font-semibold text-stone-800 block">{scrp.customerDetails.name}</span>
                    <span className="text-[10px] text-stone-400 mt-0.5 block">
                      Material: {scrp.material.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} ({scrp.estimatedWeight} kg)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                      scrp.status === 'SCHEDULED' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {scrp.status}
                    </span>
                    <Link href="/admin/scrap" className="text-[9px] text-copper hover:underline font-bold block mt-1.5">
                      Verify &amp; Payout →
                    </Link>
                  </div>
                </div>
              ))}
            {scrapRequests.filter(s => s.status === 'REQUESTED' || s.status === 'SCHEDULED').length === 0 && (
              <div className="text-center py-6 text-stone-400">No pending scrap pickups found.</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
