import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Warung POS & Inventory Management',
  description: 'Sistem Kasir, Stok, dan Manajemen Keuangan Internal Warung & Toko Kelontong',
  openGraph: {
    title: 'Warung POS & Inventory Management',
    description: 'Sistem Kasir, Stok, dan Manajemen Keuangan Internal Warung & Toko Kelontong',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Warung POS & Inventory Management',
    description: 'Sistem Kasir, Stok, dan Manajemen Keuangan Internal Warung & Toko Kelontong',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
