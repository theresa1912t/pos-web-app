'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatRupiah, formatDate, calculateWeightedCOGS } from '@/lib/utils';
import { X, PackagePlus, History, ArrowRight, CheckCircle2, Building2 } from 'lucide-react';

interface RestockModalProps {
  productId?: string | null;
  onClose?: () => void;
}

export function RestockModal({ productId, onClose }: RestockModalProps) {
  const {
    products,
    restocks,
    restockProduct,
    restockModalProductId,
    setRestockModalProductId,
    branches,
    activeBranchId,
    accessibleBranches,
    canSwitchToAllBranches,
    getProductStockInBranch,
  } = useApp();
  
  const effectiveProductId = productId !== undefined ? productId : restockModalProductId;

  const [selectedProductId, setSelectedProductId] = useState<string>(
    () => effectiveProductId || (products[0]?.id ?? '')
  );
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Destination branch state
  const defaultBranchId = activeBranchId !== 'all'
    ? activeBranchId
    : (accessibleBranches.find((b) => b.status === 'Active')?.id || accessibleBranches[0]?.id || branches[0]?.id || 'branch-1');
  const [targetBranchId, setTargetBranchId] = useState<string>(defaultBranchId);

  const targetBranch = branches.find((b) => b.id === targetBranchId) || branches[0];

  const [quantity, setQuantity] = useState<number | ''>('');
  const [purchaseCost, setPurchaseCost] = useState<number | ''>(() => selectedProduct?.cogs || '');
  const [notes, setNotes] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setRestockModalProductId(null);
    }
  };

  const handleProductChange = (newProdId: string) => {
    setSelectedProductId(newProdId);
    const prod = products.find((p) => p.id === newProdId);
    if (prod) {
      setPurchaseCost(prod.cogs || 0);
    }
  };

  if (!productId && !selectedProductId) return null;

  const currentStock = selectedProduct ? selectedProduct.stock : 0;
  const currentBranchStock = selectedProduct ? getProductStockInBranch(selectedProduct.id, targetBranchId) : 0;
  const currentCogs = selectedProduct ? selectedProduct.cogs : 0;
  const numQuantity = typeof quantity === 'number' ? quantity : 0;
  const numPurchaseCost = typeof purchaseCost === 'number' ? purchaseCost : 0;

  const resultingStock = currentStock + numQuantity;
  const resultingBranchStock = currentBranchStock + numQuantity;
  const totalRestockCost = numQuantity * numPurchaseCost;
  const newWeightedCogs = selectedProduct
    ? calculateWeightedCOGS(currentStock, currentCogs, numQuantity, numPurchaseCost)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || numQuantity <= 0 || numPurchaseCost <= 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await restockProduct(selectedProduct.id, numQuantity, numPurchaseCost, notes, targetBranchId);
      if (res) {
        setSuccessMessage(
          `Berhasil restock ${numQuantity} ${selectedProduct.unit} ${selectedProduct.name} ke ${targetBranch?.name || 'Cabang'}! Stok cabang: ${resultingBranchStock} ${selectedProduct.unit}.`
        );
        setQuantity('');
        setNotes('');
        setTimeout(() => {
          setSuccessMessage(null);
          handleClose();
        }, 1400);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter history for selected product or all restocks
  const productRestocks = restocks.filter(
    (r) => !selectedProductId || r.productId === selectedProductId
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Restock Produk / Stok Masuk
              </h2>
              <p className="text-xs text-slate-500">
                Catat stok barang yang baru dibeli dari agen atau distributor
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/50">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`flex items-center space-x-2 py-3 px-3 border-b-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'form'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <PackagePlus className="w-4 h-4" />
            <span>Formulir Restock</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-2 py-3 px-3 border-b-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Riwayat Restock ({productRestocks.length})</span>
          </button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="mx-6 mt-4 p-3.5 bg-teal-50 border border-teal-200 rounded-xl flex items-center space-x-2.5 text-teal-800 text-xs font-medium animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'form' ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Branch Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Cabang Tujuan Restock <span className="text-teal-600">*</span>
                </label>
                {canSwitchToAllBranches ? (
                  <select
                    value={targetBranchId}
                    onChange={(e) => setTargetBranchId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-500 transition-colors"
                  >
                    {accessibleBranches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code}){b.status === 'Inactive' ? ' - Nonaktif' : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center space-x-2 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800">
                    <Building2 className="w-4 h-4 text-teal-600" />
                    <span>{targetBranch?.name} ({targetBranch?.code})</span>
                  </div>
                )}
              </div>

              {/* Product Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Pilih Produk <span className="text-teal-600">*</span>
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-500 transition-colors"
                >
                  {products
                    .filter((p) => !p.isArchived)
                    .map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name} (Total: {prod.stock} {prod.unit})
                      </option>
                    ))}
                </select>
              </div>

              {selectedProduct && (
                <>
                  {/* Current Status Info Box */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    <div>
                      <span className="text-slate-500 block font-normal">Kategori:</span>
                      <span className="text-slate-800 font-semibold">{selectedProduct.category}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-normal">Stok Cabang Ini:</span>
                      <span className="text-teal-700 font-bold">
                        {currentBranchStock} {selectedProduct.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-normal">Total Semua Cabang:</span>
                      <span className="font-semibold text-slate-800">
                        {selectedProduct.stock} {selectedProduct.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-normal">HPP / Modal Lama:</span>
                      <span className="text-slate-700 font-semibold">{formatRupiah(selectedProduct.cogs)}</span>
                    </div>
                  </div>

                  {/* Restock Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Jumlah Restock ({selectedProduct.unit}) <span className="text-teal-600">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="Contoh: 20"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 0))}
                        required
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Biaya Beli per Item (Rp) <span className="text-teal-600">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="Contoh: 2500"
                        value={purchaseCost}
                        onChange={(e) => setPurchaseCost(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                        required
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Dynamic Calculation Live Box */}
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5">
                    <div className="text-xs font-bold text-teal-800 uppercase tracking-wider">
                      Ringkasan & Kalkulasi Restock
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                        <span className="text-xs text-slate-500 block font-normal">Total Biaya Restock:</span>
                        <span className="text-base font-bold text-teal-700">
                          {formatRupiah(totalRestockCost)}
                        </span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                        <span className="text-xs text-slate-500 block font-normal">Hasil Stok Akhir:</span>
                        <div className="flex items-center space-x-1.5 text-base font-bold text-slate-900">
                          <span>{currentStock}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-teal-600" />
                          <span className="text-teal-600">{resultingStock} {selectedProduct.unit}</span>
                        </div>
                      </div>
                    </div>

                    {/* Weighted Average COGS Calculation Breakdown */}
                    <div className="pt-2.5 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span>Metode Rata-rata Tertimbang (HPP):</span>
                      <span className="text-slate-800 font-semibold">
                        HPP Baru: {formatRupiah(newWeightedCogs)} / {selectedProduct.unit}
                      </span>
                    </div>
                  </div>

                  {/* Notes / Vendor */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Catatan / Agen Distributor (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Misal: Beli di Agen Grosir Sumber Rejeki"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-500 transition-colors"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={numQuantity <= 0 || numPurchaseCost <= 0 || isSubmitting}
                      className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl text-xs font-semibold shadow-md shadow-teal-600/20 active:scale-[0.99] transition-all cursor-pointer"
                    >
                      <PackagePlus className="w-4 h-4" />
                      <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Restock & Catat Biaya'}</span>
                    </button>
                  </div>
                </>
              )}
            </form>
          ) : (
            /* Restock History View */
            <div className="space-y-4">
              {productRestocks.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Belum ada riwayat restock untuk produk ini.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">Tanggal</th>
                        <th className="p-3.5">Produk</th>
                        <th className="p-3.5">Cabang</th>
                        <th className="p-3.5 text-right">Jumlah</th>
                        <th className="p-3.5 text-right">Harga Beli/Item</th>
                        <th className="p-3.5 text-right">Total Biaya</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {productRestocks.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3.5 text-slate-500">{formatDate(r.date, true)}</td>
                          <td className="p-3.5 font-semibold text-slate-800">{r.productName}</td>
                          <td className="p-3.5">
                            <span className="inline-flex items-center space-x-1 font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              <span>{r.branchName || branches.find((b) => b.id === r.branchId)?.name || 'Cabang Pusat'}</span>
                            </span>
                          </td>
                          <td className="p-3.5 text-right text-teal-600 font-bold">+{r.quantity}</td>
                          <td className="p-3.5 text-right text-slate-600">{formatRupiah(r.purchaseCostPerItem)}</td>
                          <td className="p-3.5 text-right text-slate-900 font-semibold">{formatRupiah(r.totalCost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
