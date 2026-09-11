'use client';

import React, { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { StockOpnameTab, StockOpnameTabRef } from '@/components/StockOpnameTab';
import { RackManagementTab } from '@/components/RackManagementTab';
import { filterProducts } from '@/services';
import {
  ClipboardCheck,
  Layers,
  AlertTriangle,
  Package,
  Calendar,
  Plus,
} from 'lucide-react';

export function InventarisView() {
  const {
    products,
    racks,
    stockOpnames,
    stockOpnameSchedules,
    setRestockModalProductId,
  } = useApp();

  // Subtab: 'opname' | 'racks'
  const [subTab, setSubTab] = useState<'opname' | 'racks'>('opname');
  const [opnameView, setOpnameView] = useState<'list' | 'wizard' | 'schedule' | 'detail'>('list');
  const stockOpnameRef = useRef<StockOpnameTabRef>(null);

  // Low stock calculation using domain service
  const lowStockProducts = filterProducts(products, { stockFilter: 'low' });

  return (
    <div className="space-y-6">
      {/* Tab switch row with action buttons aligned on the right (hug content tabs) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Tab switch buttons (hug content) */}
        <div className="inline-flex items-center space-x-1.5 p-1 bg-slate-100 rounded-xl text-xs border border-slate-200/60 shadow-xs w-fit">
          <button
            onClick={() => setSubTab('opname')}
            className={`px-3.5 py-2 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
              subTab === 'opname'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Stock Opname ({stockOpnames.length})</span>
          </button>

          <button
            onClick={() => setSubTab('racks')}
            className={`px-3.5 py-2 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
              subTab === 'racks'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Manajemen Rak ({racks.length})</span>
          </button>
        </div>

        {/* Action Buttons on Right Side aligned with tabs */}
        {subTab === 'opname' && opnameView === 'list' && (
          <div className="flex items-center flex-wrap gap-2 shrink-0 sm:self-auto self-start">
            <button
              type="button"
              onClick={() => stockOpnameRef.current?.openSchedule()}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer bg-white shadow-xs"
            >
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              <span>Jadwal Opname ({stockOpnameSchedules.length})</span>
            </button>

            <button
              type="button"
              onClick={() => stockOpnameRef.current?.startNewOpname()}
              className="flex items-center space-x-1.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm shadow-teal-600/20 active:scale-[0.99] transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Rencanakan Stock Opname Baru</span>
            </button>
          </div>
        )}
      </div>

      {/* Low Stock Notification Banner if any */}
      {lowStockProducts.length > 0 && (
        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">
                {lowStockProducts.length} Produk Mencapai Batas Minimum Stok
              </p>
              <p className="text-[11px] text-amber-700">
                Periksa fisik barang saat Stock Opname atau lakukan restock untuk mencegah kehabisan stok.
              </p>
            </div>
          </div>
          <button
            onClick={() => setRestockModalProductId(lowStockProducts[0].id)}
            className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center space-x-1"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Restock {lowStockProducts[0].name}</span>
          </button>
        </div>
      )}

      {/* Subtab Content */}
      {subTab === 'opname' && (
        <StockOpnameTab ref={stockOpnameRef} onViewChange={setOpnameView} />
      )}
      {subTab === 'racks' && <RackManagementTab />}
    </div>
  );
}
