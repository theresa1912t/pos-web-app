import React, { useState } from 'react';
import {
  Edit2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { AppUser, AppRole, UserStatus } from '@/types';

interface EditUserModalProps {
  user: AppUser;
  roles: AppRole[];
  onClose: () => void;
  onUpdateSuccess: () => void;
}

export function EditUserModal({
  user,
  roles,
  onClose,
  onUpdateSuccess,
}: EditUserModalProps) {
  const { updateUser } = useApp();

  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const [roleId, setRoleId] = useState(user.roleId);
  const [phone, setPhone] = useState(user.phone || '');
  const [status, setStatus] = useState<UserStatus>(user.status);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanName = name.trim();
    const cleanUsername = username.trim().toLowerCase();

    if (!cleanName) {
      setErrorMsg('Nama lengkap tidak boleh kosong');
      return;
    }
    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMsg('Username minimal 3 karakter');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateUser(user.id, {
        name: cleanName,
        username: cleanUsername,
        roleId,
        phone,
        status,
      });

      setIsSubmitting(false);
      if (res.success) {
        onUpdateSuccess();
      } else {
        setErrorMsg(res.error || 'Gagal memperbarui pengguna.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err?.message || 'Terjadi kesalahan sistem.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl animate-in zoom-in-95 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Edit2 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">
              Edit Pengguna @{user.username}
            </h3>
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

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Nama Lengkap *
            </label>
            <input
              id="edit-user-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Username Masuk *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-slate-400">
                @
              </span>
              <input
                id="edit-user-username-input"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Role Ditugaskan *
              </label>
              <select
                id="edit-user-role-select"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white cursor-pointer"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Status Akun *
              </label>
              <select
                id="edit-user-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as UserStatus)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white cursor-pointer"
              >
                <option value="active">Aktif</option>
                <option value="disabled">Dinonaktifkan</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              No. Telepon / WhatsApp
            </label>
            <input
              id="edit-user-phone-input"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08123456789"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex justify-end space-x-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 border border-slate-200 cursor-pointer"
            >
              Batal
            </button>
            <button
              id="btn-submit-edit-user"
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-semibold cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
