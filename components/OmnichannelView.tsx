'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { SalesChannel, ChannelIntegration, ProductChannelMapping, ChannelSyncError } from '@/types';
import { getChannelConfig, SalesChannelBadge } from '@/components/SalesChannelBadge';
import { ChannelIntegrationModal } from '@/components/ChannelIntegrationModal';
import { ProductMappingModal } from '@/components/ProductMappingModal';
import { SimulateOrderModal } from '@/components/SimulateOrderModal';
import { AddProductMappingModal } from '@/components/AddProductMappingModal';
import { formatRupiah } from '@/lib/utils';
import {
  Globe,
  RefreshCw,
  Link2,
  Unlink,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Search,
  Plus,
  ArrowRight,
  ShieldCheck,
  Check,
  AlertCircle,
  ExternalLink,
  Store,
  Sparkles,
  Trash2,
} from 'lucide-react';

export const OmnichannelView: React.FC = () => {
  const {
    channelIntegrations,
    productMappings,
    channelSyncErrors,
    products,
    syncChannelOrders,
    syncAllChannels,
    toggleAutoSync,
    unmapProductFromChannel,
    deleteProductMapping,
    resolveSyncError,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'channels' | 'mappings' | 'errors'>('channels');
  const [selectedChannelCategory, setSelectedChannelCategory] = useState<'All' | 'Marketplace' | 'Food Delivery' | 'Offline'>('All');
  const [searchMappingQuery, setSearchMappingQuery] = useState('');
  const [mappingStatusFilter, setMappingStatusFilter] = useState<'all' | 'mapped' | 'unmapped'>('all');
  const [mappingChannelFilter, setMappingChannelFilter] = useState<string>('all');

  // Modals
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [channelToConnect, setChannelToConnect] = useState<SalesChannel | null>(null);
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState<ProductChannelMapping | null>(null);
  const [isAddMappingOpen, setIsAddMappingOpen] = useState(false);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [simulateChannel, setSimulateChannel] = useState<SalesChannel>('Shopee');

  // Sync state
  const [syncingChannel, setSyncingChannel] = useState<string | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const handleSyncChannel = async (channel: SalesChannel) => {
    setSyncingChannel(channel);
    setSyncFeedback(null);
    try {
      const res = await syncChannelOrders(channel);
      setSyncFeedback({
        message: res.message,
        type: res.errorCount > 0 ? 'info' : 'success',
      });
    } catch {
      setSyncFeedback({
        message: `Terjadi kendala saat menyinkronkan saluran ${channel}.`,
        type: 'error',
      });
    } finally {
      setSyncingChannel(null);
    }
  };

  const handleSyncAll = async () => {
    setSyncingChannel('all');
    setSyncFeedback(null);
    try {
      const res = await syncAllChannels();
      setSyncFeedback({
        message: `Sinkronisasi semua saluran selesai. Total ${res.totalSynced} pesanan baru diselaraskan ke stok pusat.`,
        type: 'success',
      });
    } catch {
      setSyncFeedback({
        message: 'Gagal melakukan sinkronisasi massal.',
        type: 'error',
      });
    } finally {
      setSyncingChannel(null);
    }
  };

  const openConnect = (channel: SalesChannel) => {
    setChannelToConnect(channel);
    setIsConnectModalOpen(true);
  };

  const openMapping = (mapping: ProductChannelMapping) => {
    setSelectedMapping(mapping);
    setIsMappingModalOpen(true);
  };

  const openSimulate = (channel: SalesChannel) => {
    setSimulateChannel(channel);
    setIsSimulateModalOpen(true);
  };

  // Filtered Integrations
  const filteredIntegrations = channelIntegrations.filter(c => {
    if (selectedChannelCategory === 'All') return true;
    return c.category === selectedChannelCategory;
  });

  // Filtered Mappings
  const filteredMappings = productMappings.filter(m => {
    if (mappingChannelFilter !== 'all' && m.channel !== mappingChannelFilter) return false;
    if (mappingStatusFilter !== 'all' && m.mappingStatus !== mappingStatusFilter) return false;
    if (searchMappingQuery.trim()) {
      const q = searchMappingQuery.toLowerCase();
      const matchSku = m.externalSku?.toLowerCase().includes(q);
      const matchName = m.externalProductName?.toLowerCase().includes(q);
      const matchedProd = m.productId ? products.find(p => p.id === m.productId) : null;
      const matchInternalName = matchedProd?.name?.toLowerCase().includes(q);
      if (!matchSku && !matchName && !matchInternalName) return false;
    }
    return true;
  });

  const unresolvedErrors = channelSyncErrors.filter(e => !e.resolved);

  return (
    <div id="omnichannel-view-container" className="space-y-6">
      {/* Top Header & Overview */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-100 text-teal-600">
              <Globe size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Integrasi Saluran Penjualan (Omnichannel)
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Sinkronisasi pesanan dari Shopee, Tokopedia, TikTok Shop, GoFood, GrabFood & Kasir Offline ke 1 inventaris pusat.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            id="btn-simulate-incoming-order"
            onClick={() => setIsSimulateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-xs transition-colors"
          >
            <Sparkles size={15} className="text-teal-600" />
            Simulasi Pesanan Masuk
          </button>

          <button
            id="btn-sync-all-channels"
            disabled={syncingChannel !== null}
            onClick={handleSyncAll}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={syncingChannel === 'all' ? 'animate-spin' : ''} />
            Sinkronkan Semua Saluran
          </button>
        </div>
      </div>

      {/* Sync feedback banner */}
      {syncFeedback && (
        <div
          id="sync-feedback-banner"
          className={`flex items-start justify-between p-4 rounded-xl border text-xs leading-relaxed ${
            syncFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : syncFeedback.type === 'info'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {syncFeedback.type === 'success' ? (
              <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle size={18} className="shrink-0 text-amber-600" />
            )}
            <span className="font-medium">{syncFeedback.message}</span>
          </div>
          <button
            onClick={() => setSyncFeedback(null)}
            className="text-xs font-medium underline opacity-80 hover:opacity-100 ml-4 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Primary Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
          <span className="text-xs font-medium text-slate-500">Saluran Terhubung</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {channelIntegrations.filter(c => c.connectionStatus === 'connected').length}
            </span>
            <span className="text-xs text-slate-500">/ {channelIntegrations.length} total</span>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
          <span className="text-xs font-medium text-slate-500">Produk Terpetakan</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-teal-600">
              {productMappings.filter(m => m.mappingStatus === 'mapped').length}
            </span>
            <span className="text-xs text-slate-500">item tersambung</span>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
          <span className="text-xs font-medium text-slate-500">Perlu Pemetaan (Unmapped)</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600">
              {productMappings.filter(m => m.mappingStatus === 'unmapped').length}
            </span>
            <span className="text-xs text-slate-500">item belum ada di warung</span>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
          <span className="text-xs font-medium text-slate-500">Kendala Sinkronisasi</span>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${unresolvedErrors.length > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
              {unresolvedErrors.length}
            </span>
            <span className="text-xs text-slate-500">kasus belum selesai</span>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            id="tab-view-channels"
            onClick={() => setActiveTab('channels')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'channels'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Globe size={16} />
            Daftar Saluran Penjualan ({channelIntegrations.length})
          </button>

          <button
            id="tab-view-mappings"
            onClick={() => setActiveTab('mappings')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'mappings'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers size={16} />
            Pemetaan Produk SKU ({productMappings.length})
          </button>

          <button
            id="tab-view-errors"
            onClick={() => setActiveTab('errors')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors relative cursor-pointer ${
              activeTab === 'errors'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertTriangle size={16} />
            Log & Error Sinkronisasi
            {unresolvedErrors.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                {unresolvedErrors.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: CHANNELS LIST */}
      {activeTab === 'channels' && (
        <div className="space-y-4">
          {/* Channel category filter pills */}
          <div className="flex items-center gap-2">
            {(['All', 'Marketplace', 'Food Delivery', 'Offline'] as const).map(cat => (
              <button
                key={cat}
                id={`btn-filter-cat-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setSelectedChannelCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  selectedChannelCategory === cat
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {cat === 'All' ? 'Semua Kategori' : cat}
              </button>
            ))}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIntegrations.map(integ => {
              const cfg = getChannelConfig(integ.channel);
              const Icon = cfg.icon;
              const isConnected = integ.connectionStatus === 'connected';
              const isSyncingThis = syncingChannel === integ.channel;

              return (
                <div
                  key={integ.id}
                  id={`card-channel-${integ.channel.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col justify-between space-y-4 hover:border-teal-300 transition-all"
                >
                  <div className="space-y-3">
                    {/* Card Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl border ${cfg.colorClass}`}>
                          <Icon size={22} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-800">{integ.channel}</h3>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                              {integ.category}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {integ.storeName || (isConnected ? 'Toko Terhubung' : 'Belum Terhubung')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-md border ${
                            isConnected
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: isConnected ? cfg.dotColor : '#94a3b8' }}
                          />
                          {isConnected ? 'Terhubung' : 'Terputus'}
                        </span>
                      </div>
                    </div>

                    {/* Stats strip */}
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-[11px] text-slate-400 block">Pesanan Tersinkron</span>
                        <span className="font-semibold text-slate-800">{integ.syncOrdersCount} pesanan</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block">Status Terakhir</span>
                        <span className="text-slate-600 font-medium">
                          {integ.lastSyncAt
                            ? new Date(integ.lastSyncAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                            : '-'}
                        </span>
                      </div>
                    </div>

                    {integ.storeIdentifier && (
                      <div className="text-[11px] font-mono text-slate-500 truncate bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                        ID: {integ.storeIdentifier}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {isConnected ? (
                      <>
                        <button
                          id={`btn-sync-${integ.channel.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                          disabled={isSyncingThis}
                          onClick={() => handleSyncChannel(integ.channel)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium shadow-xs transition-colors cursor-pointer"
                        >
                          <RefreshCw size={13} className={isSyncingThis ? 'animate-spin' : ''} />
                          {isSyncingThis ? 'Menyelaraskan...' : 'Sinkronkan'}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            id={`btn-simulate-${integ.channel.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                            onClick={() => openSimulate(integ.channel)}
                            title="Simulasi Pesanan External"
                            className="px-2.5 py-1.5 text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-colors text-xs font-medium cursor-pointer"
                          >
                            + Pesanan
                          </button>
                          <button
                            id={`btn-config-${integ.channel.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                            onClick={() => openConnect(integ.channel)}
                            className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors font-medium cursor-pointer"
                          >
                            Atur
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        id={`btn-connect-${integ.channel.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                        onClick={() => openConnect(integ.channel)}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        <Link2 size={14} />
                        Hubungkan {integ.channel}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCT MAPPINGS */}
      {activeTab === 'mappings' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Channel Filter */}
              <select
                id="select-mapping-channel-filter"
                value={mappingChannelFilter}
                onChange={e => setMappingChannelFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              >
                <option value="all">Semua Saluran</option>
                <option value="Shopee">Shopee</option>
                <option value="Tokopedia">Tokopedia</option>
                <option value="TikTok Shop">TikTok Shop</option>
                <option value="GoFood">GoFood</option>
                <option value="GrabFood">GrabFood</option>
                <option value="ShopeeFood">ShopeeFood</option>
                <option value="Other">Saluran Lainnya</option>
              </select>

              {/* Status Filter */}
              <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-0.5 text-xs">
                <button
                  onClick={() => setMappingStatusFilter('all')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    mappingStatusFilter === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Semua ({productMappings.length})
                </button>
                <button
                  onClick={() => setMappingStatusFilter('mapped')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    mappingStatusFilter === 'mapped' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Sudah Dipetakan ({productMappings.filter(m => m.mappingStatus === 'mapped').length})
                </button>
                <button
                  onClick={() => setMappingStatusFilter('unmapped')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    mappingStatusFilter === 'unmapped' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Belum Dipetakan ({productMappings.filter(m => m.mappingStatus === 'unmapped').length})
                </button>
              </div>
            </div>

            {/* Search & Add Action */}
            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="input-search-mappings"
                  type="text"
                  placeholder="Cari SKU atau nama produk..."
                  value={searchMappingQuery}
                  onChange={e => setSearchMappingQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
              <button
                id="btn-add-sku-mapping"
                onClick={() => setIsAddMappingOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <Plus size={14} />
                Tambah Item Saluran
              </button>
            </div>
          </div>

          {/* Mappings Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider text-[11px] font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Saluran</th>
                    <th className="py-3.5 px-4">Produk di Marketplace</th>
                    <th className="py-3.5 px-4">SKU External</th>
                    <th className="py-3.5 px-4">Harga Saluran</th>
                    <th className="py-3.5 px-4">Dipetakan ke Produk Warung</th>
                    <th className="py-3.5 px-4">Status Pemetaan</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredMappings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                        Tidak ada data pemetaan produk yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredMappings.map(m => {
                      const matchedProd = m.productId ? products.find(p => p.id === m.productId) : null;
                      const isMapped = m.mappingStatus === 'mapped' && matchedProd;

                      return (
                        <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <SalesChannelBadge channel={m.channel} size="sm" />
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800">
                            {m.externalProductName}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-500">
                            {m.externalSku}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-teal-700 font-semibold">
                            {m.channelPrice ? formatRupiah(m.channelPrice) : '-'}
                          </td>
                          <td className="py-3.5 px-4">
                            {isMapped ? (
                              <div className="space-y-0.5">
                                <span className="font-semibold text-slate-800">{matchedProd.name}</span>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                  <span>Stok: {matchedProd.stock} {matchedProd.unit}</span>
                                  <span>•</span>
                                  <span>COGS: {formatRupiah(matchedProd.cogs)}</span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Belum terhubung ke produk pusat</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-md border font-medium ${
                                isMapped
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {isMapped ? (
                                <>
                                  <Check size={13} />
                                  Terpetakan
                                </>
                              ) : (
                                <>
                                  <AlertCircle size={13} />
                                  Belum Dipetakan
                                </>
                              )}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isMapped ? (
                                <>
                                  <button
                                    id={`btn-edit-map-${m.id}`}
                                    onClick={() => openMapping(m)}
                                    className="px-2.5 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                                  >
                                    Ubah
                                  </button>
                                  <button
                                    id={`btn-unmap-${m.id}`}
                                    onClick={() => unmapProductFromChannel(m.id)}
                                    className="px-2 py-1 text-xs font-medium text-slate-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                  >
                                    Lepas
                                  </button>
                                </>
                              ) : (
                                <button
                                  id={`btn-map-now-${m.id}`}
                                  onClick={() => openMapping(m)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
                                >
                                  <Link2 size={13} />
                                  Petakan Sekarang
                                </button>
                              )}
                              <button
                                id={`btn-delete-map-${m.id}`}
                                onClick={() => deleteProductMapping(m.id)}
                                title="Hapus Item Pemetaan"
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ERRORS & LOGS */}
      {activeTab === 'errors' && (
        <div className="space-y-4">
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-slate-800">Log Penyelarasan & Masalah Sinkronisasi</h3>
              <p className="text-xs text-slate-500">
                Transaksi external yang gagal diproses otomatis karena produk belum terpetakan ke inventaris pusat.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {channelSyncErrors.length === 0 ? (
              <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-xs text-xs text-slate-500 space-y-2">
                <CheckCircle2 size={36} className="mx-auto text-emerald-600" />
                <p className="text-sm text-slate-800 font-bold">Semua sinkronisasi berjalan lancar</p>
                <p>Tidak ada kesalahan pemetaan atau kegagalan webhook yang tercatat.</p>
              </div>
            ) : (
              channelSyncErrors.map(err => {
                return (
                  <div
                    key={err.id}
                    id={`err-card-${err.id}`}
                    className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                      err.resolved
                        ? 'bg-slate-50 border-slate-200 opacity-60'
                        : 'bg-rose-50/50 border-rose-200'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <SalesChannelBadge channel={err.channel} size="sm" />
                        {err.externalOrderId && (
                          <span className="text-xs font-mono text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                            Order ID: {err.externalOrderId}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400">
                          {new Date(err.createdAt || err.timestamp || new Date().toISOString()).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 font-medium">
                        {err.errorMessage}
                      </p>
                      {err.externalSku && (
                        <span className="text-[11px] text-slate-500 font-mono">
                          SKU Bermasalah: {err.externalSku}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {err.resolved ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                          <CheckCircle2 size={15} />
                          Terselesaikan
                        </span>
                      ) : (
                        <>
                          <button
                            id={`btn-resolve-err-${err.id}`}
                            onClick={() => resolveSyncError(err.id)}
                            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
                          >
                            Tandai Selesai
                          </button>
                          <button
                            id={`btn-fix-map-${err.id}`}
                            onClick={() => {
                              const existingMap = productMappings.find(
                                m => m.channel === err.channel && m.externalSku === err.externalSku
                              );
                              if (existingMap) {
                                openMapping(existingMap);
                              } else {
                                setActiveTab('mappings');
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                          >
                            <Link2 size={13} />
                            Petakan Produk
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <ChannelIntegrationModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        channelToConnect={channelToConnect}
      />

      <ProductMappingModal
        isOpen={isMappingModalOpen}
        onClose={() => setIsMappingModalOpen(false)}
        mapping={selectedMapping}
      />

      <SimulateOrderModal
        isOpen={isSimulateModalOpen}
        onClose={() => setIsSimulateModalOpen(false)}
        defaultChannel={simulateChannel}
      />

      <AddProductMappingModal
        isOpen={isAddMappingOpen}
        onClose={() => setIsAddMappingOpen(false)}
      />
    </div>
  );
};
