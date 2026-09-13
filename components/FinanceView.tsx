'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { DateFilterType, DateRange, CostCategory, Branch, CustomerReceivable, SupplierPayable } from '@/types';
import { formatRupiah, formatDate, isDateInFilter } from '@/lib/utils';
import { SalesChannelBadge } from '@/components/SalesChannelBadge';
import { DateRangeDropdown } from '@/components/DateRangeDropdown';
import { TablePagination } from '@/components/TablePagination';
import { FinanceSummaryCards } from '@/components/finance/FinanceSummaryCards';
import { CashVsVirtualTab } from '@/components/finance/CashVsVirtualTab';
import { ReceivablesTab } from '@/components/finance/ReceivablesTab';
import { PayablesTab } from '@/components/finance/PayablesTab';
import { AddReceivableModal } from '@/components/finance/AddReceivableModal';
import { RecordReceivablePaymentModal } from '@/components/finance/RecordReceivablePaymentModal';
import { AddPayableModal } from '@/components/finance/AddPayableModal';
import { RecordPayablePaymentModal } from '@/components/finance/RecordPayablePaymentModal';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ChevronDown,
  Calendar,
  X,
  RotateCcw,
  Building2,
  Receipt,
  Vault,
  CheckCircle2,
  AlertCircle,
  Banknote,
  QrCode,
  UserCheck,
  Truck,
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
    customerReceivables,
    addCustomerReceivable,
    recordReceivablePayment,
    deleteCustomerReceivable,
    supplierPayables,
    addSupplierPayable,
    recordPayablePayment,
    deleteSupplierPayable,
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

  // Active view tab in Finance
  const [activeFinanceTab, setActiveFinanceTab] = useState<
    'overview' | 'cash-virtual' | 'receivables' | 'payables' | 'revenues' | 'costs' | 'shifts'
  >('overview');

  // Modals
  const [isAddRevenueOpen, setIsAddRevenueOpen] = useState(false);
  const [isAddCostOpen, setIsAddCostOpen] = useState(false);
  const [isAddReceivableOpen, setIsAddReceivableOpen] = useState(false);
  const [selectedReceivableForPayment, setSelectedReceivableForPayment] = useState<CustomerReceivable | null>(null);
  const [isAddPayableOpen, setIsAddPayableOpen] = useState(false);
  const [selectedPayableForPayment, setSelectedPayableForPayment] = useState<SupplierPayable | null>(null);
  const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);

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

      {/* Executive Summary Metric Cards (Pendapatan, Biaya, Laba Bersih) */}
      <FinanceSummaryCards
        orders={orders}
        revenues={revenues}
        costs={costs}
        customerReceivables={customerReceivables}
        supplierPayables={supplierPayables}
      />

      {/* TABS FOR SUB-LISTS & ACTION BUTTONS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center flex-wrap gap-1.5">
          <button
            onClick={() => setActiveFinanceTab('overview')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeFinanceTab === 'overview'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Semua Arus Kas
          </button>
          <button
            onClick={() => setActiveFinanceTab('cash-virtual')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeFinanceTab === 'cash-virtual'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Kas Fisik vs Virtual
          </button>
          <button
            onClick={() => setActiveFinanceTab('receivables')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeFinanceTab === 'receivables'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Piutang Pelanggan</span>
            {customerReceivables.filter((r) => r.status !== 'Paid').length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeFinanceTab === 'receivables' ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {customerReceivables.filter((r) => r.status !== 'Paid').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveFinanceTab('payables')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeFinanceTab === 'payables'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Hutang Supplier</span>
            {supplierPayables.filter((p) => p.status !== 'Paid').length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeFinanceTab === 'payables' ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {supplierPayables.filter((p) => p.status !== 'Paid').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveFinanceTab('revenues')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeFinanceTab === 'revenues'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Daftar Pendapatan ({filteredRevenues.length})
          </button>
          <button
            onClick={() => setActiveFinanceTab('costs')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeFinanceTab === 'costs'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Daftar Biaya ({filteredCosts.length})
          </button>
          <button
            onClick={() => setActiveFinanceTab('shifts')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeFinanceTab === 'shifts'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Tutup Kasir / Shift ({filteredShifts.length})
          </button>
        </div>

        {/* Contextual Action Button based on Active Tab - CONSISTENT BRAND TEAL */}
        <div className="flex items-center shrink-0">
          {activeFinanceTab === 'receivables' && (
            <button
              onClick={() => setIsAddReceivableOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Catat Bon Pelanggan</span>
            </button>
          )}

          {activeFinanceTab === 'payables' && (
            <button
              onClick={() => setIsAddPayableOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Catat Hutang Supplier</span>
            </button>
          )}

          {activeFinanceTab === 'revenues' && (
            <button
              onClick={() => setIsAddRevenueOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Catat Pendapatan</span>
            </button>
          )}

          {activeFinanceTab === 'costs' && (
            <button
              onClick={() => setIsAddCostOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Catat Biaya</span>
            </button>
          )}

          {activeFinanceTab === 'shifts' && (
            <button
              onClick={() => openShiftModal()}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buka / Tutup Shift</span>
            </button>
          )}

          {(activeFinanceTab === 'overview' || activeFinanceTab === 'cash-virtual') && (
            <div className="relative">
              <button
                onClick={() => setIsActionDropdownOpen(!isActionDropdownOpen)}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Catat Transaksi</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isActionDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isActionDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setIsActionDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                    <button
                      onClick={() => {
                        setIsActionDropdownOpen(false);
                        setIsAddRevenueOpen(true);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                    >
                      <span className="font-semibold">Catat Pendapatan</span>
                      <span className="text-[10px] text-teal-600 font-semibold bg-teal-50 px-1.5 py-0.5 rounded">Kas Masuk</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsActionDropdownOpen(false);
                        setIsAddCostOpen(true);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                    >
                      <span className="font-semibold">Catat Biaya</span>
                      <span className="text-[10px] text-slate-600 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">Beban Toko</span>
                    </button>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      onClick={() => {
                        setIsActionDropdownOpen(false);
                        setIsAddReceivableOpen(true);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                    >
                      <span className="font-semibold">Catat Bon Pelanggan</span>
                      <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">Piutang</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsActionDropdownOpen(false);
                        setIsAddPayableOpen(true);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                    >
                      <span className="font-semibold">Catat Hutang Supplier</span>
                      <span className="text-[10px] text-rose-700 font-semibold bg-rose-50 px-1.5 py-0.5 rounded">Tempo</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
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
                          <span className="inline-flex items-center space-x-1 font-medium text-slate-600 text-xs">
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
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
                          <span className="text-xs font-normal text-slate-600">
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
                        <span className="inline-flex items-center space-x-1 font-medium text-slate-600 text-xs">
                          <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{cost.branchName || branches.find((b) => b.id === cost.branchId)?.name || 'Cabang Pusat'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {cost.category}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-normal text-slate-600">
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
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Riwayat Shift Kasir & Tutup Buku Harian (Z-Report)
            </h3>
            <p className="text-xs text-slate-500">
              Pencatatan modal kas awal, omzet tunai per kasir, arus kas keluar, dan rekonsiliasi selisih uang fisik
            </p>
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

      {/* SECTION: CASH VS VIRTUAL (QRIS / BANK TRANSFER) */}
      {activeFinanceTab === 'cash-virtual' && (
        <CashVsVirtualTab
          orders={orders}
          revenues={revenues}
          costs={costs}
          branches={branches}
          activeBranchId={activeBranchId}
        />
      )}

      {/* SECTION: CUSTOMER RECEIVABLES (PIUTANG & KASBON) */}
      {activeFinanceTab === 'receivables' && (
        <ReceivablesTab
          receivables={customerReceivables}
          branches={branches}
          activeBranchId={activeBranchId}
          onOpenAddModal={() => setIsAddReceivableOpen(true)}
          onOpenPaymentModal={(rec) => setSelectedReceivableForPayment(rec)}
          onDeleteReceivable={deleteCustomerReceivable}
        />
      )}

      {/* SECTION: SUPPLIER PAYABLES (HUTANG USAHA & KULAKAN) */}
      {activeFinanceTab === 'payables' && (
        <PayablesTab
          payables={supplierPayables}
          branches={branches}
          activeBranchId={activeBranchId}
          onOpenAddModal={() => setIsAddPayableOpen(true)}
          onOpenPaymentModal={(pay) => setSelectedPayableForPayment(pay)}
          onDeletePayable={deleteSupplierPayable}
        />
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

      {/* MODAL: ADD CUSTOMER RECEIVABLE */}
      <AddReceivableModal
        isOpen={isAddReceivableOpen}
        branches={branches}
        activeBranchId={activeBranchId}
        onClose={() => setIsAddReceivableOpen(false)}
        onAdd={async (data) => {
          await addCustomerReceivable(data);
          setIsAddReceivableOpen(false);
        }}
      />

      {/* MODAL: RECORD RECEIVABLE PAYMENT */}
      <RecordReceivablePaymentModal
        isOpen={Boolean(selectedReceivableForPayment)}
        receivable={selectedReceivableForPayment}
        onClose={() => setSelectedReceivableForPayment(null)}
        onRecordPayment={async (receivableId, amount, paymentMethod, notes) => {
          await recordReceivablePayment(receivableId, amount, paymentMethod, notes);
          setSelectedReceivableForPayment(null);
        }}
      />

      {/* MODAL: ADD SUPPLIER PAYABLE */}
      <AddPayableModal
        isOpen={isAddPayableOpen}
        branches={branches}
        activeBranchId={activeBranchId}
        onClose={() => setIsAddPayableOpen(false)}
        onAdd={async (data) => {
          await addSupplierPayable(data);
          setIsAddPayableOpen(false);
        }}
      />

      {/* MODAL: RECORD PAYABLE PAYMENT */}
      <RecordPayablePaymentModal
        isOpen={Boolean(selectedPayableForPayment)}
        payable={selectedPayableForPayment}
        onClose={() => setSelectedPayableForPayment(null)}
        onRecordPayment={async (payableId, amount, paymentMethod, notes) => {
          await recordPayablePayment(payableId, amount, paymentMethod, notes);
          setSelectedPayableForPayment(null);
        }}
      />
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
