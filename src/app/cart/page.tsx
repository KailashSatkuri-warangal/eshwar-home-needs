'use client';

import React from 'react';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { useApp } from '@/context/AppContext';
import { ShoppingCart, Trash2, Plus, Minus, Landmark, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CartPage() {
  const { cart, removeFromCart, updateCartQty, isWholesaleMode, toggleWholesaleMode } = useApp();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(val);
  };

  const hasItems = cart.items.length > 0;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <h1 className="text-3xl font-extrabold text-stone-900 font-serif mb-6">Shopping Cart</h1>

        {hasItems ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Cart Items List (2/3 width) */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Wholesale Pricing Warning banner */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex justify-between items-center text-xs text-stone-600">
                <div>
                  <span className="font-bold text-stone-800 block">
                    Active Pricing: {isWholesaleMode ? 'Wholesale commercial pricing' : 'Standard Retail Pricing'}
                  </span>
                  <span>Wholesale pricing requires meeting target item minimums.</span>
                </div>
                <button
                  onClick={() => toggleWholesaleMode(!isWholesaleMode)}
                  className="bg-white border border-stone-300 font-bold px-3 py-1.5 rounded-lg text-xs hover:border-copper hover:text-copper cursor-pointer"
                >
                  Switch mode
                </button>
              </div>

              <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs divide-y divide-stone-100">
                {cart.items.map((item) => (
                  <div key={`${item.productId}-${item.variantId || ''}`} className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 bg-stone-50 border border-stone-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-stone-800 text-sm leading-tight line-clamp-2">
                          {item.name}
                        </h3>
                        <span className="text-[10px] text-stone-400 block uppercase font-semibold">SKU: {item.sku} | HSN: {item.hsnCode}</span>
                        <span className="text-xs text-stone-500 block">Unit: {item.unit} | GST Rate: {item.gstRate}%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-start gap-6">
                      {/* Quantity Controller */}
                      <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden bg-stone-50">
                        <button
                          onClick={() => updateCartQty(item.productId, item.quantity - 1, item.variantId)}
                          className="p-1.5 hover:bg-stone-100 text-stone-500"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-bold text-stone-800">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQty(item.productId, item.quantity + 1, item.variantId)}
                          className="p-1.5 hover:bg-stone-100 text-stone-500"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Item Total Price */}
                      <div className="text-right min-w-[80px]">
                        <span className="text-sm font-extrabold text-stone-900 block">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                        <span className="text-[10px] text-stone-400 block font-medium">
                          ({formatCurrency(item.price)} each)
                        </span>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.productId, item.variantId)}
                        className="text-stone-400 hover:text-red-500 p-2"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>

              <div className="pt-2">
                <Link href="/shop" className="inline-flex items-center gap-1 text-xs text-copper hover:text-copper-dark font-bold">
                  <ArrowLeft className="w-3.5 h-3.5" /> Continue Shopping
                </Link>
              </div>

            </div>

            {/* Calculations Card (1/3 width) */}
            <div>
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="text-lg font-bold text-stone-900 font-serif pb-3 border-b border-stone-100">
                  Bill Summary
                </h3>

                <div className="space-y-2.5 text-xs text-stone-600">
                  <div className="flex justify-between">
                    <span>Taxable Subtotal</span>
                    <span className="font-semibold text-stone-800">{formatCurrency(cart.subtotal)}</span>
                  </div>
                  
                  {/* CGST/SGST splitting */}
                  <div className="flex justify-between text-[11px] text-stone-400">
                    <span>CGST (9%)</span>
                    <span>{formatCurrency(cart.gst / 2)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-stone-400">
                    <span>SGST (9%)</span>
                    <span>{formatCurrency(cart.gst / 2)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>GST (CGST + SGST)</span>
                    <span className="font-semibold text-stone-800">{formatCurrency(cart.gst)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Estimated Shipping</span>
                    {cart.deliveryCharge === 0 ? (
                      <span className="text-emerald-600 font-bold">FREE</span>
                    ) : (
                      <span className="font-semibold text-stone-800">{formatCurrency(cart.deliveryCharge)}</span>
                    )}
                  </div>

                  {cart.deliveryCharge > 0 && (
                    <div className="text-[10px] text-stone-400 leading-normal">
                      *Add items worth <strong>{formatCurrency(1000 - (cart.subtotal + cart.gst))}</strong> more to unlock FREE shipping!
                    </div>
                  )}

                  <div className="border-t border-stone-100 my-2 pt-3 flex justify-between items-center text-sm">
                    <span className="font-bold text-stone-950">Grand Total</span>
                    <span className="text-lg font-extrabold text-stone-950">{formatCurrency(cart.grandTotal)}</span>
                  </div>
                </div>

                <div className="pt-3">
                  <Link 
                    href="/checkout"
                    className="w-full bg-copper hover:bg-copper-dark text-white font-bold py-3 rounded-lg text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 shadow-sm hover:shadow transition-all text-center"
                  >
                    Proceed to checkout
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

              </div>
            </div>

          </div>
        ) : (
          <div className="text-center py-20 bg-stone-50 border border-stone-200 rounded-3xl max-w-md mx-auto">
            <ShoppingCart className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-stone-800 font-serif">Your Cart is Empty</h2>
            <p className="text-xs text-stone-500 mt-1.5 max-w-xs mx-auto">
              Before you can checkout, you must add some kitchenware products to your shopping cart.
            </p>
            <Link 
              href="/shop"
              className="mt-6 inline-flex items-center gap-1.5 bg-copper hover:bg-copper-dark text-white font-bold px-6 py-2.5 rounded-lg text-xs uppercase"
            >
              Browse Products
            </Link>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
