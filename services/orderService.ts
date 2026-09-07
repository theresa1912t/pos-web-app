import { Order, OrderItem, SalesChannel, PaymentMethod, DateFilterType, DateRange } from '@/types';
import { isDateInFilter } from '@/lib/utils';

export interface OrderCalculationSummary {
  subtotal: number;
  totalCogs: number;
  totalProfit: number;
  totalItemsCount: number;
  marginPercent: number;
}

/**
 * Calculates financial metrics for a set of order items
 */
export function calculateOrderItemsSummary(items: OrderItem[]): OrderCalculationSummary {
  let subtotal = 0;
  let totalCogs = 0;
  let totalItemsCount = 0;

  for (const item of items) {
    const qty = item.quantity || 0;
    const price = item.sellingPrice || 0;
    const cogs = item.cogs || 0;

    subtotal += price * qty;
    totalCogs += cogs * qty;
    totalItemsCount += qty;
  }

  const totalProfit = Math.max(0, subtotal - totalCogs);
  const marginPercent = subtotal > 0 ? Math.round((totalProfit / subtotal) * 100) : 0;

  return {
    subtotal,
    totalCogs,
    totalProfit,
    totalItemsCount,
    marginPercent,
  };
}

/**
 * Generates intuitive quick cash suggestions based on total bill amount (Rupiah denominations)
 */
export function generateCashSuggestions(totalAmount: number): number[] {
  if (totalAmount <= 0) return [0];

  const suggestions = new Set<number>();
  // 1. Exact amount
  suggestions.add(totalAmount);

  // Common Indonesian currency denominations
  const roundTo = (val: number, step: number) => Math.ceil(val / step) * step;

  if (totalAmount < 10000) {
    suggestions.add(10000);
    suggestions.add(20000);
    suggestions.add(50000);
  } else if (totalAmount < 20000) {
    suggestions.add(20000);
    suggestions.add(50000);
    suggestions.add(100000);
  } else if (totalAmount < 50000) {
    const next10k = roundTo(totalAmount, 10000);
    if (next10k > totalAmount) suggestions.add(next10k);
    suggestions.add(50000);
    suggestions.add(100000);
  } else if (totalAmount < 100000) {
    const next20k = roundTo(totalAmount, 20000);
    if (next20k > totalAmount) suggestions.add(next20k);
    suggestions.add(100000);
    suggestions.add(150000);
  } else {
    const next50k = roundTo(totalAmount, 50000);
    if (next50k > totalAmount) suggestions.add(next50k);
    const next100k = roundTo(totalAmount, 100000);
    if (next100k > totalAmount && next100k !== next50k) suggestions.add(next100k);
    suggestions.add(next100k + 50000);
  }

  return Array.from(suggestions).sort((a, b) => a - b).slice(0, 4);
}

/**
 * Calculates cash change return
 */
export function calculateCashChange(cashTendered: number, totalAmount: number): number {
  return Math.max(0, (cashTendered || 0) - (totalAmount || 0));
}

/**
 * Filters orders with date, channel, payment, search, and branch constraints
 */
export interface OrderFilterOptions {
  searchQuery?: string;
  salesChannel?: SalesChannel | 'all';
  paymentMethod?: PaymentMethod | 'all';
  status?: 'Finished' | 'Canceled' | 'all';
  dateFilterType?: DateFilterType;
  customDateRange?: DateRange;
  branchId?: string | 'all';
}

export function filterOrders(orders: Order[], options: OrderFilterOptions): Order[] {
  const {
    searchQuery = '',
    salesChannel = 'all',
    paymentMethod = 'all',
    status = 'all',
    dateFilterType,
    customDateRange,
    branchId = 'all',
  } = options;

  const query = searchQuery.toLowerCase().trim();

  return orders.filter((order) => {
    // Branch filter
    if (branchId !== 'all' && order.branchId && order.branchId !== branchId) {
      return false;
    }

    // Status filter
    if (status !== 'all' && order.status !== status) {
      return false;
    }

    // Sales channel filter
    if (salesChannel !== 'all' && order.salesChannel !== salesChannel) {
      return false;
    }

    // Payment method filter
    if (paymentMethod !== 'all' && order.paymentMethod !== paymentMethod) {
      return false;
    }

    // Date filter
    if (dateFilterType && !isDateInFilter(order.createdAt, dateFilterType, customDateRange)) {
      return false;
    }

    // Search query
    if (query) {
      const matchId = order.id.toLowerCase().includes(query);
      const matchExternal = order.externalOrderId?.toLowerCase().includes(query);
      const matchItems = order.items.some((item) =>
        item.productName.toLowerCase().includes(query)
      );
      if (!matchId && !matchExternal && !matchItems) return false;
    }

    return true;
  });
}
