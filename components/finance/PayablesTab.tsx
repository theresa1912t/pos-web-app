'use client';

import React, { useState, useMemo } from 'react';
import { SupplierPayable, Branch } from '@/types';
import { formatRupiah, formatDate } from '@/lib/utils';
import {
  Truck,
  Search,
  AlertCircle,
  Clock,
  CheckCircle2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Phone,
  ArrowRightLeft,
  Calendar,
  Hash,
} from 'lucide-react';

interface PayablesTabProps {
  payables: SupplierPayable[];
  branches: Branch[];
  activeBranchId: string;
  onOpenAddModal: () => void;
  onOpenPaymentModal: (payable: SupplierPayable) => void;
  onDeletePayable: (id: string) => Promise<void>;
}

export function PayablesTab({
  payables,
  branches,
  activeBranchId,
  onOpenAddModal,
  onOpenPaymentModal,
  onDeletePayable,
}: PayablesTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Unpaid' | 'Partial' | 'Paid' | 'overdue'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  // Filter based on branch
  const branchPayables = useMemo(() => {
    return payables.filter(
      (p) => activeBranchId === 'all' || !p.branchId || p.branchId === activeBranchId
    );
  }, [payables, activeBranchId]);

  // Summary Metrics
  const totalUnpaidAmount = branchPayables
    .filter((p) => p.status !== 'Paid')
    .reduce((sum, p) => sum + p.remainingAmount, 0);

  const totalPaidAmount = branchPayables.reduce((sum, p) => sum + p.paidAmount, 0);

  const activeInvoicesCount = branchPayables.filter((p) => p.status !== 'Paid').length;
  const overdueCount = branchPayables.filter((p) => p.status !== 'Paid' && p.dueDate < today).length;

  // Filtered List
  const filteredList = branchPayables.filter((p) => {
    let matchesStatus = true;
    if (statusFilter === 'overdue') {
      matchesStatus = p.status !== 'Paid' && p.dueDate < today;
    } else if (statusFilter !== 'all') {
      matchesStatus = p.status === statusFilter;
    }

    const matchesSearch =
      !searchTerm.trim() ||
      p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.notes && p.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Hapus catatan tagihan hutang supplier "${name}"?`)) return;
    try {
      setIsDeleting(id);
      await onDeletePayable(id);
    } finally {
      setIsDeleting(null);
    }
  };

  const getDueDateBadge = (dueDate: string, isPaid: boolean) => {
    if (isPaid) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Lunas
        </span>
      );
    }
    if (dueDate < today) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
          <AlertCircle className="w-3 h-3 mr-1" />
          Lewat Jatuh Tempo
        </span>
      );
    }
    if (dueDate === today) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3 mr-1" />
          Jatuh Tempo Hari Ini
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-600 border border-slate-200">
        <Calendar className="w-3 h-3 mr-1" />
        Tempo: {formatDate(dueDate)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4">
          <div className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-1">
            Total Hutang Supplier Belum Lunas
          </div>
          <div className="text-xl font-extrabold text-rose-900">
            {formatRupiah(totalUnpaidAmount)}
          </div>
          <p className="text-[11px] text-rose-700 mt-1">Kewajiban bayar tempo barang ke distributor</p>
        </div>

        <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4">
          <div className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">
            Total Tagihan Telah Dibayar
          </div>
          <div className="text-xl font-extrabold text-blue-900">
            {formatRupiah(totalPaidAmount)}
          </div>
          <p className="text-[11px] text-blue-700 mt-1">Tagihan supplier yang sudah dilunasi toko</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Faktur Tempo Berjalan
          </div>
          <div className="text-xl font-extrabold text-slate-900">
            {activeInvoicesCount} <span className="text-xs font-normal text-slate-500">invoice</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Total faktur kulakan yang masih pending</p>
        </div>

        <div className="bg-red-50/70 border border-red-200 rounded-2xl p-4">
          <div className="text-xs font-bold text-red-800 uppercase tracking-wider mb-1">
            Faktur Lewat Jatuh Tempo
          </div>
          <div className="text-xl font-extrabold text-red-900">
            {overdueCount} <span className="text-xs font-normal text-red-700">faktur</span>
          </div>
          <p className="text-[11px] text-red-700 mt-1">Prioritas pelunasan agar pasokan barang aman</p>
        </div>
      </div>

      {/* Control Bar: Search, Filters, and Add Button */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filters - Consistent Styling */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Semua ({branchPayables.length})
          </button>
          <button
            onClick={() => setStatusFilter('Unpaid')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              statusFilter === 'Unpaid'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Belum Lunas
          </button>
          <button
            onClick={() => setStatusFilter('Partial')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              statusFilter === 'Partial'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Dicicil Sebagian
          </button>
          <button
            onClick={() => setStatusFilter('overdue')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              statusFilter === 'overdue'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Lewat Tempo ({overdueCount})
          </button>
          <button
            onClick={() => setStatusFilter('Paid')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              statusFilter === 'Paid'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Lunas
          </button>
        </div>

        {/* Right controls: Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari supplier / no faktur..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
          />
        </div>
      </div>

      {/* Payables Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/75">
                <th className="py-3 px-4">Supplier & Faktur</th>
                <th className="py-3 px-4">Tanggal & Jatuh Tempo</th>
                <th className="py-3 px-4">Total Faktur</th>
                <th className="py-3 px-4">Sudah Dibayar</th>
                <th className="py-3 px-4">Sisa Hutang</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Truck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    Belum ada data hutang supplier yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredList.map((pay) => {
                  const isExpanded = expandedId === pay.id;
                  const isPaid = pay.status === 'Paid';

                  return (
                    <React.Fragment key={pay.id}>
                      <tr className="hover:bg-slate-50/70 transition-colors">
                        {/* Supplier */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{pay.supplierName}</div>
                          {pay.invoiceNumber && (
                            <div className="flex items-center text-[11px] text-slate-500 mt-0.5">
                              <Hash className="w-3 h-3 mr-1 text-slate-400" />
                              Faktur: {pay.invoiceNumber}
                            </div>
                          )}
                          {pay.supplierPhone && (
                            <div className="flex items-center text-[11px] text-slate-500 mt-0.5">
                              <Phone className="w-3 h-3 mr-1 text-slate-400" />
                              {pay.supplierPhone}
                            </div>
                          )}
                          {pay.notes && (
                            <div className="text-[11px] text-slate-500 mt-0.5 italic">
                              &ldquo;{pay.notes}&rdquo;
                            </div>
                          )}
                        </td>

                        {/* Date & Due */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="text-slate-500 text-[11px] mb-1">
                            Tanggal: {formatDate(pay.createdAt)}
                          </div>
                          {getDueDateBadge(pay.dueDate, isPaid)}
                        </td>

                        {/* Total Amount */}
                        <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                          {formatRupiah(pay.totalAmount)}
                        </td>

                        {/* Paid Amount */}
                        <td className="py-3.5 px-4 text-emerald-600 font-semibold whitespace-nowrap">
                          {formatRupiah(pay.paidAmount)}
                          {pay.payments.length > 0 && (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : pay.id)}
                              className="ml-2 text-[10px] text-slate-400 hover:text-slate-600 inline-flex items-center cursor-pointer"
                              title="Lihat rincian pembayaran"
                            >
                              ({pay.payments.length}x bayar)
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3 ml-0.5" />
                              ) : (
                                <ChevronDown className="w-3 h-3 ml-0.5" />
                              )}
                            </button>
                          )}
                        </td>

                        {/* Remaining Amount */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`font-bold ${
                              isPaid ? 'text-slate-400' : 'text-rose-600 text-sm'
                            }`}
                          >
                            {formatRupiah(pay.remainingAmount)}
                          </span>
                        </td>

                        {/* Status badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isPaid ? (
                            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                              Lunas
                            </span>
                          ) : pay.status === 'Partial' ? (
                            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-100 text-amber-800">
                              Sebagian
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-rose-100 text-rose-800">
                              Belum Lunas
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-2">
                            {!isPaid && (
                              <button
                                onClick={() => onOpenPaymentModal(pay)}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg transition-colors shadow-xs cursor-pointer flex items-center space-x-1"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                                <span>Bayar Hutang</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleDelete(pay.id, pay.supplierName)}
                              disabled={isDeleting === pay.id}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus catatan hutang"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Payment History */}
                      {isExpanded && pay.payments.length > 0 && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={7} className="py-3 px-6">
                            <div className="border border-slate-200 rounded-xl bg-white p-3 space-y-2">
                              <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                Riwayat Pembayaran ke {pay.supplierName}
                              </div>
                              <div className="divide-y divide-slate-100">
                                {pay.payments.map((p) => (
                                  <div
                                    key={p.id}
                                    className="py-1.5 flex items-center justify-between text-xs"
                                  >
                                    <div className="flex items-center space-x-3">
                                      <span className="text-slate-400">{formatDate(p.paymentDate)}</span>
                                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                                        {p.paymentMethod}
                                      </span>
                                      {p.notes && <span className="text-slate-500 italic">&ldquo;{p.notes}&rdquo;</span>}
                                    </div>
                                    <div className="font-bold text-blue-600">
                                      {formatRupiah(p.amount)} ({p.paidBy || 'Kasir'})
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
