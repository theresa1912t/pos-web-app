'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { DateFilterType, DateRange, CostCategory, Branch } from '@/types';
import { formatRupiah, formatDate, isDateInFilter } from '@/lib/utils';
import { SalesChannelBadge } from '@/components/SalesChannelBadge';
import { DateRangeDropdown } from '@/components/DateRangeDropdown';
import { TablePagination } from '@/components/TablePagination';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Calendar,
  X,
  RotateCcw,
  Building2,
  Receipt,
  Vault,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export function FinanceView() {
  const {
    revenues,
    costs,
    orders,
    addRevenue,
    addCost,
    resetToDemoData,
    branches,
    activeBranchId,
    activeBranch,
    accessibleBranches,
    canSwitchToAllBranches,
    cashierShifts,
    activeShift,
    openShiftModal,
    setSelectedShiftForZReport,
  } = useApp();

  // Date filter state - default to 30 days
  const [dateFilter, setDateFilter] = useState<DateFilterType>('30days');
  const [customRange, setCustomRange] = useState<DateRange>(() => ({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
  }));

  // Pagination state (Standard 20 rows per page)
  const [revenuePage, setRevenuePage] = useState(1);
  const [costPage, setCostPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Active view tab in Finance: 'overview' | 'revenues' | 'costs' | 'shifts'
  const [activeFinanceTab, setActiveFinanceTab] = useState<'overview' | 'revenues' | 'costs' | 'shifts'>('overview');

  // Modals
  const [isAddRevenueOpen, setIsAddRevenueOpen] = useState(false);
  const [isAddCostOpen, setIsAddCostOpen] = useState(false);

  // Filtered revenues & costs (filtered by Date AND Active Branch)
  const filteredShifts = useMemo(() => {
    return cashierShifts
      .filter((s) => {
        const dateStr = s.startTime.slice(0, 10);
        const matchDate = isDateInFilter(dateStr, dateFilter, customRange);
        const matchBranch = activeBranchId === 'all' || s.branchId === activeBranchId;
        return matchDate && matchBranch;
      })
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [cashierShifts, dateFilter, customRange, activeBranchId]);

  const filteredRevenues = useMemo(() => {
    return revenues
      .filter((r) => {
        const matchDate = isDateInFilter(r.date, dateFilter, customRange);
        const matchBranch = activeBranchId === 'all' || r.branchId === activeBranchId;
        return matchDate && matchBranch;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [revenues, dateFilter, customRange, activeBranchId]);

  const filteredCosts = useMemo(() => {
    return costs
      .filter((c) => {
        const matchDate = isDateInFilter(c.date, dateFilter, customRange);
        const matchBranch = activeBranchId === 'all' || c.branchId === activeBranchId;
        return matchDate && matchBranch;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [costs, dateFilter, customRange, activeBranchId]);

  // Totals
  const totalRevenue = useMemo(() => {
    return filteredRevenues.reduce((sum, r) => sum + r.amount, 0);
  }, [filteredRevenues]);

  const totalCost = useMemo(() => {
    return filteredCosts.reduce((sum, c) => sum + c.amount, 0);
  }, [filteredCosts]);

  const estimatedProfit = totalRevenue - totalCost;

  // Paged items (Standard max 20 rows per page)
  const pagedRevenues = useMemo(() => {
    const start = (revenuePage - 1) * ITEMS_PER_PAGE;
    return filteredRevenues.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRevenues, revenuePage]);

  const pagedCosts = useMemo(() => {
    const start = (costPage - 1) * ITEMS_PER_PAGE;
    return filteredCosts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCosts, costPage]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Date Filter & Quick Actions (Container removed, moved to left) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center flex-wrap gap-2">
          {/* Date Range Dropdown moved to left */}
          <DateRangeDropdown
            value={dateFilter}
            onChange={(val) => {
              setDateFilter(val as DateFilterType);
              setRevenuePage(1);
              setCostPage(1);
            }}
            customRange={customRange}
            onCustomRangeChange={(range) => {
              setCustomRange(range);
              setRevenuePage(1);
              setCostPage(1);
            }}
          />

          {/* Quick dummy data reload button */}
          <button
            type="button"
            id="btn-seed-finance-dummy"
            onClick={() => resetToDemoData()}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            title="Muat ulang data dummy keuangan & transaksi 30 hari (36+ order, 10 restock, 10 biaya operasional)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden sm:inline">Muat Data Dummy Keuangan</span>
          </button>
        </div>
      </div>

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
          <button
            onClick={() => setActiveFinanceTab('shifts')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeFinanceTab === 'shifts'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Vault className="w-3.5 h-3.5" />
            <span>Tutup Kasir / Shift ({filteredShifts.length})</span>
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
                  <th className="py-3 px-4">Cabang</th>
                  <th className="py-3 px-4">Saluran Penjualan</th>
                  <th className="py-3 px-4">Sumber</th>
                  <th className="py-3 px-4 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRevenues.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Belum ada pemasukan tercatat pada periode ini.
                    </td>
                  </tr>
                ) : (
                  pagedRevenues.map((rev) => {
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
                          <span className="inline-flex items-center space-x-1 font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span>{rev.branchName || branches.find((b) => b.id === rev.branchId)?.name || 'Cabang Pusat'}</span>
                          </span>
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

          {/* Standard 20-row Pagination */}
          <TablePagination
            currentPage={revenuePage}
            totalItems={filteredRevenues.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setRevenuePage}
            itemName="transaksi pemasukan"
            className="-mx-6 -mb-6 rounded-b-2xl"
          />
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
                  <th className="py-3 px-4">Cabang</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Sumber</th>
                  <th className="py-3 px-4 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCosts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Belum ada biaya pengeluaran tercatat pada periode ini.
                    </td>
                  </tr>
                ) : (
                  pagedCosts.map((cost) => (
                    <tr key={cost.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 text-slate-500">{formatDate(cost.date, true)}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{cost.description}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center space-x-1 font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{cost.branchName || branches.find((b) => b.id === cost.branchId)?.name || 'Cabang Pusat'}</span>
                        </span>
                      </td>
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

          {/* Standard 20-row Pagination */}
          <TablePagination
            currentPage={costPage}
            totalItems={filteredCosts.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCostPage}
            itemName="pos biaya"
            className="-mx-6 -mb-6 rounded-b-2xl"
          />
        </div>
      )}

      {/* SECTION: CASHIER SHIFTS & Z-REPORT SETTLEMENTS */}
      {activeFinanceTab === 'shifts' && (
        <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Riwayat Shift Kasir & Tutup Buku Harian (Z-Report)
              </h3>
              <p className="text-xs text-slate-500">
                Pencatatan modal kas awal, omzet tunai per kasir, arus kas keluar, dan rekonsiliasi selisih uang fisik
              </p>
            </div>
            <button
              type="button"
              onClick={() => openShiftModal(activeBranchId !== 'all' ? activeBranchId : undefined)}
              className="self-start sm:self-auto flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
            >
              <Vault className="w-3.5 h-3.5" />
              <span>Buka / Kelola Shift Kasir</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">No. Shift</th>
                  <th className="py-3 px-4">Cabang</th>
                  <th className="py-3 px-4">Kasir</th>
                  <th className="py-3 px-4">Waktu Buka / Tutup</th>
                  <th className="py-3 px-4 text-right">Modal Awal</th>
                  <th className="py-3 px-4 text-right">Penjualan Tunai</th>
                  <th className="py-3 px-4 text-right">Kas Sistem</th>
                  <th className="py-3 px-4 text-right">Kas Fisik</th>
                  <th className="py-3 px-4 text-center">Status / Selisih</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredShifts.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      Tidak ada data shift kasir pada rentang waktu dan filter cabang ini.
                    </td>
                  </tr>
                ) : (
                  filteredShifts.map((shift) => {
                    const diff = shift.difference ?? (shift.actualEndingCash ? shift.actualEndingCash - shift.expectedEndingCash : 0);
                    const isClosed = shift.status === 'Closed';
                    const isKlop = isClosed && Math.abs(diff) < 1;
                    return (
                      <tr key={shift.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                          {shift.shiftNumber}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {shift.branchName || 'Cabang'}
                        </td>
                        <td className="py-3 px-4 text-slate-900 font-medium">
                          {shift.cashierName}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          <div>Buka: {new Date(shift.startTime).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</div>
                          {shift.endTime && (
                            <div>Tutup: {new Date(shift.endTime).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700">
                          {formatRupiah(shift.startingCash)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-600 font-semibold">
                          +{formatRupiah(shift.cashSalesTotal)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-900 font-bold">
                          {formatRupiah(shift.expectedEndingCash)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-900">
                          {shift.actualEndingCash !== undefined ? formatRupiah(shift.actualEndingCash) : '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {!isClosed ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ● Berjalan
                            </span>
                          ) : isKlop ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Klop (Rp 0)
                            </span>
                          ) : diff > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                              +{formatRupiah(diff)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              -{formatRupiah(Math.abs(diff))}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedShiftForZReport(shift)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                            title="Lihat Struk Z-Report"
                          >
                            <Receipt className="w-3.5 h-3.5 text-teal-600" />
                            <span>Struk Z</span>
                          </button>
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

      {/* MODAL: ADD MANUAL REVENUE */}
      {isAddRevenueOpen && (
        <AddRevenueModal
          branches={branches}
          activeBranchId={activeBranchId}
          accessibleBranches={accessibleBranches}
          canSwitchToAllBranches={canSwitchToAllBranches}
          onClose={() => setIsAddRevenueOpen(false)}
          onSave={async (amount, desc, date, notes, branchId) => {
            await addRevenue(amount, desc, date, notes, branchId);
            setIsAddRevenueOpen(false);
          }}
        />
      )}

      {/* MODAL: ADD MANUAL COST */}
      {isAddCostOpen && (
        <AddCostModal
          branches={branches}
          activeBranchId={activeBranchId}
          accessibleBranches={accessibleBranches}
          canSwitchToAllBranches={canSwitchToAllBranches}
          onClose={() => setIsAddCostOpen(false)}
          onSave={async (amount, cat, desc, date, notes, branchId) => {
            await addCost(amount, cat, desc, date, notes, branchId);
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
  branches,
  activeBranchId,
  accessibleBranches,
  canSwitchToAllBranches,
  onClose,
  onSave,
}: {
  branches: Branch[];
  activeBranchId: string;
  accessibleBranches: Branch[];
  canSwitchToAllBranches: boolean;
  onClose: () => void;
  onSave: (amount: number, desc: string, date: string, notes?: string, branchId?: string) => void;
}) {
  const defaultBranchId = activeBranchId !== 'all'
    ? activeBranchId
    : (accessibleBranches.find((b) => b.status === 'Active')?.id || accessibleBranches[0]?.id || branches[0]?.id || 'branch-1');

  const [selectedBranchId, setSelectedBranchId] = useState<string>(defaultBranchId);
  const selectedBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];

  const [amount, setAmount] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount === '' || amount <= 0 || !description.trim()) return;
    onSave(Number(amount), description.trim(), date, notes.trim(), selectedBranchId);
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
          {/* Branch Selection */}
          <div>
            <label className="block text-slate-600 font-medium mb-1">
              Cabang <span className="text-teal-600">*</span>
            </label>
            {canSwitchToAllBranches ? (
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
              >
                {accessibleBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code}){b.status === 'Inactive' ? ' - Nonaktif' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center space-x-2 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800">
                <Building2 className="w-4 h-4 text-teal-600" />
                <span>{selectedBranch?.name} ({selectedBranch?.code})</span>
              </div>
            )}
          </div>

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
  branches,
  activeBranchId,
  accessibleBranches,
  canSwitchToAllBranches,
  onClose,
  onSave,
}: {
  branches: Branch[];
  activeBranchId: string;
  accessibleBranches: Branch[];
  canSwitchToAllBranches: boolean;
  onClose: () => void;
  onSave: (amount: number, cat: CostCategory, desc: string, date: string, notes?: string, branchId?: string) => void;
}) {
  const defaultBranchId = activeBranchId !== 'all'
    ? activeBranchId
    : (accessibleBranches.find((b) => b.status === 'Active')?.id || accessibleBranches[0]?.id || branches[0]?.id || 'branch-1');

  const [selectedBranchId, setSelectedBranchId] = useState<string>(defaultBranchId);
  const selectedBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];

  const [amount, setAmount] = useState<number | ''>('');
  const [category, setCategory] = useState<CostCategory>('Electricity');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount === '' || amount <= 0 || !description.trim()) return;
    onSave(Number(amount), category, description.trim(), date, notes.trim(), selectedBranchId);
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
          {/* Branch Selection */}
          <div>
            <label className="block text-slate-600 font-medium mb-1">
              Cabang <span className="text-teal-600">*</span>
            </label>
            {canSwitchToAllBranches ? (
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
              >
                {accessibleBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code}){b.status === 'Inactive' ? ' - Nonaktif' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center space-x-2 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800">
                <Building2 className="w-4 h-4 text-teal-600" />
                <span>{selectedBranch?.name} ({selectedBranch?.code})</span>
              </div>
            )}
          </div>

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
