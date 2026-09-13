import {
  Product,
  Promotion,
  Category,
  Rack,
  StockOpname,
  StockOpnameSchedule,
  RestockRecord,
  Order,
  Revenue,
  Cost,
  BusinessSettings,
  User,
  SalesChannel,
  ProductChannelMapping,
  ChannelIntegration,
  ChannelSyncError,
  Branch,
  ProductInventory,
  CashierShift,
  CashMovement,
  CustomerReceivable,
  SupplierPayable,
} from '@/types';

const STORAGE_KEYS = {
  PRODUCTS: 'warung_products_v1',
  PROMOTIONS: 'warung_promotions_v1',
  CATEGORIES: 'warung_categories_v1',
  RACKS: 'warung_racks_v1',
  BRANCHES: 'warung_branches_v1',
  PRODUCT_INVENTORIES: 'warung_product_inventories_v1',
  STOCK_OPNAMES: 'warung_stock_opnames_v1',
  STOCK_OPNAME_SCHEDULES: 'warung_stock_opname_schedules_v1',
  CASHIER_SHIFTS: 'warung_cashier_shifts_v1',
  CUSTOMER_RECEIVABLES: 'warung_customer_receivables_v1',
  SUPPLIER_PAYABLES: 'warung_supplier_payables_v1',
  RESTOCKS: 'warung_restocks_v1',
  ORDERS: 'warung_orders_v1',
  REVENUES: 'warung_revenues_v1',
  COSTS: 'warung_costs_v1',
  SETTINGS: 'warung_settings_v1',
  AUTH_USER: 'warung_auth_user_v1',
  ONBOARDING_COMPLETED: 'warung_onboarding_completed_v1',
  CHANNEL_INTEGRATIONS: 'warung_channel_integrations_v1',
  PRODUCT_MAPPINGS: 'warung_product_mappings_v1',
  CHANNEL_SYNC_ERRORS: 'warung_channel_sync_errors_v1',
};

export const INITIAL_CUSTOMER_RECEIVABLES: CustomerReceivable[] = [
  {
    id: 'rcv-1',
    branchId: 'branch-1',
    branchName: 'Cabang Utama - Tebet',
    customerName: 'Ibu Nurul (Komplek A3)',
    customerPhone: '0812-8899-1122',
    notes: 'Bon belanja mingguan minyak, beras, dan telur',
    totalAmount: 350000,
    paidAmount: 150000,
    remainingAmount: 200000,
    status: 'Partial',
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    payments: [
      {
        id: 'rcv-pay-1',
        amount: 150000,
        paymentMethod: 'Transfer',
        paymentDate: new Date(Date.now() - 1 * 86400000).toISOString(),
        receivedBy: 'Kasir Utama',
        notes: 'Transfer via BCA',
      },
    ],
  },
  {
    id: 'rcv-2',
    branchId: 'branch-1',
    branchName: 'Cabang Utama - Tebet',
    customerName: 'Pak RT Budi (Konsumsi Rapat)',
    customerPhone: '0813-7766-5544',
    notes: 'Snack rapat warga & galon air mineral',
    totalAmount: 245000,
    paidAmount: 0,
    remainingAmount: 245000,
    status: 'Unpaid',
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    payments: [],
  },
  {
    id: 'rcv-3',
    branchId: 'branch-1',
    branchName: 'Cabang Utama - Tebet',
    customerName: 'Warung Kopi Mas Joko',
    customerPhone: '0857-3322-1100',
    notes: 'Titip rokok & kopi rentengan tempo 3 hari',
    totalAmount: 520000,
    paidAmount: 520000,
    remainingAmount: 0,
    status: 'Paid',
    dueDate: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10),
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    payments: [
      {
        id: 'rcv-pay-2',
        amount: 520000,
        paymentMethod: 'Cash',
        paymentDate: new Date(Date.now() - 1 * 86400000).toISOString(),
        receivedBy: 'Kasir Utama',
        notes: 'Lunas tunai di toko',
      },
    ],
  },
];

export const INITIAL_SUPPLIER_PAYABLES: SupplierPayable[] = [
  {
    id: 'pay-1',
    branchId: 'branch-1',
    branchName: 'Cabang Utama - Tebet',
    supplierName: 'PT Indofood Sukses Makmur',
    invoiceNumber: 'INV-IND-2026/092',
    supplierPhone: '021-57958822',
    notes: 'Restock mie instan 20 karton & bumbu dapur',
    totalAmount: 1850000,
    paidAmount: 0,
    remainingAmount: 1850000,
    status: 'Unpaid',
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    payments: [],
  },
  {
    id: 'pay-2',
    branchId: 'branch-1',
    branchName: 'Cabang Utama - Tebet',
    supplierName: 'Distributor Sembako Jaya',
    invoiceNumber: 'INV-DSJ-8821',
    supplierPhone: '0811-9988-7711',
    notes: 'Restock beras premium 10 karung & minyak goreng',
    totalAmount: 3200000,
    paidAmount: 1500000,
    remainingAmount: 1700000,
    status: 'Partial',
    dueDate: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10),
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    payments: [
      {
        id: 'spl-pay-1',
        amount: 1500000,
        paymentMethod: 'Transfer',
        paymentDate: new Date(Date.now() - 2 * 86400000).toISOString(),
        paidBy: 'Pemilik Toko',
        notes: 'DP 50% via transfer Mandiri',
      },
    ],
  },
  {
    id: 'pay-3',
    branchId: 'branch-1',
    branchName: 'Cabang Utama - Tebet',
    supplierName: 'Agen Aneka Minuman Kemasan',
    invoiceNumber: 'INV-AAM-0441',
    supplierPhone: '0818-4455-6677',
    notes: 'Restock Teh Botol, Le Minerale, Floridina 15 dus',
    totalAmount: 950000,
    paidAmount: 950000,
    remainingAmount: 0,
    status: 'Paid',
    dueDate: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
    createdAt: new Date(Date.now() - 9 * 86400000).toISOString(),
    payments: [
      {
        id: 'spl-pay-2',
        amount: 950000,
        paymentMethod: 'Cash',
        paymentDate: new Date(Date.now() - 2 * 86400000).toISOString(),
        paidBy: 'Kasir Utama',
        notes: 'Pelunasan tunai saat barang datang',
      },
    ],
  },
];

export const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'branch-1',
    name: 'Cabang Utama - Tebet',
    code: 'CBG-01',
    address: 'Jl. Tebet Raya No. 42, Jakarta Selatan',
    phone: '0812-3456-7890',
    status: 'Active',
    createdAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'branch-2',
    name: 'Cabang Pasar Baru',
    code: 'CBG-02',
    address: 'Jl. Pasar Baru No. 15, Jakarta Pusat',
    phone: '0813-8899-2211',
    status: 'Active',
    createdAt: '2026-02-15T09:30:00.000Z',
  },
  {
    id: 'branch-3',
    name: 'Cabang Ruko Bintaro',
    code: 'CBG-03',
    address: 'Ruko Bintaro Sektor 7 Blok B-12, Tangerang Selatan',
    phone: '0815-6677-8899',
    status: 'Active',
    createdAt: '2026-04-10T10:00:00.000Z',
  },
];

export const INITIAL_CASHIER_SHIFTS: CashierShift[] = [
  {
    id: 'shift-demo-yesterday',
    shiftNumber: 'SH-20260907-01',
    branchId: 'branch-1',
    branchName: 'Cabang Utama - Tebet',
    cashierId: 'user-kasir-1',
    cashierName: 'Siti Rahma (Kasir Pagi)',
    status: 'Closed',
    startTime: '2026-09-07T08:00:00.000Z',
    endTime: '2026-09-07T16:00:00.000Z',
    startingCash: 200000,
    cashSalesTotal: 785000,
    nonCashSalesTotal: 520000,
    cashInTotal: 0,
    cashOutTotal: 25000,
    expectedEndingCash: 960000,
    actualEndingCash: 960000,
    difference: 0,
    totalOrdersCount: 28,
    cashMovements: [
      {
        id: 'cm-1',
        type: 'CashOut',
        amount: 25000,
        reason: 'Beli kantong kresek & lakban packing',
        createdAt: '2026-09-07T11:30:00.000Z',
        cashierName: 'Siti Rahma',
      },
    ],
    notes: 'Shift pagi lancar, kas fisik klop seimbang 100%.',
    closedBy: 'Siti Rahma',
  },
  {
    id: 'shift-demo-today-active',
    shiftNumber: 'SH-20260908-01',
    branchId: 'branch-1',
    branchName: 'Cabang Utama - Tebet',
    cashierId: 'user-kasir-active',
    cashierName: 'Budi Santoso (Kasir Aktif)',
    status: 'Open',
    startTime: '2026-09-08T08:00:00.000Z',
    startingCash: 250000,
    cashSalesTotal: 340000,
    nonCashSalesTotal: 215000,
    cashInTotal: 0,
    cashOutTotal: 15000,
    expectedEndingCash: 575000,
    totalOrdersCount: 12,
    cashMovements: [
      {
        id: 'cm-2',
        type: 'CashOut',
        amount: 15000,
        reason: 'Beli es batu untuk display minuman dingin',
        createdAt: '2026-09-08T09:45:00.000Z',
        cashierName: 'Budi Santoso',
      },
    ],
    notes: 'Shift aktif sedang berjalan.',
  },
];

export const INITIAL_RACKS: Rack[] = [
  { id: 'rack-1', branchId: 'branch-1', branchName: 'Cabang Utama - Tebet', name: 'Rak Sembako & Beras', code: 'RAK-A1', locationDescription: 'Lorong Kiri Utama Baris 1' },
  { id: 'rack-2', branchId: 'branch-1', branchName: 'Cabang Utama - Tebet', name: 'Rak Mie & Makanan Cepat Saji', code: 'RAK-B1', locationDescription: 'Lorong Tengah Baris 1' },
  { id: 'rack-3', branchId: 'branch-1', branchName: 'Cabang Utama - Tebet', name: 'Etalase Minuman Dingin (Chiller)', code: 'ETL-C1', locationDescription: 'Samping Kiri Meja Kasir' },
  { id: 'rack-4', branchId: 'branch-1', branchName: 'Cabang Utama - Tebet', name: 'Etalase Rokok & Korek', code: 'ETL-R1', locationDescription: 'Belakang Meja Kasir' },
  { id: 'rack-5', branchId: 'branch-2', branchName: 'Cabang Pasar Baru', name: 'Rak Perlengkapan Mandi & Cuci', code: 'RAK-D1', locationDescription: 'Lorong Kanan Belakang' },
  { id: 'rack-6', branchId: 'branch-2', branchName: 'Cabang Pasar Baru', name: 'Rak Snack & Biskuit', code: 'RAK-E1', locationDescription: 'Gantungan Depan Meja Kasir' },
  { id: 'rack-7', branchId: 'branch-3', branchName: 'Cabang Ruko Bintaro', name: 'Rak Bumbu & Dapur', code: 'RAK-F1', locationDescription: 'Lorong Kiri Baris 2' },
  { id: 'rack-8', branchId: 'branch-3', branchName: 'Cabang Ruko Bintaro', name: 'Rak Obat & P3K Kasir', code: 'RAK-G1', locationDescription: 'Etalase Depan Kasir' },
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Makanan & Mie' },
  { id: 'cat-2', name: 'Minuman' },
  { id: 'cat-3', name: 'Sembako' },
  { id: 'cat-4', name: 'Rokok' },
  { id: 'cat-5', name: 'Kebutuhan Rumah' },
  { id: 'cat-6', name: 'Snack & Biskuit' },
  { id: 'cat-7', name: 'Bumbu & Dapur' },
  { id: 'cat-8', name: 'Obat & Perawatan' },
];

export const INITIAL_PROMOTIONS: Promotion[] = [
  {
    id: 'promo-jsm-weekend',
    name: 'Promo JSM Akhir Pekan',
    description: 'Diskon spesial akhir pekan Jumat-Sabtu-Minggu untuk mie instan & minuman ringan favorit',
    type: 'percentage',
    discountValue: 15,
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    isActive: true,
    productIds: ['prod-seed-1', 'prod-seed-3'],
    branchIds: ['*'],
    badgeText: 'JSM -15%',
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'promo-flash-teh',
    name: 'Flash Sale Minuman Segar',
    description: 'Potongan harga coret langsung Rp 1.000 untuk Teh Pucuk Harum botol dingin',
    type: 'fixed_discount',
    discountValue: 1000,
    startDate: '2026-09-05',
    endDate: '2026-09-25',
    isActive: true,
    productIds: ['prod-seed-5'],
    branchIds: ['*'],
    badgeText: 'HEMAT 1.000',
    createdAt: '2026-09-05T08:00:00.000Z',
  },
];

export const INITIAL_SEED_PRODUCTS: Product[] = [
  {
    id: 'prod-seed-1',
    name: 'Indomie Goreng Spesial',
    category: 'Makanan & Mie',
    rackId: 'rack-2',
    rackName: 'RAK-B1 (Rak Mie & Makanan Cepat Saji)',
    sellingPrice: 3500,
    cogs: 2800,
    stock: 48,
    unit: 'Bks',
    barcode: '8998866200114',
    sku: 'MIE-IND-GRG',
    minStockThreshold: 10,
    image: 'https://picsum.photos/seed/indomiegoreng/300/300',
  },
  {
    id: 'prod-seed-2',
    name: 'Indomie Kuah Ayam Bawang',
    category: 'Makanan & Mie',
    rackId: 'rack-2',
    rackName: 'RAK-B1 (Rak Mie & Makanan Cepat Saji)',
    sellingPrice: 3500,
    cogs: 2750,
    stock: 36,
    unit: 'Bks',
    barcode: '8998866200121',
    sku: 'MIE-IND-ABW',
    minStockThreshold: 10,
    image: 'https://picsum.photos/seed/indomiekuah/300/300',
  },
  {
    id: 'prod-seed-3',
    name: 'Aqua Botol 600ml',
    category: 'Minuman',
    rackId: 'rack-3',
    rackName: 'ETL-C1 (Etalase Minuman Dingin)',
    sellingPrice: 4000,
    cogs: 2850,
    stock: 45,
    unit: 'Btl',
    barcode: '8886008101053',
    sku: 'DRK-AQU-600',
    minStockThreshold: 10,
    image: 'https://picsum.photos/seed/aquabotol/300/300',
  },
  {
    id: 'prod-seed-4',
    name: 'Kopi Kapal Api Special Mix',
    category: 'Minuman',
    rackId: 'rack-1',
    rackName: 'RAK-A1 (Gantung Kasir)',
    sellingPrice: 2000,
    cogs: 1400,
    stock: 60,
    unit: 'Sachet',
    barcode: '8992696404112',
    sku: 'KOP-KPL-MIX',
    minStockThreshold: 15,
    image: 'https://picsum.photos/seed/kapalapi/300/300',
  },
  {
    id: 'prod-seed-5',
    name: 'Teh Pucuk Harum 350ml',
    category: 'Minuman',
    rackId: 'rack-3',
    rackName: 'ETL-C1 (Etalase Minuman Dingin)',
    sellingPrice: 4000,
    cogs: 3100,
    stock: 28,
    unit: 'Btl',
    barcode: '8996001304213',
    sku: 'DRK-TPC-350',
    minStockThreshold: 8,
    image: 'https://picsum.photos/seed/tehpucuk/300/300',
  },
  {
    id: 'prod-seed-6',
    name: 'Beras Ramos Super 5kg',
    category: 'Sembako',
    rackId: 'rack-1',
    rackName: 'RAK-A1 (Lorong Sembako)',
    sellingPrice: 74000,
    cogs: 65000,
    stock: 15,
    unit: 'Karung',
    barcode: '8991001005001',
    sku: 'SBK-BRS-5KG',
    minStockThreshold: 5,
    image: 'https://picsum.photos/seed/berasramos/300/300',
  },
  {
    id: 'prod-seed-7',
    name: 'Minyak Goreng Bimoli 1L',
    category: 'Sembako',
    rackId: 'rack-1',
    rackName: 'RAK-A1 (Lorong Sembako)',
    sellingPrice: 19500,
    cogs: 17000,
    stock: 22,
    unit: 'Pch',
    barcode: '8992775211018',
    sku: 'SBK-MYK-BIM1',
    minStockThreshold: 6,
    image: 'https://picsum.photos/seed/minyakbimoli/300/300',
  },
  {
    id: 'prod-seed-8',
    name: 'Telur Ayam Negeri 1 Kg',
    category: 'Sembako',
    rackId: 'rack-1',
    rackName: 'RAK-A1 (Area Sembako)',
    sellingPrice: 28000,
    cogs: 24500,
    stock: 18,
    unit: 'Kg',
    barcode: '8991001007002',
    sku: 'SBK-TLR-1KG',
    minStockThreshold: 5,
    image: 'https://picsum.photos/seed/telurayam/300/300',
  },
  {
    id: 'prod-seed-9',
    name: 'Biskuit Roma Kelapa 300g',
    category: 'Snack & Biskuit',
    rackId: 'rack-6',
    rackName: 'RAK-E1 (Rak Snack & Biskuit)',
    sellingPrice: 11500,
    cogs: 9000,
    stock: 25,
    unit: 'Bks',
    barcode: '8996001410105',
    sku: 'SNK-ROM-KLP',
    minStockThreshold: 5,
    image: 'https://picsum.photos/seed/romakelapa/300/300',
  },
  {
    id: 'prod-seed-10',
    name: 'Sabun Mandi Lifebuoy Total 10 85g',
    category: 'Kebutuhan Rumah',
    rackId: 'rack-5',
    rackName: 'RAK-D1 (Rak Sabun & Pembersih)',
    sellingPrice: 4500,
    cogs: 3400,
    stock: 30,
    unit: 'Pcs',
    barcode: '8999999014521',
    sku: 'KBR-LFB-85G',
    minStockThreshold: 8,
    image: 'https://picsum.photos/seed/lifebuoysabun/300/300',
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Indomie Goreng Spesial',
    category: 'Makanan & Mie',
    rackId: 'rack-2',
    rackName: 'RAK-B1 (Rak Mie & Makanan Cepat Saji)',
    sellingPrice: 3500,
    cogs: 2800,
    stock: 48,
    unit: 'Bks',
    barcode: '8998866200114',
    sku: 'MIE-IND-GRG',
    minStockThreshold: 10,
    image: 'https://picsum.photos/seed/indomiegoreng/300/300',
  },
  {
    id: 'prod-2',
    name: 'Indomie Kuah Ayam Bawang',
    category: 'Makanan & Mie',
    rackId: 'rack-2',
    rackName: 'RAK-B1 (Rak Mie & Makanan Cepat Saji)',
    sellingPrice: 3500,
    cogs: 2750,
    stock: 4, // low stock!
    unit: 'Bks',
    barcode: '8998866200121',
    sku: 'MIE-IND-ABW',
    minStockThreshold: 10,
    image: 'https://picsum.photos/seed/indomiekuah/300/300',
  },
  {
    id: 'prod-3',
    name: 'Le Minerale 600ml',
    category: 'Minuman',
    rackId: 'rack-3',
    rackName: 'ETL-C1 (Etalase Minuman Dingin)',
    sellingPrice: 4000,
    cogs: 2900,
    stock: 36,
    unit: 'Btl',
    barcode: '8991389221013',
    sku: 'DRK-LEM-600',
    minStockThreshold: 8,
    image: 'https://picsum.photos/seed/leminerale/300/300',
  },
  {
    id: 'prod-4',
    name: 'Kopi Kapal Api Special Mix',
    category: 'Minuman',
    rackId: 'rack-6',
    rackName: 'RAK-E1 (Rak Snack & Biskuit)',
    sellingPrice: 2000,
    cogs: 1400,
    stock: 3, // low stock!
    unit: 'Sachet',
    barcode: '8992696404112',
    sku: 'KOP-KPL-MIX',
    minStockThreshold: 10,
    image: 'https://picsum.photos/seed/kapalapi/300/300',
  },
  {
    id: 'prod-5',
    name: 'Teh Pucuk Harum 350ml',
    category: 'Minuman',
    rackId: 'rack-3',
    rackName: 'ETL-C1 (Etalase Minuman Dingin)',
    sellingPrice: 4000,
    cogs: 3100,
    stock: 24,
    unit: 'Btl',
    barcode: '8996001304213',
    sku: 'DRK-TPC-350',
    minStockThreshold: 6,
    image: 'https://picsum.photos/seed/tehpucuk/300/300',
  },
  {
    id: 'prod-6',
    name: 'Beras Ramos Super 5kg',
    category: 'Sembako',
    rackId: 'rack-1',
    rackName: 'RAK-A1 (Rak Sembako & Beras)',
    sellingPrice: 74000,
    cogs: 65000,
    stock: 2, // low stock!
    unit: 'Karung',
    barcode: '8991001005001',
    sku: 'SBK-BRS-5KG',
    minStockThreshold: 5,
    image: 'https://picsum.photos/seed/beras5kg/300/300',
  },
  {
    id: 'prod-7',
    name: 'Telur Ayam Negeri 1 Kg',
    category: 'Sembako',
    rackId: 'rack-1',
    rackName: 'RAK-A1 (Rak Sembako & Beras)',
    sellingPrice: 28000,
    cogs: 24500,
    stock: 15,
    unit: 'Kg',
    barcode: '8991001007002',
    sku: 'SBK-TLR-1KG',
    minStockThreshold: 5,
    image: 'https://picsum.photos/seed/telurayam/300/300',
  },
  {
    id: 'prod-8',
    name: 'Minyak Goreng Bimoli 1L',
    category: 'Sembako',
    rackId: 'rack-1',
    rackName: 'RAK-A1 (Rak Sembako & Beras)',
    sellingPrice: 19500,
    cogs: 17000,
    stock: 18,
    unit: 'Pch',
    barcode: '8992775211018',
    sku: 'SBK-MYK-BIM1',
    minStockThreshold: 6,
    image: 'https://picsum.photos/seed/minyakbimoli/300/300',
  },
  {
    id: 'prod-9',
    name: 'Rokok Sampoerna Mild 16',
    category: 'Rokok',
    rackId: 'rack-4',
    rackName: 'ETL-R1 (Etalase Rokok & Korek)',
    sellingPrice: 35000,
    cogs: 31800,
    stock: 20,
    unit: 'Bks',
    barcode: '8999909001103',
    sku: 'ROK-SAM-16',
    minStockThreshold: 5,
    image: 'https://picsum.photos/seed/sampoerna/300/300',
  },
  {
    id: 'prod-10',
    name: 'Sabun Lifebuoy Total 10 85g',
    category: 'Kebutuhan Rumah',
    rackId: 'rack-5',
    rackName: 'RAK-D1 (Rak Perlengkapan Mandi & Cuci)',
    sellingPrice: 4500,
    cogs: 3600,
    stock: 14,
    unit: 'Pcs',
    barcode: '8999999015011',
    sku: 'KRM-LFB-85',
    minStockThreshold: 5,
    image: 'https://picsum.photos/seed/lifebuoy/300/300',
  },
  {
    id: 'prod-11',
    name: 'Biskuit Roma Kelapa 300g',
    category: 'Snack & Biskuit',
    rackId: 'rack-6',
    rackName: 'RAK-E1 (Rak Snack & Biskuit)',
    sellingPrice: 11500,
    cogs: 9000,
    stock: 12,
    unit: 'Bks',
    barcode: '8996001410105',
    sku: 'SNK-ROM-KLP',
    minStockThreshold: 4,
    image: 'https://picsum.photos/seed/romakelapa/300/300',
  },
  {
    id: 'prod-12',
    name: 'Gula Pasir Gulaku Kuning 1kg',
    category: 'Sembako',
    rackId: 'rack-1',
    rackName: 'RAK-A1 (Rak Sembako & Beras)',
    sellingPrice: 18000,
    cogs: 15500,
    stock: 22,
    unit: 'Kg',
    barcode: '8993077110115',
    sku: 'SBK-GLA-1KG',
    minStockThreshold: 5,
    image: 'https://picsum.photos/seed/gulaku1kg/300/300',
  },
  {
    id: 'prod-13',
    name: 'Kecap Manis Bango 520ml',
    category: 'Bumbu & Dapur',
    rackId: 'rack-7',
    rackName: 'RAK-F1 (Rak Bumbu & Dapur)',
    sellingPrice: 24000,
    cogs: 20200,
    stock: 10,
    unit: 'Pch',
    barcode: '8999999026116',
    sku: 'BMB-BNG-520',
    minStockThreshold: 4,
    image: 'https://picsum.photos/seed/bango520/300/300',
  },
  {
    id: 'prod-14',
    name: 'Royco Bumbu Kaldu Ayam 230g',
    category: 'Bumbu & Dapur',
    rackId: 'rack-7',
    rackName: 'RAK-F1 (Rak Bumbu & Dapur)',
    sellingPrice: 11000,
    cogs: 8800,
    stock: 16,
    unit: 'Pch',
    barcode: '8999999518017',
    sku: 'BMB-RYC-230',
    minStockThreshold: 5,
    image: 'https://picsum.photos/seed/roycoayam/300/300',
  },
  {
    id: 'prod-15',
    name: 'Susu Ultra Milk Cokelat 250ml',
    category: 'Minuman',
    rackId: 'rack-3',
    rackName: 'ETL-C1 (Etalase Minuman Dingin)',
    sellingPrice: 6500,
    cogs: 5200,
    stock: 28,
    unit: 'Kotak',
    barcode: '8992753110212',
    sku: 'DRK-ULT-CKL',
    minStockThreshold: 6,
    image: 'https://picsum.photos/seed/ultracokelat/300/300',
  },
  {
    id: 'prod-16',
    name: 'Mie Sedaap Goreng 90g',
    category: 'Makanan & Mie',
    rackId: 'rack-2',
    rackName: 'RAK-B1 (Rak Mie & Makanan Cepat Saji)',
    sellingPrice: 3500,
    cogs: 2700,
    stock: 35,
    unit: 'Bks',
    barcode: '8998838110014',
    sku: 'MIE-SDP-GRG',
    minStockThreshold: 8,
    image: 'https://picsum.photos/seed/miesedaap/300/300',
  },
  {
    id: 'prod-17',
    name: 'Pop Mie Kuah Rasa Ayam 75g',
    category: 'Makanan & Mie',
    rackId: 'rack-2',
    rackName: 'RAK-B1 (Rak Mie & Makanan Cepat Saji)',
    sellingPrice: 6000,
    cogs: 4800,
    stock: 0, // OUT OF STOCK / HABIS untuk uji restock & pos
    unit: 'Cup',
    barcode: '8998866300111',
    sku: 'MIE-POP-AYM',
    minStockThreshold: 6,
    image: 'https://picsum.photos/seed/popmieayam/300/300',
  },
  {
    id: 'prod-18',
    name: 'Aqua Botol 600ml',
    category: 'Minuman',
    rackId: 'rack-3',
    rackName: 'ETL-C1 (Etalase Minuman Dingin)',
    sellingPrice: 4000,
    cogs: 2850,
    stock: 40,
    unit: 'Btl',
    barcode: '8886008101053',
    sku: 'DRK-AQU-600',
    minStockThreshold: 10,
    image: 'https://picsum.photos/seed/aquabotol/300/300',
  },
  {
    id: 'prod-19',
    name: 'Rokok Gudang Garam Surya 16',
    category: 'Rokok',
    rackId: 'rack-4',
    rackName: 'ETL-R1 (Etalase Rokok & Korek)',
    sellingPrice: 36000,
    cogs: 32500,
    stock: 18,
    unit: 'Bks',
    barcode: '8992688001121',
    sku: 'ROK-GGS-16',
    minStockThreshold: 5,
    image: 'https://picsum.photos/seed/ggsurya/300/300',
  },
  {
    id: 'prod-20',
    name: 'Deterjen Rinso Molto Anti Noda 770g',
    category: 'Kebutuhan Rumah',
    rackId: 'rack-5',
    rackName: 'RAK-D1 (Rak Perlengkapan Mandi & Cuci)',
    sellingPrice: 22000,
    cogs: 18200,
    stock: 11,
    unit: 'Bks',
    barcode: '8999999534017',
    sku: 'KRM-RNS-770',
    minStockThreshold: 4,
    image: 'https://picsum.photos/seed/rinsomolto/300/300',
  },
  {
    id: 'prod-21',
    name: 'Pasta Gigi Pepsodent White 190g',
    category: 'Kebutuhan Rumah',
    rackId: 'rack-5',
    rackName: 'RAK-D1 (Rak Perlengkapan Mandi & Cuci)',
    sellingPrice: 16500,
    cogs: 13500,
    stock: 15,
    unit: 'Tube',
    barcode: '8999999052115',
    sku: 'KRM-PEP-190',
    minStockThreshold: 4,
    image: 'https://picsum.photos/seed/pepsodent/300/300',
  },
  {
    id: 'prod-22',
    name: 'Keripik Kentang Chitato Sapi Panggang 68g',
    category: 'Snack & Biskuit',
    rackId: 'rack-6',
    rackName: 'RAK-E1 (Rak Snack & Biskuit)',
    sellingPrice: 12000,
    cogs: 9800,
    stock: 20,
    unit: 'Bks',
    barcode: '8996001350029',
    sku: 'SNK-CHT-SPG',
    minStockThreshold: 5,
    image: 'https://picsum.photos/seed/chitatobbq/300/300',
  },
  {
    id: 'prod-23',
    name: 'Roti Tawar Sari Roti Kupas',
    category: 'Makanan & Mie',
    rackId: 'rack-6',
    rackName: 'RAK-E1 (Rak Snack & Biskuit)',
    sellingPrice: 16000,
    cogs: 13000,
    stock: 5,
    unit: 'Bks',
    barcode: '8997008110022',
    sku: 'MIE-SRT-KPS',
    minStockThreshold: 3,
    image: 'https://picsum.photos/seed/sariroti/300/300',
  },
  {
    id: 'prod-24',
    name: 'Tolak Angin Cair Sidomuncul',
    category: 'Obat & Perawatan',
    rackId: 'rack-8',
    rackName: 'RAK-G1 (Rak Obat & P3K Kasir)',
    sellingPrice: 4500,
    cogs: 3400,
    stock: 30,
    unit: 'Sachet',
    barcode: '8998888010012',
    sku: 'OBT-TLK-CR',
    minStockThreshold: 8,
    image: 'https://picsum.photos/seed/tolakangin/300/300',
  },
  {
    id: 'prod-25',
    name: 'Paramex Obat Sakit Kepala 4 Tablet',
    category: 'Obat & Perawatan',
    rackId: 'rack-8',
    rackName: 'RAK-G1 (Rak Obat & P3K Kasir)',
    sellingPrice: 3000,
    cogs: 2100,
    stock: 25,
    unit: 'Strip',
    barcode: '8992745110015',
    sku: 'OBT-PRM-STP',
    minStockThreshold: 6,
    image: 'https://picsum.photos/seed/paramex/300/300',
  },
  {
    id: 'prod-26',
    name: 'Minyak Kayu Putih Cap Lang 60ml',
    category: 'Obat & Perawatan',
    rackId: 'rack-8',
    rackName: 'RAK-G1 (Rak Obat & P3K Kasir)',
    sellingPrice: 26500,
    cogs: 22000,
    stock: 8,
    unit: 'Btl',
    barcode: '8991389020012',
    sku: 'OBT-CKL-60',
    minStockThreshold: 3,
    image: 'https://picsum.photos/seed/kayuputih/300/300',
  },
  {
    id: 'prod-27',
    name: 'Tepung Terigu Segitiga Biru 1kg',
    category: 'Sembako',
    rackId: 'rack-1',
    rackName: 'RAK-A1 (Rak Sembako & Beras)',
    sellingPrice: 13500,
    cogs: 11200,
    stock: 16,
    unit: 'Bks',
    barcode: '8991001002017',
    sku: 'SBK-TPG-1KG',
    minStockThreshold: 5,
    image: 'https://picsum.photos/seed/segitigabiru/300/300',
  },
  {
    id: 'prod-28',
    name: 'Tepung Bumbu Sasa Serbaguna 200g',
    category: 'Bumbu & Dapur',
    rackId: 'rack-7',
    rackName: 'RAK-F1 (Rak Bumbu & Dapur)',
    sellingPrice: 6500,
    cogs: 5000,
    stock: 20,
    unit: 'Bks',
    barcode: '8992775110014',
    sku: 'BMB-SSA-200',
    minStockThreshold: 5,
    image: 'https://picsum.photos/seed/sasabumbu/300/300',
  },
];

export function generateProductInventories(
  products: Product[],
  branches: Branch[] = INITIAL_BRANCHES
): ProductInventory[] {
  const result: ProductInventory[] = [];

  products.forEach((prod) => {
    if (prod.inventories && prod.inventories.length > 0) {
      prod.inventories.forEach((inv) => {
        result.push({ ...inv });
      });
      return;
    }

    const totalStock = prod.stock || 0;
    // Distribute stock across branches: 50% to branch-1, 30% to branch-2, 20% to branch-3
    const cbg1Stock = Math.floor(totalStock * 0.5);
    const cbg2Stock = Math.floor(totalStock * 0.3);
    const cbg3Stock = Math.max(0, totalStock - cbg1Stock - cbg2Stock);

    const stocks = [cbg1Stock, cbg2Stock, cbg3Stock];

    branches.forEach((b, idx) => {
      const stock = stocks[idx] ?? 0;
      let rackId = prod.rackId;
      let rackName = prod.rackName;
      if (b.id === 'branch-2') {
        rackId = 'rack-5';
        rackName = 'RAK-D1 (Rak Perlengkapan Mandi & Cuci)';
      } else if (b.id === 'branch-3') {
        rackId = 'rack-7';
        rackName = 'RAK-F1 (Rak Bumbu & Dapur)';
      }

      result.push({
        id: `inv-${prod.id}-${b.id}`,
        productId: prod.id,
        branchId: b.id,
        stock,
        rackId,
        rackName,
      });
    });
  });

  return result;
}

export const INITIAL_PRODUCT_INVENTORIES: ProductInventory[] = generateProductInventories(
  INITIAL_PRODUCTS,
  INITIAL_BRANCHES
);

// Populate inventories field on INITIAL_PRODUCTS
INITIAL_PRODUCTS.forEach((prod) => {
  prod.inventories = INITIAL_PRODUCT_INVENTORIES.filter((inv) => inv.productId === prod.id);
});

// Generate relative dates for seed transactions
function getRelativeDate(daysAgo: number, hours: number = 10, minutes: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

function getRelativeDateOnly(daysAheadOrAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAheadOrAgo);
  return d.toISOString().slice(0, 10);
}

export const INITIAL_STOCK_OPNAMES: StockOpname[] = [
  {
    id: 'so-20260901-01',
    opnameNumber: 'SO-20260901-001',
    scope: 'Category',
    scopeTargetId: 'cat-1',
    scopeTargetName: 'Makanan & Mie',
    status: 'Completed',
    performedBy: 'Pemilik Usaha (Owner)',
    totalSystemStock: 54,
    totalPhysicalStock: 52,
    totalDiscrepancyStock: -2,
    totalDiscrepancyValue: -5550,
    notes: 'Opname rutin kategori mie instan. Terdapat selisih 2 bungkus rusak kemasan bocor.',
    createdAt: getRelativeDate(3, 8, 30),
    completedAt: getRelativeDate(3, 9, 15),
    items: [
      {
        productId: 'prod-1',
        productName: 'Indomie Goreng Spesial',
        category: 'Makanan & Mie',
        rackName: 'RAK-B1',
        unit: 'Bks',
        barcode: '8998866200114',
        systemStock: 49,
        physicalStock: 48,
        difference: -1,
        cogs: 2800,
        discrepancyValue: -2800,
        isCounted: true,
        notes: '1 bungkus bocor kemasan di rak',
      },
      {
        productId: 'prod-2',
        productName: 'Indomie Kuah Ayam Bawang',
        category: 'Makanan & Mie',
        rackName: 'RAK-B1',
        unit: 'Bks',
        barcode: '8998866200121',
        systemStock: 5,
        physicalStock: 4,
        difference: -1,
        cogs: 2750,
        discrepancyValue: -2750,
        isCounted: true,
        notes: 'Selisih 1 bks kemasan sobek',
      },
    ],
  },
  {
    id: 'so-20260822-01',
    opnameNumber: 'SO-20260822-002',
    scope: 'Rack',
    scopeTargetId: 'rack-1',
    scopeTargetName: 'RAK-A1 (Rak Sembako & Beras)',
    status: 'Completed',
    performedBy: 'Kasir Shift 1 (Budi Santoso)',
    totalSystemStock: 48,
    totalPhysicalStock: 47,
    totalDiscrepancyStock: -1,
    totalDiscrepancyValue: -17000,
    notes: 'Audit rak sembako utama. 1 pouch minyak Bimoli bocor saat penataan rak.',
    createdAt: getRelativeDate(13, 14, 0),
    completedAt: getRelativeDate(13, 15, 0),
    items: [
      {
        productId: 'prod-6',
        productName: 'Beras Ramos Super 5kg',
        category: 'Sembako',
        rackName: 'RAK-A1',
        unit: 'Karung',
        barcode: '8991001006005',
        systemStock: 8,
        physicalStock: 8,
        difference: 0,
        cogs: 65000,
        discrepancyValue: 0,
        isCounted: true,
        notes: 'Sesuai fisik',
      },
      {
        productId: 'prod-8',
        productName: 'Minyak Goreng Bimoli 1L',
        category: 'Sembako',
        rackName: 'RAK-A1',
        unit: 'Pch',
        barcode: '8992775211018',
        systemStock: 22,
        physicalStock: 21,
        difference: -1,
        cogs: 17000,
        discrepancyValue: -17000,
        isCounted: true,
        notes: '1 pouch bocor di rak bawah',
      },
      {
        productId: 'prod-12',
        productName: 'Gula Pasir Gulaku Kuning 1kg',
        category: 'Sembako',
        rackName: 'RAK-A1',
        unit: 'Kg',
        barcode: '8993077110115',
        systemStock: 18,
        physicalStock: 18,
        difference: 0,
        cogs: 15500,
        discrepancyValue: 0,
        isCounted: true,
        notes: 'Sesuai fisik',
      },
    ],
  },
  {
    id: 'so-20260814-01',
    opnameNumber: 'SO-20260814-003',
    scope: 'Category',
    scopeTargetId: 'cat-2',
    scopeTargetName: 'Minuman',
    status: 'Completed',
    performedBy: 'Pemilik Usaha (Owner)',
    totalSystemStock: 72,
    totalPhysicalStock: 73,
    totalDiscrepancyStock: 1,
    totalDiscrepancyValue: 2850,
    notes: 'Opname rutin etalase chiller & minuman dingin. Kelebihan 1 botol Aqua saat restock dus.',
    createdAt: getRelativeDate(21, 10, 0),
    completedAt: getRelativeDate(21, 10, 45),
    items: [
      {
        productId: 'prod-3',
        productName: 'Le Minerale 600ml',
        category: 'Minuman',
        rackName: 'ETL-C1',
        unit: 'Btl',
        barcode: '8996001600261',
        systemStock: 24,
        physicalStock: 24,
        difference: 0,
        cogs: 2900,
        discrepancyValue: 0,
        isCounted: true,
        notes: 'Sesuai fisik chiller',
      },
      {
        productId: 'prod-18',
        productName: 'Aqua Botol 600ml',
        category: 'Minuman',
        rackName: 'ETL-C1',
        unit: 'Btl',
        barcode: '8886008101053',
        systemStock: 28,
        physicalStock: 29,
        difference: 1,
        cogs: 2850,
        discrepancyValue: 2850,
        isCounted: true,
        notes: 'Kelebihan 1 btl saat bongkar kardus',
      },
      {
        productId: 'prod-5',
        productName: 'Teh Pucuk Harum 350ml',
        category: 'Minuman',
        rackName: 'ETL-C1',
        unit: 'Btl',
        barcode: '8993175537555',
        systemStock: 20,
        physicalStock: 20,
        difference: 0,
        cogs: 3100,
        discrepancyValue: 0,
        isCounted: true,
        notes: 'Sesuai fisik',
      },
    ],
  },
];

export const INITIAL_STOCK_OPNAME_SCHEDULES: StockOpnameSchedule[] = [
  {
    id: 'sch-1',
    title: 'Opname Mingguan Minuman & Chiller',
    scope: 'Category',
    scopeTargetId: 'cat-2',
    scopeTargetName: 'Minuman',
    frequency: 'weekly',
    scheduledDate: getRelativeDateOnly(2),
    assignedRoleOrUser: 'Kasir / Staf Toko',
    isActive: true,
    createdAt: getRelativeDate(10, 0, 0),
  },
  {
    id: 'sch-2',
    title: 'Opname Bulanan Seluruh Toko (Full Audit)',
    scope: 'All',
    scopeTargetName: 'Semua Produk & Rak',
    frequency: 'monthly',
    scheduledDate: getRelativeDateOnly(8),
    assignedRoleOrUser: 'Owner / Supervisor',
    isActive: true,
    createdAt: getRelativeDate(20, 0, 0),
  },
];

export const INITIAL_SETTINGS: BusinessSettings = {
  name: 'Warung Juara',
  phone: '0812-9876-5432',
  address: 'Jl. Raya Kebayoran Lama No. 88, Jakarta Selatan',
  brandColor: '#0d9488',
  ownerName: 'Warung Juara',
  ownerEmail: 'warungjuara@gmail.com',
  ownerPhone: '0812-9876-5432',
  subscription: {
    tier: 'enterprise',
    status: 'active',
    expiresAt: '2099-12-31T23:59:59.000Z',
    activeBranchesLimit: 999,
    maxUsersLimit: 999,
    billingCycle: 'yearly',
  },
  printerName: 'POS Thermal Printer 58mm (USB/Bluetooth)',
  printerConnected: true,
  printerPaperSize: '58mm',
  autoPrintReceipt: false,
  cashDrawerName: 'Laci Kasir Standard RJ11',
  autoOpenCashDrawer: true,
  cashDrawerConnected: true,
  cashDrawerInterface: 'printer_kick',
  barcodeScannerName: 'USB HID Laser Barcode Scanner',
  barcodeScannerConnected: true,
};

export const INITIAL_ORDERS: Order[] = [
  // HARI INI (TODAY - 0 days ago)
  {
    id: 'ORD-TODAY-01',
    items: [
      { productId: 'prod-1', productName: 'Indomie Goreng Spesial', quantity: 2, sellingPrice: 3500, cogs: 2800, subtotal: 7000 },
      { productId: 'prod-3', productName: 'Le Minerale 600ml', quantity: 1, sellingPrice: 4000, cogs: 2900, subtotal: 4000 },
      { productId: 'prod-4', productName: 'Kopi Kapal Api Special Mix', quantity: 2, sellingPrice: 2000, cogs: 1400, subtotal: 4000 },
    ],
    total: 15000,
    totalCogs: 11300,
    paymentMethod: 'Cash',
    salesChannel: 'Offline / Kasir',
    cashTendered: 20000,
    changeAmount: 5000,
    status: 'Finished',
    createdAt: getRelativeDate(0, 8, 15),
  },
  {
    id: 'ORD-TODAY-02',
    items: [
      { productId: 'prod-6', productName: 'Beras Ramos Super 5kg', quantity: 1, sellingPrice: 74000, cogs: 65000, subtotal: 74000 },
      { productId: 'prod-8', productName: 'Minyak Goreng Bimoli 1L', quantity: 2, sellingPrice: 19500, cogs: 17000, subtotal: 39000 },
      { productId: 'prod-12', productName: 'Gula Pasir Gulaku Kuning 1kg', quantity: 1, sellingPrice: 18000, cogs: 15500, subtotal: 18000 },
    ],
    total: 131000,
    totalCogs: 114500,
    paymentMethod: 'ShopeePay',
    salesChannel: 'Shopee',
    externalOrderId: 'SHP-20260903-10021',
    externalOrderStatus: 'Selesai',
    status: 'Finished',
    createdAt: getRelativeDate(0, 10, 45),
  },
  {
    id: 'ORD-TODAY-03',
    items: [
      { productId: 'prod-1', productName: 'Indomie Goreng Spesial', quantity: 3, sellingPrice: 3500, cogs: 2800, subtotal: 10500 },
      { productId: 'prod-5', productName: 'Teh Pucuk Harum 350ml', quantity: 2, sellingPrice: 4000, cogs: 3100, subtotal: 8000 },
      { productId: 'prod-22', productName: 'Keripik Kentang Chitato Sapi Panggang 68g', quantity: 1, sellingPrice: 12000, cogs: 9800, subtotal: 12000 },
    ],
    total: 30500,
    totalCogs: 24400,
    paymentMethod: 'GoPay',
    salesChannel: 'GoFood',
    externalOrderId: 'GF-20260903-88319',
    externalOrderStatus: 'Selesai',
    status: 'Finished',
    createdAt: getRelativeDate(0, 12, 30),
  },
  {
    id: 'ORD-TODAY-04',
    items: [
      { productId: 'prod-9', productName: 'Rokok Sampoerna Mild 16', quantity: 1, sellingPrice: 35000, cogs: 31800, subtotal: 35000 },
      { productId: 'prod-4', productName: 'Kopi Kapal Api Special Mix', quantity: 3, sellingPrice: 2000, cogs: 1400, subtotal: 6000 },
    ],
    total: 41000,
    totalCogs: 36000,
    paymentMethod: 'QRIS',
    salesChannel: 'Offline / Kasir',
    status: 'Finished',
    createdAt: getRelativeDate(0, 15, 10),
  },
  {
    id: 'ORD-TODAY-05',
    items: [
      { productId: 'prod-20', productName: 'Deterjen Rinso Molto Anti Noda 770g', quantity: 1, sellingPrice: 22000, cogs: 18200, subtotal: 22000 },
      { productId: 'prod-21', productName: 'Pasta Gigi Pepsodent White 190g', quantity: 2, sellingPrice: 16500, cogs: 13500, subtotal: 33000 },
      { productId: 'prod-10', productName: 'Sabun Lifebuoy Total 10 85g', quantity: 3, sellingPrice: 4500, cogs: 3600, subtotal: 13500 },
    ],
    total: 68500,
    totalCogs: 56000,
    paymentMethod: 'GoPay / Tokopedia',
    salesChannel: 'Tokopedia',
    externalOrderId: 'TOPED-20260903-55012',
    externalOrderStatus: 'Selesai',
    status: 'Finished',
    createdAt: getRelativeDate(0, 17, 40),
  },

  // KEMARIN (YESTERDAY - 1 day ago)
  {
    id: 'ORD-YEST-01',
    items: [
      { productId: 'prod-7', productName: 'Telur Ayam Negeri 1 Kg', quantity: 1, sellingPrice: 28000, cogs: 24500, subtotal: 28000 },
      { productId: 'prod-2', productName: 'Indomie Kuah Ayam Bawang', quantity: 4, sellingPrice: 3500, cogs: 2750, subtotal: 14000 },
    ],
    total: 42000,
    totalCogs: 35500,
    paymentMethod: 'Cash',
    salesChannel: 'Offline / Kasir',
    cashTendered: 50000,
    changeAmount: 8000,
    status: 'Finished',
    createdAt: getRelativeDate(1, 9, 20),
  },
  {
    id: 'ORD-YEST-02',
    items: [
      { productId: 'prod-15', productName: 'Susu Ultra Milk Cokelat 250ml', quantity: 2, sellingPrice: 6500, cogs: 5200, subtotal: 13000 },
      { productId: 'prod-11', productName: 'Biskuit Roma Kelapa 300g', quantity: 1, sellingPrice: 11500, cogs: 9000, subtotal: 11500 },
    ],
    total: 24500,
    totalCogs: 19400,
    paymentMethod: 'OVO / GrabPay',
    salesChannel: 'GrabFood',
    externalOrderId: 'GBF-20260902-33108',
    externalOrderStatus: 'Selesai',
    status: 'Finished',
    createdAt: getRelativeDate(1, 13, 15),
  },
  {
    id: 'ORD-YEST-03',
    items: [
      { productId: 'prod-26', productName: 'Minyak Kayu Putih Cap Lang 60ml', quantity: 1, sellingPrice: 26500, cogs: 22000, subtotal: 26500 },
      { productId: 'prod-24', productName: 'Tolak Angin Cair Sidomuncul', quantity: 4, sellingPrice: 4500, cogs: 3400, subtotal: 18000 },
    ],
    total: 44500,
    totalCogs: 35600,
    paymentMethod: 'TikTok Pay / Transfer',
    salesChannel: 'TikTok Shop',
    externalOrderId: 'TTS-20260902-99014',
    externalOrderStatus: 'Selesai',
    status: 'Finished',
    createdAt: getRelativeDate(1, 16, 50),
  },
  {
    id: 'ORD-YEST-04',
    items: [
      { productId: 'prod-19', productName: 'Rokok Gudang Garam Surya 16', quantity: 1, sellingPrice: 36000, cogs: 32500, subtotal: 36000 },
    ],
    total: 36000,
    totalCogs: 32500,
    paymentMethod: 'Cash',
    salesChannel: 'Offline / Kasir',
    status: 'Canceled', // Untuk uji filter status batal
    notes: 'Dibatalkan kasir atas permintaan pembeli (salah ambil varian)',
    createdAt: getRelativeDate(1, 20, 10),
  },

  // 2 HARI LALU (2 days ago)
  {
    id: 'ORD-D2-01',
    items: [
      { productId: 'prod-1', productName: 'Indomie Goreng Spesial', quantity: 5, sellingPrice: 3500, cogs: 2800, subtotal: 17500 },
      { productId: 'prod-5', productName: 'Teh Pucuk Harum 350ml', quantity: 3, sellingPrice: 4000, cogs: 3100, subtotal: 12000 },
    ],
    total: 29500,
    totalCogs: 23300,
    paymentMethod: 'ShopeePay',
    salesChannel: 'ShopeeFood',
    externalOrderId: 'SPF-20260901-44192',
    externalOrderStatus: 'Selesai',
    status: 'Finished',
    createdAt: getRelativeDate(2, 11, 10),
  },
  {
    id: 'ORD-D2-02',
    items: [
      { productId: 'prod-13', productName: 'Kecap Manis Bango 520ml', quantity: 1, sellingPrice: 24000, cogs: 20200, subtotal: 24000 },
      { productId: 'prod-14', productName: 'Royco Bumbu Kaldu Ayam 230g', quantity: 1, sellingPrice: 11000, cogs: 8800, subtotal: 11000 },
      { productId: 'prod-28', productName: 'Tepung Bumbu Sasa Serbaguna 200g', quantity: 2, sellingPrice: 6500, cogs: 5000, subtotal: 13000 },
    ],
    total: 48000,
    totalCogs: 39000,
    paymentMethod: 'QRIS',
    salesChannel: 'Offline / Kasir',
    status: 'Finished',
    createdAt: getRelativeDate(2, 14, 35),
  },
  {
    id: 'ORD-D2-03',
    items: [
      { productId: 'prod-6', productName: 'Beras Ramos Super 5kg', quantity: 2, sellingPrice: 74000, cogs: 65000, subtotal: 148000 },
    ],
    total: 148000,
    totalCogs: 130000,
    paymentMethod: 'Transfer',
    salesChannel: 'Tokopedia',
    externalOrderId: 'TOPED-20260901-77810',
    externalOrderStatus: 'Selesai',
    status: 'Finished',
    createdAt: getRelativeDate(2, 18, 20),
  },

  // 3 HARI LALU (3 days ago)
  {
    id: 'ORD-D3-01',
    items: [
      { productId: 'prod-18', productName: 'Aqua Botol 600ml', quantity: 4, sellingPrice: 4000, cogs: 2850, subtotal: 16000 },
      { productId: 'prod-11', productName: 'Biskuit Roma Kelapa 300g', quantity: 2, sellingPrice: 11500, cogs: 9000, subtotal: 23000 },
    ],
    total: 39000,
    totalCogs: 29400,
    paymentMethod: 'Cash',
    salesChannel: 'Offline / Kasir',
    cashTendered: 50000,
    changeAmount: 11000,
    status: 'Finished',
    createdAt: getRelativeDate(3, 10, 5),
  },
  {
    id: 'ORD-D3-02',
    items: [
      { productId: 'prod-8', productName: 'Minyak Goreng Bimoli 1L', quantity: 3, sellingPrice: 19500, cogs: 17000, subtotal: 58500 },
      { productId: 'prod-12', productName: 'Gula Pasir Gulaku Kuning 1kg', quantity: 2, sellingPrice: 18000, cogs: 15500, subtotal: 36000 },
    ],
    total: 94500,
    totalCogs: 82000,
    paymentMethod: 'ShopeePay',
    salesChannel: 'Shopee',
    externalOrderId: 'SHP-20260831-22910',
    externalOrderStatus: 'Selesai',
    status: 'Finished',
    createdAt: getRelativeDate(3, 15, 45),
  },
  {
    id: 'ORD-D3-03',
    items: [
      { productId: 'prod-7', productName: 'Telur Ayam Negeri 1 Kg', quantity: 3, sellingPrice: 28000, cogs: 24500, subtotal: 84000 },
      { productId: 'prod-27', productName: 'Tepung Terigu Segitiga Biru 1kg', quantity: 2, sellingPrice: 13500, cogs: 11200, subtotal: 27000 },
    ],
    total: 111000,
    totalCogs: 95900,
    paymentMethod: 'Transfer',
    salesChannel: 'Other',
    externalOrderId: 'WA-PESANAN-8819',
    externalOrderStatus: 'Selesai',
    status: 'Finished',
    createdAt: getRelativeDate(3, 19, 30),
  },

  // 4 HARI LALU (4 days ago)
  {
    id: 'ORD-D4-01',
    items: [
      { productId: 'prod-1', productName: 'Indomie Goreng Spesial', quantity: 4, sellingPrice: 3500, cogs: 2800, subtotal: 14000 },
      { productId: 'prod-3', productName: 'Le Minerale 600ml', quantity: 2, sellingPrice: 4000, cogs: 2900, subtotal: 8000 },
    ],
    total: 22000,
    totalCogs: 17000,
    paymentMethod: 'GoPay',
    salesChannel: 'GoFood',
    externalOrderId: 'GF-20260830-19283',
    externalOrderStatus: 'Selesai',
    status: 'Finished',
    createdAt: getRelativeDate(4, 12, 15),
  },
  {
    id: 'ORD-D4-02',
    items: [
      { productId: 'prod-19', productName: 'Rokok Gudang Garam Surya 16', quantity: 1, sellingPrice: 36000, cogs: 32500, subtotal: 36000 },
      { productId: 'prod-4', productName: 'Kopi Kapal Api Special Mix', quantity: 4, sellingPrice: 2000, cogs: 1400, subtotal: 8000 },
    ],
    total: 44000,
    totalCogs: 38100,
    paymentMethod: 'Cash',
    salesChannel: 'Offline / Kasir',
    cashTendered: 50000,
    changeAmount: 6000,
    status: 'Finished',
    createdAt: getRelativeDate(4, 17, 0),
  },

  // 5 HARI LALU (5 days ago)
  {
    id: 'ORD-D5-01',
    items: [
      { productId: 'prod-23', productName: 'Roti Tawar Sari Roti Kupas', quantity: 1, sellingPrice: 16000, cogs: 13000, subtotal: 16000 },
      { productId: 'prod-15', productName: 'Susu Ultra Milk Cokelat 250ml', quantity: 2, sellingPrice: 6500, cogs: 5200, subtotal: 13000 },
    ],
    total: 29000,
    totalCogs: 23400,
    paymentMethod: 'OVO / GrabPay',
    salesChannel: 'GrabFood',
    externalOrderId: 'GBF-20260829-88129',
    externalOrderStatus: 'Selesai',
    status: 'Finished',
    createdAt: getRelativeDate(5, 11, 30),
  },
  {
    id: 'ORD-D5-02',
    items: [
      { productId: 'prod-22', productName: 'Keripik Kentang Chitato Sapi Panggang 68g', quantity: 2, sellingPrice: 12000, cogs: 9800, subtotal: 24000 },
      { productId: 'prod-11', productName: 'Biskuit Roma Kelapa 300g', quantity: 2, sellingPrice: 11500, cogs: 9000, subtotal: 23000 },
    ],
    total: 47000,
    totalCogs: 37600,
    paymentMethod: 'TikTok Pay / Transfer',
    salesChannel: 'TikTok Shop',
    externalOrderId: 'TTS-20260829-44122',
    externalOrderStatus: 'Selesai',
    status: 'Finished',
    createdAt: getRelativeDate(5, 16, 40),
  },

  // 6 HARI LALU (6 days ago)
  {
    id: 'ORD-D6-01',
    items: [
      { productId: 'prod-25', productName: 'Paramex Obat Sakit Kepala 4 Tablet', quantity: 2, sellingPrice: 3000, cogs: 2100, subtotal: 6000 },
      { productId: 'prod-24', productName: 'Tolak Angin Cair Sidomuncul', quantity: 3, sellingPrice: 4500, cogs: 3400, subtotal: 13500 },
      { productId: 'prod-3', productName: 'Le Minerale 600ml', quantity: 1, sellingPrice: 4000, cogs: 2900, subtotal: 4000 },
    ],
    total: 23500,
    totalCogs: 17300,
    paymentMethod: 'QRIS',
    salesChannel: 'Offline / Kasir',
    status: 'Finished',
    createdAt: getRelativeDate(6, 9, 50),
  },
  {
    id: 'ORD-D6-02',
    items: [
      { productId: 'prod-6', productName: 'Beras Ramos Super 5kg', quantity: 1, sellingPrice: 74000, cogs: 65000, subtotal: 74000 },
      { productId: 'prod-7', productName: 'Telur Ayam Negeri 1 Kg', quantity: 1, sellingPrice: 28000, cogs: 24500, subtotal: 28000 },
    ],
    total: 102000,
    totalCogs: 89500,
    paymentMethod: 'ShopeePay',
    salesChannel: 'Shopee',
    externalOrderId: 'SHP-20260828-55011',
    externalOrderStatus: 'Selesai',
    status: 'Finished',
    createdAt: getRelativeDate(6, 14, 10),
  },

  // 7 HARI LALU (7 days ago)
  {
    id: 'ORD-D7-01',
    items: [
      { productId: 'prod-8', productName: 'Minyak Goreng Bimoli 1L', quantity: 2, sellingPrice: 19500, cogs: 17000, subtotal: 39000 },
      { productId: 'prod-13', productName: 'Kecap Manis Bango 520ml', quantity: 1, sellingPrice: 24000, cogs: 20200, subtotal: 24000 },
    ],
    total: 63000,
    totalCogs: 54200,
    paymentMethod: 'GoPay / Tokopedia',
    salesChannel: 'Tokopedia',
    externalOrderId: 'TOPED-20260827-11029',
    externalOrderStatus: 'Selesai',
    status: 'Finished',
    createdAt: getRelativeDate(7, 13, 20),
  },
  {
    id: 'ORD-D7-02',
    items: [
      { productId: 'prod-9', productName: 'Rokok Sampoerna Mild 16', quantity: 2, sellingPrice: 35000, cogs: 31800, subtotal: 70000 },
      { productId: 'prod-5', productName: 'Teh Pucuk Harum 350ml', quantity: 2, sellingPrice: 4000, cogs: 3100, subtotal: 8000 },
    ],
    total: 78000,
    totalCogs: 69800,
    paymentMethod: 'Cash',
    salesChannel: 'Offline / Kasir',
    cashTendered: 100000,
    changeAmount: 22000,
    status: 'Finished',
    createdAt: getRelativeDate(7, 18, 45),
  },

  // 9 HARI LALU (9 days ago)
  {
    id: 'ORD-D9-01',
    items: [
      { productId: 'prod-6', productName: 'Beras Ramos Super 5kg', quantity: 2, sellingPrice: 74000, cogs: 65000, subtotal: 148000 },
      { productId: 'prod-8', productName: 'Minyak Goreng Bimoli 1L', quantity: 2, sellingPrice: 19500, cogs: 17000, subtotal: 39000 },
      { productId: 'prod-12', productName: 'Gula Pasir Gulaku Kuning 1kg', quantity: 2, sellingPrice: 18000, cogs: 15500, subtotal: 36000 },
    ],
    total: 223000,
    totalCogs: 195000,
    paymentMethod: 'ShopeePay',
    salesChannel: 'Shopee',
    externalOrderId: 'SHP-20260825-77192',
    externalOrderStatus: 'Selesai',
    status: 'Finished',
    createdAt: getRelativeDate(9, 11, 15),
  },
  {
    id: 'ORD-D9-02',
    items: [
      { productId: 'prod-1', productName: 'Indomie Goreng Spesial', quantity: 6, sellingPrice: 3500, cogs: 2800, subtotal: 21000 },
      { productId: 'prod-4', productName: 'Kopi Kapal Api Special Mix', quantity: 5, sellingPrice: 2000, cogs: 1400, subtotal: 10000 },
      { productId: 'prod-3', productName: 'Le Minerale 600ml', quantity: 2, sellingPrice: 4000, cogs: 2900, subtotal: 8000 },
    ],
    total: 39000,
    totalCogs: 29600,
    paymentMethod: 'QRIS',
    salesChannel: 'Offline / Kasir',
    status: 'Finished',
    createdAt: getRelativeDate(9, 15, 40),
  },

  // 11 HARI LALU (11 days ago)
  {
    id: 'ORD-D11-01',
    items: [
      { productId: 'prod-20', productName: 'Deterjen Rinso Molto Anti Noda 770g', quantity: 2, sellingPrice: 22000, cogs: 18200, subtotal: 44000 },
      { productId: 'prod-21', productName: 'Pasta Gigi Pepsodent White 190g', quantity: 2, sellingPrice: 16500, cogs: 13500, subtotal: 33000 },
      { productId: 'prod-10', productName: 'Sabun Lifebuoy Total 10 85g', quantity: 4, sellingPrice: 4500, cogs: 3600, subtotal: 18000 },
    ],
    total: 95000,
    totalCogs: 77800,
    paymentMethod: 'GoPay / Tokopedia',
    salesChannel: 'Tokopedia',
    externalOrderId: 'TOPED-20260823-33910',
    externalOrderStatus: 'Selesai',
    status: 'Finished',
    createdAt: getRelativeDate(11, 10, 20),
  },
  {
    id: 'ORD-D11-02',
    items: [
      { productId: 'prod-19', productName: 'Rokok Gudang Garam Surya 16', quantity: 1, sellingPrice: 36000, cogs: 32500, subtotal: 36000 },
      { productId: 'prod-9', productName: 'Rokok Sampoerna Mild 16', quantity: 1, sellingPrice: 35000, cogs: 31800, subtotal: 35000 },
    ],
    total: 71000,
    totalCogs: 64300,
    paymentMethod: 'Cash',
    salesChannel: 'Offline / Kasir',
    cashTendered: 100000,
    changeAmount: 29000,
    status: 'Finished',
    createdAt: getRelativeDate(11, 19, 10),
  },

  // 13 HARI LALU (13 days ago)
  {
    id: 'ORD-D13-01',
    items: [
      { productId: 'prod-26', productName: 'Minyak Kayu Putih Cap Lang 60ml', quantity: 2, sellingPrice: 26500, cogs: 22000, subtotal: 53000 },
      { productId: 'prod-24', productName: 'Tolak Angin Cair Sidomuncul', quantity: 6, sellingPrice: 4500, cogs: 3400, subtotal: 27000 },
      { productId: 'prod-25', productName: 'Paramex Obat Sakit Kepala 4 Tablet', quantity: 3, sellingPrice: 3000, cogs: 2100, subtotal: 9000 },
    ],
    total: 89000,
    totalCogs: 70700,
    paymentMethod: 'TikTok Pay / Transfer',
    salesChannel: 'TikTok Shop',
    externalOrderId: 'TTS-20260821-66014',
    externalOrderStatus: 'Selesai',
    status: 'Finished',
    createdAt: getRelativeDate(13, 14, 30),
  },
  {
    id: 'ORD-D13-02',
    items: [
      { productId: 'prod-7', productName: 'Telur Ayam Negeri 1 Kg', quantity: 2, sellingPrice: 28000, cogs: 24500, subtotal: 56000 },
      { productId: 'prod-27', productName: 'Tepung Terigu Segitiga Biru 1kg', quantity: 2, sellingPrice: 13500, cogs: 11200, subtotal: 27000 },
    ],
    total: 83000,
    totalCogs: 71400,
    paymentMethod: 'Cash',
    salesChannel: 'Offline / Kasir',
    cashTendered: 100000,
    changeAmount: 17000,
    status: 'Finished',
    createdAt: getRelativeDate(13, 17, 45),
  },

  // 15 HARI LALU (15 days ago)
  {
    id: 'ORD-D15-01',
    items: [
      { productId: 'prod-1', productName: 'Indomie Goreng Spesial', quantity: 10, sellingPrice: 3500, cogs: 2800, subtotal: 35000 },
      { productId: 'prod-2', productName: 'Indomie Kuah Ayam Bawang', quantity: 10, sellingPrice: 3500, cogs: 2750, subtotal: 35000 },
      { productId: 'prod-5', productName: 'Teh Pucuk Harum 350ml', quantity: 6, sellingPrice: 4000, cogs: 3100, subtotal: 24000 },
    ],
    total: 94000,
    totalCogs: 74100,
    paymentMethod: 'QRIS',
    salesChannel: 'Offline / Kasir',
    status: 'Finished',
    createdAt: getRelativeDate(15, 12, 0),
  },
  {
    id: 'ORD-D15-02',
    items: [
      { productId: 'prod-22', productName: 'Keripik Kentang Chitato Sapi Panggang 68g', quantity: 2, sellingPrice: 12000, cogs: 9800, subtotal: 24000 },
      { productId: 'prod-15', productName: 'Susu Ultra Milk Cokelat 250ml', quantity: 3, sellingPrice: 6500, cogs: 5200, subtotal: 19500 },
      { productId: 'prod-11', productName: 'Biskuit Roma Kelapa 300g', quantity: 1, sellingPrice: 11500, cogs: 9000, subtotal: 11500 },
    ],
    total: 55000,
    totalCogs: 44200,
    paymentMethod: 'GoPay',
    salesChannel: 'GoFood',
    externalOrderId: 'GF-20260819-44102',
    externalOrderStatus: 'Selesai',
    status: 'Finished',
    createdAt: getRelativeDate(15, 16, 20),
  },

  // 18 HARI LALU (18 days ago)
  {
    id: 'ORD-D18-01',
    items: [
      { productId: 'prod-6', productName: 'Beras Ramos Super 5kg', quantity: 3, sellingPrice: 74000, cogs: 65000, subtotal: 222000 },
      { productId: 'prod-8', productName: 'Minyak Goreng Bimoli 1L', quantity: 3, sellingPrice: 19500, cogs: 17000, subtotal: 58500 },
    ],
    total: 280500,
    totalCogs: 246000,
    paymentMethod: 'Transfer',
    salesChannel: 'Other',
    externalOrderId: 'WA-PESANAN-1902',
    externalOrderStatus: 'Selesai',
    status: 'Finished',
    createdAt: getRelativeDate(18, 9, 30),
  },
  {
    id: 'ORD-D18-02',
    items: [
      { productId: 'prod-13', productName: 'Kecap Manis Bango 520ml', quantity: 1, sellingPrice: 24000, cogs: 20200, subtotal: 24000 },
      { productId: 'prod-14', productName: 'Royco Bumbu Kaldu Ayam 230g', quantity: 2, sellingPrice: 11000, cogs: 8800, subtotal: 22000 },
      { productId: 'prod-28', productName: 'Tepung Bumbu Sasa Serbaguna 200g', quantity: 3, sellingPrice: 6500, cogs: 5000, subtotal: 19500 },
    ],
    total: 65500,
    totalCogs: 52800,
    paymentMethod: 'Cash',
    salesChannel: 'Offline / Kasir',
    cashTendered: 70000,
    changeAmount: 4500,
    status: 'Finished',
    createdAt: getRelativeDate(18, 14, 15),
  },

  // 21 HARI LALU (21 days ago)
  {
    id: 'ORD-D21-01',
    items: [
      { productId: 'prod-18', productName: 'Aqua Botol 600ml', quantity: 6, sellingPrice: 4000, cogs: 2850, subtotal: 24000 },
      { productId: 'prod-3', productName: 'Le Minerale 600ml', quantity: 4, sellingPrice: 4000, cogs: 2900, subtotal: 16000 },
      { productId: 'prod-23', productName: 'Roti Tawar Sari Roti Kupas', quantity: 2, sellingPrice: 16000, cogs: 13000, subtotal: 32000 },
    ],
    total: 72000,
    totalCogs: 54700,
    paymentMethod: 'ShopeePay',
    salesChannel: 'ShopeeFood',
    externalOrderId: 'SPF-20260813-88219',
    externalOrderStatus: 'Selesai',
    status: 'Finished',
    createdAt: getRelativeDate(21, 11, 40),
  },
  {
    id: 'ORD-D21-02',
    items: [
      { productId: 'prod-9', productName: 'Rokok Sampoerna Mild 16', quantity: 2, sellingPrice: 35000, cogs: 31800, subtotal: 70000 },
      { productId: 'prod-4', productName: 'Kopi Kapal Api Special Mix', quantity: 4, sellingPrice: 2000, cogs: 1400, subtotal: 8000 },
    ],
    total: 78000,
    totalCogs: 69200,
    paymentMethod: 'QRIS',
    salesChannel: 'Offline / Kasir',
    status: 'Finished',
    createdAt: getRelativeDate(21, 20, 15),
  },

  // 24 HARI LALU (24 days ago)
  {
    id: 'ORD-D24-01',
    items: [
      { productId: 'prod-8', productName: 'Minyak Goreng Bimoli 1L', quantity: 4, sellingPrice: 19500, cogs: 17000, subtotal: 78000 },
      { productId: 'prod-12', productName: 'Gula Pasir Gulaku Kuning 1kg', quantity: 3, sellingPrice: 18000, cogs: 15500, subtotal: 54000 },
    ],
    total: 132000,
    totalCogs: 114500,
    paymentMethod: 'ShopeePay',
    salesChannel: 'Shopee',
    externalOrderId: 'SHP-20260810-11928',
    externalOrderStatus: 'Selesai',
    status: 'Finished',
    createdAt: getRelativeDate(24, 13, 25),
  },
  {
    id: 'ORD-D24-02',
    items: [
      { productId: 'prod-7', productName: 'Telur Ayam Negeri 1 Kg', quantity: 2, sellingPrice: 28000, cogs: 24500, subtotal: 56000 },
      { productId: 'prod-1', productName: 'Indomie Goreng Spesial', quantity: 5, sellingPrice: 3500, cogs: 2800, subtotal: 17500 },
    ],
    total: 73500,
    totalCogs: 63000,
    paymentMethod: 'Cash',
    salesChannel: 'Offline / Kasir',
    cashTendered: 100000,
    changeAmount: 26500,
    status: 'Finished',
    createdAt: getRelativeDate(24, 17, 50),
  },

  // 27 HARI LALU (27 days ago)
  {
    id: 'ORD-D27-01',
    items: [
      { productId: 'prod-20', productName: 'Deterjen Rinso Molto Anti Noda 770g', quantity: 2, sellingPrice: 22000, cogs: 18200, subtotal: 44000 },
      { productId: 'prod-10', productName: 'Sabun Lifebuoy Total 10 85g', quantity: 5, sellingPrice: 4500, cogs: 3600, subtotal: 22500 },
      { productId: 'prod-21', productName: 'Pasta Gigi Pepsodent White 190g', quantity: 1, sellingPrice: 16500, cogs: 13500, subtotal: 16500 },
    ],
    total: 83000,
    totalCogs: 67900,
    paymentMethod: 'GoPay / Tokopedia',
    salesChannel: 'Tokopedia',
    externalOrderId: 'TOPED-20260807-55829',
    externalOrderStatus: 'Selesai',
    status: 'Finished',
    createdAt: getRelativeDate(27, 10, 10),
  },
  {
    id: 'ORD-D27-02',
    items: [
      { productId: 'prod-19', productName: 'Rokok Gudang Garam Surya 16', quantity: 2, sellingPrice: 36000, cogs: 32500, subtotal: 72000 },
    ],
    total: 72000,
    totalCogs: 65000,
    paymentMethod: 'Cash',
    salesChannel: 'Offline / Kasir',
    cashTendered: 100000,
    changeAmount: 28000,
    status: 'Finished',
    createdAt: getRelativeDate(27, 19, 30),
  },

  // 29 HARI LALU (29 days ago)
  {
    id: 'ORD-D29-01',
    items: [
      { productId: 'prod-6', productName: 'Beras Ramos Super 5kg', quantity: 2, sellingPrice: 74000, cogs: 65000, subtotal: 148000 },
      { productId: 'prod-7', productName: 'Telur Ayam Negeri 1 Kg', quantity: 1, sellingPrice: 28000, cogs: 24500, subtotal: 28000 },
    ],
    total: 176000,
    totalCogs: 154500,
    paymentMethod: 'Transfer',
    salesChannel: 'Other',
    externalOrderId: 'WA-PESANAN-0829',
    externalOrderStatus: 'Selesai',
    status: 'Finished',
    createdAt: getRelativeDate(29, 9, 15),
  },
  {
    id: 'ORD-D29-02',
    items: [
      { productId: 'prod-1', productName: 'Indomie Goreng Spesial', quantity: 8, sellingPrice: 3500, cogs: 2800, subtotal: 28000 },
      { productId: 'prod-15', productName: 'Susu Ultra Milk Cokelat 250ml', quantity: 2, sellingPrice: 6500, cogs: 5200, subtotal: 13000 },
      { productId: 'prod-22', productName: 'Keripik Kentang Chitato Sapi Panggang 68g', quantity: 1, sellingPrice: 12000, cogs: 9800, subtotal: 12000 },
    ],
    total: 53000,
    totalCogs: 42600,
    paymentMethod: 'QRIS',
    salesChannel: 'Offline / Kasir',
    status: 'Finished',
    createdAt: getRelativeDate(29, 16, 45),
  },
];

export const INITIAL_RESTOCKS: RestockRecord[] = [
  {
    id: 'rst-1',
    productId: 'prod-1',
    productName: 'Indomie Goreng Spesial',
    quantity: 40,
    purchaseCostPerItem: 2800,
    totalCost: 112000,
    previousStock: 8,
    resultingStock: 48,
    previousCogs: 2800,
    newCogs: 2800,
    date: getRelativeDate(3, 9, 0),
    notes: 'Restock mingguan dari agen grosir Indomarco',
  },
  {
    id: 'rst-2',
    productId: 'prod-9',
    productName: 'Rokok Sampoerna Mild 16',
    quantity: 20,
    purchaseCostPerItem: 31800,
    totalCost: 636000,
    previousStock: 3,
    resultingStock: 23,
    previousCogs: 31800,
    newCogs: 31800,
    date: getRelativeDate(4, 11, 30),
    notes: 'Restock sales rokok PT HM Sampoerna',
  },
  {
    id: 'rst-3',
    productId: 'prod-6',
    productName: 'Beras Ramos Super 5kg',
    quantity: 10,
    purchaseCostPerItem: 65000,
    totalCost: 650000,
    previousStock: 2,
    resultingStock: 12,
    previousCogs: 65000,
    newCogs: 65000,
    date: getRelativeDate(5, 8, 45),
    notes: 'Kulakan beras pasar induk Cipinang',
  },
  {
    id: 'rst-4',
    productId: 'prod-8',
    productName: 'Minyak Goreng Bimoli 1L',
    quantity: 24,
    purchaseCostPerItem: 17000,
    totalCost: 408000,
    previousStock: 4,
    resultingStock: 28,
    previousCogs: 17000,
    newCogs: 17000,
    date: getRelativeDate(6, 14, 15),
    notes: 'Restock 2 karton minyak Bimoli',
  },
  {
    id: 'rst-5',
    productId: 'prod-7',
    productName: 'Telur Ayam Negeri 1 Kg',
    quantity: 20,
    purchaseCostPerItem: 24500,
    totalCost: 490000,
    previousStock: 5,
    resultingStock: 25,
    previousCogs: 24500,
    newCogs: 24500,
    date: getRelativeDate(2, 7, 30),
    notes: 'Restock 1 peti telur ayam peternak lokal',
  },
  {
    id: 'rst-6',
    productId: 'prod-18',
    productName: 'Aqua Botol 600ml',
    quantity: 48,
    purchaseCostPerItem: 2850,
    totalCost: 136800,
    previousStock: 6,
    resultingStock: 54,
    previousCogs: 2850,
    newCogs: 2850,
    date: getRelativeDate(9, 10, 0),
    notes: 'Restock 2 dus Aqua 600ml distributor Danone',
  },
  {
    id: 'rst-7',
    productId: 'prod-12',
    productName: 'Gula Pasir Gulaku Kuning 1kg',
    quantity: 25,
    purchaseCostPerItem: 15500,
    totalCost: 387500,
    previousStock: 4,
    resultingStock: 29,
    previousCogs: 15500,
    newCogs: 15500,
    date: getRelativeDate(14, 11, 20),
    notes: 'Restock 1 karung Gulaku 25kg',
  },
  {
    id: 'rst-8',
    productId: 'prod-20',
    productName: 'Deterjen Rinso Molto Anti Noda 770g',
    quantity: 12,
    purchaseCostPerItem: 18200,
    totalCost: 218400,
    previousStock: 2,
    resultingStock: 14,
    previousCogs: 18200,
    newCogs: 18200,
    date: getRelativeDate(19, 13, 40),
    notes: 'Restock 1 dus Rinso dari Unilever sales',
  },
  {
    id: 'rst-9',
    productId: 'prod-4',
    productName: 'Kopi Kapal Api Special Mix',
    quantity: 60,
    purchaseCostPerItem: 1400,
    totalCost: 84000,
    previousStock: 10,
    resultingStock: 70,
    previousCogs: 1400,
    newCogs: 1400,
    date: getRelativeDate(23, 9, 30),
    notes: 'Restock 6 renceng kopi Kapal Api',
  },
  {
    id: 'rst-10',
    productId: 'prod-6',
    productName: 'Beras Ramos Super 5kg',
    quantity: 15,
    purchaseCostPerItem: 65000,
    totalCost: 975000,
    previousStock: 1,
    resultingStock: 16,
    previousCogs: 65000,
    newCogs: 65000,
    date: getRelativeDate(28, 8, 15),
    notes: 'Kulakan beras awal bulan pasar induk Cipinang',
  },
];

export const INITIAL_REVENUES: Revenue[] = [
  ...INITIAL_ORDERS
    .filter(ord => ord.status === 'Finished')
    .map(ord => ({
      id: `rev-${ord.id}`,
      amount: ord.total,
      source: 'Order' as const,
      salesChannel: ord.salesChannel,
      orderId: ord.id,
      description: `Penjualan ${ord.salesChannel} (${ord.items.length} item)`,
      date: ord.createdAt,
    })),
  {
    id: 'rev-extra-1',
    amount: 125000,
    source: 'Manual' as const,
    description: 'Komisi Agen Pembayaran Listrik PLN & BPJS',
    date: getRelativeDate(15, 14, 0),
    notes: 'Komisi transaksi loket PPOB bulan berjalan',
  },
  {
    id: 'rev-extra-2',
    amount: 60000,
    source: 'Manual' as const,
    description: 'Bagi Hasil Titipan Kue Basah & Gorengan Pagi',
    date: getRelativeDate(2, 11, 30),
    notes: 'Bagi hasil 20% dari 60 pcs kue terjual',
  },
  {
    id: 'rev-extra-3',
    amount: 210000,
    source: 'Manual' as const,
    description: 'Margin Penjualan Isi Ulang Gas LPG 3kg & Galon Aqua',
    date: getRelativeDate(8, 16, 20),
    notes: 'Penjualan 15 tabung gas & 12 galon',
  },
  {
    id: 'rev-extra-4',
    amount: 85000,
    source: 'Manual' as const,
    description: 'Komisi Top-Up Dompet Digital & Pulsa Reguler',
    date: getRelativeDate(22, 18, 15),
    notes: 'Komisi per transaksi Rp 2.000',
  },
];

export const INITIAL_CHANNEL_INTEGRATIONS: ChannelIntegration[] = [
  {
    id: 'chan-shopee',
    channel: 'Shopee',
    connectionStatus: 'connected',
    connectedAt: getRelativeDate(7, 10, 0),
    lastSyncAt: getRelativeDate(0, 14, 20),
    lastSyncStatus: 'success',
    syncOrdersCount: 16,
    syncErrorCount: 0,
    storeName: 'Warung Madura Berkah Official',
    storeIdentifier: 'ID-SHP-882194',
    autoSyncEnabled: true,
  },
  {
    id: 'chan-tokopedia',
    channel: 'Tokopedia',
    connectionStatus: 'connected',
    connectedAt: getRelativeDate(7, 10, 0),
    lastSyncAt: getRelativeDate(0, 11, 45),
    lastSyncStatus: 'success',
    syncOrdersCount: 12,
    syncErrorCount: 1,
    storeName: 'Warung Madura Toko Online',
    storeIdentifier: 'TOPED-STORE-4401',
    autoSyncEnabled: true,
  },
  {
    id: 'chan-tiktok',
    channel: 'TikTok Shop',
    connectionStatus: 'connected',
    connectedAt: getRelativeDate(6, 12, 0),
    lastSyncAt: getRelativeDate(1, 16, 50),
    lastSyncStatus: 'success',
    syncOrdersCount: 7,
    syncErrorCount: 0,
    storeName: 'WarungMaduraLive',
    storeIdentifier: 'TTS-SELLER-9912',
    autoSyncEnabled: false,
  },
  {
    id: 'chan-gofood',
    channel: 'GoFood',
    connectionStatus: 'connected',
    connectedAt: getRelativeDate(7, 9, 0),
    lastSyncAt: getRelativeDate(0, 12, 35),
    lastSyncStatus: 'success',
    syncOrdersCount: 14,
    syncErrorCount: 0,
    storeName: 'Warung Madura 24 Jam - Cabang Utama',
    storeIdentifier: 'GF-OUTLET-10023',
    autoSyncEnabled: true,
  },
  {
    id: 'chan-grabfood',
    channel: 'GrabFood',
    connectionStatus: 'connected',
    connectedAt: getRelativeDate(7, 9, 30),
    lastSyncAt: getRelativeDate(1, 13, 20),
    lastSyncStatus: 'success',
    syncOrdersCount: 10,
    syncErrorCount: 0,
    storeName: 'Warung Madura Grab - Kemang',
    storeIdentifier: 'GB-RESTO-7718',
    autoSyncEnabled: true,
  },
  {
    id: 'chan-shopeefood',
    channel: 'ShopeeFood',
    connectionStatus: 'connected',
    connectedAt: getRelativeDate(5, 11, 0),
    lastSyncAt: getRelativeDate(2, 11, 15),
    lastSyncStatus: 'success',
    syncOrdersCount: 6,
    syncErrorCount: 0,
    storeName: 'Warung Madura ShopeeFood',
    storeIdentifier: 'SPF-MERCHANT-5510',
    autoSyncEnabled: true,
  },
  {
    id: 'chan-other',
    channel: 'Other',
    connectionStatus: 'disconnected',
    syncOrdersCount: 3,
    syncErrorCount: 0,
    storeName: 'Channel Kustom / Pesanan WhatsApp',
    storeIdentifier: 'CH-CUSTOM-01',
    autoSyncEnabled: false,
  },
];

export const INITIAL_PRODUCT_MAPPINGS: ProductChannelMapping[] = [
  {
    id: 'map-1',
    channel: 'Shopee',
    externalProductId: 'SHP-ITEM-101',
    externalProductName: 'Indomie Goreng Spesial 85gr Satuan',
    externalSku: 'SHP-IND-01',
    productId: 'prod-1',
    productName: 'Indomie Goreng Spesial',
    mappingStatus: 'mapped',
    lastUpdated: getRelativeDate(1, 10, 0),
  },
  {
    id: 'map-2',
    channel: 'Shopee',
    externalProductId: 'SHP-ITEM-102',
    externalProductName: 'Beras Ramos Super 5kg Kemasan Karung',
    externalSku: 'SHP-BRS-5KG',
    productId: 'prod-6',
    productName: 'Beras Ramos Super 5kg',
    mappingStatus: 'mapped',
    lastUpdated: getRelativeDate(1, 10, 5),
  },
  {
    id: 'map-3',
    channel: 'Shopee',
    externalProductId: 'SHP-ITEM-103',
    externalProductName: 'Minyak Goreng Bimoli 1 Liter Pouch',
    externalSku: 'SHP-BIM-1L',
    productId: 'prod-8',
    productName: 'Minyak Goreng Bimoli 1L',
    mappingStatus: 'mapped',
    lastUpdated: getRelativeDate(1, 10, 10),
  },
  {
    id: 'map-4',
    channel: 'Shopee',
    externalProductId: 'SHP-ITEM-104',
    externalProductName: 'Gula Pasir Gulaku Kuning 1kg',
    externalSku: 'SHP-GLA-1KG',
    productId: 'prod-12',
    productName: 'Gula Pasir Gulaku Kuning 1kg',
    mappingStatus: 'mapped',
    lastUpdated: getRelativeDate(1, 10, 15),
  },
  {
    id: 'map-5',
    channel: 'Tokopedia',
    externalProductId: 'TOPED-ITEM-201',
    externalProductName: 'Minyak Goreng Bimoli 1 Liter Pouch',
    externalSku: 'TPD-BIM-1L',
    productId: 'prod-8',
    productName: 'Minyak Goreng Bimoli 1L',
    mappingStatus: 'mapped',
    lastUpdated: getRelativeDate(2, 9, 30),
  },
  {
    id: 'map-6',
    channel: 'Tokopedia',
    externalProductId: 'TOPED-ITEM-202',
    externalProductName: 'Kopi Kapal Api Special Mix Renceng / Sachet',
    externalSku: 'TPD-KPL-01',
    productId: 'prod-4',
    productName: 'Kopi Kapal Api Special Mix',
    mappingStatus: 'mapped',
    lastUpdated: getRelativeDate(2, 9, 45),
  },
  {
    id: 'map-7',
    channel: 'Tokopedia',
    externalProductId: 'TOPED-ITEM-203',
    externalProductName: 'Deterjen Rinso Molto Anti Noda 770g',
    externalSku: 'TPD-RNS-770',
    productId: 'prod-20',
    productName: 'Deterjen Rinso Molto Anti Noda 770g',
    mappingStatus: 'mapped',
    lastUpdated: getRelativeDate(2, 10, 0),
  },
  {
    id: 'map-8',
    channel: 'GoFood',
    externalProductId: 'GF-MENU-301',
    externalProductName: 'Indomie Goreng Spesial Panas Telur',
    externalSku: 'GF-IND-AYM',
    productId: 'prod-1',
    productName: 'Indomie Goreng Spesial',
    mappingStatus: 'mapped',
    lastUpdated: getRelativeDate(2, 11, 0),
  },
  {
    id: 'map-9',
    channel: 'GoFood',
    externalProductId: 'GF-MENU-302',
    externalProductName: 'Le Minerale 600ml Dingin',
    externalSku: 'GF-LMN-600',
    productId: 'prod-3',
    productName: 'Le Minerale 600ml',
    mappingStatus: 'mapped',
    lastUpdated: getRelativeDate(2, 11, 15),
  },
  {
    id: 'map-10',
    channel: 'GrabFood',
    externalProductId: 'GBF-MENU-401',
    externalProductName: 'Teh Pucuk Harum Dingin 350ml Botol',
    externalSku: 'GB-TPC-350',
    productId: 'prod-5',
    productName: 'Teh Pucuk Harum 350ml',
    mappingStatus: 'mapped',
    lastUpdated: getRelativeDate(3, 14, 0),
  },
  {
    id: 'map-11',
    channel: 'GrabFood',
    externalProductId: 'GBF-MENU-402',
    externalProductName: 'Susu Ultra Milk Cokelat Kotak 250ml',
    externalSku: 'GB-ULT-250',
    productId: 'prod-15',
    productName: 'Susu Ultra Milk Cokelat 250ml',
    mappingStatus: 'mapped',
    lastUpdated: getRelativeDate(3, 14, 20),
  },
  {
    id: 'map-12',
    channel: 'ShopeeFood',
    externalProductId: 'SPF-MENU-501',
    externalProductName: 'Air Mineral Le Minerale 600ml Dingin',
    externalSku: 'SPF-LMN-600',
    productId: 'prod-3',
    productName: 'Le Minerale 600ml',
    mappingStatus: 'mapped',
    lastUpdated: getRelativeDate(3, 15, 30),
  },
  {
    id: 'map-13',
    channel: 'TikTok Shop',
    externalProductId: 'TTS-ITEM-601',
    externalProductName: 'Biskuit Roma Kelapa 300g Kaleng / Pack',
    externalSku: 'TTS-ROMA-300',
    productId: 'prod-11',
    productName: 'Biskuit Roma Kelapa 300g',
    mappingStatus: 'mapped',
    lastUpdated: getRelativeDate(4, 16, 0),
  },
  {
    id: 'map-14',
    channel: 'TikTok Shop',
    externalProductId: 'TTS-ITEM-602',
    externalProductName: 'Minyak Kayu Putih Cap Lang 60ml Original',
    externalSku: 'TTS-CKL-60',
    productId: 'prod-26',
    productName: 'Minyak Kayu Putih Cap Lang 60ml',
    mappingStatus: 'mapped',
    lastUpdated: getRelativeDate(4, 16, 15),
  },
  {
    id: 'map-15',
    channel: 'Shopee',
    externalProductId: 'SHP-ITEM-999',
    externalProductName: 'Snack Chiki Balls Keju 55g (Produk Baru Eksternal)',
    externalSku: 'SHP-CHK-55',
    productId: undefined,
    productName: undefined,
    mappingStatus: 'unmapped',
    lastUpdated: getRelativeDate(0, 8, 20),
  },
  {
    id: 'map-16',
    channel: 'Tokopedia',
    externalProductId: 'TOPED-ITEM-888',
    externalProductName: 'Sabun Cuci Piring Mama Lemon 750ml Refill',
    externalSku: 'TPD-MML-750',
    productId: undefined,
    productName: undefined,
    mappingStatus: 'unmapped',
    lastUpdated: getRelativeDate(0, 8, 45),
  },
];

export const INITIAL_CHANNEL_SYNC_ERRORS: ChannelSyncError[] = [
  {
    id: 'err-1',
    channel: 'Tokopedia',
    externalOrderId: 'TOPED-20260828-99011',
    errorCode: 'PRODUCT_UNMAPPED',
    errorMessage: 'Item "Snack Chiki Balls Keju 55g" belum dipetakan ke katalog produk internal.',
    timestamp: getRelativeDate(0, 9, 15),
    resolved: false,
  },
];

export const INITIAL_COSTS: Cost[] = [
  {
    id: 'cost-1',
    amount: 112000,
    category: 'Restock',
    source: 'Restock',
    restockId: 'rst-1',
    description: 'Restock: Indomie Goreng Spesial (40 Bks)',
    date: getRelativeDate(3, 9, 0),
  },
  {
    id: 'cost-2',
    amount: 636000,
    category: 'Restock',
    source: 'Restock',
    restockId: 'rst-2',
    description: 'Restock: Rokok Sampoerna Mild 16 (20 Bks)',
    date: getRelativeDate(4, 11, 30),
  },
  {
    id: 'cost-3',
    amount: 650000,
    category: 'Restock',
    source: 'Restock',
    restockId: 'rst-3',
    description: 'Restock: Beras Ramos Super 5kg (10 Karung)',
    date: getRelativeDate(5, 8, 45),
  },
  {
    id: 'cost-4',
    amount: 408000,
    category: 'Restock',
    source: 'Restock',
    restockId: 'rst-4',
    description: 'Restock: Minyak Goreng Bimoli 1L (2 Karton)',
    date: getRelativeDate(6, 14, 15),
  },
  {
    id: 'cost-5',
    amount: 490000,
    category: 'Restock',
    source: 'Restock',
    restockId: 'rst-5',
    description: 'Restock: Telur Ayam Negeri 1 Kg (20 Kg)',
    date: getRelativeDate(2, 7, 30),
  },
  {
    id: 'cost-rst-6',
    amount: 136800,
    category: 'Restock',
    source: 'Restock',
    restockId: 'rst-6',
    description: 'Restock: Aqua Botol 600ml (2 Dus / 48 Btl)',
    date: getRelativeDate(9, 10, 0),
  },
  {
    id: 'cost-rst-7',
    amount: 387500,
    category: 'Restock',
    source: 'Restock',
    restockId: 'rst-7',
    description: 'Restock: Gula Pasir Gulaku Kuning 1kg (25 Kg)',
    date: getRelativeDate(14, 11, 20),
  },
  {
    id: 'cost-rst-8',
    amount: 218400,
    category: 'Restock',
    source: 'Restock',
    restockId: 'rst-8',
    description: 'Restock: Deterjen Rinso Molto Anti Noda 770g (12 Pcs)',
    date: getRelativeDate(19, 13, 40),
  },
  {
    id: 'cost-rst-9',
    amount: 84000,
    category: 'Restock',
    source: 'Restock',
    restockId: 'rst-9',
    description: 'Restock: Kopi Kapal Api Special Mix (60 Sachet)',
    date: getRelativeDate(23, 9, 30),
  },
  {
    id: 'cost-rst-10',
    amount: 975000,
    category: 'Restock',
    source: 'Restock',
    restockId: 'rst-10',
    description: 'Restock: Beras Ramos Super 5kg (15 Karung Pasar Cipinang)',
    date: getRelativeDate(28, 8, 15),
  },
  {
    id: 'cost-op-1',
    amount: 1200000,
    category: 'Rent',
    source: 'Manual',
    description: 'Sewa Tempat / Kios Warung Bulanan',
    date: getRelativeDate(26, 9, 0),
    notes: 'Pembayaran sewa kios warung periode bulanan',
  },
  {
    id: 'cost-op-2',
    amount: 1500000,
    category: 'Other',
    source: 'Manual',
    description: 'Gaji Staf Kasir & Penjaga Toko Shift',
    date: getRelativeDate(5, 17, 0),
    notes: 'Gaji bulanan kasir & asisten toko',
  },
  {
    id: 'cost-op-3',
    amount: 150000,
    category: 'Electricity',
    source: 'Manual',
    description: 'Token Listrik PLN Warung & Chiller Minuman',
    date: getRelativeDate(2, 14, 0),
    notes: 'Token 100rb + admin & PJU',
  },
  {
    id: 'cost-op-4',
    amount: 150000,
    category: 'Electricity',
    source: 'Manual',
    description: 'Token Listrik PLN Warung & Freezer',
    date: getRelativeDate(17, 10, 30),
    notes: 'Pembelian token listrik pertengahan bulan',
  },
  {
    id: 'cost-op-5',
    amount: 180000,
    category: 'Other',
    source: 'Manual',
    description: 'Paket Internet Fiber & Wifi Kasir Toko',
    date: getRelativeDate(11, 11, 0),
    notes: 'Tagihan wifi koneksi kasir & barcode scanner',
  },
  {
    id: 'cost-op-6',
    amount: 45000,
    category: 'Packaging',
    source: 'Manual',
    description: 'Beli Kantong Kresek, Lakban & Plastik Es',
    date: getRelativeDate(1, 10, 15),
    notes: 'Belanja perlengkapan bungkus kasir',
  },
  {
    id: 'cost-op-7',
    amount: 65000,
    category: 'Packaging',
    source: 'Manual',
    description: 'Pengadaan Kantong Kresek & Dus Packing Ekspedisi',
    date: getRelativeDate(17, 15, 0),
    notes: 'Kardus & bubble wrap untuk pesanan Shopee & Tokopedia',
  },
  {
    id: 'cost-op-8',
    amount: 75000,
    category: 'Other',
    source: 'Manual',
    description: 'Iuran Kebersihan Lingkungan & Retribusi Pasar',
    date: getRelativeDate(0, 8, 0),
    notes: 'Iuran resmi paguyuban pasar',
  },
  {
    id: 'cost-op-9',
    amount: 75000,
    category: 'Other',
    source: 'Manual',
    description: 'Iuran Keamanan RT & Retribusi Lingkungan',
    date: getRelativeDate(20, 8, 30),
    notes: 'Iuran keamanan & ketertiban lingkungan toko',
  },
  {
    id: 'cost-op-10',
    amount: 120000,
    category: 'Equipment',
    source: 'Manual',
    description: 'Service Rutin & Perawatan Chiller Minuman Dingin',
    date: getRelativeDate(24, 13, 0),
    notes: 'Pembersihan kondensor & pengecekan termostat kulkas etalase',
  },
];

// Ensure initial orders have branchId & branchName
INITIAL_ORDERS.forEach((ord, i) => {
  if (!ord.branchId) {
    if (i % 4 === 1) {
      ord.branchId = 'branch-2';
      ord.branchName = 'Cabang Pasar Baru';
    } else if (i % 4 === 3) {
      ord.branchId = 'branch-3';
      ord.branchName = 'Cabang Ruko Bintaro';
    } else {
      ord.branchId = 'branch-1';
      ord.branchName = 'Cabang Utama - Tebet';
    }
  }
});

// Ensure initial restocks have branchId & branchName
INITIAL_RESTOCKS.forEach((rst, i) => {
  if (!rst.branchId) {
    if (i % 3 === 1) {
      rst.branchId = 'branch-2';
      rst.branchName = 'Cabang Pasar Baru';
    } else if (i % 3 === 2) {
      rst.branchId = 'branch-3';
      rst.branchName = 'Cabang Ruko Bintaro';
    } else {
      rst.branchId = 'branch-1';
      rst.branchName = 'Cabang Utama - Tebet';
    }
  }
});

// Ensure initial revenues have branchId & branchName
INITIAL_REVENUES.forEach((rev, i) => {
  if (!rev.branchId) {
    if (i % 4 === 1) {
      rev.branchId = 'branch-2';
      rev.branchName = 'Cabang Pasar Baru';
    } else if (i % 4 === 3) {
      rev.branchId = 'branch-3';
      rev.branchName = 'Cabang Ruko Bintaro';
    } else {
      rev.branchId = 'branch-1';
      rev.branchName = 'Cabang Utama - Tebet';
    }
  }
});

// Ensure initial costs have branchId & branchName
INITIAL_COSTS.forEach((cst, i) => {
  if (!cst.branchId) {
    if (i % 4 === 1) {
      cst.branchId = 'branch-2';
      cst.branchName = 'Cabang Pasar Baru';
    } else if (i % 4 === 3) {
      cst.branchId = 'branch-3';
      cst.branchName = 'Cabang Ruko Bintaro';
    } else {
      cst.branchId = 'branch-1';
      cst.branchName = 'Cabang Utama - Tebet';
    }
  }
});

// Ensure initial stock opnames have branchId & branchName
INITIAL_STOCK_OPNAMES.forEach((so, i) => {
  if (!so.branchId) {
    so.branchId = i === 1 ? 'branch-2' : 'branch-1';
    so.branchName = i === 1 ? 'Cabang Pasar Baru' : 'Cabang Utama - Tebet';
  }
});

// Helper functions for reading and writing to localStorage safely
export const storageService = {
  getBranches(): Branch[] {
    if (typeof window === 'undefined') return INITIAL_BRANCHES;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BRANCHES);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(INITIAL_BRANCHES));
        return INITIAL_BRANCHES;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_BRANCHES;
    }
  },

  saveBranches(branches: Branch[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(branches));
  },

  getProductInventories(): ProductInventory[] {
    if (typeof window === 'undefined') return INITIAL_PRODUCT_INVENTORIES;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCT_INVENTORIES);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.PRODUCT_INVENTORIES, JSON.stringify(INITIAL_PRODUCT_INVENTORIES));
        return INITIAL_PRODUCT_INVENTORIES;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_PRODUCT_INVENTORIES;
    }
  },

  saveProductInventories(inventories: ProductInventory[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.PRODUCT_INVENTORIES, JSON.stringify(inventories));
  },

  getProducts(): Product[] {
    if (typeof window === 'undefined') return INITIAL_PRODUCTS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
        return INITIAL_PRODUCTS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_PRODUCTS;
    }
  },

  saveProducts(products: Product[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },

  getCategories(): Category[] {
    if (typeof window === 'undefined') return INITIAL_CATEGORIES;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
        return INITIAL_CATEGORIES;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_CATEGORIES;
    }
  },

  saveCategories(categories: Category[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  },

  getOrders(): Order[] {
    if (typeof window === 'undefined') return INITIAL_ORDERS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
        return INITIAL_ORDERS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_ORDERS;
    }
  },

  saveOrders(orders: Order[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  },

  getRestocks(): RestockRecord[] {
    if (typeof window === 'undefined') return INITIAL_RESTOCKS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RESTOCKS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.RESTOCKS, JSON.stringify(INITIAL_RESTOCKS));
        return INITIAL_RESTOCKS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_RESTOCKS;
    }
  },

  saveRestocks(restocks: RestockRecord[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.RESTOCKS, JSON.stringify(restocks));
  },

  getRevenues(): Revenue[] {
    if (typeof window === 'undefined') return INITIAL_REVENUES;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REVENUES);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.REVENUES, JSON.stringify(INITIAL_REVENUES));
        return INITIAL_REVENUES;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_REVENUES;
    }
  },

  saveRevenues(revenues: Revenue[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.REVENUES, JSON.stringify(revenues));
  },

  getCosts(): Cost[] {
    if (typeof window === 'undefined') return INITIAL_COSTS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COSTS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.COSTS, JSON.stringify(INITIAL_COSTS));
        return INITIAL_COSTS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_COSTS;
    }
  },

  saveCosts(costs: Cost[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.COSTS, JSON.stringify(costs));
  },

  getSettings(): BusinessSettings {
    if (typeof window === 'undefined') return INITIAL_SETTINGS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
        return INITIAL_SETTINGS;
      }
      const parsed = JSON.parse(data);
      if (parsed.name === 'Warung Madura Berkah' || parsed.ownerName === 'H. Abdul Somad') {
        const updated: BusinessSettings = {
          ...parsed,
          name: parsed.name === 'Warung Madura Berkah' ? 'Warung Juara' : parsed.name,
          ownerName: parsed.ownerName === 'H. Abdul Somad' ? 'Warung Juara' : parsed.ownerName,
        };
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
        return updated;
      }
      return parsed;
    } catch {
      return INITIAL_SETTINGS;
    }
  },

  saveSettings(settings: BusinessSettings): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  getPromotions(): Promotion[] {
    if (typeof window === 'undefined') return INITIAL_PROMOTIONS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROMOTIONS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.PROMOTIONS, JSON.stringify(INITIAL_PROMOTIONS));
        return INITIAL_PROMOTIONS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_PROMOTIONS;
    }
  },

  savePromotions(promotions: Promotion[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.PROMOTIONS, JSON.stringify(promotions));
  },

  getCashierShifts(): CashierShift[] {
    if (typeof window === 'undefined') return INITIAL_CASHIER_SHIFTS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CASHIER_SHIFTS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.CASHIER_SHIFTS, JSON.stringify(INITIAL_CASHIER_SHIFTS));
        return INITIAL_CASHIER_SHIFTS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_CASHIER_SHIFTS;
    }
  },

  saveCashierShifts(shifts: CashierShift[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.CASHIER_SHIFTS, JSON.stringify(shifts));
  },

  getCustomerReceivables(): CustomerReceivable[] {
    if (typeof window === 'undefined') return INITIAL_CUSTOMER_RECEIVABLES;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOMER_RECEIVABLES);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.CUSTOMER_RECEIVABLES, JSON.stringify(INITIAL_CUSTOMER_RECEIVABLES));
        return INITIAL_CUSTOMER_RECEIVABLES;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_CUSTOMER_RECEIVABLES;
    }
  },

  saveCustomerReceivables(receivables: CustomerReceivable[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.CUSTOMER_RECEIVABLES, JSON.stringify(receivables));
  },

  getSupplierPayables(): SupplierPayable[] {
    if (typeof window === 'undefined') return INITIAL_SUPPLIER_PAYABLES;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUPPLIER_PAYABLES);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.SUPPLIER_PAYABLES, JSON.stringify(INITIAL_SUPPLIER_PAYABLES));
        return INITIAL_SUPPLIER_PAYABLES;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_SUPPLIER_PAYABLES;
    }
  },

  saveSupplierPayables(payables: SupplierPayable[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.SUPPLIER_PAYABLES, JSON.stringify(payables));
  },

  getAuthUser(): User | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
      if (!data) return null;
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  saveAuthUser(user: User | null): void {
    if (typeof window === 'undefined') return;
    if (user) {
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    }
  },

  getHasCompletedOnboarding(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
      return data === 'true';
    } catch {
      return false;
    }
  },

  saveHasCompletedOnboarding(completed: boolean): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, completed ? 'true' : 'false');
  },

  resetAllData(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(INITIAL_BRANCHES));
    localStorage.setItem(STORAGE_KEYS.PRODUCT_INVENTORIES, JSON.stringify(INITIAL_PRODUCT_INVENTORIES));
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.PROMOTIONS, JSON.stringify(INITIAL_PROMOTIONS));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
    localStorage.setItem(STORAGE_KEYS.RACKS, JSON.stringify(INITIAL_RACKS));
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
    localStorage.setItem(STORAGE_KEYS.RESTOCKS, JSON.stringify(INITIAL_RESTOCKS));
    localStorage.setItem(STORAGE_KEYS.REVENUES, JSON.stringify(INITIAL_REVENUES));
    localStorage.setItem(STORAGE_KEYS.COSTS, JSON.stringify(INITIAL_COSTS));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
  },
};

export const storage = storageService;
