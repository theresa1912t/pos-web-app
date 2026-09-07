'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Promotion, PromotionType, Product } from '@/types';
import { formatRupiah } from '@/lib/utils';
import {
  isPromotionActive,
  getPromotionStatus,
  calculatePromoPrice,
  getProductEffectivePromo,
} from '@/services/promotionService';
import {
  BadgePercent,
  Plus,
  Search,
  Calendar,
  Building2,
  Package,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  Power,
  X,
  Sparkles,
  Tag,
  Copy,
  Info,
  Layers,
  ArrowRight,
  TrendingDown,
  Percent,
} from 'lucide-react';

function getInitialDateStrings() {
  const d = new Date();
  const next = new Date(d.getTime() + 7 * 24 * 60 * 60 * 1000);
  return {
    start: d.toISOString().split('T')[0],
    end: next.toISOString().split('T')[0],
  };
}

export function PromotionsView() {
  const {
    promotions,
    products,
    branches,
    activeBranchId,
    addPromotion,
    updatePromotion,
    deletePromotion,
    togglePromotionStatus,
    hasPermission,
    user,
    currentUserRole,
  } = useApp();

  const [currentDate] = useState(() => new Date());

  // Reliable permissions with fallback for owner/admin & demo staging
  const isOwnerOrAdmin =
    !user ||
    !currentUserRole ||
    currentUserRole.id === 'role-owner-admin' ||
    Boolean(currentUserRole.isSystem) ||
    currentUserRole.name?.toLowerCase().includes('admin') ||
    currentUserRole.name?.toLowerCase().includes('owner') ||
    user.email === 'staging@example.com';

  const canCreate = isOwnerOrAdmin || hasPermission('promotions', 'create');
  const canEdit = isOwnerOrAdmin || hasPermission('promotions', 'edit');
  const canDelete = isOwnerOrAdmin || hasPermission('promotions', 'delete');

  // Confirmation Dialog States
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'scheduled' | 'ended' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);

  // Form states
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    type: PromotionType;
    discountValue: number | '';
    badgeText: string;
    productIds: string[];
    branchIds: string[];
    startDate: string;
    endDate: string;
    isActive: boolean;
  }>(() => {
    const dates = getInitialDateStrings();
    return {
      name: '',
      description: '',
      type: 'percentage',
      discountValue: 10,
      badgeText: 'HEMAT 10%',
      productIds: [],
      branchIds: ['*'],
      startDate: dates.start,
      endDate: dates.end,
      isActive: true,
    };
  });

  const [productSearch, setProductSearch] = useState('');
  const [productCatFilter, setProductCatFilter] = useState<string>('all');
  const [formError, setFormError] = useState<string | null>(null);

  // Calculate products with promo price below COGS for the Save confirmation dialog
  const saveConfirmLossProducts = useMemo(() => {
    const discountVal = formData.discountValue;
    if (typeof discountVal !== 'number' || discountVal <= 0) return [];
    return products.filter((p) => {
      if (!formData.productIds.includes(p.id)) return false;
      const calc = calculatePromoPrice(p.sellingPrice, p.cogs, formData.type, discountVal);
      return calc.isBelowCogs;
    });
  }, [products, formData.productIds, formData.type, formData.discountValue]);

  // Categories list for product selector
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [products]);

  // Statistics
  const stats = useMemo(() => {
    const now = new Date();
    const activePromos = promotions.filter((p) => {
      const branchIds = p.branchIds || ['*'];
      const matchBranch =
        !activeBranchId ||
        activeBranchId === 'all' ||
        branchIds.includes('*') ||
        branchIds.includes(activeBranchId);
      return matchBranch && isPromotionActive(p, now);
    });
    const scheduledPromos = promotions.filter((p) => {
      const branchIds = p.branchIds || ['*'];
      const matchBranch =
        !activeBranchId ||
        activeBranchId === 'all' ||
        branchIds.includes('*') ||
        branchIds.includes(activeBranchId);
      return matchBranch && getPromotionStatus(p, now) === 'scheduled';
    });
    
    // Unique products under active promo
    const discountedProductIds = new Set<string>();
    activePromos.forEach((p) => {
      p.productIds.forEach((id) => discountedProductIds.add(id));
    });

    // Average discount value
    const avgDiscount =
      activePromos.length > 0
        ? Math.round(
            activePromos.reduce((acc, p) => {
              if (p.type === 'percentage') return acc + p.discountValue;
              return acc + 10; // estimate for fixed
            }, 0) / activePromos.length
          )
        : 0;

    return {
      activeCount: activePromos.length,
      discountedProductsCount: discountedProductIds.size,
      scheduledCount: scheduledPromos.length,
      avgDiscount,
    };
  }, [promotions, activeBranchId]);

  // Filtered promotions list
  const filteredPromotions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const now = currentDate;

    return promotions.filter((promo) => {
      // Search query match
      const matchSearch =
        !q ||
        promo.name.toLowerCase().includes(q) ||
        (promo.badgeText && promo.badgeText.toLowerCase().includes(q)) ||
        (promo.description && promo.description.toLowerCase().includes(q));

      // Status filter match
      const currentStatus = getPromotionStatus(promo, now);
      const matchStatus = statusFilter === 'all' || currentStatus === statusFilter;

      // Branch filter match using global top nav activeBranchId
      const branchIds = promo.branchIds || ['*'];
      const matchBranch =
        !activeBranchId ||
        activeBranchId === 'all' ||
        branchIds.includes('*') ||
        branchIds.includes(activeBranchId);

      return matchSearch && matchStatus && matchBranch;
    });
  }, [promotions, searchQuery, statusFilter, activeBranchId, currentDate]);

  // Open modal for new promo
  const handleOpenNewModal = () => {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setEditingPromo(null);
    setFormData({
      name: '',
      description: '',
      type: 'percentage',
      discountValue: 10,
      badgeText: 'HEMAT 10%',
      productIds: products.slice(0, 3).map((p) => p.id),
      branchIds: ['*'],
      startDate: today,
      endDate: nextWeek,
      isActive: true,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (promo: Promotion) => {
    setEditingPromo(promo);
    setFormData({
      name: promo.name,
      description: promo.description || '',
      type: promo.type,
      discountValue: promo.discountValue,
      badgeText: promo.badgeText || '',
      productIds: [...promo.productIds],
      branchIds: [...(promo.branchIds || ['*'])],
      startDate: promo.startDate,
      endDate: promo.endDate,
      isActive: promo.isActive,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Quick Preset Handlers
  const applyPreset = (
    name: string,
    type: PromotionType,
    discountValue: number,
    badgeText: string,
    catName?: string
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    let selectedIds: string[] = [];

    if (catName) {
      selectedIds = products.filter((p) => p.category === catName).map((p) => p.id);
    } else {
      selectedIds = products.slice(0, 4).map((p) => p.id);
    }

    setFormData((prev) => ({
      ...prev,
      name,
      type,
      discountValue,
      badgeText,
      productIds: selectedIds.length > 0 ? selectedIds : prev.productIds,
      startDate: today,
      endDate: nextWeek,
    }));
  };

  // Initiate modal form submit (validate first, then open confirmation dialog)
  const handleInitiateSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Nama promosi wajib diisi.');
      return;
    }
    if (typeof formData.discountValue !== 'number' || formData.discountValue <= 0) {
      setFormError('Nilai diskon harus berupa angka lebih besar dari 0.');
      return;
    }
    if (formData.productIds.length === 0) {
      setFormError('Pilih minimal satu produk untuk promosi ini.');
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      setFormError('Tanggal mulai dan selesai promosi wajib diisi.');
      return;
    }
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      setFormError('Tanggal selesai tidak boleh sebelum tanggal mulai.');
      return;
    }

    setFormError(null);
    setIsSaveConfirmOpen(true);
  };

  // Commit save after user approves the confirmation dialog
  const handleConfirmSave = async () => {
    setIsSubmitting(true);
    try {
      if (editingPromo) {
        await updatePromotion(editingPromo.id, {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          type: formData.type,
          discountValue: Number(formData.discountValue),
          badgeText: formData.badgeText.trim() || undefined,
          productIds: formData.productIds,
          branchIds: formData.branchIds.length > 0 ? formData.branchIds : ['*'],
          startDate: formData.startDate,
          endDate: formData.endDate,
          isActive: formData.isActive,
        });
        setActionSuccessMessage(`Promosi "${formData.name.trim()}" berhasil diperbarui.`);
      } else {
        await addPromotion({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          type: formData.type,
          discountValue: Number(formData.discountValue),
          badgeText: formData.badgeText.trim() || undefined,
          productIds: formData.productIds,
          branchIds: formData.branchIds.length > 0 ? formData.branchIds : ['*'],
          startDate: formData.startDate,
          endDate: formData.endDate,
          isActive: formData.isActive,
        });
        setActionSuccessMessage(`Promosi "${formData.name.trim()}" berhasil dibuat dan siap aktif.`);
      }
      setIsSaveConfirmOpen(false);
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err?.message || 'Gagal menyimpan promosi.');
      setIsSaveConfirmOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Commit delete after user approves the confirmation dialog
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      const targetName = deleteTarget.name;
      await deletePromotion(deleteTarget.id);
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
      setActionSuccessMessage(`Promosi "${targetName}" berhasil dihapus.`);
    } catch (err: any) {
      console.error('Error deleting promotion:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle product selection in modal
  const toggleProductSelection = (id: string) => {
    setFormData((prev) => {
      const exists = prev.productIds.includes(id);
      return {
        ...prev,
        productIds: exists ? prev.productIds.filter((pId) => pId !== id) : [...prev.productIds, id],
      };
    });
  };

  // Select/Deselect all filtered products in modal
  const toggleSelectAllFilteredProducts = (filteredIds: string[]) => {
    setFormData((prev) => {
      const allSelected = filteredIds.every((id) => prev.productIds.includes(id));
      if (allSelected) {
        return {
          ...prev,
          productIds: prev.productIds.filter((id) => !filteredIds.includes(id)),
        };
      } else {
        const set = new Set([...prev.productIds, ...filteredIds]);
        return {
          ...prev,
          productIds: Array.from(set),
        };
      }
    });
  };

  // Products filtered for the selector inside modal
  const modalFilteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase().trim();
    return products.filter((p) => {
      if (p.isArchived) return false;
      const matchQ = !q || p.name.toLowerCase().includes(q) || (p.barcode && p.barcode.includes(q));
      const matchCat = productCatFilter === 'all' || p.category === productCatFilter;
      return matchQ && matchCat;
    });
  }, [products, productSearch, productCatFilter]);

  return (
    <div className="space-y-4 pb-12">
      {/* Toast Feedback Notification */}
      {actionSuccessMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{actionSuccessMessage}</span>
          </div>
          <button
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-900 cursor-pointer p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-500">Promosi Aktif</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BadgePercent className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl sm:text-2xl font-bold text-slate-900">{stats.activeCount}</span>
            <span className="text-[11px] text-emerald-600 font-medium flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block mr-1 animate-pulse" />
              Live di Kasir
            </span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-500">Produk Didiskon</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Tag className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl sm:text-2xl font-bold text-slate-900">
              {stats.discountedProductsCount}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">SKU Bertanda Coret</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-500">Jadwal Mendatang</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl sm:text-2xl font-bold text-slate-900">{stats.scheduledCount}</span>
            <span className="text-[11px] text-indigo-600 font-medium">Event Siap Mulai</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-500">Rata-rata Diskon</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Percent className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl sm:text-2xl font-bold text-slate-900">
              {stats.avgDiscount > 0 ? `${stats.avgDiscount}%` : '0%'}
            </span>
            <span className="text-[11px] text-teal-600 font-medium">Hemat Konsumen</span>
          </div>
        </div>
      </div>

      {/* Compact Unified Filter & Action Toolbar */}
      <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
        {/* Search Box */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari promo, label badge, produk..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Dropdown Filter (Hemat Tempat) */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="active">● Sedang Aktif</option>
              <option value="scheduled">○ Terjadwal</option>
              <option value="ended">Telah Berakhir</option>
              <option value="inactive">Dinonaktifkan</option>
            </select>
          </div>

          {/* Create Promo Button */}
          {canCreate && (
            <button
              onClick={handleOpenNewModal}
              className="inline-flex items-center justify-center space-x-1.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer whitespace-nowrap ml-auto md:ml-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Promosi Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Promotions List */}
      {filteredPromotions.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-6">
          <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <BadgePercent className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Tidak ada promosi ditemukan</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
            {searchQuery || statusFilter !== 'all'
              ? 'Coba sesuaikan kata kunci pencarian atau filter status promosi.'
              : 'Mulai buat promosi diskon harga coret pertama Anda untuk menarik lebih banyak pembeli.'}
          </p>
          {canCreate && (
            <button
              onClick={handleOpenNewModal}
              className="inline-flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Promosi Baru</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPromotions.map((promo) => {
            const status = getPromotionStatus(promo, currentDate);
            const promoProducts = products.filter((p) => promo.productIds.includes(p.id));

            // Check if any product has promo price < cogs
            const hasCogsWarning = promoProducts.some((p) => {
              const calc = calculatePromoPrice(p.sellingPrice, p.cogs, promo.type, promo.discountValue);
              return calc.isBelowCogs;
            });

            return (
              <div
                key={promo.id}
                className={`bg-white rounded-2xl border transition-all shadow-xs flex flex-col justify-between ${
                  promo.isActive
                    ? 'border-slate-200 hover:border-teal-300'
                    : 'border-slate-200 bg-slate-50/50 opacity-75'
                }`}
              >
                {/* Promo Card Top */}
                <div className="p-5 space-y-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : status === 'scheduled'
                              ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                              : status === 'ended'
                              ? 'bg-slate-100 text-slate-600 border border-slate-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {status === 'active'
                            ? '● Aktif'
                            : status === 'scheduled'
                            ? '○ Terjadwal'
                            : status === 'ended'
                            ? 'Berakhir'
                            : 'Nonaktif'}
                        </span>
                        {promo.badgeText && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            {promo.badgeText}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-2">{promo.name}</h3>
                      {promo.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{promo.description}</p>
                      )}
                    </div>

                    {/* Quick Active Toggle */}
                    {canEdit && (
                      <button
                        onClick={() => togglePromotionStatus(promo.id)}
                        className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                          promo.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                        }`}
                        title={promo.isActive ? 'Nonaktifkan Promosi' : 'Aktifkan Promosi'}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Discount Value Display */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Tipe Diskon</span>
                      <span className="text-xs font-semibold text-slate-800">
                        {promo.type === 'percentage'
                          ? `Potongan ${promo.discountValue}%`
                          : promo.type === 'fixed_discount'
                          ? `Potongan ${formatRupiah(promo.discountValue)}`
                          : `Harga Spesial ${formatRupiah(promo.discountValue)}`}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-500 block">Produk Terkait</span>
                      <span className="text-xs font-semibold text-teal-700">
                        {promo.productIds.length} SKU
                      </span>
                    </div>
                  </div>

                  {/* COGS Warning Badge */}
                  {hasCogsWarning && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-700">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span className="text-xs font-medium">
                        Peringatan: Ada produk dengan harga diskon di bawah HPP (margin minus)!
                      </span>
                    </div>
                  )}

                  {/* Sample Discounted Products Preview */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Preview Harga Coret ({promoProducts.length} Produk):
                    </span>
                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                      {promoProducts.slice(0, 4).map((p) => {
                        const calc = calculatePromoPrice(
                          p.sellingPrice,
                          p.cogs,
                          promo.type,
                          promo.discountValue
                        );

                        return (
                          <div
                            key={p.id}
                            className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50 border border-slate-100"
                          >
                            <span className="font-medium text-slate-800 truncate max-w-[140px]">
                              {p.name}
                            </span>
                            <div className="flex items-center space-x-2 shrink-0">
                              <span className="line-through text-slate-400 text-[11px]">
                                {formatRupiah(p.sellingPrice)}
                              </span>
                              <ArrowRight className="w-2.5 h-2.5 text-slate-300" />
                              <span
                                className={`font-bold ${
                                  calc.isBelowCogs ? 'text-rose-600' : 'text-emerald-700'
                                }`}
                              >
                                {formatRupiah(calc.promoPrice)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      {promoProducts.length > 4 && (
                        <p className="text-[11px] text-slate-400 text-center italic">
                          + {promoProducts.length - 4} produk lainnya
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Metadata: Dates & Branches */}
                  <div className="space-y-1 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {promo.startDate} s/d {promo.endDate}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {!promo.branchIds || promo.branchIds.includes('*')
                          ? 'Berlaku di Semua Cabang'
                          : `${promo.branchIds.length} Cabang Terpilih`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Promo Card Bottom Actions */}
                <div className="p-3 bg-slate-50/70 border-t border-slate-100 rounded-b-2xl flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-xs text-slate-500">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>
                      {status === 'active'
                        ? 'Sedang Berjalan'
                        : status === 'scheduled'
                        ? 'Menunggu Tanggal'
                        : 'Selesai'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    {canEdit && (
                      <button
                        onClick={() => handleOpenEditModal(promo)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                        title="Edit Promosi"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteTarget(promo);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Hapus Promosi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: TAMBAH / EDIT PROMOSI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingPromo ? 'Edit Promosi & Harga Coret' : 'Buat Promosi Baru'}
                </h3>
                <p className="text-xs text-slate-500">
                  Atur diskon dan pilih produk yang akan mendapatkan label harga coret
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleInitiateSave} className="flex-1 overflow-y-auto p-6 space-y-5">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Quick Presets */}
              {!editingPromo && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Template Cepat Promo Retail:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        applyPreset('Promo JSM Akhir Pekan', 'percentage', 10, 'JSM -10%')
                      }
                      className="px-2.5 py-1 bg-white border border-slate-200 hover:border-teal-400 rounded-lg text-xs font-medium text-slate-700 transition-colors cursor-pointer"
                    >
                      JSM Akhir Pekan (10%)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        applyPreset('Flash Sale Sore Mantap', 'percentage', 15, 'FLASH SALE')
                      }
                      className="px-2.5 py-1 bg-white border border-slate-200 hover:border-teal-400 rounded-lg text-xs font-medium text-slate-700 transition-colors cursor-pointer"
                    >
                      Flash Sale Sore (15%)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        applyPreset('Potongan Langsung Sembako', 'fixed_discount', 2000, 'HEMAT Rp2.000')
                      }
                      className="px-2.5 py-1 bg-white border border-slate-200 hover:border-teal-400 rounded-lg text-xs font-medium text-slate-700 transition-colors cursor-pointer"
                    >
                      Potong Rp 2.000
                    </button>
                  </div>
                </div>
              )}

              {/* Section 1: Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700">Nama Promosi *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Promo JSM Minyak Goreng & Snack"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
                    required
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700">Deskripsi (Opsional)</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Contoh: Berlaku untuk pembelian langsung di kasir toko"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Tipe Diskon *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      const newType = e.target.value as PromotionType;
                      setFormData({
                        ...formData,
                        type: newType,
                        discountValue: newType === 'percentage' ? 10 : 2000,
                        badgeText: newType === 'percentage' ? 'HEMAT 10%' : 'HEMAT',
                      });
                    }}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
                  >
                    <option value="percentage">Persentase Diskon (%)</option>
                    <option value="fixed_discount">Potongan Harga Tetap (Rp)</option>
                    <option value="fixed_price">Harga Pas / Jadi (Rp)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    {formData.type === 'percentage'
                      ? 'Besar Diskon (%) *'
                      : formData.type === 'fixed_discount'
                      ? 'Nilai Potongan (Rp) *'
                      : 'Harga Pas Produk (Rp) *'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={formData.type === 'percentage' ? '99' : undefined}
                    value={formData.discountValue}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Number(e.target.value);
                      let newBadge = formData.badgeText;
                      if (formData.type === 'percentage' && typeof val === 'number') {
                        newBadge = `HEMAT ${val}%`;
                      }
                      setFormData({
                        ...formData,
                        discountValue: val,
                        badgeText: newBadge,
                      });
                    }}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:bg-white font-medium"
                    required
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700">
                    Label Badge Promo (Teks di Struk & Kasir)
                  </label>
                  <input
                    type="text"
                    value={formData.badgeText}
                    onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                    placeholder="Contoh: JSM, HEMAT 10%, FLASH SALE"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Section 2: Date & Branch Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Tanggal Mulai *</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Tanggal Selesai *</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
                    required
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700">Cabang yang Berlaku</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, branchIds: ['*'] })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        formData.branchIds.includes('*')
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Semua Cabang Toko
                    </button>
                    {branches.map((b) => {
                      const isSelected =
                        !formData.branchIds.includes('*') && formData.branchIds.includes(b.id);

                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            if (formData.branchIds.includes('*')) {
                              setFormData({ ...formData, branchIds: [b.id] });
                            } else if (isSelected) {
                              const next = formData.branchIds.filter((id) => id !== b.id);
                              setFormData({
                                ...formData,
                                branchIds: next.length === 0 ? ['*'] : next,
                              });
                            } else {
                              setFormData({
                                ...formData,
                                branchIds: [...formData.branchIds, b.id],
                              });
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-teal-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {b.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Section 3: Product Selector & Live Strikethrough Margin Simulation */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-semibold text-slate-800">
                      Pilih Produk Diskon ({formData.productIds.length} Dipilih) *
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Sistem menghitung margin keuntungan terhadap HPP secara real-time
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      toggleSelectAllFilteredProducts(modalFilteredProducts.map((p) => p.id))
                    }
                    className="text-xs font-semibold text-teal-700 hover:text-teal-800 cursor-pointer"
                  >
                    Pilih / Batal Semua di List
                  </button>
                </div>

                {/* Filter & Search inside Product Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Cari nama atau barcode..."
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <select
                    value={productCatFilter}
                    onChange={(e) => setProductCatFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-teal-500"
                  >
                    <option value="all">Semua Kategori</option>
                    {availableCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Product List Table with Real-time Margin Protection */}
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="py-2 px-3 w-8">Pilih</th>
                        <th className="py-2 px-3">Produk & Kategori</th>
                        <th className="py-2 px-3 text-right">Harga Normal</th>
                        <th className="py-2 px-3 text-right">Harga Coret (Promo)</th>
                        <th className="py-2 px-3 text-right">HPP</th>
                        <th className="py-2 px-3 text-center">Status Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {modalFilteredProducts.map((prod) => {
                        const isSelected = formData.productIds.includes(prod.id);
                        const calc = calculatePromoPrice(
                          prod.sellingPrice,
                          prod.cogs,
                          formData.type,
                          typeof formData.discountValue === 'number' ? formData.discountValue : 0
                        );

                        return (
                          <tr
                            key={prod.id}
                            onClick={() => toggleProductSelection(prod.id)}
                            className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                              isSelected ? 'bg-teal-50/40' : ''
                            }`}
                          >
                            <td className="py-2 px-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}} // handled by tr click
                                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <span className="font-semibold text-slate-800 block truncate max-w-[150px]">
                                {prod.name}
                              </span>
                              <span className="text-[10px] text-slate-400">{prod.category}</span>
                            </td>
                            <td className="py-2 px-3 text-right text-slate-500">
                              {formatRupiah(prod.sellingPrice)}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-teal-700">
                              {isSelected ? formatRupiah(calc.promoPrice) : '-'}
                            </td>
                            <td className="py-2 px-3 text-right text-slate-400">
                              {formatRupiah(prod.cogs)}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {isSelected ? (
                                calc.isBelowCogs ? (
                                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                                    <span>Rugi ({calc.profitMargin}%)</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>Untung {calc.profitMargin}%</span>
                                  </span>
                                )
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-sm font-semibold shadow-sm transition-all cursor-pointer"
                >
                  {editingPromo ? 'Simpan Perubahan' : 'Buat Promosi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG KONFIRMASI HAPUS PROMOSI */}
      {isDeleteModalOpen && deleteTarget && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">Konfirmasi Hapus Promosi</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus promosi{' '}
                  <span className="font-semibold text-slate-800">&ldquo;{deleteTarget.name}&rdquo;</span>?
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5 text-slate-600">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Tipe / Diskon:</span>
                <span className="font-semibold text-slate-800">
                  {deleteTarget.type === 'percentage'
                    ? `Diskon ${deleteTarget.discountValue}%`
                    : deleteTarget.type === 'fixed_discount'
                    ? `Potongan ${formatRupiah(deleteTarget.discountValue)}`
                    : `Harga Khusus ${formatRupiah(deleteTarget.discountValue)}`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Produk Terkait:</span>
                <span className="font-semibold text-slate-800">{deleteTarget.productIds.length} SKU</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Dampak:</span>
                <span className="font-medium text-amber-700">Harga kembali ke harga normal tanpa diskon</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteTarget(null);
                }}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer inline-flex items-center space-x-1.5"
              >
                {isSubmitting ? (
                  <span>Menghapus...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus Promosi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG KONFIRMASI SIMPAN / SUBMIT PROMOSI */}
      {isSaveConfirmOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  {editingPromo ? 'Konfirmasi Simpan Perubahan' : 'Konfirmasi Buat Promosi'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Periksa ringkasan promosi sebelum mengaktifkan harga coret di sistem kasir:
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 text-slate-600">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Nama Promosi:</span>
                <span className="font-semibold text-slate-800 text-right max-w-[200px] truncate">
                  {formData.name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Tipe & Diskon:</span>
                <span className="font-semibold text-teal-700">
                  {formData.type === 'percentage'
                    ? `Diskon ${formData.discountValue}%`
                    : formData.type === 'fixed_discount'
                    ? `Potongan ${formatRupiah(Number(formData.discountValue))}`
                    : `Harga Khusus ${formatRupiah(Number(formData.discountValue))}`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Jumlah Produk:</span>
                <span className="font-semibold text-slate-800">{formData.productIds.length} Produk Terpilih</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Periode Aktif:</span>
                <span className="font-medium text-slate-700">
                  {formData.startDate} s/d {formData.endDate}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Target Cabang:</span>
                <span className="font-medium text-slate-700">
                  {formData.branchIds.includes('*') ? 'Semua Cabang' : `${formData.branchIds.length} Cabang`}
                </span>
              </div>
            </div>

            {/* Peringatan jika ada produk dengan harga promo di bawah modal HPP */}
            {saveConfirmLossProducts.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-semibold">Peringatan Margin HPP: </span>
                  Terdapat {saveConfirmLossProducts.length} produk yang harga promo-nya berada di bawah modal beli (HPP). Laba kotor akan negatif.
                </div>
              </div>
            )}

            <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsSaveConfirmOpen(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Periksa Kembali
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmSave}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer inline-flex items-center space-x-1.5"
              >
                {isSubmitting ? (
                  <span>Menyimpan...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Ya, Simpan Promosi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
