'use client';

import React, { useState, useMemo, forwardRef, useImperativeHandle, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { StockOpname, StockOpnameItem, StockOpnameSchedule, Product } from '@/types';
import { formatRupiah, formatTime } from '@/lib/utils';
import { BarcodeScannerModal } from '@/components/BarcodeScannerModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { TablePagination } from '@/components/TablePagination';
import {
  ClipboardCheck,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  ArrowLeft,
  X,
  Printer,
  Calendar,
  Eye,
  Trash2,
  Barcode,
  Camera,
  RefreshCcw,
  Sparkles,
  HelpCircle,
  FileText,
  Clock,
  Check,
} from 'lucide-react';

export interface StockOpnameTabRef {
  startNewOpname: () => void;
  openSchedule: () => void;
  getView: () => 'list' | 'wizard' | 'schedule' | 'detail';
}

export interface StockOpnameTabProps {
  onViewChange?: (view: 'list' | 'wizard' | 'schedule' | 'detail') => void;
}

export const StockOpnameTab = forwardRef<StockOpnameTabRef, StockOpnameTabProps>(function StockOpnameTab(
  props,
  ref
) {
  const {
    stockOpnames,
    stockOpnameSchedules,
    products,
    categories,
    racks,
    createStockOpname,
    updateStockOpname,
    finalizeStockOpname,
    deleteStockOpname,
    addStockOpnameSchedule,
    deleteStockOpnameSchedule,
    settings,
    user,
  } = useApp();

  // Active view: 'list' | 'wizard' | 'schedule' | 'detail'
  const [view, setView] = useState<'list' | 'wizard' | 'schedule' | 'detail'>('list');
  const [selectedOpnameForDetail, setSelectedOpnameForDetail] = useState<StockOpname | null>(null);

  // Wizard state: 1: Scope, 2: Count, 3: Compare & Discrepancy, 4: Reconcile & Finalize
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [scope, setScope] = useState<'All' | 'Category' | 'Rack'>('All');
  const [scopeTargetId, setScopeTargetId] = useState<string>('');
  const [scopeTargetName, setScopeTargetName] = useState<string>('');
  const [opnameNotes, setOpnameNotes] = useState<string>('');

  // Items in active opname session
  const [activeItems, setActiveItems] = useState<StockOpnameItem[]>([]);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [hideZeroStock, setHideZeroStock] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [editingOpnameId, setEditingOpnameId] = useState<string | null>(null);

  // Schedule Modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleFrequency, setScheduleFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('weekly');
  const [scheduleNextDate, setScheduleNextDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [scheduleScope, setScheduleScope] = useState<'All' | 'Category' | 'Rack'>('All');

  // Confirmation dialog states
  const [confirmDeleteOpname, setConfirmDeleteOpname] = useState<StockOpname | null>(null);
  const [confirmDeleteSchedule, setConfirmDeleteSchedule] = useState<StockOpnameSchedule | null>(null);
  const [showConfirmFinalize, setShowConfirmFinalize] = useState(false);
  const [showConfirmSaveDraft, setShowConfirmSaveDraft] = useState(false);

  // Pagination for Opname History Table (Standard 20 rows per page)
  const [historyPage, setHistoryPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const pagedStockOpnames = useMemo(() => {
    const start = (historyPage - 1) * ITEMS_PER_PAGE;
    return stockOpnames.slice(start, start + ITEMS_PER_PAGE);
  }, [stockOpnames, historyPage]);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Start new opname wizard
  const handleStartNewOpname = () => {
    setEditingOpnameId(null);
    setWizardStep(1);
    setScope('All');
    setScopeTargetId('');
    setScopeTargetName('');
    setOpnameNotes('');
    setActiveItems([]);
    setView('wizard');
  };

  // Imperative handle for parent component
  useImperativeHandle(ref, () => ({
    startNewOpname: handleStartNewOpname,
    openSchedule: () => setView('schedule'),
    getView: () => view,
  }));

  // Sync view change to parent
  useEffect(() => {
    props.onViewChange?.(view);
  }, [view, props]);

  // Resume or edit existing draft opname
  const handleResumeOpname = (opname: StockOpname) => {
    setEditingOpnameId(opname.id);
    setScope(opname.scope);
    setScopeTargetId(opname.scopeTargetId || '');
    setScopeTargetName(opname.scopeTargetName || '');
    setOpnameNotes(opname.notes || '');
    setActiveItems(opname.items || []);
    setWizardStep(2);
    setView('wizard');
  };

  // Generate items for chosen scope in Step 1 -> proceed to Step 2
  const handleProceedToCount = () => {
    let scopedProds: Product[] = products.filter((p) => !p.isArchived);

    if (scope === 'Category' && scopeTargetId) {
      scopedProds = scopedProds.filter((p) => p.category === scopeTargetId);
    } else if (scope === 'Rack' && scopeTargetId) {
      scopedProds = scopedProds.filter((p) => p.rackId === scopeTargetId);
    }

    if (scopedProds.length === 0) {
      showToast('Tidak ada produk yang sesuai dengan ruang lingkup yang dipilih.', 'error');
      return;
    }

    // Build initial items array
    const initialItems: StockOpnameItem[] = scopedProds.map((prod) => ({
      productId: prod.id,
      productName: prod.name,
      barcode: prod.barcode,
      category: prod.category,
      rackName: prod.rackName,
      unit: prod.unit || 'Pcs',
      cogs: prod.cogs || 0,
      systemStock: prod.stock || 0,
      physicalStock: prod.stock || 0, // default physical to system, ready for cashier adjustment
      difference: 0,
      discrepancyValue: 0,
      isCounted: false,
    }));

    setActiveItems(initialItems);
    setWizardStep(2);
  };

  // Update physical count for an item
  const handleUpdateItemPhysical = (productId: string, physicalCount: number | '') => {
    const num = physicalCount === '' ? 0 : Math.max(0, Number(physicalCount));
    setActiveItems((prev) =>
      prev.map((it) => {
        if (it.productId === productId) {
          const diff = num - it.systemStock;
          const discVal = diff * it.cogs;
          return {
            ...it,
            physicalStock: num,
            difference: diff,
            discrepancyValue: discVal,
            isCounted: true,
          };
        }
        return it;
      })
    );
  };

  // Handle barcode scan in count step
  const handleBarcodeScanned = (barcodeString: string) => {
    const match = activeItems.find(
      (it) => it.barcode && it.barcode.trim().toLowerCase() === barcodeString.trim().toLowerCase()
    );

    if (match) {
      handleUpdateItemPhysical(match.productId, (match.physicalStock || 0) + 1);
      showToast(`+1 ${match.productName} (Stok Fisik: ${(match.physicalStock || 0) + 1})`);
    } else {
      showToast(`Barcode ${barcodeString} tidak ditemukan dalam cakupan opname ini.`, 'error');
    }
  };

  // Finalize & Reconcile Stock Opname
  const handleFinalize = async () => {
    setIsSubmitting(true);
    try {
      let targetOpnameId = editingOpnameId;

      // If new, create draft first
      if (!targetOpnameId) {
        const created = await createStockOpname({
          scope,
          scopeTargetId: scopeTargetId || undefined,
          scopeTargetName: scopeTargetName || undefined,
          items: activeItems,
          notes: opnameNotes || undefined,
        });
        targetOpnameId = created.id;
      }

      const res = await finalizeStockOpname(targetOpnameId, activeItems, opnameNotes);
      if (res.success && res.opname) {
        showToast('Stock Opname berhasil diselesaikan dan stok inventaris telah direkonsiliasi!');
        setSelectedOpnameForDetail(res.opname);
        setView('detail');
      } else {
        showToast(res.error || 'Gagal finalisasi stock opname', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save as Draft
  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    try {
      if (editingOpnameId) {
        await updateStockOpname(editingOpnameId, {
          items: activeItems,
          notes: opnameNotes,
        });
        showToast('Draf sesi stock opname berhasil diperbarui!');
      } else {
        await createStockOpname({
          scope,
          scopeTargetId: scopeTargetId || undefined,
          scopeTargetName: scopeTargetName || undefined,
          items: activeItems,
          notes: opnameNotes || undefined,
        });
        showToast('Draf sesi stock opname berhasil disimpan!');
      }
      setView('list');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter items in counting table
  const filteredCountingItems = useMemo(() => {
    const q = itemSearchQuery.toLowerCase().trim();
    return activeItems.filter((it) => {
      const matchQ =
        !q ||
        it.productName.toLowerCase().includes(q) ||
        (it.barcode && it.barcode.toLowerCase().includes(q)) ||
        (it.category && it.category.toLowerCase().includes(q)) ||
        (it.rackName && it.rackName.toLowerCase().includes(q));

      const matchZero = !hideZeroStock || it.systemStock > 0 || (it.physicalStock || 0) > 0;
      return matchQ && matchZero;
    });
  }, [activeItems, itemSearchQuery, hideZeroStock]);

  // Discrepancy calculations for active wizard
  const totalSystemCount = activeItems.reduce((sum, it) => sum + (it.systemStock || 0), 0);
  const totalPhysicalCount = activeItems.reduce((sum, it) => sum + (it.physicalStock || 0), 0);
  const totalDiffCount = totalPhysicalCount - totalSystemCount;
  const totalDiscrepancyVal = activeItems.reduce((sum, it) => sum + (it.discrepancyValue || 0), 0);

  const surplusItems = activeItems.filter((it) => (it.difference || 0) > 0);
  const deficitItems = activeItems.filter((it) => (it.difference || 0) < 0);
  const matchedItems = activeItems.filter((it) => (it.difference || 0) === 0);

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 text-xs font-semibold rounded-xl shadow-xl flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2 ${
            toastMessage.type === 'success' ? 'bg-teal-600 text-white' : 'bg-rose-600 text-white'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* TOP HEADER CONTROLS */}
      {view === 'list' && (
        <div className="space-y-4">
          {/* Opname Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 block">Total Opname Selesai</span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">
                {stockOpnames.filter((so) => so.status === 'Completed').length} Sesi
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 block">Draf Sesi Belum Selesai</span>
              <span className="text-xl font-bold text-amber-600 mt-1 block">
                {stockOpnames.filter((so) => so.status === 'Draft').length} Draf
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 block">Jadwal Opname Terjadwal</span>
              <span className="text-xl font-bold text-teal-700 mt-1 block">
                {stockOpnameSchedules.length} Agenda
              </span>
            </div>
          </div>

          {/* Opname History Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900">Riwayat & Sesi Stock Opname</h4>
              <span className="text-[11px] text-slate-400">{stockOpnames.length} Rekaman</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">No. Opname</th>
                    <th className="py-3 px-4">Tanggal & Operator</th>
                    <th className="py-3 px-4">Cakupan Ruang Lingkup</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Selisih Barang</th>
                    <th className="py-3 px-4 text-right">Nilai Selisih HPP</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockOpnames.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <ClipboardCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p>Belum ada sesi stock opname yang tercatat.</p>
                      </td>
                    </tr>
                  ) : (
                    pagedStockOpnames.map((so) => (
                      <tr key={so.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-teal-700">{so.opnameNumber}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">
                            {new Date(so.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                          <div className="text-[10px] text-slate-400">{so.performedBy}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs text-slate-700 font-medium">
                            {so.scope === 'All'
                              ? 'Semua Produk'
                              : `${so.scope}: ${so.scopeTargetName || so.scopeTargetId}`}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              so.status === 'Completed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {so.status === 'Completed' ? 'Selesai & Disesuaikan' : 'Draf Perhitungan'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          <span
                            className={
                              (so.totalDiscrepancyStock || 0) === 0
                                ? 'text-slate-600'
                                : (so.totalDiscrepancyStock || 0) > 0
                                ? 'text-emerald-700 font-bold'
                                : 'text-rose-600 font-bold'
                            }
                          >
                            {(so.totalDiscrepancyStock || 0) > 0 ? `+${so.totalDiscrepancyStock}` : so.totalDiscrepancyStock} pcs
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold">
                          <span
                            className={
                              (so.totalDiscrepancyValue || 0) === 0
                                ? 'text-slate-600'
                                : (so.totalDiscrepancyValue || 0) > 0
                                ? 'text-emerald-700'
                                : 'text-rose-600'
                            }
                          >
                            {formatRupiah(so.totalDiscrepancyValue || 0)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOpnameForDetail(so);
                                setView('detail');
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                              title="Lihat Laporan Detail"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {so.status === 'Draft' && (
                              <button
                                type="button"
                                onClick={() => handleResumeOpname(so)}
                                className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                                title="Lanjutkan Perhitungan Draf"
                              >
                                <RefreshCcw className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {so.status === 'Draft' && (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteOpname(so)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Hapus Draf"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Standard 20-row Pagination Bar */}
            <TablePagination
              currentPage={historyPage}
              totalItems={stockOpnames.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setHistoryPage}
              itemName="sesi stock opname"
            />
          </div>
        </div>
      )}

      {/* VIEW: STOCK OPNAME WIZARD (4 STEPS) */}
      {view === 'wizard' && (
        <div className="space-y-4 max-w-5xl mx-auto">
          {/* Stepper Header */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setView('list')}
                className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingOpnameId ? 'Lanjutkan Stock Opname' : 'Sesi Stock Opname Baru'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Langkah {wizardStep} dari 4: {wizardStep === 1 ? 'Ruang Lingkup' : wizardStep === 2 ? 'Penghitungan Fisik' : wizardStep === 3 ? 'Analisis Selisih' : 'Konfirmasi & Rekonsiliasi'}
                </p>
              </div>
            </div>

            {/* Stepper pills */}
            <div className="flex items-center space-x-1.5 text-xs font-semibold">
              {[
                { step: 1, label: '1. Ruang Lingkup' },
                { step: 2, label: '2. Hitung Fisik' },
                { step: 3, label: '3. Selisih' },
                { step: 4, label: '4. Finalisasi' },
              ].map((s) => (
                <span
                  key={s.step}
                  className={`px-3 py-1.5 rounded-xl transition-colors ${
                    wizardStep === s.step
                      ? 'bg-teal-600 text-white'
                      : wizardStep > s.step
                      ? 'bg-teal-50 text-teal-700 border border-teal-200'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {s.label}
                </span>
              ))}
            </div>
          </div>

          {/* STEP 1: SCOPE SELECTION */}
          {wizardStep === 1 && (
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="font-bold text-sm text-slate-900">Pilih Ruang Lingkup Opname</h4>
                <p className="text-xs text-slate-500">
                  Tentukan apakah opname mencakup seluruh toko atau spesifik per rak / kategori
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setScope('All');
                    setScopeTargetId('');
                    setScopeTargetName('');
                  }}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    scope === 'All'
                      ? 'bg-teal-50/60 border-teal-500 text-teal-900 ring-2 ring-teal-500/20'
                      : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="font-bold text-sm block">Semua Produk</span>
                  <span className="text-xs text-slate-500 mt-1 block">
                    Hitung seluruh {products.filter((p) => !p.isArchived).length} item yang aktif di toko
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setScope('Category');
                    if (categories.length > 0) {
                      setScopeTargetId(categories[0].name);
                      setScopeTargetName(categories[0].name);
                    }
                  }}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    scope === 'Category'
                      ? 'bg-teal-50/60 border-teal-500 text-teal-900 ring-2 ring-teal-500/20'
                      : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="font-bold text-sm block">Per Kategori</span>
                  <span className="text-xs text-slate-500 mt-1 block">
                    Fokus menghitung produk dalam kelompok kategori tertentu
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setScope('Rack');
                    if (racks.length > 0) {
                      setScopeTargetId(racks[0].id);
                      setScopeTargetName(`${racks[0].code} - ${racks[0].name}`);
                    }
                  }}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    scope === 'Rack'
                      ? 'bg-teal-50/60 border-teal-500 text-teal-900 ring-2 ring-teal-500/20'
                      : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="font-bold text-sm block">Per Rak (Lokasi)</span>
                  <span className="text-xs text-slate-500 mt-1 block">
                    Opname fisik terstruktur berdasarkan lorong atau rak penyimpanan
                  </span>
                </button>
              </div>

              {/* Scope Detail Dropdowns */}
              {scope === 'Category' && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <label className="font-semibold text-slate-700">Pilih Kategori Target:</label>
                  <select
                    value={scopeTargetId}
                    onChange={(e) => {
                      setScopeTargetId(e.target.value);
                      setScopeTargetName(e.target.value);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({products.filter((p) => p.category === c.name && !p.isArchived).length} item)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {scope === 'Rack' && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <label className="font-semibold text-slate-700">Pilih Rak Target:</label>
                  <select
                    value={scopeTargetId}
                    onChange={(e) => {
                      const found = racks.find((r) => r.id === e.target.value);
                      setScopeTargetId(e.target.value);
                      setScopeTargetName(found ? `${found.code} - ${found.name}` : e.target.value);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
                  >
                    {racks.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.code} - {r.name} ({products.filter((p) => p.rackId === r.id && !p.isArchived).length} item)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1 text-xs">
                  Catatan Sesi Opname (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Opname rutin akhir bulan, pemeriksaan rak minuman"
                  value={opnameNotes}
                  onChange={(e) => setOpnameNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleProceedToCount}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer transition-colors"
                >
                  <span>Mulai Penghitungan Fisik</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: COUNTING PHYSICAL STOCK */}
          {wizardStep === 2 && (
            <div className="space-y-4">
              {/* Controls bar */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-1 items-center gap-2 max-w-lg">
                  <div className="relative w-full">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari nama barang atau scan barcode..."
                      value={itemSearchQuery}
                      onChange={(e) => setItemSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="flex items-center space-x-1 px-3 py-2 bg-teal-50 border border-teal-200 hover:bg-teal-100 text-teal-700 rounded-xl text-xs font-semibold shrink-0 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Scan</span>
                  </button>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={isSubmitting}
                    className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Simpan Draf
                  </button>
                  <button
                    type="button"
                    onClick={() => setWizardStep(3)}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer transition-colors"
                  >
                    <span>Analisis Selisih ({activeItems.length} item)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Counting Table */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto max-h-[60vh]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="py-3 px-4">Nama Produk</th>
                        <th className="py-3 px-3">Kategori / Rak</th>
                        <th className="py-3 px-3 text-right">Stok Sistem</th>
                        <th className="py-3 px-4 text-center">Fisik Nyata (Input)</th>
                        <th className="py-3 px-3 text-right">Selisih</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCountingItems.map((item) => {
                        const diff = (item.physicalStock || 0) - item.systemStock;

                        return (
                          <tr key={item.productId} className="hover:bg-slate-50/70">
                            <td className="py-2.5 px-4">
                              <div className="font-semibold text-slate-800">{item.productName}</div>
                              {item.barcode && (
                                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                                  <Barcode className="w-3 h-3 text-slate-400" />
                                  <span>{item.barcode}</span>
                                </span>
                              )}
                            </td>

                            <td className="py-2.5 px-3 text-slate-500">
                              <div>{item.category}</div>
                              {item.rackName && (
                                <span className="text-[10px] text-teal-700 font-mono font-medium">
                                  {item.rackName}
                                </span>
                              )}
                            </td>

                            <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                              {item.systemStock} {item.unit}
                            </td>

                            {/* Physical Input */}
                            <td className="py-2.5 px-4 text-center">
                              <div className="inline-flex items-center space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItemPhysical(item.productId, Math.max(0, (item.physicalStock || 0) - 1))}
                                  className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-600 cursor-pointer"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  value={item.physicalStock ?? ''}
                                  onChange={(e) => handleUpdateItemPhysical(item.productId, e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                                  className="w-20 text-center font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg py-1.5 text-xs text-slate-900 focus:bg-white focus:border-teal-500 focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItemPhysical(item.productId, (item.physicalStock || 0) + 1)}
                                  className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-600 cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </td>

                            <td className="py-2.5 px-3 text-right font-mono font-semibold">
                              <span
                                className={
                                  diff === 0
                                    ? 'text-slate-400'
                                    : diff > 0
                                    ? 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded'
                                    : 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded'
                                }
                              >
                                {diff > 0 ? `+${diff}` : diff} {item.unit}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: COMPARISON & DISCREPANCY ANALYSIS */}
          {wizardStep === 3 && (
            <div className="space-y-4">
              {/* Discrepancy Breakdown Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
                  <span className="text-[11px] text-slate-500">Stok Sistem vs Fisik</span>
                  <div className="text-base font-bold text-slate-900 mt-0.5 font-mono">
                    {totalSystemCount} &rarr; {totalPhysicalCount} pcs
                  </div>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
                  <span className="text-[11px] text-slate-500">Barang Cocok (Akurat)</span>
                  <div className="text-base font-bold text-emerald-700 mt-0.5">
                    {matchedItems.length} Produk
                  </div>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
                  <span className="text-[11px] text-slate-500">Barang Selisih Lebih / Kurang</span>
                  <div className="text-base font-bold text-amber-600 mt-0.5">
                    +{surplusItems.length} lebih / {deficitItems.length} kurang
                  </div>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
                  <span className="text-[11px] text-slate-500">Total Selisih Nilai HPP</span>
                  <div
                    className={`text-base font-bold mt-0.5 font-mono ${
                      totalDiscrepancyVal >= 0 ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {formatRupiah(totalDiscrepancyVal)}
                  </div>
                </div>
              </div>

              {/* Table of Discrepancies */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">Rincian Selisih per Produk</h4>
                  <span className="text-[11px] text-slate-500">
                    {surplusItems.length + deficitItems.length} dari {activeItems.length} item memiliki perbedaan
                  </span>
                </div>

                <div className="overflow-x-auto max-h-[50vh]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Nama Produk</th>
                        <th className="p-3 text-right">Sistem</th>
                        <th className="p-3 text-right">Fisik</th>
                        <th className="p-3 text-right">Selisih</th>
                        <th className="p-3 text-right">HPP Item</th>
                        <th className="p-3 text-right">Dampak Nilai (Rp)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeItems.map((it) => {
                        const diff = (it.physicalStock || 0) - it.systemStock;
                        return (
                          <tr key={it.productId} className="hover:bg-slate-50">
                            <td className="p-3 font-semibold text-slate-800">{it.productName}</td>
                            <td className="p-3 text-right font-mono text-slate-600">{it.systemStock} {it.unit}</td>
                            <td className="p-3 text-right font-mono font-bold text-slate-900">{it.physicalStock} {it.unit}</td>
                            <td className="p-3 text-right font-mono">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                  diff === 0
                                    ? 'text-slate-400 bg-slate-100'
                                    : diff > 0
                                    ? 'text-emerald-700 bg-emerald-50'
                                    : 'text-rose-600 bg-rose-50'
                                }`}
                              >
                                {diff > 0 ? `+${diff}` : diff}
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono text-slate-600">{formatRupiah(it.cogs)}</td>
                            <td className="p-3 text-right font-mono font-bold">
                              <span className={diff >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                                {formatRupiah(it.discrepancyValue || 0)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  &larr; Kembali ke Hitung Fisik
                </button>

                <button
                  type="button"
                  onClick={() => setWizardStep(4)}
                  className="flex items-center space-x-1.5 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
                >
                  <span>Lanjut ke Rekonsiliasi & Finalisasi</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: RECONCILE & FINALIZE INVENTORY */}
          {wizardStep === 4 && (
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="font-bold text-sm text-slate-900">Konfirmasi Penyesuaian Inventaris (Rekonsiliasi)</h4>
                <p className="text-xs text-slate-500">
                  Menyelesaikan sesi ini akan otomatis memperbarui stok master produk di database sesuai hasil fisik nyata.
                </p>
              </div>

              <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl space-y-2 text-xs text-teal-900">
                <div className="flex items-center space-x-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>Ringkasan Dampak Rekonsiliasi</span>
                </div>
                <p className="text-slate-700">
                  Sebanyak <strong>{activeItems.length} produk</strong> akan disinkronkan. Total perubahan unit adalah <strong>{totalDiffCount > 0 ? `+${totalDiffCount}` : totalDiffCount} pcs</strong> dengan estimasi nilai dampak HPP sebesar <strong>{formatRupiah(totalDiscrepancyVal)}</strong>.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 text-xs">
                  Catatan Akhir Opname / Berita Acara (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={opnameNotes}
                  onChange={(e) => setOpnameNotes(e.target.value)}
                  placeholder="Contoh: Stok telah dicek bersama kepala gudang dan kasir. Ditemukan 2 bungkus wafer rusak/kadaluarsa."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setWizardStep(3)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  &larr; Periksa Ulang Selisih
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowConfirmSaveDraft(true)}
                    disabled={isSubmitting}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Simpan Draf Saja
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setShowConfirmFinalize(true)}
                    className="flex items-center space-x-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-md shadow-teal-600/20 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSubmitting ? 'Memproses...' : 'Finalisasi & Sesuaikan Stok'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: DETAIL & REPORT OF COMPLETED OPNAME */}
      {view === 'detail' && selectedOpnameForDetail && (
        <div className="space-y-4 max-w-4xl mx-auto">
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs flex items-center justify-between">
            <button
              type="button"
              onClick={() => setView('list')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Riwayat</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-teal-600" />
              <span>Cetak Berita Acara Opname</span>
            </button>
          </div>

          {/* Printable Report Card */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-6">
            <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Laporan Hasil Stock Opname & Rekonsiliasi
                </h3>
                <p className="text-xs text-slate-500">{settings.name || 'Warung Juara'}</p>
              </div>

              <div className="text-right">
                <span className="font-mono font-bold text-sm text-teal-700">
                  {selectedOpnameForDetail.opnameNumber}
                </span>
                <p className="text-[11px] text-slate-500">
                  Selesai: {new Date(selectedOpnameForDetail.completedAt || selectedOpnameForDetail.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-500 block text-[10px]">Cakupan</span>
                <strong className="text-slate-900">
                  {selectedOpnameForDetail.scope === 'All' ? 'Semua Produk' : `${selectedOpnameForDetail.scope}: ${selectedOpnameForDetail.scopeTargetName}`}
                </strong>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-500 block text-[10px]">Operator Kasir</span>
                <strong className="text-slate-900">{selectedOpnameForDetail.performedBy}</strong>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-500 block text-[10px]">Total Selisih Unit</span>
                <strong className="text-slate-900 font-mono">
                  {(selectedOpnameForDetail.totalDiscrepancyStock || 0) > 0 ? `+${selectedOpnameForDetail.totalDiscrepancyStock}` : selectedOpnameForDetail.totalDiscrepancyStock} pcs
                </strong>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-500 block text-[10px]">Total Nilai Selisih HPP</span>
                <strong className="text-teal-700 font-mono">
                  {formatRupiah(selectedOpnameForDetail.totalDiscrepancyValue || 0)}
                </strong>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Produk</th>
                    <th className="p-2.5 text-right">Stok Sistem Awal</th>
                    <th className="p-2.5 text-right">Fisik Terhitung</th>
                    <th className="p-2.5 text-right">Selisih</th>
                    <th className="p-2.5 text-right">HPP Item</th>
                    <th className="p-2.5 text-right">Nilai Selisih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedOpnameForDetail.items.map((it) => (
                    <tr key={it.productId}>
                      <td className="p-2.5 font-semibold text-slate-800">{it.productName}</td>
                      <td className="p-2.5 text-right font-mono text-slate-600">{it.systemStock} {it.unit}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">{it.physicalStock} {it.unit}</td>
                      <td className="p-2.5 text-right font-mono">
                        <span
                          className={
                            (it.difference || 0) === 0
                              ? 'text-slate-500'
                              : (it.difference || 0) > 0
                              ? 'text-emerald-700 font-bold'
                              : 'text-rose-600 font-bold'
                          }
                        >
                          {(it.difference || 0) > 0 ? `+${it.difference}` : it.difference} {it.unit}
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-mono text-slate-600">{formatRupiah(it.cogs)}</td>
                      <td className="p-2.5 text-right font-mono font-semibold text-slate-800">
                        {formatRupiah(it.discrepancyValue || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedOpnameForDetail.notes && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <span className="font-semibold text-slate-700">Catatan / Berita Acara:</span>
                <p className="text-slate-600">{selectedOpnameForDetail.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: SCHEDULE MANAGEMENT */}
      {view === 'schedule' && (
        <div className="space-y-4 max-w-4xl mx-auto">
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs flex items-center justify-between">
            <button
              type="button"
              onClick={() => setView('list')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Riwayat</span>
            </button>

            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Jadwal Opname</span>
            </button>
          </div>

          {/* Schedule List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stockOpnameSchedules.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white border border-slate-200 rounded-2xl p-6 space-y-2">
                <Calendar className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold text-slate-700">Belum ada agenda jadwal opname</p>
                <p className="text-[11px] text-slate-500">
                  Buat jadwal mingguan atau bulanan agar staf kasir konsisten melakukan audit fisik stok.
                </p>
              </div>
            ) : (
              stockOpnameSchedules.map((sch) => (
                <div
                  key={sch.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                        {sch.frequency === 'daily' ? 'Harian' : sch.frequency === 'weekly' ? 'Mingguan' : sch.frequency === 'monthly' ? 'Bulanan' : 'Kustom'}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 mt-2">{sch.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Cakupan: {sch.scope === 'All' ? 'Semua Produk' : `${sch.scope}: ${sch.scopeTargetName || sch.scopeTargetId}`}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setConfirmDeleteSchedule(sch)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      <span>Jadwal Berikutnya: <strong>{new Date(sch.scheduledDate).toLocaleDateString('id-ID')}</strong></span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SCHEDULE MODAL */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Tambah Jadwal Stock Opname</h3>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Judul / Agenda Jadwal *</label>
                <input
                  type="text"
                  placeholder="Contoh: Audit Stok Minuman Akhir Pekan"
                  value={scheduleTitle}
                  onChange={(e) => setScheduleTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Frekuensi</label>
                  <select
                    value={scheduleFrequency}
                    onChange={(e) => setScheduleFrequency(e.target.value as 'daily' | 'weekly' | 'monthly' | 'custom')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
                  >
                    <option value="weekly">Mingguan</option>
                    <option value="monthly">Bulanan</option>
                    <option value="daily">Harian</option>
                    <option value="custom">Kustom</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={scheduleNextDate}
                    onChange={(e) => setScheduleNextDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cakupan Ruang Lingkup</label>
                <select
                  value={scheduleScope}
                  onChange={(e) => setScheduleScope(e.target.value as 'All' | 'Category' | 'Rack')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
                >
                  <option value="All">Semua Produk</option>
                  <option value="Category">Per Kategori</option>
                  <option value="Rack">Per Rak</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!scheduleTitle.trim()) {
                    showToast('Judul jadwal wajib diisi', 'error');
                    return;
                  }
                  await addStockOpnameSchedule({
                    title: scheduleTitle.trim(),
                    frequency: scheduleFrequency,
                    scheduledDate: scheduleNextDate,
                    scope: scheduleScope,
                    isActive: true,
                  });
                  setIsScheduleModalOpen(false);
                  setScheduleTitle('');
                  showToast('Jadwal opname berhasil ditambahkan!');
                }}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm"
              >
                Simpan Jadwal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Camera Modal */}
      {isScannerOpen && (
        <BarcodeScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={(code) => {
            handleBarcodeScanned(code);
          }}
          title="Stock Opname: Scan Barcode Fisik"
          subtitle="Arahkan kamera ke barcode produk untuk menambah hitungan fisik secara instan"
        />
      )}

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={Boolean(confirmDeleteOpname)}
        onClose={() => setConfirmDeleteOpname(null)}
        onConfirm={async () => {
          if (confirmDeleteOpname) {
            await deleteStockOpname(confirmDeleteOpname.id);
            showToast(`Draf sesi ${confirmDeleteOpname.opnameNumber} berhasil dihapus.`);
            setConfirmDeleteOpname(null);
          }
        }}
        type="danger"
        title="Hapus Draf Stock Opname?"
        description={
          <span>
            Apakah Anda yakin ingin menghapus draf sesi <strong>{confirmDeleteOpname?.opnameNumber}</strong>? Data hitungan fisik yang belum difinalisasi akan dihapus.
          </span>
        }
        confirmText="Hapus Draf"
        cancelText="Batal"
      />

      <ConfirmDialog
        isOpen={Boolean(confirmDeleteSchedule)}
        onClose={() => setConfirmDeleteSchedule(null)}
        onConfirm={async () => {
          if (confirmDeleteSchedule) {
            await deleteStockOpnameSchedule(confirmDeleteSchedule.id);
            showToast('Jadwal stock opname berhasil dihapus.');
            setConfirmDeleteSchedule(null);
          }
        }}
        type="danger"
        title="Hapus Jadwal Stock Opname?"
        description={
          <span>
            Hapus agenda jadwal <strong>{confirmDeleteSchedule?.title}</strong>? Agenda ini tidak akan muncul lagi di kalender opname.
          </span>
        }
        confirmText="Hapus Jadwal"
        cancelText="Batal"
      />

      <ConfirmDialog
        isOpen={showConfirmSaveDraft}
        onClose={() => setShowConfirmSaveDraft(false)}
        onConfirm={async () => {
          await handleSaveDraft();
          setShowConfirmSaveDraft(false);
        }}
        type="primary"
        title="Simpan Sebagai Draf?"
        description="Sesi opname ini akan disimpan sebagai draf sementara. Stok inventaris belum akan disesuaikan sampai Anda memfinalisasinya."
        confirmText="Simpan Draf"
        cancelText="Batal"
      />

      <ConfirmDialog
        isOpen={showConfirmFinalize}
        onClose={() => setShowConfirmFinalize(false)}
        onConfirm={async () => {
          await handleFinalize();
          setShowConfirmFinalize(false);
        }}
        type="warning"
        title="Finalisasi & Sesuaikan Stok Inventaris?"
        description="Stok sistem seluruh produk yang diaudit akan langsung disesuaikan dengan angka hitungan fisik riil. Tindakan ini juga akan mencatat riwayat selisih HPP pada buku inventaris."
        confirmText="Ya, Sesuaikan Stok Sekarang"
        cancelText="Periksa Lagi"
      />
    </div>
  );
});
