'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Product, PaymentMethod, Order, SalesChannel, CartItem } from '@/types';
import { formatRupiah } from '@/lib/utils';
import { INITIAL_BRANCHES } from '@/lib/storage';
import { BarcodeScannerModal } from '@/components/BarcodeScannerModal';
import { triggerCashDrawerOpen } from '@/lib/hardwareBridge';
import { calculateOrderSavings } from '@/services/promotionService';
import {
  X,
  ShoppingBag,
  Building2,
  Unlock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

import { PosProductCatalog } from '@/components/pos/PosProductCatalog';
import { PosCartPanel } from '@/components/pos/PosCartPanel';
import { PosPaymentStep } from '@/components/pos/PosPaymentStep';
import { PosOrderConfirmationStep } from '@/components/pos/PosOrderConfirmationStep';
import { PosReceiptModal } from '@/components/pos/PosReceiptModal';
import { QuickProductRegisterModal } from '@/components/pos/QuickProductRegisterModal';

interface CreateOrderModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  isFullPage?: boolean;
}

export function CreateOrderModal({ onClose, isFullPage = false }: CreateOrderModalProps) {
  const {
    products,
    promotions,
    categories,
    createOrder,
    seedInitialData,
    settings,
    setIsCreateOrderModalOpen,
    branches,
    activeBranchId,
    getProductStockInBranch,
    canSwitchToAllBranches,
    accessibleBranches,
    cashierShifts,
    openShiftModal,
    addCustomerReceivable,
  } = useApp();

  const validBranches = useMemo(() => {
    if (accessibleBranches && accessibleBranches.length > 0) return accessibleBranches;
    if (branches && branches.length > 0) return branches;
    return INITIAL_BRANCHES;
  }, [accessibleBranches, branches]);

  const defaultBranchId = useMemo(() => {
    if (activeBranchId !== 'all' && validBranches.some((b) => b.id === activeBranchId)) return activeBranchId;
    const activeAccessible = validBranches.find((b) => b.status === 'Active');
    return activeAccessible?.id || validBranches[0]?.id || 'branch-1';
  }, [activeBranchId, validBranches]);

  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  const orderBranchId = useMemo(() => {
    if (selectedBranchId && validBranches.some((b) => b.id === selectedBranchId)) {
      return selectedBranchId;
    }
    return defaultBranchId;
  }, [selectedBranchId, validBranches, defaultBranchId]);

  const currentBranch = useMemo(() => {
    return validBranches.find((b) => b.id === orderBranchId) || validBranches[0];
  }, [validBranches, orderBranchId]);

  const currentBranchShift = useMemo(() => {
    return cashierShifts.find((s) => s.status === 'Open' && s.branchId === orderBranchId) || null;
  }, [cashierShifts, orderBranchId]);

  // Stepper state
  const [step, setStep] = useState<1 | 2 | 3 | 'success'>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isSeeding, setIsSeeding] = useState(false);

  // Barcode Scanning State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanToast, setScanToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);
  const [unregisteredBarcode, setUnregisteredBarcode] = useState<string | null>(null);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mobilePosTab, setMobilePosTab] = useState<'catalog' | 'cart'>('catalog');

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [customPaymentName, setCustomPaymentName] = useState('');
  const [isAddingCustomPayment, setIsAddingCustomPayment] = useState(false);
  const [cashTendered, setCashTendered] = useState<number | ''>('');
  const [selectedBank, setSelectedBank] = useState('BCA');
  const [transferRefNumber, setTransferRefNumber] = useState('');
  const [qrisRrnNumber, setQrisRrnNumber] = useState('');
  const [edcMachine, setEdcMachine] = useState('EDC BCA');
  const [cardBrand, setCardBrand] = useState('Visa');
  const [cardTraceNumber, setCardTraceNumber] = useState('');
  const [bonCustomerName, setBonCustomerName] = useState('');
  const [bonCustomerPhone, setBonCustomerPhone] = useState('');
  const [bonDueDate, setBonDueDate] = useState(() => {
    const d = new Date(Date.now() + 7 * 86400000);
    return d.toISOString().slice(0, 10);
  });
  const [bonNotes, setBonNotes] = useState('');
  const [salesChannel, setSalesChannel] = useState<SalesChannel>('Offline / Kasir');
  const [externalOrderId, setExternalOrderId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cashDrawerResult, setCashDrawerResult] = useState<{
    triggered: boolean;
    success: boolean;
    message: string;
  } | null>(null);

  // Completed order
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Active products only
  const availableProducts = useMemo(() => {
    return products.filter((p) => !p.isArchived);
  }, [products]);

  const getBranchStock = (productId: string) => {
    return getProductStockInBranch(productId, orderBranchId);
  };

  // Filter products by search & category
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

  // Cart calculations with promotion and savings
  const cartSavings = useMemo(() => {
    return calculateOrderSavings(cart, promotions, orderBranchId);
  }, [cart, promotions, orderBranchId]);

  const totalAmount = cartSavings.subtotalFinal;
  const originalTotalAmount = cartSavings.subtotalOriginal;
  const totalPromoSavings = cartSavings.totalSavings;
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const numCashTendered = typeof cashTendered === 'number' ? cashTendered : totalAmount;
  const changeAmount = Math.max(0, numCashTendered - totalAmount);

  // Toast feedback
  const showToast = (message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setScanToast({ message, type });
    setTimeout(() => {
      setScanToast((prev) => (prev?.message === message ? null : prev));
    }, 3000);
  };

  // Cart Actions
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

  // Barcode scanned
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
      setUnregisteredBarcode(cleanCode);
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

    if (paymentMethod === 'Kasbon' && !bonCustomerName.trim()) {
      alert('Mohon isi nama pelanggan untuk mencatat transaksi Kasbon / Bon Tempo!');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalPayment: string = paymentMethod;

      if (isAddingCustomPayment && customPaymentName.trim()) {
        finalPayment = customPaymentName.trim();
      } else if (paymentMethod === 'Transfer') {
        finalPayment = `Transfer ${selectedBank}${transferRefNumber.trim() ? ` (Ref: ${transferRefNumber.trim()})` : ''}`;
      } else if (paymentMethod === 'QRIS') {
        finalPayment = `QRIS${qrisRrnNumber.trim() ? ` (RRN: ${qrisRrnNumber.trim()})` : ''}`;
      } else if (paymentMethod === 'Debit') {
        finalPayment = `Debit ${edcMachine}${cardTraceNumber.trim() ? ` (Trace: ${cardTraceNumber.trim()})` : ''}`;
      } else if (paymentMethod === 'Credit') {
        finalPayment = `Kredit ${cardBrand}${cardTraceNumber.trim() ? ` (Trace: ${cardTraceNumber.trim()})` : ''}`;
      } else if (paymentMethod === 'Kasbon') {
        finalPayment = `Kasbon (${bonCustomerName.trim()})`;
      }

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
        if (paymentMethod === 'Kasbon' && addCustomerReceivable) {
          const itemSummary = cart.map((i) => `${i.product.name} x${i.quantity}`).join(', ');
          await addCustomerReceivable({
            customerName: bonCustomerName.trim(),
            customerPhone: bonCustomerPhone.trim() || undefined,
            notes: `Bon Kasir Transaksi #${order.id}. Barang: ${itemSummary}${bonNotes.trim() ? ` (${bonNotes.trim()})` : ''}`,
            totalAmount: order.total,
            dueDate: bonDueDate,
            branchId: orderBranchId,
          });
        }

        setCompletedOrder(order);
        setStep('success');

        if (paymentMethod === 'Cash') {
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

  // Quick cash amount suggestions
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
    <div
      className={
        isFullPage
          ? 'w-full relative'
          : 'fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150'
      }
    >
      <div
        className={`relative w-full bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col ${
          isFullPage
            ? 'shadow-xs min-h-[720px] lg:h-[calc(100vh-165px)]'
            : 'max-w-5xl shadow-2xl h-[92vh]'
        }`}
      >
        {/* Top Toast Banner */}
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
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <ShoppingBag className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Kasir & Transaksi Baru
              </h2>
            </div>
          </div>

          {/* Stepper indicator */}
          {step !== 'success' && (
            <>
              {/* Mobile compact step badge */}
              <div className="sm:hidden flex items-center space-x-1.5 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                <span className="text-[11px] font-bold text-teal-800">
                  {step === 1 ? `1/3 Item (${totalItemsCount})` : step === 2 ? '2/3 Bayar' : '3/3 Konfirmasi'}
                </span>
              </div>

              {/* Desktop Stepper */}
              <div className="hidden sm:flex items-center space-x-2 text-xs font-semibold">
                <button
                  type="button"
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
                  type="button"
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
                  type="button"
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
            </>
          )}

          {isFullPage ? (
            step === 1 && cart.length > 0 ? (
              <button
                type="button"
                onClick={() => setCart([])}
                className="text-xs text-rose-600 hover:text-rose-700 px-3 py-1.5 rounded-xl hover:bg-rose-50 border border-rose-200/60 font-semibold transition-colors cursor-pointer"
                title="Kosongkan keranjang belanja"
              >
                Kosongkan Keranjang
              </button>
            ) : step === 2 || step === 3 ? (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-slate-600 hover:text-slate-800 px-3 py-1.5 rounded-xl hover:bg-slate-100 border border-slate-200 font-semibold transition-colors cursor-pointer"
              >
                Kembali ke Keranjang
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClose}
                className="text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Riwayat Transaksi &rarr;
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              title="Tutup Kasir"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Main Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* STEP 1: ITEM SELECTION & CART */}
          {step === 1 && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Branch Context & Shift Info Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-teal-50/60 border-b border-teal-200/80 text-xs">
                {/* Branch selector */}
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-teal-700 shrink-0" />
                  <span className="text-slate-600 font-medium hidden sm:inline">Cabang:</span>

                  {canSwitchToAllBranches ? (
                    <select
                      id="pos-branch-select"
                      value={orderBranchId}
                      onChange={(e) => {
                        const newBranchId = e.target.value;
                        setSelectedBranchId(newBranchId);
                        if (cart.length > 0) {
                          setCart([]);
                          showToast('Keranjang direset karena cabang diubah', 'warning');
                        }
                      }}
                      className="bg-white border border-teal-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer shadow-xs"
                    >
                      {validBranches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code}){b.status === 'Inactive' ? ' - Nonaktif' : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="font-semibold text-teal-800 bg-white px-2.5 py-0.5 rounded-lg border border-teal-200 shadow-xs">
                      {currentBranch?.name || 'Cabang Ditugaskan'} ({currentBranch?.code})
                    </span>
                  )}
                </div>

                {/* Cash Drawer Quick Status */}
                {currentBranchShift && (
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      id="pos-cash-drawer-status-btn"
                      onClick={() => openShiftModal(orderBranchId)}
                      className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white border border-teal-200 hover:bg-teal-50 text-teal-900 text-[11px] font-medium transition-colors cursor-pointer shadow-2xs"
                      title={`Shift Aktif (${currentBranchShift.shiftNumber}) - Klik untuk kelola laci kasir atau tutup buku`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <span className="text-teal-700 hidden md:inline">Kas Laci:</span>
                      <span className="font-bold font-mono text-teal-900">
                        {formatRupiah(currentBranchShift.expectedEndingCash)}
                      </span>
                    </button>
                    <button
                      type="button"
                      id="pos-trigger-drawer-btn"
                      onClick={async () => {
                        const res = await triggerCashDrawerOpen();
                        showToast(
                          res.success ? 'Sinyal buka laci kasir terkirim' : 'Simulasi laci kasir terbuka (mode web)',
                          res.success ? 'success' : 'warning'
                        );
                      }}
                      className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer shadow-2xs"
                      title="Buka Laci Kasir (Drawer Kick)"
                    >
                      <Unlock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span className="hidden lg:inline">Buka Laci</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Catalog vs Cart Switcher */}
              <div className="flex md:hidden items-center p-1.5 bg-slate-100 border-b border-slate-200 shrink-0 gap-1.5">
                <button
                  type="button"
                  onClick={() => setMobilePosTab('catalog')}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                    mobilePosTab === 'catalog'
                      ? 'bg-white text-teal-800 shadow-xs ring-1 ring-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Katalog Produk</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-200 text-slate-700 font-medium">
                    {filteredProducts.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobilePosTab('cart')}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                    mobilePosTab === 'cart'
                      ? 'bg-white text-teal-800 shadow-xs ring-1 ring-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Keranjang</span>
                  {totalItemsCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-teal-600 text-white font-bold">
                      {totalItemsCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Step 1 Two Columns: Catalog + Cart */}
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                <PosProductCatalog
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  categories={categories}
                  availableProducts={availableProducts}
                  filteredProducts={filteredProducts}
                  cart={cart}
                  promotions={promotions}
                  orderBranchId={orderBranchId}
                  getBranchStock={getBranchStock}
                  onAddToCart={addToCart}
                  onBarcodeScanned={handleBarcodeScanned}
                  onOpenScanner={() => setIsScannerOpen(true)}
                  onSeedInitialData={async () => {
                    setIsSeeding(true);
                    try {
                      await seedInitialData();
                    } finally {
                      setIsSeeding(false);
                    }
                  }}
                  isSeeding={isSeeding}
                  mobilePosTab={mobilePosTab}
                  setMobilePosTab={setMobilePosTab}
                  totalItemsCount={totalItemsCount}
                  totalAmount={totalAmount}
                  formatRupiah={formatRupiah}
                />

                <PosCartPanel
                  cart={cart}
                  mobilePosTab={mobilePosTab}
                  setMobilePosTab={setMobilePosTab}
                  totalItemsCount={totalItemsCount}
                  totalAmount={totalAmount}
                  originalTotalAmount={originalTotalAmount}
                  totalPromoSavings={totalPromoSavings}
                  promotions={promotions}
                  orderBranchId={orderBranchId}
                  onClearCart={() => setCart([])}
                  onRemoveFromCart={removeFromCart}
                  onUpdateQuantity={updateQuantity}
                  onNextToPayment={() => setStep(2)}
                  formatRupiah={formatRupiah}
                />
              </div>
            </div>
          )}

          {/* STEP 2: PAYMENT METHOD */}
          {step === 2 && (
            <PosPaymentStep
              totalAmount={totalAmount}
              totalItemsCount={totalItemsCount}
              salesChannel={salesChannel}
              setSalesChannel={setSalesChannel}
              externalOrderId={externalOrderId}
              setExternalOrderId={setExternalOrderId}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              isAddingCustomPayment={isAddingCustomPayment}
              setIsAddingCustomPayment={setIsAddingCustomPayment}
              customPaymentName={customPaymentName}
              setCustomPaymentName={setCustomPaymentName}
              cashSuggestions={cashSuggestions}
              cashTendered={cashTendered}
              setCashTendered={setCashTendered}
              changeAmount={changeAmount}
              currentBranch={currentBranch}
              currentBranchShift={currentBranchShift}
              settings={settings}
              selectedBank={selectedBank}
              setSelectedBank={setSelectedBank}
              transferRefNumber={transferRefNumber}
              setTransferRefNumber={setTransferRefNumber}
              qrisRrnNumber={qrisRrnNumber}
              setQrisRrnNumber={setQrisRrnNumber}
              edcMachine={edcMachine}
              setEdcMachine={setEdcMachine}
              cardBrand={cardBrand}
              setCardBrand={setCardBrand}
              cardTraceNumber={cardTraceNumber}
              setCardTraceNumber={setCardTraceNumber}
              bonCustomerName={bonCustomerName}
              setBonCustomerName={setBonCustomerName}
              bonCustomerPhone={bonCustomerPhone}
              setBonCustomerPhone={setBonCustomerPhone}
              bonDueDate={bonDueDate}
              setBonDueDate={setBonDueDate}
              bonNotes={bonNotes}
              setBonNotes={setBonNotes}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
              formatRupiah={formatRupiah}
            />
          )}

          {/* STEP 3: CONFIRMATION */}
          {step === 3 && (
            <PosOrderConfirmationStep
              cart={cart}
              promotions={promotions}
              orderBranchId={orderBranchId}
              totalItemsCount={totalItemsCount}
              totalAmount={totalAmount}
              originalTotalAmount={originalTotalAmount}
              totalPromoSavings={totalPromoSavings}
              salesChannel={salesChannel}
              externalOrderId={externalOrderId}
              paymentMethod={paymentMethod}
              isAddingCustomPayment={isAddingCustomPayment}
              customPaymentName={customPaymentName}
              selectedBank={selectedBank}
              edcMachine={edcMachine}
              cardBrand={cardBrand}
              bonCustomerName={bonCustomerName}
              cashTendered={cashTendered}
              changeAmount={changeAmount}
              isSubmitting={isSubmitting}
              onEditOrder={() => setStep(1)}
              onConfirmOrder={handleConfirmOrder}
              formatRupiah={formatRupiah}
            />
          )}

          {/* STEP SUCCESS: THERMAL RECEIPT */}
          {step === 'success' && completedOrder && (
            <PosReceiptModal
              completedOrder={completedOrder}
              cashDrawerResult={cashDrawerResult}
              onSetCashDrawerResult={setCashDrawerResult}
              onResetOrder={resetOrder}
              onClose={handleClose}
              isFullPage={isFullPage}
            />
          )}
        </div>
      </div>

      {/* Barcode Camera Scanner Modal */}
      {isScannerOpen && (
        <BarcodeScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={(barcode) => {
            setIsScannerOpen(false);
            handleBarcodeScanned(barcode);
          }}
        />
      )}

      {/* Quick Register Modal for Unrecognized Barcodes */}
      {unregisteredBarcode && (
        <QuickProductRegisterModal
          barcode={unregisteredBarcode}
          categories={categories}
          orderBranchId={orderBranchId}
          onClose={() => setUnregisteredBarcode(null)}
          onScanAnother={() => {
            setUnregisteredBarcode(null);
            setIsScannerOpen(true);
          }}
          onProductCreated={(newProd) => {
            setUnregisteredBarcode(null);
            addToCart(newProd);
          }}
        />
      )}
    </div>
  );
}
