'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import {
  Product,
  Category,
  Rack,
  StockOpname,
  StockOpnameItem,
  StockOpnameSchedule,
  RestockRecord,
  Order,
  Revenue,
  Cost,
  BusinessSettings,
  PaymentMethod,
  CostCategory,
  User,
  OnboardingData,
  AppRole,
  AppUser,
  AppModule,
  ModulePermission,
  UserStatus,
  SalesChannel,
  ProductChannelMapping,
  ChannelIntegration,
  ChannelSyncError,
  Branch,
  BranchStatus,
  ProductInventory,
  TabType,
} from '@/types';
import {
  getSupabase,
  isSupabaseConfigured,
  localUserDataStore,
  getStagingInitialData,
  getNewClientInitialData,
} from '@/lib/supabaseClient';
import { calculateWeightedCOGS, generateOrderId } from '@/lib/utils';
import {
  INITIAL_SETTINGS,
  INITIAL_SEED_PRODUCTS,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_RESTOCKS,
  INITIAL_REVENUES,
  INITIAL_COSTS,
  INITIAL_RACKS,
  INITIAL_STOCK_OPNAMES,
  INITIAL_STOCK_OPNAME_SCHEDULES,
  INITIAL_CHANNEL_INTEGRATIONS,
  INITIAL_PRODUCT_MAPPINGS,
  INITIAL_CHANNEL_SYNC_ERRORS,
  INITIAL_BRANCHES,
  INITIAL_PRODUCT_INVENTORIES,
  generateProductInventories,
} from '@/lib/storage';
import {
  DEFAULT_ROLES,
  STAGING_INITIAL_USERS,
  checkPermission,
  generateSecurePassword,
  credentialsStore,
  canAccessAllBranches,
  hasBranchAccess,
} from '@/lib/rbac';

interface AppContextType {
  products: Product[];
  categories: Category[];
  racks: Rack[];
  branches: Branch[];
  activeBranchId: string;
  setActiveBranchId: (id: string) => void;
  activeBranch: Branch | null;
  accessibleBranches: Branch[];
  canSwitchToAllBranches: boolean;
  productInventories: ProductInventory[];
  addBranch: (data: Omit<Branch, 'id' | 'createdAt'>) => Promise<Branch>;
  updateBranch: (id: string, data: Partial<Branch>) => Promise<void>;
  toggleBranchStatus: (id: string) => Promise<{ success: boolean; error?: string }>;
  getProductStockInBranch: (productId: string, branchId?: string) => number;
  getBranchInventory: (branchId: string) => ProductInventory[];
  updateBranchStock: (productId: string, branchId: string, stock: number, rackId?: string, rackName?: string) => Promise<void>;
  stockOpnames: StockOpname[];
  stockOpnameSchedules: StockOpnameSchedule[];
  orders: Order[];
  restocks: RestockRecord[];
  revenues: Revenue[];
  costs: Cost[];
  settings: BusinessSettings;
  roles: AppRole[];
  users: AppUser[];
  currentUserRole: AppRole | null;
  hasPermission: (module: AppModule, action?: 'view' | 'create' | 'edit' | 'delete') => boolean;
  isLoaded: boolean;

  // Omnichannel Integration States & Actions
  channelIntegrations: ChannelIntegration[];
  productMappings: ProductChannelMapping[];
  channelSyncErrors: ChannelSyncError[];
  connectChannel: (channel: SalesChannel, storeName?: string, storeIdentifier?: string) => Promise<{ success: boolean; error?: string }>;
  disconnectChannel: (channel: SalesChannel) => Promise<{ success: boolean; error?: string }>;
  toggleAutoSync: (channel: SalesChannel) => Promise<void>;
  syncChannelOrders: (channel: SalesChannel) => Promise<{ success: boolean; syncedCount: number; errorCount: number; message: string }>;
  syncAllChannels: () => Promise<{ success: boolean; totalSynced: number }>;
  mapProductToChannel: (mappingId: string, productId: string) => Promise<void>;
  unmapProductFromChannel: (mappingId: string) => Promise<void>;
  createAndMapProduct: (mappingId: string, productData: Omit<Product, 'id'>) => Promise<Product>;
  addProductMapping: (mapping: Omit<ProductChannelMapping, 'id' | 'lastUpdated'>) => Promise<ProductChannelMapping>;
  deleteProductMapping: (mappingId: string) => Promise<void>;
  resolveSyncError: (errorId: string) => Promise<void>;
  createExternalOrder: (
    channel: SalesChannel,
    externalOrderId: string,
    items: { productId?: string; externalSku?: string; externalProductName: string; quantity: number; sellingPrice: number }[],
    paymentMethod?: PaymentMethod,
    notes?: string
  ) => Promise<{ success: boolean; order?: Order; error?: string }>;

  // Supabase Authentication & Onboarding
  user: User | null;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  authScreen: 'login' | 'register';
  setAuthScreen: (screen: 'login' | 'register') => void;
  login: (usernameOrEmail: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, username: string, email: string, password: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  completeOnboarding: (data: OnboardingData) => Promise<{ success: boolean; error?: string }>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  changeEmail: (newEmail: string) => Promise<{ success: boolean; error?: string }>;
  updateUserProfile: (data: { name?: string; phone?: string }) => Promise<{ success: boolean; error?: string }>;

  // User & Role Management
  createRole: (roleData: { name: string; description?: string; permissions: Record<AppModule, ModulePermission> }) => Promise<AppRole>;
  updateRole: (roleId: string, roleData: { name?: string; description?: string; permissions?: Record<AppModule, ModulePermission> }) => Promise<{ success: boolean; error?: string }>;
  deleteRole: (roleId: string) => Promise<{ success: boolean; error?: string }>;

  createUser: (userData: { name: string; username: string; password?: string; roleId: string; phone?: string; branchAccess?: string[] }) => Promise<{ success: boolean; user?: AppUser; generatedPassword?: string; error?: string }>;
  updateUser: (userId: string, userData: { name?: string; username?: string; roleId?: string; phone?: string; status?: UserStatus; branchAccess?: string[] }) => Promise<{ success: boolean; error?: string }>;
  toggleUserStatus: (userId: string) => Promise<{ success: boolean; error?: string }>;
  resetUserPassword: (userId: string) => Promise<{ success: boolean; temporaryPassword?: string; error?: string }>;

  // Responsive Navigation
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  isMobileNavOpen: boolean;
  setIsMobileNavOpen: React.Dispatch<React.SetStateAction<boolean>>;

  // Actions
  createProduct: (productData: Omit<Product, 'id'>) => Promise<Product>;
  updateProduct: (id: string, productData: Partial<Product>) => Promise<void>;
  archiveProduct: (id: string) => Promise<void>;
  unarchiveProduct: (id: string) => Promise<void>;
  deleteProductPermanently: (id: string) => Promise<void>;

  addCategory: (name: string) => Promise<Category>;
  updateCategory: (id: string, name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<boolean>;

  // Rack Management
  addRack: (data: { name: string; code: string; locationDescription?: string; branchId?: string; branchName?: string }) => Promise<Rack>;
  updateRack: (id: string, data: { name?: string; code?: string; locationDescription?: string; branchId?: string; branchName?: string }) => Promise<void>;
  deleteRack: (id: string) => Promise<boolean>;

  // Stock Opname Management
  createStockOpname: (opnameData: {
    scope: 'All' | 'Category' | 'Rack';
    scopeTargetId?: string;
    scopeTargetName?: string;
    branchId?: string;
    branchName?: string;
    items: StockOpnameItem[];
    notes?: string;
  }) => Promise<StockOpname>;
  updateStockOpname: (id: string, updates: Partial<StockOpname>) => Promise<void>;
  finalizeStockOpname: (
    id: string,
    items: StockOpnameItem[],
    notes?: string
  ) => Promise<{ success: boolean; opname?: StockOpname; error?: string }>;
  deleteStockOpname: (id: string) => Promise<void>;

  addStockOpnameSchedule: (data: Omit<StockOpnameSchedule, 'id' | 'createdAt'>) => Promise<StockOpnameSchedule>;
  updateStockOpnameSchedule: (id: string, updates: Partial<StockOpnameSchedule>) => Promise<void>;
  deleteStockOpnameSchedule: (id: string) => Promise<void>;

  bulkImportProducts: (newProducts: Omit<Product, 'id'>[]) => Promise<number>;
  seedInitialData: (customSeed?: Product[]) => Promise<{ success: boolean; count: number; error?: string }>;

  restockProduct: (
    productId: string,
    quantity: number,
    purchaseCostPerItem: number,
    notes?: string,
    branchId?: string
  ) => Promise<RestockRecord | null>;

  createOrder: (
    items: { product: Product; quantity: number }[],
    paymentMethod: PaymentMethod,
    cashTendered?: number,
    changeAmount?: number,
    salesChannel?: SalesChannel,
    externalOrderId?: string,
    branchId?: string
  ) => Promise<Order | null>;

  cancelOrder: (orderId: string) => Promise<boolean>;

  addRevenue: (
    amount: number,
    description: string,
    date?: string,
    notes?: string,
    branchId?: string
  ) => Promise<Revenue>;

  addCost: (
    amount: number,
    category: CostCategory,
    description: string,
    date?: string,
    notes?: string,
    branchId?: string
  ) => Promise<Cost>;

  updateSettings: (newSettings: Partial<BusinessSettings>) => Promise<void>;
  resetToDemoData: () => void;

  // Global Modal & Navigation helpers
  isCreateOrderModalOpen: boolean;
  setIsCreateOrderModalOpen: (open: boolean) => void;
  restockModalProductId: string | null;
  setRestockModalProductId: (productId: string | null) => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const CURRENT_USER_SESSION_KEY = 'warung_supabase_current_user_v1';

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem(CURRENT_USER_SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const saved = localStorage.getItem(CURRENT_USER_SESSION_KEY);
      if (saved) {
        const u = JSON.parse(saved);
        return Boolean(u.onboardingCompleted);
      }
      return false;
    } catch {
      return false;
    }
  });

  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');
  const [isLoaded, setIsLoaded] = useState(false);

  // Application Data States (Strictly scoped to current authenticated user)
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [racks, setRacks] = useState<Rack[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [productInventories, setProductInventories] = useState<ProductInventory[]>([]);
  const [activeBranchId, setActiveBranchIdState] = useState<string>(() => {
    if (typeof window === 'undefined') return 'all';
    try {
      return sessionStorage.getItem('warung_active_branch_v1') || 'all';
    } catch {
      return 'all';
    }
  });

  const setActiveBranchId = useCallback((id: string) => {
    setActiveBranchIdState(id);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('warung_active_branch_v1', id);
      } catch {
        // ignore
      }
    }
  }, []);

  const [stockOpnames, setStockOpnames] = useState<StockOpname[]>([]);
  const [stockOpnameSchedules, setStockOpnameSchedules] = useState<StockOpnameSchedule[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [restocks, setRestocks] = useState<RestockRecord[]>([]);
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [costs, setCosts] = useState<Cost[]>([]);
  const [settings, setSettings] = useState<BusinessSettings>(INITIAL_SETTINGS);

  // Omnichannel Integration States
  const [channelIntegrations, setChannelIntegrations] = useState<ChannelIntegration[]>(INITIAL_CHANNEL_INTEGRATIONS);
  const [productMappings, setProductMappings] = useState<ProductChannelMapping[]>(INITIAL_PRODUCT_MAPPINGS);
  const [channelSyncErrors, setChannelSyncErrors] = useState<ChannelSyncError[]>(INITIAL_CHANNEL_SYNC_ERRORS);

  // RBAC & User Management State
  const [roles, setRoles] = useState<AppRole[]>(DEFAULT_ROLES);
  const [users, setUsers] = useState<AppUser[]>([]);

  // Responsive Sidebar Navigation
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Global Action Modals & Tabs
  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false);
  const [restockModalProductId, setRestockModalProductId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Compute currently logged-in user's role
  const currentUserRole = useMemo<AppRole | null>(() => {
    if (!user) return null;
    const found = roles.find((r) => r.id === user.roleId);
    if (found) return found;
    const defaultOwnerRole = roles.find((r) => r.id === 'role-owner-admin') || DEFAULT_ROLES[0];
    return defaultOwnerRole;
  }, [user, roles]);

  // Branch access authorization
  const canSwitchToAllBranches = useMemo(() => {
    return canAccessAllBranches(user, currentUserRole);
  }, [user, currentUserRole]);

  const accessibleBranches = useMemo(() => {
    if (!user || canSwitchToAllBranches) return branches;
    const access = user.branchAccess || [];
    return branches.filter((b) => access.includes(b.id));
  }, [branches, user, canSwitchToAllBranches]);

  useEffect(() => {
    if (!canSwitchToAllBranches && accessibleBranches.length > 0) {
      if (activeBranchId === 'all' || !accessibleBranches.some((b) => b.id === activeBranchId)) {
        const fallbackId = accessibleBranches[0].id;
        queueMicrotask(() => {
          setActiveBranchId(fallbackId);
        });
      }
    }
  }, [canSwitchToAllBranches, accessibleBranches, activeBranchId, setActiveBranchId]);

  const activeBranch = useMemo(() => {
    if (activeBranchId === 'all') return null;
    return branches.find((b) => b.id === activeBranchId) || null;
  }, [branches, activeBranchId]);

  // Check permission helper
  const hasPermission = useCallback((module: AppModule, action: 'view' | 'create' | 'edit' | 'delete' = 'view'): boolean => {
    if (!user) return false;
    return checkPermission(currentUserRole, module, action);
  }, [user, currentUserRole]);

  // Load user data from Supabase or Isolated Store based on active user session
  const loadUserDataForSession = useCallback(async (activeUser: User) => {
    const supabase = getSupabase();

    if (supabase) {
      try {
        // 1. Fetch Profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', activeUser.id)
          .single();

        const isOnboardingDone = profileData?.onboarding_completed ?? (activeUser.email === 'staging@example.com');
        setHasCompletedOnboarding(isOnboardingDone);

        // Update active user status and role if stored in Supabase
        if (profileData) {
          activeUser.roleId = profileData.role_id || activeUser.roleId || 'role-owner-admin';
          activeUser.username = profileData.username || activeUser.username;
          activeUser.status = (profileData.status as UserStatus) || 'active';
          setUser({ ...activeUser });
        }

        // 2. Fetch Roles
        const { data: rolesData } = await supabase
          .from('roles')
          .select('*')
          .order('created_at', { ascending: true });

        const { data: permissionsData } = await supabase
          .from('role_permissions')
          .select('*');

        if (rolesData && rolesData.length > 0) {
          const mappedRoles: AppRole[] = rolesData.map((r) => {
            const rolePerms = (permissionsData || []).filter((p) => p.role_id === r.id);
            const permissions: any = {};
            rolePerms.forEach((p) => {
              permissions[p.module] = {
                canView: Boolean(p.can_view),
                canCreate: Boolean(p.can_create),
                canEdit: Boolean(p.can_edit),
                canDelete: Boolean(p.can_delete),
              };
            });
            return {
              id: r.id,
              name: r.name,
              description: r.description || '',
              isSystem: Boolean(r.is_system),
              permissions,
              createdAt: r.created_at,
              updatedAt: r.updated_at,
            };
          });
          setRoles(mappedRoles);
        } else {
          setRoles(JSON.parse(JSON.stringify(DEFAULT_ROLES)));
        }

        // 3. Fetch All Business Users (Profiles)
        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: true });

        if (allProfiles && allProfiles.length > 0) {
          setUsers(
            allProfiles.map((p) => ({
              id: p.id,
              authUserId: p.auth_user_id || p.id,
              name: p.name || 'User',
              username: p.username || p.email?.split('@')[0] || 'user',
              email: p.email,
              phone: p.phone || '',
              roleId: p.role_id || 'role-owner-admin',
              status: (p.status as UserStatus) || 'active',
              createdAt: p.created_at,
              onboardingCompleted: Boolean(p.onboarding_completed),
            }))
          );
        }

        // 4. Fetch Business Settings
        const { data: settingsData } = await supabase
          .from('business_settings')
          .select('*')
          .eq('user_id', activeUser.id)
          .single();

        if (settingsData) {
          setSettings({
            name: settingsData.business_name || 'Warung Juara',
            phone: settingsData.whatsapp_number || '',
            address: settingsData.address || '',
            businessType: settingsData.business_type || 'Warung',
            brandColor: settingsData.brand_color || '#0d9488',
            logo: settingsData.logo || undefined,
            ownerName: settingsData.owner_name || activeUser.name,
            ownerEmail: settingsData.owner_email || activeUser.email,
            ownerPhone: settingsData.owner_phone || profileData?.phone || '',
          });
        } else {
          // If no settings yet, use defaults
          setSettings({
            ...INITIAL_SETTINGS,
            ownerName: activeUser.name,
            ownerEmail: activeUser.email,
          });
        }

        // 5. Fetch Categories
        const { data: catData } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', activeUser.id)
          .order('created_at', { ascending: true });
        if (catData && catData.length > 0) {
          setCategories(catData.map(c => ({ id: c.id, name: c.name })));
        }

        // 6. Fetch Products
        const { data: prodData } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', activeUser.id)
          .order('created_at', { ascending: false });
        if (prodData && prodData.length > 0) {
          setProducts(prodData.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            sellingPrice: Number(p.selling_price),
            cogs: Number(p.cogs),
            stock: Number(p.stock),
            unit: p.unit,
            barcode: p.barcode || undefined,
            image: p.image || undefined,
            minStockThreshold: Number(p.min_stock_threshold || 5),
            isArchived: Boolean(p.is_archived),
          })));
        } else {
          // Products in Supabase are currently empty! Auto-seed realistic dummy products (Indomie, Aqua, Kopi, etc.)
          const seeded: Product[] = JSON.parse(JSON.stringify(INITIAL_SEED_PRODUCTS));
          setProducts(seeded);
          try {
            await supabase.from('products').insert(seeded.map((p: Product) => ({
              id: p.id,
              user_id: activeUser.id,
              name: p.name,
              category: p.category,
              selling_price: p.sellingPrice,
              cogs: p.cogs,
              stock: p.stock,
              unit: p.unit,
              barcode: p.barcode || '',
              image: p.image || '',
              min_stock_threshold: p.minStockThreshold || 5,
              is_archived: false,
            })));
          } catch (seedErr) {
            console.warn('Auto-seed to Supabase notice:', seedErr);
          }
        }

        // 7. Fetch Orders & Order Items
        const { data: orderData } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        const { data: orderItemData } = await supabase
          .from('order_items')
          .select('*');

        if (orderData) {
          const mappedOrders: Order[] = orderData.map(o => {
            const items = (orderItemData || [])
              .filter(oi => oi.order_id === o.id)
              .map(oi => ({
                productId: oi.product_id,
                productName: oi.product_name,
                quantity: Number(oi.quantity),
                sellingPrice: Number(oi.selling_price),
                cogs: Number(oi.cogs),
                subtotal: Number(oi.subtotal),
              }));

            return {
              id: o.id,
              branchId: o.branch_id || undefined,
              branchName: o.branch_name || undefined,
              items,
              total: Number(o.total),
              totalCogs: Number(o.total_cogs),
              paymentMethod: o.payment_method,
              salesChannel: (o.sales_channel as SalesChannel) || 'Offline / Kasir',
              externalOrderId: o.external_order_id || undefined,
              cashTendered: o.cash_tendered ? Number(o.cash_tendered) : undefined,
              changeAmount: o.change_amount ? Number(o.change_amount) : undefined,
              status: o.order_status,
              createdAt: o.created_at,
            };
          });
          setOrders(mappedOrders);
        }

        // 8. Fetch Restocks
        const { data: restockData } = await supabase
          .from('restocks')
          .select('*')
          .order('date', { ascending: false });
        if (restockData) {
          setRestocks(restockData.map(r => ({
            id: r.id,
            branchId: r.branch_id || undefined,
            branchName: r.branch_name || undefined,
            productId: r.product_id,
            productName: r.product_name,
            quantity: Number(r.quantity),
            purchaseCostPerItem: Number(r.purchase_cost_per_item),
            totalCost: Number(r.total_cost),
            previousStock: Number(r.previous_stock),
            resultingStock: Number(r.resulting_stock),
            previousCogs: Number(r.previous_cogs),
            newCogs: Number(r.new_cogs),
            date: r.date,
            notes: r.notes || undefined,
          })));
        }

        // 9. Fetch Revenues
        const { data: revData } = await supabase
          .from('revenues')
          .select('*')
          .order('date', { ascending: false });
        if (revData) {
          setRevenues(revData.map(r => ({
            id: r.id,
            amount: Number(r.amount),
            source: r.source as 'Order' | 'Manual',
            branchId: r.branch_id || undefined,
            branchName: r.branch_name || undefined,
            orderId: r.order_id || undefined,
            description: r.description,
            date: r.date,
            notes: r.notes || undefined,
          })));
        }

        // 10. Fetch Costs
        const { data: costData } = await supabase
          .from('costs')
          .select('*')
          .order('date', { ascending: false });
        if (costData) {
          setCosts(costData.map(c => ({
            id: c.id,
            amount: Number(c.amount),
            category: c.category as CostCategory,
            source: c.source as 'Restock' | 'Manual',
            branchId: c.branch_id || undefined,
            branchName: c.branch_name || undefined,
            restockId: c.restock_id || undefined,
            description: c.description,
            date: c.date,
            notes: c.notes || undefined,
          })));
        }

        // 11. Fetch Branches
        const { data: branchData } = await supabase
          .from('branches')
          .select('*')
          .order('created_at', { ascending: true });

        let loadedBranches: Branch[] = [];
        if (branchData && branchData.length > 0) {
          loadedBranches = branchData.map((b) => ({
            id: b.id,
            name: b.name,
            code: b.code,
            address: b.address || '',
            phone: b.phone || '',
            status: (b.status as BranchStatus) || 'Active',
            createdAt: b.created_at,
          }));
        } else {
          loadedBranches = JSON.parse(JSON.stringify(INITIAL_BRANCHES));
        }
        setBranches(loadedBranches);

        // 12. Fetch Product Inventories
        const { data: invData } = await supabase
          .from('product_inventories')
          .select('*');

        if (invData && invData.length > 0) {
          setProductInventories(invData.map((i) => ({
            id: i.id,
            productId: i.product_id,
            branchId: i.branch_id,
            stock: Number(i.stock),
            rackId: i.rack_id || undefined,
            rackName: i.rack_name || undefined,
          })));
        } else {
          setProductInventories(generateProductInventories(prodData || INITIAL_SEED_PRODUCTS, loadedBranches));
        }

        setIsLoaded(true);
        return;
      } catch (err) {
        console.warn('Supabase fetch failed, falling back to isolated user store:', err);
      }
    }

    // Isolated Store fallback (guarantees strict data separation between staging and client)
    const stored = localUserDataStore.getUserData(activeUser.id, activeUser.email, activeUser.name, activeUser.username);
    if (!stored.products || stored.products.length === 0) {
      stored.products = JSON.parse(JSON.stringify(INITIAL_SEED_PRODUCTS));
      localUserDataStore.saveUserData(activeUser.id, stored);
    }
    setProducts(stored.products);
    setCategories(stored.categories);
    setRacks(stored.racks || JSON.parse(JSON.stringify(INITIAL_RACKS)));
    setStockOpnames(stored.stockOpnames || JSON.parse(JSON.stringify(INITIAL_STOCK_OPNAMES)));
    setStockOpnameSchedules(stored.stockOpnameSchedules || JSON.parse(JSON.stringify(INITIAL_STOCK_OPNAME_SCHEDULES)));
    setOrders(stored.orders);
    setRestocks(stored.restocks);
    setRevenues(stored.revenues);
    setCosts(stored.costs);
    setSettings(stored.settings);
    setRoles(stored.roles || JSON.parse(JSON.stringify(DEFAULT_ROLES)));
    setUsers(stored.users || (activeUser.email === 'staging@example.com' ? JSON.parse(JSON.stringify(STAGING_INITIAL_USERS)) : []));
    setHasCompletedOnboarding(stored.onboardingCompleted);
    setChannelIntegrations(stored.channelIntegrations || JSON.parse(JSON.stringify(INITIAL_CHANNEL_INTEGRATIONS)));
    setProductMappings(stored.productMappings || JSON.parse(JSON.stringify(INITIAL_PRODUCT_MAPPINGS)));
    setChannelSyncErrors(stored.channelSyncErrors || JSON.parse(JSON.stringify(INITIAL_CHANNEL_SYNC_ERRORS)));

    const loadedBranches = stored.branches || JSON.parse(JSON.stringify(INITIAL_BRANCHES));
    setBranches(loadedBranches);
    setProductInventories(stored.productInventories || generateProductInventories(stored.products, loadedBranches));

    // Sync active user role & status if in user list
    const foundUser = (stored.users || []).find((u) => u.id === activeUser.id || u.email === activeUser.email);
    if (foundUser) {
      activeUser.roleId = foundUser.roleId;
      activeUser.username = foundUser.username;
      activeUser.status = foundUser.status;
      if (foundUser.branchAccess) {
        activeUser.branchAccess = foundUser.branchAccess;
      }
      setUser({ ...activeUser });
    }

    setIsLoaded(true);
  }, []);

  // Save current state changes into the user's isolated local store (and Supabase if connected)
  const persistUserLocalState = useCallback((
    newProducts = products,
    newCategories = categories,
    newOrders = orders,
    newRestocks = restocks,
    newRevenues = revenues,
    newCosts = costs,
    newSettings = settings,
    newRoles = roles,
    newUsers = users,
    newOnboarding = hasCompletedOnboarding,
    newRacks = racks,
    newStockOpnames = stockOpnames,
    newStockOpnameSchedules = stockOpnameSchedules,
    newChannelIntegrations = channelIntegrations,
    newProductMappings = productMappings,
    newChannelSyncErrors = channelSyncErrors,
    newBranches = branches,
    newProductInventories = productInventories
  ) => {
    if (!user) return;
    localUserDataStore.saveUserData(user.id, {
      products: newProducts,
      categories: newCategories,
      racks: newRacks,
      stockOpnames: newStockOpnames,
      stockOpnameSchedules: newStockOpnameSchedules,
      orders: newOrders,
      restocks: newRestocks,
      revenues: newRevenues,
      costs: newCosts,
      settings: newSettings,
      roles: newRoles,
      users: newUsers,
      onboardingCompleted: newOnboarding,
      channelIntegrations: newChannelIntegrations,
      productMappings: newProductMappings,
      channelSyncErrors: newChannelSyncErrors,
      branches: newBranches,
      productInventories: newProductInventories,
    });
  }, [user, products, categories, orders, restocks, revenues, costs, settings, roles, users, hasCompletedOnboarding, racks, stockOpnames, stockOpnameSchedules, channelIntegrations, productMappings, channelSyncErrors, branches, productInventories]);

  // Handle Supabase Auth State synchronization on mount
  useEffect(() => {
    let isMounted = true;
    const supabase = getSupabase();

    const initAuth = async () => {
      if (!supabase) {
        if (user) {
          loadUserDataForSession(user);
        } else {
          setIsLoaded(true);
        }
        return;
      }

      // Check existing active Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted) return;

      if (session?.user) {
        const u: User = {
          id: session.user.id,
          email: session.user.email || 'user@example.com',
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Pemilik Usaha',
          phone: session.user.user_metadata?.phone || '',
        };
        setUser(u);
        localStorage.setItem(CURRENT_USER_SESSION_KEY, JSON.stringify(u));
        loadUserDataForSession(u);
      } else {
        if (user) {
          loadUserDataForSession(user);
        } else {
          setIsLoaded(true);
        }
      }
    };

    initAuth();

    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (!isMounted) return;
        if (session?.user) {
          const u: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Pemilik Usaha',
            phone: session.user.user_metadata?.phone || '',
          };
          setUser(u);
          localStorage.setItem(CURRENT_USER_SESSION_KEY, JSON.stringify(u));
          loadUserDataForSession(u);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem(CURRENT_USER_SESSION_KEY);
        }
      });

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      isMounted = false;
    };
  }, [loadUserDataForSession, user]);

  // LOGIN FUNCTION (Supports Username or Email)
  const login = async (usernameOrEmail: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const input = usernameOrEmail.trim().toLowerCase();
    if (!input) {
      return { success: false, error: 'Username atau email tidak boleh kosong.' };
    }
    if (!password) {
      return { success: false, error: 'Kata sandi tidak boleh kosong.' };
    }

    // 1. Check local credential store / isolated demo users first
    const localUserMatch = credentialsStore.validateCredentials(input, password);
    if (localUserMatch) {
      if (localUserMatch.status === 'disabled') {
        return { success: false, error: 'Akun pengguna ini telah dinonaktifkan. Hubungi Pemilik Usaha.' };
      }
      const u: User = {
        id: localUserMatch.id,
        email: localUserMatch.email,
        name: localUserMatch.name,
        phone: localUserMatch.phone || '',
        username: localUserMatch.username,
        roleId: localUserMatch.roleId,
        status: localUserMatch.status,
        onboardingCompleted: true,
      };
      setUser(u);
      localStorage.setItem(CURRENT_USER_SESSION_KEY, JSON.stringify(u));
      await loadUserDataForSession(u);
      return { success: true };
    }

    // 2. Supabase Auth (Translates username to email if needed)
    const supabase = getSupabase();
    if (supabase) {
      try {
        let authEmail = input;
        if (!input.includes('@')) {
          // Look up user email from profiles by username
          const { data: profileByUsername } = await supabase
            .from('profiles')
            .select('email, status, role_id')
            .eq('username', input)
            .single();

          if (profileByUsername) {
            if (profileByUsername.status === 'disabled') {
              return { success: false, error: 'Akun pengguna ini telah dinonaktifkan. Hubungi Pemilik Usaha.' };
            }
            authEmail = profileByUsername.email;
          } else {
            authEmail = `${input}@warung.internal`;
          }
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password,
        });

        if (error) {
          // If user doesn't exist yet and it's the staging account, auto-sign up or fallback seamlessly
          if (input === 'staging' || input === 'staging@example.com' || input === 'admin') {
            const stagingEmail = 'staging@example.com';
            const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
              email: stagingEmail,
              password,
              options: {
                data: { name: 'Staging Demo Operator', username: 'staging' },
              },
            });
            if (!signUpErr && signUpData.user) {
              const u: User = {
                id: signUpData.user.id,
                email: stagingEmail,
                name: 'Staging Demo Operator',
                username: 'staging',
                roleId: 'role-owner-admin',
                status: 'active',
                onboardingCompleted: true,
              };
              setUser(u);
              localStorage.setItem(CURRENT_USER_SESSION_KEY, JSON.stringify(u));
              await loadUserDataForSession(u);
              return { success: true };
            }
          }
          return { success: false, error: error.message || 'Login gagal. Periksa username dan kata sandi Anda.' };
        }

        if (data.user) {
          // Fetch user profile info
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profile?.status === 'disabled') {
            await supabase.auth.signOut();
            return { success: false, error: 'Akun pengguna ini telah dinonaktifkan. Hubungi Pemilik Usaha.' };
          }

          const u: User = {
            id: data.user.id,
            email: data.user.email || authEmail,
            name: profile?.name || data.user.user_metadata?.name || input,
            phone: profile?.phone || data.user.user_metadata?.phone || '',
            username: profile?.username || data.user.user_metadata?.username || input,
            roleId: profile?.role_id || 'role-owner-admin',
            status: (profile?.status as UserStatus) || 'active',
          };
          setUser(u);
          localStorage.setItem(CURRENT_USER_SESSION_KEY, JSON.stringify(u));
          await loadUserDataForSession(u);
          return { success: true };
        }
      } catch (err: any) {
        return { success: false, error: err?.message || 'Terjadi kesalahan saat masuk.' };
      }
    }

    // 3. Isolated fallback authentication (for preview and staging without live keys)
    const isStaging = input === 'staging' || input === 'staging@example.com' || input === 'admin' || input === 'owner';
    const cleanUsername = input.includes('@') ? input.split('@')[0] : input;
    const userId = isStaging ? 'usr-staging-0000-0000-000000000000' : `usr-${btoa(cleanUsername).slice(0, 16)}`;
    const userName = isStaging
      ? 'Staging Demo Operator'
      : cleanUsername.replace(/[._-]/g, ' ');

    const u: User = {
      id: userId,
      email: input.includes('@') ? input : `${cleanUsername}@warung.internal`,
      name: userName.charAt(0).toUpperCase() + userName.slice(1),
      username: cleanUsername,
      roleId: 'role-owner-admin',
      status: 'active',
      onboardingCompleted: isStaging,
    };

    setUser(u);
    localStorage.setItem(CURRENT_USER_SESSION_KEY, JSON.stringify(u));
    await loadUserDataForSession(u);
    return { success: true };
  };

  // REGISTER FUNCTION
  const register = async (
    name: string,
    username: string,
    email: string,
    password: string,
    phone?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const trimmedName = name.trim();
    const trimmedUsername = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    const trimmedEmail = email ? email.trim().toLowerCase() : `${trimmedUsername}@warung.internal`;

    if (!trimmedName) {
      return { success: false, error: 'Nama lengkap tidak boleh kosong.' };
    }
    if (!trimmedUsername || trimmedUsername.length < 3) {
      return { success: false, error: 'Username minimal 3 karakter (huruf, angka, titik, strip).' };
    }
    if (trimmedEmail && !trimmedEmail.includes('@')) {
      return { success: false, error: 'Format email tidak valid.' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Kata sandi minimal 6 karakter.' };
    }

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: {
              name: trimmedName,
              username: trimmedUsername,
              phone: phone || '',
            },
          },
        });

        if (error) {
          return { success: false, error: error.message || 'Pendaftaran gagal.' };
        }

        if (data.user) {
          const u: User = {
            id: data.user.id,
            email: trimmedEmail,
            name: trimmedName,
            username: trimmedUsername,
            phone: phone || '',
            roleId: 'role-owner-admin',
            status: 'active',
            onboardingCompleted: false,
          };

          // Create Profile & Initial Business Settings in Supabase
          await supabase.from('profiles').upsert({
            id: data.user.id,
            name: trimmedName,
            username: trimmedUsername,
            email: trimmedEmail,
            phone: phone || '',
            role_id: 'role-owner-admin',
            status: 'active',
            onboarding_completed: false,
          });

          await supabase.from('business_settings').upsert({
            user_id: data.user.id,
            business_name: 'Warung Saya',
            owner_name: trimmedName,
            owner_email: trimmedEmail,
            owner_phone: phone || '',
            brand_color: '#0d9488',
          });

          setUser(u);
          localStorage.setItem(CURRENT_USER_SESSION_KEY, JSON.stringify(u));
          setHasCompletedOnboarding(false);
          await loadUserDataForSession(u);
          return { success: true };
        }
      } catch (err: any) {
        return { success: false, error: err?.message || 'Terjadi kesalahan pendaftaran.' };
      }
    }

    // Isolated Registration Fallback
    const userId = `usr-${btoa(trimmedUsername).slice(0, 16)}`;
    const u: User = {
      id: userId,
      email: trimmedEmail,
      name: trimmedName,
      username: trimmedUsername,
      phone: phone || '',
      roleId: 'role-owner-admin',
      status: 'active',
      onboardingCompleted: false,
    };

    // Register credential in memory/local store
    credentialsStore.registerUserCredential({
      id: userId,
      name: trimmedName,
      username: trimmedUsername,
      email: trimmedEmail,
      roleId: 'role-owner-admin',
      status: 'active',
      createdAt: new Date().toISOString(),
      password,
    });

    setUser(u);
    localStorage.setItem(CURRENT_USER_SESSION_KEY, JSON.stringify(u));
    setHasCompletedOnboarding(false);
    await loadUserDataForSession(u);
    return { success: true };
  };

  // LOGOUT FUNCTION
  const logout = async (): Promise<void> => {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('Sign out error:', e);
      }
    }
    setUser(null);
    localStorage.removeItem(CURRENT_USER_SESSION_KEY);
    setAuthScreen('login');
    setIsMobileNavOpen(false);
    setActiveTab('dashboard');
  };

  // ROLE MANAGEMENT METHODS
  const createRole = async (roleData: {
    name: string;
    description?: string;
    permissions: Record<AppModule, ModulePermission>;
  }): Promise<AppRole> => {
    const newRole: AppRole = {
      id: `role-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: roleData.name.trim(),
      description: roleData.description?.trim() || '',
      isSystem: false,
      permissions: roleData.permissions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedRoles = [...roles, newRole];
    setRoles(updatedRoles);
    persistUserLocalState(products, categories, orders, restocks, revenues, costs, settings, updatedRoles, users, hasCompletedOnboarding);

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('roles').insert({
          id: newRole.id,
          name: newRole.name,
          description: newRole.description,
          is_system: false,
        });

        // Insert permissions
        const permInserts = Object.entries(newRole.permissions).map(([mod, perms]) => ({
          role_id: newRole.id,
          module: mod,
          can_view: perms.canView,
          can_create: perms.canCreate,
          can_edit: perms.canEdit,
          can_delete: perms.canDelete,
        }));
        await supabase.from('role_permissions').insert(permInserts);
      } catch (e) {
        console.error('Failed to create role in Supabase:', e);
      }
    }

    return newRole;
  };

  const updateRole = async (
    roleId: string,
    roleData: { name?: string; description?: string; permissions?: Record<AppModule, ModulePermission> }
  ): Promise<{ success: boolean; error?: string }> => {
    const target = roles.find((r) => r.id === roleId);
    if (!target) return { success: false, error: 'Role tidak ditemukan.' };

    const updatedRoles = roles.map((r) => {
      if (r.id === roleId) {
        return {
          ...r,
          name: roleData.name !== undefined ? roleData.name.trim() : r.name,
          description: roleData.description !== undefined ? roleData.description.trim() : r.description,
          permissions: roleData.permissions ? { ...r.permissions, ...roleData.permissions } : r.permissions,
          updatedAt: new Date().toISOString(),
        };
      }
      return r;
    });

    setRoles(updatedRoles);
    persistUserLocalState(products, categories, orders, restocks, revenues, costs, settings, updatedRoles, users, hasCompletedOnboarding);

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('roles').update({
          name: roleData.name !== undefined ? roleData.name.trim() : target.name,
          description: roleData.description !== undefined ? roleData.description.trim() : target.description,
          updated_at: new Date().toISOString(),
        }).eq('id', roleId);

        if (roleData.permissions) {
          for (const [mod, perms] of Object.entries(roleData.permissions)) {
            await supabase.from('role_permissions').upsert({
              role_id: roleId,
              module: mod,
              can_view: perms.canView,
              can_create: perms.canCreate,
              can_edit: perms.canEdit,
              can_delete: perms.canDelete,
            }, { onConflict: 'role_id,module' });
          }
        }
      } catch (e) {
        console.error('Failed to update role in Supabase:', e);
      }
    }

    return { success: true };
  };

  const deleteRole = async (roleId: string): Promise<{ success: boolean; error?: string }> => {
    const target = roles.find((r) => r.id === roleId);
    if (!target) return { success: false, error: 'Role tidak ditemukan.' };
    if (target.isSystem) return { success: false, error: 'Role sistem bawaan tidak dapat dihapus.' };

    // Check if users currently have this role
    const assignedUsers = users.filter((u) => u.roleId === roleId);
    if (assignedUsers.length > 0) {
      return {
        success: false,
        error: `Tidak dapat menghapus role ini karena sedang digunakan oleh ${assignedUsers.length} pengguna. Ubah role pengguna terlebih dahulu.`,
      };
    }

    const updatedRoles = roles.filter((r) => r.id !== roleId);
    setRoles(updatedRoles);
    persistUserLocalState(products, categories, orders, restocks, revenues, costs, settings, updatedRoles, users, hasCompletedOnboarding);

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('role_permissions').delete().eq('role_id', roleId);
        await supabase.from('roles').delete().eq('id', roleId);
      } catch (e) {
        console.error('Failed to delete role in Supabase:', e);
      }
    }

    return { success: true };
  };

  // USER MANAGEMENT METHODS
  const createUser = async (userData: {
    name: string;
    username: string;
    password?: string;
    roleId: string;
    phone?: string;
    branchAccess?: string[];
  }): Promise<{ success: boolean; user?: AppUser; generatedPassword?: string; error?: string }> => {
    const trimmedUsername = userData.username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    const trimmedName = userData.name.trim();

    if (!trimmedName) {
      return { success: false, error: 'Nama pengguna tidak boleh kosong.' };
    }
    if (!trimmedUsername || trimmedUsername.length < 3) {
      return { success: false, error: 'Username minimal 3 karakter (huruf, angka, titik, strip).' };
    }

    // Check duplicate username in local state
    const existing = users.find((u) => u.username.toLowerCase() === trimmedUsername);
    if (existing) {
      return { success: false, error: `Username "${trimmedUsername}" sudah digunakan. Silakan gunakan username lain.` };
    }

    const temporaryPassword = userData.password || generateSecurePassword(8);
    const newUserId = `usr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const syntheticEmail = `${trimmedUsername}@warung.internal`;

    const newUser: AppUser = {
      id: newUserId,
      name: trimmedName,
      username: trimmedUsername,
      email: syntheticEmail,
      phone: userData.phone?.trim() || '',
      roleId: userData.roleId,
      branchAccess: userData.branchAccess && userData.branchAccess.length > 0 ? userData.branchAccess : ['*'],
      status: 'active',
      createdAt: new Date().toISOString(),
      onboardingCompleted: true,
    };

    // Save in credentials store for local login
    credentialsStore.registerUserCredential({
      ...newUser,
      password: temporaryPassword,
    });

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    persistUserLocalState(products, categories, orders, restocks, revenues, costs, settings, roles, updatedUsers, hasCompletedOnboarding, racks, stockOpnames, stockOpnameSchedules, channelIntegrations, productMappings, channelSyncErrors, branches, productInventories);

    const supabase = getSupabase();
    if (supabase) {
      try {
        // Attempt to create Supabase auth user
        const { data: authData } = await supabase.auth.signUp({
          email: syntheticEmail,
          password: temporaryPassword,
          options: {
            data: {
              name: trimmedName,
              username: trimmedUsername,
              role_id: userData.roleId,
              phone: userData.phone?.trim() || '',
            },
          },
        });

        const finalUserId = authData?.user?.id || newUserId;
        newUser.authUserId = finalUserId;

        await supabase.from('profiles').upsert({
          id: finalUserId,
          name: trimmedName,
          username: trimmedUsername,
          email: syntheticEmail,
          phone: userData.phone?.trim() || '',
          role_id: userData.roleId,
          status: 'active',
          onboarding_completed: true,
        });
      } catch (e) {
        console.error('Failed to create user in Supabase:', e);
      }
    }

    return {
      success: true,
      user: newUser,
      generatedPassword: temporaryPassword,
    };
  };

  const updateUser = async (
    userId: string,
    userData: { name?: string; username?: string; roleId?: string; phone?: string; status?: UserStatus; branchAccess?: string[] }
  ): Promise<{ success: boolean; error?: string }> => {
    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, error: 'Pengguna tidak ditemukan.' };

    const updatedUsers = users.map((u) => {
      if (u.id === userId) {
        return {
          ...u,
          name: userData.name !== undefined ? userData.name.trim() : u.name,
          username: userData.username !== undefined ? userData.username.trim().toLowerCase() : u.username,
          roleId: userData.roleId !== undefined ? userData.roleId : u.roleId,
          phone: userData.phone !== undefined ? userData.phone.trim() : u.phone,
          status: userData.status !== undefined ? userData.status : u.status,
          branchAccess: userData.branchAccess !== undefined ? userData.branchAccess : u.branchAccess,
        };
      }
      return u;
    });

    setUsers(updatedUsers);
    persistUserLocalState(products, categories, orders, restocks, revenues, costs, settings, roles, updatedUsers, hasCompletedOnboarding, racks, stockOpnames, stockOpnameSchedules, channelIntegrations, productMappings, channelSyncErrors, branches, productInventories);

    // If updating current user, sync state
    if (user && (user.id === target.id || user.id === target.authUserId)) {
      setUser(prev => prev ? {
        ...prev,
        name: userData.name !== undefined ? userData.name.trim() : prev.name,
        roleId: userData.roleId !== undefined ? userData.roleId : prev.roleId,
        branchAccess: userData.branchAccess !== undefined ? userData.branchAccess : prev.branchAccess,
      } : prev);
    }

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('profiles').update({
          name: userData.name !== undefined ? userData.name.trim() : target.name,
          username: userData.username !== undefined ? userData.username.trim().toLowerCase() : target.username,
          role_id: userData.roleId !== undefined ? userData.roleId : target.roleId,
          phone: userData.phone !== undefined ? userData.phone.trim() : target.phone,
          status: userData.status !== undefined ? userData.status : target.status,
        }).eq('id', target.authUserId || target.id);
      } catch (e) {
        console.error('Failed to update user in Supabase:', e);
      }
    }

    return { success: true };
  };

  const toggleUserStatus = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, error: 'Pengguna tidak ditemukan.' };

    // Prevent disabling the currently active logged-in user
    if (user && (user.id === target.id || user.id === target.authUserId)) {
      return { success: false, error: 'Anda tidak dapat menonaktifkan akun Anda sendiri yang sedang aktif.' };
    }

    const newStatus: UserStatus = target.status === 'active' ? 'disabled' : 'active';
    return updateUser(userId, { status: newStatus });
  };

  const resetUserPassword = async (userId: string): Promise<{ success: boolean; temporaryPassword?: string; error?: string }> => {
    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, error: 'Pengguna tidak ditemukan.' };

    const newTempPassword = generateSecurePassword(8);
    credentialsStore.updatePassword(target.username, newTempPassword);

    const supabase = getSupabase();
    if (supabase) {
      try {
        // If Supabase admin api or regular flow:
        console.log(`Password reset for ${target.username} to: ${newTempPassword}`);
      } catch (e) {
        console.error('Failed to reset password in Supabase:', e);
      }
    }

    return {
      success: true,
      temporaryPassword: newTempPassword,
    };
  };

  // BRANCH MANAGEMENT METHODS
  const addBranch = async (branchData: Omit<Branch, 'id' | 'createdAt'>): Promise<Branch> => {
    const newBranch: Branch = {
      ...branchData,
      id: `branch-${Date.now()}`,
      name: branchData.name.trim(),
      code: branchData.code.trim().toUpperCase(),
      address: branchData.address?.trim() || '',
      phone: branchData.phone?.trim() || '',
      status: branchData.status || 'Active',
      createdAt: new Date().toISOString(),
    };

    const nextBranches = [...branches, newBranch];
    setBranches(nextBranches);

    // Initialize inventory records for this branch for existing products
    const newInventories: ProductInventory[] = products.map((prod) => ({
      id: `inv-${prod.id}-${newBranch.id}`,
      productId: prod.id,
      branchId: newBranch.id,
      stock: 0,
      rackId: undefined,
      rackName: undefined,
    }));
    const nextInventories = [...productInventories, ...newInventories];
    setProductInventories(nextInventories);

    persistUserLocalState(
      products,
      categories,
      orders,
      restocks,
      revenues,
      costs,
      settings,
      roles,
      users,
      hasCompletedOnboarding,
      racks,
      stockOpnames,
      stockOpnameSchedules,
      channelIntegrations,
      productMappings,
      channelSyncErrors,
      nextBranches,
      nextInventories
    );

    const supabase = getSupabase();
    if (supabase && user) {
      try {
        await supabase.from('branches').insert({
          id: newBranch.id,
          user_id: user.id,
          name: newBranch.name,
          code: newBranch.code,
          address: newBranch.address,
          phone: newBranch.phone,
          status: newBranch.status,
        });
      } catch (e) {
        console.warn('Supabase add branch notice:', e);
      }
    }

    return newBranch;
  };

  const updateBranch = async (id: string, branchData: Partial<Branch>): Promise<void> => {
    const nextBranches = branches.map((b) => {
      if (b.id === id) {
        return {
          ...b,
          name: branchData.name !== undefined ? branchData.name.trim() : b.name,
          code: branchData.code !== undefined ? branchData.code.trim().toUpperCase() : b.code,
          address: branchData.address !== undefined ? branchData.address.trim() : b.address,
          phone: branchData.phone !== undefined ? branchData.phone.trim() : b.phone,
          status: branchData.status || b.status,
        };
      }
      return b;
    });
    setBranches(nextBranches);

    persistUserLocalState(
      products,
      categories,
      orders,
      restocks,
      revenues,
      costs,
      settings,
      roles,
      users,
      hasCompletedOnboarding,
      racks,
      stockOpnames,
      stockOpnameSchedules,
      channelIntegrations,
      productMappings,
      channelSyncErrors,
      nextBranches,
      productInventories
    );

    const supabase = getSupabase();
    if (supabase && user) {
      try {
        await supabase.from('branches').update({
          ...(branchData.name ? { name: branchData.name.trim() } : {}),
          ...(branchData.code ? { code: branchData.code.trim().toUpperCase() } : {}),
          ...(branchData.address !== undefined ? { address: branchData.address.trim() } : {}),
          ...(branchData.phone !== undefined ? { phone: branchData.phone.trim() } : {}),
          ...(branchData.status ? { status: branchData.status } : {}),
        }).eq('id', id).eq('user_id', user.id);
      } catch (e) {
        console.warn('Supabase update branch notice:', e);
      }
    }
  };

  const toggleBranchStatus = async (id: string): Promise<{ success: boolean; error?: string }> => {
    const branch = branches.find((b) => b.id === id);
    if (!branch) return { success: false, error: 'Cabang tidak ditemukan' };

    const activeCount = branches.filter((b) => b.status === 'Active').length;
    if (branch.status === 'Active' && activeCount <= 1) {
      return { success: false, error: 'Minimal harus ada 1 cabang aktif dalam sistem usaha' };
    }

    const nextStatus: BranchStatus = branch.status === 'Active' ? 'Inactive' : 'Active';
    await updateBranch(id, { status: nextStatus });

    if (activeBranchId === id && nextStatus === 'Inactive') {
      const remaining = branches.find((b) => b.id !== id && b.status === 'Active');
      setActiveBranchId(remaining ? remaining.id : 'all');
    }

    return { success: true };
  };

  const getProductStockInBranch = useCallback((productId: string, branchId?: string): number => {
    const targetBranch = branchId || activeBranchId;
    if (!targetBranch || targetBranch === 'all') {
      const prod = products.find((p) => p.id === productId);
      return prod?.stock ?? 0;
    }
    const inv = productInventories.find((i) => i.productId === productId && i.branchId === targetBranch);
    return inv?.stock ?? 0;
  }, [activeBranchId, products, productInventories]);

  const getBranchInventory = useCallback((branchId: string): ProductInventory[] => {
    return productInventories.filter((i) => i.branchId === branchId);
  }, [productInventories]);

  const updateBranchStock = useCallback(async (
    productId: string,
    branchId: string,
    newStock: number,
    rackId?: string,
    rackName?: string
  ) => {
    const existingIdx = productInventories.findIndex((i) => i.productId === productId && i.branchId === branchId);
    let nextInventories: ProductInventory[];
    if (existingIdx >= 0) {
      nextInventories = productInventories.map((inv, idx) =>
        idx === existingIdx ? { ...inv, stock: newStock, rackId: rackId ?? inv.rackId, rackName: rackName ?? inv.rackName } : inv
      );
    } else {
      nextInventories = [
        ...productInventories,
        {
          id: `inv-${productId}-${branchId}`,
          productId,
          branchId,
          stock: newStock,
          rackId,
          rackName,
        },
      ];
    }
    setProductInventories(nextInventories);

    // Recalculate consolidated stock
    const nextProducts = products.map((p) => {
      if (p.id === productId) {
        const totalStock = nextInventories
          .filter((i) => i.productId === productId)
          .reduce((sum, i) => sum + i.stock, 0);
        return { ...p, stock: totalStock };
      }
      return p;
    });
    setProducts(nextProducts);

    persistUserLocalState(
      nextProducts,
      categories,
      orders,
      restocks,
      revenues,
      costs,
      settings,
      roles,
      users,
      hasCompletedOnboarding,
      racks,
      stockOpnames,
      stockOpnameSchedules,
      channelIntegrations,
      productMappings,
      channelSyncErrors,
      branches,
      nextInventories
    );
  }, [productInventories, products, categories, orders, restocks, revenues, costs, settings, roles, users, hasCompletedOnboarding, racks, stockOpnames, stockOpnameSchedules, channelIntegrations, productMappings, channelSyncErrors, branches, persistUserLocalState]);

  // COMPLETE ONBOARDING
  const completeOnboarding = async (data: OnboardingData): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Sesi tidak aktif.' };

    const updatedSettings: BusinessSettings = {
      ...settings,
      name: data.businessName.trim(),
      businessType: data.businessType,
      phone: data.whatsappNumber.trim(),
      address: data.businessAddress.trim(),
      logo: data.logo,
      brandColor: data.brandColor || settings.brandColor || '#0d9488',
      ownerName: user.name,
      ownerEmail: user.email,
    };

    setSettings(updatedSettings);
    setHasCompletedOnboarding(true);

    const updatedUser: User = {
      ...user,
      onboardingCompleted: true,
    };
    setUser(updatedUser);
    localStorage.setItem(CURRENT_USER_SESSION_KEY, JSON.stringify(updatedUser));

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('profiles').upsert({
          id: user.id,
          name: user.name,
          email: user.email,
          phone: data.whatsappNumber.trim(),
          onboarding_completed: true,
        });

        await supabase.from('business_settings').upsert({
          user_id: user.id,
          business_name: data.businessName.trim(),
          business_type: data.businessType,
          whatsapp_number: data.whatsappNumber.trim(),
          address: data.businessAddress.trim(),
          logo: data.logo || '',
          brand_color: data.brandColor || '#0d9488',
          owner_name: user.name,
          owner_email: user.email,
          owner_phone: data.whatsappNumber.trim(),
        });
      } catch (e) {
        console.error('Failed to sync onboarding to Supabase:', e);
      }
    }

    persistUserLocalState(
      products,
      categories,
      orders,
      restocks,
      revenues,
      costs,
      updatedSettings,
      roles,
      users,
      true
    );

    setActiveTab('dashboard');
    return { success: true };
  };

  // CHANGE PASSWORD VIA SUPABASE AUTH
  const changePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Kata sandi baru minimal 6 karakter.' };
    }

    if (user?.username) {
      credentialsStore.updatePassword(user.username, newPassword);
    }

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
          return { success: false, error: error.message || 'Gagal mengubah kata sandi.' };
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Terjadi kesalahan sistem.' };
      }
    }

    return { success: true };
  };

  // CHANGE EMAIL VIA SUPABASE AUTH
  const changeEmail = async (newEmail: string): Promise<{ success: boolean; error?: string }> => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      return { success: false, error: 'Format email tidak valid.' };
    }

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { error } = await supabase.auth.updateUser({ email: trimmed });
        if (error) {
          return { success: false, error: error.message || 'Gagal mengubah email.' };
        }
        await supabase.from('profiles').update({ email: trimmed }).eq('id', user?.id);
        await supabase.from('business_settings').update({ owner_email: trimmed }).eq('user_id', user?.id);
      } catch (err: any) {
        return { success: false, error: err?.message || 'Terjadi kesalahan sistem.' };
      }
    }

    if (user) {
      const updatedUser = { ...user, email: trimmed };
      setUser(updatedUser);
      localStorage.setItem(CURRENT_USER_SESSION_KEY, JSON.stringify(updatedUser));
      const updatedSettings = { ...settings, ownerEmail: trimmed };
      setSettings(updatedSettings);
      persistUserLocalState(products, categories, orders, restocks, revenues, costs, updatedSettings, roles, users, hasCompletedOnboarding);
    }

    return { success: true };
  };

  // UPDATE USER PROFILE
  const updateUserProfile = async (data: { name?: string; phone?: string }): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Sesi tidak aktif.' };

    const newName = data.name ? data.name.trim() : user.name;
    const newPhone = data.phone !== undefined ? data.phone.trim() : user.phone;

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.auth.updateUser({
          data: { name: newName, phone: newPhone },
        });
        await supabase.from('profiles').update({
          name: newName,
          phone: newPhone,
        }).eq('id', user.id);
        await supabase.from('business_settings').update({
          owner_name: newName,
          owner_phone: newPhone,
        }).eq('user_id', user.id);
      } catch (err: any) {
        console.error('Update profile error:', err);
      }
    }

    const updatedUser = { ...user, name: newName, phone: newPhone };
    setUser(updatedUser);
    localStorage.setItem(CURRENT_USER_SESSION_KEY, JSON.stringify(updatedUser));
    const updatedSettings = { ...settings, ownerName: newName, ownerPhone: newPhone || '' };
    setSettings(updatedSettings);
    persistUserLocalState(products, categories, orders, restocks, revenues, costs, updatedSettings, roles, users, hasCompletedOnboarding);
    return { success: true };
  };

  // PRODUCT CRUD
  const createProduct = async (productData: Omit<Product, 'id'>): Promise<Product> => {
    const newId = `prod-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newProduct: Product = {
      ...productData,
      id: newId,
      minStockThreshold: productData.minStockThreshold ?? 5,
      isArchived: false,
    };

    const nextProducts = [newProduct, ...products];
    setProducts(nextProducts);
    persistUserLocalState(nextProducts);

    const supabase = getSupabase();
    if (supabase && user) {
      await supabase.from('products').insert({
        id: newId,
        user_id: user.id,
        name: newProduct.name,
        category: newProduct.category,
        selling_price: newProduct.sellingPrice,
        cogs: newProduct.cogs,
        stock: newProduct.stock,
        unit: newProduct.unit,
        barcode: newProduct.barcode || '',
        image: newProduct.image || '',
        min_stock_threshold: newProduct.minStockThreshold,
        is_archived: false,
      });
    }

    return newProduct;
  };

  const updateProduct = async (id: string, productData: Partial<Product>): Promise<void> => {
    const nextProducts = products.map(p => (p.id === id ? { ...p, ...productData } : p));
    setProducts(nextProducts);
    persistUserLocalState(nextProducts);

    const supabase = getSupabase();
    if (supabase && user) {
      const updatePayload: Record<string, any> = {};
      if (productData.name !== undefined) updatePayload.name = productData.name;
      if (productData.category !== undefined) updatePayload.category = productData.category;
      if (productData.sellingPrice !== undefined) updatePayload.selling_price = productData.sellingPrice;
      if (productData.cogs !== undefined) updatePayload.cogs = productData.cogs;
      if (productData.stock !== undefined) updatePayload.stock = productData.stock;
      if (productData.unit !== undefined) updatePayload.unit = productData.unit;
      if (productData.barcode !== undefined) updatePayload.barcode = productData.barcode;
      if (productData.image !== undefined) updatePayload.image = productData.image;
      if (productData.minStockThreshold !== undefined) updatePayload.min_stock_threshold = productData.minStockThreshold;
      if (productData.isArchived !== undefined) updatePayload.is_archived = productData.isArchived;

      await supabase.from('products').update(updatePayload).eq('id', id).eq('user_id', user.id);
    }
  };

  const archiveProduct = async (id: string): Promise<void> => {
    await updateProduct(id, { isArchived: true });
  };

  const unarchiveProduct = async (id: string): Promise<void> => {
    await updateProduct(id, { isArchived: false });
  };

  const deleteProductPermanently = async (id: string): Promise<void> => {
    const nextProducts = products.filter(p => p.id !== id);
    setProducts(nextProducts);
    persistUserLocalState(nextProducts);

    const supabase = getSupabase();
    if (supabase && user) {
      await supabase.from('products').delete().eq('id', id).eq('user_id', user.id);
    }
  };

  // CATEGORY CRUD
  const addCategory = async (name: string): Promise<Category> => {
    const trimmed = name.trim();
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: trimmed,
    };
    const nextCategories = [...categories, newCat];
    setCategories(nextCategories);
    persistUserLocalState(products, nextCategories);

    const supabase = getSupabase();
    if (supabase && user) {
      await supabase.from('categories').insert({
        id: newCat.id,
        user_id: user.id,
        name: trimmed,
      });
    }

    return newCat;
  };

  const updateCategory = async (id: string, name: string): Promise<void> => {
    const trimmed = name.trim();
    const oldCat = categories.find(c => c.id === id);
    const nextCategories = categories.map(c => (c.id === id ? { ...c, name: trimmed } : c));
    setCategories(nextCategories);

    let nextProducts = products;
    if (oldCat && oldCat.name !== trimmed) {
      nextProducts = products.map(p => p.category === oldCat.name ? { ...p, category: trimmed } : p);
      setProducts(nextProducts);
    }
    persistUserLocalState(nextProducts, nextCategories);

    const supabase = getSupabase();
    if (supabase && user) {
      await supabase.from('categories').update({ name: trimmed }).eq('id', id).eq('user_id', user.id);
      if (oldCat) {
        await supabase.from('products').update({ category: trimmed }).eq('category', oldCat.name).eq('user_id', user.id);
      }
    }
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    const catToDelete = categories.find(c => c.id === id);
    if (!catToDelete) return false;

    const nextCategories = categories.filter(c => c.id !== id);
    const nextProducts = products.map(p => p.category === catToDelete.name ? { ...p, category: 'Lainnya' } : p);

    setCategories(nextCategories);
    setProducts(nextProducts);
    persistUserLocalState(nextProducts, nextCategories);

    const supabase = getSupabase();
    if (supabase && user) {
      await supabase.from('categories').delete().eq('id', id).eq('user_id', user.id);
      await supabase.from('products').update({ category: 'Lainnya' }).eq('category', catToDelete.name).eq('user_id', user.id);
    }
    return true;
  };

  // RACK CRUD
  const addRack = async (data: { name: string; code: string; locationDescription?: string }): Promise<Rack> => {
    const newRack: Rack = {
      id: `rack-${Date.now()}`,
      name: data.name.trim(),
      code: data.code.trim().toUpperCase(),
      locationDescription: data.locationDescription?.trim(),
    };
    const nextRacks = [...racks, newRack];
    setRacks(nextRacks);
    persistUserLocalState(products, categories, orders, restocks, revenues, costs, settings, roles, users, hasCompletedOnboarding, nextRacks);
    return newRack;
  };

  const updateRack = async (id: string, data: { name?: string; code?: string; locationDescription?: string }): Promise<void> => {
    const nextRacks = racks.map(r => {
      if (r.id === id) {
        return {
          ...r,
          name: data.name !== undefined ? data.name.trim() : r.name,
          code: data.code !== undefined ? data.code.trim().toUpperCase() : r.code,
          locationDescription: data.locationDescription !== undefined ? data.locationDescription.trim() : r.locationDescription,
        };
      }
      return r;
    });
    setRacks(nextRacks);

    // Also update any linked products' rackName representation if changed
    const updatedRack = nextRacks.find(r => r.id === id);
    let nextProducts = products;
    if (updatedRack) {
      nextProducts = products.map(p => {
        if (p.rackId === id) {
          return { ...p, rackName: `${updatedRack.code} (${updatedRack.name})` };
        }
        return p;
      });
      setProducts(nextProducts);
    }

    persistUserLocalState(nextProducts, categories, orders, restocks, revenues, costs, settings, roles, users, hasCompletedOnboarding, nextRacks);
  };

  const deleteRack = async (id: string): Promise<boolean> => {
    const nextRacks = racks.filter(r => r.id !== id);
    const nextProducts = products.map(p => (p.rackId === id ? { ...p, rackId: undefined, rackName: undefined } : p));
    setRacks(nextRacks);
    setProducts(nextProducts);
    persistUserLocalState(nextProducts, categories, orders, restocks, revenues, costs, settings, roles, users, hasCompletedOnboarding, nextRacks);
    return true;
  };

  // STOCK OPNAME CRUD & RECONCILIATION
  const createStockOpname = async (opnameData: {
    scope: 'All' | 'Category' | 'Rack';
    scopeTargetId?: string;
    scopeTargetName?: string;
    items: StockOpnameItem[];
    notes?: string;
  }): Promise<StockOpname> => {
    const timestamp = Date.now();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = String(stockOpnames.length + 1).padStart(3, '0');
    const opnameNumber = `SO-${dateStr}-${randSuffix}`;

    const totalSystem = opnameData.items.reduce((sum, item) => sum + (item.systemStock || 0), 0);
    const totalPhysical = opnameData.items.reduce((sum, item) => sum + (item.physicalStock ?? item.systemStock), 0);
    const totalDiff = totalPhysical - totalSystem;
    const totalDiffVal = opnameData.items.reduce((sum, item) => sum + (item.discrepancyValue || 0), 0);

    const newOpname: StockOpname = {
      id: `so-${timestamp}`,
      opnameNumber,
      scope: opnameData.scope,
      scopeTargetId: opnameData.scopeTargetId,
      scopeTargetName: opnameData.scopeTargetName,
      status: 'Draft',
      performedBy: user?.name || settings.ownerName || 'Operator Kasir',
      totalSystemStock: totalSystem,
      totalPhysicalStock: totalPhysical,
      totalDiscrepancyStock: totalDiff,
      totalDiscrepancyValue: totalDiffVal,
      notes: opnameData.notes,
      createdAt: new Date().toISOString(),
      items: opnameData.items,
    };

    const nextOpnames = [newOpname, ...stockOpnames];
    setStockOpnames(nextOpnames);
    persistUserLocalState(products, categories, orders, restocks, revenues, costs, settings, roles, users, hasCompletedOnboarding, racks, nextOpnames);
    return newOpname;
  };

  const updateStockOpname = async (id: string, updates: Partial<StockOpname>): Promise<void> => {
    const nextOpnames = stockOpnames.map(so => {
      if (so.id === id) {
        const merged = { ...so, ...updates };
        if (updates.items) {
          const totalSystem = updates.items.reduce((sum, item) => sum + (item.systemStock || 0), 0);
          const totalPhysical = updates.items.reduce((sum, item) => sum + (item.physicalStock ?? item.systemStock), 0);
          merged.totalSystemStock = totalSystem;
          merged.totalPhysicalStock = totalPhysical;
          merged.totalDiscrepancyStock = totalPhysical - totalSystem;
          merged.totalDiscrepancyValue = updates.items.reduce((sum, item) => sum + (item.discrepancyValue || 0), 0);
        }
        return merged;
      }
      return so;
    });
    setStockOpnames(nextOpnames);
    persistUserLocalState(products, categories, orders, restocks, revenues, costs, settings, roles, users, hasCompletedOnboarding, racks, nextOpnames);
  };

  const finalizeStockOpname = async (
    id: string,
    items: StockOpnameItem[],
    notes?: string
  ): Promise<{ success: boolean; opname?: StockOpname; error?: string }> => {
    const target = stockOpnames.find(so => so.id === id);
    if (!target) {
      return { success: false, error: 'Sesi Stock Opname tidak ditemukan.' };
    }

    const completedAt = new Date().toISOString();
    const totalSystem = items.reduce((sum, item) => sum + (item.systemStock || 0), 0);
    const totalPhysical = items.reduce((sum, item) => sum + (item.physicalStock ?? item.systemStock), 0);
    const totalDiff = totalPhysical - totalSystem;
    const totalDiffVal = items.reduce((sum, item) => sum + (item.discrepancyValue || 0), 0);

    const completedOpname: StockOpname = {
      ...target,
      status: 'Completed',
      completedAt,
      notes: notes || target.notes,
      totalSystemStock: totalSystem,
      totalPhysicalStock: totalPhysical,
      totalDiscrepancyStock: totalDiff,
      totalDiscrepancyValue: totalDiffVal,
      items,
    };

    // Traceably reconcile and adjust inventory stock for each counted product
    const countedMap = new Map<string, number>();
    items.forEach(item => {
      if (item.isCounted && item.physicalStock !== undefined && item.physicalStock !== null) {
        countedMap.set(item.productId, item.physicalStock);
      }
    });

    const nextProducts = products.map(prod => {
      if (countedMap.has(prod.id)) {
        return {
          ...prod,
          stock: Math.max(0, countedMap.get(prod.id)!),
        };
      }
      return prod;
    });

    const nextOpnames = stockOpnames.map(so => (so.id === id ? completedOpname : so));

    setProducts(nextProducts);
    setStockOpnames(nextOpnames);
    persistUserLocalState(nextProducts, categories, orders, restocks, revenues, costs, settings, roles, users, hasCompletedOnboarding, racks, nextOpnames);

    // Sync adjusted stock with Supabase if connected
    const supabase = getSupabase();
    if (supabase && user) {
      for (const [prodId, newStock] of countedMap.entries()) {
        try {
          await supabase.from('products').update({ stock: newStock }).eq('id', prodId).eq('user_id', user.id);
        } catch (e) {
          console.error(`Failed to sync opname stock for ${prodId}`, e);
        }
      }
    }

    return { success: true, opname: completedOpname };
  };

  const deleteStockOpname = async (id: string): Promise<void> => {
    const nextOpnames = stockOpnames.filter(so => so.id !== id);
    setStockOpnames(nextOpnames);
    persistUserLocalState(products, categories, orders, restocks, revenues, costs, settings, roles, users, hasCompletedOnboarding, racks, nextOpnames);
  };

  const addStockOpnameSchedule = async (data: Omit<StockOpnameSchedule, 'id' | 'createdAt'>): Promise<StockOpnameSchedule> => {
    const newSchedule: StockOpnameSchedule = {
      ...data,
      id: `sch-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const nextSchedules = [newSchedule, ...stockOpnameSchedules];
    setStockOpnameSchedules(nextSchedules);
    persistUserLocalState(products, categories, orders, restocks, revenues, costs, settings, roles, users, hasCompletedOnboarding, racks, stockOpnames, nextSchedules);
    return newSchedule;
  };

  const updateStockOpnameSchedule = async (id: string, updates: Partial<StockOpnameSchedule>): Promise<void> => {
    const nextSchedules = stockOpnameSchedules.map(sch => (sch.id === id ? { ...sch, ...updates } : sch));
    setStockOpnameSchedules(nextSchedules);
    persistUserLocalState(products, categories, orders, restocks, revenues, costs, settings, roles, users, hasCompletedOnboarding, racks, stockOpnames, nextSchedules);
  };

  const deleteStockOpnameSchedule = async (id: string): Promise<void> => {
    const nextSchedules = stockOpnameSchedules.filter(sch => sch.id !== id);
    setStockOpnameSchedules(nextSchedules);
    persistUserLocalState(products, categories, orders, restocks, revenues, costs, settings, roles, users, hasCompletedOnboarding, racks, stockOpnames, nextSchedules);
  };

  const bulkImportProducts = async (newProducts: Omit<Product, 'id'>[]): Promise<number> => {
    const prodsWithIds: Product[] = newProducts.map((p, idx) => ({
      ...p,
      id: `prod-imp-${Date.now()}-${idx}`,
      minStockThreshold: p.minStockThreshold ?? 5,
      isArchived: false,
    }));

    const nextProducts = [...prodsWithIds, ...products];
    setProducts(nextProducts);
    persistUserLocalState(nextProducts);

    const supabase = getSupabase();
    if (supabase && user) {
      const inserts = prodsWithIds.map(p => ({
        id: p.id,
        user_id: user.id,
        name: p.name,
        category: p.category,
        selling_price: p.sellingPrice,
        cogs: p.cogs,
        stock: p.stock,
        unit: p.unit,
        barcode: p.barcode || '',
        image: p.image || '',
        min_stock_threshold: p.minStockThreshold,
        is_archived: false,
      }));
      await supabase.from('products').insert(inserts);
    }

    return prodsWithIds.length;
  };

  // SEED INITIAL DATA FUNCTION
  const seedInitialData = async (customSeed?: Product[]): Promise<{ success: boolean; count: number; error?: string }> => {
    try {
      const prodsToSeed: Product[] = (customSeed && customSeed.length > 0)
        ? customSeed
        : JSON.parse(JSON.stringify(INITIAL_SEED_PRODUCTS));

      // 1. Ensure categories exist for seeded products
      const neededCatNames = Array.from(new Set(prodsToSeed.map(p => p.category)));
      const existingCatMap = new Map(categories.map(c => [c.name.toLowerCase().trim(), c]));
      const newCats: Category[] = [];

      for (const catName of neededCatNames) {
        if (!existingCatMap.has(catName.toLowerCase().trim())) {
          const newCat: Category = {
            id: `cat-seed-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: catName,
          };
          newCats.push(newCat);
          existingCatMap.set(catName.toLowerCase().trim(), newCat);
        }
      }

      const nextCategories = [...categories, ...newCats];
      if (newCats.length > 0) {
        setCategories(nextCategories);
      }

      // 2. Prepare seed products with unique IDs and clean attributes
      const existingBarcodes = new Set(products.map(p => p.barcode).filter(Boolean));
      const existingNames = new Set(products.map(p => p.name.toLowerCase().trim()));

      const finalSeedProducts: Product[] = prodsToSeed.map((p, idx) => ({
        ...p,
        id: `prod-seed-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
        minStockThreshold: p.minStockThreshold ?? 5,
        isArchived: false,
      }));

      // If user already has some products, avoid duplicate products by name or barcode
      const productsToAdd = products.length > 0
        ? finalSeedProducts.filter(p => !existingNames.has(p.name.toLowerCase().trim()) && (!p.barcode || !existingBarcodes.has(p.barcode)))
        : finalSeedProducts;

      const toAdd = productsToAdd.length > 0 ? productsToAdd : finalSeedProducts;
      const nextProducts = [...toAdd, ...products];

      // If user has no orders, also seed the full suite of staging dummy data (orders, restocks, finances, stock opnames, racks)
      let nextOrders = orders;
      let nextRestocks = restocks;
      let nextRevenues = revenues;
      let nextCosts = costs;
      let nextRacks = racks;
      let nextStockOpnames = stockOpnames;
      let nextStockOpnameSchedules = stockOpnameSchedules;

      if (orders.length === 0) {
        nextOrders = JSON.parse(JSON.stringify(INITIAL_ORDERS));
        nextRestocks = JSON.parse(JSON.stringify(INITIAL_RESTOCKS));
        nextRevenues = JSON.parse(JSON.stringify(INITIAL_REVENUES));
        nextCosts = JSON.parse(JSON.stringify(INITIAL_COSTS));
        nextRacks = JSON.parse(JSON.stringify(INITIAL_RACKS));
        nextStockOpnames = JSON.parse(JSON.stringify(INITIAL_STOCK_OPNAMES));
        nextStockOpnameSchedules = JSON.parse(JSON.stringify(INITIAL_STOCK_OPNAME_SCHEDULES));

        setOrders(nextOrders);
        setRestocks(nextRestocks);
        setRevenues(nextRevenues);
        setCosts(nextCosts);
        setRacks(nextRacks);
        setStockOpnames(nextStockOpnames);
        setStockOpnameSchedules(nextStockOpnameSchedules);
      }

      setProducts(nextProducts);
      persistUserLocalState(
        nextProducts,
        nextCategories,
        nextOrders,
        nextRestocks,
        nextRevenues,
        nextCosts,
        settings,
        roles,
        users,
        hasCompletedOnboarding,
        nextRacks,
        nextStockOpnames,
        nextStockOpnameSchedules
      );

      // 3. Persist to Supabase if connected
      const supabase = getSupabase();
      if (supabase && user) {
        if (newCats.length > 0) {
          try {
            await supabase.from('categories').insert(
              newCats.map(c => ({
                id: c.id,
                user_id: user.id,
                name: c.name,
              }))
            );
          } catch (catErr) {
            console.warn('Supabase category seed notice:', catErr);
          }
        }

        try {
          const inserts = toAdd.map(p => ({
            id: p.id,
            user_id: user.id,
            name: p.name,
            category: p.category,
            selling_price: p.sellingPrice,
            cogs: p.cogs,
            stock: p.stock,
            unit: p.unit,
            barcode: p.barcode || '',
            image: p.image || '',
            min_stock_threshold: p.minStockThreshold ?? 5,
            is_archived: false,
          }));
          await supabase.from('products').upsert(inserts);
        } catch (prodErr) {
          console.warn('Supabase products seed notice:', prodErr);
        }
      }

      return { success: true, count: toAdd.length };
    } catch (err: any) {
      console.error('Error seeding initial data:', err);
      return { success: false, count: 0, error: err?.message || 'Gagal memuat data awal' };
    }
  };

  // RESTOCK OPERATION
  const restockProduct = async (
    productId: string,
    quantity: number,
    purchaseCostPerItem: number,
    notes?: string,
    branchId?: string
  ): Promise<RestockRecord | null> => {
    const product = products.find(p => p.id === productId);
    if (!product || quantity <= 0) return null;

    const targetBranchId = branchId || (activeBranchId !== 'all' ? activeBranchId : (branches[0]?.id || 'branch-1'));
    const targetBranch = branches.find(b => b.id === targetBranchId);
    const targetBranchName = targetBranch?.name || 'Cabang Utama';

    // Update branch inventory
    const branchInv = productInventories.find(i => i.productId === productId && i.branchId === targetBranchId);
    const prevBranchStock = branchInv ? branchInv.stock : 0;
    const nextBranchStock = prevBranchStock + quantity;

    let nextInventories: ProductInventory[];
    if (branchInv) {
      nextInventories = productInventories.map(inv =>
        inv.id === branchInv.id ? { ...inv, stock: nextBranchStock } : inv
      );
    } else {
      nextInventories = [
        ...productInventories,
        {
          id: `inv-${productId}-${targetBranchId}`,
          productId,
          branchId: targetBranchId,
          stock: nextBranchStock,
        },
      ];
    }
    setProductInventories(nextInventories);

    const previousStock = product.stock;
    const resultingStock = previousStock + quantity;
    const previousCogs = product.cogs;
    const newCogs = calculateWeightedCOGS(
      previousStock,
      previousCogs,
      quantity,
      purchaseCostPerItem
    );
    const totalCost = quantity * purchaseCostPerItem;
    const restockDate = new Date().toISOString();

    const restockRecordId = `rst-${Date.now()}`;
    const newRestock: RestockRecord = {
      id: restockRecordId,
      branchId: targetBranchId,
      branchName: targetBranchName,
      productId,
      productName: product.name,
      quantity,
      purchaseCostPerItem,
      totalCost,
      previousStock,
      resultingStock,
      previousCogs,
      newCogs,
      date: restockDate,
      notes,
    };

    const nextRestocks = [newRestock, ...restocks];
    setRestocks(nextRestocks);

    const nextProducts = products.map(p =>
      p.id === productId ? { ...p, stock: resultingStock, cogs: newCogs } : p
    );
    setProducts(nextProducts);

    const newCostId = `cost-rst-${Date.now()}`;
    const newCost: Cost = {
      id: newCostId,
      amount: totalCost,
      category: 'Restock',
      source: 'Restock',
      branchId: targetBranchId,
      branchName: targetBranchName,
      restockId: restockRecordId,
      description: `Restock: ${product.name} (${quantity} ${product.unit}) - ${targetBranchName}`,
      date: restockDate,
      notes,
    };

    const nextCosts = [newCost, ...costs];
    setCosts(nextCosts);
    persistUserLocalState(
      nextProducts,
      categories,
      orders,
      nextRestocks,
      revenues,
      nextCosts,
      settings,
      roles,
      users,
      hasCompletedOnboarding,
      racks,
      stockOpnames,
      stockOpnameSchedules,
      channelIntegrations,
      productMappings,
      channelSyncErrors,
      branches,
      nextInventories
    );

    const supabase = getSupabase();
    if (supabase && user) {
      await supabase.from('products').update({ stock: resultingStock, cogs: newCogs }).eq('id', productId).eq('user_id', user.id);
      await supabase.from('restocks').insert({
        id: restockRecordId,
        user_id: user.id,
        branch_id: targetBranchId,
        branch_name: targetBranchName,
        product_id: productId,
        product_name: product.name,
        quantity,
        purchase_cost_per_item: purchaseCostPerItem,
        total_cost: totalCost,
        previous_stock: previousStock,
        resulting_stock: resultingStock,
        previous_cogs: previousCogs,
        new_cogs: newCogs,
        date: restockDate,
        notes: notes || '',
      });
      await supabase.from('costs').insert({
        id: newCostId,
        user_id: user.id,
        branch_id: targetBranchId,
        branch_name: targetBranchName,
        amount: totalCost,
        category: 'Restock',
        source: 'Restock',
        restock_id: restockRecordId,
        description: `Restock: ${product.name} (${quantity} ${product.unit}) - ${targetBranchName}`,
        date: restockDate,
        notes: notes || '',
      });
    }

    return newRestock;
  };

  // ORDER CREATION
  const createOrder = async (
    items: { product: Product; quantity: number }[],
    paymentMethod: PaymentMethod,
    cashTendered?: number,
    changeAmount?: number,
    salesChannel: SalesChannel = 'Offline / Kasir',
    externalOrderId?: string,
    branchId?: string
  ): Promise<Order | null> => {
    if (items.length === 0) return null;

    const targetBranchId = branchId || (activeBranchId !== 'all' ? activeBranchId : (branches[0]?.id || 'branch-1'));
    const targetBranch = branches.find(b => b.id === targetBranchId);
    const targetBranchName = targetBranch?.name || 'Cabang Utama';

    let total = 0;
    let totalCogs = 0;
    const orderItems = items.map(item => {
      const subtotal = item.product.sellingPrice * item.quantity;
      const itemCogsTotal = item.product.cogs * item.quantity;
      total += subtotal;
      totalCogs += itemCogsTotal;

      return {
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        sellingPrice: item.product.sellingPrice,
        cogs: item.product.cogs,
        subtotal,
      };
    });

    const newOrder: Order = {
      id: generateOrderId(),
      branchId: targetBranchId,
      branchName: targetBranchName,
      items: orderItems,
      total,
      totalCogs,
      paymentMethod,
      salesChannel,
      externalOrderId: externalOrderId || undefined,
      cashTendered,
      changeAmount,
      status: 'Finished',
      createdAt: new Date().toISOString(),
    };

    // Deduct stock in the target branch inventory
    const nextInventories = productInventories.map(inv => {
      if (inv.branchId === targetBranchId) {
        const orderItem = items.find(i => i.product.id === inv.productId);
        if (orderItem) {
          return {
            ...inv,
            stock: Math.max(0, inv.stock - orderItem.quantity),
          };
        }
      }
      return inv;
    });
    setProductInventories(nextInventories);

    // Consolidated stock deduction
    const nextProducts = products.map(prod => {
      const orderItem = items.find(i => i.product.id === prod.id);
      if (orderItem) {
        return {
          ...prod,
          stock: Math.max(0, prod.stock - orderItem.quantity),
        };
      }
      return prod;
    });

    const newRevenue: Revenue = {
      id: `rev-${newOrder.id}`,
      amount: total,
      source: 'Order',
      salesChannel: newOrder.salesChannel,
      branchId: targetBranchId,
      branchName: targetBranchName,
      orderId: newOrder.id,
      description: `Penjualan ${salesChannel} (${items.length} item) - ${targetBranchName}`,
      date: newOrder.createdAt,
    };

    const nextOrders = [newOrder, ...orders];
    const nextRevenues = [newRevenue, ...revenues];

    setOrders(nextOrders);
    setProducts(nextProducts);
    setRevenues(nextRevenues);
    persistUserLocalState(
      nextProducts,
      categories,
      nextOrders,
      restocks,
      nextRevenues,
      costs,
      settings,
      roles,
      users,
      hasCompletedOnboarding,
      racks,
      stockOpnames,
      stockOpnameSchedules,
      channelIntegrations,
      productMappings,
      channelSyncErrors,
      branches,
      nextInventories
    );

    const supabase = getSupabase();
    if (supabase && user) {
      await supabase.from('orders').insert({
        id: newOrder.id,
        user_id: user.id,
        branch_id: targetBranchId,
        branch_name: targetBranchName,
        total: newOrder.total,
        total_cogs: newOrder.totalCogs,
        payment_method: newOrder.paymentMethod,
        payment_status: 'Paid',
        order_status: 'Finished',
        cash_tendered: newOrder.cashTendered || 0,
        change_amount: newOrder.changeAmount || 0,
        created_at: newOrder.createdAt,
      });

      const orderItemInserts = newOrder.items.map(it => ({
        id: `oi-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        order_id: newOrder.id,
        user_id: user.id,
        product_id: it.productId,
        product_name: it.productName,
        quantity: it.quantity,
        selling_price: it.sellingPrice,
        cogs: it.cogs,
        subtotal: it.subtotal,
      }));
      await supabase.from('order_items').insert(orderItemInserts);

      await supabase.from('revenues').insert({
        id: newRevenue.id,
        user_id: user.id,
        branch_id: targetBranchId,
        branch_name: targetBranchName,
        amount: newRevenue.amount,
        source: 'Order',
        order_id: newOrder.id,
        description: newRevenue.description,
        date: newRevenue.date,
      });

      // Update individual stock counts in database
      for (const it of items) {
        const remaining = Math.max(0, it.product.stock - it.quantity);
        await supabase.from('products').update({ stock: remaining }).eq('id', it.product.id).eq('user_id', user.id);
      }
    }

    return newOrder;
  };

  // CANCEL ORDER
  const cancelOrder = async (orderId: string): Promise<boolean> => {
    const order = orders.find(o => o.id === orderId);
    if (!order || order.status === 'Canceled') return false;

    // Restore stock
    const nextProducts = products.map(prod => {
      const orderItem = order.items.find(i => i.productId === prod.id);
      if (orderItem) {
        return {
          ...prod,
          stock: prod.stock + orderItem.quantity,
        };
      }
      return prod;
    });

    const targetBranchId = order.branchId;
    let nextInventories = productInventories;
    if (targetBranchId) {
      nextInventories = productInventories.map(inv => {
        if (inv.branchId === targetBranchId) {
          const item = order.items.find(i => i.productId === inv.productId);
          if (item) {
            return { ...inv, stock: inv.stock + item.quantity };
          }
        }
        return inv;
      });
      setProductInventories(nextInventories);
    }

    const nextOrders = orders.map(o => (o.id === orderId ? { ...o, status: 'Canceled' as const } : o));
    const nextRevenues = revenues.filter(r => r.orderId !== orderId);

    setOrders(nextOrders);
    setProducts(nextProducts);
    setRevenues(nextRevenues);
    persistUserLocalState(
      nextProducts,
      categories,
      nextOrders,
      restocks,
      nextRevenues,
      costs,
      settings,
      roles,
      users,
      hasCompletedOnboarding,
      racks,
      stockOpnames,
      stockOpnameSchedules,
      channelIntegrations,
      productMappings,
      channelSyncErrors,
      branches,
      nextInventories
    );

    const supabase = getSupabase();
    if (supabase && user) {
      await supabase.from('orders').update({ order_status: 'Canceled' }).eq('id', orderId).eq('user_id', user.id);
      await supabase.from('revenues').delete().eq('order_id', orderId).eq('user_id', user.id);
      for (const it of order.items) {
        const prod = products.find(p => p.id === it.productId);
        const restored = (prod ? prod.stock : 0) + it.quantity;
        await supabase.from('products').update({ stock: restored }).eq('id', it.productId).eq('user_id', user.id);
      }
    }

    return true;
  };

  // MANUAL REVENUE
  const addRevenue = async (
    amount: number,
    description: string,
    date?: string,
    notes?: string,
    branchId?: string
  ): Promise<Revenue> => {
    const targetBranchId = branchId || (activeBranchId !== 'all' ? activeBranchId : (branches[0]?.id || 'branch-1'));
    const targetBranch = branches.find(b => b.id === targetBranchId);
    const targetBranchName = targetBranch?.name || 'Cabang Utama';

    const newRevenue: Revenue = {
      id: `rev-man-${Date.now()}`,
      amount,
      source: 'Manual',
      branchId: targetBranchId,
      branchName: targetBranchName,
      description,
      date: date || new Date().toISOString(),
      notes,
    };

    const nextRevenues = [newRevenue, ...revenues];
    setRevenues(nextRevenues);
    persistUserLocalState(
      products,
      categories,
      orders,
      restocks,
      nextRevenues,
      costs,
      settings,
      roles,
      users,
      hasCompletedOnboarding,
      racks,
      stockOpnames,
      stockOpnameSchedules,
      channelIntegrations,
      productMappings,
      channelSyncErrors,
      branches,
      productInventories
    );

    const supabase = getSupabase();
    if (supabase && user) {
      await supabase.from('revenues').insert({
        id: newRevenue.id,
        user_id: user.id,
        branch_id: targetBranchId,
        branch_name: targetBranchName,
        amount: newRevenue.amount,
        source: 'Manual',
        description: newRevenue.description,
        date: newRevenue.date,
        notes: newRevenue.notes || '',
      });
    }

    return newRevenue;
  };

  // MANUAL COST
  const addCost = async (
    amount: number,
    category: CostCategory,
    description: string,
    date?: string,
    notes?: string,
    branchId?: string
  ): Promise<Cost> => {
    const targetBranchId = branchId || (activeBranchId !== 'all' ? activeBranchId : (branches[0]?.id || 'branch-1'));
    const targetBranch = branches.find(b => b.id === targetBranchId);
    const targetBranchName = targetBranch?.name || 'Cabang Utama';

    const newCost: Cost = {
      id: `cost-man-${Date.now()}`,
      amount,
      category,
      source: 'Manual',
      branchId: targetBranchId,
      branchName: targetBranchName,
      description,
      date: date || new Date().toISOString(),
      notes,
    };

    const nextCosts = [newCost, ...costs];
    setCosts(nextCosts);
    persistUserLocalState(
      products,
      categories,
      orders,
      restocks,
      revenues,
      nextCosts,
      settings,
      roles,
      users,
      hasCompletedOnboarding,
      racks,
      stockOpnames,
      stockOpnameSchedules,
      channelIntegrations,
      productMappings,
      channelSyncErrors,
      branches,
      productInventories
    );

    const supabase = getSupabase();
    if (supabase && user) {
      await supabase.from('costs').insert({
        id: newCost.id,
        user_id: user.id,
        branch_id: targetBranchId,
        branch_name: targetBranchName,
        amount: newCost.amount,
        category: newCost.category,
        source: 'Manual',
        description: newCost.description,
        date: newCost.date,
        notes: newCost.notes || '',
      });
    }

    return newCost;
  };

  // UPDATE SETTINGS
  const updateSettings = async (newSettings: Partial<BusinessSettings>): Promise<void> => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    persistUserLocalState(products, categories, orders, restocks, revenues, costs, merged);

    const supabase = getSupabase();
    if (supabase && user) {
      await supabase.from('business_settings').upsert({
        user_id: user.id,
        business_name: merged.name,
        business_type: merged.businessType || 'Warung',
        whatsapp_number: merged.phone || '',
        address: merged.address || '',
        logo: merged.logo || '',
        brand_color: merged.brandColor || '#0d9488',
        owner_name: merged.ownerName || user.name,
        owner_email: merged.ownerEmail || user.email,
        owner_phone: merged.ownerPhone || '',
      });
    }
  };

  // OMNICHANNEL INTEGRATION ACTIONS
  const connectChannel = async (channel: SalesChannel, storeName?: string, storeIdentifier?: string): Promise<{ success: boolean; error?: string }> => {
    const nextIntegrations = channelIntegrations.map(c => {
      if (c.channel === channel) {
        return {
          ...c,
          connectionStatus: 'connected' as const,
          connectedAt: new Date().toISOString(),
          lastSyncAt: new Date().toISOString(),
          lastSyncStatus: 'success' as const,
          storeName: storeName || c.storeName || `Toko Resmi ${channel}`,
          storeIdentifier: storeIdentifier || c.storeIdentifier || `${channel.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${Math.floor(100000 + Math.random() * 900000)}`,
          errorMessage: undefined,
        };
      }
      return c;
    });
    setChannelIntegrations(nextIntegrations);
    persistUserLocalState(products, categories, orders, restocks, revenues, costs, settings, roles, users, hasCompletedOnboarding, racks, stockOpnames, stockOpnameSchedules, nextIntegrations);
    return { success: true };
  };

  const disconnectChannel = async (channel: SalesChannel): Promise<{ success: boolean; error?: string }> => {
    const nextIntegrations = channelIntegrations.map(c => {
      if (c.channel === channel) {
        return {
          ...c,
          connectionStatus: 'disconnected' as const,
          lastSyncStatus: undefined,
          errorMessage: undefined,
        };
      }
      return c;
    });
    setChannelIntegrations(nextIntegrations);
    persistUserLocalState(products, categories, orders, restocks, revenues, costs, settings, roles, users, hasCompletedOnboarding, racks, stockOpnames, stockOpnameSchedules, nextIntegrations);
    return { success: true };
  };

  const toggleAutoSync = async (channel: SalesChannel): Promise<void> => {
    const nextIntegrations = channelIntegrations.map(c => {
      if (c.channel === channel) {
        return {
          ...c,
          autoSyncEnabled: !c.autoSyncEnabled,
        };
      }
      return c;
    });
    setChannelIntegrations(nextIntegrations);
    persistUserLocalState(products, categories, orders, restocks, revenues, costs, settings, roles, users, hasCompletedOnboarding, racks, stockOpnames, stockOpnameSchedules, nextIntegrations);
  };

  const mapProductToChannel = async (mappingId: string, productId: string): Promise<void> => {
    const targetProduct = products.find(p => p.id === productId);
    if (!targetProduct) return;

    const nextMappings = productMappings.map(m => {
      if (m.id === mappingId) {
        return {
          ...m,
          productId: targetProduct.id,
          productName: targetProduct.name,
          mappingStatus: 'mapped' as const,
          lastUpdated: new Date().toISOString(),
        };
      }
      return m;
    });

    const targetMapping = productMappings.find(m => m.id === mappingId);
    let nextErrors = channelSyncErrors;
    if (targetMapping) {
      nextErrors = channelSyncErrors.map(err => {
        if (err.channel === targetMapping.channel && (err.externalSku === targetMapping.externalSku || err.errorMessage.includes(targetMapping.externalProductName))) {
          return { ...err, resolved: true };
        }
        return err;
      });
      setChannelSyncErrors(nextErrors);
    }

    setProductMappings(nextMappings);
    persistUserLocalState(products, categories, orders, restocks, revenues, costs, settings, roles, users, hasCompletedOnboarding, racks, stockOpnames, stockOpnameSchedules, channelIntegrations, nextMappings, nextErrors);
  };

  const unmapProductFromChannel = async (mappingId: string): Promise<void> => {
    const nextMappings = productMappings.map(m => {
      if (m.id === mappingId) {
        return {
          ...m,
          productId: undefined,
          productName: undefined,
          mappingStatus: 'unmapped' as const,
          lastUpdated: new Date().toISOString(),
        };
      }
      return m;
    });
    setProductMappings(nextMappings);
    persistUserLocalState(products, categories, orders, restocks, revenues, costs, settings, roles, users, hasCompletedOnboarding, racks, stockOpnames, stockOpnameSchedules, channelIntegrations, nextMappings);
  };

  const createAndMapProduct = async (mappingId: string, productData: Omit<Product, 'id'>): Promise<Product> => {
    const newProd = await createProduct(productData);
    await mapProductToChannel(mappingId, newProd.id);
    return newProd;
  };

  const addProductMapping = async (mappingData: Omit<ProductChannelMapping, 'id' | 'lastUpdated'>): Promise<ProductChannelMapping> => {
    const newMapping: ProductChannelMapping = {
      ...mappingData,
      id: `map-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      lastUpdated: new Date().toISOString(),
    };
    const nextMappings = [newMapping, ...productMappings];
    setProductMappings(nextMappings);
    persistUserLocalState(products, categories, orders, restocks, revenues, costs, settings, roles, users, hasCompletedOnboarding, racks, stockOpnames, stockOpnameSchedules, channelIntegrations, nextMappings);
    return newMapping;
  };

  const deleteProductMapping = async (mappingId: string): Promise<void> => {
    const nextMappings = productMappings.filter(m => m.id !== mappingId);
    setProductMappings(nextMappings);
    persistUserLocalState(products, categories, orders, restocks, revenues, costs, settings, roles, users, hasCompletedOnboarding, racks, stockOpnames, stockOpnameSchedules, channelIntegrations, nextMappings);
  };

  const resolveSyncError = async (errorId: string): Promise<void> => {
    const nextErrors = channelSyncErrors.map(e => (e.id === errorId ? { ...e, resolved: true } : e));
    setChannelSyncErrors(nextErrors);
    persistUserLocalState(products, categories, orders, restocks, revenues, costs, settings, roles, users, hasCompletedOnboarding, racks, stockOpnames, stockOpnameSchedules, channelIntegrations, productMappings, nextErrors);
  };

  const syncChannelOrders = async (channel: SalesChannel): Promise<{ success: boolean; syncedCount: number; errorCount: number; message: string }> => {
    const targetChannel = channelIntegrations.find(c => c.channel === channel);
    if (!targetChannel || targetChannel.connectionStatus !== 'connected') {
      return { success: false, syncedCount: 0, errorCount: 0, message: `Saluran ${channel} belum terhubung.` };
    }

    // Check mapped products for this channel
    const channelMappings = productMappings.filter(m => m.channel === channel);
    const mappedItems = channelMappings.filter(m => m.mappingStatus === 'mapped' && m.productId);
    const unmappedItems = channelMappings.filter(m => m.mappingStatus === 'unmapped');

    let syncedOrdersCount = 0;
    let newErrorsCount = 0;
    let updatedProducts = [...products];
    let updatedOrders = [...orders];
    let updatedRevenues = [...revenues];
    let updatedErrors = [...channelSyncErrors];

    // Check if there are unmapped items that simulate incoming order errors
    if (unmappedItems.length > 0 && Math.random() > 0.4) {
      const problematicItem = unmappedItems[0];
      const extId = `${channel.substring(0, 3).toUpperCase()}-ERR-${Math.floor(1000 + Math.random() * 9000)}`;
      const newErr: ChannelSyncError = {
        id: `err-${Date.now()}`,
        channel,
        externalOrderId: extId,
        externalSku: problematicItem.externalSku,
        errorType: 'unmapped_product',
        errorMessage: `Produk external "${problematicItem.externalProductName}" (SKU: ${problematicItem.externalSku}) belum dipetakan ke produk warung.`,
        createdAt: new Date().toISOString(),
        resolved: false,
      };
      updatedErrors = [newErr, ...updatedErrors];
      newErrorsCount++;
    }

    // Pick 1-2 mapped items to simulate fresh incoming order
    const availableMapped = mappedItems.filter(m => {
      const prod = updatedProducts.find(p => p.id === m.productId);
      return prod && prod.stock > 0;
    });

    if (availableMapped.length > 0) {
      const chosenMapping = availableMapped[Math.floor(Math.random() * availableMapped.length)];
      const targetProduct = updatedProducts.find(p => p.id === chosenMapping.productId)!;
      const orderQty = Math.min(targetProduct.stock, Math.floor(Math.random() * 2) + 1);

      if (orderQty > 0) {
        const itemSellingPrice = chosenMapping.channelPrice || targetProduct.sellingPrice;
        const subtotal = itemSellingPrice * orderQty;
        const cogsTotal = targetProduct.cogs * orderQty;
        const extOrderId = `${channel.substring(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

        const newOrder: Order = {
          id: generateOrderId(),
          salesChannel: channel,
          externalOrderId: extOrderId,
          externalOrderStatus: 'Selesai',
          items: [
            {
              productId: targetProduct.id,
              productName: targetProduct.name,
              quantity: orderQty,
              sellingPrice: itemSellingPrice,
              cogs: targetProduct.cogs,
              subtotal,
            },
          ],
          total: subtotal,
          totalCogs: cogsTotal,
          paymentMethod: channel.includes('Food') ? 'GoPay' : 'Transfer',
          status: 'Finished',
          createdAt: new Date().toISOString(),
        };

        // Deduct inventory from centralized products
        updatedProducts = updatedProducts.map(p => {
          if (p.id === targetProduct.id) {
            return {
              ...p,
              stock: Math.max(0, p.stock - orderQty),
            };
          }
          return p;
        });

        const newRevenue: Revenue = {
          id: `rev-${newOrder.id}`,
          amount: subtotal,
          source: 'Order',
          salesChannel: channel,
          orderId: newOrder.id,
          description: `Penjualan ${channel} (${extOrderId})`,
          date: newOrder.createdAt,
        };

        updatedOrders = [newOrder, ...updatedOrders];
        updatedRevenues = [newRevenue, ...updatedRevenues];
        syncedOrdersCount++;
      }
    }

    // Update channel integration state
    const nextIntegrations = channelIntegrations.map(c => {
      if (c.channel === channel) {
        return {
          ...c,
          lastSyncAt: new Date().toISOString(),
          lastSyncStatus: newErrorsCount > 0 ? ('error' as const) : ('success' as const),
          syncOrdersCount: c.syncOrdersCount + syncedOrdersCount,
          syncErrorCount: c.syncErrorCount + newErrorsCount,
          errorMessage: newErrorsCount > 0 ? `Terdapat produk yang belum terpetakan` : undefined,
        };
      }
      return c;
    });

    setProducts(updatedProducts);
    setOrders(updatedOrders);
    setRevenues(updatedRevenues);
    setChannelIntegrations(nextIntegrations);
    setChannelSyncErrors(updatedErrors);

    persistUserLocalState(
      updatedProducts,
      categories,
      updatedOrders,
      restocks,
      updatedRevenues,
      costs,
      settings,
      roles,
      users,
      hasCompletedOnboarding,
      racks,
      stockOpnames,
      stockOpnameSchedules,
      nextIntegrations,
      productMappings,
      updatedErrors
    );

    return {
      success: true,
      syncedCount: syncedOrdersCount,
      errorCount: newErrorsCount,
      message: syncedOrdersCount > 0
        ? `Berhasil sinkronisasi ${syncedOrdersCount} pesanan baru dari ${channel}. Stok produk otomatis terpotong.`
        : `Sinkronisasi saluran ${channel} selesai. Tidak ada transaksi baru.`,
    };
  };

  const syncAllChannels = async (): Promise<{ success: boolean; totalSynced: number }> => {
    let total = 0;
    for (const integ of channelIntegrations) {
      if (integ.connectionStatus === 'connected') {
        const res = await syncChannelOrders(integ.channel);
        total += res.syncedCount;
      }
    }
    return { success: true, totalSynced: total };
  };

  const createExternalOrder = async (
    channel: SalesChannel,
    externalOrderId: string,
    items: { productId?: string; externalSku?: string; externalProductName: string; quantity: number; sellingPrice: number }[],
    paymentMethod: PaymentMethod = 'Transfer',
    notes?: string
  ): Promise<{ success: boolean; order?: Order; error?: string }> => {
    if (items.length === 0) {
      return { success: false, error: 'Pesanan external tidak memiliki item.' };
    }

    let total = 0;
    let totalCogs = 0;
    const orderItems: any[] = [];
    let updatedProducts = [...products];

    for (const it of items) {
      let matchedProd = it.productId ? updatedProducts.find(p => p.id === it.productId) : null;
      if (!matchedProd && it.externalSku) {
        matchedProd = updatedProducts.find(p => p.barcode === it.externalSku || p.name.toLowerCase() === it.externalProductName.toLowerCase()) || null;
      }

      if (!matchedProd) {
        // Record error for unmapped item
        const newErr: ChannelSyncError = {
          id: `err-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          channel,
          externalOrderId,
          externalSku: it.externalSku,
          errorType: 'unmapped_product',
          errorMessage: `Produk "${it.externalProductName}" (SKU: ${it.externalSku || '-'}) belum terpetakan.`,
          createdAt: new Date().toISOString(),
          resolved: false,
        };
        const nextErrors = [newErr, ...channelSyncErrors];
        setChannelSyncErrors(nextErrors);
        return {
          success: false,
          error: `Gagal memproses pesanan: Produk "${it.externalProductName}" belum dipetakan ke inventaris pusat.`,
        };
      }

      const subtotal = it.sellingPrice * it.quantity;
      const cogsVal = (matchedProd.cogs || 0) * it.quantity;
      total += subtotal;
      totalCogs += cogsVal;

      orderItems.push({
        productId: matchedProd.id,
        productName: matchedProd.name,
        quantity: it.quantity,
        sellingPrice: it.sellingPrice,
        cogs: matchedProd.cogs,
        subtotal,
      });

      // Deduct central inventory
      updatedProducts = updatedProducts.map(p => {
        if (p.id === matchedProd!.id) {
          return { ...p, stock: Math.max(0, p.stock - it.quantity) };
        }
        return p;
      });
    }

    const newOrder: Order = {
      id: generateOrderId(),
      salesChannel: channel,
      externalOrderId,
      externalOrderStatus: 'Selesai',
      items: orderItems,
      total,
      totalCogs,
      paymentMethod,
      status: 'Finished',
      notes,
      createdAt: new Date().toISOString(),
    };

    const newRevenue: Revenue = {
      id: `rev-${newOrder.id}`,
      amount: total,
      source: 'Order',
      salesChannel: channel,
      orderId: newOrder.id,
      description: `Penjualan ${channel} (${externalOrderId})`,
      date: newOrder.createdAt,
    };

    const nextOrders = [newOrder, ...orders];
    const nextRevenues = [newRevenue, ...revenues];

    setProducts(updatedProducts);
    setOrders(nextOrders);
    setRevenues(nextRevenues);
    persistUserLocalState(updatedProducts, categories, nextOrders, restocks, nextRevenues);

    return { success: true, order: newOrder };
  };

  // RESET TO DEMO (STAGING ONLY)
  const resetToDemoData = () => {
    const initial = getStagingInitialData();
    setProducts(initial.products);
    setCategories(initial.categories);
    setRacks(initial.racks || JSON.parse(JSON.stringify(INITIAL_RACKS)));
    setStockOpnames(initial.stockOpnames || JSON.parse(JSON.stringify(INITIAL_STOCK_OPNAMES)));
    setStockOpnameSchedules(initial.stockOpnameSchedules || JSON.parse(JSON.stringify(INITIAL_STOCK_OPNAME_SCHEDULES)));
    setOrders(initial.orders);
    setRestocks(initial.restocks);
    setRevenues(initial.revenues);
    setCosts(initial.costs);
    setSettings(initial.settings);
    setRoles(initial.roles || JSON.parse(JSON.stringify(DEFAULT_ROLES)));
    if (initial.users && initial.users.length > 0) {
      setUsers(initial.users);
    }
    setChannelIntegrations(initial.channelIntegrations || INITIAL_CHANNEL_INTEGRATIONS);
    setProductMappings(initial.productMappings || INITIAL_PRODUCT_MAPPINGS);
    setChannelSyncErrors(initial.channelSyncErrors || INITIAL_CHANNEL_SYNC_ERRORS);
    setHasCompletedOnboarding(true);
    if (user) {
      localUserDataStore.saveUserData(user.id, initial);
    }
  };

  return (
    <AppContext.Provider
      value={{
        products,
        categories,
        racks,
        stockOpnames,
        stockOpnameSchedules,
        orders,
        restocks,
        revenues,
        costs,
        settings,
        roles,
        users,
        currentUserRole,
        hasPermission,
        isLoaded,

        // Branch management
        branches,
        productInventories,
        activeBranchId,
        activeBranch,
        canSwitchToAllBranches,
        accessibleBranches,
        setActiveBranchId,
        addBranch,
        updateBranch,
        toggleBranchStatus,
        getProductStockInBranch,
        getBranchInventory,
        updateBranchStock,

        // Omnichannel states & actions
        channelIntegrations,
        productMappings,
        channelSyncErrors,
        connectChannel,
        disconnectChannel,
        toggleAutoSync,
        syncChannelOrders,
        syncAllChannels,
        mapProductToChannel,
        unmapProductFromChannel,
        createAndMapProduct,
        addProductMapping,
        deleteProductMapping,
        resolveSyncError,
        createExternalOrder,

        user,
        isAuthenticated: Boolean(user),
        hasCompletedOnboarding,
        authScreen,
        setAuthScreen,
        login,
        register,
        logout,
        completeOnboarding,
        changePassword,
        changeEmail,
        updateUserProfile,

        createRole,
        updateRole,
        deleteRole,
        createUser,
        updateUser,
        toggleUserStatus,
        resetUserPassword,

        isSidebarCollapsed,
        setIsSidebarCollapsed,
        isMobileNavOpen,
        setIsMobileNavOpen,

        createProduct,
        updateProduct,
        archiveProduct,
        unarchiveProduct,
        deleteProductPermanently,
        addCategory,
        updateCategory,
        deleteCategory,

        addRack,
        updateRack,
        deleteRack,

        createStockOpname,
        updateStockOpname,
        finalizeStockOpname,
        deleteStockOpname,

        addStockOpnameSchedule,
        updateStockOpnameSchedule,
        deleteStockOpnameSchedule,

        bulkImportProducts,
        seedInitialData,
        restockProduct,
        createOrder,
        cancelOrder,
        addRevenue,
        addCost,
        updateSettings,
        resetToDemoData,

        isCreateOrderModalOpen,
        setIsCreateOrderModalOpen,
        restockModalProductId,
        setRestockModalProductId,
        activeTab,
        setActiveTab,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
