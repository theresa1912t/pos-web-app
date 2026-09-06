'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Rack, Product } from '@/types';
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  MapPin,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
  ArrowRight,
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ConfirmDialog';

export function RackManagementTab() {
  const { racks, products, addRack, updateRack, deleteRack } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRack, setEditingRack] = useState<Rack | null>(null);
  const [selectedRackForProducts, setSelectedRackForProducts] = useState<Rack | null>(null);
  const [confirmDeleteRack, setConfirmDeleteRack] = useState<Rack | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [locationDescription, setLocationDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered racks
  const filteredRacks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return racks.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        (r.locationDescription && r.locationDescription.toLowerCase().includes(q))
    );
  }, [racks, searchQuery]);

  // Product counts per rack
  const rackProductsMap = useMemo(() => {
    const map = new Map<string, Product[]>();
    racks.forEach((r) => map.set(r.id, []));
    products.forEach((p) => {
      if (p.rackId && map.has(p.rackId)) {
        map.get(p.rackId)!.push(p);
      }
    });
    return map;
  }, [racks, products]);

  const handleOpenCreate = () => {
    setEditingRack(null);
    setCode(`RAK-${String.fromCharCode(65 + (racks.length % 26))}${Math.floor(racks.length / 26) + 1}`);
    setName('');
    setLocationDescription('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rack: Rack) => {
    setEditingRack(rack);
    setCode(rack.code);
    setName(rack.name);
    setLocationDescription(rack.locationDescription || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setFormError('Kode rak dan nama rak wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingRack) {
        await updateRack(editingRack.id, {
          name: name.trim(),
          code: code.trim(),
          locationDescription: locationDescription.trim() || undefined,
        });
        showToast(`Data rak ${code.toUpperCase()} berhasil diperbarui!`);
      } else {
        await addRack({
          name: name.trim(),
          code: code.trim(),
          locationDescription: locationDescription.trim() || undefined,
        });
        showToast(`Rak ${code.toUpperCase()} berhasil ditambahkan!`);
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      const e = err as Error;
      setFormError(e.message || 'Gagal menyimpan data rak.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (rack: Rack) => {
    setConfirmDeleteRack(rack);
  };

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-teal-600 text-white text-xs font-semibold rounded-xl shadow-xl flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Control & Search Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2.5 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode rak, nama, atau posisi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center space-x-1.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm shadow-teal-600/20 active:scale-[0.99] transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Rak Baru</span>
        </button>
      </div>

      {/* Grid of Racks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRacks.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white border border-slate-200 rounded-2xl p-6 space-y-2">
            <Layers className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-semibold text-slate-700">Belum ada rak ditemukan</p>
            <p className="text-[11px] text-slate-500">
              Tambahkan rak untuk mempermudah pencarian lokasi fisik barang dan mempermudah proses stock opname.
            </p>
          </div>
        ) : (
          filteredRacks.map((rack) => {
            const rackProducts = rackProductsMap.get(rack.id) || [];
            const totalStockOnRack = rackProducts.reduce((sum, p) => sum + (p.stock || 0), 0);

            return (
              <div
                key={rack.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-teal-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top: Code Badge & Actions */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 font-mono font-bold text-xs">
                        {rack.code}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => setSelectedRackForProducts(rack)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                        title="Lihat Produk di Rak Ini"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(rack)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Edit Rak"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(rack)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Hapus Rak"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="mt-2.5 space-y-1">
                    <h4 className="text-sm font-bold text-slate-900">{rack.name}</h4>
                    {rack.locationDescription ? (
                      <p className="text-[11px] text-slate-500 flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{rack.locationDescription}</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">Posisi fisik belum ditentukan</p>
                    )}
                  </div>
                </div>

                {/* Footer Stats */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-600">
                    <Package className="w-3.5 h-3.5 text-teal-600" />
                    <span>
                      <strong className="text-slate-900">{rackProducts.length}</strong> jenis item ({totalStockOnRack} pcs)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedRackForProducts(rack)}
                    className="text-[11px] font-semibold text-teal-700 hover:text-teal-800 flex items-center space-x-0.5 cursor-pointer"
                  >
                    <span>Detail</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: ADD / EDIT RACK */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  {editingRack ? 'Edit Lokasi Rak' : 'Tambah Rak Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Kode Rak <span className="text-teal-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: RAK-A1, RAK-SNACK-01"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nama / Kategori Rak <span className="text-teal-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Rak Makanan Ringan, Rak Minuman Dingin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Deskripsi Posisi / Lokasi Fisik <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Lorong depan dekat pintu masuk, baris tengah tingkat 2"
                  value={locationDescription}
                  onChange={(e) => setLocationDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Rak'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW PRODUCTS ON RACK */}
      {selectedRackForProducts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-mono font-bold text-xs">
                  {selectedRackForProducts.code}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{selectedRackForProducts.name}</h3>
                  <p className="text-[11px] text-slate-500">
                    {selectedRackForProducts.locationDescription || 'Daftar produk yang diletakkan pada rak ini'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRackForProducts(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {(rackProductsMap.get(selectedRackForProducts.id) || []).length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Belum ada produk yang dialokasikan ke rak ini.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Nama Produk</th>
                      <th className="p-2.5">Kategori</th>
                      <th className="p-2.5 text-right">Harga Jual</th>
                      <th className="p-2.5 text-right">Stok Fisik</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(rackProductsMap.get(selectedRackForProducts.id) || []).map((prod) => (
                      <tr key={prod.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-semibold text-slate-800">{prod.name}</td>
                        <td className="p-2.5 text-slate-500">{prod.category}</td>
                        <td className="p-2.5 text-right text-teal-700 font-semibold">{formatRupiah(prod.sellingPrice)}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">{prod.stock} {prod.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRackForProducts(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Rack Dialog */}
      <ConfirmDialog
        isOpen={Boolean(confirmDeleteRack)}
        onClose={() => setConfirmDeleteRack(null)}
        onConfirm={async () => {
          if (confirmDeleteRack) {
            await deleteRack(confirmDeleteRack.id);
            showToast(`Rak ${confirmDeleteRack.code} berhasil dihapus.`);
            setConfirmDeleteRack(null);
          }
        }}
        type="danger"
        title={`Hapus Rak ${confirmDeleteRack?.code}?`}
        description={
          confirmDeleteRack && (rackProductsMap.get(confirmDeleteRack.id)?.length || 0) > 0 ? (
            <span>
              Apakah Anda yakin ingin menghapus rak <strong>{confirmDeleteRack.code} - {confirmDeleteRack.name}</strong>? Sebanyak <strong>{rackProductsMap.get(confirmDeleteRack.id)?.length} produk</strong> yang terhubung akan dilepaskan dari rak ini.
            </span>
          ) : (
            <span>
              Apakah Anda yakin ingin menghapus rak <strong>{confirmDeleteRack?.code} - {confirmDeleteRack?.name}</strong>?
            </span>
          )
        }
        confirmText="Hapus Rak"
        cancelText="Batal"
      />
    </div>
  );
}
