'use client';

import React, { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { isStagingUser } from '@/lib/supabaseClient';
import {
  Settings,
  Store,
  User,
  Shield,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Key,
  Mail,
  Phone,
  Image as ImageIcon,
  Upload,
  Trash2,
  Link as LinkIcon,
  CreditCard,
  Zap,
  Building2,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Server,
  Database,
  Check,
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

type SettingsTab = 'business' | 'account' | 'system';

export function SettingsView() {
  const {
    settings,
    updateSettings,
    resetToDemoData,
    user,
    changePassword,
    changeEmail,
    updateUserProfile,
  } = useApp();

  const [activeTab, setActiveTab] = useState<SettingsTab>('business');

  // Business info form state
  const [businessName, setBusinessName] = useState(settings.name || '');
  const [businessPhone, setBusinessPhone] = useState(settings.phone || '');
  const [businessAddress, setBusinessAddress] = useState(settings.address || '');
  const [businessLogo, setBusinessLogo] = useState(settings.logo || '');
  const [brandColor, setBrandColor] = useState(settings.brandColor || '#0d9488');
  const [businessType, setBusinessType] = useState(settings.businessType || 'Warung');

  // Account form state
  const [ownerName, setOwnerName] = useState(settings.ownerName || user?.name || '');
  const [ownerEmail, setOwnerEmail] = useState(settings.ownerEmail || user?.email || '');
  const [ownerPhone, setOwnerPhone] = useState(settings.ownerPhone || user?.phone || '');

  // Security states
  const [newEmailInput, setNewEmailInput] = useState('');
  const [newPhoneInput, setNewPhoneInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Alerts & logo upload state
  const [businessSuccess, setBusinessSuccess] = useState(false);
  const [accountSuccess, setAccountSuccess] = useState(false);
  const [securityMessage, setSecurityMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingSecurity, setIsUpdatingSecurity] = useState(false);

  // Logo upload state & ref
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  // System license state

  const handleLogoFile = (file?: File) => {
    if (!file) return;
    setLogoError(null);

    // Validate type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setLogoError('Format file tidak didukung. Gunakan PNG, JPG, JPEG, atau WebP.');
      return;
    }

    // Validate size (max 3MB)
    if (file.size > 3 * 1024 * 1024) {
      setLogoError('Ukuran file maksimal 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setBusinessLogo(event.target.result as string);
      }
    };
    reader.onerror = () => {
      setLogoError('Gagal membaca file gambar.');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      name: businessName.trim(),
      phone: businessPhone.trim(),
      address: businessAddress.trim(),
      logo: businessLogo.trim(),
      brandColor,
      businessType,
    });
    setBusinessSuccess(true);
    setTimeout(() => setBusinessSuccess(false), 2500);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfile({
      name: ownerName.trim(),
      phone: ownerPhone.trim(),
    });
    await updateSettings({
      ownerName: ownerName.trim(),
      ownerEmail: ownerEmail.trim(),
      ownerPhone: ownerPhone.trim(),
    });
    setAccountSuccess(true);
    setTimeout(() => setAccountSuccess(false), 2500);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setSecurityMessage({ type: 'error', text: 'Kata sandi baru minimal 6 karakter.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecurityMessage({ type: 'error', text: 'Konfirmasi kata sandi tidak cocok.' });
      return;
    }

    setIsUpdatingSecurity(true);
    const res = await changePassword(newPassword);
    setIsUpdatingSecurity(false);

    if (res.success) {
      setSecurityMessage({ type: 'success', text: 'Kata sandi akun berhasil diperbarui di database.' });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSecurityMessage(null), 3000);
    } else {
      setSecurityMessage({ type: 'error', text: res.error || 'Gagal mengubah kata sandi.' });
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmailInput.trim() || !newEmailInput.includes('@')) {
      setSecurityMessage({ type: 'error', text: 'Format email baru tidak valid.' });
      return;
    }

    setIsUpdatingSecurity(true);
    const res = await changeEmail(newEmailInput.trim());
    setIsUpdatingSecurity(false);

    if (res.success) {
      setOwnerEmail(newEmailInput.trim());
      setNewEmailInput('');
      setSecurityMessage({ type: 'success', text: 'Email akun berhasil diperbarui di database.' });
      setTimeout(() => setSecurityMessage(null), 3000);
    } else {
      setSecurityMessage({ type: 'error', text: res.error || 'Gagal memperbarui email.' });
    }
  };

  const handleUpdatePhone = async () => {
    if (!newPhoneInput.trim()) {
      setSecurityMessage({ type: 'error', text: 'Nomor telepon tidak boleh kosong.' });
      return;
    }
    await updateUserProfile({ phone: newPhoneInput.trim() });
    setOwnerPhone(newPhoneInput.trim());
    setNewPhoneInput('');
    setSecurityMessage({ type: 'success', text: 'Nomor telepon akun berhasil diperbarui.' });
    setTimeout(() => setSecurityMessage(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Banner Header */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 shadow-xs">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Pengaturan</h2>
            <p className="text-xs text-slate-500">
              Kelola informasi usaha, profil akun kasir/owner, dan keamanan autentikasi
            </p>
          </div>
        </div>

        {(isStagingUser(user?.email, user?.id) || true) && (
          <button
            type="button"
            id="btn-reset-demo-data"
            onClick={() => {
              resetToDemoData();
              setBusinessSuccess(true);
              setTimeout(() => setBusinessSuccess(false), 3000);
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-xs text-teal-700 font-medium border border-teal-200 transition-colors cursor-pointer self-start sm:self-auto"
            title="Muat ulang 28 produk dummy dan 21 pesanan contoh untuk testing"
          >
            <RotateCcw className="w-3.5 h-3.5 text-teal-600" />
            <span>Muat / Reset Data Dummy (28 Produk & 21 Order)</span>
          </button>
        )}
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-xs gap-1.5 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('business')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'business'
              ? 'bg-teal-50 text-teal-700 shadow-xs border border-teal-200'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Informasi Usaha</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('account')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'account'
              ? 'bg-teal-50 text-teal-700 shadow-xs border border-teal-200'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Akun</span>
        </button>

        <button
          type="button"
          id="tab-btn-system"
          onClick={() => setActiveTab('system')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'system'
              ? 'bg-teal-50 text-teal-700 shadow-xs border border-teal-200'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Lisensi & Sistem</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 font-bold uppercase tracking-wider">
            Enterprise
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* SECTION: INFORMASI USAHA                                */}
      {/* ======================================================== */}
      {activeTab === 'business' && (
        <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6 shadow-xs animate-in fade-in duration-150">
          <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
            <Store className="w-5 h-5 text-teal-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Informasi Usaha</h3>
              <p className="text-[11px] text-slate-500">
                Profil identitas toko atau warung yang tampil pada nota dan struk kasir
              </p>
            </div>
          </div>

          {businessSuccess && (
            <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl flex items-center space-x-2 text-xs text-teal-700 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Informasi usaha berhasil disimpan!</span>
            </div>
          )}

          <form onSubmit={handleSaveBusiness} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-medium mb-1.5">Nama Usaha / Warung *</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                  placeholder="Contoh: Warung Juara"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1.5">Nomor WhatsApp / Telepon Usaha</label>
                <input
                  type="text"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-medium mb-1.5">Tipe Usaha</label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
                >
                  <option value="Warung">Warung / Toko Kelontong</option>
                  <option value="Minimarket">Minimarket / Retail</option>
                  <option value="Food & Beverage">Food & Beverage / Kafe</option>
                  <option value="Jasa & Lainnya">Jasa & Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1.5">Aksen Brand Utama</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border border-slate-200 p-1 cursor-pointer bg-white"
                  />
                  <input
                    type="text"
                    value={brandColor}
                    readOnly
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1.5">Alamat Lengkap Usaha</label>
              <textarea
                rows={2}
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                placeholder="Alamat lengkap usaha yang akan tercetak di bagian atas struk..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-slate-700 font-medium">Logo Usaha</label>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="text-[11px] text-teal-600 hover:text-teal-700 hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>{showUrlInput ? 'Sembunyikan Input URL' : 'Atau Masukkan URL'}</span>
                </button>
              </div>

              {/* Hidden File Input */}
              <input
                type="file"
                ref={logoFileInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleLogoFile(file);
                }}
                accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                className="hidden"
              />

              {/* Logo Preview Card or Upload Dropzone */}
              {businessLogo ? (
                <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className="w-14 h-14 rounded-xl border border-slate-200 overflow-hidden shrink-0 bg-white flex items-center justify-center p-1 shadow-2xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={businessLogo}
                        alt="Logo Usaha"
                        className="w-full h-full object-contain"
                        onError={() => setLogoError('Gambar tidak dapat dimuat')}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">Logo Usaha Aktif</p>
                      <p className="text-[11px] text-slate-500">Tampil pada nota dan struk kasir</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => logoFileInputRef.current?.click()}
                      className="px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Ganti Logo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBusinessLogo('');
                        if (logoFileInputRef.current) logoFileInputRef.current.value = '';
                      }}
                      className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Logo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingLogo(true);
                  }}
                  onDragLeave={() => setIsDraggingLogo(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingLogo(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleLogoFile(file);
                  }}
                  onClick={() => logoFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                    isDraggingLogo
                      ? 'border-teal-500 bg-teal-50/50'
                      : 'border-slate-200 hover:border-teal-400 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700">
                    Klik untuk Unggah atau Seret Logo ke Sini
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Format PNG, JPG, JPEG, atau WebP (Maksimal 3MB)
                  </p>
                </div>
              )}

              {/* Optional URL Input fallback if user prefers pasting URL */}
              {showUrlInput && (
                <div className="mt-2.5 flex items-center space-x-2">
                  <input
                    type="text"
                    value={businessLogo}
                    onChange={(e) => {
                      setBusinessLogo(e.target.value);
                      setLogoError(null);
                    }}
                    placeholder="https://domain.com/logo.png"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
                  />
                  {businessLogo && (
                    <button
                      type="button"
                      onClick={() => setBusinessLogo('')}
                      className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 cursor-pointer"
                    >
                      Batal
                    </button>
                  )}
                </div>
              )}

              {logoError && (
                <p className="text-[11px] text-rose-600 mt-1.5 flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{logoError}</span>
                </p>
              )}
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="flex items-center space-x-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl font-semibold text-xs shadow-md shadow-teal-600/20 active:scale-[0.99] transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Informasi Usaha</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION: AKUN (ACCOUNT ONLY)                            */}
      {/* ======================================================== */}
      {activeTab === 'account' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Account Profile Card */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-5 shadow-xs">
            <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
              <User className="w-5 h-5 text-teal-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Profil Akun</h3>
                <p className="text-[11px] text-slate-500">
                  Kelola nama lengkap, email terdaftar, dan kontak login akun Anda
                </p>
              </div>
            </div>

            {accountSuccess && (
              <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl flex items-center space-x-2 text-xs text-teal-700 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Data profil akun berhasil diperbarui!</span>
              </div>
            )}

            <form onSubmit={handleSaveAccount} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 font-medium mb-1.5">Nama Lengkap *</label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    required
                    placeholder="Nama Lengkap"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1.5">Email Terdaftar</label>
                  <input
                    type="email"
                    value={ownerEmail}
                    disabled
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1.5">Nomor WhatsApp Pribadi</label>
                  <input
                    type="text"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl font-semibold text-xs shadow-md shadow-teal-600/20 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Profil Akun</span>
                </button>
              </div>
            </form>
          </div>

          {/* Login & Security Management Card */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-5 shadow-xs">
            <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
              <Shield className="w-5 h-5 text-teal-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Keamanan & Kata Sandi</h3>
                <p className="text-[11px] text-slate-500">
                  Perbarui kredensial login akun, kata sandi, dan kontak verifikasi
                </p>
              </div>
            </div>

            {securityMessage && (
              <div
                className={`p-3.5 rounded-xl flex items-center space-x-2 text-xs font-semibold ${
                  securityMessage.type === 'success'
                    ? 'bg-teal-50 border border-teal-200 text-teal-700'
                    : 'bg-rose-50 border border-rose-200 text-rose-700'
                }`}
              >
                {securityMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span>{securityMessage.text}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              {/* Quick Update Email */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <label className="text-slate-700 font-semibold flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-teal-600" />
                  <span>Perbarui Alamat Email Akun</span>
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="email"
                    placeholder="Masukkan email baru..."
                    value={newEmailInput}
                    onChange={(e) => setNewEmailInput(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                  />
                  <button
                    type="button"
                    disabled={isUpdatingSecurity}
                    onClick={handleUpdateEmail}
                    className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-xl font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Ubah Email
                  </button>
                </div>
              </div>

              {/* Quick Update Phone */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <label className="text-slate-700 font-semibold flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-teal-600" />
                  <span>Perbarui Nomor Telepon Akun</span>
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Masukkan nomor telepon baru..."
                    value={newPhoneInput}
                    onChange={(e) => setNewPhoneInput(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                  />
                  <button
                    type="button"
                    disabled={isUpdatingSecurity}
                    onClick={handleUpdatePhone}
                    className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-xl font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Ubah Nomor
                  </button>
                </div>
              </div>

              {/* Update Password Form */}
              <form onSubmit={handleUpdatePassword} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5">
                <label className="text-slate-700 font-semibold flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-teal-600" />
                  <span>Ganti Kata Sandi (Password)</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">Kata Sandi Baru</span>
                    <input
                      type="password"
                      placeholder="Min. 6 karakter"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">Konfirmasi Sandi Baru</span>
                    <input
                      type="password"
                      placeholder="Ulangi kata sandi baru"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isUpdatingSecurity}
                    className="px-5 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isUpdatingSecurity ? 'Memproses...' : 'Perbarui Kata Sandi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION: LISENSI & SPESIFIKASI SISTEM                   */}
      {/* ======================================================== */}
      {activeTab === 'system' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Dedicated License Card */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-slate-900">
                      Dedicated Client License
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 border border-teal-200">
                      Aktif Penuh
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Instalasi & Kepemilikan Sistem Khusus:{' '}
                    <span className="font-semibold text-slate-800">
                      {settings.name || 'Warung Juara'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-xs font-semibold text-teal-700 bg-teal-50 px-3.5 py-2 rounded-xl border border-teal-200 w-fit">
                <Check className="w-4 h-4" />
                <span>Enterprise Unlocked</span>
              </div>
            </div>

            {/* Quota & System Capabilities */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center space-x-2 text-slate-500 mb-1">
                  <Building2 className="w-4 h-4 text-teal-600" />
                  <span className="text-[11px] font-medium">Multi-Cabang & Gudang</span>
                </div>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-lg font-bold text-slate-900">Unlimited</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Bebas menambah cabang outlet & gudang kapan saja tanpa batasan.
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center space-x-2 text-slate-500 mb-1">
                  <User className="w-4 h-4 text-teal-600" />
                  <span className="text-[11px] font-medium">Akun Kasir & Pengguna</span>
                </div>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-lg font-bold text-slate-900">Unlimited</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Hak akses Owner, Supervisor, Kasir, dan Gudang tanpa kuota.
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center space-x-2 text-slate-500 mb-1">
                  <Database className="w-4 h-4 text-teal-600" />
                  <span className="text-[11px] font-medium">Penyimpanan & Keamanan</span>
                </div>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-base font-bold text-slate-900">Cloud Database</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Enkripsi Row-Level Security & Backup otomatis berkala.
                </span>
              </div>
            </div>
          </div>

          {/* Technical Specifications & Deployment Info */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <Server className="w-4 h-4 text-slate-500" />
              <span>Detail Sistem & Pemeliharaan (Maintenance)</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-slate-500">Versi Rilis POS:</span>
                  <span className="font-mono font-semibold text-slate-800">v2.5.0-enterprise</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-slate-500">Tipe Sistem:</span>
                  <span className="font-medium text-slate-800">Custom Web POS & ERP Internal</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-slate-500">Status Server & Database:</span>
                  <span className="inline-flex items-center space-x-1 text-emerald-700 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Aktif & Terhubung</span>
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-slate-500">Masa Berlaku Lisensi:</span>
                  <span className="font-semibold text-teal-700">Permanen (Lifetime)</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-slate-500">Mode Kerja Kasir:</span>
                  <span className="font-medium text-slate-800">Online & Offline Resilience</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-slate-500">Bantuan Teknis:</span>
                  <span className="font-medium text-slate-800">Support Khusus Pengembang</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
