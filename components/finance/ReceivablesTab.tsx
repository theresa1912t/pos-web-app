'use client';

import React, { useState, useMemo } from 'react';
import { CustomerReceivable, Branch } from '@/types';
import { formatRupiah, formatDate } from '@/lib/utils';
import {
  UserCheck,
  Search,
  Filter,
  AlertCircle,
  Clock,
  CheckCircle2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Phone,
  Banknote,
  DollarSign,
  Calendar,
} from 'lucide-react';

interface ReceivablesTabProps {
  receivables: CustomerReceivable[];
  branches: Branch[];
  activeBranchId: string;
  onOpenAddModal: () => void;
  onOpenPaymentModal: (receivable: CustomerReceivable) => void;
  onDeleteReceivable: (id: string) => Promise<void>;
}

export function ReceivablesTab({
  receivables,
  branches,
  activeBranchId,
  onOpenAddModal,
  onOpenPaymentModal,
  onDeleteReceivable,
}: ReceivablesTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Unpaid' | 'Partial' | 'Paid' | 'overdue'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  // Filter based on branch
  const branchReceivables = useMemo(() => {
    return receivables.filter(
      (r) => activeBranchId === 'all' || !r.branchId || r.branchId === activeBranchId
    );
  }, [receivables, activeBranchId]);

  // Calculations for summary banner
  const totalUnpaidAmount = branchReceivables
    .filter((r) => r.status !== 'Paid')
    .reduce((sum, r) => sum + r.remainingAmount, 0);

  const totalCollectedAmount = branchReceivables.reduce((sum, r) => sum + r.paidAmount, 0);

  const activeDebtorsCount = branchReceivables.filter((r) => r.status !== 'Paid').length;
  const overdueCount = branchReceivables.filter((r) => r.status !== 'Paid' && r.dueDate < today).length;

  // Filter by status & search
  const filteredList = branchReceivables.filter((r) => {
    let matchesStatus = true;
    if (statusFilter === 'overdue') {
      matchesStatus = r.status !== 'Paid' && r.dueDate < today;
    } else if (statusFilter !== 'all') {
      matchesStatus = r.status === statusFilter;
    }

    const matchesSearch =
      !searchTerm.trim() ||
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.customerPhone && r.customerPhone.includes(searchTerm)) ||
      (r.notes && r.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Hapus catatan piutang/bon pelanggan "${name}"?`)) return;
    try {
      setIsDeleting(id);
      await onDeleteReceivable(id);
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
          Lewat Tempo
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
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4">
          <div className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
            Total Piutang Belum Lunas
          </div>
          <div className="text-xl font-extrabold text-amber-900">
            {formatRupiah(totalUnpaidAmount)}
          </div>
          <p className="text-[11px] text-amber-700 mt-1">Uang toko yang masih beredar di pelanggan</p>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4">
          <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            Total Kasbon Terkumpul
          </div>
          <div className="text-xl font-extrabold text-emerald-900">
            {formatRupiah(totalCollectedAmount)}
          </div>
          <p className="text-[11px] text-emerald-700 mt-1">Cicilan & pelunasan kasbon yang sudah masuk</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Pelanggan Belum Lunas
          </div>
          <div className="text-xl font-extrabold text-slate-900">
            {activeDebtorsCount} <span className="text-xs font-normal text-slate-500">orang</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Total pelanggan dengan kasbon aktif</p>
        </div>

        <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4">
          <div className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-1">
            Lewat Jatuh Tempo
          </div>
          <div className="text-xl font-extrabold text-rose-900">
            {overdueCount} <span className="text-xs font-normal text-rose-700">orang</span>
          </div>
          <p className="text-[11px] text-rose-700 mt-1">Perlu segera diingatkan / ditagih</p>
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
            Semua ({branchReceivables.length})
          </button>
          <button
            onClick={() => setStatusFilter('Unpaid')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              statusFilter === 'Unpaid'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Belum Bayar
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
            placeholder="Cari pelanggan / catatan..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
          />
        </div>
      </div>

      {/* Receivables Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/75">
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4">Tanggal & Jatuh Tempo</th>
                <th className="py-3 px-4">Total Bon</th>
                <th className="py-3 px-4">Sudah Dibayar</th>
                <th className="py-3 px-4">Sisa Tagihan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <UserCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    Belum ada data kasbon pelanggan yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredList.map((rec) => {
                  const isExpanded = expandedId === rec.id;
                  const isPaid = rec.status === 'Paid';

                  return (
                    <React.Fragment key={rec.id}>
                      <tr className="hover:bg-slate-50/70 transition-colors">
                        {/* Customer */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{rec.customerName}</div>
                          {rec.customerPhone && (
                            <div className="flex items-center text-[11px] text-slate-500 mt-0.5">
                              <Phone className="w-3 h-3 mr-1 text-slate-400" />
                              {rec.customerPhone}
                            </div>
                          )}
                          {rec.notes && (
                            <div className="text-[11px] text-slate-500 mt-0.5 italic">
                              &ldquo;{rec.notes}&rdquo;
                            </div>
                          )}
                        </td>

                        {/* Date & Due */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="text-slate-500 text-[11px] mb-1">
                            Dibuat: {formatDate(rec.createdAt)}
                          </div>
                          {getDueDateBadge(rec.dueDate, isPaid)}
                        </td>

                        {/* Total Amount */}
                        <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                          {formatRupiah(rec.totalAmount)}
                        </td>

                        {/* Paid Amount */}
                        <td className="py-3.5 px-4 text-emerald-600 font-semibold whitespace-nowrap">
                          {formatRupiah(rec.paidAmount)}
                          {rec.payments.length > 0 && (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                              className="ml-2 text-[10px] text-slate-400 hover:text-slate-600 inline-flex items-center cursor-pointer"
                              title="Lihat riwayat pembayaran"
                            >
                              ({rec.payments.length}x bayar)
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
                            {formatRupiah(rec.remainingAmount)}
                          </span>
                        </td>

                        {/* Status badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isPaid ? (
                            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                              Lunas
                            </span>
                          ) : rec.status === 'Partial' ? (
                            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-100 text-amber-800">
                              Sebagian
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-rose-100 text-rose-800">
                              Belum Bayar
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-2">
                            {!isPaid && (
                              <button
                                onClick={() => onOpenPaymentModal(rec)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition-colors shadow-xs cursor-pointer flex items-center space-x-1"
                              >
                                <Banknote className="w-3.5 h-3.5" />
                                <span>Bayar / Cicil</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleDelete(rec.id, rec.customerName)}
                              disabled={isDeleting === rec.id}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus catatan piutang"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Payment History */}
                      {isExpanded && rec.payments.length > 0 && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={7} className="py-3 px-6">
                            <div className="border border-slate-200 rounded-xl bg-white p-3 space-y-2">
                              <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                Riwayat Pembayaran & Cicilan ({rec.customerName})
                              </div>
                              <div className="divide-y divide-slate-100">
                                {rec.payments.map((p) => (
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
                                    <div className="font-bold text-emerald-600">
                                      + {formatRupiah(p.amount)}
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
