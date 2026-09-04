'use client';

import React from 'react';
import { DateFilterType, DateRange } from '@/types';
import { Calendar, ChevronDown } from 'lucide-react';

interface DateRangeDropdownProps {
  value: DateFilterType | 'all';
  onChange: (value: DateFilterType | 'all') => void;
  customRange?: DateRange;
  onCustomRangeChange?: (range: DateRange) => void;
  includeAllOption?: boolean;
  className?: string;
  showDateSubtitle?: boolean;
}

export function getDateRangeSummary(
  filterType: DateFilterType | 'all',
  customRange?: DateRange
): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const yearOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };

  switch (filterType) {
    case 'today':
      return now.toLocaleDateString('id-ID', yearOptions);

    case 'yesterday': {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      return yesterday.toLocaleDateString('id-ID', yearOptions);
    }

    case '7days': {
      const start = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      return `${start.toLocaleDateString('id-ID', options)} - ${now.toLocaleDateString('id-ID', yearOptions)}`;
    }

    case '14days': {
      const start = new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000);
      return `${start.toLocaleDateString('id-ID', options)} - ${now.toLocaleDateString('id-ID', yearOptions)}`;
    }

    case '30days': {
      const start = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
      return `${start.toLocaleDateString('id-ID', options)} - ${now.toLocaleDateString('id-ID', yearOptions)}`;
    }

    case 'this_month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return `${start.toLocaleDateString('id-ID', options)} - ${now.toLocaleDateString('id-ID', yearOptions)}`;
    }

    case 'custom': {
      if (!customRange?.startDate || !customRange?.endDate) return 'Pilih Rentang';
      const start = new Date(customRange.startDate);
      const end = new Date(customRange.endDate);
      return `${start.toLocaleDateString('id-ID', options)} - ${end.toLocaleDateString('id-ID', yearOptions)}`;
    }

    case 'all':
      return 'Semua Catatan Waktu';

    default:
      return '';
  }
}

export function DateRangeDropdown({
  value,
  onChange,
  customRange,
  onCustomRangeChange,
  includeAllOption = false,
  className = '',
  showDateSubtitle = true,
}: DateRangeDropdownProps) {
  const summary = getDateRangeSummary(value, customRange);

  return (
    <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-2 ${className}`}>
      {/* Dropdown Container */}
      <div className="relative inline-flex items-center">
        <div className="flex items-center space-x-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 shadow-xs transition-all focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20">
          <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
          <select
            value={value}
            onChange={(e) => onChange(e.target.value as DateFilterType | 'all')}
            className="appearance-none bg-transparent pr-7 py-0.5 text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            aria-label="Filter Rentang Waktu"
          >
            <option value="30days">30 Hari Terakhir</option>
            <option value="7days">7 Hari Terakhir</option>
            <option value="14days">14 Hari Terakhir</option>
            <option value="today">Hari Ini</option>
            <option value="yesterday">Kemarin</option>
            <option value="this_month">Bulan Ini</option>
            {includeAllOption && <option value="all">Semua Waktu</option>}
            <option value="custom">Rentang Kustom...</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-3" />
        </div>
      </div>

      {/* Date Span Subtitle Badge (Except for 'custom' which shows date inputs) */}
      {showDateSubtitle && value !== 'custom' && summary && (
        <span className="hidden sm:inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[11px] font-medium whitespace-nowrap">
          {summary}
        </span>
      )}

      {/* Inline Date Pickers when 'custom' is active */}
      {value === 'custom' && onCustomRangeChange && (
        <div className="flex items-center flex-wrap gap-2 text-xs bg-slate-50 border border-slate-200 p-1.5 rounded-xl animate-in fade-in duration-200">
          <div className="flex items-center space-x-1.5 pl-1">
            <span className="text-[11px] font-medium text-slate-500">Dari:</span>
            <input
              type="date"
              value={customRange?.startDate || ''}
              onChange={(e) =>
                onCustomRangeChange({
                  startDate: e.target.value,
                  endDate: customRange?.endDate || new Date().toISOString().slice(0, 10),
                })
              }
              className="bg-white border border-slate-200 px-2 py-1 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-teal-500"
            />
          </div>
          <span className="text-slate-400 font-medium">-</span>
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] font-medium text-slate-500">Sampai:</span>
            <input
              type="date"
              value={customRange?.endDate || ''}
              onChange={(e) =>
                onCustomRangeChange({
                  startDate: customRange?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
                  endDate: e.target.value,
                })
              }
              className="bg-white border border-slate-200 px-2 py-1 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}
