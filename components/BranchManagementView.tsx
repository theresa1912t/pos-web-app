'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Branch, BranchStatus } from '@/types';
import {
  Building2,
  Plus,
  Edit2,
  Power,
  MapPin,
  Phone,
  Package,
  ShoppingCart,
  TrendingUp,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  Store,
  Check,
  Calendar,
} from 'lucide-react';

export function BranchManagementView() {
  const {
    branches,
    productInventories,
    orders,
    revenues,
    activeBranchId,
    setActiveBranchId,
    addBranch,
    updateBranch,
    toggleBranchStatus,
    hasPermission,
    canSwitchToAllBranches,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formStatus, setFormStatus] = useState<BranchStatus>('Active');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status toggle confirmation modal
  const [branchToToggle, setBranchToToggle] = useState<Branch | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const canCreate = hasPermission('branches', 'create');
  const canEdit = hasPermission('branches', 'edit');

  // Filtered branches
  const filteredBranches = useMemo(() => {
    return branches.filter((b) => {
      const matchSearch =
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.address && b.address.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchStatus = statusFilter === 'All' || b.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [branches, searchTerm, statusFilter]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = branches.length;
    const active = branches.filter((b) => b.status === 'Active').length;
    const inactive = branches.filter((b) => b.status === 'Inactive').length;
    const totalItemsStored = productInventories.reduce((sum, i) => sum + (i.stock || 0), 0);
    return { total, active, inactive, totalItemsStored };
  }, [branches, productInventories]);

  const openAddModal = () => {
    setEditingBranch(null);
    setFormName('');
    setFormCode(`CBG-0${branches.length + 1}`);
    setFormAddress('');
    setFormPhone('');
    setFormStatus('Active');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (branch: Branch) => {
    setEditingBranch(branch);
    setFormName(branch.name);
    setFormCode(branch.code);
    setFormAddress(branch.address || '');
    setFormPhone(branch.phone || '');
    setFormStatus(branch.status);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formName.trim();
    const trimmedCode = formCode.trim().toUpperCase();

    if (!trimmedName) {
      setFormError('Nama cabang wajib diisi.');
      return;
    }
    if (!trimmedCode) {
      setFormError('Kode cabang wajib diisi (contoh: JKT-01, BDG-02).');
      return;
    }

    // Check duplicate code
    const duplicateCode = branches.find(
      (b) => b.code.toUpperCase() === trimmedCode && (!editingBranch || b.id !== editingBranch.id)
    );
    if (duplicateCode) {
      setFormError(`Kode cabang "${trimmedCode}" sudah digunakan oleh cabang "${duplicateCode.name}".`);
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingBranch) {
        await updateBranch(editingBranch.id, {
          name: trimmedName,
          code: trimmedCode,
          address: formAddress.trim(),
          phone: formPhone.trim(),
          status: formStatus,
        });
      } else {
        await addBranch({
          name: trimmedName,
          code: trimmedCode,
          address: formAddress.trim(),
          phone: formPhone.trim(),
          status: formStatus,
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err?.message || 'Terjadi kesalahan saat menyimpan data cabang.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmToggleStatus = async () => {
    if (!branchToToggle) return;
    setToggleError(null);
    const res = await toggleBranchStatus(branchToToggle.id);
    if (!res.success) {
      setToggleError(res.error || 'Gagal mengubah status cabang');
      return;
    }
    setBranchToToggle(null);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <p className="text-xs font-medium text-slate-500">Cabang Aktif</p>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl font-bold text-emerald-600">{metrics.active}</h3>
            <span className="flex items-center space-x-1 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Operasional</span>
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <p className="text-xs font-medium text-slate-500">Total Unit Stok Terdistribusi</p>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl font-bold text-teal-700">{metrics.totalItemsStored.toLocaleString('id-ID')}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-medium border border-teal-100">
              Barang
            </span>
          </div>
        </div>
      </div>

      {/* Filter, Search & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, kode, atau alamat cabang..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white transition-all text-slate-900"
          />
        </div>

        <div className="flex items-center space-x-2.5 self-stretch sm:self-auto justify-between sm:justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'All' | 'Active' | 'Inactive')}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors cursor-pointer"
          >
            <option value="All">Semua Status</option>
            <option value="Active">Cabang Aktif</option>
            <option value="Inactive">Cabang Nonaktif</option>
          </select>

          {canCreate && (
            <button
              onClick={openAddModal}
              className="flex items-center justify-center space-x-1.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Cabang Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Branches List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredBranches.map((branch) => {
          const isActiveContext = activeBranchId === branch.id;
          const isBranchActive = branch.status === 'Active';

          // Branch specific stats
          const branchInvs = productInventories.filter((i) => i.branchId === branch.id);
          const totalStockItems = branchInvs.reduce((sum, i) => sum + (i.stock || 0), 0);
          const activeSkuCount = branchInvs.filter((i) => i.stock > 0).length;

          const branchOrders = orders.filter((o) => o.branchId === branch.id);
          const totalOrdersCount = branchOrders.length;
          const totalBranchSales = branchOrders.reduce((sum, o) => sum + (o.total || 0), 0);

          return (
            <div
              key={branch.id}
              className={`flex flex-col bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-2xs hover:shadow-md ${
                isActiveContext
                  ? 'border-teal-500 ring-2 ring-teal-500/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Card Header */}
              <div className="p-5 border-b border-slate-100 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold border border-slate-200">
                        {branch.code}
                      </span>
                      {isActiveContext && (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                          <Check className="w-3 h-3" />
                          <span>Konteks Aktif</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1.5 truncate">
                      {branch.name}
                    </h3>
                  </div>

                  <span
                    className={`inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                      isBranchActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isBranchActive ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                    <span>{isBranchActive ? 'Aktif' : 'Nonaktif'}</span>
                  </span>
                </div>

                {/* Address & Phone */}
                <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2 leading-relaxed">
                      {branch.address || <span className="text-slate-400 italic">Alamat belum diatur</span>}
                    </span>
                  </div>
                  {branch.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{branch.phone}</span>
                    </div>
                  )}
                  {branch.createdAt && (
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 pt-0.5">
                      <Calendar className="w-3 h-3 text-slate-300 shrink-0" />
                      <span>Terdaftar sejak {new Date(branch.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center space-x-1.5 text-slate-500 text-[11px]">
                      <Package className="w-3.5 h-3.5 text-teal-600" />
                      <span>Stok Barang</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 mt-1">
                      {totalStockItems.toLocaleString('id-ID')}{' '}
                      <span className="text-[10px] font-normal text-slate-400">({activeSkuCount} SKU)</span>
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center space-x-1.5 text-slate-500 text-[11px]">
                      <ShoppingCart className="w-3.5 h-3.5 text-teal-600" />
                      <span>Transaksi</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 mt-1 truncate">
                      {totalOrdersCount}{' '}
                      <span className="text-[10px] font-normal text-slate-400">order</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <div>
                  {canSwitchToAllBranches && isBranchActive && (
                    <button
                      type="button"
                      onClick={() => setActiveBranchId(branch.id)}
                      disabled={isActiveContext}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                        isActiveContext
                          ? 'bg-teal-100 text-teal-800 cursor-default'
                          : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-700'
                      }`}
                    >
                      {isActiveContext ? 'Sedang Dipilih' : 'Pilih Cabang'}
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-1">
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => openEditModal(branch)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                      title="Edit Cabang"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}

                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setBranchToToggle(branch)}
                      className={`p-1.5 rounded-lg border border-transparent transition-colors cursor-pointer ${
                        isBranchActive
                          ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-200'
                          : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200'
                      }`}
                      title={isBranchActive ? 'Nonaktifkan Cabang' : 'Aktifkan Cabang'}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredBranches.length === 0 && (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="text-base font-bold text-slate-800 mt-3">Tidak ada cabang ditemukan</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'All'
              ? 'Tidak ada cabang yang cocok dengan kata kunci atau filter status saat ini.'
              : 'Belum ada cabang terdaftar. Klik tombol Tambah Cabang Baru di atas untuk mendaftarkan lokasi cabang baru.'}
          </p>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600 border border-teal-100">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingBranch ? 'Edit Data Cabang' : 'Tambah Cabang Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-2 text-xs text-rose-700">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nama Cabang <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Cabang Dago, Cabang Sudirman"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white transition-all text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Kode Cabang <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: BDG-01, JKT-02"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white transition-all text-slate-900 font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Kode unik penanda cabang pada struk belanja, pesanan kasir, dan laporan.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Alamat Fisik Cabang
                </label>
                <textarea
                  rows={2}
                  placeholder="Jl. Raya Utama No. 123, Kelurahan, Kecamatan..."
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white transition-all text-slate-900 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nomor Telepon / WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="Contoh: 0812-3456-7890"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white transition-all text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Status Cabang
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormStatus('Active')}
                    className={`flex items-center justify-center space-x-1.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      formStatus === 'Active'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Aktif</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormStatus('Inactive')}
                    className={`flex items-center justify-center space-x-1.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      formStatus === 'Inactive'
                        ? 'bg-slate-200 border-slate-400 text-slate-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Nonaktif</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : editingBranch ? 'Perbarui Cabang' : 'Simpan Cabang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOGGLE STATUS CONFIRMATION MODAL */}
      {branchToToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6">
            <div className="flex items-center space-x-3 text-slate-800">
              <div
                className={`p-2 rounded-xl ${
                  branchToToggle.status === 'Active'
                    ? 'bg-amber-50 text-amber-600 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold">
                  {branchToToggle.status === 'Active'
                    ? 'Nonaktifkan Cabang Ini?'
                    : 'Aktifkan Kembali Cabang?'}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">{branchToToggle.name}</p>
              </div>
            </div>

            <div className="mt-3 text-xs text-slate-600 space-y-2">
              {branchToToggle.status === 'Active' ? (
                <>
                  <p>
                    Menonaktifkan cabang akan menyembunyikannya dari pilihan kasir baru dan operasional harian.
                  </p>
                  <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    ℹ️ <strong>Catatan Keamanan:</strong> Data historis transaksi, keuangan, dan inventori cabang ini tetap tersimpan aman dan tidak akan dihapus permanen.
                  </p>
                </>
              ) : (
                <p>
                  Cabang ini akan kembali aktif dan dapat dipilih untuk transaksi kasir serta pencatatan stok.
                </p>
              )}
            </div>

            {toggleError && (
              <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {toggleError}
              </div>
            )}

            <div className="mt-5 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setBranchToToggle(null);
                  setToggleError(null);
                }}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmToggleStatus}
                className={`px-4 py-2 text-xs font-semibold rounded-xl text-white shadow-sm transition-all cursor-pointer ${
                  branchToToggle.status === 'Active'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {branchToToggle.status === 'Active' ? 'Nonaktifkan' : 'Aktifkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
