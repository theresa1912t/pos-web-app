'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Product, PaymentMethod, Order, SalesChannel } from '@/types';
import { formatRupiah, formatTime } from '@/lib/utils';
import { BarcodeScannerModal } from '@/components/BarcodeScannerModal';
import { triggerCashDrawerOpen } from '@/lib/hardwareBridge';
import { SalesChannelBadge } from '@/components/SalesChannelBadge';
import { getProductEffectivePromo, calculateOrderSavings } from '@/services/promotionService';
import {
  X,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  QrCode,
  Banknote,
  CreditCard,
  ArrowRight,
  RefreshCcw,
  ShoppingBag,
  Barcode,
  AlertTriangle,
  PackagePlus,
  Vault,
  Sparkles,
  Building2,
  BadgePercent,
} from 'lucide-react';

interface CreateOrderModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function CreateOrderModal({ onClose }: CreateOrderModalProps) {
  const {
    products,
    promotions,
    categories,
    createOrder,
    createProduct,
    seedInitialData,
    settings,
    setIsCreateOrderModalOpen,
    branches,
    activeBranchId,
    getProductStockInBranch,
    canSwitchToAllBranches,
    accessibleBranches,
  } = useApp();

  const defaultBranchId = useMemo(() => {
    if (activeBranchId !== 'all') return activeBranchId;
    const activeAccessible = accessibleBranches.find((b) => b.status === 'Active');
    return activeAccessible?.id || accessibleBranches[0]?.id || branches[0]?.id || 'branch-1';
  }, [activeBranchId, accessibleBranches, branches]);

  const [orderBranchId, setOrderBranchId] = useState<string>(defaultBranchId);

  const currentBranch = useMemo(() => {
    return branches.find((b) => b.id === orderBranchId) || branches[0];
  }, [branches, orderBranchId]);

  const [step, setStep] = useState<1 | 2 | 3 | 'success'>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isSeeding, setIsSeeding] = useState(false);
  
  // Barcode Scanning State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanToast, setScanToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);
  const [unregisteredBarcode, setUnregisteredBarcode] = useState<string | null>(null);

  // Quick Create Product from Unknown Barcode State
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [quickProdName, setQuickProdName] = useState('');
  const [quickProdCategory, setQuickProdCategory] = useState(categories[0]?.name || 'Umum');
  const [quickProdSellingPrice, setQuickProdSellingPrice] = useState<number | ''>('');
  const [quickProdCogs, setQuickProdCogs] = useState<number | ''>('');
  const [quickProdStock, setQuickProdStock] = useState<number | ''>(10);
  const [quickProdUnit, setQuickProdUnit] = useState('Pcs');
  
  // Cart state: Map of productId -> quantity
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  
  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [customPaymentName, setCustomPaymentName] = useState('');
  const [isAddingCustomPayment, setIsAddingCustomPayment] = useState(false);
  const [cashTendered, setCashTendered] = useState<number | ''>('');
  const [salesChannel, setSalesChannel] = useState<SalesChannel>('Offline / Kasir');
  const [externalOrderId, setExternalOrderId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cashDrawerResult, setCashDrawerResult] = useState<{
    triggered: boolean;
    success: boolean;
    message: string;
  } | null>(null);
  
  // Created order ref for receipt
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Active products only (not archived)
  const availableProducts = useMemo(() => {
    return products.filter((p) => !p.isArchived);
  }, [products]);

  // Helper to get stock for a product in the selected branch
  const getBranchStock = (productId: string) => {
    return getProductStockInBranch(productId, orderBranchId);
  };

  // Filter products by search, category, and barcode
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return availableProducts.filter((p) => {
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q));
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      return matchQuery && matchCat;
    });
  }, [availableProducts, searchQuery, selectedCategory]);

  // Cart calculations with promotion and strikethrough price savings
  const cartSavings = useMemo(() => {
    return calculateOrderSavings(cart, promotions, orderBranchId);
  }, [cart, promotions, orderBranchId]);

  const totalAmount = cartSavings.subtotalFinal;
  const originalTotalAmount = cartSavings.subtotalOriginal;
  const totalPromoSavings = cartSavings.totalSavings;
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const numCashTendered = typeof cashTendered === 'number' ? cashTendered : totalAmount;
  const changeAmount = Math.max(0, numCashTendered - totalAmount);

  // Show temporary toast feedback
  const showToast = (message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setScanToast({ message, type });
    setTimeout(() => {
      setScanToast((prev) => (prev?.message === message ? null : prev));
    }, 3000);
  };

  // Cart Actions (checked against branch stock)
  const addToCart = (product: Product) => {
    const currentStock = getBranchStock(product.id);
    setCart((prev) => {
      const existing = prev.find((it) => it.product.id === product.id);
      if (existing) {
        if (existing.quantity >= currentStock) {
          showToast(`Stok ${product.name} di ${currentBranch?.name || 'cabang ini'} telah mencapai batas (${currentStock} ${product.unit})`, 'warning');
          return prev;
        }
        return prev.map((it) =>
          it.product.id === product.id ? { ...it, quantity: it.quantity + 1 } : it
        );
      }
      if (currentStock <= 0) {
        showToast(`Stok ${product.name} di ${currentBranch?.name || 'cabang ini'} habis`, 'warning');
        return prev;
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    const currentStock = getBranchStock(productId);
    const cappedQty = Math.min(newQty, currentStock);

    setCart((prev) =>
      prev.map((it) => (it.product.id === productId ? { ...it, quantity: cappedQty } : it))
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((it) => it.product.id !== productId));
  };

  // Handle scanned barcode from camera or USB reader
  const handleBarcodeScanned = (scannedCode: string) => {
    const cleanCode = scannedCode.trim();
    if (!cleanCode) return;

    const matchedProduct = availableProducts.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === cleanCode.toLowerCase()) ||
        p.id === cleanCode
    );

    if (matchedProduct) {
      const currentStock = getBranchStock(matchedProduct.id);
      if (currentStock <= 0) {
        showToast(`Stok "${matchedProduct.name}" di ${currentBranch?.name || 'cabang ini'} habis (${currentStock} ${matchedProduct.unit})`, 'warning');
      } else {
        addToCart(matchedProduct);
        showToast(`"${matchedProduct.name}" ditambahkan ke keranjang`, 'success');
      }
    } else {
      // Barcode not found in inventory
      setUnregisteredBarcode(cleanCode);
      setQuickProdName('');
      setQuickProdSellingPrice('');
      setQuickProdCogs('');
      setQuickProdStock(10);
      setQuickProdUnit('Pcs');
      setQuickProdCategory(categories[0]?.name || 'Umum');
    }
  };

  // Handle quick creation of unknown barcode product
  const handleQuickCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickProdName.trim() || quickProdSellingPrice === '' || quickProdCogs === '' || !unregisteredBarcode) {
      return;
    }

    const created = await createProduct({
      name: quickProdName.trim(),
      category: quickProdCategory,
      sellingPrice: Number(quickProdSellingPrice),
      cogs: Number(quickProdCogs),
      stock: quickProdStock === '' ? 0 : Number(quickProdStock),
      unit: quickProdUnit.trim() || 'Pcs',
      barcode: unregisteredBarcode,
      minStockThreshold: 5,
    });

    if (created) {
      addToCart(created);
      showToast(`Produk "${created.name}" berhasil didaftarkan & ditambahkan ke keranjang`, 'success');
      setIsQuickCreateOpen(false);
      setUnregisteredBarcode(null);
    }
  };

  const resetOrder = () => {
    setCart([]);
    setStep(1);
    setSearchQuery('');
    setPaymentMethod('Cash');
    setCashTendered('');
    setCompletedOrder(null);
    setScanToast(null);
    setUnregisteredBarcode(null);
    setIsQuickCreateOpen(false);
  };

  const handleClose = () => {
    resetOrder();
    if (onClose) {
      onClose();
    } else {
      setIsCreateOrderModalOpen(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (cart.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const finalPayment = isAddingCustomPayment && customPaymentName.trim()
        ? customPaymentName.trim()
        : paymentMethod;

      const order = await createOrder(
        cart,
        finalPayment,
        paymentMethod === 'Cash' ? (typeof cashTendered === 'number' ? cashTendered : totalAmount) : undefined,
        paymentMethod === 'Cash' ? changeAmount : 0,
        salesChannel,
        externalOrderId.trim() || undefined,
        orderBranchId
      );

      if (order) {
        setCompletedOrder(order);
        setStep('success');

        // Auto open cash drawer if Cash payment & auto-open enabled in settings
        if (finalPayment === 'Cash') {
          if (settings.autoOpenCashDrawer !== false) {
            const res = await triggerCashDrawerOpen();
            if (res.success) {
              setCashDrawerResult({
                triggered: true,
                success: true,
                message: 'Cash payment recorded. Cash drawer opened.',
              });
            } else {
              setCashDrawerResult({
                triggered: true,
                success: false,
                message: 'Payment recorded, but the cash drawer could not be opened.',
              });
            }
          } else {
            setCashDrawerResult({
              triggered: false,
              success: true,
              message: 'Cash payment recorded.',
            });
          }
        } else {
          setCashDrawerResult(null);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick cash amount suggestions based on total
  const cashSuggestions = useMemo(() => {
    if (totalAmount <= 0) return [];
    const suggestions = new Set<number>();
    suggestions.add(totalAmount);

    const roundUps = [10000, 20000, 50000, 100000, 200000, 500000];
    roundUps.forEach((denom) => {
      if (denom >= totalAmount) {
        suggestions.add(denom);
      }
    });

    return Array.from(suggestions).slice(0, 5);
  }, [totalAmount]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[92vh]">
        {/* Top Toast Banner for Barcode feedback */}
        {scanToast && (
          <div
            className={`absolute top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl text-xs font-semibold shadow-lg flex items-center space-x-2 animate-in slide-in-from-top-2 duration-150 ${
              scanToast.type === 'success'
                ? 'bg-teal-600 text-white'
                : scanToast.type === 'warning'
                ? 'bg-amber-500 text-white'
                : 'bg-rose-600 text-white'
            }`}
          >
            {scanToast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{scanToast.message}</span>
          </div>
        )}

        {/* Top Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Kasir & Transaksi Baru
              </h2>
              <p className="text-[11px] text-slate-500">
                Proses cepat penjualan warung dengan scan barcode & pencarian instan
              </p>
            </div>
          </div>

          {/* Stepper indicator if not success */}
          {step !== 'success' && (
            <div className="hidden sm:flex items-center space-x-2 text-xs font-semibold">
              <button
                onClick={() => setStep(1)}
                className={`px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${
                  step === 1
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                1. Pilih Item ({totalItemsCount})
              </button>
              <span className="text-slate-300">/</span>
              <button
                onClick={() => cart.length > 0 && setStep(2)}
                disabled={cart.length === 0}
                className={`px-3 py-1.5 rounded-xl transition-colors ${
                  cart.length === 0 ? 'opacity-40 cursor-not-allowed text-slate-400 bg-slate-100' : 'cursor-pointer'
                } ${
                  step === 2
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                2. Pembayaran
              </button>
              <span className="text-slate-300">/</span>
              <button
                onClick={() => cart.length > 0 && setStep(3)}
                disabled={cart.length === 0}
                className={`px-3 py-1.5 rounded-xl transition-colors ${
                  cart.length === 0 ? 'opacity-40 cursor-not-allowed text-slate-400 bg-slate-100' : 'cursor-pointer'
                } ${
                  step === 3
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                3. Konfirmasi
              </button>
            </div>
          )}

          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* STEP 1: ITEM SELECTION & CART */}
          {step === 1 && (
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Product Catalog Column */}
              <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-slate-200 overflow-hidden bg-slate-50/30">
                {/* Search Bar, Categories & Scan Barcode Action */}
                <div className="p-4 border-b border-slate-200 space-y-3 bg-white">
                  {/* Branch Context Indicator */}
                  <div className="flex items-center justify-between px-3 py-2 bg-teal-50/60 border border-teal-200/80 rounded-xl text-xs">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-teal-700 shrink-0" />
                      <span className="text-slate-600 font-medium">Cabang Transaksi:</span>
                    </div>

                    {canSwitchToAllBranches ? (
                      <div className="flex items-center space-x-2">
                        <select
                          value={orderBranchId}
                          onChange={(e) => {
                            const newBranchId = e.target.value;
                            setOrderBranchId(newBranchId);
                            // Clear cart on branch change because inventory availability is branch-specific
                            if (cart.length > 0) {
                              setCart([]);
                              showToast('Keranjang direset karena cabang diubah', 'warning');
                            }
                          }}
                          className="bg-white border border-teal-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer shadow-xs"
                        >
                          {accessibleBranches.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name} ({b.code}){b.status === 'Inactive' ? ' - Nonaktif' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <span className="font-semibold text-teal-800 bg-white px-2.5 py-0.5 rounded-lg border border-teal-200 shadow-xs">
                        {currentBranch?.name || 'Cabang Ditugaskan'} ({currentBranch?.code})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Search Input */}
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Ketik nama produk atau barcode..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && searchQuery.trim()) {
                            // If user hits Enter on a barcode search
                            handleBarcodeScanned(searchQuery.trim());
                          }
                        }}
                        autoFocus
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-12 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          Hapus
                        </button>
                      )}
                    </div>

                    {/* Scan Barcode Action Button */}
                    <button
                      type="button"
                      onClick={() => setIsScannerOpen(true)}
                      className="flex items-center space-x-1.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs shadow-teal-600/20 active:scale-[0.99] transition-all cursor-pointer shrink-0"
                    >
                      <Barcode className="w-4 h-4" />
                      <span className="hidden sm:inline">Scan Barcode</span>
                    </button>
                  </div>

                  {/* Category Pills */}
                  <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-semibold transition-all cursor-pointer ${
                        selectedCategory === 'all'
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Semua ({availableProducts.length})
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.name)}
                        className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-semibold transition-all cursor-pointer ${
                          selectedCategory === cat.name
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Product Grid */}
                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredProducts.length === 0 ? (
                    <div className="col-span-full py-16 flex flex-col items-center justify-center text-center space-y-2 text-slate-400">
                      {availableProducts.length === 0 ? (
                        <>
                          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-1">
                            <Sparkles className="w-6 h-6" />
                          </div>
                          <p className="text-xs font-bold text-slate-700">Inventaris Masih Kosong</p>
                          <p className="text-[11px] text-slate-400 max-w-xs">
                            Isi langsung dengan 10 produk contoh (Indomie, Aqua, Kopi, Sembako) untuk langsung uji coba transaksi kasir.
                          </p>
                          <button
                            type="button"
                            disabled={isSeeding}
                            onClick={async () => {
                              setIsSeeding(true);
                              try {
                                await seedInitialData();
                              } finally {
                                setIsSeeding(false);
                              }
                            }}
                            className="mt-2 flex items-center space-x-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-all disabled:opacity-50"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{isSeeding ? 'Memuat Data...' : 'Isi 10 Produk Contoh (Seed Data)'}</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <Barcode className="w-10 h-10 text-slate-300" />
                          <p className="text-xs font-medium text-slate-600">Produk tidak ditemukan.</p>
                          <p className="text-[11px] text-slate-400 max-w-xs">
                            Coba kata kunci lain atau scan barcode produk untuk menambahkannya.
                          </p>
                          <button
                            type="button"
                            onClick={() => setIsScannerOpen(true)}
                            className="mt-2 flex items-center space-x-1.5 px-3.5 py-1.5 bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                          >
                            <Barcode className="w-3.5 h-3.5" />
                            <span>Buka Scanner Kamera</span>
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    filteredProducts.map((prod) => {
                      const inCart = cart.find((it) => it.product.id === prod.id);
                      const branchStock = getBranchStock(prod.id);
                      const isOutOfStock = branchStock <= 0;
                      const promoInfo = getProductEffectivePromo(prod, promotions, orderBranchId);

                      return (
                        <div
                          key={prod.id}
                          onClick={() => !isOutOfStock && addToCart(prod)}
                          className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all shadow-xs ${
                            isOutOfStock
                              ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                              : inCart
                              ? 'bg-teal-50/50 border-teal-400 ring-1 ring-teal-300 cursor-pointer'
                              : 'bg-white border-slate-200 hover:border-teal-300 hover:shadow-sm cursor-pointer'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-1 mb-1.5">
                              <span className="text-[10px] font-semibold text-slate-500 px-2 py-0.5 rounded-md bg-slate-100">
                                {prod.category}
                              </span>
                              <div className="flex items-center space-x-1">
                                {promoInfo.hasPromo && (
                                  <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded-md shadow-xs">
                                    {promoInfo.badgeText}
                                  </span>
                                )}
                                {inCart && (
                                  <span className="text-[11px] font-bold text-white bg-teal-600 px-2 py-0.5 rounded-md shadow-xs">
                                    x{inCart.quantity}
                                  </span>
                                )}
                              </div>
                            </div>
                            <h4 className="text-xs sm:text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">
                              {prod.name}
                            </h4>
                            {prod.barcode && (
                              <div className="mt-1 flex items-center space-x-1 text-[10px] text-slate-400 font-mono">
                                <Barcode className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{prod.barcode}</span>
                              </div>
                            )}
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                            <div>
                              {promoInfo.hasPromo ? (
                                <div>
                                  <span className="line-through text-[11px] text-slate-400 block leading-none mb-0.5">
                                    {formatRupiah(prod.sellingPrice)}
                                  </span>
                                  <div className="text-xs sm:text-sm font-bold text-emerald-700">
                                    {formatRupiah(promoInfo.promoPrice)}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs sm:text-sm font-bold text-teal-700">
                                  {formatRupiah(prod.sellingPrice)}
                                </div>
                              )}
                              <div className="text-[10px] text-slate-400">
                                Stok: {branchStock} {prod.unit}
                              </div>
                            </div>
                            <button
                              type="button"
                              disabled={isOutOfStock}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isOutOfStock) addToCart(prod);
                              }}
                              className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-600 text-teal-700 hover:text-white transition-colors cursor-pointer disabled:opacity-30"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Shopping Cart Summary Column */}
              <div className="w-full md:w-80 lg:w-96 flex flex-col bg-white h-64 md:h-auto border-t md:border-t-0 border-slate-200">
                {/* Cart Header */}
                <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center space-x-2">
                    <ShoppingBag className="w-4 h-4 text-teal-600" />
                    <span className="text-sm font-bold text-slate-900">
                      Keranjang Belanja ({totalItemsCount})
                    </span>
                  </div>
                  {cart.length > 0 && (
                    <button
                      onClick={() => setCart([])}
                      className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                    >
                      Kosongkan
                    </button>
                  )}
                </div>

                {/* Cart Items List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                      <ShoppingBag className="w-10 h-10 mb-2.5 text-slate-200" />
                      <p className="text-xs font-medium text-slate-600">Keranjang masih kosong.</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Pilih produk di sebelah kiri atau scan barcode produk.
                      </p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div
                        key={item.product.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-semibold text-slate-800 leading-tight block">
                              {item.product.name}
                            </span>
                            {item.product.barcode && (
                              <span className="text-[10px] text-slate-400 font-mono block">
                                {item.product.barcode}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 ml-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              max={item.product.stock}
                              value={item.quantity}
                              onChange={(e) =>
                                updateQuantity(
                                  item.product.id,
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-10 text-center bg-white border border-slate-200 rounded-lg py-1 text-xs text-slate-800 font-semibold focus:outline-none"
                            />
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              disabled={item.quantity >= item.product.stock}
                              className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer disabled:opacity-30"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="text-right">
                            {(() => {
                              const itemPromo = getProductEffectivePromo(
                                item.product,
                                promotions,
                                orderBranchId
                              );
                              const itemUnitPrice = itemPromo.hasPromo
                                ? itemPromo.promoPrice
                                : item.product.sellingPrice;
                              const itemSubtotal = itemUnitPrice * item.quantity;

                              return (
                                <div>
                                  {itemPromo.hasPromo && (
                                    <div className="flex items-center justify-end space-x-1">
                                      <span className="line-through text-[10px] text-slate-400">
                                        {formatRupiah(item.product.sellingPrice * item.quantity)}
                                      </span>
                                      <span className="text-[9px] font-bold px-1 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                        {itemPromo.badgeText}
                                      </span>
                                    </div>
                                  )}
                                  <div
                                    className={`text-xs font-bold ${
                                      itemPromo.hasPromo ? 'text-emerald-700' : 'text-teal-700'
                                    }`}
                                  >
                                    {formatRupiah(itemSubtotal)}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    @{formatRupiah(itemUnitPrice)}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Cart Bottom Total & Next Button */}
                <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-3">
                  {totalPromoSavings > 0 && (
                    <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                      <span className="flex items-center space-x-1">
                        <BadgePercent className="w-3.5 h-3.5" />
                        <span>Hemat Diskon Promo:</span>
                      </span>
                      <span>-{formatRupiah(totalPromoSavings)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 block">Total Tagihan:</span>
                      {totalPromoSavings > 0 && (
                        <span className="line-through text-[11px] text-slate-400 block">
                          {formatRupiah(originalTotalAmount)}
                        </span>
                      )}
                    </div>
                    <span className="text-lg font-bold text-teal-700">
                      {formatRupiah(totalAmount)}
                    </span>
                  </div>

                  <button
                    disabled={cart.length === 0}
                    onClick={() => setStep(2)}
                    className="w-full flex items-center justify-center space-x-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-xl text-xs font-semibold shadow-md shadow-teal-600/20 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <span>Lanjut ke Pembayaran</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PAYMENT METHOD */}
          {step === 2 && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-2xl mx-auto w-full space-y-6">
              {/* Total Banner */}
              <div className="p-5 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-teal-700 font-medium">Total Tagihan ({totalItemsCount} item):</span>
                  <div className="text-2xl font-bold text-teal-900">
                    {formatRupiah(totalAmount)}
                  </div>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-teal-700 hover:underline cursor-pointer"
                >
                  Ubah Item
                </button>
              </div>

              {/* Sales Channel Selector */}
              <div className="space-y-2.5 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Saluran Penjualan
                  </label>
                  <SalesChannelBadge channel={salesChannel} size="sm" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Offline / Kasir', 'Shopee', 'Tokopedia', 'TikTok Shop', 'GoFood', 'GrabFood', 'ShopeeFood', 'Other'] as SalesChannel[]).map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setSalesChannel(ch)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                        salesChannel === ch
                          ? 'bg-teal-50 border-teal-500 text-teal-800 font-semibold ring-1 ring-teal-300'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>

                {salesChannel !== 'Offline / Kasir' && (
                  <div className="pt-2">
                    <label className="text-[11px] font-medium text-slate-600 block mb-1">
                      Nomor Pesanan Saluran (External Order ID) - Opsional:
                    </label>
                    <input
                      type="text"
                      placeholder={`Contoh: ${salesChannel.substring(0, 3).toUpperCase()}-123456`}
                      value={externalOrderId}
                      onChange={(e) => setExternalOrderId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                )}
              </div>

              {/* Payment Methods Options */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Pilih Metode Pembayaran
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* Cash */}
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('Cash');
                      setIsAddingCustomPayment(false);
                    }}
                    className={`p-4 rounded-2xl border flex flex-col items-center justify-center space-y-2 transition-all cursor-pointer ${
                      paymentMethod === 'Cash' && !isAddingCustomPayment
                        ? 'bg-teal-50 border-teal-500 text-teal-800 ring-2 ring-teal-200'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Banknote className="w-6 h-6 text-teal-600" />
                    <span className="text-xs font-semibold">Tunai (Cash)</span>
                  </button>

                  {/* QRIS */}
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('QRIS');
                      setIsAddingCustomPayment(false);
                    }}
                    className={`p-4 rounded-2xl border flex flex-col items-center justify-center space-y-2 transition-all cursor-pointer ${
                      paymentMethod === 'QRIS' && !isAddingCustomPayment
                        ? 'bg-teal-50 border-teal-500 text-teal-800 ring-2 ring-teal-200'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <QrCode className="w-6 h-6 text-teal-600" />
                    <span className="text-xs font-semibold">QRIS</span>
                  </button>

                  {/* Other / Transfer */}
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomPayment(true)}
                    className={`p-4 rounded-2xl border flex flex-col items-center justify-center space-y-2 transition-all cursor-pointer ${
                      isAddingCustomPayment
                        ? 'bg-teal-50 border-teal-500 text-teal-800 ring-2 ring-teal-200'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <CreditCard className="w-6 h-6 text-teal-600" />
                    <span className="text-xs font-semibold">Metode Lain</span>
                  </button>
                </div>

                {isAddingCustomPayment && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <label className="text-xs font-medium text-slate-700">Nama Metode Pembayaran Lain:</label>
                    <input
                      type="text"
                      placeholder="Misal: Transfer BCA, GoPay, Debit BRI"
                      value={customPaymentName}
                      onChange={(e) => setCustomPaymentName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                )}
              </div>

              {/* Cash Calculation Helper */}
              {paymentMethod === 'Cash' && !isAddingCustomPayment && (
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5">
                  <span className="text-xs font-medium text-slate-700 block">
                    Uang Diterima dari Pembeli:
                  </span>

                  {/* Cash Suggestion Chips */}
                  <div className="flex flex-wrap gap-2">
                    {cashSuggestions.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setCashTendered(amount)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          cashTendered === amount
                            ? 'bg-teal-600 text-white'
                            : 'bg-white border border-slate-200 text-slate-700 hover:border-teal-400'
                        }`}
                      >
                        {amount === totalAmount ? 'Uang Pas' : formatRupiah(amount)}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-[11px] font-medium text-slate-600 block mb-1">Nominal Diterima (Rp):</label>
                      <input
                        type="number"
                        placeholder="Contoh: 50000"
                        value={cashTendered}
                        onChange={(e) =>
                          setCashTendered(
                            e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0)
                          )
                        }
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-semibold focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col justify-center shadow-xs">
                      <span className="text-[11px] font-medium text-slate-500">Uang Kembalian:</span>
                      <span className="text-base font-bold text-teal-700">
                        {formatRupiah(changeAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* QRIS Display Box */}
              {paymentMethod === 'QRIS' && !isAddingCustomPayment && (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center text-center space-y-3">
                  <div className="w-36 h-36 bg-white p-2 rounded-2xl border border-slate-200 flex items-center justify-center shadow-xs">
                    <QrCode className="w-28 h-28 text-slate-800" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900">{settings.name}</h5>
                    <p className="text-xs text-slate-500">NMID: ID1029384756201</p>
                    <p className="text-sm font-bold text-teal-700 mt-1">
                      {formatRupiah(totalAmount)}
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Tunjukkan kode QR kepada pembeli untuk scan pembayaran
                  </span>
                </div>
              )}

              {/* Step 2 Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-xl text-xs font-semibold shadow-md shadow-teal-600/20 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <span>Lihat Ringkasan Pesanan</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: COMPACT CONFIRMATION */}
          {step === 3 && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-xl mx-auto w-full space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-slate-900">Konfirmasi Transaksi</h3>
                <p className="text-xs text-slate-500">Periksa kembali daftar item dan total pembayaran</p>
              </div>

              {/* Order Card */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                {/* Header */}
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                  <span className="text-xs font-semibold text-slate-900">Item Pesanan</span>
                  <span className="text-xs text-slate-500">{totalItemsCount} Total Barang</span>
                </div>

                {/* Items */}
                <div className="p-4 divide-y divide-slate-100 max-h-60 overflow-y-auto">
                  {cart.map((item) => {
                    const itemPromo = getProductEffectivePromo(item.product, promotions, orderBranchId);
                    const itemUnitPrice = itemPromo.hasPromo ? itemPromo.promoPrice : item.product.sellingPrice;
                    const itemSubtotal = itemUnitPrice * item.quantity;

                    return (
                      <div key={item.product.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-semibold text-slate-800 flex items-center space-x-1.5">
                            <span>{item.product.name}</span>
                            {itemPromo.hasPromo && (
                              <span className="text-[9px] font-bold px-1 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                {itemPromo.badgeText}
                              </span>
                            )}
                          </div>
                          <div className="text-slate-400 flex items-center space-x-1.5">
                            <span>{item.quantity} x {formatRupiah(itemUnitPrice)}</span>
                            {itemPromo.hasPromo && (
                              <span className="line-through text-[10px] text-slate-300">
                                {formatRupiah(item.product.sellingPrice)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={`font-bold ${itemPromo.hasPromo ? 'text-emerald-700' : 'text-teal-700'}`}>
                          {formatRupiah(itemSubtotal)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Summary Totals */}
                <div className="p-4 bg-slate-50/50 border-t border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Saluran Penjualan:</span>
                    <SalesChannelBadge channel={salesChannel} size="sm" />
                  </div>

                  {externalOrderId && (
                    <div className="flex justify-between items-center text-slate-600">
                      <span>External Order ID:</span>
                      <span className="font-mono text-slate-800 font-semibold">{externalOrderId}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600">
                    <span>Metode Pembayaran:</span>
                    <span className="text-slate-900 font-semibold">
                      {isAddingCustomPayment && customPaymentName ? customPaymentName : paymentMethod}
                    </span>
                  </div>

                  {totalPromoSavings > 0 && (
                    <>
                      <div className="flex justify-between text-slate-500">
                        <span>Total Normal:</span>
                        <span className="line-through">{formatRupiah(originalTotalAmount)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span className="flex items-center space-x-1">
                          <BadgePercent className="w-3.5 h-3.5" />
                          <span>Hemat Diskon Promo:</span>
                        </span>
                        <span>-{formatRupiah(totalPromoSavings)}</span>
                      </div>
                    </>
                  )}

                  {paymentMethod === 'Cash' && typeof cashTendered === 'number' && (
                    <>
                      <div className="flex justify-between text-slate-600">
                        <span>Uang Diterima:</span>
                        <span className="text-slate-900 font-semibold">{formatRupiah(cashTendered)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Kembalian:</span>
                        <span className="text-teal-700 font-bold">{formatRupiah(changeAmount)}</span>
                      </div>
                    </>
                  )}

                  <div className="pt-2.5 border-t border-slate-200 flex justify-between items-center text-sm">
                    <span className="font-semibold text-slate-800">Total Pembayaran:</span>
                    <span className="text-lg font-bold text-teal-700">
                      {formatRupiah(totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 3 Actions */}
              <div className="flex items-center justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Edit Pesanan
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmOrder}
                  className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white px-6 py-2.5 rounded-xl text-xs font-semibold shadow-md shadow-teal-600/20 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Memproses...' : 'Konfirmasi & Selesaikan'}</span>
                </button>
              </div>
            </div>
          )}

          {/* SUCCESS RECEIPT STATE */}
          {step === 'success' && completedOrder && (
            <div className="flex-1 overflow-y-auto p-6 max-w-md mx-auto w-full space-y-5 animate-in fade-in duration-200">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Transaksi Berhasil!</h3>
                <p className="text-xs text-slate-500">
                  Stok otomatis berkurang dan penjualan dicatat dalam laporan keuangan.
                </p>
              </div>

              {/* Hardware / Cash Drawer Status Notification */}
              {cashDrawerResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex flex-col gap-2 ${
                    cashDrawerResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          cashDrawerResult.success ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {cashDrawerResult.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      </div>
                      <span className="font-semibold text-xs">{cashDrawerResult.message}</span>
                    </div>
                  </div>

                  {!cashDrawerResult.success && (
                    <div className="flex items-center space-x-2 pt-1.5 border-t border-amber-200">
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await triggerCashDrawerOpen();
                          if (res.success) {
                            setCashDrawerResult({
                              triggered: true,
                              success: true,
                              message: 'Cash payment recorded. Cash drawer opened.',
                            });
                          }
                        }}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        Coba Buka Laci Lagi (Retry)
                      </button>
                      <span className="text-[10px] text-amber-700">Pembayaran tetap tersimpan aman.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Thermal Receipt Preview */}
              <div className="p-5 bg-white border border-slate-200 rounded-2xl text-xs space-y-3 font-mono shadow-sm text-slate-800">
                <div className="text-center border-b border-slate-200 pb-3 font-sans">
                  <h4 className="font-bold text-sm text-slate-900">{settings.name}</h4>
                  <div className="inline-flex items-center space-x-1 text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 mt-1">
                    <Building2 className="w-3 h-3 text-teal-600" />
                    <span>{completedOrder.branchName || 'Cabang Utama'}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">{settings.address}</p>
                  <p className="text-[10px] text-slate-500">Telp: {settings.phone}</p>
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-500 border-b border-slate-200 pb-2">
                  <span>{completedOrder.id}</span>
                  <div className="flex items-center gap-1.5 font-sans">
                    <SalesChannelBadge channel={completedOrder.salesChannel || 'Offline / Kasir'} size="sm" />
                    <span>{formatTime(completedOrder.createdAt)}</span>
                  </div>
                </div>

                {completedOrder.externalOrderId && (
                  <div className="flex justify-between text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded font-mono">
                    <span>Saluran Ref:</span>
                    <span className="font-bold text-slate-900">{completedOrder.externalOrderId}</span>
                  </div>
                )}

                {/* Items */}
                <div className="space-y-1.5 py-1">
                  {completedOrder.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-slate-700">
                      <span className="truncate pr-2">
                        {it.productName} x{it.quantity}
                      </span>
                      <span className="font-semibold text-slate-900">{formatRupiah(it.subtotal)}</span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t border-slate-200 pt-2.5 space-y-1">
                  {completedOrder.discountTotal && completedOrder.discountTotal > 0 ? (
                    <div className="flex justify-between text-emerald-700 text-[11px] font-semibold">
                      <span>Hemat Promo:</span>
                      <span>-{formatRupiah(completedOrder.discountTotal)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between font-bold text-sm text-teal-700">
                    <span>TOTAL:</span>
                    <span>{formatRupiah(completedOrder.total)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>Metode:</span>
                    <span className="font-medium text-slate-900">{completedOrder.paymentMethod}</span>
                  </div>
                  {completedOrder.cashTendered && (
                    <>
                      <div className="flex justify-between text-slate-600 text-[11px]">
                        <span>Tunai:</span>
                        <span>{formatRupiah(completedOrder.cashTendered)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 text-[11px]">
                        <span>Kembalian:</span>
                        <span className="font-bold text-teal-700">{formatRupiah(completedOrder.changeAmount || 0)}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="text-center pt-2.5 border-t border-slate-200 text-[10px] text-slate-400">
                  Terima kasih atas kunjungan Anda!
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={resetOrder}
                  className="w-full flex items-center justify-center space-x-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white py-3 rounded-xl text-xs font-semibold shadow-md shadow-teal-600/20 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <RefreshCcw className="w-4 h-4" />
                  <span>Buat Transaksi Baru</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerCashDrawerOpen();
                      showToast('Perintah buka laci kasir (Cash Drawer Kick) dikirim!', 'success');
                    }}
                    className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    title="Buka laci uang kasir secara manual"
                  >
                    <Vault className="w-3.5 h-3.5 text-teal-600" />
                    <span>Buka Laci Uang</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Selesai & Tutup
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Barcode Scanner Camera Modal */}
      {isScannerOpen && (
        <BarcodeScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={(code) => {
            handleBarcodeScanned(code);
          }}
          title="Kasir: Scan Barcode Produk"
          subtitle="Arahkan kamera ke barcode produk untuk menambah langsung ke keranjang"
        />
      )}

      {/* UNREGISTERED BARCODE PROMPT MODAL */}
      {unregisteredBarcode && !isQuickCreateOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <Barcode className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900">Produk Tidak Ditemukan</h4>
              <p className="text-xs text-slate-500">
                Barcode belum terdaftar dalam sistem inventaris.
              </p>
              <div className="pt-2">
                <span className="inline-block px-3 py-1 bg-slate-100 border border-slate-200 text-slate-800 font-mono text-xs font-bold rounded-xl">
                  {unregisteredBarcode}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => setIsQuickCreateOpen(true)}
                className="w-full flex items-center justify-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <PackagePlus className="w-4 h-4" />
                <span>Daftarkan Produk Baru</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUnregisteredBarcode(null);
                  setIsScannerOpen(true);
                }}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Scan Barcode Lain
              </button>

              <button
                type="button"
                onClick={() => setUnregisteredBarcode(null)}
                className="w-full py-1.5 text-xs text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK PRODUCT REGISTRATION MODAL WITH PRE-FILLED BARCODE */}
      {isQuickCreateOpen && unregisteredBarcode && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center space-x-2">
                <PackagePlus className="w-5 h-5 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">Daftarkan Produk Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickCreateSubmit} className="p-5 space-y-3.5 text-xs">
              {/* Pre-filled Barcode badge */}
              <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Barcode className="w-4 h-4 text-teal-600" />
                  <span className="font-mono font-bold text-teal-900">{unregisteredBarcode}</span>
                </div>
                <span className="text-[10px] font-semibold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-md">
                  Barcode Baru
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Produk <span className="text-teal-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Misal: Kopi Susu ABC 200ml"
                  value={quickProdName}
                  onChange={(e) => setQuickProdName(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={quickProdCategory}
                    onChange={(e) => setQuickProdCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Satuan</label>
                  <input
                    type="text"
                    placeholder="Pcs / Btl / Bks"
                    value={quickProdUnit}
                    onChange={(e) => setQuickProdUnit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Harga Jual (Rp) <span className="text-teal-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Contoh: 5000"
                    value={quickProdSellingPrice}
                    onChange={(e) => setQuickProdSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    HPP per Item (Rp) <span className="text-teal-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Contoh: 3800"
                    value={quickProdCogs}
                    onChange={(e) => setQuickProdCogs(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Stok Awal</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Contoh: 12"
                  value={quickProdStock}
                  onChange={(e) => setQuickProdStock(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsQuickCreateOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  Simpan & Tambah ke Keranjang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
