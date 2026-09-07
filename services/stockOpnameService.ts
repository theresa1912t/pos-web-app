import { StockOpnameItem } from '@/types';

export interface OpnameProgressMetrics {
  totalItems: number;
  countedItems: number;
  uncountedItems: number;
  progressPercent: number;
}

export interface OpnameDiscrepancyMetrics {
  matchedCount: number;
  deficitCount: number;
  surplusCount: number;
  totalDeficitValue: number;
  totalSurplusValue: number;
  netDiscrepancyValue: number;
}

/**
 * Calculates counting progress for an active stock opname session
 */
export function calculateOpnameProgress(items: StockOpnameItem[]): OpnameProgressMetrics {
  const totalItems = items.length;
  const countedItems = items.filter((item) => item.isCounted).length;
  const uncountedItems = totalItems - countedItems;
  const progressPercent = totalItems > 0 ? Math.round((countedItems / totalItems) * 100) : 0;

  return {
    totalItems,
    countedItems,
    uncountedItems,
    progressPercent,
  };
}

/**
 * Calculates variance, deficits, surpluses, and financial impact for stock opname items
 */
export function calculateOpnameDiscrepancies(
  items: StockOpnameItem[]
): OpnameDiscrepancyMetrics {
  let matchedCount = 0;
  let deficitCount = 0;
  let surplusCount = 0;
  let totalDeficitValue = 0;
  let totalSurplusValue = 0;

  for (const item of items) {
    if (!item.isCounted || item.physicalStock === null) continue;

    const diff = item.difference;
    const cogs = item.cogs || 0;

    if (diff === 0) {
      matchedCount++;
    } else if (diff < 0) {
      deficitCount++;
      totalDeficitValue += Math.abs(diff) * cogs;
    } else {
      surplusCount++;
      totalSurplusValue += diff * cogs;
    }
  }

  const netDiscrepancyValue = totalSurplusValue - totalDeficitValue;

  return {
    matchedCount,
    deficitCount,
    surplusCount,
    totalDeficitValue,
    totalSurplusValue,
    netDiscrepancyValue,
  };
}
