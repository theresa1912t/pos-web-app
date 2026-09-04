'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  triggerCashDrawerOpen,
  triggerTestPrint,
  playBarcodeBeepSound,
} from '@/lib/hardwareBridge';
import {
  Printer,
  Vault,
  Barcode,
  CheckCircle2,
  AlertCircle,
  Save,
  Volume2,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Zap,
  Info,
  Check,
  Usb,
  Radio,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';

const COMMON_PRINTER_MODELS = [
  { id: 'pos58_usb', name: 'POS-58 Thermal Printer (USB/Bluetooth)', paper: '58mm', type: 'Thermal 58mm' },
  { id: 'pos80_lan', name: 'POS-80 LAN/Network Thermal High-Speed', paper: '80mm', type: 'Thermal 80mm' },
  { id: 'epson_tmt82', name: 'Epson TM-T82 ESC/POS Series', paper: '80mm', type: 'Thermal 80mm' },
  { id: 'zjiang_58', name: 'Zjiang ZJ-5890K USB Thermal Printer', paper: '58mm', type: 'Thermal 58mm' },
  { id: 'panda_bt', name: 'Panda Mobile Bluetooth Receipt Printer', paper: '58mm', type: 'Portable BT' },
];

export function PerangkatKasirView() {
  const { settings, updateSettings, products } = useApp();

  // Hardware State
  const [printerConnected, setPrinterConnected] = useState<boolean>(settings.printerConnected ?? true);
  const [printerName, setPrinterName] = useState<string>(
    settings.printerName || 'POS-58 Thermal Printer (USB/Bluetooth)'
  );
  const [printerPaperSize, setPrinterPaperSize] = useState<'58mm' | '80mm'>(
    settings.printerPaperSize || '58mm'
  );
  const [autoPrintReceipt, setAutoPrintReceipt] = useState<boolean>(
    settings.autoPrintReceipt ?? false
  );

  const [cashDrawerConnected, setCashDrawerConnected] = useState<boolean>(
    settings.cashDrawerConnected ?? true
  );
  const [cashDrawerName, setCashDrawerName] = useState<string>(
    settings.cashDrawerName || 'Laci Kasir Standard RJ11 (Printer-Driven)'
  );
  const [autoOpenCashDrawer, setAutoOpenCashDrawer] = useState<boolean>(
    settings.autoOpenCashDrawer ?? true
  );
  const [cashDrawerInterface, setCashDrawerInterface] = useState<
    'printer_kick' | 'serial_usb' | 'local_bridge' | 'simulated'
  >(settings.cashDrawerInterface || 'printer_kick');

  const [barcodeScannerConnected, setBarcodeScannerConnected] = useState<boolean>(
    settings.barcodeScannerConnected ?? true
  );
  const [barcodeScannerName, setBarcodeScannerName] = useState<string>(
    settings.barcodeScannerName || 'USB HID Laser Barcode Scanner & Kamera'
  );

  // Interaction feedback states
  const [hardwareToast, setHardwareToast] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
  } | null>(null);
  const [isPrintingTest, setIsPrintingTest] = useState(false);
  const [isKickingDrawer, setIsKickingDrawer] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Barcode test state
  const [testBarcodeQuery, setTestBarcodeQuery] = useState('');
  const [testScanResult, setTestScanResult] = useState<{
    code: string;
    matchedName?: string;
    price?: number;
    stock?: number;
    time: string;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setHardwareToast({ message, type });
    setTimeout(() => {
      setHardwareToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  const handleSaveHardware = async () => {
    setIsSaving(true);
    await updateSettings({
      printerConnected,
      printerName: printerName.trim(),
      printerPaperSize,
      autoPrintReceipt,
      cashDrawerName: cashDrawerName.trim(),
      cashDrawerConnected,
      autoOpenCashDrawer,
      cashDrawerInterface,
      barcodeScannerName: barcodeScannerName.trim(),
      barcodeScannerConnected,
    });
    setIsSaving(false);
    setSaveSuccess(true);
    showToast('Konfigurasi perangkat kasir POS berhasil disimpan ke sistem!', 'success');
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTestPrint = async () => {
    if (!printerConnected) {
      showToast('Printer sedang dalam status offline/terputus. Aktifkan koneksi terlebih dahulu.', 'error');
      return;
    }
    setIsPrintingTest(true);
    const res = await triggerTestPrint(printerName, printerPaperSize);
    setIsPrintingTest(false);
    if (res.success) {
      showToast(`Struk uji coba berhasil dikirim ke "${printerName}" (${printerPaperSize}).`, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleTestCashDrawer = async () => {
    if (!cashDrawerConnected) {
      showToast('Laci kasir terputus. Pastikan port RJ11 terhubung.', 'error');
      return;
    }
    setIsKickingDrawer(true);
    const res = await triggerCashDrawerOpen();
    setIsKickingDrawer(false);
    if (res.success) {
      showToast('Sinyal RJ11 berhasil dikirim: Laci kasir fisik berhasil dibuka!', 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleTestBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = testBarcodeQuery.trim();
    if (!clean) return;

    // Trigger audible beep
    playBarcodeBeepSound();

    const matched = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === clean.toLowerCase()) ||
        p.id.toLowerCase() === clean.toLowerCase()
    );

    setTestScanResult({
      code: clean,
      matchedName: matched ? matched.name : undefined,
      price: matched ? matched.sellingPrice : undefined,
      stock: matched ? matched.stock : undefined,
      time: new Date().toLocaleTimeString('id-ID'),
    });

    setTestBarcodeQuery('');
    showToast(`Barcode "${clean}" terdeteksi dan berhasil dipindai!`, 'success');
  };

  const handleSelectPresetPrinter = (preset: (typeof COMMON_PRINTER_MODELS)[0]) => {
    setPrinterName(preset.name);
    setPrinterPaperSize(preset.paper as '58mm' | '80mm');
    showToast(`Model printer diubah ke "${preset.name}".`, 'info');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Banner Overview Header */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 shadow-xs">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Perangkat Kasir (POS Hardware)</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Live Integration
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Konfigurasi perangkat fisik: printer thermal struk, laci uang kasir RJ11, dan pemindai barcode
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleSaveHardware}
            disabled={isSaving}
            className="flex items-center space-x-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl font-semibold text-xs shadow-md shadow-teal-600/20 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}</span>
          </button>
        </div>
      </div>

      {/* Global Toast Alert */}
      {hardwareToast && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between space-x-3 text-xs font-semibold animate-in fade-in ${
            hardwareToast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : hardwareToast.type === 'info'
              ? 'bg-teal-50 border-teal-200 text-teal-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {hardwareToast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{hardwareToast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setHardwareToast(null)}
            className="text-[10px] underline hover:opacity-80 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Hardware Status Dashboard Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Printer Summary Card */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Printer Struk</h3>
                <span className="text-[10px] text-slate-500 font-mono">{printerPaperSize} Thermal</span>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                printerConnected
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {printerConnected ? 'Online' : 'Offline'}
            </span>
          </div>
          <div className="text-[11px] text-slate-600 truncate bg-slate-50 p-2 rounded-lg border border-slate-100">
            {printerName}
          </div>
        </div>

        {/* Cash Drawer Summary Card */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Vault className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Laci Kasir</h3>
                <span className="text-[10px] text-slate-500">Port RJ11</span>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                cashDrawerConnected
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {cashDrawerConnected ? 'Siap (Ready)' : 'Non-aktif'}
            </span>
          </div>
          <div className="text-[11px] text-slate-600 truncate bg-slate-50 p-2 rounded-lg border border-slate-100">
            {autoOpenCashDrawer ? '✓ Buka Otomatis Saat Tunai' : 'Mode Buka Manual'}
          </div>
        </div>

        {/* Scanner Summary Card */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
                <Barcode className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Pemindai Barcode</h3>
                <span className="text-[10px] text-slate-500">USB HID / BT</span>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                barcodeScannerConnected
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {barcodeScannerConnected ? 'Plug & Play' : 'Non-aktif'}
            </span>
          </div>
          <div className="text-[11px] text-slate-600 truncate bg-slate-50 p-2 rounded-lg border border-slate-100">
            {barcodeScannerName}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 1: RECEIPT PRINTER (PRINTER STRUK)              */}
      {/* ======================================================== */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">1. Printer Struk (Receipt Printer)</h3>
              <p className="text-[11px] text-slate-500">
                Pilih model printer thermal kasir, atur ukuran kertas, dan uji cetak struk
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                const next = !printerConnected;
                setPrinterConnected(next);
                showToast(next ? 'Printer struk dihubungkan.' : 'Printer struk dimatikan/offline.', 'info');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer border ${
                printerConnected
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
            >
              Status: {printerConnected ? 'Online (Terhubung)' : 'Offline (Terputus)'}
            </button>
          </div>
        </div>

        {/* Change Printer / Quick Presets */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-teal-600" />
            <span>Pilih Model Printer Populer (Change Printer)</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {COMMON_PRINTER_MODELS.map((preset) => {
              const isSelected = printerName === preset.name && printerPaperSize === preset.paper;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPresetPrinter(preset)}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-teal-50 border-teal-300 text-teal-900 font-semibold ring-1 ring-teal-400/50'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="truncate">{preset.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1">{preset.type}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Manual Device Name & Paper Size inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
          <div>
            <label className="block text-slate-700 font-medium mb-1.5">
              Nama Perangkat Printer (Custom Model)
            </label>
            <input
              type="text"
              value={printerName}
              onChange={(e) => setPrinterName(e.target.value)}
              placeholder="Contoh: POS-58 Thermal Printer (USB/Bluetooth)"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1.5">Ukuran Lebar Kertas Struk</label>
            <select
              value={printerPaperSize}
              onChange={(e) => setPrinterPaperSize(e.target.value as '58mm' | '80mm')}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
            >
              <option value="58mm">58mm (Standar Kertas Thermal POS Warung)</option>
              <option value="80mm">80mm (Kertas Thermal Lebar Resto / Supermarket)</option>
            </select>
          </div>
        </div>

        {/* Auto Print Receipt Toggle Option */}
        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          <div>
            <div className="font-semibold text-slate-800">Cetak Struk Otomatis (Auto Print Receipt)</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Secara otomatis mengirim perintah cetak struk segera setelah kasir menyelesaikan transaksi
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAutoPrintReceipt(!autoPrintReceipt)}
            className="p-1 text-teal-600 hover:text-teal-700 cursor-pointer"
            title="Toggle Auto Print"
          >
            {autoPrintReceipt ? (
              <ToggleRight className="w-8 h-8 text-teal-600" />
            ) : (
              <ToggleLeft className="w-8 h-8 text-slate-400" />
            )}
          </button>
        </div>

        {/* Printer Action Buttons: Test Print */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Mendukung ESC/POS thermal printer via USB, Bluetooth, atau LAN.</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled={isPrintingTest || !printerConnected}
              onClick={handleTestPrint}
              className="flex items-center space-x-2 px-4 py-2.5 bg-teal-50 hover:bg-teal-100 active:bg-teal-200 text-teal-700 border border-teal-200 rounded-xl font-semibold text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrintingTest ? 'Mencetak Struk...' : 'Uji Cetak Struk (Test Print)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 2: CASH DRAWER (LACI KASIR RJ11)                */}
      {/* ======================================================== */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Vault className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">2. Laci Kasir (Cash Drawer)</h3>
              <p className="text-[11px] text-slate-500">
                Koneksi pembuka laci uang fisik melalui sinyal pulsa RJ11 printer struk
              </p>
            </div>
          </div>
          <span
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
              cashDrawerConnected
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            {cashDrawerConnected ? 'Port RJ11 Terhubung' : 'Terputus (Disconnected)'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1.5">Nama / Tipe Laci Kasir</label>
            <input
              type="text"
              value={cashDrawerName}
              onChange={(e) => setCashDrawerName(e.target.value)}
              placeholder="Contoh: Laci Kasir Standard RJ11"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1.5">Metode Sinyal Pemicu (Interface)</label>
            <select
              value={cashDrawerInterface}
              onChange={(e) =>
                setCashDrawerInterface(
                  e.target.value as 'printer_kick' | 'serial_usb' | 'local_bridge' | 'simulated'
                )
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
            >
              <option value="printer_kick">Port RJ11/RJ12 Printer Struk (Standar Industri ESC/POS Kick)</option>
              <option value="serial_usb">Web Serial Direct USB Relay</option>
              <option value="local_bridge">Local Hardware Bridge Agent</option>
              <option value="simulated">Simulasi Virtual (Demo / Testing)</option>
            </select>
          </div>
        </div>

        {/* Connection Information Banner */}
        <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl text-xs text-teal-900 space-y-1.5">
          <div className="font-bold flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-teal-600" />
            <span>Informasi Koneksi Laci Kasir (Hardware Connection Info)</span>
          </div>
          <p className="text-teal-800/90 leading-relaxed text-[11px]">
            Kabel RJ11/RJ12 dari laci kasir dicolokkan ke port <span className="font-semibold font-mono">DK (Drawer Kick)</span> di belakang printer thermal. Saat transaksi Tunai selesai dicatat, sistem mengirimkan pulsa elektrik pembuka laci otomatis tanpa kasir harus memasukkan perintah atau kode ESC/POS manual.
          </p>
        </div>

        {/* Auto Open Cash Drawer Toggle */}
        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          <div>
            <div className="font-semibold text-slate-800">
              Buka Otomatis Saat Transaksi Tunai (Auto Open Cash Drawer)
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Memicu laci kasir terbuka otomatis segera setelah kasir memproses pembayaran metode Tunai (Cash)
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAutoOpenCashDrawer(!autoOpenCashDrawer)}
            className="p-1 text-teal-600 hover:text-teal-700 cursor-pointer"
            title="Toggle Auto Open Drawer"
          >
            {autoOpenCashDrawer ? (
              <ToggleRight className="w-8 h-8 text-teal-600" />
            ) : (
              <ToggleLeft className="w-8 h-8 text-slate-400" />
            )}
          </button>
        </div>

        {/* Cash Drawer Action Buttons: Test Drawer Kick */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              const next = !cashDrawerConnected;
              setCashDrawerConnected(next);
              showToast(next ? 'Koneksi laci kasir aktif.' : 'Koneksi laci kasir dinonaktifkan.', 'info');
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            {cashDrawerConnected ? 'Simulasi Laci Terputus' : 'Hubungkan Port RJ11'}
          </button>

          <button
            type="button"
            disabled={isKickingDrawer || !cashDrawerConnected}
            onClick={handleTestCashDrawer}
            className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-semibold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Vault className="w-4 h-4" />
            <span>{isKickingDrawer ? 'Membuka Laci...' : 'Buka Laci Kasir (Test Drawer)'}</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 3: BARCODE SCANNER (PEMINDAI BARCODE)           */}
      {/* ======================================================== */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">3. Pemindai Barcode (Barcode Scanner)</h3>
              <p className="text-[11px] text-slate-500">
                Integrasi pemindai barcode USB/Bluetooth HID Keyboard Wedge dan kamera
              </p>
            </div>
          </div>
          <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Plug & Play Aktif (HID Ready)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1.5">Nama Perangkat Scanner</label>
            <input
              type="text"
              value={barcodeScannerName}
              onChange={(e) => setBarcodeScannerName(e.target.value)}
              placeholder="Contoh: USB HID Laser Barcode Scanner"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1.5">Mode Koneksi Scanner</label>
            <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 flex items-center justify-between">
              <span>USB HID / Bluetooth Keyboard Wedge</span>
              <Usb className="w-3.5 h-3.5 text-slate-500" />
            </div>
          </div>
        </div>

        {/* Scanner Information Note */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-teal-600" />
            <span>Informasi Scanner Barcode</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500">
            Pemindai barcode laser atau omni 2D bekerja secara plug-and-play sebagai keyboard emulation. Arahkan kursor ke kolom pencarian kasir, lalu tembak barcode produk untuk input otomatis.
          </p>
        </div>

        {/* Interactive Barcode Test Console */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-teal-600" />
              <span>Uji Coba Pemindaian Barcode (Test Scanner)</span>
            </span>
            <span className="text-[11px] text-slate-500">Tembak barcode fisik atau ketik kode</span>
          </div>

          <form onSubmit={handleTestBarcodeScan} className="flex items-center space-x-2">
            <input
              type="text"
              value={testBarcodeQuery}
              onChange={(e) => setTestBarcodeQuery(e.target.value)}
              placeholder="Arahkan barcode scanner ke sini atau ketik (contoh: 8998866200114)..."
              className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold text-xs transition-colors cursor-pointer shrink-0"
            >
              Test Scan
            </button>
          </form>

          {/* Test Scan Result Card */}
          {testScanResult && (
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl text-xs space-y-1.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-teal-700 text-sm">
                  {testScanResult.code}
                </span>
                <span className="text-[10px] text-slate-400">{testScanResult.time}</span>
              </div>
              <div className="text-slate-700 text-xs">
                {testScanResult.matchedName ? (
                  <div className="space-y-1">
                    <p className="text-emerald-700 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Produk Ditemukan: {testScanResult.matchedName}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Harga Jual: Rp {(testScanResult.price || 0).toLocaleString('id-ID')} • Stok Tersedia: {testScanResult.stock ?? 0} unit
                    </p>
                  </div>
                ) : (
                  <p className="text-amber-700 font-medium">
                    Barcode berhasil terbaca oleh scanner, namun belum terdaftar di katalog produk.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Button Bottom Bar */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSaveHardware}
          disabled={isSaving}
          className="flex items-center space-x-2 px-7 py-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl font-bold text-xs shadow-md shadow-teal-600/20 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Menyimpan Konfigurasi...' : 'Simpan Konfigurasi Perangkat Kasir'}</span>
        </button>
      </div>
    </div>
  );
}
