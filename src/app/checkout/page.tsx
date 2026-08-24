'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { useApp } from '@/context/AppContext';
import { Order, OrderItem, Address } from '@/types';
import { setDbDoc } from '@/lib/services/db';
import { generateInvoicePDF } from '@/lib/services/invoice';
import { CheckCircle2, CreditCard, Truck, Landmark, RotateCw, FileText, Sparkles, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
  const { cart, user, clearCart, showToast } = useApp();
  const [loading, setLoading] = useState(false);
  const [orderCreated, setOrderCreated] = useState<Order | null>(null);

  // Simulation states
  const [showMockPaymentModal, setShowMockPaymentModal] = useState(false);
  const [pendingMockOrder, setPendingMockOrder] = useState<Order | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Form Fields
  const [name, setName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [gstin, setGstin] = useState(user?.gstin || '');
  
  // Address Fields
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('Hanumakonda');
  const [state, setState] = useState('Telangana');
  const [pincode, setPincode] = useState('');

  // Payment Selection
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE' | 'NEFT_RTGS'>('COD');

  // Set default details if user loaded
  useEffect(() => {
    if (user) {
      setName(user.displayName);
      setEmail(user.email);
      if (user.phone) setPhone(user.phone);
      if (user.gstin) setGstin(user.gstin);
      if (user.shippingAddress) {
        setStreet(user.shippingAddress.street);
        setCity(user.shippingAddress.city);
        setState(user.shippingAddress.state);
        setPincode(user.shippingAddress.pincode);
      }
    }
  }, [user]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const executeDatabaseWrites = async (finalOrder: Order) => {
    // 1. Create order record
    await setDbDoc('orders', finalOrder.id, finalOrder);

    // 2. Create notifications alerts
    const notificationId = `notif_${Math.random().toString(36).substring(2, 9)}`;
    const notifData = {
      id: notificationId,
      recipientId: 'admin',
      title: 'New Order Placed',
      message: `Customer ${name} placed order ${finalOrder.id.toUpperCase()} for ₹${cart.grandTotal.toFixed(0)}.`,
      type: 'order',
      read: false,
      createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
    };
    await setDbDoc('notifications', notificationId, notifData);

    // Trigger Confetti locally for premium UX
    try {
      const confetti = (await import('canvas-confetti')).default;
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      console.error(err);
    }

    setOrderCreated(finalOrder);
    clearCart();
    showToast('Order placed successfully!', 'success');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.items.length === 0) return;

    setCheckoutError(null);

    if (!street || !pincode || !phone) {
      showToast('Please fill all required delivery details.', 'error');
      return;
    }

    // Validate phone number format (10-digit Indian numbers)
    const phoneRegex = /^(?:\+91|0)?[6-9]\d{9}$/;
    if (!phoneRegex.test(phone.trim())) {
      showToast('Invalid Phone Number. Please enter a valid 10-digit mobile number.', 'error');
      setCheckoutError('Invalid Phone Number: Please enter a valid 10-digit mobile number (e.g. 9876543210).');
      return;
    }

    setLoading(true);
    try {
      const orderId = `ord_${Math.random().toString(36).substring(2, 9)}`;
      const shippingAddress: Address = { name, street, city, state, pincode, phone };
      const billingAddress: Address = { name, street, city, state, pincode, phone };

      // Convert CartItems to OrderItems
      const orderItems: OrderItem[] = cart.items.map((item) => {
        const itemSubtotal = item.price * item.quantity;
        const baseValue = itemSubtotal / (1 + item.gstRate / 100);
        const taxValue = itemSubtotal - baseValue;

        return {
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          sku: item.sku,
          price: item.price,
          quantity: item.quantity,
          unit: item.unit,
          gstRate: item.gstRate,
          gstAmount: taxValue,
          hsnCode: item.hsnCode,
          total: itemSubtotal,
        };
      });

      const newOrder: Order = {
        id: orderId,
        userId: user?.uid || 'guest_checkout',
        customerDetails: {
          name,
          email,
          phone,
          ...(gstin.trim() ? { gstin: gstin.toUpperCase() } : {}),
          billingAddress,
          shippingAddress,
        },
        items: orderItems,
        subtotal: cart.subtotal,
        discount: cart.discount,
        gst: cart.gst,
        deliveryCharge: cart.deliveryCharge,
        grandTotal: cart.grandTotal,
        status: 'PLACED',
        paymentDetails: {
          method: paymentMethod,
          status: paymentMethod === 'ONLINE' ? 'SUCCESS' : 'PENDING',
          ...(paymentMethod === 'ONLINE' ? { transactionId: `txn_${Math.random().toString(36).substring(2, 9)}` } : {}),
        },
        createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
        updatedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
      };



      if (paymentMethod === 'ONLINE') {
        const res = await fetch('/api/payment/razorpay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: cart.grandTotal, receipt: orderId })
        });
        const paymentOrder = await res.json();

        if (paymentOrder.error) {
          throw new Error(paymentOrder.error);
        }

        if (paymentOrder.isMock) {
          showToast('Razorpay keys not configured. Entering payment simulation...', 'info');
          setPendingMockOrder(newOrder);
          setShowMockPaymentModal(true);
          setLoading(false);
          return;
        }

        const isScriptLoaded = await loadRazorpayScript();
        if (!isScriptLoaded) {
          showToast('Failed to load Razorpay SDK. Check your network connection.', 'error');
          setLoading(false);
          return;
        }

        const options = {
          key: paymentOrder.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_your_key_id',
          amount: paymentOrder.amount,
          currency: paymentOrder.currency,
          name: 'ESHwar Home Needs',
          description: 'Smart Retail & Wholesale Checkout',
          order_id: paymentOrder.id,
          handler: async function (response: any) {
            try {
              setLoading(true);
              setCheckoutError(null);
              
              // Validate payment checksum signature on server
              const verifyRes = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                })
              });
              const verifyResult = await verifyRes.json();

              if (!verifyResult.verified) {
                throw new Error(verifyResult.error || 'Payment verification failed (checksum signature mismatch).');
              }

              const finalPaidOrder = {
                ...newOrder,
                paymentDetails: {
                  method: 'ONLINE' as const,
                  status: 'SUCCESS' as const,
                  transactionId: response.razorpay_payment_id,
                }
              };
              await executeDatabaseWrites(finalPaidOrder);
            } catch (err) {
              console.error('Payment verification/save error:', err);
              setCheckoutError((err as Error).message || 'Payment checksum signature mismatch. Please attempt repayment.');
              showToast('Verification failed. Please try repaying.', 'error');
            } finally {
              setLoading(false);
            }
          },
          prefill: {
            name: name,
            email: email,
            contact: phone,
          },
          theme: {
            color: '#b87333', // ESHwar Copper theme accent color
          },
          modal: {
            ondismiss: function () {
              showToast('Payment window closed by customer.', 'info');
              setLoading(false);
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        // Cash on Delivery
        await executeDatabaseWrites(newOrder);
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setCheckoutError((err as Error).message || 'Failed to place order. Please try again.');
      showToast('Checkout failed.', 'error');
      setLoading(false);
    }
  };

  // Trigger GST Invoice PDF download
  const downloadInvoice = () => {
    if (orderCreated) {
      const pdf = generateInvoicePDF(orderCreated);
      pdf.save(`ESHwar_Invoice_${orderCreated.id.slice(0, 8).toUpperCase()}.pdf`);
      showToast('Invoice downloaded!', 'success');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(val);
  };

  // SUCCESS SCREEN
  if (orderCreated) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow max-w-lg mx-auto px-4 py-16 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold font-serif text-stone-900">Order Placed Successfully!</h2>
            <p className="text-xs text-stone-500">
              Thank you for shopping with ESHwar Home Needs. Your order ID is <strong>{orderCreated.id.slice(0, 8).toUpperCase()}</strong>.
            </p>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-5 text-xs text-left space-y-2.5 shadow-sm">
            <h3 className="font-bold text-stone-800 uppercase tracking-wider text-[10px] pb-1.5 border-b border-stone-100">
              Receipt Summary
            </h3>
            <div className="flex justify-between">
              <span>Billed To:</span>
              <span className="font-semibold text-stone-700">{orderCreated.customerDetails.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Items Count:</span>
              <span className="font-semibold text-stone-700">{orderCreated.items.length} products</span>
            </div>
            <div className="flex justify-between">
              <span>Payment Mode:</span>
              <span className="font-semibold text-stone-700">{orderCreated.paymentDetails.method}</span>
            </div>
            <div className="flex justify-between border-t border-stone-100 pt-2 font-bold text-stone-900">
              <span>Total Paid:</span>
              <span>{formatCurrency(orderCreated.grandTotal)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={downloadInvoice}
              className="flex-1 bg-copper hover:bg-copper-dark text-white font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <FileText className="w-4 h-4" /> Download GST Invoice
            </button>
            <button
              onClick={() => {
                setShowEmailModal(true);
                showToast('Email invoice preview loaded!', 'info');
              }}
              className="flex-1 bg-stone-900 hover:bg-black text-white font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              📧 View Email Invoice
            </button>
            <Link
              href="/shop"
              className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold py-2.5 rounded-lg text-xs block text-center"
            >
              Back to Catalog
            </Link>
          </div>
        </main>

        {/* Simulated Email Confirmation Modal */}
        {showEmailModal && orderCreated && (
          <div className="fixed inset-0 bg-black/60 z-55 flex items-center justify-center p-4">
            <div className="bg-white border border-stone-200 rounded-3xl max-w-2xl w-full text-left overflow-hidden shadow-2xl flex flex-col h-[80vh] animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="bg-stone-950 text-white p-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-rose-500 rounded-full"></div>
                  <span className="text-xs font-bold font-mono tracking-wider">Simulated Email Client — Inbox</span>
                </div>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="text-stone-400 hover:text-white font-bold text-xs bg-stone-800 hover:bg-stone-700 px-2.5 py-1 rounded cursor-pointer"
                >
                  Close Client
                </button>
              </div>

              {/* Email Header */}
              <div className="p-4 border-b border-stone-100 bg-stone-50 space-y-2 text-xs shrink-0">
                <div>
                  <span className="text-stone-400 font-bold uppercase text-[9px] block">Subject</span>
                  <span className="text-stone-800 font-bold text-sm">🛒 Order Confirmed &amp; Dispatched! Invoice #{orderCreated.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-stone-400 font-bold uppercase text-[9px] block">From</span>
                    <span className="text-stone-700 font-semibold">ESHwar Home Needs &lt;orders@eshwarhomeneeds.com&gt;</span>
                  </div>
                  <div>
                    <span className="text-stone-400 font-bold uppercase text-[9px] block">To</span>
                    <span className="text-stone-700 font-semibold">{orderCreated.customerDetails.name} &lt;{orderCreated.customerDetails.email}&gt;</span>
                  </div>
                </div>
              </div>

              {/* Email Body Content */}
              <div className="p-6 overflow-y-auto bg-stone-50 flex-grow font-sans space-y-6">
                {/* Outer HTML Email Container */}
                <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm max-w-xl mx-auto space-y-6 text-xs text-stone-600">
                  {/* Branding Banner */}
                  <div className="border-b-4 border-copper pb-4 text-center">
                    <h1 className="text-xl font-extrabold text-stone-900 font-serif">ESHwar Home Needs</h1>
                    <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-1">Smart Retail, Wholesale &amp; Metal Scrap Solutions</p>
                  </div>

                  {/* Salutation */}
                  <div className="space-y-2">
                    <p className="font-bold text-stone-800 text-sm">Dear {orderCreated.customerDetails.name},</p>
                    <p className="leading-relaxed">
                      Thank you for shopping with ESHwar Home Needs! Your order has been placed successfully and is currently being processed. An invoice is attached to this confirmation.
                    </p>
                  </div>

                  {/* Receipt Details Table */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-stone-800 uppercase tracking-wider text-[10px] border-b pb-1.5">
                      Order Summary (Invoice: #{orderCreated.id.slice(0, 8).toUpperCase()})
                    </h3>
                    <div className="divide-y divide-stone-100">
                      {orderCreated.items.map((item, idx) => (
                        <div key={idx} className="py-2 flex justify-between gap-4">
                          <div>
                            <span className="font-bold text-stone-800">{item.name}</span>
                            <span className="text-[10px] text-stone-400 block mt-0.5">{item.quantity} {item.unit} × {formatCurrency(item.price)}</span>
                          </div>
                          <span className="font-bold text-stone-900 shrink-0">{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-stone-200 pt-3 space-y-1.5 text-stone-500 font-medium">
                      <div className="flex justify-between">
                        <span>Subtotal (Excl. GST)</span>
                        <span>{formatCurrency(orderCreated.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GST (CGST + SGST)</span>
                        <span>{formatCurrency(orderCreated.gst)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery Shipping Charges</span>
                        <span>{orderCreated.deliveryCharge === 0 ? 'FREE' : formatCurrency(orderCreated.deliveryCharge)}</span>
                      </div>
                      <div className="flex justify-between text-stone-900 font-bold border-t pt-2 text-sm">
                        <span>Grand Total (Paid)</span>
                        <span className="text-copper">{formatCurrency(orderCreated.grandTotal)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Coordinates */}
                  <div className="grid grid-cols-2 gap-4 border-t pt-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-stone-800 uppercase text-[9px]">Delivery Address</h4>
                      <p className="leading-tight text-stone-500 font-semibold">{orderCreated.customerDetails.shippingAddress.name}</p>
                      <p className="leading-tight text-stone-500">{orderCreated.customerDetails.shippingAddress.street}</p>
                      <p className="leading-tight text-stone-500">{orderCreated.customerDetails.shippingAddress.city}, {orderCreated.customerDetails.shippingAddress.pincode}</p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-stone-800 uppercase text-[9px]">Payment Method</h4>
                      <p className="font-bold text-stone-700 capitalize">{orderCreated.paymentDetails.method}</p>
                      <p className="text-stone-500 font-mono">Reference: {orderCreated.paymentDetails.transactionId || 'Awaiting Collection'}</p>
                    </div>
                  </div>

                  {/* Footer Notes */}
                  <div className="border-t pt-4 text-center text-[10px] text-stone-400 space-y-1.5">
                    <p>Our agent will contact you shortly regarding delivery routing.</p>
                    <p className="font-bold text-stone-500">ESHwar Home Needs — Hanumakonda, Telangana. WhatsApp: +91 99494 08061</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <h1 className="text-3xl font-extrabold text-stone-900 font-serif mb-6">Secure Checkout</h1>

        {checkoutError && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-2xl mb-6 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{checkoutError}</span>
          </div>
        )}

        {cart.items.length > 0 ? (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            
            {/* Checkout Form Inputs (3/5 width) */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Customer Contact Panel */}
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider border-b border-stone-100 pb-2">
                  1. Contact Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-[10px] font-semibold text-stone-500 block mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:border-copper"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-stone-500 block mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:border-copper"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-stone-500 block mb-1">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:border-copper"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-stone-500 block mb-1">GSTIN (Optional for business claim)</label>
                    <input
                      type="text"
                      placeholder="e.g. 29AAAAE1234F1Z5"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:border-copper uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Address Panel */}
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider border-b border-stone-100 pb-2">
                  2. Shipping Address
                </h3>
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="text-[10px] font-semibold text-stone-500 block mb-1">Street Address / House No. *</label>
                    <input
                      type="text"
                      required
                      placeholder="Apartment, Street name, Land mark"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:border-copper"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-semibold text-stone-500 block mb-1">City *</label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:border-copper"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-stone-500 block mb-1">State *</label>
                      <input
                        type="text"
                        required
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:border-copper"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-stone-500 block mb-1">Pincode *</label>
                      <input
                        type="text"
                        required
                        placeholder="560001"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:border-copper"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment selector Panel */}
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider border-b border-stone-100 pb-2">
                  3. Payment Method
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
                  
                  {/* COD */}
                  <label className={`border rounded-xl p-4 flex flex-col items-center justify-between cursor-pointer gap-2 transition-all select-none ${
                    paymentMethod === 'COD' ? 'border-copper bg-copper/5 text-copper' : 'border-stone-200 hover:border-copper/40'
                  }`}>
                    <input 
                      type="radio" 
                      name="payment" 
                      className="sr-only"
                      checked={paymentMethod === 'COD'}
                      onChange={() => setPaymentMethod('COD')}
                    />
                    <Truck className="w-5 h-5" />
                    <span>Cash on Delivery</span>
                  </label>

                  {/* Online */}
                  {(!user || (user.role !== 'staff' && user.role !== 'admin')) ? (
                    <label className={`border rounded-xl p-4 flex flex-col items-center justify-between cursor-pointer gap-2 transition-all select-none ${
                      paymentMethod === 'ONLINE' ? 'border-copper bg-copper/5 text-copper' : 'border-stone-200 hover:border-copper/40'
                    }`}>
                      <input 
                        type="radio" 
                        name="payment" 
                        className="sr-only"
                        checked={paymentMethod === 'ONLINE'}
                        onChange={() => setPaymentMethod('ONLINE')}
                      />
                      <CreditCard className="w-5 h-5" />
                      <span>Razorpay / UPI</span>
                    </label>
                  ) : (
                    <div className="border border-stone-200 bg-stone-50 rounded-xl p-4 flex flex-col items-center justify-center gap-2 opacity-50 cursor-not-allowed select-none">
                      <CreditCard className="w-5 h-5 text-stone-400" />
                      <span className="text-[10px] text-center font-bold text-stone-400">Razorpay (Disabled for Staff/Admin)</span>
                    </div>
                  )}

                  {/* NEFT */}
                  <label className={`border rounded-xl p-4 flex flex-col items-center justify-between cursor-pointer gap-2 transition-all select-none ${
                    paymentMethod === 'NEFT_RTGS' ? 'border-copper bg-copper/5 text-copper' : 'border-stone-200 hover:border-copper/40'
                  }`}>
                    <input 
                      type="radio" 
                      name="payment" 
                      className="sr-only"
                      checked={paymentMethod === 'NEFT_RTGS'}
                      onChange={() => setPaymentMethod('NEFT_RTGS')}
                    />
                    <Landmark className="w-5 h-5" />
                    <span>NEFT / RTGS</span>
                  </label>

                </div>
              </div>

            </div>

            {/* Side Order Review Panel (2/5 width) */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4 sticky top-24">
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider border-b border-stone-100 pb-2 font-serif">
                  Order Review
                </h3>

                {/* Items preview list */}
                <div className="max-h-60 overflow-y-auto divide-y divide-stone-100 pr-1">
                  {cart.items.map((item) => (
                    <div key={`${item.productId}-${item.variantId || ''}`} className="py-2.5 flex justify-between gap-3 text-xs">
                      <div>
                        <span className="font-semibold text-stone-800 block leading-tight">{item.name}</span>
                        <span className="text-[10px] text-stone-400 mt-0.5 block">{item.quantity} {item.unit} × {formatCurrency(item.price)}</span>
                      </div>
                      <span className="font-bold text-stone-900 shrink-0">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-stone-100 pt-3 space-y-2 text-xs text-stone-600">
                  <div className="flex justify-between">
                    <span>Taxable Subtotal</span>
                    <span>{formatCurrency(cart.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (CGST + SGST)</span>
                    <span>{formatCurrency(cart.gst)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping Charges</span>
                    <span>{cart.deliveryCharge === 0 ? 'FREE' : formatCurrency(cart.deliveryCharge)}</span>
                  </div>
                  
                  <div className="border-t border-stone-100 pt-2 flex justify-between items-center text-sm font-bold text-stone-950">
                    <span>Grand Total</span>
                    <span>{formatCurrency(cart.grandTotal)}</span>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-copper hover:bg-copper-dark text-white font-bold py-3 rounded-lg text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Processing Order...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Place Order &amp; Pay</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            </div>

          </form>
        ) : (
          <div className="text-center py-20 bg-stone-50 border border-stone-200 rounded-3xl max-w-md mx-auto">
            <h2 className="text-lg font-bold text-stone-800 font-serif">Cart is Empty</h2>
            <Link 
              href="/shop"
              className="mt-4 bg-copper text-white px-5 py-2 rounded-lg text-xs font-bold block w-max mx-auto"
            >
              Browse Catalog
            </Link>
          </div>
        )}

      </main>

      {/* Mock Payment Simulation Modal */}
      {showMockPaymentModal && pendingMockOrder && (
        <div className="fixed inset-0 bg-black/60 z-55 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 max-w-md w-full text-center space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-stone-900 font-serif">Simulated Payment Gateway</h3>
              <p className="text-xs text-stone-500">
                You are checking out in <strong>Simulation Mode</strong> because Razorpay API keys are not loaded on your local server.
              </p>
            </div>

            <div className="bg-stone-50 p-4 rounded-2xl text-xs text-left space-y-2 border border-stone-100">
              <div className="flex justify-between font-semibold">
                <span>Amount:</span>
                <span className="text-stone-900">{formatCurrency(pendingMockOrder.grandTotal)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Simulation Order ID:</span>
                <span className="text-stone-900">{pendingMockOrder.id.toUpperCase()}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  const finalMockOrder = {
                    ...pendingMockOrder,
                    paymentDetails: {
                      method: 'ONLINE' as const,
                      status: 'SUCCESS' as const,
                      transactionId: `mock_txn_${Math.random().toString(36).substring(2, 9)}`,
                    }
                  };
                  await executeDatabaseWrites(finalMockOrder);
                  setShowMockPaymentModal(false);
                  setLoading(false);
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-xs uppercase cursor-pointer transition-colors"
              >
                Simulate Success
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setCheckoutError('Simulated Online Payment Failure: Card declined or transaction aborted.');
                  showToast('Payment simulation failed.', 'error');
                  setShowMockPaymentModal(false);
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-lg text-xs uppercase cursor-pointer transition-colors"
              >
                Simulate Failure
              </button>
            </div>
            
            <button
              type="button"
              onClick={() => {
                setShowMockPaymentModal(false);
                showToast('Payment simulation cancelled.', 'info');
              }}
              className="text-stone-400 hover:text-stone-600 text-[10px] font-bold block mx-auto underline cursor-pointer"
            >
              Cancel Payment
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
