'use client';

import React, { useState } from 'react';
import { Barcode, PackagePlus, X } from 'lucide-react';
import { Product, ProductCategory } from '@/types';
import { useApp } from '@/context/AppContext';

interface QuickProductRegisterModalProps {
  barcode: string;
  categories: ProductCategory[];
  orderBranchId: string;
  onClose: () => void;
  onScanAnother: () => void;
  onProductCreated: (product: Product) => void;
  onShowToast?: (message: string, type?: 'success' | 'warning' | 'error') => void;
}

export function QuickProductRegisterModal({
  barcode,
  categories,
  orderBranchId: _orderBranchId,
  onClose,
  onScanAnother,
  onProductCreated,
  onShowToast,
}: QuickProductRegisterModalProps) {
  const { createProduct } = useApp();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [quickProdName, setQuickProdName] = useState('');
  const [quickProdCategory, setQuickProdCategory] = useState(
    categories[0]?.name || 'Sembako & Bahan Pokok'
  );
  const [quickProdUnit, setQuickProdUnit] = useState('Pcs');
  const [quickProdSellingPrice, setQuickProdSellingPrice] = useState<number | ''>('');
  const [quickProdCogs, setQuickProdCogs] = useState<number | ''>('');
  const [quickProdStock, setQuickProdStock] = useState<number | ''>(10);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickProdName.trim()) {
      if (onShowToast) onShowToast('Nama produk wajib diisi', 'error');
      return;
    }
    const sellPrice = Number(quickProdSellingPrice) || 0;
    const cogsVal = Number(quickProdCogs) || 0;

    if (sellPrice <= 0) {
      if (onShowToast) onShowToast('Harga jual harus lebih dari 0', 'error');
      return;
    }

    try {
      const newProd = await createProduct({
        name: quickProdName.trim(),
        barcode: barcode.trim(),
        category: quickProdCategory,
        unit: quickProdUnit.trim() || 'Pcs',
        sellingPrice: sellPrice,
        cogs: cogsVal,
        stock: Number(quickProdStock) || 0,
        minStockThreshold: 5,
      });

      if (newProd) {
        if (onShowToast) {
          onShowToast(`Produk "${newProd.name}" berhasil didaftarkan dan ditambahkan ke keranjang!`, 'success');
        }
        onProductCreated(newProd);
      }
    } catch {
      if (onShowToast) onShowToast('Gagal mendaftarkan produk baru', 'error');
    }
  };

  if (!isFormOpen) {
    return (
      <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
        <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mx-auto">
            <Barcode className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h4 className="text-base font-bold text-slate-900">Produk Tidak Ditemukan</h4>
            <p className="text-xs text-slate-500">
              Barcode belum terdaftar dalam sistem inventaris.
            </p>
            <div className="pt-2">
              <span className="inline-block px-3 py-1 bg-slate-100 border border-slate-200 text-slate-800 font-mono text-xs font-bold rounded-xl">
                {barcode}
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="w-full flex items-center justify-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Daftarkan Produk Baru</span>
            </button>

            <button
              type="button"
              onClick={onScanAnother}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Scan Barcode Lain
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-1.5 text-xs text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2">
            <PackagePlus className="w-5 h-5 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">Daftarkan Produk Baru</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          {/* Pre-filled Barcode badge */}
          <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Barcode className="w-4 h-4 text-teal-600" />
              <span className="font-mono font-bold text-teal-900">{barcode}</span>
            </div>
            <span className="text-[10px] font-semibold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-md">
              Barcode Baru
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nama Produk <span className="text-teal-600">*</span>
            </label>
            <input
              type="text"
              placeholder="Misal: Kopi Susu ABC 200ml"
              value={quickProdName}
              onChange={(e) => setQuickProdName(e.target.value)}
              required
              autoFocus
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
              <select
                value={quickProdCategory}
                onChange={(e) => setQuickProdCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Satuan</label>
              <input
                type="text"
                placeholder="Pcs / Btl / Bks"
                value={quickProdUnit}
                onChange={(e) => setQuickProdUnit(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Harga Jual (Rp) <span className="text-teal-600">*</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="Contoh: 5000"
                value={quickProdSellingPrice}
                onChange={(e) => setQuickProdSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                HPP per Item (Rp) <span className="text-teal-600">*</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="Contoh: 3800"
                value={quickProdCogs}
                onChange={(e) => setQuickProdCogs(e.target.value === '' ? '' : Number(e.target.value))}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Stok Awal</label>
            <input
              type="number"
              min="0"
              placeholder="Contoh: 12"
              value={quickProdStock}
              onChange={(e) => setQuickProdStock(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              Simpan & Tambah ke Keranjang
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
