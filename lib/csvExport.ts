import { Order, Product, CashierShift, StockOpname } from '@/types';

// Helper to escape CSV cell (standard RFC 4180)
export const escapeCsv = (val: string | number | boolean | null | undefined): string => {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

// Helper to trigger browser download with UTF-8 BOM
export const downloadCsv = (csvContent: string, filename: string) => {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export interface ExportDateBounds {
  start: Date;
  end: Date;
}

export const isDateInRange = (dateIso: string, bounds: ExportDateBounds | null): boolean => {
  if (!bounds) return true;
  if (!dateIso) return false;
  const itemDate = new Date(dateIso);
  if (isNaN(itemDate.getTime())) return false;
  return itemDate >= bounds.start && itemDate <= bounds.end;
};

export function exportOrdersCsv(
  orders: Order[],
  selectedBranchId: string,
  bounds: ExportDateBounds | null,
  storeSlug: string
): number {
  const timestamp = new Date().toISOString().slice(0, 10);
  const filteredOrders = orders.filter((o) => {
    const matchesBranch = selectedBranchId === 'all' || o.branchId === selectedBranchId;
    const matchesDate = isDateInRange(o.createdAt, bounds);
    return matchesBranch && matchesDate;
  });

  const headers = [
    'No Pesanan',
    'Tanggal Waktu',
    'Cabang',
    'Saluran',
    'Status',
    'Metode Pembayaran',
    'Jumlah Item',
    'Daftar Produk (Qty x Harga)',
    'Total Nilai Belanja (Rp)',
    'Total Diskon (Rp)',
    'Total HPP (Rp)',
    'Estimasi Laba Kotor (Rp)',
    'Catatan',
  ];

  const rows = filteredOrders.map((o) => {
    const itemsSummary = o.items
      .map((i) => `${i.productName} (${i.quantity}x @${i.sellingPrice})`)
      .join('; ');
    const itemCount = o.items.reduce((acc, curr) => acc + curr.quantity, 0);
    const grossProfit = o.total - (o.totalCogs || 0);

    return [
      escapeCsv(o.id),
      escapeCsv(o.createdAt),
      escapeCsv(o.branchName || '-'),
      escapeCsv(o.salesChannel || 'Offline / Kasir'),
      escapeCsv(o.status),
      escapeCsv(o.paymentMethod || 'Cash'),
      escapeCsv(itemCount),
      escapeCsv(itemsSummary),
      escapeCsv(o.total),
      escapeCsv(o.discountTotal || 0),
      escapeCsv(o.totalCogs || 0),
      escapeCsv(grossProfit),
      escapeCsv(o.notes || ''),
    ].join(',');
  });

  const csvString = [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
  downloadCsv(csvString, `${storeSlug}_laporan_pesanan_${timestamp}.csv`);
  return filteredOrders.length;
}

export function exportProductsCsv(
  products: Product[],
  storeSlug: string
): number {
  const timestamp = new Date().toISOString().slice(0, 10);
  const activeProds = products.filter((p) => !p.isArchived);

  const headers = [
    'SKU',
    'Barcode',
    'Nama Produk',
    'Kategori',
    'Rak Penyimpanan',
    'Satuan',
    'Harga Beli HPP (Rp)',
    'Harga Jual (Rp)',
    'Harga Promo (Rp)',
    'Stok Sistem',
    'Batas Minimum Stok',
    'Estimasi Nilai Aset Stok (Rp)',
  ];

  const rows = activeProds.map((p) => {
    const totalStockValue = (p.stock || 0) * (p.cogs || 0);

    return [
      escapeCsv(p.sku || '-'),
      escapeCsv(p.barcode || '-'),
      escapeCsv(p.name),
      escapeCsv(p.category || '-'),
      escapeCsv(p.rackName || '-'),
      escapeCsv(p.unit || 'Pcs'),
      escapeCsv(p.cogs || 0),
      escapeCsv(p.sellingPrice || 0),
      escapeCsv(p.isPromoActive && p.promoPrice ? p.promoPrice : '-'),
      escapeCsv(p.stock || 0),
      escapeCsv(p.minStockThreshold || 5),
      escapeCsv(totalStockValue),
    ].join(',');
  });

  const csvString = [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
  downloadCsv(csvString, `${storeSlug}_katalog_produk_${timestamp}.csv`);
  return activeProds.length;
}

export function exportCashierShiftsCsv(
  shifts: CashierShift[],
  selectedBranchId: string,
  bounds: ExportDateBounds | null,
  storeSlug: string
): number {
  const timestamp = new Date().toISOString().slice(0, 10);
  const filteredShifts = shifts.filter((s) => {
    const matchesBranch = selectedBranchId === 'all' || s.branchId === selectedBranchId;
    const matchesDate = isDateInRange(s.startTime, bounds);
    return matchesBranch && matchesDate;
  });

  const headers = [
    'No Shift',
    'Cabang',
    'Nama Kasir',
    'Status Shift',
    'Waktu Buka',
    'Waktu Tutup',
    'Modal Awal (Rp)',
    'Penjualan Tunai (Rp)',
    'Penjualan Non-Tunai (Rp)',
    'Kas Masuk Lain (Rp)',
    'Kas Keluar Petty Cash (Rp)',
    'Ekspektasi Uang Fisik (Rp)',
    'Uang Fisik Dihitung (Rp)',
    'Selisih Kas (Rp)',
    'Total Transaksi',
    'Catatan',
  ];

  const rows = filteredShifts.map((s) => {
    return [
      escapeCsv(s.shiftNumber),
      escapeCsv(s.branchName || '-'),
      escapeCsv(s.cashierName || '-'),
      escapeCsv(s.status),
      escapeCsv(s.startTime),
      escapeCsv(s.endTime || '-'),
      escapeCsv(s.startingCash || 0),
      escapeCsv(s.cashSalesTotal || 0),
      escapeCsv(s.nonCashSalesTotal || 0),
      escapeCsv(s.cashInTotal || 0),
      escapeCsv(s.cashOutTotal || 0),
      escapeCsv(s.expectedEndingCash || 0),
      escapeCsv(s.actualEndingCash ?? '-'),
      escapeCsv(s.difference ?? 0),
      escapeCsv(s.totalOrdersCount || 0),
      escapeCsv(s.notes || ''),
    ].join(',');
  });

  const csvString = [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
  downloadCsv(csvString, `${storeSlug}_rekap_shift_kasir_${timestamp}.csv`);
  return filteredShifts.length;
}

export function exportStockOpnamesCsv(
  stockOpnames: StockOpname[],
  selectedBranchId: string,
  bounds: ExportDateBounds | null,
  storeSlug: string
): number {
  const timestamp = new Date().toISOString().slice(0, 10);
  const filteredOpnames = stockOpnames.filter((so) => {
    const matchesBranch = selectedBranchId === 'all' || !so.branchId || so.branchId === selectedBranchId;
    const matchesDate = isDateInRange(so.createdAt, bounds);
    return matchesBranch && matchesDate;
  });

  const headers = [
    'No Opname',
    'Tanggal Pelaksanaan',
    'Cabang',
    'Petugas Audit',
    'Cakupan Ruang Lingkup',
    'Target Cakupan',
    'Status Sesi',
    'Nama Produk',
    'Barcode',
    'Kategori',
    'Rak',
    'Stok Sistem',
    'Stok Fisik Dihitung',
    'Selisih Qty',
    'HPP Satuan (Rp)',
    'Selisih Nilai HPP (Rp)',
    'Status Perhitungan',
  ];

  const rows: string[] = [];

  filteredOpnames.forEach((so) => {
    if (so.items && so.items.length > 0) {
      so.items.forEach((item) => {
        rows.push(
          [
            escapeCsv(so.opnameNumber),
            escapeCsv(so.createdAt),
            escapeCsv(so.branchName || '-'),
            escapeCsv(so.performedBy || '-'),
            escapeCsv(so.scope),
            escapeCsv(so.scopeTargetName || so.scopeTargetId || 'Semua'),
            escapeCsv(so.status),
            escapeCsv(item.productName),
            escapeCsv(item.barcode || '-'),
            escapeCsv(item.category || '-'),
            escapeCsv(item.rackName || '-'),
            escapeCsv(item.systemStock || 0),
            escapeCsv(item.physicalStock ?? '-'),
            escapeCsv(item.difference || 0),
            escapeCsv(item.cogs || 0),
            escapeCsv(item.discrepancyValue || 0),
            escapeCsv(item.isCounted ? 'Sudah Dihitung' : 'Belum Dihitung'),
          ].join(',')
        );
      });
    }
  });

  const csvString = [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
  downloadCsv(csvString, `${storeSlug}_laporan_stock_opname_${timestamp}.csv`);
  return filteredOpnames.length;
}
