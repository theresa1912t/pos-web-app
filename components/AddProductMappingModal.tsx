'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { SalesChannel } from '@/types';
import { getChannelConfig } from '@/components/SalesChannelBadge';
import { X, Plus, AlertCircle, Link2 } from 'lucide-react';

interface AddProductMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultChannel?: SalesChannel;
}

function generateChannelSku(channel: string): string {
  return `SKU-${channel.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-5)}`;
}

const AddProductMappingModalContent: React.FC<{
  onClose: () => void;
  defaultChannel: SalesChannel;
}> = ({ onClose, defaultChannel }) => {
  const { products, addProductMapping } = useApp();

  const [channel, setChannel] = useState<SalesChannel>(defaultChannel);
  const [externalProductName, setExternalProductName] = useState('');
  const [externalSku, setExternalSku] = useState('');
  const [channelPrice, setChannelPrice] = useState<number | ''>('');
  const [shouldMapNow, setShouldMapNow] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string>(
    () => (products.length > 0 ? products[0].id : '')
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const config = getChannelConfig(channel);
  const ChannelIcon = config.icon;
  const availableProducts = products.filter(p => !p.isArchived);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!externalProductName.trim()) {
      setErrorMsg('Nama produk di marketplace/saluran wajib diisi.');
      return;
    }

    const finalSku = externalSku.trim() || generateChannelSku(channel);
    const matchedProduct = shouldMapNow && selectedProductId ? availableProducts.find(p => p.id === selectedProductId) : null;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const extProdId = `EXT-${channel.substring(0, 3).toUpperCase()}-${finalSku.replace(/[^a-zA-Z0-9]/g, '').slice(-6)}`;
      await addProductMapping({
        channel,
        externalProductId: extProdId,
        externalProductName: externalProductName.trim(),
        externalSku: finalSku,
        channelPrice: Number(channelPrice) || (matchedProduct ? matchedProduct.sellingPrice : 0),
        productId: matchedProduct?.id,
        productName: matchedProduct?.name,
        mappingStatus: matchedProduct ? 'mapped' : 'unmapped',
      });

      setIsSubmitting(false);
      onClose();
    } catch {
      setErrorMsg('Gagal menambahkan pemetaan produk saluran.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="add-mapping-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        id="add-mapping-modal-container"
        className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden text-slate-800"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${config.colorClass}`}>
              <ChannelIcon size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Tambah Item Saluran (Pemetaan SKU)
              </h2>
              <p className="text-xs text-slate-500">
                Daftarkan produk dari marketplace ke database sinkronisasi stok
              </p>
            </div>
          </div>
          <button
            id="btn-close-add-mapping-modal"
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Saluran Penjualan
                </label>
                <select
                  id="select-add-mapping-channel"
                  value={channel}
                  onChange={e => setChannel(e.target.value as SalesChannel)}
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
                  Harga Jual di Saluran (Rp)
                </label>
                <input
                  id="input-add-mapping-price"
                  type="number"
                  placeholder="Contoh: 25000"
                  value={channelPrice}
                  onChange={e => setChannelPrice(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Produk di Marketplace / Saluran <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-add-mapping-product-name"
                type="text"
                required
                placeholder="Contoh: Indomie Goreng Spesial 85gr (Shopee Mall)"
                value={externalProductName}
                onChange={e => setExternalProductName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                SKU External di Marketplace
              </label>
              <input
                id="input-add-mapping-sku"
                type="text"
                placeholder="Kosongkan untuk buat SKU otomatis (opsional)"
                value={externalSku}
                onChange={e => setExternalSku(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            {/* Mapping Selection */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Link2 size={14} className="text-teal-600" />
                  Hubungkan Langsung ke Produk Warung
                </span>
                <input
                  id="checkbox-add-mapping-link"
                  type="checkbox"
                  checked={shouldMapNow}
                  onChange={e => setShouldMapNow(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
                />
              </div>

              {shouldMapNow && (
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Pilih Produk Inventaris Pusat:
                  </label>
                  {availableProducts.length === 0 ? (
                    <p className="text-xs text-amber-700 italic">
                      Belum ada produk aktif di warung. Produk akan disimpan sebagai belum terpetakan.
                    </p>
                  ) : (
                    <select
                      id="select-add-mapping-product"
                      value={selectedProductId}
                      onChange={e => setSelectedProductId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    >
                      {availableProducts.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stok: {p.stock} {p.unit}) - SKU: {p.sku || '-'}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                id="btn-cancel-add-mapping"
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                id="btn-submit-add-mapping"
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                {isSubmitting ? 'Menyimpan...' : 'Simpan Pemetaan Item'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export const AddProductMappingModal: React.FC<AddProductMappingModalProps> = ({
  isOpen,
  onClose,
  defaultChannel = 'Shopee',
}) => {
  if (!isOpen) return null;

  return (
    <AddProductMappingModalContent
      onClose={onClose}
      defaultChannel={defaultChannel}
    />
  );
};
