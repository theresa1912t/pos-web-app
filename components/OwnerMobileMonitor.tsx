'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { formatRupiah, formatDate, formatTime } from '@/lib/utils';
import { SalesChannelBadge } from '@/components/SalesChannelBadge';
import {
  TrendingUp,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  RotateCcw,
  Share2,
  Copy,
  Check,
  Building2,
  ChevronDown,
  UserCheck,
  Clock,
  Wallet,
  ArrowUpRight,
  Package,
  Layers,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Sparkles,
  Percent,
} from 'lucide-react';
import { Order, SalesChannel, PaymentMethod } from '@/types';

export function OwnerMobileMonitor() {
  const {
    orders,
    products,
    branches,
    activeBranchId,
    setActiveBranchId,
    activeBranch,
    accessibleBranches,
    canSwitchToAllBranches,
    cashierShifts,
    customerReceivables,
    supplierPayables,
    setActiveTab,
  } = useApp();

  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  // Auto refresh timestamp update every 60s
  useEffect(() => {
    const timer = setInterval(() => {
      setLastRefreshed(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastRefreshed(new Date());
      setIsRefreshing(false);
    }, 450);
  };

  // Filter orders by active branch
  const branchFilteredOrders = useMemo(() => {
    if (activeBranchId === 'all') return orders;
    return orders.filter((o) => o.branchId === activeBranchId);
  }, [orders, activeBranchId]);

  // Today's date filter (YYYY-MM-DD comparison in local time)
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const todayOrders = useMemo(() => {
    return branchFilteredOrders.filter((ord) => {
      if (ord.status !== 'Finished') return false;
      const orderDate = new Date(ord.createdAt);
      const y = orderDate.getFullYear();
      const m = String(orderDate.getMonth() + 1).padStart(2, '0');
      const d = String(orderDate.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}` === todayStr;
    });
  }, [branchFilteredOrders, todayStr]);

  // Key metrics for today
  const todayRevenue = useMemo(() => {
    return todayOrders.reduce((sum, ord) => sum + ord.total, 0);
  }, [todayOrders]);

  const todayCogs = useMemo(() => {
    return todayOrders.reduce((sum, ord) => sum + (ord.totalCogs || 0), 0);
  }, [todayOrders]);

  const todayGrossProfit = todayRevenue - todayCogs;
  const todayMarginPercent = todayRevenue > 0 ? ((todayGrossProfit / todayRevenue) * 100).toFixed(1) : '0';
  const todayTxCount = todayOrders.length;
  const averageOrderValue = todayTxCount > 0 ? Math.round(todayRevenue / todayTxCount) : 0;

  // Active cashier shift for selected branch (or first active shift if "all")
  const activeShift = useMemo(() => {
    if (activeBranchId !== 'all') {
      return cashierShifts.find((s) => s.branchId === activeBranchId && s.status === 'Open') || null;
    }
    return cashierShifts.find((s) => s.status === 'Open') || null;
  }, [cashierShifts, activeBranchId]);

  // Payment Breakdown for today's orders
  const paymentBreakdown = useMemo(() => {
    let cash = 0;
    let qris = 0;
    let transfer = 0;
    let others = 0;

    todayOrders.forEach((ord) => {
      const method = (ord.paymentMethod || '').toLowerCase();
      if (method.includes('cash') || method.includes('tunai')) {
        cash += ord.total;
      } else if (method.includes('qris')) {
        qris += ord.total;
      } else if (method.includes('transfer')) {
        transfer += ord.total;
      } else {
        others += ord.total;
      }
    });

    return { cash, qris, transfer, others };
  }, [todayOrders]);

  // Cash on hand in drawer (starting cash + cash sales + cash movements)
  const estimatedCashInDrawer = useMemo(() => {
    if (!activeShift) {
      return paymentBreakdown.cash;
    }
    const startingCash = activeShift.startingCash || 0;
    const cashIn = (activeShift.cashMovements || [])
      .filter((m) => m.type === 'CashIn')
      .reduce((sum, m) => sum + m.amount, 0);
    const cashOut = (activeShift.cashMovements || [])
      .filter((m) => m.type === 'CashOut')
      .reduce((sum, m) => sum + m.amount, 0);

    return startingCash + paymentBreakdown.cash + cashIn - cashOut;
  }, [activeShift, paymentBreakdown.cash]);

  // Top 5 best selling products today
  const topProductsToday = useMemo(() => {
    const productMap = new Map<string, { name: string; qty: number; total: number }>();

    todayOrders.forEach((ord) => {
      (ord.items || []).forEach((item) => {
        const existing = productMap.get(item.productId) || {
          name: item.productName,
          qty: 0,
          total: 0,
        };
        existing.qty += item.quantity;
        existing.total += item.subtotal || item.sellingPrice * item.quantity;
        productMap.set(item.productId, existing);
      });
    });

    return Array.from(productMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [todayOrders]);

  // Omnichannel breakdown for today
  const channelBreakdown = useMemo(() => {
    const channelMap = new Map<SalesChannel, { count: number; total: number }>();

    todayOrders.forEach((ord) => {
      const ch = ord.salesChannel || 'Offline / Kasir';
      const existing = channelMap.get(ch) || { count: 0, total: 0 };
      existing.count += 1;
      existing.total += ord.total;
      channelMap.set(ch, existing);
    });

    return Array.from(channelMap.entries()).map(([channel, data]) => ({
      channel,
      count: data.count,
      total: data.total,
    }));
  }, [todayOrders]);

  // Alerts: Critical stock (< threshold)
  const criticalStockProducts = useMemo(() => {
    return products.filter((p) => !p.isArchived && p.stock <= (p.minStockThreshold ?? 5));
  }, [products]);

  // Alerts: Customer receivables due
  const dueReceivables = useMemo(() => {
    return customerReceivables.filter((r) => r.status !== 'Paid' && r.remainingAmount > 0);
  }, [customerReceivables]);

  // WhatsApp Report Generator
  const generateWhatsAppMessage = () => {
    const branchName = activeBranchId === 'all' ? 'Semua Cabang' : activeBranch?.name || 'Toko';
    const timeFormatted = lastRefreshed.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const dateFormatted = lastRefreshed.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

    let msg = `*📊 LAPORAN MONITOR OWNER - ${branchName.toUpperCase()}*\n`;
    msg += `📅 *${dateFormatted} | ${timeFormatted} WIB*\n\n`;

    msg += `*PERFORMA PENJUALAN HARI INI:*\n`;
    msg += `💰 *Total Omset:* ${formatRupiah(todayRevenue)}\n`;
    msg += `📈 *Est. Laba Kotor:* ${formatRupiah(todayGrossProfit)} (${todayMarginPercent}%)\n`;
    msg += `🧾 *Jumlah Transaksi:* ${todayTxCount} struk (Rata-rata: ${formatRupiah(averageOrderValue)})\n\n`;

    msg += `*AUDIT LACI & PEMBAYARAN:*\n`;
    msg += `💵 *Uang Fisik Kasir (Cash):* ${formatRupiah(estimatedCashInDrawer)}\n`;
    msg += `📱 *QRIS:* ${formatRupiah(paymentBreakdown.qris)}\n`;
    msg += `🏦 *Transfer Bank:* ${formatRupiah(paymentBreakdown.transfer)}\n`;
    if (paymentBreakdown.others > 0) {
      msg += `💳 *Debit/Lainnya:* ${formatRupiah(paymentBreakdown.others)}\n`;
    }
    msg += `\n`;

    if (activeShift) {
      msg += `👤 *Kasir Bertugas:* ${activeShift.cashierName} (Mulai: ${formatTime(activeShift.startTime)})\n\n`;
    }

    if (topProductsToday.length > 0) {
      msg += `*🏆 TOP 3 BARANG TERLARIS:*\n`;
      topProductsToday.slice(0, 3).forEach((item, idx) => {
        msg += `${idx + 1}. ${item.name} (${item.qty} terjual - ${formatRupiah(item.total)})\n`;
      });
      msg += `\n`;
    }

    if (criticalStockProducts.length > 0) {
      msg += `⚠️ *PERINGATAN STOK:* ${criticalStockProducts.length} barang butuh restock segera.\n`;
    }
    if (dueReceivables.length > 0) {
      const totalDue = dueReceivables.reduce((s, r) => s + r.remainingAmount, 0);
      msg += `📌 *PIUTANG KASBON:* ${dueReceivables.length} nota belum lunas (Total ${formatRupiah(totalDue)}).\n`;
    }

    msg += `\n_Laporan otomatis dari Sistem Warung POS_`;
    return msg;
  };

  const handleShareToWhatsApp = () => {
    const text = encodeURIComponent(generateWhatsAppMessage());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleCopyReport = () => {
    const text = generateWhatsAppMessage();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2500);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-16 font-sans">
      {/* Top Mobile Bar: Branch context & Quick Status */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex items-center justify-between gap-2">
        {/* Branch Context Selector */}
        <div className="relative flex-1 min-w-0">
          <button
            type="button"
            id="owner-monitor-branch-selector"
            onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/70 text-slate-800 text-xs font-semibold transition-colors cursor-pointer w-full justify-between"
          >
            <div className="flex items-center space-x-1.5 truncate">
              <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span className="truncate">
                {activeBranchId === 'all' ? 'Semua Cabang' : activeBranch?.name || 'Pilih Cabang'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {isBranchDropdownOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-60 rounded-2xl bg-white border border-slate-200 shadow-xl py-1 z-30 animate-in fade-in slide-in-from-top-1 duration-150">
              {canSwitchToAllBranches && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveBranchId('all');
                    setIsBranchDropdownOpen(false);
                  }}
                  className={`w-full px-3.5 py-2 text-left text-xs transition-colors flex items-center justify-between cursor-pointer ${
                    activeBranchId === 'all' ? 'bg-teal-50 text-teal-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>Semua Cabang (Konsolidasi)</span>
                  {activeBranchId === 'all' && <Check className="w-3.5 h-3.5 text-teal-600" />}
                </button>
              )}
              {accessibleBranches.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setActiveBranchId(b.id);
                    setIsBranchDropdownOpen(false);
                  }}
                  className={`w-full px-3.5 py-2 text-left text-xs transition-colors flex items-center justify-between cursor-pointer ${
                    activeBranchId === b.id ? 'bg-teal-50 text-teal-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">{b.name}</span>
                  {activeBranchId === b.id && <Check className="w-3.5 h-3.5 text-teal-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Live Refresh Button */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            type="button"
            id="owner-monitor-refresh-btn"
            onClick={handleManualRefresh}
            title="Segarkan data detik ini"
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin text-teal-600' : ''}`} />
            <span className="text-[11px] text-slate-500">
              {lastRefreshed.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </button>

          {/* Switch to Full Dashboard */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="p-1.5 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors cursor-pointer"
            title="Buka menu dashboard lengkap"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Live Kasir & Shift Status Strip */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="relative">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeShift ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-400'}`}>
              <UserCheck className="w-4 h-4" />
            </div>
            {activeShift && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold text-slate-900 truncate">
                {activeShift ? activeShift.cashierName : 'Shift Belum Aktif'}
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold ${activeShift ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                {activeShift ? 'Shift Buka' : 'Tutup'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              {activeShift ? `Buka pkl ${formatTime(activeShift.startTime)} • Modal: ${formatRupiah(activeShift.startingCash)}` : 'Kasir belum membuka shift laci'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer shrink-0"
        >
          Kasir POS
        </button>
      </div>

      {/* Primary Revenue Hero Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-md relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between text-slate-300 text-xs mb-1">
          <div className="flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-teal-400" />
            <span className="font-medium">Hari Ini: {formatDate(new Date().toISOString())}</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold tracking-wide">
            LIVE MONITOR
          </span>
        </div>

        {/* Big Omset Number */}
        <div className="mt-2">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">
            Total Omset Penjualan
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
            {formatRupiah(todayRevenue)}
          </div>
        </div>

        {/* 3 Metrics Grid in Hero */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-700/70 text-center">
          <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <span className="text-[10px] text-slate-400 block font-medium">Est. Laba Kotor</span>
            <span className="text-xs sm:text-sm font-bold text-teal-400 block mt-0.5 truncate">
              {formatRupiah(todayGrossProfit)}
            </span>
            <span className="text-[10px] text-teal-300/80 font-medium">
              Margin {todayMarginPercent}%
            </span>
          </div>

          <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <span className="text-[10px] text-slate-400 block font-medium">Transaksi</span>
            <span className="text-xs sm:text-sm font-bold text-white block mt-0.5">
              {todayTxCount} <span className="text-[10px] font-normal text-slate-400">order</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              Selesai
            </span>
          </div>

          <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <span className="text-[10px] text-slate-400 block font-medium">Rata-rata/Struk</span>
            <span className="text-xs sm:text-sm font-bold text-slate-200 block mt-0.5 truncate">
              {formatRupiah(averageOrderValue)}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              AOV
            </span>
          </div>
        </div>
      </div>

      {/* Audit Laci Kasir (Cash on Hand vs Non-Tunai) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 leading-none">Audit Uang Kasir (Laci)</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Pantau uang fisik & non-tunai detik ini</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Wajib di Laci</span>
            <span className="text-sm font-extrabold text-emerald-700 block">
              {formatRupiah(estimatedCashInDrawer)}
            </span>
          </div>
        </div>

        {/* Payment breakdown pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-medium text-slate-500 block">Tunai (Cash)</span>
            <span className="text-xs font-bold text-slate-900 block mt-0.5 truncate">
              {formatRupiah(paymentBreakdown.cash)}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-medium text-slate-500 block">QRIS</span>
            <span className="text-xs font-bold text-teal-700 block mt-0.5 truncate">
              {formatRupiah(paymentBreakdown.qris)}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-medium text-slate-500 block">Transfer Bank</span>
            <span className="text-xs font-bold text-slate-900 block mt-0.5 truncate">
              {formatRupiah(paymentBreakdown.transfer)}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-medium text-slate-500 block">Debit / Lainnya</span>
            <span className="text-xs font-bold text-slate-900 block mt-0.5 truncate">
              {formatRupiah(paymentBreakdown.others)}
            </span>
          </div>
        </div>
      </div>

      {/* Top 5 Best Selling Products Today */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 leading-none">Top Produk Hari Ini</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Barang paling laris & cepat berputar</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            {topProductsToday.length} item
          </span>
        </div>

        {topProductsToday.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            Belum ada transaksi barang selesai hari ini.
          </div>
        ) : (
          <div className="space-y-2">
            {topProductsToday.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 border border-slate-100 text-xs"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    index === 0
                      ? 'bg-amber-100 text-amber-800'
                      : index === 1
                      ? 'bg-slate-200 text-slate-700'
                      : index === 2
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate leading-tight">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {item.qty} pcs terjual
                    </p>
                  </div>
                </div>
                <span className="font-bold text-slate-800 text-xs shrink-0 pl-2">
                  {formatRupiah(item.total)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Saluran Penjualan (Omnichannel vs Kasir) */}
      {channelBreakdown.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-xs font-bold text-slate-900">Porsi Saluran Penjualan</h3>
            <span className="text-[10px] text-slate-400">Total {todayTxCount} Pesanan</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {channelBreakdown.map((ch, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs"
              >
                <div className="min-w-0">
                  <SalesChannelBadge channel={ch.channel} size="sm" />
                  <span className="text-[10px] text-slate-500 block mt-1">
                    {ch.count} transaksi
                  </span>
                </div>
                <span className="font-bold text-slate-900 text-xs">
                  {formatRupiah(ch.total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Urgent Alerts / Red Flags */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 leading-none">Peringatan Penting</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Stok menipis & piutang berjalan</p>
          </div>
        </div>

        <div className="space-y-2">
          {/* Low Stock Alert */}
          <div
            onClick={() => setActiveTab('inventory')}
            className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 cursor-pointer hover:bg-amber-100/60 transition-colors"
          >
            <div className="flex items-center space-x-2 min-w-0">
              <Package className="w-4 h-4 text-amber-700 shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-bold text-amber-900 block truncate">
                  {criticalStockProducts.length} Produk Menipis / Kritis
                </span>
                <span className="text-[10px] text-amber-700/90 block truncate">
                  {criticalStockProducts.slice(0, 2).map((p) => p.name).join(', ') || 'Semua stok aman'}
                </span>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-amber-800 shrink-0 pl-2">
              Lihat &rarr;
            </span>
          </div>

          {/* Customer Receivables Alert */}
          {dueReceivables.length > 0 ? (
            <div
              onClick={() => setActiveTab('finance')}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center space-x-2 min-w-0">
                <Wallet className="w-4 h-4 text-slate-600 shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 block truncate">
                    {dueReceivables.length} Piutang Pelanggan (Kasbon)
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    Total: {formatRupiah(dueReceivables.reduce((s, r) => s + r.remainingAmount, 0))}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-teal-700 shrink-0 pl-2">
                Cek &rarr;
              </span>
            </div>
          ) : (
            <div className="p-2 rounded-xl bg-emerald-50/60 border border-emerald-100 text-[11px] text-emerald-800 flex items-center space-x-2">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Tidak ada piutang atau kasbon menunggak hari ini.</span>
            </div>
          )}
        </div>
      </div>

      {/* Share to WhatsApp & Quick Action Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2.5">
        <h3 className="text-xs font-bold text-slate-900">Bagikan Laporan ke WhatsApp</h3>
        <p className="text-[11px] text-slate-500">
          Kirim ringkasan performa penjualan dan kas laci detik ini langsung ke nomor WhatsApp partner/owner.
        </p>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            id="owner-monitor-btn-wa"
            onClick={handleShareToWhatsApp}
            className="flex-1 flex items-center justify-center space-x-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Kirim via WhatsApp</span>
          </button>

          <button
            type="button"
            id="owner-monitor-btn-copy"
            onClick={handleCopyReport}
            className="flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
            title="Salin teks laporan ke clipboard"
          >
            {copiedNotification ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-600" />
                <span>Salin Teks</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
