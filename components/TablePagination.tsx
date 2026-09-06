'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TablePaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
  itemName?: string;
  className?: string;
}

export function TablePagination({
  currentPage,
  totalItems,
  itemsPerPage = 20,
  onPageChange,
  itemName = 'data',
  className = '',
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to display (max 5 page buttons)
  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 3) {
      return [1, 2, 3, 4, 5];
    }
    if (currentPage >= totalPages - 2) {
      return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      className={`px-4 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${className}`}
    >
      <span className="text-slate-500 text-[11px] sm:text-xs">
        Menampilkan <strong className="text-slate-700 font-semibold">{startItem}</strong> -{' '}
        <strong className="text-slate-700 font-semibold">{endItem}</strong> dari{' '}
        <strong className="text-slate-700 font-semibold">{totalItems}</strong> {itemName}
      </span>

      {totalPages > 1 && (
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-xs transition-colors"
            title="Halaman Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="hidden sm:flex items-center space-x-1">
            {pageNumbers[0] > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => onPageChange(1)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    currentPage === 1
                      ? 'bg-teal-600 text-white font-bold shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  1
                </button>
                {pageNumbers[0] > 2 && <span className="px-1 text-slate-400">...</span>}
              </>
            )}

            {pageNumbers.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`w-7 h-7 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  currentPage === p
                    ? 'bg-teal-600 text-white font-bold shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            ))}

            {pageNumbers[pageNumbers.length - 1] < totalPages && (
              <>
                {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                  <span className="px-1 text-slate-400">...</span>
                )}
                <button
                  type="button"
                  onClick={() => onPageChange(totalPages)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    currentPage === totalPages
                      ? 'bg-teal-600 text-white font-bold shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>

          <span className="sm:hidden px-2 font-semibold text-slate-700 text-xs">
            Hal {currentPage} / {totalPages}
          </span>

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-xs transition-colors"
            title="Halaman Selanjutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
