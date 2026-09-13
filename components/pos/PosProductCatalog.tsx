'use client';

import React from 'react';
import {
  Search,
  Barcode,
  Sparkles,
  Plus,
  ShoppingBag,
} from 'lucide-react';
import { Product, ProductCategory, CartItem, Promotion } from '@/types';
import { getProductEffectivePromo } from '@/services/promotionService';

interface PosProductCatalogProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  categories: ProductCategory[];
  availableProducts: Product[];
  filteredProducts: Product[];
  cart: CartItem[];
  promotions: Promotion[];
  orderBranchId: string;
  getBranchStock: (productId: string) => number;
  onAddToCart: (prod: Product) => void;
  onBarcodeScanned: (barcode: string) => void;
  onOpenScanner: () => void;
  onSeedInitialData: () => Promise<void>;
  isSeeding: boolean;
  mobilePosTab: 'catalog' | 'cart';
  setMobilePosTab: (tab: 'catalog' | 'cart') => void;
  totalItemsCount: number;
  totalAmount: number;
  formatRupiah: (val: number) => string;
}

export function PosProductCatalog({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  categories,
  availableProducts,
  filteredProducts,
  cart,
  promotions,
  orderBranchId,
  getBranchStock,
  onAddToCart,
  onBarcodeScanned,
  onOpenScanner,
  onSeedInitialData,
  isSeeding,
  mobilePosTab,
  setMobilePosTab,
  totalItemsCount,
  totalAmount,
  formatRupiah,
}: PosProductCatalogProps) {
  return (
    <div
      className={`${
        mobilePosTab === 'catalog' ? 'flex' : 'hidden md:flex'
      } flex-1 flex-col border-r-0 md:border-r border-slate-200 bg-white overflow-hidden`}
    >
      {/* Search & Category Filter Bar */}
      <div className="p-3 sm:p-4 border-b border-slate-200 space-y-3 bg-slate-50/50">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Ketik nama produk atau barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  onBarcodeScanned(searchQuery.trim());
                }
              }}
              autoFocus
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-12 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Hapus
              </button>
            )}
          </div>

          {/* Scan Barcode Action Button */}
          <button
            type="button"
            onClick={onOpenScanner}
            className="flex items-center space-x-1.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs shadow-teal-600/20 active:scale-[0.99] transition-all cursor-pointer shrink-0"
          >
            <Barcode className="w-4 h-4" />
            <span className="hidden sm:inline">Scan Barcode</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-semibold transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({availableProducts.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-semibold transition-all cursor-pointer ${
                selectedCategory === cat.name
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-center space-y-2 text-slate-400">
            {availableProducts.length === 0 ? (
              <>
                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 mb-1">
                  <Sparkles className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-700">Inventaris Masih Kosong</p>
                <p className="text-[11px] text-slate-400 max-w-xs">
                  Isi langsung dengan 10 produk contoh (Indomie, Aqua, Kopi, Sembako) untuk langsung uji coba transaksi kasir.
                </p>
                <button
                  type="button"
                  disabled={isSeeding}
                  onClick={onSeedInitialData}
                  className="mt-2 flex items-center space-x-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSeeding ? 'Memuat Data...' : 'Isi 10 Produk Contoh (Seed Data)'}</span>
                </button>
              </>
            ) : (
              <>
                <Barcode className="w-10 h-10 text-slate-300" />
                <p className="text-xs font-medium text-slate-600">Produk tidak ditemukan.</p>
                <p className="text-[11px] text-slate-400 max-w-xs">
                  Coba kata kunci lain atau scan barcode produk untuk menambahkannya.
                </p>
                <button
                  type="button"
                  onClick={onOpenScanner}
                  className="mt-2 flex items-center space-x-1.5 px-3.5 py-1.5 bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  <Barcode className="w-3.5 h-3.5" />
                  <span>Buka Scanner Kamera</span>
                </button>
              </>
            )}
          </div>
        ) : (
          filteredProducts.map((prod) => {
            const inCart = cart.find((it) => it.product.id === prod.id);
            const branchStock = getBranchStock(prod.id);
            const isOutOfStock = branchStock <= 0;
            const promoInfo = getProductEffectivePromo(prod, promotions, orderBranchId);

            return (
              <div
                key={prod.id}
                onClick={() => !isOutOfStock && onAddToCart(prod)}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all shadow-xs ${
                  isOutOfStock
                    ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                    : inCart
                    ? 'bg-teal-50/50 border-teal-400 ring-1 ring-teal-300 cursor-pointer'
                    : 'bg-white border-slate-200 hover:border-teal-300 hover:shadow-sm cursor-pointer'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <span className="text-[10px] font-semibold text-slate-500 px-2 py-0.5 rounded-md bg-slate-100">
                      {prod.category}
                    </span>
                    <div className="flex items-center space-x-1">
                      {promoInfo.hasPromo && (
                        <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded-md shadow-xs">
                          {promoInfo.badgeText}
                        </span>
                      )}
                      {inCart && (
                        <span className="text-[11px] font-bold text-white bg-teal-600 px-2 py-0.5 rounded-md shadow-xs">
                          x{inCart.quantity}
                        </span>
                      )}
                    </div>
                  </div>
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">
                    {prod.name}
                  </h4>
                  {prod.barcode && (
                    <div className="mt-1 flex items-center space-x-1 text-[10px] text-slate-400 font-mono">
                      <Barcode className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{prod.barcode}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    {promoInfo.hasPromo ? (
                      <div>
                        <span className="line-through text-[11px] text-slate-400 block leading-none mb-0.5">
                          {formatRupiah(prod.sellingPrice)}
                        </span>
                        <div className="text-xs sm:text-sm font-bold text-emerald-700">
                          {formatRupiah(promoInfo.promoPrice)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs sm:text-sm font-bold text-teal-700">
                        {formatRupiah(prod.sellingPrice)}
                      </div>
                    )}
                    <div className="text-[10px] text-slate-400">
                      Stok: {branchStock} {prod.unit}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isOutOfStock) onAddToCart(prod);
                    }}
                    className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-600 text-teal-700 hover:text-white transition-colors cursor-pointer disabled:opacity-30"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Bottom Bar on Mobile when Cart has items */}
      {cart.length > 0 && (
        <div className="md:hidden p-3 bg-white border-t border-slate-200 shadow-lg flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <span className="text-[10px] text-slate-500 block leading-none mb-0.5">
              {totalItemsCount} item dipilih
            </span>
            <span className="text-sm font-bold text-teal-700 block truncate">
              {formatRupiah(totalAmount)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMobilePosTab('cart')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Lihat Keranjang &rarr;</span>
          </button>
        </div>
      )}
    </div>
  );
}
