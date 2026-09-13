'use client';

import React from 'react';
import {
  ShoppingBag,
  ArrowLeft,
  Trash2,
  Minus,
  Plus,
  BadgePercent,
  ArrowRight,
} from 'lucide-react';
import { CartItem, Promotion } from '@/types';
import { getProductEffectivePromo } from '@/services/promotionService';

interface PosCartPanelProps {
  cart: CartItem[];
  mobilePosTab: 'catalog' | 'cart';
  setMobilePosTab: (tab: 'catalog' | 'cart') => void;
  totalItemsCount: number;
  totalAmount: number;
  originalTotalAmount: number;
  totalPromoSavings: number;
  promotions: Promotion[];
  orderBranchId: string;
  onClearCart: () => void;
  onRemoveFromCart: (productId: string) => void;
  onUpdateQuantity: (productId: string, qty: number) => void;
  onNextToPayment: () => void;
  formatRupiah: (val: number) => string;
}

export function PosCartPanel({
  cart,
  mobilePosTab,
  setMobilePosTab,
  totalItemsCount,
  totalAmount,
  originalTotalAmount,
  totalPromoSavings,
  promotions,
  orderBranchId,
  onClearCart,
  onRemoveFromCart,
  onUpdateQuantity,
  onNextToPayment,
  formatRupiah,
}: PosCartPanelProps) {
  return (
    <div
      className={`${
        mobilePosTab === 'catalog' ? 'hidden md:flex' : 'flex'
      } w-full md:w-80 lg:w-96 flex-col bg-white flex-1 md:flex-initial md:h-auto border-t md:border-t-0 border-slate-200`}
    >
      {/* Cart Header */}
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setMobilePosTab('catalog')}
            className="md:hidden p-1 rounded-lg hover:bg-slate-200/60 text-slate-500 mr-0.5 cursor-pointer"
            title="Kembali ke Katalog"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <ShoppingBag className="w-4 h-4 text-teal-600" />
          <span className="text-sm font-bold text-slate-900">
            Keranjang Belanja ({totalItemsCount})
          </span>
        </div>
        {cart.length > 0 && (
          <button
            type="button"
            onClick={onClearCart}
            className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
          >
            Kosongkan
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <ShoppingBag className="w-10 h-10 mb-2.5 text-slate-200" />
            <p className="text-xs font-medium text-slate-600">Keranjang masih kosong.</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Pilih produk di sebelah kiri atau scan barcode produk.
            </p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.product.id}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col space-y-2"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-800 leading-tight block">
                    {item.product.name}
                  </span>
                  {item.product.barcode && (
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {item.product.barcode}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveFromCart(item.product.id)}
                  className="text-slate-400 hover:text-rose-600 p-1 ml-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={item.product.stock}
                    value={item.quantity}
                    onChange={(e) =>
                      onUpdateQuantity(
                        item.product.id,
                        parseInt(e.target.value) || 1
                      )
                    }
                    className="w-10 text-center bg-white border border-slate-200 rounded-lg py-1 text-xs text-slate-800 font-semibold focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                    disabled={item.quantity >= item.product.stock}
                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer disabled:opacity-30"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="text-right">
                  {(() => {
                    const itemPromo = getProductEffectivePromo(
                      item.product,
                      promotions,
                      orderBranchId
                    );
                    const itemUnitPrice = itemPromo.hasPromo
                      ? itemPromo.promoPrice
                      : item.product.sellingPrice;
                    const itemSubtotal = itemUnitPrice * item.quantity;

                    return (
                      <div>
                        {itemPromo.hasPromo && (
                          <div className="flex items-center justify-end space-x-1">
                            <span className="line-through text-[10px] text-slate-400">
                              {formatRupiah(item.product.sellingPrice * item.quantity)}
                            </span>
                            <span className="text-[9px] font-bold px-1 rounded bg-amber-100 text-amber-900 border border-amber-300">
                              {itemPromo.badgeText}
                            </span>
                          </div>
                        )}
                        <div
                          className={`text-xs font-bold ${
                            itemPromo.hasPromo ? 'text-emerald-700' : 'text-teal-700'
                          }`}
                        >
                          {formatRupiah(itemSubtotal)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          @{formatRupiah(itemUnitPrice)}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Bottom Total & Next Button */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-3">
        {totalPromoSavings > 0 && (
          <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
            <span className="flex items-center space-x-1">
              <BadgePercent className="w-3.5 h-3.5" />
              <span>Hemat Diskon Promo:</span>
            </span>
            <span>-{formatRupiah(totalPromoSavings)}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 block">Total Tagihan:</span>
            {totalPromoSavings > 0 && (
              <span className="line-through text-[11px] text-slate-400 block">
                {formatRupiah(originalTotalAmount)}
              </span>
            )}
          </div>
          <span className="text-lg font-bold text-teal-700">
            {formatRupiah(totalAmount)}
          </span>
        </div>

        <button
          type="button"
          disabled={cart.length === 0}
          onClick={onNextToPayment}
          className="w-full flex items-center justify-center space-x-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-xl text-xs font-semibold shadow-md shadow-teal-600/20 active:scale-[0.99] transition-all cursor-pointer"
        >
          <span>Lanjut ke Pembayaran</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
