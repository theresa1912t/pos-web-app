import React, { useState } from 'react';
import {
  UserCog,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { AppUser, AppRole } from '@/types';

interface ChangeRoleModalProps {
  user: AppUser;
  roles: AppRole[];
  onClose: () => void;
  onSuccess: (newRoleName: string) => void;
}

export function ChangeRoleModal({
  user,
  roles,
  onClose,
  onSuccess,
}: ChangeRoleModalProps) {
  const { updateUser } = useApp();
  const [selectedRoleId, setSelectedRoleId] = useState(user.roleId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await updateUser(user.id, { roleId: selectedRoleId });
      setIsSubmitting(false);
      if (res.success) {
        const rName = roles.find((r) => r.id === selectedRoleId)?.name || 'Baru';
        onSuccess(rName);
      } else {
        setErrorMsg(res.error || 'Gagal mengubah role.');
      }
    } catch (e: any) {
      setIsSubmitting(false);
      setErrorMsg(e?.message || 'Terjadi kesalahan sistem.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl animate-in zoom-in-95 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <UserCog className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Ubah Role Pengguna
              </h3>
              <p className="text-xs text-slate-500">
                {user.name} (@{user.username})
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

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-3 text-xs">
          <label className="block font-medium text-slate-700">
            Pilih Role Baru:
          </label>
          <div className="space-y-2">
            {roles.map((r) => {
              const isSelected = selectedRoleId === r.id;
              return (
                <label
                  key={r.id}
                  onClick={() => setSelectedRoleId(r.id)}
                  className={`flex items-start space-x-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-teal-50/70 border-teal-300 shadow-2xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="roleSelect"
                    checked={isSelected}
                    onChange={() => setSelectedRoleId(r.id)}
                    className="accent-teal-600 mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 block">{r.name}</span>
                    <span className="text-[11px] text-slate-500 block leading-relaxed">
                      {r.description || 'Izin akses modul'}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end space-x-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 border border-slate-200 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50 shadow-xs"
          >
            {isSubmitting ? 'Menyimpan...' : 'Terapkan Role'}
          </button>
        </div>
      </div>
    </div>
  );
}
