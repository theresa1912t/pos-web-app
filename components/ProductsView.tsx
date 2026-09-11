'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Product, Category, Rack } from '@/types';
import { formatRupiah } from '@/lib/utils';
import { getProductEffectivePromo } from '@/services/promotionService';
import { BarcodeScannerModal } from '@/components/BarcodeScannerModal';
import { TablePagination } from '@/components/TablePagination';
import {
  Package,
  Plus,
  Upload,
  Download,
  Edit2,
  PackagePlus,
  Archive,
  ArchiveRestore,
  Trash2,
  Search,
  CheckCircle2,
  FileSpreadsheet,
  Image as ImageIcon,
  Barcode,
  Camera,
  X,
  Layers,
  ClipboardCheck,
  Sparkles,
  Building2,
  AlertTriangle,
} from 'lucide-react';

export function ProductsView() {
  const {
    products,
    promotions,
    categories,
    racks,
    createProduct,
    updateProduct,
    archiveProduct,
    unarchiveProduct,
    addCategory,
    updateCategory,
    deleteCategory,
    addRack,
    bulkImportProducts,
    seedInitialData,
    setRestockModalProductId,
    branches,
    activeBranchId,
    activeBranch,
    getProductStockInBranch,
  } = useApp();

  // Subtab: 'products' | 'categories'
  const [subTab, setSubTab] = useState<'products' | 'categories'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedRackFilter, setSelectedRackFilter] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedFeedback, setSeedFeedback] = useState<string | null>(null);

  const handleSeedInitialData = async () => {
    setIsSeeding(true);
    try {
      const res = await seedInitialData();
      if (res.success) {
        setSeedFeedback(`Berhasil memuat ${res.count} produk contoh (Indomie, Aqua, Kopi, Sembako)!`);
        setTimeout(() => setSeedFeedback(null), 4000);
      } else {
        setSeedFeedback(res.error || 'Gagal memuat data contoh.');
        setTimeout(() => setSeedFeedback(null), 4000);
      }
    } catch (e: any) {
      setSeedFeedback(e?.message || 'Gagal memuat data contoh.');
      setTimeout(() => setSeedFeedback(null), 4000);
    } finally {
      setIsSeeding(false);
    }
  };

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Category Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryNameInput, setCategoryNameInput] = useState('');
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Bulk Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Confirmation Modals State
  const [confirmArchiveProduct, setConfirmArchiveProduct] = useState<{
    product: Product;
    mode: 'archive' | 'unarchive';
  } | null>(null);

  const [categoryDeleteAction, setCategoryDeleteAction] = useState<{
    category: Category;
    count: number;
  } | null>(null);

  const [showConfirmSeed, setShowConfirmSeed] = useState(false);
  const [confirmCategorySave, setConfirmCategorySave] = useState(false);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchArchive = showArchived ? p.isArchived : !p.isArchived;
      const q = searchQuery.toLowerCase();
      const matchQuery =
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.rackName && p.rackName.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q));
      const matchCat =
        selectedCategoryFilter === 'all' || p.category === selectedCategoryFilter;
      const matchRack =
        selectedRackFilter === 'all' ||
        (selectedRackFilter === 'unassigned' && !p.rackId) ||
        p.rackId === selectedRackFilter;
      return matchArchive && matchQuery && matchCat && matchRack;
    });
  }, [products, showArchived, searchQuery, selectedCategoryFilter, selectedRackFilter]);

  // Standard 20-row Pagination state
  const [productPage, setProductPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Safe page clamping without triggering cascading render effect
  const totalProductPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const safeProductPage = Math.min(Math.max(1, productPage), totalProductPages);

  // Paged Products
  const pagedProducts = useMemo(() => {
    const start = (safeProductPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, safeProductPage]);

  // Open Create Product
  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  // Open Edit Product
  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setIsProductModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Subtab Switches (Hug Content) & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex items-center space-x-1.5 p-1 bg-slate-100 rounded-xl text-xs border border-slate-200/60 shadow-xs w-fit">
          <button
            onClick={() => setSubTab('products')}
            className={`px-3.5 py-2 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'products'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            Daftar Produk ({products.filter((p) => !p.isArchived).length})
          </button>
          <button
            onClick={() => setSubTab('categories')}
            className={`px-3.5 py-2 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'categories'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            Kategori ({categories.length})
          </button>
        </div>

        {/* Action Buttons on Right Side */}
        {subTab === 'products' ? (
          <div className="flex items-center flex-wrap gap-2 shrink-0 sm:self-auto self-start">
            <button
              onClick={() => setShowConfirmSeed(true)}
              disabled={isSeeding}
              className="flex items-center space-x-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              title="Populasikan inventaris dengan 10 produk contoh realistis (Indomie, Aqua, Kopi, Sembako)"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>{isSeeding ? 'Memuat...' : 'Seed Data Contoh'}</span>
            </button>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Produk</span>
            </button>

            <button
              onClick={handleOpenCreateProduct}
              className="flex items-center space-x-1.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm shadow-teal-600/20 active:scale-[0.99] transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Produk</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 shrink-0 sm:self-auto self-start">
            <button
              onClick={() => {
                setEditingCategory(null);
                setCategoryNameInput('');
                setCategoryError(null);
                setIsCategoryModalOpen(true);
              }}
              className="flex items-center space-x-1.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm shadow-teal-600/20 active:scale-[0.99] transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Kategori</span>
            </button>
          </div>
        )}
      </div>

      {/* SUBTAB 1: PRODUCTS LIST */}
      {subTab === 'products' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative min-w-[200px] flex-1 max-w-xs">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama produk, barcode, rak..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setProductPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
              />
            </div>

            {/* Category Filter Dropdown */}
            <select
              value={selectedCategoryFilter}
              onChange={(e) => {
                setSelectedCategoryFilter(e.target.value);
                setProductPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-teal-500 transition-colors"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Rack Filter Dropdown */}
            <select
              value={selectedRackFilter}
              onChange={(e) => {
                setSelectedRackFilter(e.target.value);
                setProductPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-teal-500 transition-colors"
            >
              <option value="all">Semua Lokasi Rak</option>
              <option value="unassigned">Belum Ada Rak</option>
              {racks.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code} - {r.name}
                </option>
              ))}
            </select>

            {/* Toggle Archived */}
            <button
              onClick={() => {
                setShowArchived(!showArchived);
                setProductPage(1);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors flex items-center space-x-1.5 cursor-pointer ${
                showArchived
                  ? 'bg-teal-50 border-teal-200 text-teal-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>{showArchived ? 'Melihat Arsip' : 'Lihat Arsip'}</span>
            </button>
          </div>

          {/* Seed Feedback Toast/Banner */}
          {seedFeedback && (
            <div className="p-3 bg-teal-50 border border-teal-200 text-teal-800 rounded-xl text-xs flex items-center justify-between shadow-xs animate-in fade-in duration-200">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="font-semibold">{seedFeedback}</span>
              </div>
              <button
                onClick={() => setSeedFeedback(null)}
                className="text-teal-600 hover:text-teal-800 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Product List Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Gambar</th>
                    <th className="py-3.5 px-4">Nama Produk</th>
                    <th className="py-3.5 px-4">Kategori</th>
                    <th className="py-3.5 px-4">Lokasi Rak</th>
                    <th className="py-3.5 px-4 text-right">Harga Jual</th>
                    <th className="py-3.5 px-4 text-right">HPP per Item</th>
                    <th className="py-3.5 px-4 text-right">
                      <div className="flex flex-col items-end">
                        <span>Stok</span>
                        <span className="text-[9px] lowercase font-normal text-teal-600">
                          {activeBranchId !== 'all' ? (activeBranch?.name || 'Cabang') : 'semua cabang'}
                        </span>
                      </div>
                    </th>
                    <th className="py-3.5 px-4">Satuan</th>
                    <th className="py-3.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 px-4 text-center">
                        {products.length === 0 ? (
                          <div className="max-w-md mx-auto py-6 flex flex-col items-center text-center space-y-3">
                            <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 mb-1 shadow-xs">
                              <Sparkles className="w-7 h-7" />
                            </div>
                            <h4 className="text-base font-bold text-slate-800">
                              Inventaris Produk Masih Kosong
                            </h4>
                            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                              Populasikan inventaris Anda dengan 10 produk contoh warung realistis (Indomie Goreng, Indomie Kuah, Aqua Botol 600ml, Kopi Kapal Api sachet, Teh Pucuk, Beras Ramos, Minyak Bimoli, Telur, dll.) lengkap dengan harga jual, HPP, barcode, dan stok untuk langsung mencoba kasir & restock.
                            </p>
                            <div className="pt-2 flex flex-wrap gap-2.5 justify-center">
                              <button
                                onClick={handleSeedInitialData}
                                disabled={isSeeding}
                                className="inline-flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                              >
                                <Sparkles className="w-4 h-4" />
                                <span>{isSeeding ? 'Sedang Memuat...' : 'Isi 10 Produk Contoh (Seed Data)'}</span>
                              </button>
                              <button
                                onClick={handleOpenCreateProduct}
                                className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Tambah Manual</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="py-8 text-slate-400 text-xs">
                            {showArchived
                              ? 'Tidak ada produk diarsipkan.'
                              : 'Tidak ada produk yang cocok dengan filter / pencarian Anda.'}
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : (
                    pagedProducts.map((prod) => {
                      const isLowStock = prod.stock <= (prod.minStockThreshold ?? 5);
                      const rackInfo = racks.find((r) => r.id === prod.rackId);
                      const displayRack = prod.rackName || (rackInfo ? `${rackInfo.code}` : null);

                      return (
                        <tr
                          key={prod.id}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          {/* Image */}
                          <td className="py-2.5 px-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                              {prod.image ? (
                                <img
                                  src={prod.image}
                                  alt={prod.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                          </td>

                          {/* Name */}
                          <td className="py-2.5 px-4 font-semibold text-slate-800">
                            <div className="flex flex-col">
                              <span>{prod.name}</span>
                              {prod.barcode && (
                                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                                  <Barcode className="w-3 h-3 text-slate-400" />
                                  {prod.barcode}
                                </span>
                              )}
                              {isLowStock && !prod.isArchived && (
                                <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1 mt-0.5">
                                  ⚠️ Stok Menipis (Min: {prod.minStockThreshold ?? 5})
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Category */}
                          <td className="py-2.5 px-4 text-xs font-medium text-slate-600">
                            {prod.category}
                          </td>

                          {/* Rack Location */}
                          <td className="py-2.5 px-4">
                            {displayRack ? (
                              <span className="font-mono text-xs font-medium text-slate-700">
                                {displayRack}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 italic">
                                -
                              </span>
                            )}
                          </td>

                          {/* Selling Price with Promotional Strikethrough Price Support */}
                          <td className="py-2.5 px-4 text-right">
                            {(() => {
                              const promoInfo = getProductEffectivePromo(
                                prod,
                                promotions,
                                activeBranchId !== 'all' ? activeBranchId : undefined
                              );

                              if (promoInfo.hasPromo) {
                                return (
                                  <div>
                                    <div className="flex items-center justify-end space-x-1.5">
                                      <span className="line-through text-xs text-slate-400">
                                        {formatRupiah(prod.sellingPrice)}
                                      </span>
                                      <span className="inline-block text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                        {promoInfo.badgeText}
                                      </span>
                                    </div>
                                    <span className="font-bold text-sm text-emerald-700 block">
                                      {formatRupiah(promoInfo.promoPrice)}
                                    </span>
                                  </div>
                                );
                              }

                              return (
                                <span className="font-bold text-teal-700">
                                  {formatRupiah(prod.sellingPrice)}
                                </span>
                              );
                            })()}
                          </td>

                          {/* COGS (HPP) */}
                          <td className="py-2.5 px-4 text-right text-slate-400">
                            {formatRupiah(prod.cogs)}
                          </td>

                          {/* Stock */}
                          <td className="py-2.5 px-4 text-right">
                            {(() => {
                              const displayStock =
                                activeBranchId !== 'all'
                                  ? getProductStockInBranch(prod.id, activeBranchId)
                                  : prod.stock;
                              const isLowInDisplay = displayStock <= (prod.minStockThreshold ?? 5);

                              return (
                                <span
                                  className={`font-bold text-sm ${
                                    isLowInDisplay ? 'text-amber-600' : 'text-slate-800'
                                  }`}
                                >
                                  {displayStock}
                                </span>
                              );
                            })()}
                          </td>

                          {/* Unit */}
                          <td className="py-2.5 px-4 text-slate-500">{prod.unit}</td>

                          {/* Actions */}
                          <td className="py-2.5 px-4">
                            <div className="flex items-center justify-center space-x-1.5">
                              {/* Restock Button */}
                              {!prod.isArchived && (
                                <button
                                  onClick={() => setRestockModalProductId(prod.id)}
                                  className="p-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition-colors cursor-pointer"
                                  title="Restock Produk"
                                >
                                  <PackagePlus className="w-4 h-4" />
                                </button>
                              )}

                              {/* Edit Button */}
                              <button
                                onClick={() => handleOpenEditProduct(prod)}
                                className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
                                title="Edit Master Produk"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {/* Archive / Unarchive */}
                              {prod.isArchived ? (
                                <button
                                  onClick={() => setConfirmArchiveProduct({ product: prod, mode: 'unarchive' })}
                                  className="p-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition-colors cursor-pointer"
                                  title="Aktifkan Kembali"
                                >
                                  <ArchiveRestore className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => setConfirmArchiveProduct({ product: prod, mode: 'archive' })}
                                  className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-rose-600 border border-slate-200 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Arsipkan Produk"
                                >
                                  <Archive className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Standard 20-row Pagination Bar */}
            <TablePagination
              currentPage={safeProductPage}
              totalItems={filteredProducts.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setProductPage}
              itemName="produk"
              className="rounded-b-2xl"
            />
          </div>
        </div>
      )}

      {/* SUBTAB 2: CATEGORIES TAB */}
      {subTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Daftar Kategori Produk</h3>
              <p className="text-xs text-slate-500">
                Kelola klasifikasi produk agar mudah dicari dan terorganisir
              </p>
            </div>
            <button
              onClick={() => {
                setEditingCategory(null);
                setCategoryNameInput('');
                setCategoryError(null);
                setIsCategoryModalOpen(true);
              }}
              className="flex items-center space-x-1.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm shadow-teal-600/20 active:scale-[0.99] transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Kategori</span>
            </button>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((cat) => {
              const productCount = products.filter((p) => p.category === cat.name).length;

              return (
                <div
                  key={cat.id}
                  className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs flex items-center justify-between hover:border-teal-300 transition-colors"
                >
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{cat.name}</h4>
                    <span className="text-xs text-slate-500">{productCount} Produk Terdaftar</span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => {
                        setEditingCategory(cat);
                        setCategoryNameInput(cat.name);
                        setCategoryError(null);
                        setIsCategoryModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
                      title="Edit Nama Kategori"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setCategoryDeleteAction({ category: cat, count: productCount });
                      }}
                      className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
                      title="Hapus Kategori (Jika kosong)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT PRODUCT */}
      {isProductModalOpen && (
        <ProductFormModal
          editingProduct={editingProduct}
          categories={categories}
          racks={racks}
          onClose={() => setIsProductModalOpen(false)}
          onSave={async (prodData) => {
            if (editingProduct) {
              await updateProduct(editingProduct.id, prodData);
            } else {
              await createProduct(prodData as Omit<Product, 'id'>);
            }
            setIsProductModalOpen(false);
          }}
          onAddNewCategory={async (name) => {
            const cat = await addCategory(name);
            return cat;
          }}
          onAddNewRack={async (name, code) => {
            const r = await addRack({ name, code });
            return r;
          }}
        />
      )}

      {/* MODAL: ADD / EDIT CATEGORY */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Nama Kategori</label>
              <input
                type="text"
                placeholder="Contoh: Sembako, Minuman Dingin"
                value={categoryNameInput}
                onChange={(e) => setCategoryNameInput(e.target.value)}
                autoFocus
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
              />
              {categoryError && <p className="text-xs text-rose-600 font-medium">{categoryError}</p>}
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!categoryNameInput.trim()) {
                    setCategoryError('Nama kategori wajib diisi');
                    return;
                  }
                  setCategoryError(null);
                  setConfirmCategorySave(true);
                }}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-sm shadow-teal-600/20 active:scale-[0.99] transition-all cursor-pointer"
              >
                Simpan Kategori
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: 5-STEP BULK IMPORT */}
      {isImportModalOpen && (
        <BulkImportModal
          onClose={() => setIsImportModalOpen(false)}
          onImport={async (imported) => {
            await bulkImportProducts(imported);
            setIsImportModalOpen(false);
          }}
        />
      )}

      {/* CONFIRMATION DIALOG: ARCHIVE / RESTORE PRODUCT */}
      {confirmArchiveProduct && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setConfirmArchiveProduct(null)}
          onConfirm={async () => {
            if (confirmArchiveProduct.mode === 'archive') {
              await archiveProduct(confirmArchiveProduct.product.id);
            } else {
              await unarchiveProduct(confirmArchiveProduct.product.id);
            }
            setConfirmArchiveProduct(null);
          }}
          title={
            confirmArchiveProduct.mode === 'archive'
              ? 'Arsipkan Produk?'
              : 'Aktifkan Kembali Produk?'
          }
          description={
            confirmArchiveProduct.mode === 'archive' ? (
              <span>
                Produk <strong>&ldquo;{confirmArchiveProduct.product.name}&rdquo;</strong> akan diarsipkan dan disembunyikan dari transaksi kasir. Data riwayat dan stok tetap aman.
              </span>
            ) : (
              <span>
                Produk <strong>&ldquo;{confirmArchiveProduct.product.name}&rdquo;</strong> akan diaktifkan kembali ke katalog aktif dan dapat dijual di kasir.
              </span>
            )
          }
          confirmText={confirmArchiveProduct.mode === 'archive' ? 'Ya, Arsipkan' : 'Ya, Aktifkan'}
          cancelText="Batal"
          type={confirmArchiveProduct.mode === 'archive' ? 'warning' : 'primary'}
        />
      )}

      {/* CONFIRMATION DIALOG: DELETE CATEGORY */}
      {categoryDeleteAction && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setCategoryDeleteAction(null)}
          onConfirm={
            categoryDeleteAction.count === 0
              ? async () => {
                  await deleteCategory(categoryDeleteAction.category.id);
                  setCategoryDeleteAction(null);
                }
              : undefined
          }
          title={
            categoryDeleteAction.count > 0
              ? 'Kategori Tidak Dapat Dihapus'
              : 'Hapus Kategori?'
          }
          description={
            categoryDeleteAction.count > 0 ? (
              <span>
                Kategori <strong>&ldquo;{categoryDeleteAction.category.name}&rdquo;</strong> saat ini masih digunakan oleh{' '}
                <strong>{categoryDeleteAction.count} produk</strong>. Pindahkan atau hapus produk terkait terlebih dahulu sebelum menghapus kategori ini.
              </span>
            ) : (
              <span>
                Apakah Anda yakin ingin menghapus kategori <strong>&ldquo;{categoryDeleteAction.category.name}&rdquo;</strong>? Tindakan ini tidak dapat dibatalkan.
              </span>
            )
          }
          confirmText="Ya, Hapus Kategori"
          cancelText="Batal"
          type={categoryDeleteAction.count > 0 ? 'info' : 'danger'}
          isAlertOnly={categoryDeleteAction.count > 0}
        />
      )}

      {/* CONFIRMATION DIALOG: SEED DATA */}
      {showConfirmSeed && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setShowConfirmSeed(false)}
          onConfirm={async () => {
            setShowConfirmSeed(false);
            await handleSeedInitialData();
          }}
          title="Muat Data Contoh?"
          description="Akan menambahkan 10 produk ritel populer (Indomie, Aqua, Beras, Kopi, dsb.) beserta kategori dan penataan rak default untuk demonstrasi."
          confirmText="Ya, Muat Data"
          cancelText="Batal"
          type="primary"
        />
      )}

      {/* CONFIRMATION DIALOG: SAVE CATEGORY */}
      {confirmCategorySave && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setConfirmCategorySave(false)}
          onConfirm={async () => {
            if (editingCategory) {
              await updateCategory(editingCategory.id, categoryNameInput.trim());
            } else {
              await addCategory(categoryNameInput.trim());
            }
            setConfirmCategorySave(false);
            setIsCategoryModalOpen(false);
          }}
          title={editingCategory ? 'Perbarui Kategori?' : 'Simpan Kategori Baru?'}
          description={
            <span>
              Apakah Anda yakin ingin {editingCategory ? 'mengubah nama kategori menjadi' : 'menambahkan kategori baru'}{' '}
              <strong>&ldquo;{categoryNameInput.trim()}&rdquo;</strong>?
            </span>
          }
          confirmText="Ya, Simpan"
          cancelText="Batal"
          type="primary"
        />
      )}
    </div>
  );
}

// ----------------------------------------------------
// PRODUCT CREATE / EDIT MODAL COMPONENT
// ----------------------------------------------------
interface ProductFormModalProps {
  editingProduct: Product | null;
  categories: Category[];
  racks: Rack[];
  onClose: () => void;
  onSave: (data: Partial<Product>) => void;
  onAddNewCategory: (name: string) => Promise<Category>;
  onAddNewRack: (name: string, code: string) => Promise<Rack>;
}

function ProductFormModal({
  editingProduct,
  categories,
  racks,
  onClose,
  onSave,
  onAddNewCategory,
  onAddNewRack,
}: ProductFormModalProps) {
  const [name, setName] = useState(editingProduct?.name ?? '');
  const [barcode, setBarcode] = useState(editingProduct?.barcode ?? '');
  const [category, setCategory] = useState(editingProduct?.category ?? (categories[0]?.name || 'Umum'));
  const [rackId, setRackId] = useState(editingProduct?.rackId ?? '');
  const [sellingPrice, setSellingPrice] = useState<number | ''>(editingProduct?.sellingPrice ?? '');
  const [cogs, setCogs] = useState<number | ''>(editingProduct?.cogs ?? '');
  const [initialStock, setInitialStock] = useState<number | ''>(editingProduct?.stock ?? '');
  const [unit, setUnit] = useState(editingProduct?.unit ?? 'Pcs');
  const [minStock, setMinStock] = useState<number | ''>(editingProduct?.minStockThreshold ?? 5);
  const [image, setImage] = useState<string | undefined>(editingProduct?.image);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [showConfirmSave, setShowConfirmSave] = useState(false);

  // Inline Add New Category State
  const [isAddingCategoryInline, setIsAddingCategoryInline] = useState(false);
  const [newCategoryInlineName, setNewCategoryInlineName] = useState('');

  // Inline Add New Rack State
  const [isAddingRackInline, setIsAddingRackInline] = useState(false);
  const [newRackInlineCode, setNewRackInlineCode] = useState('');
  const [newRackInlineName, setNewRackInlineName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImage(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveInlineCategory = async () => {
    if (newCategoryInlineName.trim()) {
      const created = await onAddNewCategory(newCategoryInlineName.trim());
      setCategory(created.name);
      setNewCategoryInlineName('');
      setIsAddingCategoryInline(false);
    }
  };

  const handleSaveInlineRack = async () => {
    if (newRackInlineCode.trim() && newRackInlineName.trim()) {
      const created = await onAddNewRack(newRackInlineName.trim(), newRackInlineCode.trim().toUpperCase());
      setRackId(created.id);
      setNewRackInlineCode('');
      setNewRackInlineName('');
      setIsAddingRackInline(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || sellingPrice === '' || cogs === '') return;
    setShowConfirmSave(true);
  };

  const handleExecuteSave = () => {
    setShowConfirmSave(false);
    const matchedRack = racks.find((r) => r.id === rackId);

    onSave({
      name: name.trim(),
      barcode: barcode.trim() || undefined,
      category,
      rackId: rackId || undefined,
      rackName: matchedRack ? `${matchedRack.code} - ${matchedRack.name}` : undefined,
      sellingPrice: Number(sellingPrice),
      cogs: Number(cogs),
      stock: initialStock === '' ? 0 : Number(initialStock),
      unit: unit.trim() || 'Pcs',
      minStockThreshold: minStock === '' ? 5 : Number(minStock),
      image,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="text-base font-bold text-slate-900">
            {editingProduct ? 'Edit Master Produk' : 'Tambah Produk Baru'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Product Name */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nama Produk <span className="text-teal-600">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Indomie Goreng Spesial, Le Minerale 600ml"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Barcode Field with Camera Scan Action */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">
                Barcode Produk <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="flex items-center space-x-1.5 text-teal-600 hover:text-teal-700 font-semibold px-2 py-0.5 rounded-lg hover:bg-teal-50 transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Scan Barcode</span>
              </button>
            </div>
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Scan atau ketik nomor barcode (misal: 8992345678901)"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-sm font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
              />
              <Barcode className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              {barcode && (
                <button
                  type="button"
                  onClick={() => setBarcode('')}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category & Rack Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Category Dropdown */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kategori <span className="text-teal-600">*</span>
              </label>
              {!isAddingCategoryInline ? (
                <div className="flex items-center space-x-1.5">
                  <select
                    value={category}
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') {
                        setIsAddingCategoryInline(true);
                      } else {
                        setCategory(e.target.value);
                      }
                    }}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    <option value="__add_new__">+ Tambah Kategori</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsAddingCategoryInline(true)}
                    className="px-2.5 py-2 rounded-xl bg-teal-50 border border-teal-200 text-[11px] font-semibold text-teal-700 hover:bg-teal-100 transition-colors cursor-pointer shrink-0"
                  >
                    + Baru
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-1.5">
                  <input
                    type="text"
                    placeholder="Nama kategori..."
                    value={newCategoryInlineName}
                    onChange={(e) => setNewCategoryInlineName(e.target.value)}
                    autoFocus
                    className="flex-1 bg-slate-50 border border-teal-500 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSaveInlineCategory}
                    className="px-2.5 py-2 bg-teal-600 text-white rounded-xl text-[11px] font-semibold cursor-pointer shrink-0"
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingCategoryInline(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Rack Dropdown */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Lokasi Rak Fisik <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>
              {!isAddingRackInline ? (
                <div className="flex items-center space-x-1.5">
                  <select
                    value={rackId}
                    onChange={(e) => {
                      if (e.target.value === '__add_new_rack__') {
                        setIsAddingRackInline(true);
                      } else {
                        setRackId(e.target.value);
                      }
                    }}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors font-mono"
                  >
                    <option value="">-- Tanpa Rak --</option>
                    {racks.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.code} ({r.name})
                      </option>
                    ))}
                    <option value="__add_new_rack__">+ Tambah Rak Baru</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsAddingRackInline(true)}
                    className="px-2.5 py-2 rounded-xl bg-teal-50 border border-teal-200 text-[11px] font-semibold text-teal-700 hover:bg-teal-100 transition-colors cursor-pointer shrink-0"
                  >
                    + Baru
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-1.5">
                  <input
                    type="text"
                    placeholder="Kode (RAK-A1)"
                    value={newRackInlineCode}
                    onChange={(e) => setNewRackInlineCode(e.target.value.toUpperCase())}
                    className="w-20 bg-slate-50 border border-teal-500 rounded-xl px-2 py-2 text-xs font-mono uppercase text-slate-800 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Nama rak..."
                    value={newRackInlineName}
                    onChange={(e) => setNewRackInlineName(e.target.value)}
                    className="flex-1 bg-slate-50 border border-teal-500 rounded-xl px-2 py-2 text-xs text-slate-800 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSaveInlineRack}
                    className="px-2.5 py-2 bg-teal-600 text-white rounded-xl text-[11px] font-semibold cursor-pointer shrink-0"
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingRackInline(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Pricing Row: Selling Price & COGS per item */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Harga Jual (Rp) <span className="text-teal-600">*</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="Contoh: 3500"
                value={sellingPrice}
                onChange={(e) =>
                  setSellingPrice(
                    e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0)
                  )
                }
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                HPP per Item / Modal (Rp) <span className="text-teal-600">*</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="Contoh: 2800"
                value={cogs}
                onChange={(e) =>
                  setCogs(
                    e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0)
                  )
                }
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Stock & Unit Row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {editingProduct ? 'Stok Saat Ini' : 'Stok Awal'}
              </label>
              <input
                type="number"
                min="0"
                placeholder="Contoh: 24"
                value={initialStock}
                onChange={(e) =>
                  setInitialStock(
                    e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0)
                  )
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Satuan</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
              >
                <option value="Pcs">Pcs</option>
                <option value="Bks">Bks (Bungkus)</option>
                <option value="Btl">Btl (Botol)</option>
                <option value="Kg">Kg (Kilogram)</option>
                <option value="Sachet">Sachet</option>
                <option value="Rtg">Rtg (Renceng)</option>
                <option value="Pch">Pch (Pouch)</option>
                <option value="Karung">Karung</option>
                <option value="Dus">Dus / Karton</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Batas Minimum</label>
              <input
                type="number"
                min="1"
                placeholder="5"
                value={minStock}
                onChange={(e) =>
                  setMinStock(
                    e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 1)
                  )
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Product Image Upload */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <label className="block font-semibold text-slate-700">
              Foto Produk (Upload Image)
            </label>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
              className="hidden"
            />

            {image ? (
              <div className="flex items-center space-x-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <img
                  src={image}
                  alt="Preview"
                  className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                />
                <div className="space-y-1">
                  <span className="text-xs text-slate-800 font-semibold block">Foto Tersedia</span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-teal-700 font-semibold hover:underline cursor-pointer"
                    >
                      Ganti Foto
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => setImage(undefined)}
                      className="text-xs text-rose-600 font-semibold hover:underline cursor-pointer"
                    >
                      Hapus Foto
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-2xl p-6 text-center cursor-pointer bg-slate-50 hover:bg-slate-100/50 transition-colors"
              >
                <ImageIcon className="w-8 h-8 mx-auto text-slate-400 mb-1.5" />
                <span className="text-xs text-slate-700 block font-semibold">
                  Klik untuk Upload Gambar Produk
                </span>
                <span className="text-[10px] text-slate-400">
                  Format PNG, JPG, JPEG (Maks. 5MB)
                </span>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-2.5 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-sm shadow-teal-600/20 active:scale-[0.99] transition-all cursor-pointer"
            >
              {editingProduct ? 'Perbarui Produk' : 'Simpan Produk Baru'}
            </button>
          </div>
        </form>
      </div>

      {/* Barcode Scanner Modal for Form */}
      {isScannerOpen && (
        <BarcodeScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={(code) => {
            setBarcode(code);
            setIsScannerOpen(false);
          }}
          title="Scan Barcode Produk"
          subtitle="Arahkan kamera ke barcode untuk mengisi kolom secara otomatis"
        />
      )}

      {/* Save Product Confirmation Dialog */}
      {showConfirmSave && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setShowConfirmSave(false)}
          onConfirm={handleExecuteSave}
          title={editingProduct ? 'Perbarui Data Produk?' : 'Simpan Produk Baru?'}
          description={
            <span>
              Apakah Anda yakin ingin menyimpan perubahan untuk produk <strong>&ldquo;{name.trim()}&rdquo;</strong> dengan harga jual{' '}
              <strong>{formatRupiah(Number(sellingPrice) || 0)}</strong>?
            </span>
          }
          confirmText={editingProduct ? 'Ya, Perbarui' : 'Ya, Simpan'}
          cancelText="Batal"
          type="primary"
        />
      )}
    </div>
  );
}

// ----------------------------------------------------
// 5-STEP BULK IMPORT MODAL COMPONENT
// ----------------------------------------------------
interface BulkImportModalProps {
  onClose: () => void;
  onImport: (products: Omit<Product, 'id'>[]) => void;
}

function BulkImportModal({ onClose, onImport }: BulkImportModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [showConfirmBulk, setShowConfirmBulk] = useState(false);
  const [parsedRows, setParsedRows] = useState<
    {
      name: string;
      category: string;
      sellingPrice: number;
      cogs: number;
      stock: number;
      unit: string;
      barcode?: string;
      errors: string[];
    }[]
  >([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Template CSV content
  const downloadTemplate = () => {
    const headers = 'Product Name,Category,Selling Price,COGS per Item,Initial Stock,Unit,Barcode\n';
    const sampleRows = [
      'Indomie Goreng Aceh,Makanan & Mie,3500,2800,40,Bks,8998866200231',
      'Aqua Botol 600ml,Minuman,3500,2500,24,Btl,8992775110012',
      'Gula Pasir Gulaku 1kg,Sembako,18500,16000,10,Bks,8993417101015',
      'Rokok Djarum Super 12,Rokok,24000,21500,20,Bks,8999909001123',
    ].join('\n');

    const blob = new Blob([headers + sampleRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_import_produk_warung.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setStep(2);
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        validateAndParse(text);
      }
    };
    reader.readAsText(file);
  };

  const validateAndParse = (csvText: string) => {
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1) {
      alert('File CSV kosong atau tidak memiliki baris data.');
      return;
    }

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      if (cols.length < 4) continue;

      const [name, category, rawSell, rawCogs, rawStock, rawUnit, rawBarcode] = cols;
      const errors: string[] = [];

      if (!name) errors.push('Nama produk wajib');
      const sellingPrice = parseInt(rawSell);
      if (isNaN(sellingPrice) || sellingPrice <= 0) errors.push('Harga jual tidak valid');
      const cogs = parseInt(rawCogs);
      if (isNaN(cogs) || cogs <= 0) errors.push('HPP / Modal tidak valid');
      const stock = parseInt(rawStock) || 0;
      const unit = rawUnit || 'Pcs';
      const barcode = rawBarcode && rawBarcode.trim() ? rawBarcode.trim() : undefined;

      rows.push({
        name: name || 'Tanpa Nama',
        category: category || 'Umum',
        sellingPrice: isNaN(sellingPrice) ? 0 : sellingPrice,
        cogs: isNaN(cogs) ? 0 : cogs,
        stock: isNaN(stock) ? 0 : stock,
        unit,
        barcode,
        errors,
      });
    }

    setParsedRows(rows);
    setStep(3);
  };

  const hasErrors = parsedRows.some((r) => r.errors.length > 0);
  const validRows = parsedRows.filter((r) => r.errors.length === 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Import Massal Produk (Bulk Upload)
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5-Step Flow Steps Header */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs overflow-x-auto gap-2">
          {[
            { s: 1, label: '1. Download Template' },
            { s: 2, label: '2. Upload File' },
            { s: 3, label: '3. Validasi Data' },
            { s: 4, label: '4. Pratinjau' },
            { s: 5, label: '5. Konfirmasi' },
          ].map((item) => (
            <span
              key={item.s}
              className={`px-3 py-1 rounded-xl whitespace-nowrap font-semibold ${
                step === item.s
                  ? 'bg-teal-600 text-white shadow-xs'
                  : step > item.s
                  ? 'text-teal-700 bg-teal-50 border border-teal-200'
                  : 'text-slate-400'
              }`}
            >
              {item.label}
            </span>
          ))}
        </div>

        {/* Step Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* STEP 1: Download Template */}
          {step === 1 && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mx-auto">
                <Download className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Langkah 1: Unduh Format Template CSV
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Format template mencakup: Nama Produk, Kategori, Harga Jual, HPP per Item, Stok Awal, dan Satuan.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-sm shadow-teal-600/20 cursor-pointer inline-flex items-center space-x-2 active:scale-[0.99] transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Template CSV</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs text-slate-500 hover:text-teal-700 font-semibold block mx-auto underline pt-2 cursor-pointer"
              >
                Sudah memiliki template? Langsung Upload
              </button>
            </div>
          )}

          {/* STEP 2: Upload File */}
          {step === 2 && (
            <div className="text-center py-6 space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv,text/csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-2xl p-8 bg-slate-50 cursor-pointer transition-colors"
              >
                <Upload className="w-12 h-12 text-teal-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-900">
                  Klik untuk Memilih File CSV
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Atau seret file CSV dari komputer Anda ke sini
                </p>
              </div>
              <button
                onClick={() => setStep(1)}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
              >
                Kembali ke Download Template
              </button>
            </div>
          )}

          {/* STEP 3 & 4: Validate Data & Preview */}
          {(step === 3 || step === 4) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div>
                  <span className="text-slate-500">Total Baris: </span>
                  <span className="text-slate-900 font-bold">{parsedRows.length} Produk</span>
                </div>
                <div>
                  <span className="text-slate-500">Baris Valid: </span>
                  <span className="text-teal-700 font-bold">{validRows.length} Siap Diimpor</span>
                </div>
                {hasErrors && (
                  <div>
                    <span className="text-rose-600 font-bold">
                      {parsedRows.length - validRows.length} Error
                    </span>
                  </div>
                )}
              </div>

              {/* Table Preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="p-3">Status</th>
                      <th className="p-3">Nama Produk</th>
                      <th className="p-3">Kategori</th>
                      <th className="p-3 text-right">Harga Jual</th>
                      <th className="p-3 text-right">HPP</th>
                      <th className="p-3 text-right">Stok</th>
                      <th className="p-3">Satuan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((r, idx) => (
                      <tr
                        key={idx}
                        className={r.errors.length > 0 ? 'bg-rose-50' : 'hover:bg-slate-50/50'}
                      >
                        <td className="p-3">
                          {r.errors.length === 0 ? (
                            <CheckCircle2 className="w-4 h-4 text-teal-600" />
                          ) : (
                            <span className="text-[10px] text-rose-600 font-bold">
                              {r.errors.join(', ')}
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-semibold text-slate-800">{r.name}</td>
                        <td className="p-3 text-slate-600">{r.category}</td>
                        <td className="p-3 text-right font-bold text-teal-700">{formatRupiah(r.sellingPrice)}</td>
                        <td className="p-3 text-right text-slate-400">{formatRupiah(r.cogs)}</td>
                        <td className="p-3 text-right font-semibold text-slate-800">{r.stock}</td>
                        <td className="p-3 text-slate-500">{r.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Upload File Lain
                </button>
                <button
                  type="button"
                  disabled={validRows.length === 0}
                  onClick={() => setShowConfirmBulk(true)}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-40 shadow-sm shadow-teal-600/20 transition-all"
                >
                  Konfirmasi Import ({validRows.length} Produk)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Import Confirmation Dialog */}
      {showConfirmBulk && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setShowConfirmBulk(false)}
          onConfirm={() => {
            setShowConfirmBulk(false);
            onImport(validRows.map(({ errors, ...rest }) => rest));
          }}
          title="Import Produk ke Katalog?"
          description={
            <span>
              Apakah Anda yakin ingin mengimpor <strong>{validRows.length} produk</strong> ke katalog sistem? Produk yang sudah ada dengan nama yang sama akan diabaikan/diperbarui.
            </span>
          }
          confirmText="Ya, Import Sekarang"
          cancelText="Batal"
          type="primary"
        />
      )}
    </div>
  );
}

// ----------------------------------------------------
// REUSABLE CONFIRMATION DIALOG MODAL COMPONENT
// ----------------------------------------------------
interface ConfirmDialogProps {
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

function ConfirmDialog({
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
            {type === 'info' && <AlertTriangle className="w-5 h-5" />}
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
