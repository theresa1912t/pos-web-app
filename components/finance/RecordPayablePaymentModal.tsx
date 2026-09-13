'use client';

import React, { useState } from 'react';
import { SupplierPayable } from '@/types';
import { formatRupiah } from '@/lib/utils';
import { X, CheckCircle2, Banknote, ArrowRightLeft, FileText } from 'lucide-react';

interface RecordPayablePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payable: SupplierPayable | null;
  onRecordPayment: (
    payableId: string,
    amount: number,
    paymentMethod: 'Cash' | 'Transfer',
    notes?: string
  ) => Promise<void>;
}

export function RecordPayablePaymentModal({
  isOpen,
  onClose,
  payable,
  onRecordPayment,
}: RecordPayablePaymentModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Transfer'>('Transfer');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !payable) return null;

  const handlePayFull = () => {
    setAmount(String(payable.remainingAmount));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount.replace(/[^0-9]/g, ''));
    if (!amountNum || amountNum <= 0) {
      setError('Nominal pembayaran hutang harus lebih dari 0');
      return;
    }
    if (amountNum > payable.remainingAmount) {
      setError(`Nominal bayar (${formatRupiah(amountNum)}) melebihi sisa tagihan (${formatRupiah(payable.remainingAmount)})`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onRecordPayment(payable.id, amountNum, paymentMethod, notes.trim() || undefined);
      setAmount('');
      setNotes('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Gagal mencatat pembayaran hutang');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Bayar Hutang Supplier</h3>
              <p className="text-xs text-slate-500">{payable.supplierName} {payable.invoiceNumber ? `(${payable.invoiceNumber})` : ''}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          {/* Info Card Sisa Hutang */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Total Tagihan Faktur:</span>
              <span className="font-semibold text-slate-700">{formatRupiah(payable.totalAmount)}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Sudah Dibayar Sebelumnya:</span>
              <span className="font-semibold text-emerald-600">{formatRupiah(payable.paidAmount)}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm">
              <span className="font-semibold text-slate-800">Sisa Tagihan Tempo:</span>
              <span className="font-bold text-rose-600 text-base">{formatRupiah(payable.remainingAmount)}</span>
            </div>
          </div>

          {/* Nominal Input & Quick Full Pay Button */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Nominal Pembayaran <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handlePayFull}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer hover:underline"
              >
                Bayar Lunas ({formatRupiah(payable.remainingAmount)})
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                Rp
              </span>
              <input
                type="number"
                required
                min="1000"
                max={payable.remainingAmount}
                step="1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full pl-10 pr-3 py-2 text-sm font-bold text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
            {amount && !isNaN(Number(amount)) && Number(amount) > 0 && (
              <p className="text-[11px] text-blue-600 font-semibold mt-1">
                Terbaca: {formatRupiah(Number(amount))}
              </p>
            )}
          </div>

          {/* Metode Pembayaran (Transfer Bank vs Tunai Kasir) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Sumber Dana Pembayaran
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('Transfer')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  paymentMethod === 'Transfer'
                    ? 'border-blue-600 bg-blue-50/80 text-blue-800 ring-2 ring-blue-500/20 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ArrowRightLeft className="w-4 h-4 mb-1 text-blue-600" />
                <span>Transfer Bank / Rekening</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Cash')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  paymentMethod === 'Cash'
                    ? 'border-emerald-600 bg-emerald-50/80 text-emerald-800 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-4 h-4 mb-1 text-emerald-600" />
                <span>Uang Tunai (Kasir Toko)</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              {paymentMethod === 'Transfer'
                ? 'Dibayarkan via mobile banking / rekening usaha toko tanpa mempengaruhi saldo kas laci kasir.'
                : 'Uang diambil langsung dari kas toko, otomatis tercatat sebagai Pengeluaran Kas (Cash Out) kasir.'}
            </p>
          </div>

          {/* Catatan / No Referensi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Catatan / No. Resi Transfer (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Transfer BCA Ref #882194, diterima sales Pak Anto"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Memproses...' : 'Konfirmasi Pembayaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
