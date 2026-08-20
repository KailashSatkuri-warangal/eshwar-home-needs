'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { 
  BarChart3, Box, FileText, Scale, Settings, Users, 
  ShieldAlert, LogOut, Landmark, RotateCw 
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, userLoading, logout } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  // 1. Loading Checks
  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <RotateCw className="w-8 h-8 text-copper animate-spin" />
      </div>
    );
  }

  // 2. Privilege Security Gate
  // Allow if user is admin or staff. For development, we bypass if email matches admin template.
  const isAuthorized = user && (user.role === 'admin' || user.role === 'staff' || user.email === 'admin@eshwarhomeneeds.com');

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-cream text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 font-serif">Access Denied</h2>
        <p className="text-xs text-stone-500 max-w-sm mt-1">
          You do not have staff or administrator privileges to access the ESHwar back-office dashboard.
        </p>
        <div className="flex gap-4 mt-6">
          <Link href="/account" className="bg-copper text-white font-bold px-5 py-2 rounded-lg text-xs">
            Sign In with Admin Account
          </Link>
          <Link href="/" className="bg-white border text-stone-700 px-5 py-2 rounded-lg text-xs font-semibold">
            Back to Storefront
          </Link>
        </div>
      </div>
    );
  }

  const menuItems = [
    { name: 'Dashboard Analytics', href: '/admin', icon: BarChart3 },
    { name: 'Products CRUD', href: '/admin/products', icon: Box },
    { name: 'Wholesale Quotes', href: '/admin/quotes', icon: FileText },
    { name: 'Scrap requests', href: '/admin/scrap', icon: Scale },
  ];

  return (
    <div className="min-h-screen flex bg-stone-50 text-stone-800">
      
      {/* Admin Sidebar Navigation */}
      <aside className="w-64 bg-stone-900 text-stone-300 flex flex-col justify-between shrink-0 border-r border-stone-800 hidden md:flex">
        <div>
          {/* Header Branding */}
          <div className="p-6 border-b border-stone-800">
            <Link href="/" className="flex flex-col">
              <span className="text-lg font-bold text-white tracking-tight flex items-center gap-1 font-serif">
                ESHwar
                <span className="text-copper text-[10px] font-sans font-bold px-1.5 py-0.5 rounded-sm bg-copper/20 border border-copper/30">
                  ADMIN
                </span>
              </span>
              <span className="text-[8px] uppercase tracking-widest text-stone-400 font-bold mt-1">
                Store Back-Office
              </span>
            </Link>
          </div>

          {/* Nav Links */}
          <nav className="p-4 space-y-1 text-xs font-semibold">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-copper text-white' 
                      : 'hover:bg-stone-800 hover:text-white text-stone-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-800 text-xs font-semibold space-y-2">
          <Link 
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
          >
            <Landmark className="w-4.5 h-4.5" /> View Storefront
          </Link>
          <button
            onClick={() => {
              logout();
              router.push('/account');
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
          >
            <LogOut className="w-4.5 h-4.5" /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Admin Content Panel */}
      <div className="flex-1 flex flex-col overflow-y-auto h-screen pb-16">
        
        {/* Header Toolbar */}
        <header className="bg-white border-b border-stone-200 h-14 flex items-center justify-between px-6 py-4">
          <span className="text-xs font-bold text-stone-500">
            Welcome, {user.displayName} (Sales Administrator)
          </span>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-800 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
              System Live
            </span>
          </div>
        </header>

        {/* Active Child Page Viewport */}
        <main className="p-6 md:p-8 flex-1">
          {children}
        </main>
      </div>

    </div>
  );
}
