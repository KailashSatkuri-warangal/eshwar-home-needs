'use client';

import React, { useState, useEffect } from 'react';
import { Quote, QuoteItem, QuoteStatus } from '@/types';
import { getDbDocs, setDbDoc } from '@/lib/services/db';
import { generateQuotationPDF } from '@/lib/services/invoice';
import { useApp } from '@/context/AppContext';
import { 
  FileText, Edit, Check, X, RefreshCw, Eye, 
  Trash2, Landmark, IndianRupee, Save, Calendar 
} from 'lucide-react';

export default function AdminQuotesPage() {
  const { showToast } = useApp();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);

  // Edit states
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  
  // Custom quotation details being edited
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [adminNotes, setAdminNotes] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // Fetch Quotes list
  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const list = await getDbDocs('quotes') as Quote[];
      list.sort((a, b) => {
        const timeA = a.createdAt?.seconds || (typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() / 1000 : 0) || 0;
        const timeB = b.createdAt?.seconds || (typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() / 1000 : 0) || 0;
        return timeB - timeA;
      });
      setQuotes(list);
    } catch (e) {
      console.error('Error fetching quotes:', e);
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  const startEditQuote = (q: Quote) => {
    setEditingQuote(q);
    setItems(q.items);
    setDiscount(q.discount);
    setDeliveryCharge(q.deliveryCharge);
    setAdminNotes(q.adminNotes || '');
    
    // Default expiry 7 days from now
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    setExpiryDate(nextWeek.toISOString().split('T')[0]);
  };

  // Update item offered price
  const updateItemOfferedPrice = (productId: string, val: number) => {
    setItems(items.map(item => 
      item.productId === productId ? { ...item, offeredPrice: val } : item
    ));
  };

  // Update item quantity
  const updateItemQuantity = (productId: string, val: number) => {
    setItems(items.map(item => 
      item.productId === productId ? { ...item, quantity: Math.max(1, val) } : item
    ));
  };

  // Submit quote pricing adjustments
  const handleQuoteSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuote) return;

    let subtotal = 0;
    let gstAmount = 0;

    items.forEach((item) => {
      const priceToUse = item.offeredPrice || item.requestedPrice || 0;
      const total = priceToUse * item.quantity;
      subtotal += total;
      gstAmount += total * (item.gstRate / 100);
    });

    const grandTotal = subtotal + gstAmount + deliveryCharge - discount;

    const expiryTimestamp = {
      seconds: Math.floor(new Date(expiryDate).getTime() / 1000),
      nanoseconds: 0,
    };

    const updatedQuote: Quote = {
      ...editingQuote,
      items,
      subtotal,
      discount,
      gst: gstAmount,
      deliveryCharge,
      grandTotal,
      adminNotes,
      expiryDate: expiryTimestamp,
      status: 'QUOTED',
      updatedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
    };

    try {
      // Update Quote document (with local JSON fallback)
      await setDbDoc('quotes', editingQuote.id, updatedQuote);
      
      // Update state
      setQuotes(quotes.map(q => q.id === editingQuote.id ? updatedQuote : q));
      
      // Alert user
      showToast('Quotation pricing configured successfully!', 'success');
      setEditingQuote(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to save quotation rates.', 'error');
    }
  };

  // Download Quote PDF from admin dashboard
  const downloadQuotePDF = (q: Quote) => {
    const pdf = generateQuotationPDF(q);
    pdf.save(`Quotation_${q.id.slice(0, 8).toUpperCase()}.pdf`);
    showToast('Quotation PDF generated!', 'success');
  };

  const getStatusColor = (status: QuoteStatus) => {
    switch (status) {
      case 'ACCEPTED':
      case 'CONVERTED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'REJECTED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'QUOTED':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header bar */}
      <div className="flex justify-between items-center pb-2 border-b border-stone-200">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 font-serif">Wholesale Quotes</h1>
          <p className="text-xs text-stone-500 mt-0.5">Manage custom bulk request-for-quotes (RFQs) and configure pricing</p>
        </div>
        <button
          onClick={fetchQuotes}
          className="p-2 bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-full cursor-pointer"
        >
          <RefreshCw className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* 1. EDIT QUOTATION MODAL DRAWER */}
      {editingQuote && (
        <form onSubmit={handleQuoteSaveSubmit} className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-6 text-xs text-stone-600">
          <div className="flex justify-between items-center border-b border-stone-100 pb-3">
            <div>
              <h2 className="font-bold text-stone-900 text-base font-serif">
                Configure Pricing: RFQ ID {editingQuote.id.toUpperCase()}
              </h2>
              <span className="text-[10px] text-stone-400 mt-1 block">
                Company: <span className="font-bold text-stone-600">{editingQuote.customerDetails.companyName || 'Retail Customer'}</span> | 
                Client: {editingQuote.customerDetails.name} | Phone: {editingQuote.customerDetails.phone}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setEditingQuote(null)}
              className="p-1 hover:bg-stone-50 rounded text-stone-500"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* List items and inputs to set Offered Price */}
          <div className="space-y-4">
            <span className="font-bold text-stone-800 text-xs block">Items Requested &amp; Offered Pricing</span>
            <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100">
              {items.map((item) => (
                <div key={item.productId} className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                  <div className="sm:col-span-2">
                    <span className="font-bold text-stone-900 block leading-tight">{item.name}</span>
                    <span className="text-[10px] text-stone-400 mt-0.5 block">
                      SKU: {item.sku} | Target Price: ₹{item.requestedPrice || 'N/A'} | GST: {item.gstRate}%
                    </span>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-stone-500 block mb-1">Edit Quantity ({item.unit})</label>
                    <input
                      type="number"
                      required
                      value={item.quantity}
                      onChange={(e) => updateItemQuantity(item.productId, parseInt(e.target.value) || 1)}
                      className="w-24 bg-stone-50 border border-stone-300 rounded px-2 py-1 font-semibold text-stone-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-stone-500 block mb-1">Offered Price (ea) *</label>
                    <input
                      type="number"
                      required
                      value={item.offeredPrice || item.requestedPrice || 0}
                      onChange={(e) => updateItemOfferedPrice(item.productId, parseFloat(e.target.value) || 0)}
                      className="w-full bg-stone-50 border border-stone-300 rounded px-2.5 py-1 font-bold text-stone-800 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quotation Metadata (Discounts, Shipping, Dates) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-semibold text-stone-500 block mb-1">Special Discount (₹)</label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-full bg-stone-50 border border-stone-300 rounded px-3 py-1.5 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-stone-500 block mb-1">Estimated Shipping / Freight (₹)</label>
              <input
                type="number"
                value={deliveryCharge}
                onChange={(e) => setDeliveryCharge(parseFloat(e.target.value) || 0)}
                className="w-full bg-stone-50 border border-stone-300 rounded px-3 py-1.5 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-stone-500 block mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-copper" /> Quote Expiry Date *
              </label>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded px-3 py-1.5 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-stone-500 block mb-1">Quotation Remarks / Terms</label>
            <textarea
              rows={2}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="e.g. Free delivery inside Bangalore. Out-of-station delivery charged at actuals..."
              className="w-full bg-stone-50 border border-stone-300 rounded px-3 py-1.5 focus:outline-none"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 border-t border-stone-100 pt-4">
            <button
              type="button"
              onClick={() => setEditingQuote(null)}
              className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold px-4 py-2 rounded-lg text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-copper hover:bg-copper-dark text-white font-bold px-5 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" /> Save &amp; Generate Proforma
            </button>
          </div>

        </form>
      )}

      {/* 2. QUOTATIONS DATA LIST TABLE */}
      {!editingQuote && (
        <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto text-xs">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-stone-100 border-b border-stone-200 text-stone-400 uppercase font-bold text-[10px] tracking-wider">
                  <th className="p-4">RFQ ID</th>
                  <th className="p-4">Client / Company</th>
                  <th className="p-4">Items count</th>
                  <th className="p-4 text-right">Estimate Total</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {quotes.map((q) => (
                  <tr key={q.id} className="hover:bg-stone-50/50">
                    <td className="p-4">
                      <span className="font-bold text-stone-900 block uppercase">{q.id.slice(0, 8)}</span>
                      <span className="text-[9px] text-stone-400 block mt-0.5">
                        {new Date(q.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString('en-IN')}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-stone-900 block">{q.customerDetails.companyName || q.customerDetails.name}</span>
                      <span className="text-[10px] text-stone-400 block mt-0.5">
                        Type: {q.customerDetails.customerType.toUpperCase()} | Phone: {q.customerDetails.phone}
                      </span>
                    </td>
                    <td className="p-4">{q.items.length} products</td>
                    <td className="p-4 text-right font-bold text-stone-900">
                      ₹{q.grandTotal.toLocaleString('en-IN')}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 border rounded-full font-bold uppercase text-[8px] ${getStatusColor(q.status)}`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {q.status === 'REQUESTED' && (
                          <button
                            onClick={() => startEditQuote(q)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-copper hover:bg-copper-dark text-white rounded text-[9px] font-bold cursor-pointer"
                          >
                            <Edit className="w-3 h-3" /> Edit Quote
                          </button>
                        )}
                        {q.status === 'QUOTED' && (
                          <button
                            onClick={() => downloadQuotePDF(q)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded text-[9px] font-bold cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" /> Download PDF
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            if (confirm('Delete quotation request?')) {
                              const updatedQuote = {
                                ...q,
                                status: 'REJECTED' as const,
                                updatedAt: new Date(),
                              };
                              await setDbDoc('quotes', q.id, updatedQuote);
                              setQuotes(quotes.map(item => item.id === q.id ? updatedQuote : item));
                              showToast('Quotation status updated.', 'info');
                            }
                          }}
                          className="p-1 text-stone-400 hover:text-stone-700 bg-stone-50 border rounded"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
