'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { DateFilterType, DateRange, CostCategory } from '@/types';
import { formatRupiah, formatDate, isDateInFilter } from '@/lib/utils';
import { SalesChannelBadge } from '@/components/SalesChannelBadge';
import { DateRangeDropdown } from '@/components/DateRangeDropdown';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Calendar,
  X,
} from 'lucide-react';

export function FinanceView() {
  const {
    revenues,
    costs,
    orders,
    addRevenue,
    addCost,
  } = useApp();

  // Date filter state - default to 30 days
  const [dateFilter, setDateFilter] = useState<DateFilterType>('30days');
  const [customRange, setCustomRange] = useState<DateRange>(() => ({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
  }));

  // Active view tab in Finance: 'overview' | 'revenues' | 'costs'
  const [activeFinanceTab, setActiveFinanceTab] = useState<'overview' | 'revenues' | 'costs'>('overview');

  // Modals
  const [isAddRevenueOpen, setIsAddRevenueOpen] = useState(false);
  const [isAddCostOpen, setIsAddCostOpen] = useState(false);

  // Filtered revenues & costs
  const filteredRevenues = useMemo(() => {
    return revenues
      .filter((r) => isDateInFilter(r.date, dateFilter, customRange))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [revenues, dateFilter, customRange]);

  const filteredCosts = useMemo(() => {
    return costs
      .filter((c) => isDateInFilter(c.date, dateFilter, customRange))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [costs, dateFilter, customRange]);

  // Totals
  const totalRevenue = useMemo(() => {
    return filteredRevenues.reduce((sum, r) => sum + r.amount, 0);
  }, [filteredRevenues]);

  const totalCost = useMemo(() => {
    return filteredCosts.reduce((sum, c) => sum + c.amount, 0);
  }, [filteredCosts]);

  const estimatedProfit = totalRevenue - totalCost;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner with Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Keuangan & Laba Bersih</h2>
            <p className="text-xs text-slate-500">
              Arus kas masuk (penjualan), kas keluar (restock/operasional), dan laba warung
            </p>
          </div>
        </div>

        {/* Date Range Dropdown */}
        <DateRangeDropdown
          value={dateFilter}
          onChange={(val) => setDateFilter(val as DateFilterType)}
          customRange={customRange}
          onCustomRangeChange={setCustomRange}
        />
      </div>

      {/* FINANCE SUMMARY CARDS (REVENUE, COST, ESTIMATED PROFIT) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Revenue */}
        <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Pendapatan</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatRupiah(totalRevenue)}
          </div>
          <p className="text-[11px] text-slate-500">
            {filteredRevenues.length} transaksi pemasukan
          </p>
        </div>

        {/* Total Cost */}
        <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Biaya</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatRupiah(totalCost)}
          </div>
          <p className="text-[11px] text-slate-500">
            {filteredCosts.length} pos pengeluaran & restock
          </p>
        </div>

        {/* Estimated Profit */}
        <div className="p-6 bg-teal-50/50 border border-teal-200 rounded-2xl space-y-2 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
              Estimasi Laba Bersih
            </span>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-teal-100 text-teal-800 border border-teal-200">
              Pendapatan - Biaya
            </span>
          </div>
          <div className="text-2xl font-bold text-teal-900">
            {formatRupiah(estimatedProfit)}
          </div>
          <div className="text-[11px] text-teal-700 font-medium flex items-center gap-1.5">
            <span>{formatRupiah(totalRevenue)}</span>
            <span>-</span>
            <span>{formatRupiah(totalCost)}</span>
          </div>
        </div>
      </div>

      {/* TABS FOR SUB-LISTS & ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveFinanceTab('overview')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeFinanceTab === 'overview'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Semua Arus Kas
          </button>
          <button
            onClick={() => setActiveFinanceTab('revenues')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeFinanceTab === 'revenues'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Daftar Pendapatan ({filteredRevenues.length})
          </button>
          <button
            onClick={() => setActiveFinanceTab('costs')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeFinanceTab === 'costs'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Daftar Biaya ({filteredCosts.length})
          </button>
        </div>

        {/* Quick Add Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsAddRevenueOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Catat Pendapatan</span>
          </button>
          <button
            onClick={() => setIsAddCostOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Catat Biaya</span>
          </button>
        </div>
      </div>

      {/* SECTION: REVENUE LIST */}
      {(activeFinanceTab === 'overview' || activeFinanceTab === 'revenues') && (
        <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Daftar Pendapatan (Kas Masuk)</h3>
              <p className="text-xs text-slate-500">
                Penjualan dari pesanan kasir tercatat otomatis di sini
              </p>
            </div>
            <span className="text-xs font-bold text-teal-700">
              Subtotal: {formatRupiah(totalRevenue)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Deskripsi</th>
                  <th className="py-3 px-4">Saluran Penjualan</th>
                  <th className="py-3 px-4">Sumber</th>
                  <th className="py-3 px-4 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRevenues.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Belum ada pemasukan tercatat pada periode ini.
                    </td>
                  </tr>
                ) : (
                  filteredRevenues.map((rev) => {
                    const relatedOrder = rev.orderId ? orders.find((o) => o.id === rev.orderId) : null;
                    return (
                      <tr key={rev.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 text-slate-500">{formatDate(rev.date, true)}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{rev.description}</div>
                          {relatedOrder?.externalOrderId && (
                            <div className="text-[10px] text-teal-700 font-mono mt-0.5">
                              Ref: {relatedOrder.externalOrderId}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {rev.source === 'Order' ? (
                            <SalesChannelBadge channel={relatedOrder?.salesChannel || 'Offline / Kasir'} size="sm" />
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                              rev.source === 'Order'
                                ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {rev.source === 'Order' ? 'Sistem Kasir' : 'Manual'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600">
                          +{formatRupiah(rev.amount)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION: COST LIST */}
      {(activeFinanceTab === 'overview' || activeFinanceTab === 'costs') && (
        <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Daftar Biaya & Pengeluaran (Kas Keluar)</h3>
              <p className="text-xs text-slate-500">
                Pembelian stok restock dan biaya operasional warung
              </p>
            </div>
            <span className="text-xs font-bold text-slate-800">
              Subtotal: {formatRupiah(totalCost)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Deskripsi</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Sumber</th>
                  <th className="py-3 px-4 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCosts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Belum ada biaya pengeluaran tercatat pada periode ini.
                    </td>
                  </tr>
                ) : (
                  filteredCosts.map((cost) => (
                    <tr key={cost.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 text-slate-500">{formatDate(cost.date, true)}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{cost.description}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700">
                          {cost.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                            cost.source === 'Restock'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {cost.source === 'Restock' ? 'Restock Otomatis' : 'Manual'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-rose-600">
                        -{formatRupiah(cost.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD MANUAL REVENUE */}
      {isAddRevenueOpen && (
        <AddRevenueModal
          onClose={() => setIsAddRevenueOpen(false)}
          onSave={async (amount, desc, date, notes) => {
            await addRevenue(amount, desc, date, notes);
            setIsAddRevenueOpen(false);
          }}
        />
      )}

      {/* MODAL: ADD MANUAL COST */}
      {isAddCostOpen && (
        <AddCostModal
          onClose={() => setIsAddCostOpen(false)}
          onSave={async (amount, cat, desc, date, notes) => {
            await addCost(amount, cat, desc, date, notes);
            setIsAddCostOpen(false);
          }}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------
// ADD MANUAL REVENUE MODAL
// ----------------------------------------------------
function AddRevenueModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (amount: number, desc: string, date: string, notes?: string) => void;
}) {
  const [amount, setAmount] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount === '' || amount <= 0 || !description.trim()) return;
    onSave(Number(amount), description.trim(), date, notes.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-sm font-bold text-slate-900">Catat Pendapatan Manual</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-600 font-medium mb-1">
              Jumlah Pemasukan (Rp) <span className="text-teal-600">*</span>
            </label>
            <input
              type="number"
              placeholder="Contoh: 100000"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))
              }
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">
              Deskripsi Pemasukan <span className="text-teal-600">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Pendapatan titipan barang, jasa kurir"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">Tanggal</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">Catatan Tambahan (Opsional)</label>
            <input
              type="text"
              placeholder="Catatan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl font-semibold shadow-sm shadow-teal-600/20 cursor-pointer transition-all"
            >
              Simpan Pendapatan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// ADD MANUAL COST MODAL
// ----------------------------------------------------
function AddCostModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (amount: number, cat: CostCategory, desc: string, date: string, notes?: string) => void;
}) {
  const [amount, setAmount] = useState<number | ''>('');
  const [category, setCategory] = useState<CostCategory>('Electricity');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount === '' || amount <= 0 || !description.trim()) return;
    onSave(Number(amount), category, description.trim(), date, notes.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-sm font-bold text-slate-900">Catat Biaya Pengeluaran</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-600 font-medium mb-1">
              Jumlah Pengeluaran (Rp) <span className="text-teal-600">*</span>
            </label>
            <input
              type="number"
              placeholder="Contoh: 50000"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))
              }
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">
              Kategori Biaya <span className="text-teal-600">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CostCategory)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
            >
              <option value="Restock">Restock Barang</option>
              <option value="Rent">Sewa Tempat</option>
              <option value="Electricity">Listrik & Air (PLN/PAM)</option>
              <option value="Packaging">Plastik & Kemasan (Kresek/Es)</option>
              <option value="Delivery">Ongkos Kirim / Bensin</option>
              <option value="Equipment">Peralatan Warung</option>
              <option value="Other">Lainnya</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">
              Deskripsi Pengeluaran <span className="text-teal-600">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Beli token listrik, kantong plastik"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">Tanggal</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">Catatan Tambahan (Opsional)</label>
            <input
              type="text"
              placeholder="Catatan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl font-semibold shadow-sm shadow-teal-600/20 cursor-pointer transition-all"
            >
              Simpan Biaya
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
