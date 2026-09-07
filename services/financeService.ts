import { Order, Revenue, Cost, CostCategory, DateFilterType, DateRange } from '@/types';
import { isDateInFilter } from '@/lib/utils';

export interface FinanceSummaryMetrics {
  totalRevenue: number;
  totalCogs: number;
  grossProfit: number;
  operatingCosts: number;
  netProfit: number;
  profitMarginPercent: number;
  totalOrdersCount: number;
  averageOrderValue: number;
}

export interface CostCategoryBreakdown {
  category: CostCategory;
  total: number;
  percentage: number;
}

/**
 * Calculates complete financial statement metrics for given orders, revenues, and costs
 */
export function calculateFinanceMetrics(
  orders: Order[],
  revenues: Revenue[],
  costs: Cost[],
  dateFilter: DateFilterType,
  customRange?: DateRange,
  branchId?: string | 'all'
): FinanceSummaryMetrics {
  // Filter by date and branch
  const filteredOrders = orders.filter((o) => {
    if (o.status !== 'Finished') return false;
    if (branchId && branchId !== 'all' && o.branchId && o.branchId !== branchId) return false;
    return isDateInFilter(o.createdAt, dateFilter, customRange);
  });

  const filteredRevenues = revenues.filter((r) => {
    if (branchId && branchId !== 'all' && r.branchId && r.branchId !== branchId) return false;
    return isDateInFilter(r.date, dateFilter, customRange);
  });

  const filteredCosts = costs.filter((c) => {
    if (branchId && branchId !== 'all' && c.branchId && c.branchId !== branchId) return false;
    return isDateInFilter(c.date, dateFilter, customRange);
  });

  // Calculate Order Revenue & COGS
  let orderRevenue = 0;
  let totalCogs = 0;

  for (const order of filteredOrders) {
    orderRevenue += order.total || 0;
    totalCogs += order.totalCogs || 0;
  }

  // Other revenues
  const otherRevenue = filteredRevenues.reduce((acc, r) => acc + (r.amount || 0), 0);
  const totalRevenue = orderRevenue + otherRevenue;

  const grossProfit = Math.max(0, totalRevenue - totalCogs);

  // Operating costs
  const operatingCosts = filteredCosts.reduce((acc, c) => acc + (c.amount || 0), 0);
  const netProfit = grossProfit - operatingCosts;

  const profitMarginPercent =
    totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;
  const totalOrdersCount = filteredOrders.length;
  const averageOrderValue =
    totalOrdersCount > 0 ? Math.round(orderRevenue / totalOrdersCount) : 0;

  return {
    totalRevenue,
    totalCogs,
    grossProfit,
    operatingCosts,
    netProfit,
    profitMarginPercent,
    totalOrdersCount,
    averageOrderValue,
  };
}

/**
 * Groups costs by category and computes percentage contributions
 */
export function groupCostsByCategory(costs: Cost[]): CostCategoryBreakdown[] {
  const totalCost = costs.reduce((sum, c) => sum + (c.amount || 0), 0);
  const map = new Map<CostCategory, number>();

  for (const cost of costs) {
    const prev = map.get(cost.category) || 0;
    map.set(cost.category, prev + (cost.amount || 0));
  }

  const result: CostCategoryBreakdown[] = [];
  map.forEach((total, category) => {
    const percentage = totalCost > 0 ? Math.round((total / totalCost) * 100) : 0;
    result.push({ category, total, percentage });
  });

  return result.sort((a, b) => b.total - a.total);
}
