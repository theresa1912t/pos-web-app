'use client';

import React from 'react';
import { BadgePercent, CheckCircle2 } from 'lucide-react';
import { CartItem, Promotion, PaymentMethod, SalesChannel } from '@/types';
import { SalesChannelBadge } from '@/components/SalesChannelBadge';
import { getProductEffectivePromo } from '@/services/promotionService';

interface PosOrderConfirmationStepProps {
  cart: CartItem[];
  promotions: Promotion[];
  orderBranchId: string;
  totalItemsCount: number;
  totalAmount: number;
  originalTotalAmount: number;
  totalPromoSavings: number;
  salesChannel: SalesChannel;
  externalOrderId: string;
  paymentMethod: PaymentMethod;
  isAddingCustomPayment: boolean;
  customPaymentName: string;
  selectedBank: string;
  edcMachine: string;
  cardBrand: string;
  bonCustomerName: string;
  cashTendered: number | '';
  changeAmount: number;
  isSubmitting: boolean;
  onEditOrder: () => void;
  onConfirmOrder: () => void;
  formatRupiah: (val: number) => string;
}

export function PosOrderConfirmationStep({
  cart,
  promotions,
  orderBranchId,
  totalItemsCount,
  totalAmount,
  originalTotalAmount,
  totalPromoSavings,
  salesChannel,
  externalOrderId,
  paymentMethod,
  isAddingCustomPayment,
  customPaymentName,
  selectedBank,
  edcMachine,
  cardBrand,
  bonCustomerName,
  cashTendered,
  changeAmount,
  isSubmitting,
  onEditOrder,
  onConfirmOrder,
  formatRupiah,
}: PosOrderConfirmationStepProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-xl mx-auto w-full space-y-4">
      <div className="text-center space-y-1">
        <h3 className="text-base font-bold text-slate-900">Konfirmasi Transaksi</h3>
        <p className="text-xs text-slate-500">Periksa kembali daftar item dan total pembayaran</p>
      </div>

      {/* Order Card */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-semibold text-slate-900">Item Pesanan</span>
          <span className="text-xs text-slate-500">{totalItemsCount} Total Barang</span>
        </div>

        {/* Items */}
        <div className="p-4 divide-y divide-slate-100 max-h-60 overflow-y-auto">
          {cart.map((item) => {
            const itemPromo = getProductEffectivePromo(item.product, promotions, orderBranchId);
            const itemUnitPrice = itemPromo.hasPromo ? itemPromo.promoPrice : item.product.sellingPrice;
            const itemSubtotal = itemUnitPrice * item.quantity;

            return (
              <div key={item.product.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-800 flex items-center space-x-1.5">
                    <span>{item.product.name}</span>
                    {itemPromo.hasPromo && (
                      <span className="text-[9px] font-bold px-1 rounded bg-amber-100 text-amber-900 border border-amber-300">
                        {itemPromo.badgeText}
                      </span>
                    )}
                  </div>
                  <div className="text-slate-400 flex items-center space-x-1.5">
                    <span>{item.quantity} x {formatRupiah(itemUnitPrice)}</span>
                    {itemPromo.hasPromo && (
                      <span className="line-through text-[10px] text-slate-300">
                        {formatRupiah(item.product.sellingPrice)}
                      </span>
                    )}
                  </div>
                </div>
                <div className={`font-bold ${itemPromo.hasPromo ? 'text-emerald-700' : 'text-teal-700'}`}>
                  {formatRupiah(itemSubtotal)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Totals */}
        <div className="p-4 bg-slate-50/50 border-t border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between items-center text-slate-600">
            <span>Saluran Penjualan:</span>
            <SalesChannelBadge channel={salesChannel} size="sm" />
          </div>

          {externalOrderId && (
            <div className="flex justify-between items-center text-slate-600">
              <span>External Order ID:</span>
              <span className="font-mono text-slate-800 font-semibold">{externalOrderId}</span>
            </div>
          )}

          <div className="flex justify-between text-slate-600">
            <span>Metode Pembayaran:</span>
            <span className="text-slate-900 font-semibold">
              {isAddingCustomPayment && customPaymentName
                ? customPaymentName
                : paymentMethod === 'Transfer'
                ? `Transfer Bank (${selectedBank})`
                : paymentMethod === 'Debit'
                ? `Kartu Debit (${edcMachine})`
                : paymentMethod === 'Credit'
                ? `Kartu Kredit (${cardBrand})`
                : paymentMethod === 'Kasbon'
                ? `Bon / Kasbon: ${bonCustomerName || 'Pelanggan'}`
                : paymentMethod}
            </span>
          </div>

          {totalPromoSavings > 0 && (
            <>
              <div className="flex justify-between text-slate-500">
                <span>Total Normal:</span>
                <span className="line-through">{formatRupiah(originalTotalAmount)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span className="flex items-center space-x-1">
                  <BadgePercent className="w-3.5 h-3.5" />
                  <span>Hemat Diskon Promo:</span>
                </span>
                <span>-{formatRupiah(totalPromoSavings)}</span>
              </div>
            </>
          )}

          {paymentMethod === 'Cash' && typeof cashTendered === 'number' && (
            <>
              <div className="flex justify-between text-slate-600">
                <span>Uang Diterima:</span>
                <span className="text-slate-900 font-semibold">{formatRupiah(cashTendered)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Kembalian:</span>
                <span className="text-teal-700 font-bold">{formatRupiah(changeAmount)}</span>
              </div>
            </>
          )}

          <div className="pt-2.5 border-t border-slate-200 flex justify-between items-center text-sm">
            <span className="font-semibold text-slate-800">Total Pembayaran:</span>
            <span className="text-lg font-bold text-teal-700">
              {formatRupiah(totalAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Step 3 Actions */}
      <div className="flex items-center justify-between pt-3">
        <button
          type="button"
          onClick={onEditOrder}
          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
        >
          Edit Pesanan
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onConfirmOrder}
          className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white px-6 py-2.5 rounded-xl text-xs font-semibold shadow-md shadow-teal-600/20 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{isSubmitting ? 'Memproses...' : 'Konfirmasi & Selesaikan'}</span>
        </button>
      </div>
    </div>
  );
}
