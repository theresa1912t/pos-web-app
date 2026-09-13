'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Order, DateFilterType, DateRange, SalesChannel } from '@/types';
import { formatRupiah, formatDate, formatTime, isDateInFilter } from '@/lib/utils';
import { SalesChannelBadge } from '@/components/SalesChannelBadge';
import { DateRangeDropdown } from '@/components/DateRangeDropdown';
import { TablePagination } from '@/components/TablePagination';
import {
  Search,
  Calendar,
  Eye,
  ChevronLeft,
  ChevronRight,
  Receipt,
  X,
  RotateCcw,
  Globe,
  Plus,
  Building2,
  ShoppingBag,
} from 'lucide-react';
import { CreateOrderModal } from '@/components/CreateOrderModal';

interface OrdersViewProps {
  selectedOrderForModal?: Order | null;
  onCloseDetailModal?: () => void;
}

export function OrdersView({ selectedOrderForModal, onCloseDetailModal }: OrdersViewProps) {
  const {
    orders,
    cancelOrder,
    resetToDemoData,
    setIsCreateOrderModalOpen,
    hasPermission,
    activeBranchId,
    activeBranch,
    branches,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<SalesChannel | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterType | 'all'>('30days');
  const [customRange, setCustomRange] = useState<DateRange>(() => ({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
  }));

  const [activeSubTab, setActiveSubTab] = useState<'pos' | 'history'>(() => {
    return selectedOrderForModal ? 'history' : 'pos';
  });
  const [activeOrderDetail, setActiveOrderDetail] = useState<Order | null>(selectedOrderForModal || null);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  // Pagination state (Standard 20 rows per page)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        const matchSearch =
          o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (o.externalOrderId && o.externalOrderId.toLowerCase().includes(searchQuery.toLowerCase())) ||
          o.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.items.some((it) => it.productName.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchChannel =
          channelFilter === 'all'
            ? true
            : (o.salesChannel || 'Offline / Kasir') === channelFilter;

        const matchDate =
          dateFilter === 'all'
            ? true
            : isDateInFilter(o.createdAt, dateFilter as DateFilterType, customRange);

        const matchBranch =
          activeBranchId === 'all'
            ? true
            : o.branchId === activeBranchId;

        return matchSearch && matchChannel && matchDate && matchBranch;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, searchQuery, channelFilter, dateFilter, customRange, activeBranchId]);

  // Paginated orders
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage]);

  const handleCancelOrder = async (orderId: string) => {
    const success = await cancelOrder(orderId);
    if (success) {
      setIsCancelConfirmOpen(false);
      const updated = orders.find((o) => o.id === orderId);
      if (updated) {
        setActiveOrderDetail({ ...updated, status: 'Canceled' });
      }
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Sub-Tabs: Terminal Kasir vs Riwayat Penjualan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
          <button
            type="button"
            id="tab-btn-kasir-pos"
            onClick={() => setActiveSubTab('pos')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'pos'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-teal-600" />
            <span>Terminal Transaksi Kasir</span>
          </button>
          <button
            type="button"
            id="tab-btn-kasir-history"
            onClick={() => setActiveSubTab('history')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'history'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Receipt className="w-4 h-4 text-slate-500" />
            <span>Riwayat Penjualan ({filteredOrders.length})</span>
          </button>
        </div>

        {activeSubTab === 'history' && (
          <button
            type="button"
            id="btn-new-order-from-history"
            onClick={() => setActiveSubTab('pos')}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Transaksi Baru</span>
          </button>
        )}
      </div>

      {activeSubTab === 'pos' ? (
        <CreateOrderModal isFullPage={true} onClose={() => setActiveSubTab('history')} />
      ) : (
        <>
          {/* Filter & Search Bar */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="orders-search-input"
            type="text"
            placeholder="Cari ID Pesanan, No Ref, nama produk..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Channel Filter Select */}
          <div className="flex items-center space-x-1.5 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[11px] font-medium text-slate-600">Saluran:</span>
            <select
              value={channelFilter}
              onChange={(e) => {
                setChannelFilter(e.target.value as SalesChannel | 'all');
                setCurrentPage(1);
              }}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Saluran</option>
              <option value="Offline / Kasir">Offline / Kasir</option>
              <option value="Shopee">Shopee</option>
              <option value="Tokopedia">Tokopedia</option>
              <option value="TikTok Shop">TikTok Shop</option>
              <option value="GoFood">GoFood</option>
              <option value="GrabFood">GrabFood</option>
              <option value="ShopeeFood">ShopeeFood</option>
              <option value="Other">Lainnya</option>
            </select>
          </div>

          {/* Date Filter Dropdown */}
          <DateRangeDropdown
            value={dateFilter}
            onChange={(val) => {
              setDateFilter(val);
              setCurrentPage(1);
            }}
            customRange={customRange}
            onCustomRangeChange={setCustomRange}
            includeAllOption={true}
          />

          {/* Quick dummy data reload button */}
          <button
            type="button"
            id="btn-seed-orders-dummy"
            onClick={() => resetToDemoData()}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 text-xs font-medium transition-colors cursor-pointer"
            title="Muat ulang 36+ pesanan contoh dari berbagai saluran (Shopee, Tokopedia, TikTok, GrabFood, Offline)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden sm:inline">Muat Data Dummy (36+ Order)</span>
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-6">Order ID & Saluran</th>
                <th className="py-3.5 px-6">Cabang</th>
                <th className="py-3.5 px-6">Waktu</th>
                <th className="py-3.5 px-6">Item Terjual</th>
                <th className="py-3.5 px-6 text-right">Total & Pembayaran</th>
                <th className="py-3.5 px-6 text-center">Status</th>
                <th className="py-3.5 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-200/60">
                        <Receipt className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-slate-700 font-semibold text-sm">
                          {orders.length === 0 ? 'Belum Ada Transaksi Pesanan' : 'Tidak Ada Transaksi Ditemukan'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {orders.length === 0
                            ? 'Muat data pesanan contoh untuk menguji filter waktu 30 hari, pencarian, saluran penjualan, dan rincian transaksi.'
                            : 'Coba sesuaikan filter saluran atau ubah rentang tanggal dropdown ke rentang yang lebih luas.'}
                        </p>
                      </div>
                      {orders.length === 0 && (
                        <button
                          type="button"
                          onClick={() => resetToDemoData()}
                          className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Muat 36+ Data Pesanan Dummy</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Order ID & Sales Channel */}
                    <td className="py-3.5 px-6">
                      <div className="font-mono font-semibold text-slate-800">{ord.id}</div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <SalesChannelBadge channel={ord.salesChannel || 'Offline / Kasir'} size="sm" />
                        {ord.externalOrderId && (
                          <span className="text-[11px] font-mono text-slate-500">
                            #{ord.externalOrderId}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Branch Name */}
                    <td className="py-3.5 px-6">
                      <div className="flex items-center space-x-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-700">
                          {ord.branchName || branches.find((b) => b.id === ord.branchId)?.name || 'Cabang Pusat'}
                        </span>
                      </div>
                    </td>

                    {/* Date / Time */}
                    <td className="py-3.5 px-6">
                      <div className="font-semibold text-slate-800">{formatDate(ord.createdAt, false)}</div>
                      <div className="text-[10px] text-slate-400">{formatTime(ord.createdAt)}</div>
                    </td>

                    {/* Items */}
                    <td className="py-3.5 px-6">
                      <span className="font-semibold text-slate-800">{ord.items.length} Macam Barang</span>
                      <span className="text-[11px] text-slate-400 block truncate max-w-xs">
                        {ord.items.map((it) => `${it.productName} (x${it.quantity})`).join(', ')}
                      </span>
                    </td>

                    {/* Total & Payment Method */}
                    <td className="py-3.5 px-6 text-right">
                      <div className="font-bold text-slate-900 text-sm">
                        {formatRupiah(ord.total)}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {ord.paymentMethod}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-6 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          ord.status === 'Finished'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {ord.status === 'Finished' ? 'SUKSES' : 'BATAL'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => setActiveOrderDetail(ord)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-teal-700 hover:bg-teal-50 font-semibold transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detail</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Standard 20-row Pagination Bar */}
        <TablePagination
          currentPage={currentPage}
          totalItems={filteredOrders.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          itemName="transaksi pesanan"
        />
      </div>
      </>
      )}

      {/* ORDER DETAIL MODAL */}
      {activeOrderDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Detail Pesanan #{activeOrderDetail.id}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {formatDate(activeOrderDetail.createdAt, true)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveOrderDetail(null);
                  if (onCloseDetailModal) onCloseDetailModal();
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Status Header */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <span className="text-slate-500 font-medium">Status Transaksi:</span>
                <span
                  className={`px-3 py-1 rounded-full font-bold text-[11px] ${
                    activeOrderDetail.status === 'Finished'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {activeOrderDetail.status === 'Finished' ? 'Selesai (Finished)' : 'Dibatalkan (Canceled)'}
                </span>
              </div>

              {/* Sales Channel, Branch & External ID Info */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Cabang Toko:</span>
                  <div className="flex items-center space-x-1.5 font-semibold text-slate-800">
                    <Building2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>
                      {activeOrderDetail.branchName ||
                        branches.find((b) => b.id === activeOrderDetail.branchId)?.name ||
                        'Cabang Pusat'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500 font-medium">Saluran Penjualan:</span>
                  <SalesChannelBadge channel={activeOrderDetail.salesChannel || 'Offline / Kasir'} size="sm" />
                </div>
                {activeOrderDetail.externalOrderId && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-500 font-medium">External Order ID:</span>
                    <span className="font-mono text-slate-800 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                      {activeOrderDetail.externalOrderId}
                    </span>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 font-bold text-slate-700">
                  Rincian Barang
                </div>
                <div className="divide-y divide-slate-100">
                  {activeOrderDetail.items.map((it, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-800">{it.productName}</div>
                        <div className="text-[11px] text-slate-400">
                          {it.quantity} x {formatRupiah(it.sellingPrice)}
                        </div>
                      </div>
                      <div className="font-bold text-slate-900">
                        {formatRupiah(it.subtotal)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Calculations */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Metode Pembayaran:</span>
                  <span className="text-slate-900 font-semibold">{activeOrderDetail.paymentMethod}</span>
                </div>
                {activeOrderDetail.cashTendered && (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Uang Diterima:</span>
                      <span className="text-slate-900 font-medium">{formatRupiah(activeOrderDetail.cashTendered)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Kembalian:</span>
                      <span className="text-teal-700 font-bold">
                        {formatRupiah(activeOrderDetail.changeAmount || 0)}
                      </span>
                    </div>
                  </>
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-800">Total Akhir:</span>
                  <span className="text-base font-bold text-teal-700">
                    {formatRupiah(activeOrderDetail.total)}
                  </span>
                </div>
              </div>

              {/* Cancel Confirmation View */}
              {isCancelConfirmOpen ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-xs">
                  <p className="text-rose-800 font-bold">
                    Yakin ingin membatalkan transaksi ini?
                  </p>
                  <p className="text-rose-700">
                    Membatalkan pesanan akan mengembalikan {activeOrderDetail.items.reduce((s, it) => s + it.quantity, 0)} item ke stok produk dan mengurangi pencatatan pendapatan.
                  </p>
                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      onClick={() => setIsCancelConfirmOpen(false)}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 cursor-pointer shadow-xs"
                    >
                      Tidak
                    </button>
                    <button
                      onClick={() => handleCancelOrder(activeOrderDetail.id)}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg transition-colors cursor-pointer shadow-xs"
                    >
                      Ya, Batalkan Pesanan
                    </button>
                  </div>
                </div>
              ) : (
                activeOrderDetail.status === 'Finished' && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCancelConfirmOpen(true)}
                      className="w-full flex items-center justify-center space-x-1.5 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Batalkan Transaksi (Kembalikan Stok)</span>
                    </button>
                  </div>
                )
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setActiveOrderDetail(null);
                  if (onCloseDetailModal) onCloseDetailModal();
                }}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
