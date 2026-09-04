'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  TrendingUp,
  Printer,
  Settings,
  Plus,
  Store,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

export function Navigation() {
  const {
    activeTab,
    setActiveTab,
    setIsCreateOrderModalOpen,
    products,
    settings,
  } = useApp();

  // Calculate low stock count for badge
  const lowStockCount = products.filter(
    (p) => !p.isArchived && p.stock <= (p.minStockThreshold ?? 5)
  ).length;

  interface NavItem {
    id: 'dashboard' | 'orders' | 'products' | 'finance' | 'perangkat_kasir' | 'settings';
    label: string;
    icon: typeof LayoutDashboard;
    badge?: number;
  }

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Pesanan', icon: ShoppingCart },
    { id: 'products', label: 'Produk', icon: Package, badge: lowStockCount > 0 ? lowStockCount : undefined },
    { id: 'finance', label: 'Keuangan', icon: TrendingUp },
    { id: 'perangkat_kasir', label: 'Perangkat Kasir', icon: Printer },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Store Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight flex items-center gap-2">
                {settings.name || 'Warung Madura'}
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                  Internal POS
                </span>
              </h1>
              <p className="text-xs text-slate-500">Sistem Manajemen & Kasir Warung</p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-teal-50 text-teal-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-red-500 text-white font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action: Quick Create Order */}
          <div className="flex items-center space-x-3">
            <button
              id="header-create-order-btn"
              onClick={() => setIsCreateOrderModalOpen(true)}
              className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-teal-600/20 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Buat Pesanan</span>
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden overflow-x-auto space-x-1 py-2 border-t border-slate-100 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-50 text-teal-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-red-500 text-white font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
