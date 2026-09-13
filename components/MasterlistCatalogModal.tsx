'use client';

import React, { useState, useMemo } from 'react';
import {
  RETAIL_PRODUCT_MASTERLIST,
  MasterProductItem,
} from '@/lib/productMasterlist';
import { formatRupiah } from '@/lib/utils';
import {
  X,
  Search,
  Sparkles,
  Barcode,
  CheckCircle2,
  Plus,
  PackageCheck,
  Tag,
} from 'lucide-react';

interface MasterlistCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct?: (item: MasterProductItem) => void;
  onAddDirectToInventory?: (item: MasterProductItem, initialStock: number) => Promise<void>;
  existingProductBarcodes?: string[];
}

export function MasterlistCatalogModal({
  isOpen,
  onClose,
  onSelectProduct,
  onAddDirectToInventory,
  existingProductBarcodes = [],
}: MasterlistCatalogModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [addingId, setAddingId] = useState<string | null>(null);
  const [recentlyAddedIds, setRecentlyAddedIds] = useState<Set<string>>(new Set());

  // Extract all categories dynamically from masterlist
  const categories = useMemo(() => {
    const cats = new Set<string>();
    RETAIL_PRODUCT_MASTERLIST.forEach((item) => cats.add(item.category));
    return Array.from(cats);
  }, []);

  // Filter masterlist based on search query and category
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return RETAIL_PRODUCT_MASTERLIST.filter((item) => {
      const matchCat =
        selectedCategory === 'all' || item.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.barcode.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q));

      return matchCat && matchQuery;
    });
  }, [searchQuery, selectedCategory]);

  if (!isOpen) return null;

  const handleAddDirect = async (item: MasterProductItem) => {
    if (!onAddDirectToInventory) return;
    try {
      setAddingId(item.id);
      await onAddDirectToInventory(item, 10);
      setRecentlyAddedIds((prev) => new Set(prev).add(item.id));
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Masterlist Produk Ritel FMCG
              </h3>
              <p className="text-xs text-slate-500">
                Pilih atau tambahkan produk sembako, minuman, mie, dan kebutuhan harian siap pakai
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="p-4 border-b border-slate-100 bg-white space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama produk, barcode (899...), kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              Semua ({RETAIL_PRODUCT_MASTERLIST.length})
            </button>
            {categories.map((cat) => {
              const count = RETAIL_PRODUCT_MASTERLIST.filter((i) => i.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Search className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p>Tidak ada produk masterlist yang cocok dengan &quot;{searchQuery}&quot;.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredItems.map((item) => {
                const isAlreadyInStore =
                  existingProductBarcodes.includes(item.barcode) ||
                  recentlyAddedIds.has(item.id);

                return (
                  <div
                    key={item.id}
                    className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-teal-300 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-xs leading-snug">
                            {item.name}
                          </h4>
                          {item.description && (
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-lg border border-slate-200">
                          {item.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-600">
                        <span className="flex items-center gap-1 font-mono text-[10px] bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                          <Barcode className="w-3 h-3 text-slate-400" />
                          {item.barcode}
                        </span>
                        <span>•</span>
                        <span>Satuan: <strong className="text-slate-800">{item.unit}</strong></span>
                      </div>

                      <div className="flex items-baseline justify-between mt-3 pt-2.5 border-t border-slate-100">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Saran Harga Jual</span>
                          <span className="text-sm font-bold text-teal-700">
                            {formatRupiah(item.suggestedSellingPrice)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Perkiraan HPP</span>
                          <span className="text-xs font-semibold text-slate-600">
                            {formatRupiah(item.suggestedCogs)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 flex items-center justify-end gap-2">
                      {isAlreadyInStore && (
                        <span className="text-[10px] text-teal-700 bg-teal-50 border border-teal-200 px-2 py-1 rounded-lg font-semibold flex items-center gap-1 mr-auto">
                          <CheckCircle2 className="w-3 h-3 text-teal-600" />
                          Ada di Toko
                        </span>
                      )}

                      {onSelectProduct && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectProduct(item);
                            onClose();
                          }}
                          className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
                        >
                          Pilih Produk
                        </button>
                      )}

                      {onAddDirectToInventory && (
                        <button
                          type="button"
                          disabled={addingId === item.id || isAlreadyInStore}
                          onClick={() => handleAddDirect(item)}
                          className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
                            isAlreadyInStore
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white shadow-xs'
                          }`}
                        >
                          {isAlreadyInStore ? (
                            <>
                              <PackageCheck className="w-3.5 h-3.5" />
                              <span>Sudah Masuk</span>
                            </>
                          ) : addingId === item.id ? (
                            <span>Menyimpan...</span>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Tambah ke Toko</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Menampilkan {filteredItems.length} dari {RETAIL_PRODUCT_MASTERLIST.length} produk katalog ritel</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-semibold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
