import { Order, BusinessSettings } from '@/types';
import { formatDate, formatRupiah } from '@/lib/utils';

/**
 * Triggers a browser download of a CSV file
 */
export function exportToCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  if (typeof window === 'undefined') return;

  const escapeCsvCell = (cell: string | number) => {
    const str = String(cell ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename.replace(/\.csv$/, '')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Formats a clean thermal receipt string (58mm or 80mm ESC/POS compatible text preview)
 */
export function formatReceiptText(
  order: Order,
  settings: BusinessSettings,
  branchName?: string
): string {
  const line = '--------------------------------';
  const doubleLine = '================================';
  const width = 32; // standard 58mm line width in characters

  const center = (text: string) => {
    const pad = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(pad) + text;
  };

  const justify = (left: string, right: string) => {
    const space = Math.max(1, width - left.length - right.length);
    return left + ' '.repeat(space) + right;
  };

  const lines: string[] = [
    center(settings.name || 'WARUNG RITEL POS'),
    center(branchName || 'Cabang Utama'),
    settings.address ? center(settings.address.slice(0, 32)) : '',
    settings.phone ? center(settings.phone) : '',
    doubleLine,
    justify('No. Order:', order.id.slice(-8)),
    justify('Tanggal:', formatDate(order.createdAt, true)),
    justify('Kasir:', 'Kasir'),
    justify('Saluran:', order.salesChannel || 'Offline / Kasir'),
    line,
  ];

  for (const item of order.items) {
    lines.push(item.productName.slice(0, width));
    const qtyPrice = `${item.quantity} x ${formatRupiah(item.sellingPrice)}`;
    const itemTotal = formatRupiah(item.quantity * item.sellingPrice);
    lines.push(justify(`  ${qtyPrice}`, itemTotal));
  }

  lines.push(line);
  lines.push(justify('TOTAL:', formatRupiah(order.total)));
  lines.push(justify('Metode:', order.paymentMethod));
  if (order.paymentMethod === 'Cash' && order.cashTendered) {
    lines.push(justify('Tunai Diterima:', formatRupiah(order.cashTendered)));
    lines.push(justify('Kembalian:', formatRupiah(order.changeAmount || 0)));
  }
  lines.push(doubleLine);
  lines.push(center('Terima kasih atas kunjungan Anda!'));
  lines.push(center('Barang yang dibeli tidak dapat ditukar'));

  return lines.filter(Boolean).join('\n');
}
