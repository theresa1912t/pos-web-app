export type PaymentMethod = 'Cash' | 'QRIS' | 'Transfer' | string;

export type OrderStatus = 'Finished' | 'Canceled';

export type SalesChannel =
  | 'Offline / Kasir'
  | 'Shopee'
  | 'Tokopedia'
  | 'TikTok Shop'
  | 'GoFood'
  | 'GrabFood'
  | 'ShopeeFood'
  | 'Other';

export type CostCategory = 
  | 'Restock'
  | 'Rent'
  | 'Electricity'
  | 'Packaging'
  | 'Delivery'
  | 'Equipment'
  | 'Other';

export type BranchStatus = 'Active' | 'Inactive';

export interface Branch {
  id: string;
  business_id?: string;
  userId?: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  status: BranchStatus;
  createdAt: string;
}

export interface ProductInventory {
  id: string;
  productId: string;
  branchId: string;
  stock: number;
  rackId?: string;
  rackName?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  rackId?: string;
  rackName?: string;
  sellingPrice: number;
  cogs: number; // Harga Pokok Penjualan (HPP) per item
  stock: number;
  unit: string; // Pcs, Bks, Btl, Kg, Rtg, Sachet, Dus, etc.
  barcode?: string;
  sku?: string; // Stock Keeping Unit
  image?: string;
  minStockThreshold?: number; // default: 5
  isArchived?: boolean;
  inventories?: ProductInventory[];
  promoPrice?: number;
  isPromoActive?: boolean;
  promoBadge?: string;
}

export type PromotionType = 'percentage' | 'fixed_price' | 'fixed_discount';
export type PromotionStatus = 'active' | 'scheduled' | 'ended' | 'inactive';

export interface Promotion {
  id: string;
  name: string; // e.g. "Promo JSM Akhir Pekan", "Flash Sale Snack"
  description?: string;
  type: PromotionType; // 'percentage' | 'fixed_price' | 'fixed_discount'
  discountValue: number; // e.g. 20 (for 20%), 2000 (for Rp 2.000 off), or target price
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isActive: boolean;
  productIds: string[]; // List of included product IDs
  branchIds?: string[]; // Applicable branches, or ['*'] for all
  badgeText?: string; // e.g. "JSM", "HEMAT", "FLASH SALE", "DISKON"
  createdAt: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Rack {
  id: string;
  branchId?: string;
  branchName?: string;
  name: string;
  code: string; // e.g. "RAK-A1", "ETL-01"
  locationDescription?: string; // e.g. "Depan Kasir Baris 1", "Etalase Minuman Dingin"
  createdAt?: string;
}

export type StockOpnameScope = 'All' | 'Category' | 'Rack';
export type StockOpnameStatus = 'Draft' | 'InProgress' | 'Completed' | 'Canceled';

export interface StockOpnameItem {
  productId: string;
  productName: string;
  category: string;
  rackId?: string;
  rackName?: string;
  unit: string;
  barcode?: string;
  systemStock: number;
  physicalStock: number | null; // null if not yet counted
  difference: number; // physicalStock - systemStock (0 if physicalStock is null)
  cogs: number;
  discrepancyValue: number; // difference * cogs
  isCounted: boolean;
  notes?: string;
}

export interface StockOpname {
  id: string;
  opnameNumber: string; // e.g. "SO-20260828-001"
  branchId?: string;
  branchName?: string;
  scope: StockOpnameScope;
  scopeTargetId?: string;
  scopeTargetName?: string;
  status: StockOpnameStatus;
  items: StockOpnameItem[];
  totalSystemStock: number;
  totalPhysicalStock: number;
  totalDiscrepancyStock: number;
  totalDiscrepancyValue: number;
  performedBy: string;
  notes?: string;
  scheduledDate?: string;
  createdAt: string; // ISO String
  completedAt?: string; // ISO String
}

export interface StockOpnameSchedule {
  id: string;
  branchId?: string;
  branchName?: string;
  title: string;
  scope: StockOpnameScope;
  scopeTargetId?: string;
  scopeTargetName?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  scheduledDate: string; // YYYY-MM-DD or next run date
  assignedRoleOrUser?: string;
  isActive: boolean;
  createdAt: string;
}

export interface RestockRecord {
  id: string;
  branchId?: string;
  branchName?: string;
  productId: string;
  productName: string;
  quantity: number;
  purchaseCostPerItem: number;
  totalCost: number;
  previousStock: number;
  resultingStock: number;
  previousCogs: number;
  newCogs: number;
  date: string; // ISO String
  notes?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  sellingPrice: number; // Effective price paid (promo or regular)
  originalPrice?: number; // Regular price before promo
  discountAmount?: number; // Total saving per item (original - sellingPrice)
  promoName?: string;
  cogs: number;
  subtotal: number;
}

export interface Order {
  id: string;
  branchId?: string;
  branchName?: string;
  items: OrderItem[];
  total: number;
  totalCogs: number;
  discountTotal?: number; // Total savings from promotions
  paymentMethod: PaymentMethod;
  salesChannel: SalesChannel;
  externalOrderId?: string;
  externalOrderStatus?: string;
  cashTendered?: number;
  changeAmount?: number;
  status: OrderStatus;
  createdAt: string; // ISO String
  notes?: string;
}

export interface Revenue {
  id: string;
  branchId?: string;
  branchName?: string;
  amount: number;
  source: 'Order' | 'Manual';
  salesChannel?: SalesChannel;
  orderId?: string;
  description: string;
  date: string; // ISO String
  notes?: string;
}

export interface Cost {
  id: string;
  branchId?: string;
  branchName?: string;
  amount: number;
  category: CostCategory;
  source: 'Restock' | 'Manual';
  restockId?: string;
  description: string;
  date: string; // ISO String
  notes?: string;
}

export type MappingStatus = 'mapped' | 'unmapped' | 'needs_review';

export interface ProductChannelMapping {
  id: string;
  channel: SalesChannel;
  externalProductId: string;
  externalProductName: string;
  externalSku?: string;
  channelPrice?: number;
  productId?: string; // id of matched internal product
  productName?: string; // name of matched internal product
  mappingStatus: MappingStatus;
  lastUpdated?: string;
}

export type ChannelConnectionStatus = 'connected' | 'disconnected' | 'error';

export interface ChannelIntegration {
  id: string;
  channel: SalesChannel;
  category?: 'Marketplace' | 'Food Delivery' | 'Offline' | 'Other';
  connectionStatus: ChannelConnectionStatus;
  connectedAt?: string;
  lastSyncAt?: string;
  lastSyncStatus?: 'success' | 'error' | 'pending';
  syncOrdersCount: number;
  syncErrorCount: number;
  errorMessage?: string;
  storeName?: string;
  storeIdentifier?: string;
  autoSyncEnabled?: boolean;
}

export interface ChannelSyncError {
  id: string;
  channel: SalesChannel;
  externalOrderId?: string;
  externalSku?: string;
  errorCode?: string;
  errorType?: string;
  errorMessage: string;
  timestamp?: string;
  createdAt?: string;
  resolved: boolean;
}

export interface BusinessSettings {
  name: string;
  phone: string;
  address: string;
  businessType?: string; // 'Warung' | 'Toko Kelontong' | 'Food & Beverage' | 'Other'
  logo?: string;
  brandColor: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  // Perangkat Kasir & Hardware Integration
  printerName?: string;
  printerConnected?: boolean;
  printerPaperSize?: '58mm' | '80mm';
  autoPrintReceipt?: boolean;
  cashDrawerName?: string;
  autoOpenCashDrawer?: boolean;
  cashDrawerConnected?: boolean;
  cashDrawerInterface?: 'printer_kick' | 'serial_usb' | 'local_bridge' | 'simulated';
  barcodeScannerName?: string;
  barcodeScannerConnected?: boolean;
  language?: AppLanguage;
}

export type AppLanguage = 'id' | 'en';

export type AppModule =
  | 'dashboard'
  | 'orders'
  | 'products'
  | 'promotions'
  | 'inventory'
  | 'categories'
  | 'racks'
  | 'stock_opname'
  | 'restock'
  | 'finance'
  | 'branches'
  | 'perangkat_kasir'
  | 'integrasi_channel'
  | 'users'
  | 'settings';

export interface ModulePermission {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface RolePermission {
  id: string;
  roleId: string;
  module: AppModule;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface AppRole {
  id: string;
  name: string;
  description?: string;
  isSystem?: boolean;
  permissions: Record<AppModule, ModulePermission>;
  createdAt: string;
  updatedAt: string;
}

export type UserStatus = 'active' | 'disabled';

export interface AppUser {
  id: string;
  authUserId?: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  roleId: string;
  branchAccess?: string[]; // e.g. ['*'] for all branches, or ['branch-1', 'branch-2']
  status: UserStatus;
  createdAt: string;
  updatedAt?: string;
  onboardingCompleted?: boolean;
}

export interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  phone?: string;
  roleId?: string;
  branchAccess?: string[];
  status?: UserStatus;
  onboardingCompleted?: boolean;
}

export interface Profile {
  id: string;
  auth_user_id?: string;
  name: string;
  username?: string;
  email: string;
  phone?: string;
  role_id?: string;
  status?: UserStatus;
  onboarding_completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface OnboardingData {
  businessName: string;
  businessType: string;
  whatsappNumber: string;
  businessAddress: string;
  logo?: string;
  brandColor?: string;
}

export type DateFilterType = 'today' | 'yesterday' | '7days' | '14days' | '30days' | 'this_month' | 'custom';

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export type TabType =
  | 'dashboard'
  | 'orders'
  | 'products'
  | 'promotions'
  | 'inventory'
  | 'finance'
  | 'branches'
  | 'perangkat_kasir'
  | 'stock_opname'
  | 'integrasi_channel'
  | 'users'
  | 'settings';

