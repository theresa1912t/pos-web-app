'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Store,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  Building2,
} from 'lucide-react';

export function AuthView() {
  const { login } = useApp();

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('staging');
  const [loginPassword, setLoginPassword] = useState('StagingDemo2026!');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await login(loginIdentifier.trim(), loginPassword);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.error || 'Login gagal. Periksa username dan kata sandi Anda.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Terjadi gangguan koneksi autentikasi.');
    }
  };

  const fillAccount = (username: string, pass: string) => {
    setLoginIdentifier(username);
    setLoginPassword(pass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-teal-100 selection:text-teal-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-600/20">
            <Store className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Warung POS Pro
        </h2>
        <p className="mt-1 text-center text-xs sm:text-sm text-slate-500 max-w-xs mx-auto">
          Portal Masuk Internal Karyawan &amp; Manajemen
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          {/* Error notification */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Username atau Email
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="login-identifier-input"
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="Contoh: staging, kasir1, spv1"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-700">
                  Kata Sandi
                </label>
              </div>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                id="btn-login-submit"
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 shadow-md shadow-teal-600/20 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{isLoading ? 'Memvalidasi Sesi...' : 'Masuk ke Aplikasi'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Role Quick Test Selector */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="p-3.5 bg-teal-50/50 border border-teal-100 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-teal-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    Uji Masuk Cepat Antar Role
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => fillAccount('staging', 'StagingDemo2026!')}
                    className="p-2 text-left rounded-lg bg-white border border-teal-200 hover:bg-teal-50 transition-colors cursor-pointer"
                  >
                    <span className="font-semibold text-teal-900 block">Owner / Admin</span>
                    <span className="text-[10px] text-slate-500 font-mono">@staging</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillAccount('spv1', 'SpvWarung2026!')}
                    className="p-2 text-left rounded-lg bg-white border border-teal-200 hover:bg-teal-50 transition-colors cursor-pointer"
                  >
                    <span className="font-semibold text-teal-900 block">Supervisor</span>
                    <span className="text-[10px] text-slate-500 font-mono">@spv1</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillAccount('kasir1', 'KasirWarung2026!')}
                    className="p-2 text-left rounded-lg bg-white border border-teal-200 hover:bg-teal-50 transition-colors cursor-pointer"
                  >
                    <span className="font-semibold text-teal-900 block">Kasir</span>
                    <span className="text-[10px] text-slate-500 font-mono">@kasir1</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillAccount('finance1', 'FinanceWarung2026!')}
                    className="p-2 text-left rounded-lg bg-white border border-teal-200 hover:bg-teal-50 transition-colors cursor-pointer"
                  >
                    <span className="font-semibold text-teal-900 block">Finance / Akuntan</span>
                    <span className="text-[10px] text-slate-500 font-mono">@finance1</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillAccount('gudang1', 'GudangWarung2026!')}
                    className="col-span-2 p-2 text-left rounded-lg bg-white border border-teal-200 hover:bg-teal-50 transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-teal-900 block">Staff Gudang</span>
                      <span className="text-[10px] text-slate-500 font-mono">@gudang1</span>
                    </div>
                    <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">Landing: Inventori</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 text-center">
              <p className="text-[11px] text-slate-400">
                Sistem Internal Klien — Akun dibuat &amp; dikelola terpusat oleh Owner melalui menu Manajemen Pengguna.
              </p>
            </div>
          </form>
        </div>

        {/* Security & Authentication Info */}
        <p className="mt-4 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Sistem Akses Terproteksi Berbasis Peran (RBAC)</span>
        </p>
      </div>
    </div>
  );
}
