'use client';

import React from 'react';
import {
  Banknote,
  Landmark,
  QrCode,
  CreditCard,
  FileText,
  Building2,
  Unlock,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { PaymentMethod, SalesChannel, Branch, CashierShift, BusinessSettings } from '@/types';
import { SalesChannelBadge } from '@/components/SalesChannelBadge';

interface PosPaymentStepProps {
  totalAmount: number;
  totalItemsCount: number;
  salesChannel: SalesChannel;
  setSalesChannel: (ch: SalesChannel) => void;
  externalOrderId: string;
  setExternalOrderId: (id: string) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (pm: PaymentMethod) => void;
  isAddingCustomPayment: boolean;
  setIsAddingCustomPayment: (val: boolean) => void;
  customPaymentName: string;
  setCustomPaymentName: (name: string) => void;
  cashSuggestions: number[];
  cashTendered: number | '';
  setCashTendered: (val: number | '') => void;
  changeAmount: number;
  currentBranch: Branch | null;
  currentBranchShift: CashierShift | null;
  settings: BusinessSettings;
  selectedBank: string;
  setSelectedBank: (bank: string) => void;
  transferRefNumber: string;
  setTransferRefNumber: (ref: string) => void;
  qrisRrnNumber: string;
  setQrisRrnNumber: (rrn: string) => void;
  edcMachine: string;
  setEdcMachine: (edc: string) => void;
  cardBrand: string;
  setCardBrand: (brand: string) => void;
  cardTraceNumber: string;
  setCardTraceNumber: (trace: string) => void;
  bonCustomerName: string;
  setBonCustomerName: (name: string) => void;
  bonCustomerPhone: string;
  setBonCustomerPhone: (phone: string) => void;
  bonDueDate: string;
  setBonDueDate: (date: string) => void;
  bonNotes: string;
  setBonNotes: (notes: string) => void;
  onBack: () => void;
  onNext: () => void;
  formatRupiah: (val: number) => string;
}

export function PosPaymentStep({
  totalAmount,
  totalItemsCount,
  salesChannel,
  setSalesChannel,
  externalOrderId,
  setExternalOrderId,
  paymentMethod,
  setPaymentMethod,
  isAddingCustomPayment,
  setIsAddingCustomPayment,
  customPaymentName,
  setCustomPaymentName,
  cashSuggestions,
  cashTendered,
  setCashTendered,
  changeAmount,
  currentBranch,
  currentBranchShift,
  settings,
  selectedBank,
  setSelectedBank,
  transferRefNumber,
  setTransferRefNumber,
  qrisRrnNumber,
  setQrisRrnNumber,
  edcMachine,
  setEdcMachine,
  cardBrand,
  setCardBrand,
  cardTraceNumber,
  setCardTraceNumber,
  bonCustomerName,
  setBonCustomerName,
  bonCustomerPhone,
  setBonCustomerPhone,
  bonDueDate,
  setBonDueDate,
  bonNotes,
  setBonNotes,
  onBack,
  onNext,
  formatRupiah,
}: PosPaymentStepProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-2xl mx-auto w-full space-y-6">
      {/* Total Banner */}
      <div className="p-5 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-between">
        <div>
          <span className="text-xs text-teal-700 font-medium">Total Tagihan ({totalItemsCount} item):</span>
          <div className="text-2xl font-bold text-teal-900">
            {formatRupiah(totalAmount)}
          </div>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-semibold text-teal-700 hover:underline cursor-pointer"
        >
          Ubah Item
        </button>
      </div>

      {/* Sales Channel Selector */}
      <div className="space-y-2.5 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Saluran Penjualan
          </label>
          <SalesChannelBadge channel={salesChannel} size="sm" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(['Offline / Kasir', 'Shopee', 'Tokopedia', 'TikTok Shop', 'GoFood', 'GrabFood', 'ShopeeFood', 'Other'] as SalesChannel[]).map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => setSalesChannel(ch)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all cursor-pointer ${
                salesChannel === ch
                  ? 'bg-teal-50 border-teal-500 text-teal-800 font-semibold ring-1 ring-teal-300'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              {ch}
            </button>
          ))}
        </div>

        {salesChannel !== 'Offline / Kasir' && (
          <div className="pt-2">
            <label className="text-[11px] font-medium text-slate-600 block mb-1">
              Nomor Pesanan Saluran (External Order ID) - Opsional:
            </label>
            <input
              type="text"
              placeholder={`Contoh: ${salesChannel.substring(0, 3).toUpperCase()}-123456`}
              value={externalOrderId}
              onChange={(e) => setExternalOrderId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-teal-500"
            />
          </div>
        )}
      </div>

      {/* Payment Methods Options */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Pilih Metode Pembayaran
          </label>
          <span className="text-[11px] text-teal-700 font-medium">6 Metode Tersedia</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {/* Cash */}
          <button
            type="button"
            onClick={() => {
              setPaymentMethod('Cash');
              setIsAddingCustomPayment(false);
            }}
            className={`p-3 rounded-2xl border flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer ${
              paymentMethod === 'Cash' && !isAddingCustomPayment
                ? 'bg-teal-50 border-teal-500 text-teal-800 ring-2 ring-teal-200 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <Banknote className="w-5 h-5 text-teal-600" />
            <span className="text-xs font-semibold">Tunai (Cash)</span>
          </button>

          {/* Transfer Bank */}
          <button
            type="button"
            onClick={() => {
              setPaymentMethod('Transfer');
              setIsAddingCustomPayment(false);
            }}
            className={`p-3 rounded-2xl border flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer ${
              paymentMethod === 'Transfer' && !isAddingCustomPayment
                ? 'bg-teal-50 border-teal-500 text-teal-800 ring-2 ring-teal-200 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <Landmark className="w-5 h-5 text-teal-600" />
            <span className="text-xs font-semibold">Transfer Bank</span>
          </button>

          {/* QRIS */}
          <button
            type="button"
            onClick={() => {
              setPaymentMethod('QRIS');
              setIsAddingCustomPayment(false);
            }}
            className={`p-3 rounded-2xl border flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer ${
              paymentMethod === 'QRIS' && !isAddingCustomPayment
                ? 'bg-teal-50 border-teal-500 text-teal-800 ring-2 ring-teal-200 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <QrCode className="w-5 h-5 text-teal-600" />
            <span className="text-xs font-semibold">QRIS / E-Wallet</span>
          </button>

          {/* Debit Card */}
          <button
            type="button"
            onClick={() => {
              setPaymentMethod('Debit');
              setIsAddingCustomPayment(false);
            }}
            className={`p-3 rounded-2xl border flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer ${
              paymentMethod === 'Debit' && !isAddingCustomPayment
                ? 'bg-teal-50 border-teal-500 text-teal-800 ring-2 ring-teal-200 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <CreditCard className="w-5 h-5 text-teal-600" />
            <span className="text-xs font-semibold">Kartu Debit</span>
          </button>

          {/* Credit Card */}
          <button
            type="button"
            onClick={() => {
              setPaymentMethod('Credit');
              setIsAddingCustomPayment(false);
            }}
            className={`p-3 rounded-2xl border flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer ${
              paymentMethod === 'Credit' && !isAddingCustomPayment
                ? 'bg-teal-50 border-teal-500 text-teal-800 ring-2 ring-teal-200 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <CreditCard className="w-5 h-5 text-indigo-600" />
            <span className="text-xs font-semibold">Kartu Kredit</span>
          </button>

          {/* Bon / Kasbon Pelanggan */}
          <button
            type="button"
            onClick={() => {
              setPaymentMethod('Kasbon');
              setIsAddingCustomPayment(false);
            }}
            className={`p-3 rounded-2xl border flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer ${
              paymentMethod === 'Kasbon' && !isAddingCustomPayment
                ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-300 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <FileText className="w-5 h-5 text-amber-600" />
            <span className="text-xs font-semibold">Bon / Kasbon</span>
          </button>

          {/* Other / Custom */}
          <button
            type="button"
            onClick={() => setIsAddingCustomPayment(true)}
            className={`p-3 rounded-2xl border flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer ${
              isAddingCustomPayment
                ? 'bg-teal-50 border-teal-500 text-teal-800 ring-2 ring-teal-200 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <Building2 className="w-5 h-5 text-slate-500" />
            <span className="text-xs font-semibold">Metode Lain</span>
          </button>
        </div>

        {isAddingCustomPayment && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <label className="text-xs font-medium text-slate-700">Nama Metode Pembayaran Lain:</label>
            <input
              type="text"
              placeholder="Misal: Voucher, ShopeePay Manual, DANA Tunai"
              value={customPaymentName}
              onChange={(e) => setCustomPaymentName(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-teal-500"
            />
          </div>
        )}
      </div>

      {/* Cash Calculation Helper */}
      {paymentMethod === 'Cash' && !isAddingCustomPayment && (
        <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5">
          <span className="text-xs font-medium text-slate-700 block">
            Uang Diterima dari Pembeli:
          </span>

          {/* Cash Suggestion Chips */}
          <div className="flex flex-wrap gap-2">
            {cashSuggestions.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setCashTendered(amount)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  cashTendered === amount
                    ? 'bg-teal-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:border-teal-400'
                }`}
              >
                {amount === totalAmount ? 'Uang Pas' : formatRupiah(amount)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">Nominal Diterima (Rp):</label>
              <input
                type="number"
                placeholder="Contoh: 50000"
                value={cashTendered}
                onChange={(e) =>
                  setCashTendered(
                    e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0)
                  )
                }
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-semibold focus:outline-none focus:border-teal-500"
              />
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col justify-center shadow-xs">
              <span className="text-[11px] font-medium text-slate-500">Uang Kembalian:</span>
              <span className="text-base font-bold text-teal-700">
                {formatRupiah(changeAmount)}
              </span>
            </div>
          </div>

          {currentBranchShift && (
            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
              <span>Laci ({currentBranch?.name}): <strong className="text-slate-700 font-mono">{formatRupiah(currentBranchShift.expectedEndingCash)}</strong></span>
              {settings.autoOpenCashDrawer !== false && (
                <span className="text-teal-700 font-medium flex items-center space-x-1">
                  <Unlock className="w-3 h-3 inline mr-0.5" />
                  <span>Laci terbuka otomatis</span>
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Transfer Bank Detail Box */}
      {paymentMethod === 'Transfer' && !isAddingCustomPayment && (
        <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">
              Pilih Bank Tujuan Transfer:
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {['BCA', 'Mandiri', 'BRI', 'BNI', 'BSI', 'CIMB'].map((bank) => (
                <button
                  key={bank}
                  type="button"
                  onClick={() => setSelectedBank(bank)}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                    selectedBank === bank
                      ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {bank}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 block">Rekening Toko {selectedBank}:</span>
              <span className="text-sm font-mono font-bold text-slate-800">
                {selectedBank === 'BCA' && '8830-1928-44 (a.n Toko)'}
                {selectedBank === 'Mandiri' && '137-00-9821-331 (a.n Toko)'}
                {selectedBank === 'BRI' && '0206-01-0821-502 (a.n Toko)'}
                {selectedBank === 'BNI' && '0928-1122-33 (a.n Toko)'}
                {selectedBank === 'BSI' && '7123-4567-89 (a.n Toko)'}
                {selectedBank === 'CIMB' && '701-22-3344-500 (a.n Toko)'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">Total Tagihan:</span>
              <span className="text-sm font-bold text-teal-700 font-mono">{formatRupiah(totalAmount)}</span>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-600 block mb-1">
              Nomor Referensi Transfer / Nama Pengirim (Opsional):
            </label>
            <input
              type="text"
              placeholder="Contoh: REF-BCA-9812 / Budi"
              value={transferRefNumber}
              onChange={(e) => setTransferRefNumber(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>
      )}

      {/* QRIS Display Box */}
      {paymentMethod === 'QRIS' && !isAddingCustomPayment && (
        <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center text-center space-y-3">
          <div className="w-36 h-36 bg-white p-2 rounded-2xl border border-slate-200 flex items-center justify-center shadow-xs">
            <QrCode className="w-28 h-28 text-slate-800" />
          </div>
          <div>
            <h5 className="text-sm font-bold text-slate-900">{settings.name}</h5>
            <p className="text-xs text-slate-500">NMID: ID1029384756201 • Semua E-Wallet & Mobile Banking</p>
            <p className="text-base font-bold text-teal-700 mt-1 font-mono">
              {formatRupiah(totalAmount)}
            </p>
          </div>
          <div className="w-full max-w-sm text-left">
            <label className="text-[11px] font-medium text-slate-600 block mb-1">
              Nomor RRN / Referensi Scan QRIS (Opsional):
            </label>
            <input
              type="text"
              placeholder="Contoh: RRN-00293841"
              value={qrisRrnNumber}
              onChange={(e) => setQrisRrnNumber(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500 font-mono"
            />
          </div>
        </div>
      )}

      {/* Kartu Debit Box */}
      {paymentMethod === 'Debit' && !isAddingCustomPayment && (
        <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5">
          <div className="flex items-center space-x-2 text-slate-800">
            <CreditCard className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-bold uppercase tracking-wider">Gesek / Dip Kartu Debit</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">Mesin EDC:</label>
              <select
                value={edcMachine}
                onChange={(e) => setEdcMachine(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
              >
                <option value="EDC BCA">EDC BCA</option>
                <option value="EDC Mandiri">EDC Mandiri</option>
                <option value="EDC BRI">EDC BRI</option>
                <option value="EDC BNI">EDC BNI</option>
                <option value="EDC Bank Lain">EDC Bank Lain</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">No. Trace / Reff EDC (Opsional):</label>
              <input
                type="text"
                placeholder="Contoh: TRC-091823"
                value={cardTraceNumber}
                onChange={(e) => setCardTraceNumber(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
          <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-600">Total Transaksi EDC:</span>
            <span className="font-bold text-teal-700 font-mono text-sm">{formatRupiah(totalAmount)}</span>
          </div>
        </div>
      )}

      {/* Kartu Kredit Box */}
      {paymentMethod === 'Credit' && !isAddingCustomPayment && (
        <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5">
          <div className="flex items-center space-x-2 text-slate-800">
            <CreditCard className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold uppercase tracking-wider">Gesek / Dip Kartu Kredit</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">Jaringan Kartu:</label>
              <select
                value={cardBrand}
                onChange={(e) => setCardBrand(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
              >
                <option value="Visa">Visa</option>
                <option value="Mastercard">Mastercard</option>
                <option value="JCB">JCB</option>
                <option value="GPN">GPN</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">Nomor Approval / Trace EDC (Opsional):</label>
              <input
                type="text"
                placeholder="Contoh: APP-882190"
                value={cardTraceNumber}
                onChange={(e) => setCardTraceNumber(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
          <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-600">Total Transaksi Kredit:</span>
            <span className="font-bold text-teal-700 font-mono text-sm">{formatRupiah(totalAmount)}</span>
          </div>
        </div>
      )}

      {/* Bon / Kasbon Pelanggan Box */}
      {paymentMethod === 'Kasbon' && !isAddingCustomPayment && (
        <div className="p-4 sm:p-5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3.5">
          <div className="flex items-center space-x-2 text-amber-900">
            <FileText className="w-4 h-4 text-amber-700" />
            <span className="text-xs font-bold uppercase tracking-wider">Catat Sebagai Bon / Kasbon (Tempo)</span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            Pesanan akan tetap diproses, stok barang berkurang otomatis, dan tagihan sebesar <strong>{formatRupiah(totalAmount)}</strong> akan langsung dicatat ke <strong>Buku Piutang Toko</strong>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Nama Pelanggan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Bu Hj. Maryam, Pak RT Joko"
                value={bonCustomerName}
                onChange={(e) => setBonCustomerName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">
                No. WhatsApp / HP (Opsional):
              </label>
              <input
                type="text"
                placeholder="0812-3456-7890"
                value={bonCustomerPhone}
                onChange={(e) => setBonCustomerPhone(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Jatuh Tempo Pembayaran:
              </label>
              <input
                type="date"
                value={bonDueDate}
                onChange={(e) => setBonDueDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">Catatan Tambahan (Opsional):</label>
              <input
                type="text"
                placeholder="Misal: Janji bayar tgl gajian"
                value={bonNotes}
                onChange={(e) => setBonNotes(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 2 Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
        >
          Kembali
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-xl text-xs font-semibold shadow-md shadow-teal-600/20 active:scale-[0.99] transition-all cursor-pointer"
        >
          <span>Lihat Ringkasan Pesanan</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
