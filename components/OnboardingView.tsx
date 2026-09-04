'use client';

import React, { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Store,
  Phone,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Upload,
  Check,
} from 'lucide-react';

const BUSINESS_TYPE_OPTIONS = [
  { id: 'Warung', label: 'Warung', desc: 'Warung makan, warung kelontong, atau rokok' },
  { id: 'Toko Kelontong', label: 'Toko Kelontong', desc: 'Sembako, kebutuhan rumah & grosir' },
  { id: 'Food & Beverage', label: 'Food & Beverage', desc: 'Kedai kopi, jajanan, atau cafe' },
  { id: 'Other', label: 'Lainnya', desc: 'Usaha ritel atau jasa lainnya' },
];

const PRESET_COLORS = [
  { hex: '#0d9488', name: 'Teal Pro' },
  { hex: '#2563eb', name: 'Royal Blue' },
  { hex: '#059669', name: 'Emerald' },
  { hex: '#7c3aed', name: 'Violet' },
  { hex: '#ea580c', name: 'Orange' },
  { hex: '#e11d48', name: 'Rose' },
];

export function OnboardingView() {
  const { user, completeOnboarding, settings } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Business Information
  const [businessName, setBusinessName] = useState(settings.name || 'Warung Juara');
  const [businessType, setBusinessType] = useState('Warung');
  const [whatsappNumber, setWhatsappNumber] = useState(settings.phone || '0812-9876-5432');
  const [businessAddress, setBusinessAddress] = useState(settings.address || 'Jl. Raya Kebayoran Lama No. 88');

  // Step 2: Branding
  const [logo, setLogo] = useState<string | undefined>(settings.logo);
  const [brandColor, setBrandColor] = useState(settings.brandColor || '#0d9488');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation & loading states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('Ukuran file maksimal 3MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setLogo(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) {
      setErrorMsg('Nama usaha wajib diisi.');
      return;
    }
    setErrorMsg(null);
    setStep(2);
  };

  const handleStep2Next = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setStep(3);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await completeOnboarding({
        businessName: businessName.trim(),
        businessType,
        whatsappNumber: whatsappNumber.trim(),
        businessAddress: businessAddress.trim(),
        logo,
        brandColor,
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal menyelesaikan onboarding.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 selection:bg-teal-100 selection:text-teal-900">
      <div className="max-w-2xl mx-auto w-full">
        {/* Step Indicator Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-600/20 mb-3">
            <Store className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Pengaturan Awal Usaha Anda
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Selamat datang, <span className="font-semibold text-slate-900">{user?.name || 'Pemilik Usaha'}</span>. Lengkapi identitas usaha Anda untuk memulai.
          </p>

          {/* Stepper Progress Bar */}
          <div className="mt-6 flex items-center justify-center space-x-2 sm:space-x-4 max-w-md mx-auto">
            {[
              { num: 1, title: 'Informasi Usaha' },
              { num: 2, title: 'Branding & Logo' },
              { num: 3, title: 'Selesai' },
            ].map((s) => (
              <div key={s.num} className="flex items-center space-x-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                    step === s.num
                      ? 'bg-teal-600 text-white ring-4 ring-teal-100'
                      : step > s.num
                      ? 'bg-teal-100 text-teal-700'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {step > s.num ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.num}
                </div>
                <span
                  className={`text-xs hidden sm:inline ${
                    step === s.num
                      ? 'text-slate-900 font-bold'
                      : step > s.num
                      ? 'text-teal-700 font-medium'
                      : 'text-slate-400'
                  }`}
                >
                  {s.title}
                </span>
                {s.num < 3 && <div className="w-6 sm:w-10 h-0.5 bg-slate-200" />}
              </div>
            ))}
          </div>
        </div>

        {/* Main Card Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center space-x-2">
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: BUSINESS INFORMATION */}
          {step === 1 && (
            <form onSubmit={handleStep1Next} className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  Langkah 1: Informasi Usaha
                </h3>
                <p className="text-xs text-slate-500">
                  Masukkan identitas toko atau warung yang akan dicetak pada struk kasir
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Nama Usaha / Warung <span className="text-teal-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Store className="w-4 h-4" />
                  </div>
                  <input
                    id="onboarding-name-input"
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Contoh: Warung Juara"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">
                  Jenis Usaha <span className="text-teal-600">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {BUSINESS_TYPE_OPTIONS.map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => setBusinessType(opt.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        businessType === opt.id
                          ? 'border-teal-600 bg-teal-50/40 ring-1 ring-teal-500'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900">{opt.label}</span>
                        {businessType === opt.id && (
                          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Nomor WhatsApp Usaha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      id="onboarding-whatsapp-input"
                      type="text"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="0812-xxxx-xxxx"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Alamat Usaha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <input
                      id="onboarding-address-input"
                      type="text"
                      value={businessAddress}
                      onChange={(e) => setBusinessAddress(e.target.value)}
                      placeholder="Jl. Sukses No. 123"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  id="btn-onboarding-step1-next"
                  type="submit"
                  className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-teal-600/20 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <span>Lanjut ke Branding</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: BRANDING & LOGO */}
          {step === 2 && (
            <form onSubmit={handleStep2Next} className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  Langkah 2: Logo & Warna Aksen (Opsional)
                </h3>
                <p className="text-xs text-slate-500">
                  Kustomisasi tampilan struk kasir dan tema visual warung Anda
                </p>
              </div>

              {/* Logo Upload Section */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700">
                  Logo Usaha (Opsional)
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/png, image/jpeg, image/jpg"
                  className="hidden"
                />

                {logo ? (
                  <div className="flex items-center space-x-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <img
                      src={logo}
                      alt="Logo Preview"
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                    />
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-800 block">
                        Logo berhasil diunggah
                      </span>
                      <div className="flex items-center space-x-3 text-xs">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="font-medium text-teal-600 hover:underline cursor-pointer"
                        >
                          Ganti Logo
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={() => setLogo(undefined)}
                          className="font-medium text-rose-600 hover:underline cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/50 hover:bg-teal-50/30 transition-all"
                  >
                    <Upload className="w-8 h-8 mx-auto text-slate-400 mb-1.5" />
                    <span className="text-xs font-semibold text-slate-700 block">
                      Klik untuk Upload Logo Toko
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Format PNG / JPG / JPEG (Maks. 3MB)
                    </span>
                  </div>
                )}
              </div>

              {/* Brand Color Selector */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-medium text-slate-700">
                  Warna Aksen Aplikasi
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PRESET_COLORS.map((col) => (
                    <button
                      key={col.hex}
                      type="button"
                      onClick={() => setBrandColor(col.hex)}
                      className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        brandColor === col.hex
                          ? 'border-teal-600 bg-teal-50/50 ring-1 ring-teal-500'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-full shadow-xs mb-1 border border-black/10"
                        style={{ backgroundColor: col.hex }}
                      />
                      <span className="text-[10px] text-slate-600 font-medium truncate w-full">
                        {col.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center space-x-1.5 text-xs text-slate-600 hover:text-slate-900 py-2.5 px-3 rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali</span>
                </button>
                <button
                  id="btn-onboarding-step2-next"
                  type="submit"
                  className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-teal-600/20 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <span>Tinjau & Selesai</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: FINISH & CONFIRMATION */}
          {step === 3 && (
            <div className="space-y-6 text-center animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto ring-8 ring-teal-50">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Setup Usaha Siap Digunakan!
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                  Semua konfigurasi dasar toko telah tersimpan ke database akun Anda. Anda siap mencatat penjualan kasir, mengelola inventaris, dan melihat pembukuan laba rugi.
                </p>
              </div>

              {/* Summary Preview Box */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left max-w-md mx-auto space-y-3">
                <div className="flex items-center space-x-3 pb-3 border-b border-slate-200">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-xs shrink-0"
                    style={{ backgroundColor: brandColor }}
                  >
                    {logo ? (
                      <img src={logo} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <Store className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{businessName}</h4>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                      {businessType}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">WhatsApp:</span>
                    <span className="text-slate-800 font-semibold">{whatsappNumber || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Alamat:</span>
                    <span className="text-slate-800 font-semibold truncate block">{businessAddress || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Ubah Kembali
                </button>
                <button
                  id="btn-onboarding-finish"
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinalSubmit}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white px-8 py-3 rounded-xl text-sm font-semibold shadow-md shadow-teal-600/20 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Mulai Kelola Usaha'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
