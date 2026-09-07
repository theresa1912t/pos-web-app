'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Menu,
  Plus,
  Store,
  Building2,
  ChevronDown,
  Check,
  Lock,
} from 'lucide-react';

export function Topbar() {
  const {
    activeTab,
    hasPermission,
    setIsMobileNavOpen,
    setIsCreateOrderModalOpen,
    branches,
    activeBranchId,
    activeBranch,
    setActiveBranchId,
    canSwitchToAllBranches,
    accessibleBranches,
  } = useApp();

  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const branchDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(event.target as Node)) {
        setIsBranchDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tabTitles: Record<typeof activeTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Dashboard Warung',
      subtitle: 'Pantau penjualan, kondisi persediaan stok barang, dan arus kas',
    },
    orders: {
      title: 'Daftar Pesanan & Riwayat Transaksi',
      subtitle: 'Manajemen transaksi kasir, rincian pesanan, dan cetak struk',
    },
    products: {
      title: 'Katalog & Master Produk',
      subtitle: 'Kelola data barang dan kategori',
    },
    promotions: {
      title: 'Manajemen Promosi & Harga Coret',
      subtitle: 'Kelola diskon berkala, flash sale, program JSM, dan perlindungan margin HPP',
    },
    inventory: {
      title: 'Inventaris & Gudang',
      subtitle: 'Audit fisik stok opname, tata letak rak barang, dan rekonsiliasi persediaan',
    },
    stock_opname: {
      title: 'Stock Opname & Audit Fisik',
      subtitle: 'Audit fisik stok per rak/kategori, rekonsiliasi selisih barang, dan penjadwalan',
    },
    finance: {
      title: 'Laporan Keuangan & Laba Rugi',
      subtitle: 'Pencatatan pendapatan, biaya operasional, laba bersih, dan arus kas',
    },
    branches: {
      title: 'Manajemen Cabang Usaha',
      subtitle: 'Kelola multi-cabang fisik toko, kode cabang, aktivasi status, dan ringkasan inventori',
    },
    perangkat_kasir: {
      title: 'Perangkat Kasir (Hardware POS)',
      subtitle: 'Konfigurasi printer struk thermal, laci kasir (drawer RJ11), dan pemindai barcode',
    },
    integrasi_channel: {
      title: 'Integrasi Saluran (Omnichannel)',
      subtitle: 'Sinkronisasi pesanan multi-saluran',
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
  const canCreateOrder = hasPermission('orders', 'create') && (activeTab === 'orders' || activeTab === 'dashboard');

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

          {/* Right: Branch Selector, Role Badge & Quick Action */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0">
            {/* Branch Context Selector */}
            <div className="relative" ref={branchDropdownRef}>
              {canSwitchToAllBranches ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-800 transition-all cursor-pointer shadow-2xs"
                    aria-haspopup="listbox"
                    aria-expanded={isBranchDropdownOpen}
                  >
                    <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span className="font-semibold truncate max-w-[130px] sm:max-w-[170px]">
                      {activeBranchId === 'all'
                        ? 'Semua Cabang'
                        : activeBranch?.name || 'Pilih Cabang'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-0.5" />
                  </button>

                  {isBranchDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl py-1.5 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-3.5 py-2 border-b border-slate-100">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Pilih Konteks Cabang
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Menentukan data stok, transaksi & laporan
                        </p>
                      </div>

                      <div className="py-1 max-h-64 overflow-y-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveBranchId('all');
                            setIsBranchDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2 text-left text-xs transition-colors cursor-pointer ${
                            activeBranchId === 'all'
                              ? 'bg-teal-50 text-teal-900 font-semibold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                            <div className="min-w-0">
                              <p className="truncate">Semua Cabang</p>
                              <p className="text-[10px] text-slate-400 font-normal">Data agregat & konsolidasi</p>
                            </div>
                          </div>
                          {activeBranchId === 'all' && (
                            <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          )}
                        </button>

                        <div className="my-1 border-t border-slate-100" />

                        {accessibleBranches.map((branch) => {
                          const isSelected = activeBranchId === branch.id;
                          return (
                            <button
                              key={branch.id}
                              type="button"
                              onClick={() => {
                                setActiveBranchId(branch.id);
                                setIsBranchDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3.5 py-2 text-left text-xs transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-teal-50 text-teal-900 font-semibold'
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center space-x-2.5 min-w-0">
                                <span
                                  className={`w-2 h-2 rounded-full shrink-0 ${
                                    branch.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300'
                                  }`}
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center space-x-1.5">
                                    <p className="truncate">{branch.name}</p>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                                      {branch.code}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 font-normal truncate">
                                    {branch.address || 'Alamat belum diatur'}
                                  </p>
                                </div>
                              </div>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-teal-600 shrink-0 ml-2" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Locked branch for staff/cashier without multi-branch permission */
                <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-medium truncate max-w-[120px] sm:max-w-[150px]">
                    {activeBranch?.name || 'Cabang Ditugaskan'}
                  </span>
                  <span title="Terkunci ke cabang penugasan Anda" className="inline-flex">
                    <Lock className="w-3 h-3 text-slate-400" />
                  </span>
                </div>
              )}
            </div>

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
