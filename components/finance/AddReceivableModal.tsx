'use client';

import React, { useState, useMemo } from 'react';
import { Branch, Product } from '@/types';
import { formatRupiah } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import {
  X,
  UserCheck,
  Calendar,
  Phone,
  FileText,
  DollarSign,
  Building2,
  Package,
  Plus,
  Trash2,
  Layers,
  Check,
  AlertCircle,
} from 'lucide-react';

interface SelectedProductItem {
  product: Product;
  quantity: number;
  pricePerUnit: number;
  subtotal: number;
}

interface AddReceivableModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: Branch[];
  activeBranchId: string;
  onAdd: (data: {
    customerName: string;
    customerPhone?: string;
    notes?: string;
    totalAmount: number;
    dueDate: string;
    branchId?: string;
  }) => Promise<any>;
}

export function AddReceivableModal({
  isOpen,
  onClose,
  branches,
  activeBranchId,
  onAdd,
}: AddReceivableModalProps) {
  const { products, getProductStockInBranch, createOrder } = useApp();

  const [entryMode, setEntryMode] = useState<'catalog' | 'manual'>('catalog');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(Date.now() + 7 * 86400000);
    return d.toISOString().slice(0, 10);
  });
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    activeBranchId !== 'all' ? activeBranchId : branches[0]?.id || ''
  );

  // Catalog items selection
  const [selectedItems, setSelectedItems] = useState<SelectedProductItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [itemQty, setItemQty] = useState<number>(1);
  const [customItemPrice, setCustomItemPrice] = useState<number | ''>('');
  const [autoDeductStock, setAutoDeductStock] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active products in catalog
  const availableProducts = useMemo(() => {
    return products.filter((p) => !p.isArchived);
  }, [products]);

  // Current active product picked in select
  const currentPickedProduct = useMemo(() => {
    return availableProducts.find((p) => p.id === selectedProductId) || null;
  }, [availableProducts, selectedProductId]);

  // Stock for current picked product in chosen branch
  const currentPickedStock = useMemo(() => {
    if (!currentPickedProduct) return 0;
    return getProductStockInBranch(currentPickedProduct.id, selectedBranchId);
  }, [currentPickedProduct, selectedBranchId, getProductStockInBranch]);

  // Calculate sum from catalog items
  const catalogTotal = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + item.subtotal, 0);
  }, [selectedItems]);

  const effectiveTotal = entryMode === 'catalog' ? catalogTotal : parseFloat(manualAmount.replace(/[^0-9]/g, '')) || 0;

  if (!isOpen) return null;

  const handleAddCatalogItem = () => {
    if (!currentPickedProduct) return;
    if (itemQty <= 0) {
      setError('Jumlah barang minimal 1');
      return;
    }

    const price = typeof customItemPrice === 'number' && customItemPrice >= 0
      ? customItemPrice
      : currentPickedProduct.sellingPrice;

    const existingIndex = selectedItems.findIndex((it) => it.product.id === currentPickedProduct.id);
    if (existingIndex >= 0) {
      const updated = [...selectedItems];
      const newQty = updated[existingIndex].quantity + itemQty;
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: newQty,
        pricePerUnit: price,
        subtotal: newQty * price,
      };
      setSelectedItems(updated);
    } else {
      setSelectedItems((prev) => [
        ...prev,
        {
          product: currentPickedProduct,
          quantity: itemQty,
          pricePerUnit: price,
          subtotal: itemQty * price,
        },
      ]);
    }

    // Reset picker inputs
    setSelectedProductId('');
    setItemQty(1);
    setCustomItemPrice('');
    setError(null);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerName.trim()) {
      setError('Nama pelanggan wajib diisi');
      return;
    }

    if (effectiveTotal <= 0) {
      setError(
        entryMode === 'catalog'
          ? 'Tambahkan minimal satu produk dari katalog untuk menghitung total bon'
          : 'Nominal piutang harus lebih besar dari 0'
      );
      return;
    }

    if (!dueDate) {
      setError('Tanggal jatuh tempo wajib ditentukan');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalNotes = notes.trim();

      // If catalog mode with items, build item breakdown string
      if (entryMode === 'catalog' && selectedItems.length > 0) {
        const itemBreakdown = selectedItems
          .map((it) => `${it.product.name} x${it.quantity} (${formatRupiah(it.subtotal)})`)
          .join(', ');
        finalNotes = finalNotes ? `${finalNotes} | Barang: ${itemBreakdown}` : `Barang: ${itemBreakdown}`;

        // If auto-deduct stock is enabled, create order in Kasir to reduce stock
        if (autoDeductStock) {
          const cartPayload = selectedItems.map((it) => ({
            product: it.product,
            quantity: it.quantity,
          }));
          await createOrder(
            cartPayload,
            'Kasbon' as any,
            0,
            0,
            'Offline / Kasir',
            undefined,
            selectedBranchId
          );
        }
      }

      await onAdd({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        notes: finalNotes || undefined,
        totalAmount: effectiveTotal,
        dueDate,
        branchId: selectedBranchId || undefined,
      });

      // Reset form
      setCustomerName('');
      setCustomerPhone('');
      setNotes('');
      setManualAmount('');
      setSelectedItems([]);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan catatan piutang');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-semibold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Catat Piutang / Kasbon Pelanggan</h3>
              <p className="text-xs text-slate-500">Terhubung langsung dengan Katalog Produk & Stok Toko</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-slate-800">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setEntryMode('catalog')}
              className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                entryMode === 'catalog'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-teal-600" />
              <span>Pilih dari Katalog Produk</span>
            </button>
            <button
              type="button"
              onClick={() => setEntryMode('manual')}
              className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                entryMode === 'manual'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-teal-600" />
              <span>Input Nominal Bebas</span>
            </button>
          </div>

          {/* Branch selector if applicable */}
          {branches.length > 1 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Cabang Toko
              </label>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Customer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Pelanggan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Contoh: Ibu Nurul, Pak RT Joko"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                No. WhatsApp / HP (Opsional)
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Contoh: 0812-3456-7890"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>
          </div>

          {/* CATALOG MODE: PICKER & LIST */}
          {entryMode === 'catalog' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-teal-600" />
                  Pilih Barang yang Dikasbonkan dari Katalog
                </label>
                <span className="text-[11px] text-slate-500">{availableProducts.length} Produk Siap</span>
              </div>

              {/* Product selector row */}
              <div className="space-y-2">
                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    const p = availableProducts.find((prod) => prod.id === e.target.value);
                    if (p) {
                      setCustomItemPrice(p.sellingPrice);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-teal-600"
                >
                  <option value="">-- Cari & Pilih Produk dari Katalog --</option>
                  {availableProducts.map((p) => {
                    const st = getProductStockInBranch(p.id, selectedBranchId);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} • {formatRupiah(p.sellingPrice)} (Stok: {st} {p.unit || 'pcs'})
                      </option>
                    );
                  })}
                </select>

                {currentPickedProduct && (
                  <div className="grid grid-cols-3 gap-2 pt-1 items-end">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Jumlah (Qty):</label>
                      <input
                        type="number"
                        min="1"
                        value={itemQty}
                        onChange={(e) => setItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-center font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Harga Satuan (Rp):</label>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={customItemPrice}
                        onChange={(e) =>
                          setCustomItemPrice(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-right font-bold"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddCatalogItem}
                      className="py-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Items List Table */}
              {selectedItems.length > 0 ? (
                <div className="space-y-1.5 pt-2 border-t border-slate-200">
                  <div className="max-h-44 overflow-y-auto space-y-1.5 divide-y divide-slate-100">
                    {selectedItems.map((item, idx) => (
                      <div key={idx} className="pt-1.5 flex items-center justify-between text-xs">
                        <div className="truncate pr-2">
                          <span className="font-semibold text-slate-900">{item.product.name}</span>
                          <span className="text-slate-500 block text-[11px]">
                            {item.quantity} {item.product.unit || 'pcs'} x {formatRupiah(item.pricePerUnit)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          <span className="font-bold text-slate-900">{formatRupiah(item.subtotal)}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Stock auto deduct checkbox */}
                  <div className="pt-2 border-t border-slate-200">
                    <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoDeductStock}
                        onChange={(e) => setAutoDeductStock(e.target.checked)}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="font-medium">
                        Otomatis kurangi stok toko saat bon dicatat
                      </span>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 bg-white/70 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                  Belum ada produk yang ditambahkan. Pilih produk di atas lalu klik Tambah.
                </div>
              )}
            </div>
          )}

          {/* MANUAL MODE: TOTAL AMOUNT INPUT */}
          {entryMode === 'manual' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                Nominal Piutang / Total Bon <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                  Rp
                </span>
                <input
                  type="number"
                  required={entryMode === 'manual'}
                  min="1000"
                  step="500"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  placeholder="0"
                  className="w-full pl-10 pr-3 py-2 text-sm font-bold text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>
              {manualAmount && !isNaN(Number(manualAmount)) && Number(manualAmount) > 0 && (
                <p className="text-[11px] text-teal-600 font-semibold mt-1">
                  Terbaca: {formatRupiah(Number(manualAmount))}
                </p>
              )}
            </div>
          )}

          {/* TOTAL BANNER FOR CATALOG MODE */}
          {entryMode === 'catalog' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900">Total Piutang Bon:</span>
              <span className="text-base font-bold text-amber-800 font-mono">
                {formatRupiah(catalogTotal)}
              </span>
            </div>
          )}

          {/* Due Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Tanggal Jatuh Tempo Pembayaran <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Tanggal estimasi pelanggan akan melunasi bon belanja ini
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Keterangan Tambahan / Alasan Tempo (Opsional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Janji bayar tgl 5 setelah gajian..."
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Piutang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
