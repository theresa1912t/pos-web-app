import { createClient, SupabaseClient, User as SupabaseAuthUser } from '@supabase/supabase-js';
import {
  Product,
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
  OnboardingData,
  AppRole,
  AppUser,
  ChannelIntegration,
  ProductChannelMapping,
  ChannelSyncError,
  Branch,
  ProductInventory,
  CustomerReceivable,
  SupplierPayable,
} from '@/types';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_SEED_PRODUCTS,
  INITIAL_RACKS,
  INITIAL_STOCK_OPNAMES,
  INITIAL_STOCK_OPNAME_SCHEDULES,
  INITIAL_ORDERS,
  INITIAL_RESTOCKS,
  INITIAL_REVENUES,
  INITIAL_COSTS,
  INITIAL_SETTINGS,
  INITIAL_CHANNEL_INTEGRATIONS,
  INITIAL_PRODUCT_MAPPINGS,
  INITIAL_CHANNEL_SYNC_ERRORS,
  INITIAL_BRANCHES,
  INITIAL_PRODUCT_INVENTORIES,
  INITIAL_CUSTOMER_RECEIVABLES,
  INITIAL_SUPPLIER_PAYABLES,
  generateProductInventories,
} from '@/lib/storage';
import { DEFAULT_ROLES, STAGING_INITIAL_USERS } from '@/lib/rbac';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  !supabaseUrl.includes('your-project')
);

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!supabaseInstance && supabaseUrl && supabaseAnonKey) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return supabaseInstance;
}

// User-scoped Local Database Storage Keys (for strict data isolation per business/store)
export interface UserDatabaseState {
  products: Product[];
  categories: Category[];
  racks: Rack[];
  branches?: Branch[];
  productInventories?: ProductInventory[];
  stockOpnames: StockOpname[];
  stockOpnameSchedules: StockOpnameSchedule[];
  orders: Order[];
  restocks: RestockRecord[];
  revenues: Revenue[];
  costs: Cost[];
  settings: BusinessSettings;
  roles: AppRole[];
  users: AppUser[];
  onboardingCompleted: boolean;
  customerReceivables?: CustomerReceivable[];
  supplierPayables?: SupplierPayable[];
  channelIntegrations?: ChannelIntegration[];
  productMappings?: ProductChannelMapping[];
  channelSyncErrors?: ChannelSyncError[];
  dataVersion?: number;
}

export const STAGING_EMAIL = 'staging@example.com';
export const STAGING_USER_ID = 'usr-staging-0000-0000-000000000000';

export function isStagingUser(email?: string, userId?: string): boolean {
  return true; // Single internal client system: all roles share the same store database
}

export function getStagingInitialData(): UserDatabaseState {
  return {
    dataVersion: 3,
    branches: JSON.parse(JSON.stringify(INITIAL_BRANCHES)),
    productInventories: JSON.parse(JSON.stringify(INITIAL_PRODUCT_INVENTORIES)),
    products: JSON.parse(JSON.stringify(INITIAL_PRODUCTS)),
    categories: JSON.parse(JSON.stringify(INITIAL_CATEGORIES)),
    racks: JSON.parse(JSON.stringify(INITIAL_RACKS)),
    stockOpnames: JSON.parse(JSON.stringify(INITIAL_STOCK_OPNAMES)),
    stockOpnameSchedules: JSON.parse(JSON.stringify(INITIAL_STOCK_OPNAME_SCHEDULES)),
    orders: JSON.parse(JSON.stringify(INITIAL_ORDERS)),
    restocks: JSON.parse(JSON.stringify(INITIAL_RESTOCKS)),
    revenues: JSON.parse(JSON.stringify(INITIAL_REVENUES)),
    costs: JSON.parse(JSON.stringify(INITIAL_COSTS)),
    settings: {
      ...INITIAL_SETTINGS,
      ownerEmail: STAGING_EMAIL,
      ownerName: 'Staging Demo Operator',
      autoOpenCashDrawer: true,
      cashDrawerConnected: true,
      printerConnected: true,
      printerName: 'Thermal Receipt POS-58 (USB/Bluetooth)',
      printerPaperSize: '58mm',
      cashDrawerInterface: 'printer_kick',
    },
    roles: JSON.parse(JSON.stringify(DEFAULT_ROLES)),
    users: JSON.parse(JSON.stringify(STAGING_INITIAL_USERS)),
    customerReceivables: JSON.parse(JSON.stringify(INITIAL_CUSTOMER_RECEIVABLES)),
    supplierPayables: JSON.parse(JSON.stringify(INITIAL_SUPPLIER_PAYABLES)),
    onboardingCompleted: true,
    channelIntegrations: JSON.parse(JSON.stringify(INITIAL_CHANNEL_INTEGRATIONS)),
    productMappings: JSON.parse(JSON.stringify(INITIAL_PRODUCT_MAPPINGS)),
    channelSyncErrors: JSON.parse(JSON.stringify(INITIAL_CHANNEL_SYNC_ERRORS)),
  };
}

export function getNewClientInitialData(name: string, email: string, username: string = 'admin'): UserDatabaseState {
  const initialOwnerUser: AppUser = {
    id: `usr-${Date.now()}`,
    authUserId: `usr-${Date.now()}`,
    name,
    username: username || 'admin',
    email,
    phone: '',
    roleId: 'role-owner-admin',
    status: 'active',
    createdAt: new Date().toISOString(),
    onboardingCompleted: true,
  };

  const newClientBranches: Branch[] = [
    {
      id: `branch-${Date.now()}-1`,
      name: 'Cabang Utama',
      code: 'CBG-01',
      address: 'Pusat Operasional / Toko Utama',
      phone: '',
      status: 'Active',
      createdAt: new Date().toISOString(),
    },
  ];

  const initialProducts = JSON.parse(JSON.stringify(INITIAL_SEED_PRODUCTS));
  const newClientInventories = generateProductInventories(initialProducts, newClientBranches);

  return {
    branches: newClientBranches,
    productInventories: newClientInventories,
    products: initialProducts,
    categories: [
      { id: 'cat-c1', name: 'Makanan & Mie' },
      { id: 'cat-c2', name: 'Minuman' },
      { id: 'cat-c3', name: 'Sembako' },
      { id: 'cat-c4', name: 'Snack & Biskuit' },
      { id: 'cat-c5', name: 'Kebutuhan Rumah' },
      { id: 'cat-c6', name: 'Lainnya' },
    ],
    racks: [
      { id: 'rack-c1', name: 'Rak Utama A1', code: 'RAK-A1', locationDescription: 'Lorong Utama' },
      { id: 'rack-c2', name: 'Etalase Kasir', code: 'ETL-01', locationDescription: 'Samping Meja Kasir' },
    ],
    stockOpnames: [],
    stockOpnameSchedules: [],
    orders: [],
    restocks: [],
    revenues: [],
    costs: [],
    settings: {
      name: 'Warung Saya',
      phone: '',
      address: '',
      businessType: 'Warung',
      brandColor: '#0d9488',
      ownerName: name,
      ownerEmail: email,
      ownerPhone: '',
      autoOpenCashDrawer: true,
      cashDrawerConnected: true,
      printerConnected: false,
      printerPaperSize: '58mm',
      cashDrawerInterface: 'printer_kick',
    },
    roles: JSON.parse(JSON.stringify(DEFAULT_ROLES)),
    users: [initialOwnerUser],
    customerReceivables: [],
    supplierPayables: [],
    onboardingCompleted: true,
    channelIntegrations: INITIAL_CHANNEL_INTEGRATIONS.map(c => ({
      ...c,
      connectionStatus: 'disconnected',
      connectedAt: undefined,
      lastSyncAt: undefined,
      syncOrdersCount: 0,
      syncErrorCount: 0,
      storeName: undefined,
      storeIdentifier: undefined,
    })),
    productMappings: [],
    channelSyncErrors: [],
  };
}

// Local user-data store manager for client business
export const localUserDataStore = {
  getUserData(userId: string, email: string, name: string, username?: string): UserDatabaseState {
    if (typeof window === 'undefined') return getStagingInitialData();
    try {
      const key = 'warung_pos_primary_db';
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed: UserDatabaseState = JSON.parse(saved);

        parsed.onboardingCompleted = true;

        // Upgrade data if needed
        if (!parsed.dataVersion || parsed.dataVersion < 3 || !parsed.products || parsed.products.length < 20 || !parsed.orders || parsed.orders.length < 30) {
          const updated = getStagingInitialData();
          localStorage.setItem(key, JSON.stringify(updated));
          return updated;
        }

        // If products is empty, populate with INITIAL_SEED_PRODUCTS so inventory is immediately usable for testing
        if (!parsed.products || parsed.products.length === 0) {
          parsed.products = JSON.parse(JSON.stringify(INITIAL_SEED_PRODUCTS));
        }

        // Ensure branches & product inventories exist in stored state
        if (!parsed.branches || parsed.branches.length === 0) {
          parsed.branches = JSON.parse(JSON.stringify(INITIAL_BRANCHES));
        }
        if (!parsed.productInventories || parsed.productInventories.length === 0) {
          parsed.productInventories = generateProductInventories(parsed.products, parsed.branches);
        }

        // Always enforce and update system roles to the latest strict RBAC rules
        const existingRoles = parsed.roles || [];
        const updatedRoles = existingRoles.map((exRole) => {
          const matchDefault = DEFAULT_ROLES.find((dr) => dr.id === exRole.id);
          if (matchDefault) {
            return {
              ...exRole,
              permissions: JSON.parse(JSON.stringify(matchDefault.permissions)),
            };
          }
          return exRole;
        });
        for (const defRole of DEFAULT_ROLES) {
          if (!updatedRoles.some((r) => r.id === defRole.id)) {
            updatedRoles.push(JSON.parse(JSON.stringify(defRole)));
          }
        }
        parsed.roles = updatedRoles;

        // Ensure racks, stockOpnames exist in older stored states
        if (!parsed.racks || parsed.racks.length === 0) {
          parsed.racks = JSON.parse(JSON.stringify(INITIAL_RACKS));
        }
        if (!parsed.stockOpnames) {
          parsed.stockOpnames = JSON.parse(JSON.stringify(INITIAL_STOCK_OPNAMES));
        }
        if (!parsed.stockOpnameSchedules) {
          parsed.stockOpnameSchedules = JSON.parse(JSON.stringify(INITIAL_STOCK_OPNAME_SCHEDULES));
        }
        if (parsed.settings.autoOpenCashDrawer === undefined) {
          parsed.settings.autoOpenCashDrawer = true;
          parsed.settings.cashDrawerConnected = true;
          parsed.settings.printerPaperSize = '58mm';
        }
        if (!parsed.channelIntegrations || parsed.channelIntegrations.length === 0) {
          parsed.channelIntegrations = JSON.parse(JSON.stringify(INITIAL_CHANNEL_INTEGRATIONS));
        }
        if (!parsed.productMappings) {
          parsed.productMappings = JSON.parse(JSON.stringify(INITIAL_PRODUCT_MAPPINGS));
        }
        if (!parsed.channelSyncErrors) {
          parsed.channelSyncErrors = JSON.parse(JSON.stringify(INITIAL_CHANNEL_SYNC_ERRORS));
        }
        // Ensure all orders have salesChannel populated
        if (parsed.orders && parsed.orders.length > 0) {
          parsed.orders = parsed.orders.map(ord => ({
            ...ord,
            salesChannel: ord.salesChannel || 'Offline / Kasir',
          }));
        }
        if (!parsed.users || parsed.users.length === 0) {
          parsed.users = JSON.parse(JSON.stringify(STAGING_INITIAL_USERS));
        } else {
          // Sync default staging users branchAccess and roleId
          parsed.users = parsed.users.map((u) => {
            const stagingMatch = STAGING_INITIAL_USERS.find((su) => su.id === u.id || su.username === u.username);
            if (stagingMatch) {
              return {
                ...u,
                roleId: stagingMatch.roleId,
                branchAccess: stagingMatch.branchAccess,
              };
            }
            return u;
          });
        }
        return parsed;
      }

      // Initialize with store data
      const initial = getStagingInitialData();
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    } catch {
      return getStagingInitialData();
    }
  },

  saveUserData(userId: string, data: UserDatabaseState): void {
    if (typeof window === 'undefined') return;
    try {
      const key = 'warung_pos_primary_db';
      data.onboardingCompleted = true;
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save business data:', e);
    }
  },
};

