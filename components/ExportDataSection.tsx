'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Download,
  FileSpreadsheet,
  Calendar,
  Building2,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import {
  exportOrdersCsv,
  exportProductsCsv,
  exportCashierShiftsCsv,
  exportStockOpnamesCsv,
  isDateInRange,
  ExportDateBounds,
} from '@/lib/csvExport';

type ExportDataType = 'orders' | 'products' | 'shifts' | 'stock_opnames';
type QuickDateRange = 'today' | '7days' | '30days' | 'this_month' | 'all' | 'custom';

export function ExportDataSection() {
  const {
    orders,
    products,
    cashierShifts,
    stockOpnames,
    branches,
    settings,
  } = useApp();

  const [dataType, setDataType] = useState<ExportDataType>('orders');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [dateRangeType, setDateRangeType] = useState<QuickDateRange>('this_month');
  
  // Custom date range inputs
  const todayStr = new Date().toISOString().slice(0, 10);
  const firstDayOfMonthStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  
  const [startDate, setStartDate] = useState<string>(firstDayOfMonthStr);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Compute effective date bounds
  const getFilterDateBounds = (): ExportDateBounds | null => {
    if (dateRangeType === 'all') return null;

    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (dateRangeType === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (dateRangeType === '7days') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (dateRangeType === '30days') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (dateRangeType === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (dateRangeType === 'custom') {
      const s = new Date(startDate);
      const e = new Date(endDate);
      start = new Date(s.getFullYear(), s.getMonth(), s.getDate(), 0, 0, 0);
      end = new Date(e.getFullYear(), e.getMonth(), e.getDate(), 23, 59, 59);
    }

    return { start, end };
  };

  // Preview Count Calculation
  const getFilteredCounts = () => {
    const bounds = getFilterDateBounds();

    if (dataType === 'orders') {
      return orders.filter((o) => {
        const matchesBranch = selectedBranchId === 'all' || o.branchId === selectedBranchId;
        const matchesDate = isDateInRange(o.createdAt, bounds);
        return matchesBranch && matchesDate;
      }).length;
    }

    if (dataType === 'products') {
      return products.filter((p) => !p.isArchived).length;
    }

    if (dataType === 'shifts') {
      return cashierShifts.filter((s) => {
        const matchesBranch = selectedBranchId === 'all' || s.branchId === selectedBranchId;
        const matchesDate = isDateInRange(s.startTime, bounds);
        return matchesBranch && matchesDate;
      }).length;
    }

    if (dataType === 'stock_opnames') {
      return stockOpnames.filter((so) => {
        const matchesBranch = selectedBranchId === 'all' || !so.branchId || so.branchId === selectedBranchId;
        const matchesDate = isDateInRange(so.createdAt, bounds);
        return matchesBranch && matchesDate;
      }).length;
    }

    return 0;
  };

  const previewCount = getFilteredCounts();

  // Export handlers
  const handleExport = () => {
    setIsExporting(true);
    const bounds = getFilterDateBounds();
    const storeSlug = (settings.name || 'toko').toLowerCase().replace(/[^a-z0-9]/g, '_');

    try {
      if (dataType === 'orders') {
        const count = exportOrdersCsv(orders, selectedBranchId, bounds, storeSlug);
        setSuccessMessage(`Berhasil mengekspor ${count} transaksi pesanan.`);
      } else if (dataType === 'products') {
        const count = exportProductsCsv(products, storeSlug);
        setSuccessMessage(`Berhasil mengekspor ${count} data produk.`);
      } else if (dataType === 'shifts') {
        const count = exportCashierShiftsCsv(cashierShifts, selectedBranchId, bounds, storeSlug);
        setSuccessMessage(`Berhasil mengekspor ${count} riwayat shift kasir.`);
      } else if (dataType === 'stock_opnames') {
        const count = exportStockOpnamesCsv(stockOpnames, selectedBranchId, bounds, storeSlug);
        setSuccessMessage(`Berhasil mengekspor ${count} sesi audit stock opname.`);
      }
    } catch (err) {
      console.error('Failed to export CSV:', err);
    } finally {
      setIsExporting(false);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Ekspor Data</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Unduh laporan format CSV siap pakai untuk pembukuan Excel, audit stok, atau arsip
          </p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-200">
          <FileSpreadsheet className="w-5 h-5" />
        </div>
      </div>

      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2.5 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Grid Konfigurasi Ekspor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Kolom Kiri: Pilihan Data */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Jenis Data
            </label>
            <div className="grid grid-cols-1 gap-2">
              <label
                className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  dataType === 'orders'
                    ? 'border-teal-500 bg-teal-50/50 text-slate-900 font-semibold shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <input
                    type="radio"
                    name="exportDataType"
                    value="orders"
                    checked={dataType === 'orders'}
                    onChange={() => setDataType('orders')}
                    className="accent-teal-600"
                  />
                  <span>Transaksi Penjualan</span>
                </div>
                <span className="text-[11px] text-slate-400 font-normal">Riwayat pesanan kasir</span>
              </label>

              <label
                className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  dataType === 'products'
                    ? 'border-teal-500 bg-teal-50/50 text-slate-900 font-semibold shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <input
                    type="radio"
                    name="exportDataType"
                    value="products"
                    checked={dataType === 'products'}
                    onChange={() => setDataType('products')}
                    className="accent-teal-600"
                  />
                  <span>Katalog Produk</span>
                </div>
                <span className="text-[11px] text-slate-400 font-normal">Master harga dan stok</span>
              </label>

              <label
                className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  dataType === 'shifts'
                    ? 'border-teal-500 bg-teal-50/50 text-slate-900 font-semibold shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <input
                    type="radio"
                    name="exportDataType"
                    value="shifts"
                    checked={dataType === 'shifts'}
                    onChange={() => setDataType('shifts')}
                    className="accent-teal-600"
                  />
                  <span>Shift Kasir</span>
                </div>
                <span className="text-[11px] text-slate-400 font-normal">Rekap laci dan arus kas</span>
              </label>

              <label
                className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  dataType === 'stock_opnames'
                    ? 'border-teal-500 bg-teal-50/50 text-slate-900 font-semibold shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <input
                    type="radio"
                    name="exportDataType"
                    value="stock_opnames"
                    checked={dataType === 'stock_opnames'}
                    onChange={() => setDataType('stock_opnames')}
                    className="accent-teal-600"
                  />
                  <span>Stock Opname</span>
                </div>
                <span className="text-[11px] text-slate-400 font-normal">Audit fisik dan selisih</span>
              </label>
            </div>
          </div>

          {/* Filter Cabang */}
          {dataType !== 'products' && branches.length > 1 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Filter Cabang</span>
              </label>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
              >
                <option value="all">Semua Cabang Toko</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Kolom Kanan: Rentang Waktu & Aksi */}
        <div className="space-y-4">
          {dataType !== 'products' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Rentang Tanggal</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-3">
                {[
                  { id: 'today', label: 'Hari Ini' },
                  { id: '7days', label: '7 Hari Terakhir' },
                  { id: '30days', label: '30 Hari Terakhir' },
                  { id: 'this_month', label: 'Bulan Ini' },
                  { id: 'all', label: 'Semua Waktu' },
                  { id: 'custom', label: 'Kustom' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDateRangeType(item.id as QuickDateRange)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition-colors cursor-pointer ${
                      dateRangeType === item.id
                        ? 'bg-teal-50 text-teal-700 border-teal-200 font-semibold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {dateRangeType === 'custom' && (
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Dari Tanggal</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Sampai Tanggal</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <p className="text-xs font-semibold text-slate-800">Master Data Produk</p>
              <p className="text-[11px] text-slate-500">
                Ekspor katalog mencakup seluruh barang aktif, informasi harga jual, harga beli HPP, barcode, rak, serta posisi stok fisik saat ini.
              </p>
            </div>
          )}

          {/* Ringkasan & Eksekusi Tombol */}
          <div className="p-4 bg-teal-50/40 border border-teal-100 rounded-xl flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Estimasi Data Siap Ekspor:</span>
              <span className="font-bold text-teal-800 font-mono text-sm">
                {previewCount} data
              </span>
            </div>

            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting || previewCount === 0}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs ${
                previewCount === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Menyiapkan File...' : 'Unduh CSV'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
