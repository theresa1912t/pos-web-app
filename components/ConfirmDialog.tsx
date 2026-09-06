'use client';

import React from 'react';
import { Trash2, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'primary' | 'info';
  isAlertOnly?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  type = 'primary',
  isAlertOnly = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-start space-x-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              type === 'danger'
                ? 'bg-rose-100 text-rose-600'
                : type === 'warning'
                ? 'bg-amber-100 text-amber-700'
                : type === 'info'
                ? 'bg-sky-100 text-sky-700'
                : 'bg-teal-100 text-teal-700'
            }`}
          >
            {type === 'danger' && <Trash2 className="w-5 h-5" />}
            {type === 'warning' && <AlertTriangle className="w-5 h-5" />}
            {type === 'info' && <Info className="w-5 h-5" />}
            {type === 'primary' && <CheckCircle2 className="w-5 h-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-900 leading-snug">{title}</h4>
            <div className="text-xs text-slate-600 mt-1.5 leading-relaxed">{description}</div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
          {!isAlertOnly && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer ${
              type === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white'
                : type === 'warning'
                ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white'
                : isAlertOnly
                ? 'bg-slate-800 hover:bg-slate-900 text-white'
                : 'bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white shadow-teal-600/20'
            }`}
          >
            {isAlertOnly ? 'Mengerti' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
