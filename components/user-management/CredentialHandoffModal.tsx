import React, { useState } from 'react';
import {
  Sparkles,
  XCircle,
  Shield,
  KeyRound,
  Copy,
  Check,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react';
import { AppUser } from '@/types';
import { getAppLoginUrl, formatCredentialsText } from '@/lib/rbac';

interface CredentialHandoffData {
  user: AppUser;
  roleName: string;
  temporaryPassword: string;
  isNewUser: boolean;
}

interface CredentialHandoffModalProps {
  data: CredentialHandoffData;
  onClose: () => void;
}

export function CredentialHandoffModal({
  data,
  onClose,
}: CredentialHandoffModalProps) {
  const [showPassword, setShowPassword] = useState(true);
  const [copiedType, setCopiedType] = useState<'all' | 'link' | 'username' | 'password' | null>(null);

  const loginUrl = getAppLoginUrl();

  const handleCopy = (type: 'all' | 'link' | 'username' | 'password') => {
    let textToCopy = '';
    if (type === 'all') {
      textToCopy = formatCredentialsText({
        loginUrl,
        username: data.user.username,
        password: data.temporaryPassword,
        name: data.user.name,
        roleName: data.roleName,
      });
    } else if (type === 'link') {
      textToCopy = loginUrl;
    } else if (type === 'username') {
      textToCopy = data.user.username;
    } else if (type === 'password') {
      textToCopy = data.temporaryPassword;
    }

    navigator.clipboard.writeText(textToCopy);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-xs">
      <div className="bg-white border border-teal-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header with success badge */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 border border-teal-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-slate-900">
                  {data.isNewUser ? 'Akun Pengguna Berhasil Dibuat' : 'Kata Sandi Berhasil Direset'}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Serahkan informasi kredensial di bawah ini kepada staf terkait untuk masuk
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* User & Role Information Card */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3 text-xs">
          <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block text-slate-400">
            Informasi Pengguna
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <span className="text-[11px] text-slate-500 block">Nama Lengkap:</span>
              <span className="font-semibold text-slate-900 block">{data.user.name}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Username:</span>
              <span className="font-mono font-bold text-teal-700 block">@{data.user.username}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Role Ditugaskan:</span>
              <span className="inline-flex items-center space-x-1 font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px] mt-0.5">
                <Shield className="w-3 h-3 text-teal-600" />
                <span>{data.roleName}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Login Access Credentials Box */}
        <div className="bg-teal-50/50 rounded-xl p-4 border border-teal-200 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-teal-900 uppercase tracking-wider text-[10px] flex items-center space-x-1.5">
              <KeyRound className="w-3.5 h-3.5 text-teal-700" />
              <span>Akses Masuk (Kredensial Login)</span>
            </span>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            {/* 1. Login URL */}
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-400 block font-sans font-medium">Link Login Aplikasi:</span>
                <span className="text-xs text-slate-900 truncate block font-sans font-medium">{loginUrl}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('link')}
                className="shrink-0 px-2.5 py-1 rounded bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 text-[11px] font-sans font-medium transition-colors cursor-pointer flex items-center space-x-1"
                title="Salin Link Login"
              >
                {copiedType === 'link' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-slate-400" />
                    <span>Salin Link</span>
                  </>
                )}
              </button>
            </div>

            {/* 2. Username */}
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] text-slate-400 block font-sans font-medium">Username:</span>
                <span className="text-xs font-bold text-slate-900">@{data.user.username}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('username')}
                className="shrink-0 px-2.5 py-1 rounded bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 text-[11px] font-sans font-medium transition-colors cursor-pointer flex items-center space-x-1"
                title="Salin Username"
              >
                {copiedType === 'username' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-slate-400" />
                    <span>Salin</span>
                  </>
                )}
              </button>
            </div>

            {/* 3. Password */}
            <div className="bg-white p-2.5 rounded-lg border border-teal-200 flex items-center justify-between gap-2 shadow-2xs">
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block font-sans font-medium">Kata Sandi Sementara:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-teal-900 tracking-wider">
                    {showPassword ? data.temporaryPassword : '••••••••••••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('password')}
                className="shrink-0 px-2.5 py-1 rounded bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-[11px] font-sans font-medium transition-colors cursor-pointer flex items-center space-x-1"
                title="Salin Password"
              >
                {copiedType === 'password' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-teal-600" />
                    <span>Salin Sandi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Security Warning Callout */}
        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-900 text-[11px] flex items-start space-x-2 leading-relaxed">
          <Lock className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <span>
            <strong>Pemberitahuan Keamanan:</strong> Kata sandi sementara ini hanya ditampilkan <strong>satu kali</strong> pada layar ini. Setelah modal ini ditutup, kata sandi disimpan terenkripsi dan tidak dapat dilihat kembali. Pastikan Anda menyalin atau menyerahkan kredensial sekarang.
          </span>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-100">
          <button
            id="btn-copy-all-credentials"
            type="button"
            onClick={() => handleCopy('all')}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs flex items-center justify-center space-x-2"
          >
            {copiedType === 'all' ? (
              <>
                <Check className="w-4 h-4" />
                <span>Kredensial Lengkap Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Salin Kredensial Lengkap</span>
              </>
            )}
          </button>

          <button
            id="btn-close-credential-handoff"
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer border border-slate-200"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
