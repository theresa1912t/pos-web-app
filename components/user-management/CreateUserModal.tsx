import React, { useState, useMemo } from 'react';
import {
  UserPlus,
  XCircle,
  AlertCircle,
  Shield,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { AppUser, AppRole } from '@/types';
import { generateUsername, generateSecurePassword } from '@/lib/rbac';

interface CreateUserModalProps {
  roles: AppRole[];
  onClose: () => void;
  onCreateSuccess: (user: AppUser, tempPass: string) => void;
}

export function CreateUserModal({
  roles,
  onClose,
  onCreateSuccess,
}: CreateUserModalProps) {
  const { createUser, users } = useApp();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [roleId, setRoleId] = useState(roles[0]?.id || 'role-kasir');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState(() => generateSecurePassword(8));
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const existingUsernames = useMemo(() => users.map((u) => u.username), [users]);

  // Auto suggest username when typing name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!username || username === generateUsername(name, existingUsernames)) {
      setUsername(generateUsername(val, existingUsernames));
    }
  };

  const handleRegeneratePassword = () => {
    setPassword(generateSecurePassword(8));
  };

  const selectedRole = useMemo(() => {
    return roles.find((r) => r.id === roleId) || roles[0];
  }, [roles, roleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanName = name.trim();
    const cleanUsername = username.trim().toLowerCase();

    if (!cleanName) {
      setErrorMsg('Nama lengkap karyawan / staf tidak boleh kosong');
      return;
    }
    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMsg('Username login minimal 3 karakter');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createUser({
        name: cleanName,
        username: cleanUsername,
        roleId,
        phone,
        password: password,
      });

      setIsSubmitting(false);
      if (res.success && res.user) {
        onCreateSuccess(res.user, res.generatedPassword || password);
      } else {
        setErrorMsg(res.error || 'Gagal menambahkan pengguna baru.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err?.message || 'Terjadi kesalahan sistem.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl animate-in zoom-in-95 space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Tambah Pengguna Baru
              </h3>
              <p className="text-[11px] text-slate-500">
                Kredensial dan link login akan disiapkan setelah pembuatan akun
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

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Nama Lengkap Karyawan / Staf *
            </label>
            <input
              id="new-user-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Contoh: Rina Kasir Pagi"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Username Masuk (Login ID) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-slate-400">
                @
              </span>
              <input
                id="new-user-username-input"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                placeholder="rinakasir"
                className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
              />
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Digunakan staf untuk masuk ke aplikasi (tanpa memerlukan alamat email eksternal).
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Penugasan Role *
              </label>
              <select
                id="new-user-role-select"
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
                No. WhatsApp / Telepon (Opsional)
              </label>
              <input
                id="new-user-phone-input"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08123456789"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Role Preview Card */}
          {selectedRole && (
            <div className="p-3 bg-teal-50/60 border border-teal-200 rounded-xl space-y-1">
              <div className="flex items-center space-x-1.5 text-teal-800 font-semibold text-[11px]">
                <Shield className="w-3.5 h-3.5 text-teal-600" />
                <span>Hak Akses Role: {selectedRole.name}</span>
              </div>
              <p className="text-[11px] text-slate-600">
                {selectedRole.description || 'Akses modul sesuai konfigurasi role.'}
              </p>
            </div>
          )}

          {/* Generated Password Section */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-medium text-slate-700">
                Kata Sandi Sementara Awal *
              </label>
              <button
                type="button"
                onClick={handleRegeneratePassword}
                className="inline-flex items-center space-x-1 text-[11px] text-teal-700 hover:text-teal-800 font-medium cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Acak Ulang</span>
              </button>
            </div>

            <div className="relative">
              <input
                id="new-user-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-3.5 pr-10 py-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-teal-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              Kata sandi akan ditampilkan di layar handoff agar dapat Anda salin dan serahkan kepada staf.
            </p>
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
              id="btn-submit-create-user"
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-semibold cursor-pointer disabled:opacity-50 shadow-xs inline-flex items-center space-x-1.5"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan Akun...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Buat Pengguna & Lihat Kredensial</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
