import React, { useState } from 'react';
import {
  Shield,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { AppRole, AppModule } from '@/types';
import { MODULE_LABELS, MODULE_DESCRIPTIONS } from '@/lib/rbac';

interface RoleEditorModalProps {
  role: AppRole | null;
  onClose: () => void;
  onSaveSuccess: (name: string) => void;
}

export function RoleEditorModal({
  role,
  onClose,
  onSaveSuccess,
}: RoleEditorModalProps) {
  const { createRole, updateRole } = useApp();

  const isEditing = Boolean(role);
  const isSystemRole = Boolean(role?.isSystem);

  const [name, setName] = useState(role?.name || '');
  const [description, setDescription] = useState(role?.description || '');
  const [permissions, setPermissions] = useState<Record<AppModule, { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }>>(
    () => {
      if (role?.permissions) {
        return JSON.parse(JSON.stringify(role.permissions));
      }
      const initial: any = {};
      (Object.keys(MODULE_LABELS) as AppModule[]).forEach((mod) => {
        initial[mod] = {
          canView: false,
          canCreate: false,
          canEdit: false,
          canDelete: false,
        };
      });
      return initial;
    }
  );

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const togglePermission = (mod: AppModule, action: 'canView' | 'canCreate' | 'canEdit' | 'canDelete') => {
    if (isSystemRole) return;
    setPermissions((prev) => {
      const current = prev[mod] || { canView: false, canCreate: false, canEdit: false, canDelete: false };
      const updated = { ...current, [action]: !current[action] };
      if (action !== 'canView' && updated[action] && !updated.canView) {
        updated.canView = true;
      }
      if (action === 'canView' && !updated.canView) {
        updated.canCreate = false;
        updated.canEdit = false;
        updated.canDelete = false;
      }
      return { ...prev, [mod]: updated };
    });
  };

  const handleSelectAll = (val: boolean) => {
    if (isSystemRole) return;
    const updated: any = {};
    (Object.keys(MODULE_LABELS) as AppModule[]).forEach((mod) => {
      updated[mod] = {
        canView: val,
        canCreate: val,
        canEdit: val,
        canDelete: val,
      };
    });
    setPermissions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSystemRole) {
      onClose();
      return;
    }

    if (!name.trim()) {
      setErrorMsg('Nama role tidak boleh kosong.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (isEditing && role) {
        const res = await updateRole(role.id, {
          name: name.trim(),
          description: description.trim(),
          permissions,
        });
        setIsSubmitting(false);
        if (res.success) {
          onSaveSuccess(name.trim());
        } else {
          setErrorMsg(res.error || 'Gagal memperbarui role.');
        }
      } else {
        const createdRole = await createRole({
          name: name.trim(),
          description: description.trim(),
          permissions,
        });
        setIsSubmitting(false);
        if (createdRole && createdRole.id) {
          onSaveSuccess(name.trim());
        } else {
          setErrorMsg('Gagal membuat role baru.');
        }
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err?.message || 'Terjadi kesalahan sistem.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-xl animate-in zoom-in-95 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                {isEditing && role ? (isSystemRole ? `Role Sistem: ${role.name}` : `Edit Role: ${role.name}`) : 'Buat Role Kustom Baru'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Tentukan hak akses melihat, membuat, mengubah, dan menghapus untuk setiap modul
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
              Nama Role *
            </label>
            <input
              id="role-name-input"
              type="text"
              required
              disabled={isSystemRole}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Supervisor Toko"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors disabled:bg-slate-100 disabled:text-slate-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Deskripsi Singkat Role
            </label>
            <input
              id="role-description-input"
              type="text"
              disabled={isSystemRole}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Bertanggung jawab atas penjualan kasir dan pengecekan stok"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors disabled:bg-slate-100 disabled:text-slate-500"
            />
          </div>

          {/* Permissions Matrix */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900">
                Matriks Hak Akses Modul:
              </span>
              {!isSystemRole && (
                <div className="flex items-center space-x-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleSelectAll(true)}
                    className="text-teal-700 hover:text-teal-800 font-medium cursor-pointer"
                  >
                    Centang Semua
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(false)}
                    className="text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    Hapus Semua
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Modul Sistem</th>
                      <th className="px-3 py-2.5 text-center">Lihat (View)</th>
                      <th className="px-3 py-2.5 text-center">Buat (Create)</th>
                      <th className="px-3 py-2.5 text-center">Ubah (Edit)</th>
                      <th className="px-3 py-2.5 text-center">Hapus (Delete)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {(Object.keys(MODULE_LABELS) as AppModule[]).map((mod) => {
                      const p = permissions[mod] || {
                        canView: false,
                        canCreate: false,
                        canEdit: false,
                        canDelete: false,
                      };

                      return (
                        <tr key={mod} className="hover:bg-slate-50/70">
                          <td className="px-4 py-2.5">
                            <span className="font-semibold text-slate-900 block">
                              {MODULE_LABELS[mod]}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {MODULE_DESCRIPTIONS[mod]}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <input
                              type="checkbox"
                              disabled={isSystemRole}
                              checked={p.canView}
                              onChange={() => togglePermission(mod, 'canView')}
                              className="accent-teal-600 w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
                            />
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <input
                              type="checkbox"
                              disabled={isSystemRole}
                              checked={p.canCreate}
                              onChange={() => togglePermission(mod, 'canCreate')}
                              className="accent-teal-600 w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
                            />
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <input
                              type="checkbox"
                              disabled={isSystemRole}
                              checked={p.canEdit}
                              onChange={() => togglePermission(mod, 'canEdit')}
                              className="accent-teal-600 w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
                            />
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <input
                              type="checkbox"
                              disabled={isSystemRole}
                              checked={p.canDelete}
                              onChange={() => togglePermission(mod, 'canDelete')}
                              className="accent-teal-600 w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 border border-slate-200 cursor-pointer"
            >
              {isSystemRole ? 'Tutup' : 'Batal'}
            </button>
            {!isSystemRole && (
              <button
                id="btn-submit-role"
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-semibold cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Role'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
