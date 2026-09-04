'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ProductChannelMapping } from '@/types';
import { getChannelConfig } from '@/components/SalesChannelBadge';
import { formatRupiah } from '@/lib/utils';
import {
  X,
  Link2,
  Plus,
  Search,
  Check,
} from 'lucide-react';

interface ProductMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  mapping: ProductChannelMapping | null;
}

const ProductMappingModalContent: React.FC<{
  mapping: ProductChannelMapping;
  onClose: () => void;
}> = ({ mapping, onClose }) => {
  const {
    products,
    categories,
    mapProductToChannel,
    createAndMapProduct,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'select' | 'create'>('select');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>(mapping.productId || '');

  // Form state for creating new product
  const [newProductName, setNewProductName] = useState(mapping.externalProductName || '');
  const [newCategory, setNewCategory] = useState(categories[0]?.name || 'Umum');
  const [newSellingPrice, setNewSellingPrice] = useState<number>(mapping.channelPrice || 0);
  const [newCogs, setNewCogs] = useState<number>(Math.round((mapping.channelPrice || 0) * 0.7));
  const [newStock, setNewStock] = useState<number>(10);
  const [newUnit, setNewUnit] = useState('Pcs');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const channelConfig = getChannelConfig(mapping.channel);
  const ChannelIcon = channelConfig.icon;

  const filteredProducts = products.filter(p => {
    if (p.isArchived) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.barcode?.includes(q)
    );
  });

  const handleSaveSelection = async () => {
    if (!selectedProductId) return;
    setIsSubmitting(true);
    await mapProductToChannel(mapping.id, selectedProductId);
    setIsSubmitting(false);
    onClose();
  };

  const handleCreateNewProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) return;

    setIsSubmitting(true);
    const generatedSku = `SKU-${Date.now().toString().slice(-6)}`;

    await createAndMapProduct(mapping.id, {
      name: newProductName.trim(),
      category: newCategory,
      sellingPrice: Number(newSellingPrice) || 0,
      cogs: Number(newCogs) || 0,
      stock: Number(newStock) || 0,
      unit: newUnit.trim() || 'Pcs',
      minStockThreshold: 5,
      sku: generatedSku,
      isArchived: false,
    });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div
      id="product-mapping-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        id="product-mapping-modal-container"
        className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden text-slate-800"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${channelConfig.colorClass}`}>
              <ChannelIcon size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Pemetaan Produk Saluran ({mapping.channel})
              </h2>
              <p className="text-xs text-slate-500">
                Hubungkan produk external ke inventaris pusat warung
              </p>
            </div>
          </div>
          <button
            id="btn-close-mapping-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* External Product Info Card */}
        <div className="p-4 mx-6 mt-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">{mapping.externalProductName}</span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 font-mono">
                SKU: {mapping.externalSku}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Harga Saluran: <span className="text-teal-700 font-semibold">{formatRupiah(mapping.channelPrice || 0)}</span>
            </p>
          </div>
          <div className="text-right">
            <span
              className={`text-xs px-2.5 py-1 rounded-md border font-medium ${
                mapping.mappingStatus === 'mapped'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {mapping.mappingStatus === 'mapped' ? 'Sudah Dipetakan' : 'Belum Dipetakan'}
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 px-6 mt-4">
          <button
            id="tab-map-existing"
            type="button"
            onClick={() => setActiveTab('select')}
            className={`flex items-center gap-2 py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'select'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Link2 size={14} />
            Pilih dari Produk Warung Ada
          </button>
          <button
            id="tab-map-create"
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'create'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Plus size={14} />
            Buat Produk Baru di Warung
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6">
          {activeTab === 'select' ? (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="input-search-mapping-product"
                  type="text"
                  placeholder="Cari nama produk, SKU, atau kategori..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              {/* Product List */}
              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    Tidak ada produk warung yang cocok dengan kata kunci.
                  </div>
                ) : (
                  filteredProducts.map(prod => {
                    const isSelected = selectedProductId === prod.id;
                    return (
                      <div
                        key={prod.id}
                        id={`mapping-prod-${prod.id}`}
                        onClick={() => setSelectedProductId(prod.id)}
                        className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-teal-50/70 border border-teal-200'
                            : 'hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-800">{prod.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                              {prod.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500">
                            <span>Harga: <span className="text-teal-700 font-semibold">{formatRupiah(prod.sellingPrice)}</span></span>
                            <span>Stok: <span className="text-slate-800 font-semibold">{prod.stock} {prod.unit}</span></span>
                            {prod.barcode && <span className="font-mono text-slate-400">Barcode: {prod.barcode}</span>}
                          </div>
                        </div>
                        <div className="flex items-center">
                          {isSelected ? (
                            <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-xs">
                              <Check size={12} className="stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border border-slate-300 hover:border-teal-500" />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  id="btn-cancel-mapping"
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="btn-save-mapping-selection"
                  type="button"
                  disabled={!selectedProductId || isSubmitting}
                  onClick={handleSaveSelection}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Check size={14} />
                  Petakan ke Produk Ini
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateNewProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Produk di Warung</label>
                <input
                  id="input-new-map-name"
                  type="text"
                  required
                  value={newProductName}
                  onChange={e => setNewProductName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori</label>
                  <select
                    id="select-new-map-category"
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Satuan</label>
                  <input
                    id="input-new-map-unit"
                    type="text"
                    value={newUnit}
                    onChange={e => setNewUnit(e.target.value)}
                    placeholder="Pcs, Botol, Bungkus..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Harga Jual (Rp)</label>
                  <input
                    id="input-new-map-price"
                    type="number"
                    value={newSellingPrice}
                    onChange={e => setNewSellingPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">HPP / COGS (Rp)</label>
                  <input
                    id="input-new-map-cogs"
                    type="number"
                    value={newCogs}
                    onChange={e => setNewCogs(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stok Awal</label>
                  <input
                    id="input-new-map-stock"
                    type="number"
                    value={newStock}
                    onChange={e => setNewStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  id="btn-cancel-create-map"
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="btn-submit-create-map"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  Buat & Petakan Produk
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export const ProductMappingModal: React.FC<ProductMappingModalProps> = ({
  isOpen,
  onClose,
  mapping,
}) => {
  if (!isOpen || !mapping) return null;

  return (
    <ProductMappingModalContent
      key={mapping.id}
      mapping={mapping}
      onClose={onClose}
    />
  );
};
