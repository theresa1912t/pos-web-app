'use client';

import React from 'react';
import { CustomerReceivable, SupplierPayable, Order, Revenue, Cost } from '@/types';
import { formatRupiah } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
} from 'lucide-react';

interface FinanceSummaryCardsProps {
  orders: Order[];
  revenues: Revenue[];
  costs: Cost[];
  customerReceivables: CustomerReceivable[];
  supplierPayables: SupplierPayable[];
  onSelectTab?: (tab: 'overview' | 'cash-virtual' | 'receivables' | 'payables' | 'revenues' | 'costs') => void;
}

export function FinanceSummaryCards({
  orders,
  revenues,
  costs,
  customerReceivables,
  supplierPayables,
}: FinanceSummaryCardsProps) {
  // 1. Calculate Total Revenues (Orders + Manual)
  const validOrders = orders.filter((o) => o.status !== 'Canceled');
  const orderTotal = validOrders.reduce((sum, o) => sum + o.total, 0);
  const manualRevenueTotal = revenues.filter((r) => r.source !== 'Order').reduce((sum, r) => sum + r.amount, 0);
  const totalIncome = orderTotal + manualRevenueTotal;

  // 2. Calculate Total Expenses (Costs)
  const totalExpense = costs.reduce((sum, c) => sum + c.amount, 0);

  // 3. Net Profit
  const netProfit = totalIncome - totalExpense;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* 1. Total Pendapatan */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Pendapatan
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-slate-900 mb-1">
          {formatRupiah(totalIncome)}
        </div>
        <p className="text-xs text-slate-500">
          Penjualan kasir & kas masuk manual
        </p>
      </div>

      {/* 2. Total Pengeluaran */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Pengeluaran
          </span>
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-slate-900 mb-1">
          {formatRupiah(totalExpense)}
        </div>
        <p className="text-xs text-slate-500">
          Beban operasional & restock barang
        </p>
      </div>

      {/* 3. Laba Bersih */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Laba Bersih Operasional
          </span>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            netProfit >= 0 ? 'bg-teal-50 text-teal-600' : 'bg-rose-50 text-rose-600'
          }`}>
            <Wallet className="w-5 h-5" />
          </div>
        </div>
        <div className={`text-2xl font-extrabold mb-1 ${
          netProfit >= 0 ? 'text-teal-700' : 'text-rose-700'
        }`}>
          {formatRupiah(netProfit)}
        </div>
        <p className="text-xs text-slate-500">
          Estimasi laba bersih (Pendapatan - Beban)
        </p>
      </div>
    </div>
  );
}
