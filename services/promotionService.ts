import { Product, Promotion, PromotionStatus, PromotionType, Order } from '@/types';

/**
 * Validates whether a promotion is currently active according to date range and active flag
 */
export function isPromotionActive(promo: Promotion, currentDate = new Date()): boolean {
  if (!promo.isActive) return false;

  const nowTime = currentDate.getTime();
  const start = new Date(`${promo.startDate}T00:00:00`).getTime();
  const end = new Date(`${promo.endDate}T23:59:59`).getTime();

  return nowTime >= start && nowTime <= end;
}

/**
 * Returns human-readable status for a promotion
 */
export function getPromotionStatus(promo: Promotion, currentDate = new Date()): PromotionStatus {
  if (!promo.isActive) return 'inactive';

  const nowTime = currentDate.getTime();
  const start = new Date(`${promo.startDate}T00:00:00`).getTime();
  const end = new Date(`${promo.endDate}T23:59:59`).getTime();

  if (nowTime < start) return 'scheduled';
  if (nowTime > end) return 'ended';
  return 'active';
}

/**
 * Calculates promo price, savings, and checks for margin protection against COGS (HPP)
 */
export function calculatePromoPrice(
  originalPrice: number,
  cogs: number,
  type: PromotionType,
  discountValue: number
): {
  promoPrice: number;
  discountAmount: number;
  discountPercent: number;
  isBelowCogs: boolean;
  profitMargin: number;
} {
  let promoPrice = originalPrice;

  if (type === 'percentage') {
    const pct = Math.min(100, Math.max(0, discountValue));
    const cut = Math.round(originalPrice * (pct / 100));
    promoPrice = Math.max(0, originalPrice - cut);
  } else if (type === 'fixed_discount') {
    promoPrice = Math.max(0, originalPrice - discountValue);
  } else if (type === 'fixed_price') {
    promoPrice = Math.max(0, discountValue);
  }

  const discountAmount = Math.max(0, originalPrice - promoPrice);
  const discountPercent = originalPrice > 0 ? Math.round((discountAmount / originalPrice) * 100) : 0;
  const isBelowCogs = promoPrice < cogs;
  const profitMargin = promoPrice > 0 ? Math.round(((promoPrice - cogs) / promoPrice) * 100) : 0;

  return {
    promoPrice,
    discountAmount,
    discountPercent,
    isBelowCogs,
    profitMargin,
  };
}

export interface EffectivePromoResult {
  hasPromo: boolean;
  promo?: Promotion;
  promoPrice: number;
  originalPrice: number;
  discountAmount: number;
  discountPercent: number;
  isBelowCogs: boolean;
  badgeText?: string;
}

/**
 * Resolves the active promotion for a specific product and branch
 */
export function getProductEffectivePromo(
  product: Product,
  promotions: Promotion[],
  branchId?: string,
  currentDate = new Date()
): EffectivePromoResult {
  const originalPrice = product.sellingPrice;

  // Find active promotions covering this product
  const applicable = promotions.filter((p) => {
    if (!isPromotionActive(p, currentDate)) return false;
    if (!p.productIds.includes(product.id)) return false;

    // Branch match
    if (branchId && p.branchIds && p.branchIds.length > 0) {
      if (!p.branchIds.includes('*') && !p.branchIds.includes(branchId)) {
        return false;
      }
    }
    return true;
  });

  if (applicable.length === 0) {
    return {
      hasPromo: false,
      promoPrice: originalPrice,
      originalPrice,
      discountAmount: 0,
      discountPercent: 0,
      isBelowCogs: originalPrice < product.cogs,
      badgeText: undefined,
    };
  }

  // If multiple promos apply, select the best savings for the customer
  let bestPromo = applicable[0];
  let bestCalc = calculatePromoPrice(
    originalPrice,
    product.cogs,
    bestPromo.type,
    bestPromo.discountValue
  );

  for (let i = 1; i < applicable.length; i++) {
    const curPromo = applicable[i];
    const curCalc = calculatePromoPrice(
      originalPrice,
      product.cogs,
      curPromo.type,
      curPromo.discountValue
    );
    if (curCalc.discountAmount > bestCalc.discountAmount) {
      bestPromo = curPromo;
      bestCalc = curCalc;
    }
  }

  const badgeText =
    bestPromo.badgeText ||
    (bestCalc.discountPercent > 0 ? `HEMAT ${bestCalc.discountPercent}%` : 'PROMO');

  return {
    hasPromo: bestCalc.discountAmount > 0,
    promo: bestPromo,
    promoPrice: bestCalc.promoPrice,
    originalPrice,
    discountAmount: bestCalc.discountAmount,
    discountPercent: bestCalc.discountPercent,
    isBelowCogs: bestCalc.isBelowCogs,
    badgeText,
  };
}

/**
 * Computes total savings for an order cart
 */
export function calculateOrderSavings(
  items: { product: Product; quantity: number }[],
  promotions: Promotion[],
  branchId?: string
): {
  subtotalOriginal: number;
  subtotalFinal: number;
  totalSavings: number;
  itemsWithPromo: number;
} {
  let subtotalOriginal = 0;
  let subtotalFinal = 0;
  let totalSavings = 0;
  let itemsWithPromo = 0;

  for (const item of items) {
    const origItemTotal = item.product.sellingPrice * item.quantity;
    subtotalOriginal += origItemTotal;

    const promoInfo = getProductEffectivePromo(item.product, promotions, branchId);
    if (promoInfo.hasPromo) {
      const finalItemTotal = promoInfo.promoPrice * item.quantity;
      subtotalFinal += finalItemTotal;
      totalSavings += promoInfo.discountAmount * item.quantity;
      itemsWithPromo++;
    } else {
      subtotalFinal += origItemTotal;
    }
  }

  return {
    subtotalOriginal,
    subtotalFinal,
    totalSavings,
    itemsWithPromo,
  };
}

/**
 * Filter promotions by search and status
 */
export function filterPromotions(
  promotions: Promotion[],
  searchQuery: string,
  statusFilter: 'all' | 'active' | 'scheduled' | 'ended' | 'inactive',
  currentDate = new Date()
): Promotion[] {
  const q = searchQuery.toLowerCase().trim();

  return promotions.filter((promo) => {
    const status = getPromotionStatus(promo, currentDate);
    if (statusFilter !== 'all' && status !== statusFilter) {
      return false;
    }

    if (!q) return true;

    return (
      promo.name.toLowerCase().includes(q) ||
      (promo.description && promo.description.toLowerCase().includes(q)) ||
      (promo.badgeText && promo.badgeText.toLowerCase().includes(q))
    );
  });
}

/**
 * Aggregate summary metrics for promotions
 */
export function getPromotionMetrics(
  promotions: Promotion[],
  products: Product[],
  orders: Order[]
) {
  const currentDate = new Date();

  const activePromos = promotions.filter((p) => isPromotionActive(p, currentDate));
  const scheduledPromos = promotions.filter(
    (p) => getPromotionStatus(p, currentDate) === 'scheduled'
  );

  // Set of all distinct products currently on promo
  const discountedProductIds = new Set<string>();
  activePromos.forEach((p) => {
    p.productIds.forEach((pid) => discountedProductIds.add(pid));
  });

  // Calculate total discount given across past completed orders
  const totalDiscountGiven = orders.reduce((sum, order) => {
    return sum + (order.discountTotal || 0);
  }, 0);

  // Orders that used promo
  const promoOrdersCount = orders.filter((o) => (o.discountTotal || 0) > 0).length;

  return {
    activeCount: activePromos.length,
    scheduledCount: scheduledPromos.length,
    discountedProductsCount: discountedProductIds.size,
    totalDiscountGiven,
    promoOrdersCount,
  };
}
