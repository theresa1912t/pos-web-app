'use client';

import React, { useState } from 'react';
import {
  X,
  Check,
  Zap,
  Building2,
  Users,
  Store,
  ShieldCheck,
  Send,
  Copy,
  CheckCheck,
  ArrowRight,
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { SubscriptionTier } from '@/types';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: SubscriptionTier;
  storeName: string;
  ownerName: string;
  onSelectPlan: (tier: SubscriptionTier) => void;
}

export const PILOT_PLANS = [
  {
    id: 'trial' as const,
    name: 'Free Trial',
    tagline: 'Coba Gratis Eksplorasi',
    price: 0,
    periodText: '14 Hari Percobaan',
    badge: 'Masa Uji Coba',
    isPopular: false,
    features: [
      'Akses 1 Cabang Toko',
      'Maksimal 3 Akun Pengguna / Kasir',
      'POS Kasir & Barcode Cepat',
      'Manajemen Shift & Rekap Kas Laci',
      'Laporan Penjualan & Laba Rugi',
      'Cetak Struk Thermal Bluetooth/USB',
    ],
    ctaText: 'Gunakan Trial',
  },
  {
    id: 'basic' as const,
    name: 'Basic Pilot',
    tagline: 'Solusi Lengkap 1 Toko Ritel',
    price: 149000,
    periodText: '/ bulan (Rp 1.428.000 / thn)',
    badge: 'Paling Populer',
    isPopular: true,
    features: [
      '1 Cabang Utama (Single Store)',
      'Hingga 3 Akun Pengguna (Owner & Kasir)',
      'Unlimited Katalog Produk & Scan Barcode',
      'POS Kasir Cepat & Cetak Struk',
      'Manajemen Shift Kasir & Tutup Buku (Z-Report)',
      'Pemetaan Rak Display Toko',
      'Laporan Omzet, HPP, Laba Bersih & Biaya',
      'Dukungan Pengaturan Awal via WhatsApp',
    ],
    ctaText: 'Pilih Paket Basic',
  },
  {
    id: 'pro' as const,
    name: 'Pro Multi-Outlet',
    tagline: 'Skala Multi-Cabang & Omnichannel',
    price: 299000,
    periodText: '/ bulan (Include 2 Cabang)',
    badge: 'Bisnis Berkembang',
    isPopular: false,
    features: [
      'Sudah Termasuk 2 Cabang Utama',
      'Unlimited Akun Pengguna (RBAC Fleksibel)',
      'Semua Fitur Paket Basic',
      'Transfer Stok Antar-Cabang Otomatis',
      'Modul Stock Opname Terjadwal & Selisih Fisik',
      'Integrasi Saluran Marketplace (Shopee/Tokopedia)',
      'Laporan Keuangan Konsolidasi Multi-Cabang',
      'Prioritas Dukungan Teknis Langsung',
    ],
    ctaText: 'Pilih Paket Pro',
  },
];

export function SubscriptionModal({
  isOpen,
  onClose,
  currentTier,
  storeName,
  ownerName,
  onSelectPlan,
}: SubscriptionModalProps) {
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(
    currentTier === 'trial' ? 'basic' : currentTier
  );
  const [copiedBank, setCopiedBank] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetPlan = PILOT_PLANS.find((p) => p.id === selectedTier) || PILOT_PLANS[1];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBank(key);
    setTimeout(() => setCopiedBank(null), 2000);
  };

  const handleSendWhatsApp = () => {
    onSelectPlan(selectedTier);
    const message = encodeURIComponent(
      `Halo Admin POS,\n\nSaya ingin konfirmasi aktivasi paket langganan pilot:\n- Toko: ${storeName || 'Toko Ritel'}\n- Pemilik: ${ownerName || 'Owner'}\n- Paket Dipilih: ${targetPlan.name} (${formatRupiah(targetPlan.price)}/bln)\n\nMohon petunjuk aktivasi dan rekening pembayarannya. Terima kasih.`
    );
    // WhatsApp URL
    window.open(`https://wa.me/6281298765432?text=${message}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-4xl w-full my-8 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Pilihan Paket Langganan Software
              </h2>
              <p className="text-xs text-slate-500">
                Aktivasi pilot program untuk operasional toko Anda
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Plan Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PILOT_PLANS.map((plan) => {
              const isSelected = selectedTier === plan.id;
              const isCurrent = currentTier === plan.id;

              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedTier(plan.id)}
                  className={`rounded-2xl border p-5 flex flex-col justify-between transition-all cursor-pointer relative ${
                    isSelected
                      ? 'border-teal-500 ring-2 ring-teal-500/20 bg-teal-50/20 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  {plan.isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-teal-600 text-white shadow-xs">
                      {plan.badge}
                    </span>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900">{plan.name}</h3>
                      {isCurrent && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">
                          Aktif
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{plan.tagline}</p>

                    <div className="mt-4 pb-4 border-b border-slate-100">
                      <div className="flex items-baseline space-x-1">
                        <span className="text-xl font-bold font-mono text-slate-900">
                          {plan.price === 0 ? 'Gratis' : formatRupiah(plan.price)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{plan.periodText}</p>
                    </div>

                    <ul className="mt-4 space-y-2.5 text-xs text-slate-600">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 pt-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTier(plan.id);
                      }}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-center ${
                        isSelected
                          ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {isSelected ? 'Paket Terpilih' : plan.ctaText}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Payment & Manual Confirmation Box */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Aktivasi Pilot & Konfirmasi Pembayaran
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Paket dipilih:{' '}
                  <span className="font-bold text-teal-700">{targetPlan.name}</span> (
                  {targetPlan.price === 0 ? 'Gratis' : `${formatRupiah(targetPlan.price)}/bulan`}
                  )
                </p>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Verifikasi Manual & Personal</span>
              </div>
            </div>

            {targetPlan.price > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Bank Rekening 1 */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      Bank Central Asia (BCA)
                    </span>
                    <p className="text-xs font-mono font-bold text-slate-800 tracking-wide">
                      8820 1234 5678
                    </p>
                    <span className="text-[10px] text-slate-500">a.n. Admin POS Retail</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('882012345678', 'bca')}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    title="Salin Nomor Rekening"
                  >
                    {copiedBank === 'bca' ? (
                      <CheckCheck className="w-4 h-4 text-teal-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Bank Rekening 2 */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      Bank Mandiri
                    </span>
                    <p className="text-xs font-mono font-bold text-slate-800 tracking-wide">
                      1370 0098 7654 3
                    </p>
                    <span className="text-[10px] text-slate-500">a.n. Admin POS Retail</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('1370009876543', 'mandiri')}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    title="Salin Nomor Rekening"
                  >
                    {copiedBank === 'mandiri' ? (
                      <CheckCheck className="w-4 h-4 text-teal-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-600">
                Paket Free Trial aktif selama 14 hari penuh. Tidak memerlukan pembayaran apa pun
                untuk mencoba seluruh fitur kasir dan manajemen toko.
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer text-center"
              >
                Tutup
              </button>

              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Konfirmasi Aktivasi via WhatsApp</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
