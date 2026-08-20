'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { useApp } from '@/context/AppContext';
import { Order, Quote, ScrapRequest, CustomerType, Product } from '@/types';
import { getDbDocsFiltered } from '@/lib/services/db';
import { generateInvoicePDF, generateQuotationPDF } from '@/lib/services/invoice';
import { 
  User, Package, FileText, Scale, Heart, LogOut, Key, 
  MapPin, CheckCircle, Clock, AlertTriangle, ChevronRight, Eye, RotateCw
} from 'lucide-react';
import Link from 'next/link';
import { MOCK_PRODUCTS } from '@/lib/mockData';

export default function AccountPage() {
  const { user, userLoading, login, logout, registerUser, wishlist, showToast } = useApp();
  
  // Auth Form States
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Wholesale details on register
  const [isWholesaleRegister, setIsWholesaleRegister] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [gstin, setGstin] = useState('');
  const [customerType, setCustomerType] = useState<CustomerType>('retailer');

  // Customer Panel States
  const [activeTab, setActiveTab] = useState<'orders' | 'quotes' | 'scrap' | 'wishlist' | 'profile'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [scraps, setScraps] = useState<ScrapRequest[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch histories when user changes
  useEffect(() => {
    if (user) {
      setLoadingHistory(true);
      
      const fetchHistory = async () => {
        if (user.uid === 'admin_demo_account') {
          // Dev bypass: use empty arrays to avoid Firestore read violations on local anonymous state
          setOrders([]);
          setQuotes([]);
          setScraps([]);
          setLoadingHistory(false);
          return;
        }

        try {
          // 1. Fetch Orders
          const ordersList = await getDbDocsFiltered('orders', 'userId', user.uid) as Order[];
          ordersList.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          setOrders(ordersList);

          // 2. Fetch Quotations
          const quotesList = await getDbDocsFiltered('quotes', 'userId', user.uid) as Quote[];
          quotesList.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          setQuotes(quotesList);

          // 3. Fetch ScrapRequests
          const scrapsList = await getDbDocsFiltered('scrapRequests', 'userId', user.uid) as ScrapRequest[];
          scrapsList.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          setScraps(scrapsList);
        } catch (e) {
          console.error('Error loading history maps:', e);
        } finally {
          setLoadingHistory(false);
        }
      };

      fetchHistory();
    }
  }, [user]);

  // Auth Submits
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      if (isRegister) {
        if (!name) {
          showToast('Name is required.', 'error');
          return;
        }
        
        const wholesaleDetails = isWholesaleRegister ? {
          companyName,
          gstin: gstin.toUpperCase(),
          customerType,
          phone,
        } : { phone };

        await registerUser(
          email, 
          password, 
          name, 
          isWholesaleRegister ? 'wholesale' : 'customer', 
          wholesaleDetails
        );
      } else {
        await login(email, password);
      }
    } catch (err) {
      console.error(err);
      showToast((err as Error).message, 'error');
    }
  };

  // Downloads GST Invoice PDF
  const handleInvoiceDownload = (order: Order) => {
    const docPdf = generateInvoicePDF(order);
    docPdf.save(`ESHwar_Invoice_${order.id.slice(0, 8).toUpperCase()}.pdf`);
    showToast('Invoice PDF downloaded!', 'success');
  };

  // Downloads Proforma Quotation PDF
  const handleQuoteDownload = (quote: Quote) => {
    const docPdf = generateQuotationPDF(quote);
    docPdf.save(`ESHwar_Quote_${quote.id.slice(0, 8).toUpperCase()}.pdf`);
    showToast('Quotation PDF downloaded!', 'success');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
      case 'ACCEPTED':
      case 'PAYMENT_COMPLETED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CANCELLED':
      case 'REJECTED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'PLACED':
      case 'REQUESTED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  const getMaterialLabel = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // LOADING STATE
  if (userLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex items-center justify-center bg-cream">
          <RotateCw className="w-8 h-8 text-copper animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  // 1. NON-AUTHENTICATED SESSION: LOGIN / REGISTER FORMS
  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow max-w-md mx-auto px-4 py-16 w-full space-y-6">
          
          <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-extrabold font-serif text-stone-900">
                {isRegister ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                {isRegister ? 'Register to save addresses and track quotes' : 'Sign in to access your retail or wholesale order center'}
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs text-stone-600">
              {isRegister && (
                <>
                  <div>
                    <label className="text-[10px] font-semibold text-stone-500 block mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Karthik Rao"
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2.5 focus:outline-none focus:border-copper"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-stone-500 block mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2.5 focus:outline-none focus:border-copper"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-[10px] font-semibold text-stone-500 block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. name@company.com"
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-stone-500 block mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2.5 focus:outline-none"
                />
              </div>

              {/* Wholesale Registration subform */}
              {isRegister && (
                <div className="pt-2 border-t border-stone-100 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="wholesale"
                      checked={isWholesaleRegister}
                      onChange={(e) => setIsWholesaleRegister(e.target.checked)}
                      className="accent-copper cursor-pointer"
                    />
                    <label htmlFor="wholesale" className="text-xs font-bold text-stone-700 cursor-pointer">
                      Register as Wholesale B2B Customer
                    </label>
                  </div>

                  {isWholesaleRegister && (
                    <div className="space-y-3.5 pl-5 pt-1.5 border-l-2 border-copper bg-copper/5 p-3 rounded-r-lg">
                      <div>
                        <label className="text-[10px] font-semibold text-stone-500 block mb-1">Company / Hotel Name *</label>
                        <input
                          type="text"
                          required={isWholesaleRegister}
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="e.g. ESHwar Catering Services"
                          className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-semibold text-stone-500 block mb-1">Business Type *</label>
                          <select
                            value={customerType}
                            onChange={(e) => setCustomerType(e.target.value as CustomerType)}
                            className="w-full bg-white border border-stone-300 rounded px-2 py-1.5 focus:outline-none"
                          >
                            <option value="retailer">Retailer / Dealer</option>
                            <option value="hotel">Hotel / Lodge</option>
                            <option value="restaurant">Restaurant</option>
                            <option value="caterer">Caterer</option>
                            <option value="contractor">Builder / Contractor</option>
                            <option value="other">Other Business</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-stone-500 block mb-1">GSTIN Number</label>
                          <input
                            type="text"
                            placeholder="e.g. 29AAAAE1234F"
                            value={gstin}
                            onChange={(e) => setGstin(e.target.value)}
                            className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:outline-none uppercase"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-copper hover:bg-copper-dark text-white font-bold py-3 rounded-lg text-xs uppercase flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Key className="w-4 h-4" />
                <span>{isRegister ? 'Sign Up' : 'Sign In'}</span>
              </button>
            </form>

            <div className="text-center pt-2 border-t border-stone-100">
              <button
                onClick={() => setIsRegister(!isRegister)}
                className="text-xs text-copper hover:underline font-bold"
              >
                {isRegister ? 'Already have an account? Sign In' : 'New customer? Create an account'}
              </button>
            </div>

          </div>

        </main>
        <Footer />
      </div>
    );
  }

  // 2. AUTHENTICATED SESSION: PROFILE & HISTORY DASHBOARD
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* User Greeting Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-stone-200 mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-copper/10 text-copper rounded-full flex items-center justify-center text-lg font-bold">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-stone-900 font-serif leading-none">
                Hello, {user.displayName}
              </h1>
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mt-1 block">
                Account Role: {user.role.toUpperCase()}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="inline-flex items-center gap-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>

        {/* Dashboard Tabs Sidebar & Display Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Tabs Navigation (1/4 width) */}
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors ${
                activeTab === 'orders' ? 'bg-copper text-white' : 'hover:bg-stone-100 text-stone-600'
              }`}
            >
              <Package className="w-4 h-4" /> My Orders ({orders.length})
            </button>
            
            <button
              onClick={() => setActiveTab('quotes')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors ${
                activeTab === 'quotes' ? 'bg-copper text-white' : 'hover:bg-stone-100 text-stone-600'
              }`}
            >
              <FileText className="w-4 h-4" /> Wholesale Quotes ({quotes.length})
            </button>

            <button
              onClick={() => setActiveTab('scrap')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors ${
                activeTab === 'scrap' ? 'bg-copper text-white' : 'hover:bg-stone-100 text-stone-600'
              }`}
            >
              <Scale className="w-4 h-4" /> Scrap Pickups ({scraps.length})
            </button>

            <button
              onClick={() => setActiveTab('wishlist')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors ${
                activeTab === 'wishlist' ? 'bg-copper text-white' : 'hover:bg-stone-100 text-stone-600'
              }`}
            >
              <Heart className="w-4 h-4" /> Saved Wishlist ({wishlist.length})
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors ${
                activeTab === 'profile' ? 'bg-copper text-white' : 'hover:bg-stone-100 text-stone-600'
              }`}
            >
              <User className="w-4 h-4" /> Profile &amp; Addresses
            </button>
          </div>

          {/* Active Tab Screen Panel (3/4 width) */}
          <div className="lg:col-span-3">
            {loadingHistory ? (
              <div className="text-center py-12">
                <RotateCw className="w-6 h-6 text-copper animate-spin mx-auto mb-2" />
                <span className="text-xs text-stone-400 font-semibold">Loading history...</span>
              </div>
            ) : (
              <>
                {/* 1. ORDERS TAB */}
                {activeTab === 'orders' && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-stone-900 text-sm border-b border-stone-100 pb-2 font-serif">Order History</h3>
                    
                    {orders.length > 0 ? (
                      <div className="space-y-4">
                        {orders.map((ord) => (
                          <div key={ord.id} className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 text-xs shadow-xs space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2">
                              <div>
                                <span className="font-bold text-stone-900">ID: {ord.id.toUpperCase()}</span>
                                <span className="text-stone-400 ml-3">
                                  Date: {new Date(ord.createdAt.seconds * 1000).toLocaleDateString('en-IN')}
                                </span>
                              </div>
                              <span className={`px-2 py-0.5 border rounded-full font-bold uppercase text-[9px] ${getStatusColor(ord.status)}`}>
                                {ord.status}
                              </span>
                            </div>

                            <div className="divide-y divide-stone-50">
                              {ord.items.map((item, index) => (
                                <div key={index} className="py-2 flex justify-between">
                                  <span>{item.name} × {item.quantity} {item.unit}</span>
                                  <span className="font-semibold text-stone-800">
                                    ₹{(item.price * item.quantity).toFixed(0)}
                                  </span>
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-stone-100 font-bold text-stone-900">
                              <span>Grand Total: ₹{ord.grandTotal.toFixed(0)}</span>
                              <button
                                onClick={() => handleInvoiceDownload(ord)}
                                className="text-[10px] text-copper hover:underline flex items-center gap-1 cursor-pointer font-bold border border-copper/35 rounded px-2.5 py-1"
                              >
                                <FileText className="w-3.5 h-3.5" /> Invoice PDF
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-stone-400 bg-stone-50 border border-stone-200 rounded-2xl">
                        No orders recorded yet.
                      </div>
                    )}
                  </div>
                )}

                {/* 2. QUOTES TAB */}
                {activeTab === 'quotes' && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-stone-900 text-sm border-b border-stone-100 pb-2 font-serif">Wholesale Quote Enquiries</h3>
                    
                    {quotes.length > 0 ? (
                      <div className="space-y-4">
                        {quotes.map((q) => (
                          <div key={q.id} className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 text-xs shadow-xs space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2">
                              <div>
                                <span className="font-bold text-stone-900">RFQ: {q.id.toUpperCase()}</span>
                                <span className="text-stone-400 ml-3">
                                  Date: {new Date(q.createdAt.seconds * 1000).toLocaleDateString('en-IN')}
                                </span>
                              </div>
                              <span className={`px-2 py-0.5 border rounded-full font-bold uppercase text-[9px] ${getStatusColor(q.status)}`}>
                                {q.status}
                              </span>
                            </div>

                            <div className="divide-y divide-stone-50 text-[11px]">
                              {q.items.map((item, index) => (
                                <div key={index} className="py-2 flex justify-between">
                                  <span>{item.name} × {item.quantity} {item.unit}</span>
                                  {q.status === 'QUOTED' ? (
                                    <span className="font-semibold text-copper">
                                      Offered: ₹{(item.offeredPrice || 0) * item.quantity}
                                    </span>
                                  ) : (
                                    <span className="font-semibold text-stone-500">
                                      Requested: ₹{(item.requestedPrice || 0) * item.quantity}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-stone-100 font-bold text-stone-900">
                              <span>Estimated Quote: ₹{q.grandTotal.toFixed(0)}</span>
                              
                              {q.status === 'QUOTED' && (
                                <button
                                  onClick={() => handleQuoteDownload(q)}
                                  className="text-[10px] text-copper hover:underline flex items-center gap-1 cursor-pointer font-bold border border-copper/35 rounded px-2.5 py-1"
                                >
                                  <FileText className="w-3.5 h-3.5" /> Download Quote Sheet
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-stone-400 bg-stone-50 border border-stone-200 rounded-2xl">
                        No quotations requested yet.
                      </div>
                    )}
                  </div>
                )}

                {/* 3. SCRAPS TAB */}
                {activeTab === 'scrap' && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-stone-900 text-sm border-b border-stone-100 pb-2 font-serif">Scrap Doorstep Pickups</h3>
                    
                    {scraps.length > 0 ? (
                      <div className="space-y-4">
                        {scraps.map((scrp) => (
                          <div key={scrp.id} className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 text-xs shadow-xs space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2">
                              <div>
                                <span className="font-bold text-stone-900">ID: {scrp.id.toUpperCase()}</span>
                                <span className="text-stone-400 ml-3">
                                  Pickup: {scrp.preferredDate}
                                </span>
                              </div>
                              <span className={`px-2 py-0.5 border rounded-full font-bold uppercase text-[9px] ${getStatusColor(scrp.status)}`}>
                                {scrp.status}
                              </span>
                            </div>

                            <div className="space-y-1.5 text-stone-600">
                              <p>Material Category: <strong className="text-stone-800 capitalize">{getMaterialLabel(scrp.material)}</strong></p>
                              <p>Estimated Weight: <strong className="text-stone-800">{scrp.estimatedWeight} kg</strong></p>
                              
                              {scrp.actualWeight && (
                                <div className="bg-emerald-50 border border-emerald-200/50 p-2.5 rounded-lg text-emerald-800">
                                  <strong>Verified Weights:</strong>
                                  <p className="mt-0.5">Scale weight: {scrp.actualWeight} kg @ ₹{scrp.actualRate}/kg</p>
                                  <p className="font-bold">Final Cash Paid: ₹{scrp.finalAmount}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-stone-400 bg-stone-50 border border-stone-200 rounded-2xl">
                        No scrap pickup requests recorded.
                      </div>
                    )}
                  </div>
                )}

                {/* 4. WISHLIST TAB */}
                {activeTab === 'wishlist' && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-stone-900 text-sm border-b border-stone-100 pb-2 font-serif">Saved Wishlist</h3>
                    
                    {wishlist.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {wishlist.map((id) => {
                          const product = MOCK_PRODUCTS.find((p: Product) => p.id === id);
                          if (!product) return null;

                          return (
                            <div key={id} className="bg-white border border-stone-200 rounded-xl p-3 flex gap-3 shadow-xs items-center justify-between">
                              <div className="flex gap-3 items-center">
                                <img src={product.originalImage} alt={product.name} className="w-12 h-12 object-cover rounded-lg border" />
                                <div>
                                  <span className="font-bold text-stone-800 text-xs block line-clamp-1">{product.name}</span>
                                  <span className="text-[10px] text-copper font-bold block">₹{product.discountPrice || product.retailPrice}</span>
                                </div>
                              </div>
                              <Link href={`/shop/${product.id}`} className="p-2 text-stone-500 hover:text-copper">
                                <Eye className="w-4 h-4" />
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-stone-400 bg-stone-50 border border-stone-200 rounded-2xl">
                        Wishlist is empty. Save products by clicking bookmark icons in catalog shop.
                      </div>
                    )}
                  </div>
                )}

                {/* 5. PROFILE TAB */}
                {activeTab === 'profile' && (
                  <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4 text-xs text-stone-600">
                    <h3 className="font-bold text-stone-900 text-sm border-b border-stone-100 pb-2 font-serif">Profile Details</h3>
                    <div className="space-y-2.5">
                      <p>Full Name: <strong className="text-stone-800">{user.displayName}</strong></p>
                      <p>Registered Email: <strong className="text-stone-800">{user.email}</strong></p>
                      <p>Verification Role: <strong className="text-stone-800 capitalize">{user.role}</strong></p>
                      {user.phone && <p>Registered Phone: <strong className="text-stone-800">{user.phone}</strong></p>}
                    </div>

                    {user.role === 'wholesale' && (
                      <div className="pt-4 border-t border-stone-100 space-y-2 bg-copper/5 p-4 rounded-xl border border-copper/10 mt-4">
                        <h4 className="font-bold text-stone-800 text-xs">Wholesale B2B Credentials:</h4>
                        <p>Company Name: <strong className="text-stone-800">{user.companyName}</strong></p>
                        <p>Customer Type: <strong className="text-stone-800 capitalize">{user.customerType}</strong></p>
                        {user.gstin && <p>GSTIN Code: <strong className="text-stone-800 uppercase">{user.gstin}</strong></p>}
                        {user.creditTerms && <p>Credit Terms Allowed: <strong className="text-stone-800">{user.creditTerms}</strong></p>}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
