import { Product, ProductInventory } from '@/types';

export type StockStatusType = 'out_of_stock' | 'low_stock' | 'in_stock';

export interface StockStatusInfo {
  status: StockStatusType;
  label: string;
  badgeClass: string;
}

/**
 * Calculates gross profit in IDR
 */
export function calculateProfit(sellingPrice: number, cogs: number): number {
  return Math.max(0, (sellingPrice || 0) - (cogs || 0));
}

/**
 * Calculates profit margin percentage: ((Price - COGS) / Price) * 100
 */
export function calculateMarginPercentage(sellingPrice: number, cogs: number): number {
  if (!sellingPrice || sellingPrice <= 0) return 0;
  const profit = sellingPrice - (cogs || 0);
  return Math.round((profit / sellingPrice) * 100);
}

/**
 * Calculates markup percentage: ((Price - COGS) / COGS) * 100
 */
export function calculateMarkupPercentage(sellingPrice: number, cogs: number): number {
  if (!cogs || cogs <= 0) return 0;
  const markup = ((sellingPrice - cogs) / cogs) * 100;
  return Math.round(markup);
}

/**
 * Determines stock status of a product (or product at a specific branch)
 */
export function getProductStockStatus(
  currentStock: number,
  minThreshold: number = 5
): StockStatusInfo {
  if (currentStock <= 0) {
    return {
      status: 'out_of_stock',
      label: 'Stok Habis',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
    };
  }
  if (currentStock <= minThreshold) {
    return {
      status: 'low_stock',
      label: 'Stok Menipis',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    };
  }
  return {
    status: 'in_stock',
    label: 'Tersedia',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };
}

/**
 * Calculates total valuation of inventory (total stock * cogs)
 */
export function calculateTotalInventoryValue(
  products: Product[],
  inventories?: ProductInventory[],
  branchId?: string
): { totalItems: number; totalCostValue: number; totalRetailValue: number } {
  let totalItems = 0;
  let totalCostValue = 0;
  let totalRetailValue = 0;

  for (const product of products) {
    if (product.isArchived) continue;

    let stock = product.stock;
    if (branchId && inventories && inventories.length > 0) {
      const branchInv = inventories.find(
        (inv) => inv.productId === product.id && inv.branchId === branchId
      );
      stock = branchInv ? branchInv.stock : 0;
    }

    totalItems += Math.max(0, stock);
    totalCostValue += Math.max(0, stock) * (product.cogs || 0);
    totalRetailValue += Math.max(0, stock) * (product.sellingPrice || 0);
  }

  return { totalItems, totalCostValue, totalRetailValue };
}

/**
 * Generates an automatic SKU code based on category and product initials
 */
export function generateAutoSku(categoryName: string, productName: string): string {
  const catPrefix = (categoryName || 'GEN')
    .slice(0, 3)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, 'X');
  const prodSlug = (productName || 'ITEM')
    .split(' ')
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 4);
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `${catPrefix}-${prodSlug || 'PRD'}-${randomSuffix}`;
}

/**
 * Filters and searches products by keyword, category, rack, and stock condition
 */
export interface ProductFilterOptions {
  searchQuery?: string;
  categoryFilter?: string;
  rackFilter?: string;
  stockFilter?: 'all' | 'low' | 'out' | 'available' | 'archived';
}

export function filterProducts(
  products: Product[],
  options: ProductFilterOptions
): Product[] {
  const { searchQuery = '', categoryFilter = 'all', rackFilter = 'all', stockFilter = 'all' } = options;
  const q = searchQuery.toLowerCase().trim();

  return products.filter((p) => {
    // Archive condition
    if (stockFilter === 'archived') {
      if (!p.isArchived) return false;
    } else {
      if (p.isArchived) return false;
    }

    // Category filter
    if (categoryFilter !== 'all' && p.category !== categoryFilter) {
      return false;
    }

    // Rack filter
    if (rackFilter !== 'all' && p.rackId !== rackFilter) {
      return false;
    }

    // Stock condition filter
    if (stockFilter === 'low') {
      const threshold = p.minStockThreshold ?? 5;
      if (p.stock <= 0 || p.stock > threshold) return false;
    } else if (stockFilter === 'out') {
      if (p.stock > 0) return false;
    } else if (stockFilter === 'available') {
      if (p.stock <= 0) return false;
    }

    // Search query matching (name, barcode, sku, category)
    if (q) {
      const matchName = p.name.toLowerCase().includes(q);
      const matchBarcode = p.barcode ? p.barcode.toLowerCase().includes(q) : false;
      const matchSku = p.sku ? p.sku.toLowerCase().includes(q) : false;
      const matchCat = p.category.toLowerCase().includes(q);
      if (!matchName && !matchBarcode && !matchSku && !matchCat) return false;
    }

    return true;
  });
}
