import React, { useState, useMemo } from 'react';
import {
  XCircle,
  Link as LinkIcon,
  Copy,
  Check,
  Lock,
  Shield,
  KeyRound,
  Edit2,
} from 'lucide-react';
import { AppUser, AppRole } from '@/types';
import { getAppLoginUrl, formatModuleAccessSummary } from '@/lib/rbac';

interface UserDetailModalProps {
  user: AppUser;
  role: AppRole;
  onClose: () => void;
  onEdit: () => void;
  onResetPassword: () => void;
  onCopyLoginLink: () => void;
}

export function UserDetailModal({
  user,
  role,
  onClose,
  onEdit,
  onResetPassword,
  onCopyLoginLink,
}: UserDetailModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const loginUrl = getAppLoginUrl();

  const accessSummary = useMemo(() => {
    return formatModuleAccessSummary(role);
  }, [role]);

  const copyToClipboard = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-xl animate-in zoom-in-95 space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm text-slate-900">{user.name}</h3>
                {user.status === 'active' ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium">
                    Aktif
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-medium">
                    Dinonaktifkan
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-teal-700 font-semibold mt-0.5">
                @{user.username} • Role: {role.name}
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

        {/* Section 1: User Account & Login Access Details */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
            <span className="font-semibold text-slate-900 flex items-center space-x-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-teal-600" />
              <span>Akses Masuk & URL Login</span>
            </span>
            <button
              type="button"
              onClick={onCopyLoginLink}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white hover:bg-teal-50 text-teal-700 border border-teal-200 font-medium text-[11px] transition-colors cursor-pointer shadow-2xs"
            >
              <Copy className="w-3 h-3" />
              <span>Salin Link Login</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <span className="text-[11px] text-slate-500 block">URL Login Aplikasi:</span>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="font-mono text-slate-900 bg-white px-2 py-1 rounded border border-slate-200 text-[11px] truncate block w-full">
                  {loginUrl}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block">Username Masuk:</span>
              <div className="flex items-center justify-between bg-white px-2 py-1 rounded border border-slate-200 mt-0.5">
                <span className="font-mono font-bold text-slate-900">@{user.username}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(user.username, 'username')}
                  className="text-slate-400 hover:text-teal-600 p-0.5 cursor-pointer"
                  title="Salin Username"
                >
                  {copiedField === 'username' ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {user.phone && (
            <div className="pt-1">
              <span className="text-[11px] text-slate-500 block">No. Telepon / WhatsApp:</span>
              <span className="text-slate-900 font-medium">{user.phone}</span>
            </div>
          )}

          {/* Credential Status & Privacy Notice */}
          <div className="mt-2 p-3 bg-white border border-slate-200 rounded-lg space-y-1.5 text-[11px]">
            <div className="flex items-center space-x-1.5 text-slate-800 font-medium">
              <Lock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>Status Kredensial: Tersimpan Aman & Terenkripsi</span>
            </div>
            <p className="text-slate-500 leading-relaxed text-[10.5px]">
              Kata sandi lama dienkripsi satu arah oleh sistem autentikasi dan tidak dapat ditampilkan kembali demi privasi dan keamanan. Untuk memberikan kata sandi baru kepada staf, gunakan tombol <strong>Reset Kata Sandi</strong>.
            </p>
          </div>
        </div>

        {/* Section 2: Access Summary per Module */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-900 flex items-center space-x-1.5">
              <Shield className="w-3.5 h-3.5 text-teal-600" />
              <span>Ringkasan Hak Akses Modul (Role: {role.name})</span>
            </span>
            <span className="text-[10px] text-slate-400">
              {role.isSystem ? 'Sistem Bawaan' : 'Kustom'}
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs divide-y divide-slate-100 max-h-56 overflow-y-auto">
            {accessSummary.map((item) => {
              let badgeColor = 'bg-slate-100 text-slate-500 border-slate-200';
              if (item.accessType === 'full') {
                badgeColor = 'bg-teal-50 text-teal-800 border-teal-200 font-semibold';
              } else if (item.accessType === 'partial') {
                badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200 font-medium';
              } else if (item.accessType === 'view_only') {
                badgeColor = 'bg-sky-50 text-sky-800 border-sky-200 font-medium';
              }

              return (
                <div key={item.module} className="p-2.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                  <div>
                    <span className="font-semibold text-slate-900 block text-xs">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-slate-500 line-clamp-1">
                      {item.description}
                    </span>
                  </div>

                  <span className={`px-2.5 py-1 rounded-lg border text-[11px] shrink-0 ml-3 ${badgeColor}`}>
                    {item.accessText}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex flex-col sm:flex-row justify-between gap-2.5 pt-3 border-t border-slate-100">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onResetPassword}
              className="px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Reset Kata Sandi</span>
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Pengguna</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer border border-slate-200"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
