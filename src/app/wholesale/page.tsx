'use client';

import React, { useState } from 'react';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { useApp } from '@/context/AppContext';
import { Quote, QuoteItem, CustomerType } from '@/types';
import { setDbDoc } from '@/lib/services/db';
import { MOCK_PRODUCTS } from '@/lib/mockData';
import { Landmark, FilePlus2, Scale, Trash2, Calendar, FileCheck, RotateCw } from 'lucide-react';
import Link from 'next/link';

export default function WholesalePage() {
  const { user, showToast } = useApp();
  const [loading, setLoading] = useState(false);
  const [quoteCreated, setQuoteCreated] = useState<Quote | null>(null);

  // Business Info Form
  const [name, setName] = useState(user?.displayName || '');
  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [gstin, setGstin] = useState(user?.gstin || '');
  const [customerType, setCustomerType] = useState<CustomerType>('retailer');

  // RFQ Quote Items List
  const [rfqItems, setRfqItems] = useState<QuoteItem[]>([]);
  
  // Single Item Input selector state
  const [selectedProductId, setSelectedProductId] = useState<string>(MOCK_PRODUCTS[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(50);
  const [targetPrice, setTargetPrice] = useState<string>('');

  // Shipping & Timeline Details
  const [location, setLocation] = useState('');
  const [requiredDate, setRequiredDate] = useState('');
  const [notes, setNotes] = useState('');

  // Add item to RFQ list
  const addRfqItem = (e: React.FormEvent) => {
    e.preventDefault();
    const product = MOCK_PRODUCTS.find(p => p.id === selectedProductId);
    if (!product) return;

    // Check if item already exists in RFQ
    if (rfqItems.some(i => i.productId === selectedProductId)) {
      showToast('Product already in RFQ list. Modify quantity there.', 'info');
      return;
    }

    const newItem: QuoteItem = {
      productId: product.id,
      name: product.name,
      sku: product.sku,
      quantity,
      unit: product.unit,
      ...(targetPrice ? { requestedPrice: parseFloat(targetPrice) } : {}),
      gstRate: product.gstRate,
      hsnCode: product.hsnCode,
    };

    setRfqItems([...rfqItems, newItem]);
    setTargetPrice('');
    showToast(`Added ${product.name} to RFQ list`, 'success');
  };

  const removeRfqItem = (productId: string) => {
    setRfqItems(rfqItems.filter(i => i.productId !== productId));
    showToast('Removed item from RFQ', 'info');
  };

  const updateRfqItemQty = (productId: string, qty: number) => {
    setRfqItems(rfqItems.map(item => 
      item.productId === productId ? { ...item, quantity: Math.max(1, qty) } : item
    ));
  };

  // Submit Quotation RFQ
  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enforce mobile verification gate for RFQ (B2B Sell/Buy)
    if (!user) {
      showToast('Please sign in or register to verify your mobile number and request a B2B quotation.', 'info');
      return;
    }
    if (!user.phoneVerified) {
      showToast('Mobile verification is required before requesting a B2B quote. Please verify your phone number in your Account Profile.', 'error');
      return;
    }

    if (rfqItems.length === 0) {
      showToast('Please add at least one product to the RFQ list.', 'error');
      return;
    }

    if (!name || !phone || !email || !location || !requiredDate) {
      showToast('Please fill all required business and shipping details.', 'error');
      return;
    }

    setLoading(true);
    try {
      const quoteId = `qte_${Math.random().toString(36).substring(2, 9)}`;

      // Calculate estimate sums
      let subtotal = 0;
      let gst = 0;

      rfqItems.forEach((item) => {
        const productObj = MOCK_PRODUCTS.find(p => p.id === item.productId);
        const itemPrice = item.requestedPrice || productObj?.wholesalePrice || 0;
        const itemTotal = itemPrice * item.quantity;
        
        subtotal += itemTotal;
        gst += itemTotal * (item.gstRate / 100);
      });

      const grandTotal = subtotal + gst;

      const newQuote: Quote = {
        id: quoteId,
        userId: user?.uid || 'guest_wholesale',
        customerDetails: {
          name,
          ...(companyName.trim() ? { companyName } : {}),
          phone,
          email,
          ...(gstin.trim() ? { gstin: gstin.toUpperCase() } : {}),
          customerType,
        },
        items: rfqItems,
        subtotal,
        discount: 0,
        gst,
        deliveryCharge: 0,
        grandTotal,
        notes: `Delivery location: ${location}. Required Date: ${requiredDate}. Remarks: ${notes}`,
        status: 'REQUESTED',
        createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
        updatedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
      };

      // Write Quote to database (with local JSON fallback)
      await setDbDoc('quotes', quoteId, newQuote);

      // Create Admin Notification
      const notificationId = `notif_${Math.random().toString(36).substring(2, 9)}`;
      await setDbDoc('notifications', notificationId, {
        id: notificationId,
        recipientId: 'admin',
        title: 'New Wholesale RFQ',
        message: `Company ${companyName || name} requested wholesale quote ${quoteId.toUpperCase()} for ${rfqItems.length} items.`,
        type: 'quote',
        read: false,
        createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
      });

      setQuoteCreated(newQuote);
      setRfqItems([]);
      showToast('Wholesale RFQ submitted!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to submit quote. Try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // SUCCESS SCREEN
  if (quoteCreated) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow max-w-lg mx-auto px-4 py-16 text-center space-y-6">
          <div className="w-16 h-16 bg-copper/10 text-copper rounded-full flex items-center justify-center mx-auto shadow-xs">
            <FileCheck className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold font-serif text-stone-900">RFQ Request Submitted!</h2>
            <p className="text-xs text-stone-500">
              Your proforma request is sent to our sales admin. Reference ID: <strong>{quoteCreated.id.toUpperCase()}</strong>.
            </p>
          </div>

          <p className="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed">
            Our wholesale manager will review your target pricing list, add delivery margins/taxes, and update the quote sheet. You will be notified shortly to download the proforma PDF.
          </p>

          <Link
            href="/shop"
            className="inline-flex items-center gap-1 bg-copper hover:bg-copper-dark text-white font-bold px-6 py-2.5 rounded-lg text-xs uppercase"
          >
            Continue Browsing
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Banner header */}
        <div className="bg-gradient-to-br from-earth to-stone-900 rounded-3xl text-white p-8 sm:p-12 mb-8 relative overflow-hidden shadow-sm">
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="max-w-2xl space-y-4 relative">
            <span className="inline-flex items-center gap-1 bg-copper/30 px-3 py-1 rounded-full text-xs font-bold text-copper-light">
              <Landmark className="w-3.5 h-3.5" /> B2B COMMERCIAL PROGRAM
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold font-serif leading-tight">
              ESHwar Home Needs Wholesale Portal
            </h1>
            <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
              Consolidated bulk sourcing. We provide wholesale catalog prices to restaurants, hotels, catering agencies, hardware merchants, and building contractors in India.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* Left Columns: Bulk RFQ List & Item selector (3/5 width) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* 1. Item selector form */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider border-b border-stone-100 pb-2 flex items-center gap-1.5">
                <FilePlus2 className="w-4 h-4 text-copper" /> Add Products to RFQ
              </h3>
              
              <form onSubmit={addRfqItem} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end text-xs">
                
                {/* Product list */}
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-semibold text-stone-500 block mb-1">Select Product</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-2 focus:outline-none"
                  >
                    {MOCK_PRODUCTS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Qty */}
                <div>
                  <label className="text-[10px] font-semibold text-stone-500 block mb-1">Quantity (Units)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-2 focus:outline-none"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="bg-stone-900 hover:bg-stone-800 text-white font-bold py-2 px-4 rounded-lg text-xs cursor-pointer h-9 text-center"
                >
                  Add to List
                </button>
              </form>
            </div>

            {/* 2. Added RFQ Items list */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider border-b border-stone-100 pb-2">
                Quotation Request Items
              </h3>

              {rfqItems.length > 0 ? (
                <div className="divide-y divide-stone-100">
                  {rfqItems.map((item) => (
                    <div key={item.productId} className="py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                      <div>
                        <span className="font-bold text-stone-800 block leading-tight">{item.name}</span>
                        <span className="text-[10px] text-stone-400 mt-0.5 block">SKU: {item.sku} | HSN: {item.hsnCode} | GST: {item.gstRate}%</span>
                      </div>

                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                        {/* Qty update */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-stone-400 font-semibold">Qty:</span>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateRfqItemQty(item.productId, parseInt(e.target.value) || 1)}
                            className="w-16 bg-stone-50 border border-stone-300 rounded px-1.5 py-1 text-center font-bold"
                          />
                          <span className="text-[10px] text-stone-500">{item.unit}</span>
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={() => removeRfqItem(item.productId)}
                          className="text-stone-400 hover:text-red-500 p-1.5"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-stone-400 text-xs">
                  No products added yet. Use the tool above to add kitchenware items.
                </div>
              )}
            </div>

          </div>

          {/* Right Columns: Business Details Form (2/5 width) */}
          <div className="lg:col-span-2">
            <form onSubmit={handleQuoteSubmit} className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider border-b border-stone-100 pb-2 font-serif">
                Business &amp; Logistics Info
              </h3>

              <div className="space-y-3.5 text-xs text-stone-600">
                <div>
                  <label className="text-[10px] font-semibold text-stone-500 block mb-1">Customer / Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-stone-500 block mb-1">Company / Store Name</label>
                  <input
                    type="text"
                    placeholder="e.g., ESHwar Catering Services"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-stone-500 block mb-1">Customer Type *</label>
                    <select
                      value={customerType}
                      onChange={(e) => setCustomerType(e.target.value as CustomerType)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2 py-2 focus:outline-none"
                    >
                      <option value="retailer">Retailer / Dealer</option>
                      <option value="hotel">Hotel / Lodge</option>
                      <option value="restaurant">Restaurant</option>
                      <option value="caterer">Caterer</option>
                      <option value="contractor">Builder / Contractor</option>
                      <option value="individual">Bulk Individual</option>
                      <option value="other">Other Business</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-stone-500 block mb-1">GSTIN (for tax input)</label>
                    <input
                      type="text"
                      placeholder="GSTIN Code"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 focus:outline-none uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-stone-500 block mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-stone-500 block mb-1">Email ID *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-stone-500 block mb-1">Delivery Location Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter city, pincode or state"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-stone-500 block mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-copper" /> Required Delivery Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={requiredDate}
                    onChange={(e) => setRequiredDate(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-stone-500 block mb-1">Additional Requirements / Remarks</label>
                  <textarea
                    rows={3}
                    placeholder="Enter customized specifications, branding prints, or packaging options..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-copper hover:bg-copper-dark text-white font-bold py-3 rounded-lg text-xs uppercase flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending Request...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Quotation Request</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            </form>
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
