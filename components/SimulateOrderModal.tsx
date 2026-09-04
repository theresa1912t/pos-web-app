'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { SalesChannel } from '@/types';
import { formatRupiah } from '@/lib/utils';
import {
  X,
  ShoppingCart,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface SimulateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultChannel?: SalesChannel;
}

const SimulateOrderModalContent: React.FC<{
  defaultChannel: SalesChannel;
  onClose: () => void;
}> = ({ defaultChannel, onClose }) => {
  const { products, createExternalOrder } = useApp();

  const availableProducts = products.filter(p => !p.isArchived);

  const [channel, setChannel] = useState<SalesChannel>(defaultChannel);
  const [externalOrderId, setExternalOrderId] = useState(() => `${defaultChannel.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`);
  const [selectedItems, setSelectedItems] = useState<
    Array<{ productId: string; quantity: number }>
  >(() => (availableProducts.length > 0 ? [{ productId: availableProducts[0].id, quantity: 1 }] : []));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const addItemRow = () => {
    if (availableProducts.length === 0) {
      setErrorMsg('Belum ada produk aktif di inventaris warung. Tambahkan produk di menu Produk terlebih dahulu.');
      return;
    }
    // Find next product not yet in selectedItems to avoid identical duplicates
    const unused = availableProducts.find(p => !selectedItems.some(it => it.productId === p.id)) || availableProducts[0];
    setSelectedItems(prev => [...prev, { productId: unused.id, quantity: 1 }]);
    setErrorMsg('');
  };

  const removeItemRow = (index: number) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: 'productId' | 'quantity', val: any) => {
    setSelectedItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const totalOrder = selectedItems.reduce((acc, item) => {
    const p = availableProducts.find(prod => prod.id === item.productId);
    return acc + (p ? p.sellingPrice * item.quantity : 0);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      setErrorMsg('Pilih minimal satu produk untuk simulasi pesanan.');
      return;
    }

    // Check stock availability
    for (const item of selectedItems) {
      const prod = products.find(p => p.id === item.productId);
      if (prod && prod.stock < item.quantity) {
        setErrorMsg(`Stok ${prod.name} tidak mencukupi (Tersisa: ${prod.stock}, diminta: ${item.quantity}).`);
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const itemsPayload = selectedItems.map(it => {
        const prod = products.find(p => p.id === it.productId);
        return {
          productId: it.productId,
          externalSku: prod?.sku || `SKU-${it.productId}`,
          externalProductName: prod?.name || 'Produk External',
          quantity: it.quantity,
          sellingPrice: prod?.sellingPrice || 10000,
        };
      });

      const result = await createExternalOrder(
        channel,
        externalOrderId,
        itemsPayload,
        channel.includes('Food') ? 'GoPay' : 'Transfer'
      );

      if (result.success) {
        setSuccessMsg(
          `Pesanan ${externalOrderId} dari ${channel} berhasil diproses! Stok pusat telah terpotong dan tersimpan di database.`
        );
        setTimeout(() => {
          setIsSubmitting(false);
          onClose();
        }, 1200);
      } else {
        setErrorMsg(result.error || 'Gagal memproses pesanan.');
        setIsSubmitting(false);
      }
    } catch {
      setErrorMsg('Gagal memproses simulasi pesanan external.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="simulate-order-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        id="simulate-order-modal-container"
        className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden text-slate-800"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-100 text-teal-600">
              <ShoppingCart size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Simulasi Pesanan Masuk (Omnichannel)
              </h2>
              <p className="text-xs text-slate-500">
                Menerima transaksi external langsung ke inventaris pusat
              </p>
            </div>
          </div>
          <button
            id="btn-close-simulate-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Saluran Penjualan
                </label>
                <select
                  id="select-simulate-channel"
                  value={channel}
                  onChange={e => {
                    const ch = e.target.value as SalesChannel;
                    setChannel(ch);
                    setExternalOrderId(`${ch.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium"
                >
                  <option value="Shopee">Shopee</option>
                  <option value="Tokopedia">Tokopedia</option>
                  <option value="TikTok Shop">TikTok Shop</option>
                  <option value="GoFood">GoFood</option>
                  <option value="GrabFood">GrabFood</option>
                  <option value="ShopeeFood">ShopeeFood</option>
                  <option value="Other">Saluran Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  External Order ID
                </label>
                <input
                  id="input-simulate-external-id"
                  type="text"
                  required
                  value={externalOrderId}
                  onChange={e => setExternalOrderId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-700">Item Pesanan</label>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                    {selectedItems.length} item
                  </span>
                </div>
                <button
                  id="btn-add-simulate-item"
                  type="button"
                  onClick={addItemRow}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 hover:bg-teal-100 active:bg-teal-200 text-teal-700 text-xs font-semibold rounded-lg border border-teal-200 transition-colors cursor-pointer shadow-2xs"
                >
                  <Plus size={13} />
                  Tambah Item
                </button>
              </div>

              {selectedItems.length === 0 ? (
                <div className="p-6 border border-dashed border-slate-200 rounded-xl text-center space-y-3 bg-slate-50/50">
                  <p className="text-xs text-slate-500">
                    {availableProducts.length === 0
                      ? 'Belum ada produk terdaftar di warung.'
                      : 'Belum ada item pesanan yang dipilih.'}
                  </p>
                  {availableProducts.length > 0 && (
                    <button
                      type="button"
                      id="btn-add-first-item"
                      onClick={addItemRow}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus size={14} />
                      Tambah Item Sekarang
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {selectedItems.map((item, index) => {
                    const prod = availableProducts.find(p => p.id === item.productId);
                    return (
                      <div
                        key={index}
                        id={`simulate-item-row-${index}`}
                        className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <span className="text-[11px] font-bold text-slate-400 w-5 text-center shrink-0">
                          #{index + 1}
                        </span>

                        <select
                          id={`simulate-item-product-${index}`}
                          value={item.productId}
                          onChange={e => updateItem(index, 'productId', e.target.value)}
                          className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium"
                        >
                          {availableProducts.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} (Stok: {p.stock} {p.unit}) - {formatRupiah(p.sellingPrice)}
                            </option>
                          ))}
                        </select>

                        <div className="flex items-center gap-1 shrink-0">
                          <input
                            id={`simulate-item-qty-${index}`}
                            type="number"
                            min={1}
                            max={prod ? Math.max(1, prod.stock) : 99}
                            value={item.quantity}
                            onChange={e => updateItem(index, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-center text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                          />
                          <span className="text-[11px] text-slate-500 font-medium w-7 truncate">
                            {prod?.unit || 'Pcs'}
                          </span>
                        </div>

                        <button
                          id={`btn-remove-simulate-item-${index}`}
                          type="button"
                          onClick={() => removeItemRow(index)}
                          title="Hapus item ini"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Total & Central Stock Notice */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Estimasi Total Nilai:</span>
                <span className="text-sm font-bold text-teal-700">{formatRupiah(totalOrder)}</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Begitu pesanan disimulasikan, stok inventaris pusat akan langsung dipotong dan transaksi tercatat di riwayat pesanan serta keuangan warung.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                id="btn-cancel-simulate"
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                id="btn-submit-simulate-order"
                type="submit"
                disabled={isSubmitting || selectedItems.length === 0}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 size={14} />
                Proses Pesanan External
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export const SimulateOrderModal: React.FC<SimulateOrderModalProps> = ({
  isOpen,
  onClose,
  defaultChannel = 'Shopee',
}) => {
  if (!isOpen) return null;

  return (
    <SimulateOrderModalContent
      defaultChannel={defaultChannel}
      onClose={onClose}
    />
  );
};
