'use client';

import React, { useState, useMemo } from 'react';
import { Order, Revenue, Cost, Branch } from '@/types';
import { formatRupiah, formatDate } from '@/lib/utils';
import {
  Banknote,
  QrCode,
  ArrowRightLeft,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Search,
  CheckCircle2,
  Calendar,
  Building2,
} from 'lucide-react';

interface CashVsVirtualTabProps {
  orders: Order[];
  revenues: Revenue[];
  costs: Cost[];
  branches: Branch[];
  activeBranchId: string;
}

export function CashVsVirtualTab({
  orders,
  revenues,
  costs,
  branches,
  activeBranchId,
}: CashVsVirtualTabProps) {
  const [filterType, setFilterType] = useState<'all' | 'cash' | 'virtual'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Filter data based on activeBranchId
  const branchOrders = useMemo(() => {
    return orders.filter(
      (o) => o.status !== 'Canceled' && (activeBranchId === 'all' || !o.branchId || o.branchId === activeBranchId)
    );
  }, [orders, activeBranchId]);

  const branchRevenues = useMemo(() => {
    return revenues.filter(
      (r) => activeBranchId === 'all' || !r.branchId || r.branchId === activeBranchId
    );
  }, [revenues, activeBranchId]);

  const branchCosts = useMemo(() => {
    return costs.filter(
      (c) => activeBranchId === 'all' || !c.branchId || c.branchId === activeBranchId
    );
  }, [costs, activeBranchId]);

  // 2. Metrics for Cash (Physical)
  const cashFromOrders = branchOrders
    .filter((o) => o.paymentMethod === 'Cash')
    .reduce((sum, o) => sum + o.total, 0);

  const cashFromRevenues = branchRevenues
    .filter((r) => {
      const text = `${r.description} ${r.notes || ''}`.toLowerCase();
      return !text.includes('transfer') && !text.includes('qris') && !text.includes('virtual') && !text.includes('bank');
    })
    .reduce((sum, r) => sum + r.amount, 0);

  const totalCashIn = cashFromOrders + cashFromRevenues;

  // Cash out (Costs paid via Cash / Petty cash)
  const cashOutCosts = branchCosts
    .filter((c) => {
      const text = `${c.description} ${c.notes || ''}`.toLowerCase();
      return text.includes('petty cash') || text.includes('tunai') || text.includes('kasir') || !text.includes('transfer');
    })
    .reduce((sum, c) => sum + c.amount, 0);

  const netPhysicalCash = totalCashIn - cashOutCosts;

  // 3. Metrics for Virtual (Digital / Transfer / QRIS)
  const qrisOrders = branchOrders.filter((o) => o.paymentMethod === 'QRIS');
  const transferOrders = branchOrders.filter((o) => o.paymentMethod === 'Transfer');

  const qrisFromOrders = qrisOrders.reduce((sum, o) => sum + o.total, 0);
  const transferFromOrders = transferOrders.reduce((sum, o) => sum + o.total, 0);

  const virtualRevenues = branchRevenues
    .filter((r) => {
      const text = `${r.description} ${r.notes || ''}`.toLowerCase();
      return text.includes('transfer') || text.includes('qris') || text.includes('virtual') || text.includes('bank');
    })
    .reduce((sum, r) => sum + r.amount, 0);

  const totalVirtualIn = qrisFromOrders + transferFromOrders + virtualRevenues;

  // Virtual Out (Costs paid via bank transfer)
  const virtualOutCosts = branchCosts
    .filter((c) => {
      const text = `${c.description} ${c.notes || ''}`.toLowerCase();
      return text.includes('transfer') || text.includes('bank') || text.includes('rek');
    })
    .reduce((sum, c) => sum + c.amount, 0);

  const netVirtualCash = totalVirtualIn - virtualOutCosts;

  const totalIncomeAll = totalCashIn + totalVirtualIn;
  const cashPercent = totalIncomeAll > 0 ? Math.round((totalCashIn / totalIncomeAll) * 100) : 0;
  const virtualPercent = totalIncomeAll > 0 ? Math.round((totalVirtualIn / totalIncomeAll) * 100) : 0;

  // 4. Combined Transaction Stream (Unified ledger for cash vs virtual)
  interface LedgerItem {
    id: string;
    date: string;
    type: 'Income' | 'Expense';
    channel: 'Cash' | 'Virtual';
    methodName: string;
    title: string;
    description: string;
    amount: number;
    branchName?: string;
  }

  const ledger = useMemo(() => {
    const list: LedgerItem[] = [];

    // Orders
    branchOrders.forEach((o) => {
      const isCash = o.paymentMethod === 'Cash';
      list.push({
        id: `ord-${o.id}`,
        date: o.createdAt,
        type: 'Income',
        channel: isCash ? 'Cash' : 'Virtual',
        methodName: o.paymentMethod,
        title: `Penjualan POS #${o.id.slice(-6)}`,
        description: o.externalOrderId ? `Pesanan ${o.salesChannel} (${o.externalOrderId})` : `Pelanggan Walk-in (${o.items.length} item)`,
        amount: o.total,
        branchName: o.branchName,
      });
    });

    // Revenues
    branchRevenues.forEach((r) => {
      const text = `${r.description} ${r.notes || ''}`.toLowerCase();
      const isVirtual = text.includes('transfer') || text.includes('qris') || text.includes('virtual') || text.includes('bank');
      list.push({
        id: `rev-${r.id}`,
        date: r.date,
        type: 'Income',
        channel: isVirtual ? 'Virtual' : 'Cash',
        methodName: isVirtual ? (text.includes('qris') ? 'QRIS' : 'Transfer') : 'Tunai',
        title: r.description,
        description: r.notes || (r.source ? `Sumber: ${r.source}` : 'Pemasukan Toko'),
        amount: r.amount,
        branchName: r.branchName,
      });
    });

    // Costs
    branchCosts.forEach((c) => {
      const text = `${c.description} ${c.notes || ''}`.toLowerCase();
      const isVirtual = text.includes('transfer') || text.includes('bank') || text.includes('rek');
      list.push({
        id: `cost-${c.id}`,
        date: c.date,
        type: 'Expense',
        channel: isVirtual ? 'Virtual' : 'Cash',
        methodName: isVirtual ? 'Transfer Bank' : 'Tunai / Petty Cash',
        title: c.description,
        description: `Kategori: ${c.category} ${c.notes ? `(${c.notes})` : ''}`,
        amount: c.amount,
        branchName: c.branchName,
      });
    });

    // Sort descending by date
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return list;
  }, [branchOrders, branchRevenues, branchCosts]);

  // Filtered ledger
  const filteredLedger = useMemo(() => {
    return ledger.filter((item) => {
      const matchesType =
        filterType === 'all' ||
        (filterType === 'cash' && item.channel === 'Cash') ||
        (filterType === 'virtual' && item.channel === 'Virtual');

      const matchesSearch =
        !searchTerm.trim() ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.methodName.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesType && matchesSearch;
    });
  }, [ledger, filterType, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Visual Proportion Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Distribusi Arus Kas Masuk (Tunai Fisik vs Digital Virtual)
            </h3>
            <p className="text-xs text-slate-500">
              Mencegah selisih kas fisik di laci kasir dengan memisahkan pemasukan tunai dan digital
            </p>
          </div>
          <div className="flex items-center space-x-4 text-xs font-semibold">
            <span className="flex items-center text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5" />
              Tunai ({cashPercent}%)
            </span>
            <span className="flex items-center text-blue-700">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-1.5" />
              Virtual ({virtualPercent}%)
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${cashPercent}%` }}
            className="bg-emerald-500 transition-all duration-500"
            title={`Kas Fisik Tunai: ${cashPercent}%`}
          />
          <div
            style={{ width: `${virtualPercent}%` }}
            className="bg-blue-500 transition-all duration-500"
            title={`Kas Virtual: ${virtualPercent}%`}
          />
        </div>
      </div>

      {/* 2 Detailed Columns: Kas Fisik vs Kas Virtual */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kolom Kas Fisik (Tunai) */}
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-xs p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-50 rounded-full -mr-10 -mt-10 pointer-events-none" />
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Kas Fisik (Uang Tunai Laci)</h4>
                <p className="text-[11px] text-emerald-700 font-medium">Uang fisik yang ada di register toko</p>
              </div>
            </div>
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              Fisik
            </span>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600">Penjualan Tunai POS:</span>
              <span className="font-semibold text-slate-900">{formatRupiah(cashFromOrders)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600">Pelunasan Kasbon / Pemasukan Tunai:</span>
              <span className="font-semibold text-slate-900">{formatRupiah(cashFromRevenues)}</span>
            </div>
            <div className="border-t border-slate-100 pt-2 flex justify-between items-center text-xs font-semibold">
              <span className="text-emerald-700">Total Uang Tunai Masuk:</span>
              <span className="text-emerald-700 font-bold">{formatRupiah(totalCashIn)}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-rose-600 font-medium">
              <span>Pengeluaran Kas Tunai / Petty Cash:</span>
              <span>- {formatRupiah(cashOutCosts)}</span>
            </div>
            <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-800">Estimasi Saldo Tunai Bersih:</span>
              <span className="text-base font-extrabold text-emerald-700">
                {formatRupiah(netPhysicalCash)}
              </span>
            </div>
          </div>
        </div>

        {/* Kolom Kas Virtual (Digital) */}
        <div className="bg-white rounded-2xl border border-blue-200 shadow-xs p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-blue-50 rounded-full -mr-10 -mt-10 pointer-events-none" />

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Kas Virtual (QRIS & Bank)</h4>
                <p className="text-[11px] text-blue-700 font-medium">Saldo digital rekening bank & e-wallet merchant</p>
              </div>
            </div>
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              Virtual
            </span>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600">Penerimaan QRIS (Gopay/OVO/Shopee/dll):</span>
              <span className="font-semibold text-slate-900">{formatRupiah(qrisFromOrders)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600">Penerimaan Transfer Bank:</span>
              <span className="font-semibold text-slate-900">{formatRupiah(transferFromOrders)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600">Pemasukan Virtual Lainnya:</span>
              <span className="font-semibold text-slate-900">{formatRupiah(virtualRevenues)}</span>
            </div>
            <div className="border-t border-slate-100 pt-2 flex justify-between items-center text-xs font-semibold">
              <span className="text-blue-700">Total Uang Virtual Masuk:</span>
              <span className="text-blue-700 font-bold">{formatRupiah(totalVirtualIn)}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-rose-600 font-medium">
              <span>Pengeluaran Dibayar via Bank:</span>
              <span>- {formatRupiah(virtualOutCosts)}</span>
            </div>
            <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-800">Estimasi Saldo Virtual Bersih:</span>
              <span className="text-base font-extrabold text-blue-700">
                {formatRupiah(netVirtualCash)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Stream Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Controls */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Semua Arus ({ledger.length})
            </button>
            <button
              onClick={() => setFilterType('cash')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer ${
                filterType === 'cash'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>Hanya Kas Tunai</span>
            </button>
            <button
              onClick={() => setFilterType('virtual')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer ${
                filterType === 'virtual'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Hanya Kas Virtual</span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari transaksi atau metode..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/75">
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Kategori Saldo</th>
                <th className="py-3 px-4">Metode Bayar</th>
                <th className="py-3 px-4">Keterangan Transaksi</th>
                <th className="py-3 px-4 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Tidak ada catatan arus kas yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredLedger.map((item) => {
                  const isIncome = item.type === 'Income';
                  const isCash = item.channel === 'Cash';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {formatDate(item.date)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isCash ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Banknote className="w-3 h-3 mr-1" />
                            Kas Fisik (Laci)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <QrCode className="w-3 h-3 mr-1" />
                            Kas Virtual (Bank/QR)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                        {item.methodName}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{item.title}</div>
                        <div className="text-[11px] text-slate-500">{item.description}</div>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span
                          className={`font-bold ${
                            isIncome ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isIncome ? '+' : '-'} {formatRupiah(item.amount)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
