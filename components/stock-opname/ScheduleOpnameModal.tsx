import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Category, Rack } from '@/types';

interface ScheduleOpnameModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  racks: Rack[];
  onSaveSchedule: (scheduleData: {
    title: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
    scheduledDate: string;
    scope: 'All' | 'Category' | 'Rack';
    scopeTargetId?: string;
    scopeTargetName?: string;
    isActive: boolean;
  }) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function ScheduleOpnameModal({
  isOpen,
  onClose,
  categories,
  racks,
  onSaveSchedule,
  showToast,
}: ScheduleOpnameModalProps) {
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleFrequency, setScheduleFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('weekly');
  const [scheduleNextDate, setScheduleNextDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [scheduleScope, setScheduleScope] = useState<'All' | 'Category' | 'Rack'>('All');
  const [scheduleScopeTargetId, setScheduleScopeTargetId] = useState('');
  const [scheduleScopeTargetName, setScheduleScopeTargetName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!scheduleTitle.trim()) {
      showToast('Judul jadwal wajib diisi', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveSchedule({
        title: scheduleTitle.trim(),
        frequency: scheduleFrequency,
        scheduledDate: scheduleNextDate,
        scope: scheduleScope,
        scopeTargetId: scheduleScopeTargetId || undefined,
        scopeTargetName: scheduleScopeTargetName || undefined,
        isActive: true,
      });
      setScheduleTitle('');
      setScheduleScope('All');
      setScheduleScopeTargetId('');
      setScheduleScopeTargetName('');
      onClose();
      showToast('Jadwal opname berhasil ditambahkan!');
    } catch (err: any) {
      showToast(err?.message || 'Gagal menyimpan jadwal', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-sm text-slate-900">Tambah Jadwal Stock Opname</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Judul / Agenda Jadwal *</label>
            <input
              type="text"
              placeholder="Contoh: Audit Stok Minuman Akhir Pekan"
              value={scheduleTitle}
              onChange={(e) => setScheduleTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Frekuensi</label>
              <select
                value={scheduleFrequency}
                onChange={(e) => setScheduleFrequency(e.target.value as 'daily' | 'weekly' | 'monthly' | 'custom')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
              >
                <option value="weekly">Mingguan</option>
                <option value="monthly">Bulanan</option>
                <option value="daily">Harian</option>
                <option value="custom">Kustom</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tanggal Mulai</label>
              <input
                type="date"
                value={scheduleNextDate}
                onChange={(e) => setScheduleNextDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Cakupan Ruang Lingkup</label>
            <select
              value={scheduleScope}
              onChange={(e) => {
                const newScope = e.target.value as 'All' | 'Category' | 'Rack';
                setScheduleScope(newScope);
                if (newScope === 'Category' && categories.length > 0) {
                  setScheduleScopeTargetId(categories[0].name);
                  setScheduleScopeTargetName(categories[0].name);
                } else if (newScope === 'Rack' && racks.length > 0) {
                  setScheduleScopeTargetId(racks[0].id);
                  setScheduleScopeTargetName(`${racks[0].code} - ${racks[0].name}`);
                } else {
                  setScheduleScopeTargetId('');
                  setScheduleScopeTargetName('');
                }
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
            >
              <option value="All">Semua Produk</option>
              <option value="Category">Per Kategori</option>
              <option value="Rack">Per Rak</option>
            </select>
          </div>

          {scheduleScope === 'Category' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Kategori</label>
              <select
                value={scheduleScopeTargetId}
                onChange={(e) => {
                  setScheduleScopeTargetId(e.target.value);
                  setScheduleScopeTargetName(e.target.value);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {scheduleScope === 'Rack' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Rak</label>
              <select
                value={scheduleScopeTargetId}
                onChange={(e) => {
                  const r = racks.find((rk) => rk.id === e.target.value);
                  setScheduleScopeTargetId(e.target.value);
                  setScheduleScopeTargetName(r ? `${r.code} - ${r.name}` : e.target.value);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
              >
                {racks.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.code} - {r.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSave}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan Jadwal'}
          </button>
        </div>
      </div>
    </div>
  );
}
