'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { DateFilterType, DateRange, Order, SalesChannel } from '@/types';
import { formatRupiah, formatDate, formatTime, isDateInFilter } from '@/lib/utils';
import { SalesChannelBadge } from '@/components/SalesChannelBadge';
import { DateRangeDropdown } from '@/components/DateRangeDropdown';
import {
  TrendingUp,
  ShoppingCart,
  PackagePlus,
  Calendar,
  DollarSign,
  ChevronRight,
  ChevronDown,
  Clock,
  CheckCircle2,
  Globe,
  ExternalLink,
  Plus,
  Building2,
} from 'lucide-react';

interface DashboardViewProps {
  onViewOrder?: (order: Order) => void;
}

export function DashboardView({ onViewOrder }: DashboardViewProps) {
  const {
    products,
    orders,
    revenues,
    costs,
    setRestockModalProductId,
    setIsCreateOrderModalOpen,
    setActiveTab,
    hasPermission,
    branches,
    activeBranchId,
    activeBranch,
    getProductStockInBranch,
  } = useApp();

  // Date filter state - default to 30 days
  const [dateFilter, setDateFilter] = useState<DateFilterType>('30days');
  const [customRange, setCustomRange] = useState<DateRange>(() => ({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
  }));

  // Chart period state (Last 30 days default)
  const [chartPeriod, setChartPeriod] = useState<'7days' | '14days' | '30days' | 'this_month' | 'custom'>('30days');
  const [chartCustomRange, setChartCustomRange] = useState<DateRange>(() => ({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
  }));

  // Filtered Orders & Revenues for main metrics (by Date AND activeBranchId)
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchDate = isDateInFilter(o.createdAt, dateFilter, customRange);
      const matchBranch = activeBranchId === 'all' || o.branchId === activeBranchId;
      return o.status === 'Finished' && matchDate && matchBranch;
    });
  }, [orders, dateFilter, customRange, activeBranchId]);

  const filteredRevenues = useMemo(() => {
    return revenues.filter((r) => {
      const matchDate = isDateInFilter(r.date, dateFilter, customRange);
      const matchBranch = activeBranchId === 'all' || r.branchId === activeBranchId;
      return matchDate && matchBranch;
    });
  }, [revenues, dateFilter, customRange, activeBranchId]);

  const filteredCosts = useMemo(() => {
    return costs.filter((c) => {
      const matchDate = isDateInFilter(c.date, dateFilter, customRange);
      const matchBranch = activeBranchId === 'all' || c.branchId === activeBranchId;
      return matchDate && matchBranch;
    });
  }, [costs, dateFilter, customRange, activeBranchId]);

  // Main KPI calculations
  const totalPendapatan = useMemo(() => {
    return filteredRevenues.reduce((sum, r) => sum + r.amount, 0);
  }, [filteredRevenues]);

  const totalOrderCount = filteredOrders.length;

  const totalPengeluaran = useMemo(() => {
    return filteredCosts.reduce((sum, c) => sum + c.amount, 0);
  }, [filteredCosts]);

  const estimasiLaba = totalPendapatan - totalPengeluaran;

  const totalItemsSold = useMemo(() => {
    return filteredOrders.reduce((sum, o) => {
      return sum + o.items.reduce((s, it) => s + it.quantity, 0);
    }, 0);
  }, [filteredOrders]);

  // Low stock products (branch-aware)
  const lowStockProducts = useMemo(() => {
    return products
      .map((p) => {
        const branchStock = activeBranchId === 'all' ? p.stock : getProductStockInBranch(p.id, activeBranchId);
        return {
          ...p,
          effectiveStock: branchStock,
        };
      })
      .filter((p) => !p.isArchived && p.effectiveStock <= (p.minStockThreshold ?? 5))
      .sort((a, b) => a.effectiveStock - b.effectiveStock);
  }, [products, activeBranchId, getProductStockInBranch]);

  // Recent transactions (filtered by active branch)
  const recentOrders = useMemo(() => {
    return orders
      .filter((o) => activeBranchId === 'all' || o.branchId === activeBranchId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
  }, [orders, activeBranchId]);

  // Channel breakdown for omnichannel insights
  const channelBreakdown = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    filteredOrders.forEach((o) => {
      const ch = o.salesChannel || 'Offline / Kasir';
      if (!map[ch]) map[ch] = { count: 0, total: 0 };
      map[ch].count += 1;
      map[ch].total += o.total;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [filteredOrders]);

  // Chart data preparation
  const chartData = useMemo(() => {
    let daysCount = 30;
    if (chartPeriod === '7days') daysCount = 7;
    else if (chartPeriod === '14days') daysCount = 14;
    else if (chartPeriod === '30days') daysCount = 30;
    else if (chartPeriod === 'this_month') daysCount = Math.max(1, new Date().getDate());

    const data: { label: string; dateStr: string; amount: number }[] = [];
    const now = new Date();

    if (chartPeriod === 'custom' && chartCustomRange.startDate && chartCustomRange.endDate) {
      const start = new Date(chartCustomRange.startDate);
      const end = new Date(chartCustomRange.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.min(60, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

      for (let i = 0; i < diffDays; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().slice(0, 10);
        const dayLabel = `${d.getDate()} ${d.toLocaleDateString('id-ID', { month: 'short' })}`;

        const dayRev = revenues
          .filter((r) => r.date.slice(0, 10) === dateStr && (activeBranchId === 'all' || r.branchId === activeBranchId))
          .reduce((sum, r) => sum + r.amount, 0);

        data.push({ label: dayLabel, dateStr, amount: dayRev });
      }
    } else {
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const dayLabel = `${d.getDate()} ${d.toLocaleDateString('id-ID', { month: 'short' })}`;

        const dayRev = revenues
          .filter((r) => r.date.slice(0, 10) === dateStr && (activeBranchId === 'all' || r.branchId === activeBranchId))
          .reduce((sum, r) => sum + r.amount, 0);

        data.push({ label: dayLabel, dateStr, amount: dayRev });
      }
    }

    return data;
  }, [chartPeriod, chartCustomRange, revenues, activeBranchId]);

  const maxChartAmount = Math.max(10000, ...chartData.map((d) => d.amount));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-slate-900">
      {/* Date Filter */}
      <div className="flex justify-start">
        <DateRangeDropdown
          value={dateFilter}
          onChange={(val) => setDateFilter(val as DateFilterType)}
          customRange={customRange}
          onCustomRangeChange={setCustomRange}
        />
      </div>

      {/* 2 MAIN METRICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Total Pendapatan */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-5 relative overflow-hidden">
          <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center shrink-0 border border-teal-100">
            <DollarSign className="w-7 h-7" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">
              Pendapatan Kasir
            </span>
            <h3 className="text-sm font-medium text-slate-500">Total Pendapatan</h3>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
              {formatRupiah(totalPendapatan)}
            </div>
            <p className="text-xs text-slate-500">
              {filteredRevenues.length} transaksi penjualan periode ini
            </p>
          </div>
        </div>

        {/* Total Order */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-5 relative overflow-hidden">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100">
            <ShoppingCart className="w-7 h-7" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
              Volume Pesanan
            </span>
            <h3 className="text-sm font-medium text-slate-500">Total Order</h3>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
              {totalOrderCount}{' '}
              <span className="text-base font-normal text-slate-500">Pesanan</span>
            </div>
            <p className="text-xs text-slate-500">
              {totalItemsSold} item produk keluar
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <span className="text-xs text-slate-500 block">Total Pengeluaran</span>
          <span className="text-base font-bold text-slate-900 mt-1 block">
            {formatRupiah(totalPengeluaran)}
          </span>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <span className="text-xs text-slate-500 block">Estimasi Keuntungan</span>
          <span className={`text-base font-bold mt-1 block ${estimasiLaba >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatRupiah(estimasiLaba)}
          </span>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <span className="text-xs text-slate-500 block">Perlu Restock</span>
          <span className={`text-base font-bold mt-1 block ${lowStockProducts.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {lowStockProducts.length} Produk
          </span>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <span className="text-xs text-slate-500 block">Rata-rata per Pesanan</span>
          <span className="text-base font-bold text-slate-900 mt-1 block">
            {totalOrderCount > 0 ? formatRupiah(Math.round(totalPendapatan / totalOrderCount)) : 'Rp 0'}
          </span>
        </div>
      </div>

      {/* SECTION: RINGKASAN PENDAPATAN (REVENUE SUMMARY CHART) */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Ringkasan Pendapatan</h3>
            <p className="text-xs text-slate-500">Grafik tren omzet warung harian</p>
          </div>

          {/* Period switch dropdown */}
          <div className="flex items-center flex-wrap gap-2">
            <div className="relative inline-flex items-center">
              <div className="flex items-center space-x-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-xs transition-all focus-within:border-teal-500">
                <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <select
                  value={chartPeriod}
                  onChange={(e) => setChartPeriod(e.target.value as any)}
                  className="appearance-none bg-transparent pr-6 py-0.5 text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                  aria-label="Periode Grafik"
                >
                  <option value="30days">30 Hari Terakhir</option>
                  <option value="14days">14 Hari Terakhir</option>
                  <option value="7days">7 Hari Terakhir</option>
                  <option value="this_month">Bulan Ini</option>
                  <option value="custom">Rentang Kustom...</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5" />
              </div>
            </div>

            {/* Custom Range for Chart if selected */}
            {chartPeriod === 'custom' && (
              <div className="flex items-center space-x-1.5 text-xs p-1 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in duration-200">
                <input
                  type="date"
                  value={chartCustomRange.startDate}
                  onChange={(e) =>
                    setChartCustomRange((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                  className="bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-teal-500"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="date"
                  value={chartCustomRange.endDate}
                  onChange={(e) =>
                    setChartCustomRange((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                  className="bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Clean Responsive Bar Chart */}
        <div className="pt-2">
          <div className="h-56 w-full flex items-end justify-between gap-1.5 sm:gap-3 px-2 pt-6 pb-2 border-b border-slate-100">
            {chartData.map((d, idx) => {
              const heightPercent = maxChartAmount > 0 ? (d.amount / maxChartAmount) * 100 : 0;
              const barHeight = Math.max(d.amount > 0 ? 8 : 2, heightPercent);

              return (
                <div
                  key={idx}
                  className="flex-1 rounded-t-lg relative group h-full flex flex-col justify-end"
                >
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[11px] py-1 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap pointer-events-none shadow-lg">
                    <span className="font-semibold text-teal-400">{formatRupiah(d.amount)}</span>
                    <span className="text-slate-300 text-[10px] ml-1.5">({d.label})</span>
                  </div>

                  {/* Chart Bar */}
                  <div
                    style={{ height: `${barHeight}%` }}
                    className={`w-full rounded-t-lg transition-all duration-300 ${
                      d.amount > 0
                        ? 'bg-teal-500 group-hover:bg-teal-600'
                        : 'bg-slate-100'
                    }`}
                  />
                  {/* Amount label for larger screens */}
                  {d.amount > 0 && (
                    <span className="hidden lg:block text-[10px] text-teal-700 mt-1 font-semibold truncate w-full text-center">
                      {(d.amount / 1000).toFixed(0)}k
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* X Axis Labels */}
          <div className="flex justify-between text-[11px] font-medium text-slate-500 pt-3 px-1">
            {chartData.map((d, idx) => (
              <span
                key={idx}
                className={`text-center flex-1 truncate ${
                  idx % (chartData.length > 14 ? 3 : 1) === 0 ? 'opacity-100' : 'opacity-0 sm:opacity-100'
                }`}
              >
                {d.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* RINGKASAN SALURAN PENJUALAN (OMNICHANNEL BREAKDOWN) */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Performa Saluran Penjualan</h3>
              <p className="text-xs text-slate-500">
                Pencatatan omzet terpusat dari offline warung & marketplace e-commerce
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('integrasi_channel')}
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>Kelola Integrasi Saluran</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {channelBreakdown.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            Belum ada transaksi pada filter periode ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
            {channelBreakdown.map(([chName, stats]) => {
              const share = totalPendapatan > 0 ? ((stats.total / totalPendapatan) * 100).toFixed(0) : '0';
              return (
                <div
                  key={chName}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <SalesChannelBadge channel={chName as SalesChannel} size="sm" />
                    <span className="text-[11px] font-bold text-slate-500">{share}% Omzet</span>
                  </div>

                  <div>
                    <div className="text-lg font-bold text-slate-900">
                      {formatRupiah(stats.total)}
                    </div>
                    <div className="text-xs text-slate-500">
                      {stats.count} Transaksi
                    </div>
                  </div>

                  {/* Visual Share Bar */}
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-teal-600 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(8, Number(share)))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2-COLUMN SECTION: STOCK MENIPIS & PESANAN TERBARU */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* STOCK MENIPIS */}
        <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-xs">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                <h3 className="font-bold text-slate-900 text-base">Stok Menipis</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                  {lowStockProducts.length} Produk
                </span>
              </div>
              <button
                onClick={() => setActiveTab('products')}
                className="text-xs text-slate-500 hover:text-teal-600 font-medium flex items-center space-x-1 transition-colors cursor-pointer"
              >
                <span>Lihat Semua Stok</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Low Stock List */}
            <div className="mt-3.5 space-y-2.5">
              {lowStockProducts.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-1.5" />
                  <span className="font-medium text-slate-600">Semua persediaan barang warung dalam kondisi aman.</span>
                </div>
              ) : (
                lowStockProducts.slice(0, 5).map((prod) => (
                  <div
                    key={prod.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                        <span>{prod.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({prod.category})</span>
                      </div>
                      <div className="text-xs text-amber-600 font-medium mt-0.5">
                        Sisa: {prod.effectiveStock} {prod.unit}{' '}
                        <span className="text-[11px] text-slate-400 font-normal">
                          (Batas min: {prod.minStockThreshold ?? 5} {prod.unit})
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setRestockModalProductId(prod.id)}
                      className="text-xs font-semibold bg-white text-teal-700 border border-teal-200 px-3.5 py-1.5 rounded-xl hover:bg-teal-50 shadow-xs transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
                    >
                      <PackagePlus className="w-3.5 h-3.5 text-teal-600" />
                      <span>Restock</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* PESANAN TERBARU */}
        <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-xs">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-base">Pesanan Terbaru</h3>
              </div>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-xs text-teal-600 font-semibold hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <span>Lihat Semua</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Orders List */}
            <div className="mt-3.5 space-y-2.5">
              {recentOrders.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Belum ada riwayat pesanan.
                </div>
              ) : (
                recentOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 flex items-center gap-2">
                        <span>{ord.id}</span>
                        <SalesChannelBadge channel={ord.salesChannel || 'Offline / Kasir'} size="sm" />
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            ord.status === 'Finished'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {ord.status === 'Finished' ? 'SUKSES' : 'BATAL'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>{formatTime(ord.createdAt)}</span>
                        <span>•</span>
                        <span className="font-medium text-slate-600">
                          {ord.paymentMethod}
                        </span>
                        <span>•</span>
                        <span>{ord.items.length} Item</span>
                        {ord.branchName && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center space-x-1 font-medium text-slate-600">
                              <Building2 className="w-2.5 h-2.5 text-slate-400" />
                              <span>{ord.branchName}</span>
                            </span>
                          </>
                        )}
                        {ord.externalOrderId && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-slate-500">
                              #{ord.externalOrderId}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-slate-900 text-sm">
                        {formatRupiah(ord.total)}
                      </span>
                      <button
                        onClick={() => {
                          if (onViewOrder) {
                            onViewOrder(ord);
                          } else {
                            setActiveTab('orders');
                          }
                        }}
                        className="text-xs font-semibold text-teal-600 hover:bg-teal-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                        title="Lihat Detail Pesanan"
                      >
                        Detail
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
