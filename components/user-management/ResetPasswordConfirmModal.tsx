import React, { useState } from 'react';
import {
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import { AppUser } from '@/types';

interface ResetPasswordConfirmModalProps {
  user: AppUser;
  onClose: () => void;
  onConfirmReset: () => Promise<void>;
}

export function ResetPasswordConfirmModal({
  user,
  onClose,
  onConfirmReset,
}: ResetPasswordConfirmModalProps) {
  const [isResetting, setIsResetting] = useState(false);

  const handleConfirm = async () => {
    setIsResetting(true);
    await onConfirmReset();
    setIsResetting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl animate-in zoom-in-95 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Reset Kata Sandi Pengguna
            </h3>
            <p className="text-xs text-slate-500">
              Buat kata sandi sementara baru untuk staf
            </p>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Nama Pengguna:</span>
            <span className="text-slate-900 font-semibold">{user.name}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Username:</span>
            <span className="text-teal-700 font-mono font-bold">@{user.username}</span>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Tindakan ini akan membuat <strong>kata sandi sementara baru</strong> yang aman dan menggantikan kata sandi sebelumnya. Anda akan langsung menerima layar kredensial untuk disalin dan diserahkan kepada pengguna.
        </p>

        <div className="flex justify-end space-x-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isResetting}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 border border-slate-200 cursor-pointer"
          >
            Batal
          </button>
          <button
            id="btn-confirm-reset-password"
            type="button"
            onClick={handleConfirm}
            disabled={isResetting}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50 shadow-xs inline-flex items-center space-x-1.5"
          >
            {isResetting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Memproses Reset...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-3.5 h-3.5" />
                <span>Buat Kata Sandi Baru</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
