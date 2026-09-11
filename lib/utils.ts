import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { DateFilterType, DateRange } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number): string {
  if (isNaN(amount)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace(/\s+/g, ' ');
}

export function formatDate(isoString: string, includeTime: boolean = false): string {
  if (!isoString) return "-";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "short",
      year: "numeric",
      ...(includeTime
        ? {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }
        : {}),
    };
    return new Intl.DateTimeFormat("id-ID", options).format(date);
  } catch {
    return isoString;
  }
}

export function formatTime(isoString: string): string {
  if (!isoString) return "-";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "-";
  }
}

export function formatDateTime(isoString: string): string {
  return formatDate(isoString, true);
}

export function isDateInFilter(
  dateIso: string,
  filterType: DateFilterType,
  customRange?: DateRange,
  refDate: Date = new Date()
): boolean {
  if (!dateIso) return false;
  const itemDate = new Date(dateIso);
  if (isNaN(itemDate.getTime())) return false;

  const targetDay = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate()).getTime();
  const today = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate()).getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;

  switch (filterType) {
    case 'today':
      return targetDay === today;

    case 'yesterday':
      return targetDay === today - oneDayMs;

    case '7days': {
      const sevenDaysAgo = today - (6 * oneDayMs);
      return targetDay >= sevenDaysAgo && targetDay <= today;
    }

    case '14days': {
      const fourteenDaysAgo = today - (13 * oneDayMs);
      return targetDay >= fourteenDaysAgo && targetDay <= today;
    }

    case '30days': {
      const thirtyDaysAgo = today - (29 * oneDayMs);
      return targetDay >= thirtyDaysAgo && targetDay <= today;
    }

    case 'this_month': {
      return (
        itemDate.getFullYear() === refDate.getFullYear() &&
        itemDate.getMonth() === refDate.getMonth()
      );
    }

    case 'custom': {
      if (!customRange || !customRange.startDate || !customRange.endDate) return true;
      const start = new Date(customRange.startDate).getTime();
      const end = new Date(customRange.endDate).getTime() + oneDayMs - 1; // inclusive
      const itemTimestamp = itemDate.getTime();
      return itemTimestamp >= start && itemTimestamp <= end;
    }

    default:
      return true;
  }
}

export function calculateWeightedCOGS(
  currentStock: number,
  currentCogs: number,
  restockQuantity: number,
  purchaseCostPerItem: number
): number {
  if (currentStock <= 0) {
    return purchaseCostPerItem;
  }
  const totalStock = currentStock + restockQuantity;
  if (totalStock <= 0) return currentCogs;
  
  const totalValue = (currentStock * currentCogs) + (restockQuantity * purchaseCostPerItem);
  return Math.round(totalValue / totalStock);
}

export function generateOrderId(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomNum = Math.floor(100 + Math.random() * 900);
  return `ORD-${dateStr}-${randomNum}`;
}
