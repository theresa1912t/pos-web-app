'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  AlertOctagon,
  Boxes,
  BadgePercent,
  RefreshCw,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  Product,
  Promotion,
  StockOpname,
  StockOpnameSchedule,
  ChannelSyncError,
} from '@/types';

export type NotificationActionType = 'restock' | 'stock_opname' | 'channel_sync' | 'promotions';

export interface AppNotification {
  id: string;
  type: 'out_of_stock' | 'low_stock' | 'stock_opname' | 'channel_sync' | 'promo_ending';
  category: 'stock' | 'operations' | 'promo';
  title: string;
  message: string;
  timestamp: string;
  priority: 'critical' | 'warning' | 'info';
  actionLabel?: string;
  actionType?: NotificationActionType;
  productId?: string;
}

const STORAGE_KEY = 'warung_notifications_read_v1';

// Pure calculation helper outside the component
function computeStoreNotifications(params: {
  products: Product[];
  promotions: Promotion[];
  stockOpnames: StockOpname[];
  stockOpnameSchedules: StockOpnameSchedule[];
  channelSyncErrors: ChannelSyncError[];
  activeBranchId: string;
  branchName: string;
  getProductStockInBranch: (productId: string, branchId?: string) => number;
}): AppNotification[] {
  const {
    products,
    promotions,
    stockOpnames,
    stockOpnameSchedules,
    channelSyncErrors,
    activeBranchId,
    branchName,
    getProductStockInBranch,
  } = params;

  const list: AppNotification[] = [];

  // 1. Stock warnings (Out of Stock & Low Stock)
  for (const p of products) {
    if (p.isArchived) continue;
    const currentStock = getProductStockInBranch(p.id, activeBranchId);
    const minStock = p.minStockThreshold ?? 5;

    if (currentStock === 0) {
      list.push({
        id: `stock-zero-${p.id}-${activeBranchId}`,
        type: 'out_of_stock',
        category: 'stock',
        title: 'Stok Habis!',
        message: `"${p.name}" habis (0 ${p.unit}) di ${branchName}. Segera lakukan restock.`,
        timestamp: 'Kritis',
        priority: 'critical',
        actionLabel: 'Restock Barang',
        actionType: 'restock',
        productId: p.id,
      });
    } else if (currentStock <= minStock) {
      list.push({
        id: `stock-low-${p.id}-${activeBranchId}`,
        type: 'low_stock',
        category: 'stock',
        title: 'Stok Menipis',
        message: `"${p.name}" tersisa ${currentStock} ${p.unit} (batas minimum: ${minStock}).`,
        timestamp: 'Peringatan',
        priority: 'warning',
        actionLabel: 'Restock',
        actionType: 'restock',
        productId: p.id,
      });
    }
  }

  // 2. Stock Opname & Audit discrepancies
  for (const opname of stockOpnames) {
    const matchBranch = !activeBranchId || activeBranchId === 'all' || opname.branchId === activeBranchId;
    if (matchBranch && opname.status === 'InProgress') {
      list.push({
        id: `opname-inprogress-${opname.id}`,
        type: 'stock_opname',
        category: 'operations',
        title: 'Stock Opname Berjalan',
        message: `Audit ${opname.opnameNumber} masih berlangsung dan perlu diselesaikan.`,
        timestamp: 'Audit',
        priority: 'info',
        actionLabel: 'Lanjutkan Opname',
        actionType: 'stock_opname',
      });
    } else if (matchBranch && opname.status === 'Completed' && opname.totalDiscrepancyStock !== 0) {
      list.push({
        id: `opname-discrepancy-${opname.id}`,
        type: 'stock_opname',
        category: 'operations',
        title: 'Selisih Fisik Stok Ditemukan',
        message: `${opname.opnameNumber} mencatat selisih ${opname.totalDiscrepancyStock} item fisik saat opname.`,
        timestamp: 'Selisih Stok',
        priority: 'warning',
        actionLabel: 'Lihat Hasil Opname',
        actionType: 'stock_opname',
      });
    }
  }

  // Stock Opname Scheduled for today or overdue
  const todayStr = new Date().toISOString().slice(0, 10);
  for (const sch of stockOpnameSchedules) {
    const matchBranch = !activeBranchId || activeBranchId === 'all' || sch.branchId === activeBranchId;
    if (matchBranch && sch.isActive && sch.scheduledDate <= todayStr) {
      list.push({
        id: `sch-due-${sch.id}-${sch.scheduledDate}`,
        type: 'stock_opname',
        category: 'operations',
        title: 'Jadwal Opname Jatuh Tempo',
        message: `Jadwal audit rutin "${sch.title}" harus dilaksanakan hari ini.`,
        timestamp: 'Jadwal',
        priority: 'info',
        actionLabel: 'Mulai Audit',
        actionType: 'stock_opname',
      });
    }
  }

  // 3. Omnichannel sync errors
  for (const err of channelSyncErrors) {
    if (err.resolved) continue;
    list.push({
      id: `sync-err-${err.id}`,
      type: 'channel_sync',
      category: 'operations',
      title: `Kendala Sinkronisasi ${err.channel}`,
      message: err.errorMessage,
      timestamp: 'Saluran',
      priority: 'warning',
      actionLabel: 'Perbaiki Pemetaan',
      actionType: 'channel_sync',
    });
  }

  // 4. Promotions ending soon
  const now = new Date();
  for (const promo of promotions) {
    if (!promo.isActive) continue;
    const endDate = new Date(promo.endDate + 'T23:59:59');
    const diffHours = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (diffHours >= 0 && diffHours <= 48) {
      list.push({
        id: `promo-end-${promo.id}-${promo.endDate}`,
        type: 'promo_ending',
        category: 'promo',
        title: 'Promosi Akan Berakhir',
        message: `Program "${promo.name}" akan berakhir dalam waktu dekat (${promo.endDate}).`,
        timestamp: 'Promo',
        priority: 'info',
        actionLabel: 'Periksa Promo',
        actionType: 'promotions',
      });
    }
  }

  // Sort order: critical first, then warning, then info
  const priorityWeight: Record<AppNotification['priority'], number> = {
    critical: 3,
    warning: 2,
    info: 1,
  };

  return list.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
}

export function NotificationDropdown() {
  const {
    products,
    promotions,
    stockOpnames,
    stockOpnameSchedules,
    channelSyncErrors,
    activeBranchId,
    activeBranch,
    getProductStockInBranch,
    setRestockModalProductId,
    setActiveTab,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'stock' | 'operations'>('all');
  const [readIds, setReadIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Sync read IDs to local storage
  const markAsRead = (id: string) => {
    setReadIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.error('Failed to save read notifications', err);
      }
      return next;
    });
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadIds((prev) => {
      const merged = Array.from(new Set([...prev, ...allIds]));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch (err) {
        console.error('Failed to save read notifications', err);
      }
      return merged;
    });
  };

  const handleNotificationAction = (notif: AppNotification) => {
    markAsRead(notif.id);
    if (notif.actionType === 'restock' && notif.productId) {
      setRestockModalProductId(notif.productId);
      setIsOpen(false);
    } else if (notif.actionType === 'stock_opname') {
      setActiveTab('stock_opname');
      setIsOpen(false);
    } else if (notif.actionType === 'channel_sync') {
      setActiveTab('integrasi_channel');
      setIsOpen(false);
    } else if (notif.actionType === 'promotions') {
      setActiveTab('promotions');
      setIsOpen(false);
    }
  };

  const branchName = activeBranchId === 'all' ? 'semua cabang' : (activeBranch?.name || 'cabang');

  // Compute notifications
  const notifications = computeStoreNotifications({
    products,
    promotions,
    stockOpnames,
    stockOpnameSchedules,
    channelSyncErrors,
    activeBranchId,
    branchName,
    getProductStockInBranch,
  });

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;
  const hasCritical = notifications.some((n) => n.priority === 'critical' && !readIds.includes(n.id));

  const filteredNotifications = activeFilter === 'all'
    ? notifications
    : activeFilter === 'stock'
    ? notifications.filter((n) => n.category === 'stock')
    : notifications.filter((n) => n.category !== 'stock');

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        id="topbar-notification-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Pemberitahuan & Peringatan Sistem"
        className={`relative p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer ${
          isOpen
            ? 'bg-slate-100 border-slate-300 text-slate-900 shadow-xs'
            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-xs'
        }`}
      >
        <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />

        {/* Unread Badge Counter */}
        {unreadCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center shadow-xs ${
              hasCritical ? 'bg-rose-600 animate-pulse' : 'bg-amber-600'
            }`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Flyout Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-2xl z-40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-900">Pemberitahuan</span>
              {unreadCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-700">
                  {unreadCount} baru
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                  Semua bersih
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] font-medium text-teal-600 hover:text-teal-700 flex items-center space-x-1 cursor-pointer transition-colors"
                title="Tandai semua telah dibaca"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Tandai dibaca</span>
              </button>
            )}
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center px-3 py-1.5 border-b border-slate-100 bg-white gap-1 text-[11px]">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Semua ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('stock')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                activeFilter === 'stock'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Stok ({notifications.filter((n) => n.category === 'stock').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('operations')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                activeFilter === 'operations'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Operasional ({notifications.filter((n) => n.category !== 'stock').length})
            </button>
          </div>

          {/* List of Notifications */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {filteredNotifications.length === 0 ? (
              <div className="p-6 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <Sparkles className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-800">Semua Terkendali!</p>
                <p className="text-[11px] text-slate-500 max-w-[240px] mx-auto leading-relaxed">
                  Tidak ada stok kritis atau peringatan sistem yang memerlukan tindakan saat ini.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isRead = readIds.includes(notif.id);
                return (
                  <div
                    key={notif.id}
                    className={`p-3 transition-colors ${
                      isRead ? 'bg-white opacity-70 hover:opacity-100' : 'bg-slate-50/50 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-start space-x-2.5">
                      {/* Priority Icon */}
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          notif.priority === 'critical'
                            ? 'bg-rose-100 text-rose-600'
                            : notif.priority === 'warning'
                            ? 'bg-amber-100 text-amber-600'
                            : 'bg-teal-100 text-teal-600'
                        }`}
                      >
                        {notif.type === 'out_of_stock' && <AlertOctagon className="w-4 h-4" />}
                        {notif.type === 'low_stock' && <AlertTriangle className="w-4 h-4" />}
                        {notif.type === 'stock_opname' && <Boxes className="w-4 h-4" />}
                        {notif.type === 'channel_sync' && <RefreshCw className="w-4 h-4" />}
                        {notif.type === 'promo_ending' && <BadgePercent className="w-4 h-4" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {notif.title}
                          </p>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                              notif.priority === 'critical'
                                ? 'bg-rose-50 text-rose-700'
                                : notif.priority === 'warning'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {notif.timestamp}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                          {notif.message}
                        </p>

                        {/* Actions */}
                        <div className="mt-2 flex items-center justify-between gap-2">
                          {notif.actionType && (
                            <button
                              type="button"
                              onClick={() => handleNotificationAction(notif)}
                              className="inline-flex items-center space-x-1 text-[11px] font-semibold text-teal-700 hover:text-teal-800 cursor-pointer bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded-md transition-colors"
                            >
                              <span>{notif.actionLabel || 'Lihat Detail'}</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}

                          {!isRead && (
                            <button
                              type="button"
                              onClick={() => markAsRead(notif.id)}
                              className="text-[10px] text-slate-400 hover:text-slate-600 ml-auto cursor-pointer"
                            >
                              Abaikan
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Konteks: {activeBranchId === 'all' ? 'Semua Cabang' : activeBranch?.name || 'Cabang Aktif'}</span>
            <button
              type="button"
              onClick={() => {
                setActiveTab('inventory');
                setIsOpen(false);
              }}
              className="text-teal-600 hover:text-teal-700 font-semibold cursor-pointer"
            >
              Buka Inventaris
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
