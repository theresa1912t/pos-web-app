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
  ToggleLeft,
  ToggleRight,
  Zap,
  Info,
  Check,
  Usb,
  SlidersHorizontal,
  Smartphone,
  Layers,
  HelpCircle,
} from 'lucide-react';

const COMMON_PRINTER_MODELS = [
  { id: 'pos58_usb', name: 'POS-58 Thermal Printer (USB/Bluetooth)', paper: '58mm', type: 'Thermal 58mm Standard' },
  { id: 'panda_bt', name: 'Panda PRJ-58D Bluetooth Mini', paper: '58mm', type: 'Portable BT 58mm' },
  { id: 'epson_tmt82', name: 'Epson TM-T82 ESC/POS Series', paper: '80mm', type: 'Thermal 80mm High-Speed' },
  { id: 'pos80_lan', name: 'POS-80 LAN/Network Thermal High-Speed', paper: '80mm', type: 'Thermal 80mm Network' },
  { id: 'zjiang_58', name: 'Zjiang ZJ-5890K USB Thermal Printer', paper: '58mm', type: 'Thermal 58mm Desktop' },
  { id: 'custom', name: 'Lainnya / Model Custom Driver', paper: '58mm', type: 'Ketik nama driver printer sendiri' },
];

export function PerangkatKasirView() {
  const { settings, updateSettings, products } = useApp();

  // Printer State
  const initialPreset = COMMON_PRINTER_MODELS.find(
    (p) => p.id !== 'custom' && p.name === settings.printerName
  );
  const [selectedPrinterModelId, setSelectedPrinterModelId] = useState<string>(
    initialPreset ? initialPreset.id : (settings.printerName ? 'custom' : 'pos58_usb')
  );
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

  // Cash Drawer State
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

  // Barcode Scanner State
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

  const handleSelectPrinterModel = (modelId: string) => {
    setSelectedPrinterModelId(modelId);
    const preset = COMMON_PRINTER_MODELS.find((p) => p.id === modelId);
    if (preset && preset.id !== 'custom') {
      setPrinterName(preset.name);
      setPrinterPaperSize(preset.paper as '58mm' | '80mm');
      showToast(`Model printer dipilih: "${preset.name}".`, 'info');
    } else if (modelId === 'custom') {
      if (COMMON_PRINTER_MODELS.some((p) => p.id !== 'custom' && p.name === printerName)) {
        setPrinterName('');
      }
    }
  };

  const handleSaveHardware = async () => {
    setIsSaving(true);
    const finalPrinterName =
      selectedPrinterModelId === 'custom'
        ? (printerName.trim() || 'Custom Thermal Printer')
        : (COMMON_PRINTER_MODELS.find((p) => p.id === selectedPrinterModelId)?.name || printerName.trim());

    await updateSettings({
      printerConnected,
      printerName: finalPrinterName,
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
    showToast('Konfigurasi perangkat kasir POS berhasil disimpan!', 'success');
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
      showToast('Laci kasir terputus. Pastikan koneksi port RJ11 terhubung.', 'error');
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
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
          <div className="text-[11px] text-slate-600 truncate bg-slate-50 p-2 rounded-lg border border-slate-100 font-medium">
            {printerName || 'Model Kustom'}
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
          <div className="text-[11px] text-slate-600 truncate bg-slate-50 p-2 rounded-lg border border-slate-100 font-medium">
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
                <span className="text-[10px] text-slate-500">Multi-Scanner HID</span>
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
          <div className="text-[11px] text-slate-600 truncate bg-slate-50 p-2 rounded-lg border border-slate-100 font-medium">
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
                Pilih model printer thermal kasir, atur ukuran kertas struk, dan lakukan tes cetak
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

        {/* Consolidated Model & Paper Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1.5 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-teal-600" />
              <span>Pilih Model / Driver Printer</span>
            </label>
            <select
              value={selectedPrinterModelId}
              onChange={(e) => handleSelectPrinterModel(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
            >
              {COMMON_PRINTER_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.paper})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1.5">
              Ukuran Lebar Kertas Struk
            </label>
            <select
              value={printerPaperSize}
              onChange={(e) => setPrinterPaperSize(e.target.value as '58mm' | '80mm')}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
            >
              <option value="58mm">58mm (Standar Thermal Kasir Warung / Minimarket)</option>
              <option value="80mm">80mm (Thermal Lebar Resto / Supermarket)</option>
            </select>
          </div>
        </div>

        {/* Custom Printer Name Input (Only appears when Custom Model is selected) */}
        {selectedPrinterModelId === 'custom' && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5 animate-in fade-in">
            <label className="block text-slate-700 font-semibold">
              Nama Driver / Perangkat Printer Kustom
            </label>
            <input
              type="text"
              value={printerName}
              onChange={(e) => setPrinterName(e.target.value)}
              placeholder="Contoh: Xprinter XP-58IIH / Iware POS-58..."
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500 transition-colors"
            />
            <p className="text-[11px] text-slate-500">
              Masukkan nama printer sesuai dengan driver printer yang terpasang pada komputer atau nama Bluetooth perangkat.
            </p>
          </div>
        )}

        {/* Auto Print Receipt Toggle Option */}
        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          <div>
            <div className="font-semibold text-slate-800">Cetak Struk Otomatis (Auto Print Receipt)</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Secara otomatis mencetak struk segera setelah kasir menekan tombol selesai transaksi
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
            <span>Mendukung protokol standar ESC/POS thermal printer via USB, Bluetooth, atau LAN.</span>
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
                Pemicu buka laci uang fisik melalui pulsa port RJ11 di belakang printer struk
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
            {cashDrawerConnected ? 'Port RJ11 Siap' : 'Terputus (Disconnected)'}
          </span>
        </div>

        {/* Clear Hardware Operational Explanation */}
        <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl text-xs text-teal-900 space-y-2">
          <div className="font-bold flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-teal-600" />
            <span>Cara Kerja Fisik & Konfigurasi Station Kasir:</span>
          </div>
          <ul className="text-[11px] text-teal-800/90 leading-relaxed space-y-1 list-disc list-inside">
            <li>
              <strong>1 Stasiun Kasir = 1 Device + 1 Printer + 1 Laci Kasir</strong>: Setiap meja kasir memiliki 1 komputer/tablet yang terhubung ke 1 printer struk dan 1 laci uang untuk akuntabilitas shift kasir.
            </li>
            <li>
              <strong>Koneksi Port RJ11</strong>: Kabel telepon RJ11 dari laci kasir dicolokkan ke port bertuliskan <strong>DK (Drawer Kick)</strong> di belakang printer struk thermal.
            </li>
            <li>
              <strong>Otomasi Transaksi Tunai</strong>: Saat transaksi metode <strong>Tunai (Cash)</strong> diselesaikan, aplikasi mengirimkan pulsa elektrik 12V/24V via printer untuk melepaskan kunci solenoid laci kasir secara otomatis tanpa perlu kunci manual.
            </li>
          </ul>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1.5">Tipe Laci Kasir</label>
            <input
              type="text"
              value={cashDrawerName}
              onChange={(e) => setCashDrawerName(e.target.value)}
              placeholder="Contoh: Laci Kasir Standard RJ11"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1.5">Metode Pemicu Sinyal</label>
            <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 flex items-center justify-between">
              <span>Port RJ11 / RJ12 Printer Struk (Standar Industri ESC/POS)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            </div>
          </div>
        </div>

        {/* Auto Open Cash Drawer Toggle */}
        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          <div>
            <div className="font-semibold text-slate-800">
              Buka Otomatis Saat Transaksi Tunai (Auto Open Cash Drawer)
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Memicu laci kasir terbuka secara otomatis ketika kasir menerima pembayaran metode Tunai (Cash)
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
            <span>{isKickingDrawer ? 'Membuka Laci...' : 'Buka Laci Kasir (Test Pulsa RJ11)'}</span>
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
                Mendukung banyak scanner USB/Bluetooth HID Keyboard & kamera HP untuk stock opname
              </p>
            </div>
          </div>
          <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Plug & Play Aktif (HID Keyboard)
          </span>
        </div>

        {/* Multi-Scanner & Contextual Usage Explanation */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-2">
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-teal-600" />
            <span>Dukungan Multi-Scanner & Fleksibilitas Stock Opname:</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-slate-600 leading-relaxed pt-1">
            <div className="p-3 bg-white rounded-lg border border-slate-200/80 space-y-1">
              <div className="font-semibold text-slate-800 flex items-center gap-1">
                <Usb className="w-3.5 h-3.5 text-teal-600" />
                <span>Bisa Terhubung Lebih dari 1 Scanner</span>
              </div>
              <p>
                Sistem operasi mengenali scanner sebagai perangkat keyboard (HID). Anda dapat memasang <strong>scanner duduk omni di meja kasir</strong> sekaligus <strong>wireless gun scanner</strong> untuk barang-barang besar tanpa konflik driver.
              </p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200/80 space-y-1">
              <div className="font-semibold text-slate-800 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-teal-600" />
                <span>Stock Opname Gudang dengan HP / Tablet</span>
              </div>
              <p>
                Untuk opname di lorong rak gudang, staf tidak perlu membawa PC kasir. Cukup buka sistem melalui <strong>browser HP / Tablet</strong> dan gunakan <strong>fitur pemindai kamera bawaan</strong> di menu Stock Opname.
              </p>
            </div>
          </div>
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
              <span>Universal USB HID / Bluetooth Keyboard Wedge</span>
              <Usb className="w-3.5 h-3.5 text-slate-500" />
            </div>
          </div>
        </div>

        {/* Interactive Barcode Test Console */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-teal-600" />
              <span>Uji Coba Pemindaian Barcode (Test Scanner)</span>
            </span>
            <span className="text-[11px] text-slate-500">Tembak barcode fisik atau ketik angka barcode</span>
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
          <span>{isSaving ? 'Menyimpan Konfigurasi...' : 'Simpan Semua Pengaturan Perangkat Kasir'}</span>
        </button>
      </div>
    </div>
  );
}
