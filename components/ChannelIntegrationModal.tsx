'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { SalesChannel } from '@/types';
import { getChannelConfig } from '@/components/SalesChannelBadge';
import {
  X,
  Link2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

interface ChannelIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelToConnect: SalesChannel | null;
}

const ChannelIntegrationModalContent: React.FC<{
  channel: SalesChannel;
  onClose: () => void;
}> = ({ channel, onClose }) => {
  const { channelIntegrations, connectChannel, disconnectChannel } = useApp();
  const currentIntegration = channelIntegrations.find(c => c.channel === channel);

  const [storeName, setStoreName] = useState(currentIntegration?.storeName || '');
  const [storeIdentifier, setStoreIdentifier] = useState(currentIntegration?.storeIdentifier || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDisconnect, setShowConfirmDisconnect] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const config = getChannelConfig(channel);
  const ChannelIcon = config.icon;
  const isCurrentlyConnected = currentIntegration?.connectionStatus === 'connected';

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      setErrorMsg('Nama toko di saluran penjualan wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await connectChannel(
        channel,
        storeName.trim(),
        storeIdentifier.trim() || `SELLER-${channel.toUpperCase()}-${Date.now().toString().slice(-4)}`
      );
      if (res.success) {
        setIsSubmitting(false);
        onClose();
      } else {
        setErrorMsg(res.error || 'Gagal menghubungkan saluran.');
        setIsSubmitting(false);
      }
    } catch {
      setErrorMsg('Gagal menghubungkan saluran. Silakan periksa kembali data Anda.');
      setIsSubmitting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await disconnectChannel(channel);
      setIsSubmitting(false);
      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.error || 'Gagal memutus koneksi saluran.');
      }
    } catch {
      setErrorMsg('Gagal memutus koneksi saluran.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="channel-integration-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        id="channel-integration-modal-container"
        className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden text-slate-800"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${config.colorClass}`}>
              <ChannelIcon size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Integrasi Saluran {channel}
              </h2>
              <p className="text-xs text-slate-500">
                Sinkronisasi pesanan & stok inventaris pusat
              </p>
            </div>
          </div>
          <button
            id="btn-close-channel-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Central Inventory Notice */}
          <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-100 text-xs text-slate-600 leading-relaxed space-y-1.5">
            <div className="flex items-center gap-2 text-teal-800 font-semibold">
              <ShieldCheck size={16} className="text-teal-600" />
              <span>Satu Inventaris Terpusat</span>
            </div>
            <p>
              Setiap transaksi yang masuk dari <strong>{channel}</strong> akan memotong kuantitas stok di sistem pusat secara otomatis. Anda tidak perlu memisahkan stok fisik warung dengan online marketplace.
            </p>
          </div>

          <form onSubmit={handleConnect} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Toko di {channel}
              </label>
              <input
                id="input-channel-store-name"
                type="text"
                placeholder={`Contoh: Warung Berkah - ${channel}`}
                value={storeName}
                onChange={e => setStoreName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ID Toko / Seller Identifier
              </label>
              <input
                id="input-channel-store-id"
                type="text"
                placeholder={`Contoh: SELLER-${channel.toUpperCase()}-8829`}
                value={storeIdentifier}
                onChange={e => setStoreIdentifier(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Opsional. ID ini digunakan oleh webhook resmi {channel} untuk verifikasi pesanan.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Status Saat Ini:</span>
                <span className={`font-semibold ${isCurrentlyConnected ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {isCurrentlyConnected ? '● Terhubung & Aktif' : '○ Belum Terhubung'}
                </span>
              </div>
              {currentIntegration?.lastSyncAt && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Sinkronisasi Terakhir:</span>
                  <span className="text-slate-700 font-medium">{new Date(currentIntegration.lastSyncAt).toLocaleString('id-ID')}</span>
                </div>
              )}
            </div>

            {/* Confirmation Box for Disconnect */}
            {showConfirmDisconnect && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2.5">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-rose-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-rose-800 font-medium leading-relaxed">
                    Apakah Anda yakin ingin memutus koneksi saluran <strong>{channel}</strong>? Sinkronisasi stok otomatis dan penarikan pesanan akan dihentikan.
                  </p>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <button
                    id="btn-cancel-disconnect"
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setShowConfirmDisconnect(false)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    id="btn-confirm-disconnect"
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleDisconnect}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    {isSubmitting ? 'Memproses...' : 'Ya, Putus Koneksi'}
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              {isCurrentlyConnected && !showConfirmDisconnect ? (
                <button
                  id="btn-disconnect-channel"
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowConfirmDisconnect(true)}
                  className="px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                >
                  Putus Koneksi
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  id="btn-cancel-channel-modal"
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="btn-submit-channel-connect"
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {isCurrentlyConnected ? (
                    <>
                      <CheckCircle2 size={15} />
                      Simpan Perubahan
                    </>
                  ) : (
                    <>
                      <Link2 size={15} />
                      Hubungkan Saluran
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export const ChannelIntegrationModal: React.FC<ChannelIntegrationModalProps> = ({
  isOpen,
  onClose,
  channelToConnect,
}) => {
  if (!isOpen || !channelToConnect) return null;

  return (
    <ChannelIntegrationModalContent
      key={channelToConnect}
      channel={channelToConnect}
      onClose={onClose}
    />
  );
};
