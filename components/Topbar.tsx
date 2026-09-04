'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import {
  Menu,
  Plus,
  Store,
  Shield,
} from 'lucide-react';

export function Topbar() {
  const {
    activeTab,
    currentUserRole,
    hasPermission,
    setIsMobileNavOpen,
    setIsCreateOrderModalOpen,
  } = useApp();

  const tabTitles: Record<typeof activeTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Dashboard Warung',
      subtitle: 'Ringkasan penjualan harian, stok menipis, dan performa kasir',
    },
    orders: {
      title: 'Daftar Pesanan & Riwayat Transaksi',
      subtitle: 'Manajemen transaksi kasir, rincian pesanan, dan cetak struk',
    },
    products: {
      title: 'Master Produk & Stok',
      subtitle: 'Katalog barang, harga jual, HPP terbobot, kategori, rak fisik, dan import CSV',
    },
    stock_opname: {
      title: 'Stock Opname & Audit Fisik',
      subtitle: 'Audit fisik stok per rak/kategori, rekonsiliasi selisih barang, dan penjadwalan',
    },
    finance: {
      title: 'Laporan Keuangan & Laba Rugi',
      subtitle: 'Pencatatan pendapatan, biaya operasional, laba bersih, dan arus kas',
    },
    perangkat_kasir: {
      title: 'Perangkat Kasir (Hardware POS)',
      subtitle: 'Konfigurasi printer struk thermal, laci kasir (drawer RJ11), dan pemindai barcode',
    },
    integrasi_channel: {
      title: 'Integrasi Saluran (Omnichannel)',
      subtitle: 'Sinkronisasi pesanan multi-saluran Shopee, Tokopedia, TikTok Shop, GoFood, GrabFood & stok terpusat',
    },
    users: {
      title: 'Manajemen Pengguna & Hak Akses',
      subtitle: 'Kelola akun staf, penugasan role kustom, dan izin akses modul',
    },
    settings: {
      title: 'Pengaturan & Profil Akun',
      subtitle: 'Identitas usaha, data profil pemilik, dan keamanan autentikasi',
    },
  };

  const currentMeta = tabTitles[activeTab] || tabTitles.dashboard;
  const canCreateOrder = hasPermission('orders', 'create');

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left: Mobile hamburger menu & Page Title */}
          <div className="flex items-center space-x-3 min-w-0">
            {/* Hamburger Button (Mobile & Tablet) */}
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Buka Menu Navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Store Icon & Title */}
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="lg:hidden w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Store className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate leading-tight">
                  {currentMeta.title}
                </h1>
                <p className="hidden sm:block text-xs text-slate-500 truncate">
                  {currentMeta.subtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Quick Action & Role Badge */}
          <div className="flex items-center space-x-3 shrink-0">
            {currentUserRole && (
              <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
                <Shield className="w-3.5 h-3.5 text-teal-600" />
                <span>Role: {currentUserRole.name}</span>
              </div>
            )}

            {canCreateOrder && (
              <button
                id="topbar-create-order-btn"
                onClick={() => setIsCreateOrderModalOpen(true)}
                className="flex items-center space-x-1.5 sm:space-x-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-sm shadow-teal-600/20 active:scale-[0.99] transition-all cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Pesanan</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
