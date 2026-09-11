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
  getAppLoginUrl,
  formatCredentialsText,
} from '@/lib/rbac';
import {
  CreateUserModal,
  UserDetailModal,
  EditUserModal,
  ChangeRoleModal,
  ResetPasswordConfirmModal,
  CredentialHandoffModal,
  RoleEditorModal,
} from '@/components/user-management';
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
                Manajemen Pengguna
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola akun staf, bagikan tautan login, serta atur izin hak akses per role
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
          <span>Hak Akses ({roles.length})</span>
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
