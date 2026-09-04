'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import {
  AppRole,
  AppUser,
  AppModule,
  UserStatus,
} from '@/types';
import {
  MODULE_LABELS,
  MODULE_DESCRIPTIONS,
  DEFAULT_ROLES,
  generateUsername,
  generateSecurePassword,
  getAppLoginUrl,
  formatModuleAccessSummary,
  formatCredentialsText,
} from '@/lib/rbac';
import {
  Users,
  Shield,
  UserPlus,
  ShieldPlus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  KeyRound,
  Edit2,
  Trash2,
  Eye,
  Copy,
  Check,
  AlertCircle,
  UserCheck,
  UserX,
  Phone,
  Link as LinkIcon,
  RefreshCw,
  ExternalLink,
  Lock,
  UserCog,
  CheckCircle,
  EyeOff,
  Sparkles,
} from 'lucide-react';

export function UserManagementView() {
  const {
    roles,
    users,
    user: currentActiveUser,
    deleteRole,
    toggleUserStatus,
    resetUserPassword,
  } = useApp();

  // Active section tab: 'users' or 'roles'
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'roles'>('users');

  // Search and filter state
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  const [roleSearchQuery, setRoleSearchQuery] = useState('');

  // Modals state
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [quickRoleUser, setQuickRoleUser] = useState<AppUser | null>(null);
  const [userDetailUser, setUserDetailUser] = useState<AppUser | null>(null);
  const [resetPasswordTargetUser, setResetPasswordTargetUser] = useState<AppUser | null>(null);

  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<AppRole | null>(null);

  // Credential handoff state (shown after creating user or resetting password)
  const [credentialHandoffData, setCredentialHandoffData] = useState<{
    user: AppUser;
    roleName: string;
    temporaryPassword: string;
    isNewUser: boolean;
  } | null>(null);

  // Global toast feedback
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedLinkUserId, setCopiedLinkUserId] = useState<string | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loginUrl = getAppLoginUrl();

  const handleCopyLoginLink = (userId?: string) => {
    navigator.clipboard.writeText(loginUrl);
    if (userId) {
      setCopiedLinkUserId(userId);
      setTimeout(() => setCopiedLinkUserId(null), 2500);
    }
    showToast('Link Login aplikasi berhasil disalin ke papan klip!');
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        (u.phone && u.phone.includes(userSearchQuery));

      const matchesRole = selectedRoleFilter === 'all' || u.roleId === selectedRoleFilter;
      const matchesStatus = selectedStatusFilter === 'all' || u.status === selectedStatusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, userSearchQuery, selectedRoleFilter, selectedStatusFilter]);

  // Filtered roles
  const filteredRoles = useMemo(() => {
    return roles.filter((r) => {
      return (
        r.name.toLowerCase().includes(roleSearchQuery.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(roleSearchQuery.toLowerCase()))
      );
    });
  }, [roles, roleSearchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-slate-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center space-x-2.5 text-xs font-medium animate-in fade-in slide-in-from-bottom-2 ${
            toastMessage.type === 'success'
              ? 'bg-white border-teal-200 text-slate-900'
              : 'bg-white border-rose-200 text-rose-700'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                Manajemen Pengguna & Akses Masuk
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola akun staf, bagikan kredensial & link login, serta atur izin hak akses per role
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="btn-copy-global-login-link"
            type="button"
            onClick={() => handleCopyLoginLink()}
            className="inline-flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 shadow-2xs transition-all cursor-pointer"
            title="Salin URL Link Login Aplikasi"
          >
            <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
            <span>Salin Link Login</span>
          </button>

          {activeSubTab === 'users' ? (
            <button
              id="btn-open-create-user-modal"
              type="button"
              onClick={() => setIsCreateUserModalOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Pengguna Baru</span>
            </button>
          ) : (
            <button
              id="btn-open-create-role-modal"
              type="button"
              onClick={() => setIsCreateRoleModalOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
            >
              <ShieldPlus className="w-4 h-4" />
              <span>Buat Role Kustom</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Switcher: Users vs Roles */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          id="tab-user-management-users"
          type="button"
          onClick={() => setActiveSubTab('users')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            activeSubTab === 'users'
              ? 'bg-teal-50 text-teal-700 border border-teal-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Daftar Pengguna ({users.length})</span>
        </button>

        <button
          id="tab-user-management-roles"
          type="button"
          onClick={() => setActiveSubTab('roles')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            activeSubTab === 'roles'
              ? 'bg-teal-50 text-teal-700 border border-teal-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Role & Hak Akses ({roles.length})</span>
        </button>
      </div>

      {/* SECTION 1: USERS LIST */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          {/* Filter, Search & Info Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="search-user-input"
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Cari nama, username, no. telepon..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
              <div className="flex items-center space-x-1.5 text-xs text-slate-600">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Role:</span>
              </div>
              <select
                id="filter-user-role-select"
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-teal-500 focus:bg-white cursor-pointer"
              >
                <option value="all">Semua Role</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>

              <select
                id="filter-user-status-select"
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-teal-500 focus:bg-white cursor-pointer"
              >
                <option value="all">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="disabled">Dinonaktifkan</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Pengguna</th>
                    <th className="px-5 py-3.5">Username</th>
                    <th className="px-5 py-3.5">Role Ditugaskan</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Akses Masuk (Login)</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-30 text-teal-600" />
                        <p className="text-xs">Tidak ada data pengguna yang sesuai.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const userRole = roles.find((r) => r.id === u.roleId) || DEFAULT_ROLES[0];
                      const isCurrentLoggedIn =
                        currentActiveUser &&
                        (currentActiveUser.id === u.id || currentActiveUser.username === u.username);

                      return (
                        <tr
                          key={u.id}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          {/* 1. Name */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center font-bold text-teal-700 shrink-0 text-xs">
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 flex items-center space-x-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setUserDetailUser(u)}
                                    className="hover:text-teal-700 transition-colors text-left cursor-pointer"
                                  >
                                    {u.name}
                                  </button>
                                  {isCurrentLoggedIn && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-teal-50 text-teal-700 border border-teal-200 font-medium">
                                      Anda
                                    </span>
                                  )}
                                </div>
                                {u.phone ? (
                                  <span className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    <span>{u.phone}</span>
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-400 block">
                                    Dibuat: {new Date(u.createdAt).toLocaleDateString('id-ID')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* 2. Username */}
                          <td className="px-5 py-3.5">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(u.username);
                                showToast(`Username @${u.username} disalin!`);
                              }}
                              className="font-mono font-medium text-slate-800 hover:text-teal-700 inline-flex items-center space-x-1 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                              title="Klik untuk salin username"
                            >
                              <span>@{u.username}</span>
                              <Copy className="w-3 h-3 text-slate-400 hover:text-teal-600" />
                            </button>
                          </td>

                          {/* 3. Role */}
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-xs font-medium text-teal-800">
                              <Shield className="w-3 h-3 text-teal-600" />
                              <span>{userRole.name}</span>
                            </span>
                          </td>

                          {/* 4. Status */}
                          <td className="px-5 py-3.5">
                            {u.status === 'active' ? (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium">
                                <UserCheck className="w-3 h-3" />
                                <span>Aktif</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-medium">
                                <UserX className="w-3 h-3" />
                                <span>Dinonaktifkan</span>
                              </span>
                            )}
                          </td>

                          {/* 5. Login Access */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => handleCopyLoginLink(u.id)}
                                className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-slate-700 hover:text-teal-800 text-[11px] font-medium transition-colors cursor-pointer shadow-2xs"
                                title={`Salin link login aplikasi: ${loginUrl}`}
                              >
                                {copiedLinkUserId === u.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span className="text-emerald-700 font-semibold">Tersalin!</span>
                                  </>
                                ) : (
                                  <>
                                    <LinkIcon className="w-3 h-3 text-slate-400" />
                                    <span>Salin Link Login</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </td>

                          {/* 6. Actions */}
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              {/* 1. View User Detail */}
                              <button
                                id={`btn-view-user-${u.id}`}
                                type="button"
                                title="Lihat Detail & Hak Akses Pengguna"
                                onClick={() => setUserDetailUser(u)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 border border-transparent hover:border-teal-200 transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* 2. Edit User */}
                              <button
                                id={`btn-edit-user-${u.id}`}
                                type="button"
                                title="Edit Data Pengguna"
                                onClick={() => setEditingUser(u)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* 3. Change Role */}
                              <button
                                id={`btn-change-role-${u.id}`}
                                type="button"
                                title="Ubah Role Pengguna"
                                onClick={() => setQuickRoleUser(u)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 border border-transparent hover:border-teal-200 transition-colors cursor-pointer"
                              >
                                <UserCog className="w-3.5 h-3.5" />
                              </button>

                              {/* 4. Reset Password */}
                              <button
                                id={`btn-reset-pass-${u.id}`}
                                type="button"
                                title="Reset / Buat Kata Sandi Baru"
                                onClick={() => setResetPasswordTargetUser(u)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 border border-transparent hover:border-teal-200 transition-colors cursor-pointer"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>

                              {/* 5. Disable / Enable Toggle */}
                              {!isCurrentLoggedIn ? (
                                <button
                                  id={`btn-toggle-status-${u.id}`}
                                  type="button"
                                  title={u.status === 'active' ? 'Nonaktifkan Pengguna' : 'Aktifkan Pengguna'}
                                  onClick={async () => {
                                    const actionText = u.status === 'active' ? 'menonaktifkan' : 'mengaktifkan';
                                    if (confirm(`Apakah Anda yakin ingin ${actionText} akun @${u.username}?`)) {
                                      const res = await toggleUserStatus(u.id);
                                      if (res.success) {
                                        showToast(`Akun @${u.username} berhasil di-${u.status === 'active' ? 'nonaktifkan' : 'aktifkan'}.`);
                                      } else {
                                        showToast(res.error || 'Gagal mengubah status akun', 'error');
                                      }
                                    }
                                  }}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    u.status === 'active'
                                      ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200'
                                      : 'text-emerald-600 hover:bg-emerald-50 border border-emerald-200'
                                  }`}
                                >
                                  {u.status === 'active' ? (
                                    <UserX className="w-3.5 h-3.5" />
                                  ) : (
                                    <UserCheck className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              ) : (
                                <div className="w-7 h-7" />
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: ROLES & PERMISSION MATRIX */}
      {activeSubTab === 'roles' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="search-role-input"
                type="text"
                value={roleSearchQuery}
                onChange={(e) => setRoleSearchQuery(e.target.value)}
                placeholder="Cari nama role..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
              />
            </div>
            <p className="text-xs text-slate-500">
              Role mendefinisikan menu dan aksi yang diizinkan untuk setiap staf usaha
            </p>
          </div>

          {/* Role Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRoles.map((role) => {
              const assignedUserCount = users.filter((u) => u.roleId === role.id).length;
              const permissions = role.permissions || {};

              return (
                <div
                  key={role.id}
                  className="bg-white border border-slate-200 shadow-xs rounded-2xl p-5 flex flex-col justify-between hover:border-slate-300 transition-colors space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
                          <Shield className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-bold text-sm text-slate-900">
                              {role.name}
                            </h3>
                            {role.isSystem && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                                Sistem Bawaan
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            {role.description || 'Tidak ada deskripsi'}
                          </p>
                        </div>
                      </div>

                      {/* Role Actions */}
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => setEditingRole(role)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-teal-700 hover:bg-teal-50 border border-transparent hover:border-teal-200 transition-colors cursor-pointer text-xs flex items-center space-x-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>{role.isSystem ? 'Lihat' : 'Edit'}</span>
                        </button>

                        {!role.isSystem && (
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm(`Hapus role "${role.name}"? Tindakan ini tidak dapat dibatalkan.`)) {
                                const res = await deleteRole(role.id);
                                if (res.success) {
                                  showToast(`Role "${role.name}" berhasil dihapus.`);
                                } else {
                                  showToast(res.error || 'Gagal menghapus role', 'error');
                                }
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Permissions Mini Summary */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <span className="text-[11px] font-semibold text-slate-500 block mb-2">
                        Izin Akses Modul:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(MODULE_LABELS).map(([modKey, modLabel]) => {
                          const p = permissions[modKey as AppModule];
                          const canView = p?.canView;
                          const canCreate = p?.canCreate;
                          const canEdit = p?.canEdit;
                          const canDelete = p?.canDelete;

                          if (!canView) {
                            return null;
                          }

                          const actionBadges = [];
                          if (canCreate) actionBadges.push('C');
                          if (canEdit) actionBadges.push('E');
                          if (canDelete) actionBadges.push('D');

                          return (
                            <span
                              key={modKey}
                              className="inline-flex items-center space-x-1 px-2 py-1 rounded-md bg-slate-50 border border-slate-200 text-[11px] text-slate-800 font-medium"
                            >
                              <span>{modLabel}</span>
                              {actionBadges.length > 0 && (
                                <span className="text-[9px] text-teal-600 font-mono font-semibold">
                                  ({actionBadges.join('')})
                                </span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <span className="flex items-center space-x-1">
                      <Users className="w-3 h-3 text-teal-600" />
                      <span>{assignedUserCount} pengguna menggunakan role ini</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE USER (with immediate Credential Handoff modal trigger) */}
      {isCreateUserModalOpen && (
        <CreateUserModal
          roles={roles}
          onClose={() => setIsCreateUserModalOpen(false)}
          onCreateSuccess={(createdUser, tempPass) => {
            setIsCreateUserModalOpen(false);
            const userRole = roles.find((r) => r.id === createdUser.roleId) || DEFAULT_ROLES[0];
            setCredentialHandoffData({
              user: createdUser,
              roleName: userRole.name,
              temporaryPassword: tempPass,
              isNewUser: true,
            });
          }}
        />
      )}

      {/* MODAL 2: USER DETAIL (with Access Summary & Credential Management) */}
      {userDetailUser && (
        <UserDetailModal
          user={userDetailUser}
          role={roles.find((r) => r.id === userDetailUser.roleId) || DEFAULT_ROLES[0]}
          onClose={() => setUserDetailUser(null)}
          onEdit={() => {
            const target = userDetailUser;
            setUserDetailUser(null);
            setEditingUser(target);
          }}
          onResetPassword={() => {
            const target = userDetailUser;
            setUserDetailUser(null);
            setResetPasswordTargetUser(target);
          }}
          onCopyLoginLink={() => handleCopyLoginLink(userDetailUser.id)}
        />
      )}

      {/* MODAL 3: EDIT USER */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          roles={roles}
          onClose={() => setEditingUser(null)}
          onUpdateSuccess={() => {
            setEditingUser(null);
            showToast('Data pengguna berhasil diperbarui!');
          }}
        />
      )}

      {/* MODAL 4: QUICK CHANGE ROLE */}
      {quickRoleUser && (
        <ChangeRoleModal
          user={quickRoleUser}
          roles={roles}
          onClose={() => setQuickRoleUser(null)}
          onSuccess={(newRoleName) => {
            setQuickRoleUser(null);
            showToast(`Role pengguna @${quickRoleUser.username} berhasil diubah menjadi ${newRoleName}!`);
          }}
        />
      )}

      {/* MODAL 5: RESET PASSWORD CONFIRMATION */}
      {resetPasswordTargetUser && (
        <ResetPasswordConfirmModal
          user={resetPasswordTargetUser}
          onClose={() => setResetPasswordTargetUser(null)}
          onConfirmReset={async () => {
            const res = await resetUserPassword(resetPasswordTargetUser.id);
            if (res.success && res.temporaryPassword) {
              const target = resetPasswordTargetUser;
              setResetPasswordTargetUser(null);
              const userRole = roles.find((r) => r.id === target.roleId) || DEFAULT_ROLES[0];
              setCredentialHandoffData({
                user: target,
                roleName: userRole.name,
                temporaryPassword: res.temporaryPassword,
                isNewUser: false,
              });
            } else {
              showToast(res.error || 'Gagal reset kata sandi.', 'error');
            }
          }}
        />
      )}

      {/* MODAL 6: CREDENTIAL HANDOFF SCREEN (Dedicated, prominent, with copy actions) */}
      {credentialHandoffData && (
        <CredentialHandoffModal
          data={credentialHandoffData}
          onClose={() => setCredentialHandoffData(null)}
        />
      )}

      {/* MODAL 7: CREATE / EDIT ROLE */}
      {(isCreateRoleModalOpen || editingRole) && (
        <RoleEditorModal
          role={editingRole}
          onClose={() => {
            setIsCreateRoleModalOpen(false);
            setEditingRole(null);
          }}
          onSaveSuccess={(roleName) => {
            setIsCreateRoleModalOpen(false);
            setEditingRole(null);
            showToast(`Role "${roleName}" berhasil disimpan!`);
          }}
        />
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 1. CREATE USER MODAL COMPONENT
// -------------------------------------------------------------
function CreateUserModal({
  roles,
  onClose,
  onCreateSuccess,
}: {
  roles: AppRole[];
  onClose: () => void;
  onCreateSuccess: (user: AppUser, tempPass: string) => void;
}) {
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

// -------------------------------------------------------------
// 2. USER DETAIL MODAL COMPONENT (with Access Summary)
// -------------------------------------------------------------
function UserDetailModal({
  user,
  role,
  onClose,
  onEdit,
  onResetPassword,
  onCopyLoginLink,
}: {
  user: AppUser;
  role: AppRole;
  onClose: () => void;
  onEdit: () => void;
  onResetPassword: () => void;
  onCopyLoginLink: () => void;
}) {
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

// -------------------------------------------------------------
// 3. EDIT USER MODAL COMPONENT
// -------------------------------------------------------------
function EditUserModal({
  user,
  roles,
  onClose,
  onUpdateSuccess,
}: {
  user: AppUser;
  roles: AppRole[];
  onClose: () => void;
  onUpdateSuccess: () => void;
}) {
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

// -------------------------------------------------------------
// 4. QUICK CHANGE ROLE MODAL COMPONENT
// -------------------------------------------------------------
function ChangeRoleModal({
  user,
  roles,
  onClose,
  onSuccess,
}: {
  user: AppUser;
  roles: AppRole[];
  onClose: () => void;
  onSuccess: (newRoleName: string) => void;
}) {
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

// -------------------------------------------------------------
// 5. RESET PASSWORD CONFIRMATION MODAL
// -------------------------------------------------------------
function ResetPasswordConfirmModal({
  user,
  onClose,
  onConfirmReset,
}: {
  user: AppUser;
  onClose: () => void;
  onConfirmReset: () => Promise<void>;
}) {
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

// -------------------------------------------------------------
// 6. CREDENTIAL HANDOFF SCREEN / MODAL (Primary Requirement)
// -------------------------------------------------------------
function CredentialHandoffModal({
  data,
  onClose,
}: {
  data: {
    user: AppUser;
    roleName: string;
    temporaryPassword: string;
    isNewUser: boolean;
  };
  onClose: () => void;
}) {
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
            Selesai & Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 7. ROLE EDITOR MODAL COMPONENT (Permission Matrix)
// -------------------------------------------------------------
function RoleEditorModal({
  role,
  onClose,
  onSaveSuccess,
}: {
  role: AppRole | null;
  onClose: () => void;
  onSaveSuccess: (name: string) => void;
}) {
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
