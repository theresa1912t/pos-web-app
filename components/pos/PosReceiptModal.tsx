'use client';

import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Building2,
  RefreshCcw,
  Vault,
} from 'lucide-react';
import { Order } from '@/types';
import { useApp } from '@/context/AppContext';
import { formatRupiah, formatTime } from '@/lib/utils';
import { SalesChannelBadge } from '@/components/SalesChannelBadge';
import { triggerCashDrawerOpen } from '@/lib/hardwareBridge';

interface PosReceiptModalProps {
  completedOrder: Order;
  cashDrawerResult: { triggered: boolean; success: boolean; message: string } | null;
  onSetCashDrawerResult: (val: { triggered: boolean; success: boolean; message: string }) => void;
  onResetOrder: () => void;
  onClose: () => void;
  isFullPage: boolean;
  onShowToast?: (msg: string, type?: 'success' | 'warning' | 'error') => void;
}

export function PosReceiptModal({
  completedOrder,
  cashDrawerResult,
  onSetCashDrawerResult,
  onResetOrder,
  onClose,
  isFullPage,
  onShowToast,
}: PosReceiptModalProps) {
  const { settings } = useApp();

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-md mx-auto w-full space-y-5 animate-in fade-in duration-200">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Transaksi Berhasil!</h3>
        <p className="text-xs text-slate-500">
          Stok otomatis berkurang dan penjualan dicatat dalam laporan keuangan.
        </p>
      </div>

      {/* Hardware / Cash Drawer Status Notification */}
      {cashDrawerResult && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex flex-col gap-2 ${
            cashDrawerResult.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  cashDrawerResult.success ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {cashDrawerResult.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              </div>
              <span className="font-semibold text-xs">{cashDrawerResult.message}</span>
            </div>
          </div>

          {!cashDrawerResult.success && (
            <div className="flex items-center space-x-2 pt-1.5 border-t border-slate-200">
              <button
                type="button"
                onClick={async () => {
                  const res = await triggerCashDrawerOpen();
                  if (res.success) {
                    onSetCashDrawerResult({
                      triggered: true,
                      success: true,
                      message: 'Cash payment recorded. Cash drawer opened.',
                    });
                  }
                }}
                className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
              >
                Coba Buka Laci Lagi (Retry)
              </button>
              <span className="text-[10px] text-slate-500">Pembayaran tetap tersimpan aman.</span>
            </div>
          )}
        </div>
      )}

      {/* Thermal Receipt Preview */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl text-xs space-y-3 font-mono shadow-sm text-slate-800">
        <div className="text-center border-b border-slate-200 pb-3 font-sans">
          <h4 className="font-bold text-sm text-slate-900">{settings.name}</h4>
          <div className="inline-flex items-center space-x-1 text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 mt-1">
            <Building2 className="w-3 h-3 text-teal-600" />
            <span>{completedOrder.branchName || 'Cabang Utama'}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">{settings.address}</p>
          <p className="text-[10px] text-slate-500">Telp: {settings.phone}</p>
        </div>

        <div className="flex justify-between items-center text-[11px] text-slate-500 border-b border-slate-200 pb-2">
          <span>{completedOrder.id}</span>
          <div className="flex items-center gap-1.5 font-sans">
            <SalesChannelBadge channel={completedOrder.salesChannel || 'Offline / Kasir'} size="sm" />
            <span>{formatTime(completedOrder.createdAt)}</span>
          </div>
        </div>

        {completedOrder.externalOrderId && (
          <div className="flex justify-between text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded font-mono">
            <span>Saluran Ref:</span>
            <span className="font-bold text-slate-900">{completedOrder.externalOrderId}</span>
          </div>
        )}

        {/* Items */}
        <div className="space-y-1.5 py-1">
          {completedOrder.items.map((it, idx) => (
            <div key={idx} className="flex justify-between text-slate-700">
              <span className="truncate pr-2">
                {it.productName} x{it.quantity}
              </span>
              <span className="font-semibold text-slate-900">{formatRupiah(it.subtotal)}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-slate-200 pt-2.5 space-y-1">
          {completedOrder.discountTotal && completedOrder.discountTotal > 0 ? (
            <div className="flex justify-between text-emerald-700 text-[11px] font-semibold">
              <span>Hemat Promo:</span>
              <span>-{formatRupiah(completedOrder.discountTotal)}</span>
            </div>
          ) : null}
          <div className="flex justify-between font-bold text-sm text-teal-700">
            <span>TOTAL:</span>
            <span>{formatRupiah(completedOrder.total)}</span>
          </div>
          <div className="flex justify-between text-slate-600 text-[11px]">
            <span>Metode:</span>
            <span className="font-medium text-slate-900">{completedOrder.paymentMethod}</span>
          </div>
          {completedOrder.cashTendered && (
            <>
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>Tunai:</span>
                <span>{formatRupiah(completedOrder.cashTendered)}</span>
              </div>
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>Kembalian:</span>
                <span className="font-bold text-teal-700">{formatRupiah(completedOrder.changeAmount || 0)}</span>
              </div>
            </>
          )}
        </div>

        <div className="text-center pt-2.5 border-t border-slate-200 text-[10px] text-slate-400">
          Terima kasih atas kunjungan Anda!
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2.5 pt-2">
        <button
          type="button"
          onClick={onResetOrder}
          className="w-full flex items-center justify-center space-x-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white py-3 rounded-xl text-xs font-semibold shadow-md shadow-teal-600/20 active:scale-[0.99] transition-all cursor-pointer"
        >
          <RefreshCcw className="w-4 h-4" />
          <span>Buat Transaksi Baru</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => {
              triggerCashDrawerOpen();
              if (onShowToast) {
                onShowToast('Perintah buka laci kasir (Cash Drawer Kick) dikirim!', 'success');
              }
            }}
            className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            title="Buka laci uang kasir secara manual"
          >
            <Vault className="w-3.5 h-3.5 text-teal-600" />
            <span>Buka Laci Uang</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {isFullPage ? 'Ke Riwayat Transaksi' : 'Selesai & Tutup'}
          </button>
        </div>
      </div>
    </div>
  );
}
