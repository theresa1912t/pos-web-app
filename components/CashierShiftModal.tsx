'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatRupiah, formatDateTime } from '@/lib/utils';
import { triggerCashDrawerOpen } from '@/lib/hardwareBridge';
import {
  X,
  Lock,
  Unlock,
  Coins,
  Receipt,
  AlertCircle,
  CheckCircle2,
  PlusCircle,
  MinusCircle,
  Calculator,
  Info,
  ArrowRight,
} from 'lucide-react';
import { CashierShift } from '@/types';

interface CashierShiftModalProps {
  onOpenZReport?: (shift: CashierShift) => void;
}

export function CashierShiftModal({ onOpenZReport }: CashierShiftModalProps) {
  const {
    cashierShifts,
    branches,
    activeBranchId,
    accessibleBranches,
    user,
    startShift,
    closeShift,
    addCashMovement,
    isShiftModalOpen,
    setIsShiftModalOpen,
    shiftModalBranchId,
    setShiftModalBranchId,
    setSelectedShiftForZReport,
  } = useApp();

  // Tab state: 'overview' | 'close' | 'history'
  const [activeTab, setActiveTab] = useState<'overview' | 'close' | 'history'>('overview');

  // Start shift form state
  const [startingCashInput, setStartingCashInput] = useState<string>('200000');
  const [startNotes, setStartNotes] = useState<string>('');
  const [isStarting, setIsStarting] = useState(false);

  // Cash movement form state (Petty Cash in/out)
  const [isAddingMovement, setIsAddingMovement] = useState(false);
  const [movementType, setMovementType] = useState<'CashIn' | 'CashOut'>('CashOut');
  const [movementAmount, setMovementAmount] = useState<string>('');
  const [movementReason, setMovementReason] = useState<string>('');
  const [isSubmittingMovement, setIsSubmittingMovement] = useState(false);

  // Close shift form state
  const [actualCashInput, setActualCashInput] = useState<string>('');
  const [closeNotes, setCloseNotes] = useState<string>('');
  const [showDenominations, setShowDenominations] = useState(false);
  const [denominations, setDenominations] = useState<{ [denom: number]: number }>({});
  const [isClosing, setIsClosing] = useState(false);
  const [drawerKickFeedback, setDrawerKickFeedback] = useState<string | null>(null);

  if (!isShiftModalOpen) return null;

  // Resolve target branch
  const effectiveBranchId =
    shiftModalBranchId ||
    (activeBranchId !== 'all' ? activeBranchId : branches[0]?.id || 'branch-1');
  const targetBranch = branches.find((b) => b.id === effectiveBranchId) || branches[0];
  const currentBranchName = targetBranch?.name || 'Cabang Utama';

  // Compute active open shift for this specific target branch
  const activeShift = cashierShifts.find((s) => s.status === 'Open' && s.branchId === effectiveBranchId) || null;

  // Shifts history for this branch
  const branchClosedShifts = cashierShifts
    .filter((s) => s.branchId === effectiveBranchId && s.status === 'Closed')
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  // Handle open drawer trigger
  const handleQuickDrawerKick = async () => {
    const res = await triggerCashDrawerOpen();
    setDrawerKickFeedback(
      res.success ? 'Sinyal buka laci kasir (Drawer Kick) berhasil dikirim!' : 'Simulasi laci terbuka (mode web)'
    );
    setTimeout(() => setDrawerKickFeedback(null), 3000);
  };

  // Handle start shift
  const handleStartShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(startingCashInput) || 0;
    if (amount < 0) return;

    setIsStarting(true);
    try {
      await startShift(amount, startNotes, effectiveBranchId);
      await triggerCashDrawerOpen();
      setActiveTab('overview');
    } finally {
      setIsStarting(false);
    }
  };

  // Handle add petty cash / cash in
  const handleAddMovementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;
    const amount = Number(movementAmount) || 0;
    if (amount <= 0 || !movementReason.trim()) return;

    setIsSubmittingMovement(true);
    try {
      await addCashMovement(activeShift.id, movementType, amount, movementReason.trim());
      setMovementAmount('');
      setMovementReason('');
      setIsAddingMovement(false);
    } finally {
      setIsSubmittingMovement(false);
    }
  };

  // Denomination calculator
  const handleDenominationChange = (denom: number, count: number) => {
    const updated = { ...denominations, [denom]: Math.max(0, count) };
    setDenominations(updated);

    const total = Object.entries(updated).reduce((sum, [d, c]) => sum + Number(d) * (Number(c) || 0), 0);
    setActualCashInput(String(total));
  };

  // Handle close shift
  const handleCloseShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;
    const actualCash = Number(actualCashInput) || 0;

    setIsClosing(true);
    try {
      const closed = await closeShift(activeShift.id, actualCash, closeNotes);
      await triggerCashDrawerOpen();
      setIsShiftModalOpen(false);

      if (closed) {
        if (onOpenZReport) {
          onOpenZReport(closed);
        } else {
          setSelectedShiftForZReport(closed);
        }
      }
    } finally {
      setIsClosing(false);
    }
  };

  // Calculate live difference for close tab
  const parsedActualCash = Number(actualCashInput) || 0;
  const liveDifference = activeShift ? parsedActualCash - activeShift.expectedEndingCash : 0;
  const isBalanced = Math.abs(liveDifference) < 1;
  const isSurplus = liveDifference > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="cashier-shift-modal"
        className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-900"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/60">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
              <h2 className="text-base font-semibold text-slate-900">
                Shift Kasir
              </h2>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              {accessibleBranches && accessibleBranches.length > 1 ? (
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs text-slate-500 font-medium">Cabang:</span>
                  <select
                    value={effectiveBranchId}
                    onChange={(e) => setShiftModalBranchId(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer shadow-2xs"
                  >
                    {accessibleBranches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <span className="text-xs text-slate-600 font-medium">{currentBranchName}</span>
              )}
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500">
                {activeShift ? `Shift Aktif (${activeShift.shiftNumber})` : 'Belum Ada Shift Aktif'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsShiftModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs (if shift is open) */}
        {activeShift && (
          <div className="flex border-b border-slate-200 bg-slate-50/40 px-5 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`pb-2.5 pt-2.5 font-medium transition-colors border-b-2 cursor-pointer mr-6 ${
                activeTab === 'overview'
                  ? 'border-teal-600 text-teal-700 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Status Kas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('close')}
              className={`pb-2.5 pt-2.5 font-medium transition-colors border-b-2 cursor-pointer mr-6 ${
                activeTab === 'close'
                  ? 'border-teal-600 text-teal-700 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Tutup Shift (Closing Kasir)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`pb-2.5 pt-2.5 font-medium transition-colors border-b-2 cursor-pointer ${
                activeTab === 'history'
                  ? 'border-teal-600 text-teal-700 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Riwayat Shift ({branchClosedShifts.length})
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* CASE 1: NO ACTIVE SHIFT FOR CURRENT BRANCH */}
          {!activeShift && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-xs space-y-2 text-teal-900">
                <div className="flex items-center space-x-2 text-teal-800 font-semibold text-sm">
                  <Unlock className="w-4 h-4 shrink-0 text-teal-600" />
                  <span>Buka Shift Kasir Baru</span>
                </div>
                <p className="text-teal-700 leading-relaxed">
                  Laci kasir belum dibuka untuk cabang ini. Masukkan modal awal uang kembalian untuk memulai shift.
                  Sistem akan otomatis mencatat omzet tunai, non-tunai, dan mutasi kas hingga shift ditutup.
                </p>
              </div>

              <form onSubmit={handleStartShiftSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-medium mb-1.5">
                    Kas Modal Awal di Laci (Uang Kembalian):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400 font-semibold">Rp</span>
                    <input
                      type="text"
                      required
                      value={startingCashInput}
                      onChange={(e) => setStartingCashInput(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="200000"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  {/* Quick Preset Buttons */}
                  <div className="flex items-center space-x-2 mt-2">
                    {[100000, 200000, 300000, 500000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setStartingCashInput(String(amt))}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] text-slate-700 border border-slate-200 transition-colors cursor-pointer font-medium"
                      >
                        {formatRupiah(amt)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-slate-500 text-[11px] block">Kasir Bertugas:</span>
                    <span className="font-semibold text-sm text-slate-900">{user?.name || 'Kasir Saat Ini'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-slate-500 text-[11px] block">Cabang Toko:</span>
                    <span className="font-semibold text-sm text-slate-900">{currentBranchName}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Catatan Pembukaan (Opsional):
                  </label>
                  <input
                    type="text"
                    value={startNotes}
                    onChange={(e) => setStartNotes(e.target.value)}
                    placeholder="Contoh: Pecahan Rp 5rb 10 lembar, Rp 10rb 15 lembar..."
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isStarting}
                    className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-semibold rounded-xl transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>{isStarting ? 'Membuka Shift...' : 'Buka Shift & Laci Kasir Sekarang'}</span>
                  </button>
                </div>
              </form>

              {/* Closed shifts history shortcut */}
              {branchClosedShifts.length > 0 && (
                <div className="pt-4 border-t border-slate-200">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                    Riwayat Shift Sebelumnya ({branchClosedShifts.length})
                  </h3>
                  <div className="space-y-2">
                    {branchClosedShifts.slice(0, 3).map((shift) => (
                      <div
                        key={shift.id}
                        className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-slate-900">{shift.shiftNumber}</span>
                            <span className="text-slate-500 text-[11px]">• {shift.cashierName}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {shift.endTime ? formatDateTime(shift.endTime) : formatDateTime(shift.startTime)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsShiftModalOpen(false);
                            setSelectedShiftForZReport(shift);
                          }}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-teal-700 text-xs font-medium border border-slate-200 transition-colors cursor-pointer"
                        >
                          <Receipt className="w-3.5 h-3.5 text-teal-600" />
                          <span>Z-Report</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CASE 2: ACTIVE SHIFT EXISTS */}
          {activeShift && activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Shift info banner */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold tracking-wide uppercase">
                      ● Shift Aktif
                    </span>
                    <span className="font-semibold text-slate-900">{activeShift.shiftNumber}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Kasir: <strong className="text-slate-700">{activeShift.cashierName}</strong> • Buka: {formatDateTime(activeShift.startTime)}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleQuickDrawerKick}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium transition-colors cursor-pointer shadow-2xs"
                    title="Buka Laci Kasir (Cash Drawer Kick)"
                  >
                    <Unlock className="w-3.5 h-3.5 text-teal-600" />
                    <span className="hidden sm:inline">Buka Laci</span>
                  </button>
                </div>
              </div>

              {drawerKickFeedback && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs text-center animate-in fade-in">
                  ✓ {drawerKickFeedback}
                </div>
              )}

              {/* 4 Clean Stat Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-slate-500 block text-[11px]">Kas Modal Awal</span>
                  <span className="text-sm sm:text-base font-semibold text-slate-900 mt-1 block">
                    {formatRupiah(activeShift.startingCash)}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-slate-500 block text-[11px]">Penjualan Tunai</span>
                  <span className="text-sm sm:text-base font-semibold text-emerald-600 mt-1 block">
                    {formatRupiah(activeShift.cashSalesTotal)}
                  </span>
                  <span className="text-[10px] text-slate-400">{activeShift.totalOrdersCount} struk</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-slate-500 block text-[11px]">Penjualan Non-Tunai</span>
                  <span className="text-sm sm:text-base font-semibold text-slate-700 mt-1 block">
                    {formatRupiah(activeShift.nonCashSalesTotal)}
                  </span>
                  <span className="text-[10px] text-slate-400">QRIS / Transfer</span>
                </div>

                <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl">
                  <span className="text-teal-800 font-semibold block text-[11px]">Kas Laci Saat Ini</span>
                  <span className="text-sm sm:text-base font-bold text-teal-900 mt-1 block font-mono">
                    {formatRupiah(activeShift.expectedEndingCash)}
                  </span>
                  <span className="text-[10px] text-teal-700">Uang fisik seharusnya</span>
                </div>
              </div>

              {/* Petty Cash / Kas Movement Action */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">Arus Kas Masuk & Keluar (Petty Cash)</span>
                  <button
                    type="button"
                    onClick={() => setIsAddingMovement(!isAddingMovement)}
                    className="flex items-center space-x-1 text-teal-700 hover:text-teal-800 font-medium cursor-pointer"
                  >
                    {isAddingMovement ? (
                      <span>Batal</span>
                    ) : (
                      <>
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Catat Kas Keluar / Masuk</span>
                      </>
                    )}
                  </button>
                </div>

                {isAddingMovement && (
                  <form onSubmit={handleAddMovementSubmit} className="p-3 bg-white border border-slate-200 rounded-xl space-y-3 shadow-2xs">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setMovementType('CashOut')}
                        className={`py-2 rounded-lg font-medium text-center border transition-all cursor-pointer ${
                          movementType === 'CashOut'
                            ? 'bg-rose-50 border-rose-300 text-rose-700 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        Kas Keluar (Petty Cash)
                      </button>
                      <button
                        type="button"
                        onClick={() => setMovementType('CashIn')}
                        className={`py-2 rounded-lg font-medium text-center border transition-all cursor-pointer ${
                          movementType === 'CashIn'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        Kas Masuk (Tambah Modal)
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-600 mb-1 font-medium">Nominal (Rp):</label>
                        <input
                          type="text"
                          required
                          value={movementAmount}
                          onChange={(e) => setMovementAmount(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="Contoh: 25000"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1 font-medium">Keperluan / Keterangan:</label>
                        <input
                          type="text"
                          required
                          value={movementReason}
                          onChange={(e) => setMovementReason(e.target.value)}
                          placeholder="Misal: Beli kantong kresek, galon air, es batu..."
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={isSubmittingMovement}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        {isSubmittingMovement ? 'Menyimpan...' : 'Simpan Mutasi Kas'}
                      </button>
                    </div>
                  </form>
                )}

                {/* List of movements during active shift */}
                {activeShift.cashMovements && activeShift.cashMovements.length > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    {activeShift.cashMovements.map((cm) => (
                      <div
                        key={cm.id}
                        className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg text-[11px]"
                      >
                        <div className="flex items-center space-x-2">
                          {cm.type === 'CashOut' ? (
                            <MinusCircle className="w-3.5 h-3.5 text-rose-500" />
                          ) : (
                            <PlusCircle className="w-3.5 h-3.5 text-emerald-500" />
                          )}
                          <span className="text-slate-800 font-medium">{cm.reason}</span>
                          <span className="text-slate-400 text-[10px]">({formatDateTime(cm.createdAt)})</span>
                        </div>
                        <span
                          className={`font-mono font-semibold ${
                            cm.type === 'CashOut' ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {cm.type === 'CashOut' ? '-' : '+'}
                          {formatRupiah(cm.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">
                    Belum ada pengeluaran kas kecil atau setoran kas masuk pada shift ini.
                  </p>
                )}
              </div>

              {/* Primary Call to Action to Closing */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('close')}
                  className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-semibold rounded-xl transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Tutup Shift Kasir</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* ACTIVE SHIFT: CLOSE / SETTLEMENT TAB */}
          {activeShift && activeTab === 'close' && (
            <form onSubmit={handleCloseShiftSubmit} className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Total Kas Sistem Seharusnya (Expected):</span>
                  <span className="font-mono text-base font-bold text-slate-900">
                    {formatRupiah(activeShift.expectedEndingCash)}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                  <Info className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>Modal ({formatRupiah(activeShift.startingCash)}) + Omzet Tunai ({formatRupiah(activeShift.cashSalesTotal)}) + Kas Masuk ({formatRupiah(activeShift.cashInTotal)}) - Kas Keluar ({formatRupiah(activeShift.cashOutTotal)})</span>
                </div>
              </div>

              {/* Physical Cash Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 font-medium">
                    Hitungan Fisik Uang di Laci Kasir:
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowDenominations(!showDenominations)}
                    className="text-teal-700 text-[11px] flex items-center space-x-1 hover:underline cursor-pointer font-medium"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>{showDenominations ? 'Sembunyikan Kalkulator Pecahan' : 'Buka Kalkulator Pecahan'}</span>
                  </button>
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-semibold">Rp</span>
                  <input
                    type="text"
                    required
                    value={actualCashInput}
                    onChange={(e) => setActualCashInput(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Masukkan hasil hitungan fisik..."
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-base font-bold font-mono text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                {/* Denomination breakdown helper */}
                {showDenominations && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <p className="text-[11px] text-slate-600 font-medium">
                      Hitung Jumlah Lembar & Keping Uang:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[100000, 50000, 20000, 10000, 5000, 2000, 1000, 500].map((denom) => (
                        <div key={denom} className="p-2 bg-white border border-slate-200 rounded-lg shadow-2xs">
                          <span className="text-[10px] text-slate-500 block font-mono">
                            {formatRupiah(denom)}
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={denominations[denom] || ''}
                            onChange={(e) => handleDenominationChange(denom, Number(e.target.value))}
                            placeholder="0 lbr"
                            className="w-full mt-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-900 font-mono focus:border-teal-500 focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Difference live indicator */}
              {actualCashInput && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                    isBalanced
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : isSurplus
                      ? 'bg-teal-50 border-teal-200 text-teal-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {isBalanced ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <div>
                      <span className="font-bold">
                        {isBalanced
                          ? 'Kas Seimbang (Klop)'
                          : isSurplus
                          ? 'Kas Lebih (Surplus)'
                          : 'Kas Kurang (Minus)'}
                      </span>
                      <p className="text-[10px] opacity-80">
                        {isBalanced
                          ? 'Hitungan fisik uang persis sesuai dengan catatan transaksi sistem.'
                          : isSurplus
                          ? 'Terdapat kelebihan uang tunai di laci kasir.'
                          : 'Terdapat kekurangan uang tunai di laci kasir. Wajib berikan catatan.'}
                      </p>
                    </div>
                  </div>

                  <span className="font-mono text-sm font-bold">
                    {isBalanced ? 'Rp 0' : `${liveDifference > 0 ? '+' : ''}${formatRupiah(liveDifference)}`}
                  </span>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Catatan Rekonsiliasi & Penutupan:
                </label>
                <textarea
                  rows={2}
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder={
                    !isBalanced && actualCashInput
                      ? 'Tuliskan alasan selisih kas (misal: selisih uang receh pembulatan, kembalian salah, dll)...'
                      : 'Catatan kondisi penutupan kasir...'
                  }
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              {/* Submission Controls */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl transition-colors cursor-pointer font-medium text-xs"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={isClosing || !actualCashInput}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-semibold rounded-xl transition-all shadow-xs flex items-center space-x-2 cursor-pointer disabled:opacity-50 text-xs"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isClosing ? 'Memproses Closing...' : 'Tutup Shift dan Cetak Laporan'}</span>
                </button>
              </div>
            </form>
          )}

          {/* ACTIVE SHIFT: HISTORY TAB */}
          {activeShift && activeTab === 'history' && (
            <div className="space-y-3 text-xs">
              {branchClosedShifts.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  Belum ada riwayat shift yang ditutup untuk cabang ini.
                </div>
              ) : (
                branchClosedShifts.map((shift) => {
                  const diff = shift.difference ?? 0;
                  const isKlop = Math.abs(diff) < 1;
                  return (
                    <div
                      key={shift.id}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-slate-900">{shift.shiftNumber}</span>
                          <span className="text-slate-500 text-[11px]">• {shift.cashierName}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              isKlop
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : diff > 0
                                ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {isKlop ? 'Klop (Rp 0)' : `${diff > 0 ? '+' : ''}${formatRupiah(diff)}`}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Waktu: {formatDateTime(shift.startTime)} s/d {shift.endTime ? formatDateTime(shift.endTime) : '-'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsShiftModalOpen(false);
                          setSelectedShiftForZReport(shift);
                        }}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-teal-700 font-medium border border-slate-200 transition-colors cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5 text-teal-600" />
                        <span>Lihat Struk</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
