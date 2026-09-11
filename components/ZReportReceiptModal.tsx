'use client';

import React from 'react';
import { CashierShift } from '@/types';
import { useApp } from '@/context/AppContext';
import { formatRupiah, formatDateTime } from '@/lib/utils';
import { playPrinterFeedSound } from '@/lib/hardwareBridge';
import { X, Printer, FileText } from 'lucide-react';

interface ZReportReceiptModalProps {
  shift?: CashierShift | null;
  onClose?: () => void;
}

export function ZReportReceiptModal({ shift: propShift, onClose }: ZReportReceiptModalProps) {
  const {
    selectedShiftForZReport,
    setSelectedShiftForZReport,
    branches,
    settings,
  } = useApp();

  const shift = propShift !== undefined ? propShift : selectedShiftForZReport;

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setSelectedShiftForZReport(null);
    }
  };

  // Calculate shift duration deterministically
  const durationText = React.useMemo(() => {
    if (!shift) return '';
    const startTs = new Date(shift.startTime).getTime();
    const endTs = shift.endTime ? new Date(shift.endTime).getTime() : startTs;
    const durationMin = Math.max(1, Math.round((endTs - startTs) / (1000 * 60)));
    const hours = Math.floor(durationMin / 60);
    const mins = durationMin % 60;
    return hours > 0 ? `${hours} jam ${mins} mnt` : `${mins} menit`;
  }, [shift]);

  const printTimeStr = React.useMemo(() => {
    if (!shift) return '';
    return formatDateTime(shift.endTime || shift.startTime);
  }, [shift]);

  if (!shift) return null;

  const branch = branches.find((b) => b.id === shift.branchId);
  const storeName = settings.name || 'Warung Juara POS';
  const branchName = branch?.name || shift.branchName || 'Cabang Utama';
  const branchAddress = branch?.address || 'Jl. Operasional Toko No. 1';
  const branchPhone = branch?.phone || '0812-3456-7890';

  const diff = shift.difference ?? 0;
  const isBalanced = Math.abs(diff) < 1;
  const isSurplus = diff > 0;

  const totalSales = shift.cashSalesTotal + shift.nonCashSalesTotal;

  const handlePrint = () => {
    playPrinterFeedSound();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="zreport-receipt-modal"
        className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-900"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50/60">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-semibold tracking-wide text-slate-900">
              Struk Z-Report Tutup Buku Shift
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Receipt Preview (Printable area) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-100/50">
          <div
            id="printable-z-report-area"
            className="bg-white border border-slate-200 rounded-xl p-5 font-mono text-xs text-slate-800 shadow-sm"
          >
            {/* Header Struk Toko */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h3 className="text-sm font-bold tracking-wider text-slate-900 uppercase">
                {storeName}
              </h3>
              <p className="text-[11px] text-slate-600 mt-0.5">{branchName}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{branchAddress}</p>
              <p className="text-[10px] text-slate-500">Telp: {branchPhone}</p>
              <div className="mt-2 inline-block px-2.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-semibold tracking-wider text-slate-700 uppercase">
                LAPORAN Z-REPORT PENUTUPAN KAS
              </div>
            </div>

            {/* Metadata Shift */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">No. Shift:</span>
                <span className="font-semibold text-slate-900">{shift.shiftNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kasir:</span>
                <span className="text-slate-800">{shift.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Waktu Buka:</span>
                <span className="text-slate-700">{formatDateTime(shift.startTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Waktu Tutup:</span>
                <span className="text-slate-700">
                  {shift.endTime ? formatDateTime(shift.endTime) : 'Shift Masih Berjalan'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Durasi Shift:</span>
                <span className="text-slate-700">{durationText}</span>
              </div>
              {shift.closedBy && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Ditutup Oleh:</span>
                  <span className="text-slate-800">{shift.closedBy}</span>
                </div>
              )}
            </div>

            {/* Ringkasan Penjualan & Omzet */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1.5 text-[11px]">
              <div className="font-bold text-teal-800 uppercase text-[10px] tracking-wider mb-1">
                RINGKASAN OMZET PENJUALAN
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jumlah Transaksi:</span>
                <span className="font-semibold text-slate-900">{shift.totalOrdersCount} Struk</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Penjualan Tunai (Cash):</span>
                <span className="text-slate-900 font-semibold">{formatRupiah(shift.cashSalesTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Penjualan Non-Tunai:</span>
                <span className="text-slate-700">{formatRupiah(shift.nonCashSalesTotal)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-dotted border-slate-300 font-bold">
                <span className="text-slate-900">TOTAL OMZET SHIFT:</span>
                <span className="text-teal-700">{formatRupiah(totalSales)}</span>
              </div>
            </div>

            {/* Rekonsiliasi Arus Kas Laci */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1.5 text-[11px]">
              <div className="font-bold text-teal-800 uppercase text-[10px] tracking-wider mb-1">
                REKONSILIASI KAS LACI (CASH DRAWER)
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">(+) Kas Modal Awal:</span>
                <span className="text-slate-900">{formatRupiah(shift.startingCash)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">(+) Penjualan Tunai:</span>
                <span className="text-slate-900">{formatRupiah(shift.cashSalesTotal)}</span>
              </div>
              {shift.cashInTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">(+) Kas Masuk Tambahan:</span>
                  <span className="text-emerald-600 font-semibold">+{formatRupiah(shift.cashInTotal)}</span>
                </div>
              )}
              {shift.cashOutTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">(-) Kas Keluar / Petty Cash:</span>
                  <span className="text-rose-600 font-semibold">-{formatRupiah(shift.cashOutTotal)}</span>
                </div>
              )}

              <div className="my-1 border-t border-dotted border-slate-300" />

              <div className="flex justify-between font-semibold">
                <span className="text-slate-600">(=) Total Kas Diharapkan:</span>
                <span className="text-slate-900 font-bold">{formatRupiah(shift.expectedEndingCash)}</span>
              </div>

              {shift.actualEndingCash !== undefined && (
                <>
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-600">(=) Kas Fisik Dihitung:</span>
                    <span className="text-slate-900 font-bold">{formatRupiah(shift.actualEndingCash)}</span>
                  </div>

                  <div
                    className={`flex justify-between p-2 rounded-lg mt-1.5 font-bold ${
                      isBalanced
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : isSurplus
                        ? 'bg-teal-50 text-teal-800 border border-teal-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    <span>SELISIH KAS (VARIANCE):</span>
                    <span>
                      {isBalanced
                        ? 'Rp 0 (SEIMBANG / KLOP)'
                        : isSurplus
                        ? `+${formatRupiah(diff)} (LEBIH)`
                        : `-${formatRupiah(Math.abs(diff))} (KURANG)`}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Rincian Kas Kecil / Petty Cash Movements */}
            {shift.cashMovements && shift.cashMovements.length > 0 && (
              <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[10px]">
                <div className="font-bold text-slate-500 uppercase tracking-wider mb-1">
                  RINCIAN KAS KELUAR / MASUK:
                </div>
                {shift.cashMovements.map((cm, idx) => (
                  <div key={cm.id || idx} className="flex justify-between text-slate-700">
                    <span className="truncate max-w-[200px]">
                      • {cm.type === 'CashOut' ? '(-) ' : '(+) '}
                      {cm.reason}
                    </span>
                    <span className={cm.type === 'CashOut' ? 'text-rose-600 font-semibold' : 'text-emerald-600 font-semibold'}>
                      {cm.type === 'CashOut' ? '-' : '+'}
                      {formatRupiah(cm.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Catatan Shift */}
            {shift.notes && (
              <div className="py-2.5 border-b border-dashed border-slate-300 text-[10px] text-slate-700">
                <span className="text-slate-500 font-bold uppercase">Catatan: </span>
                <span>{shift.notes}</span>
              </div>
            )}

            {/* Tanda Tangan */}
            <div className="pt-5 pb-2 grid grid-cols-2 gap-4 text-center text-[10px] text-slate-500">
              <div>
                <p>Kasir Bertugas,</p>
                <div className="h-10" />
                <p className="border-t border-slate-300 pt-1 font-semibold text-slate-800">
                  {shift.cashierName}
                </p>
              </div>
              <div>
                <p>Supervisor / Owner,</p>
                <div className="h-10" />
                <p className="border-t border-slate-300 pt-1 font-semibold text-slate-800">
                  ( ........................ )
                </p>
              </div>
            </div>

            <div className="text-center text-[9px] text-slate-400 mt-3">
              === DOKUMEN Z-REPORT RESMI TOKO ===
              <br />
              Waktu Cetak: {printTimeStr}
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-end space-x-2.5 px-5 py-3 border-t border-slate-200 bg-slate-50/60">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Struk Z-Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}
