import { AppModule, AppRole, AppUser, ModulePermission } from '@/types';

export interface ModuleMetadata {
  key: AppModule;
  name: string;
  description: string;
  iconName: string;
}

export const APP_MODULES: ModuleMetadata[] = [
  {
    key: 'dashboard',
    name: 'Dashboard',
    description: 'Ringkasan penjualan harian, stok menipis, dan ringkasan performa',
    iconName: 'LayoutDashboard',
  },
  {
    key: 'orders',
    name: 'Pesanan (Kasir)',
    description: 'Pembuatan transaksi kasir, riwayat pesanan, dan pencetakan struk',
    iconName: 'ShoppingCart',
  },
  {
    key: 'products',
    name: 'Produk & Katalog',
    description: 'Master produk, harga jual, HPP, barcode, dan import CSV',
    iconName: 'Package',
  },
  {
    key: 'inventory',
    name: 'Inventaris & Gudang',
    description: 'Audit stok fisik (stock opname), penataan rak barang, dan pemantauan stok',
    iconName: 'Boxes',
  },
  {
    key: 'categories',
    name: 'Kategori Produk',
    description: 'Pengelompokan barang dan manajemen kategori produk',
    iconName: 'Tag',
  },
  {
    key: 'racks',
    name: 'Rak & Lokasi Fisik',
    description: 'Manajemen rak barang, kode rak, dan lokasi penyimpanan',
    iconName: 'Boxes',
  },
  {
    key: 'stock_opname',
    name: 'Stock Opname & Audit Fisik',
    description: 'Audit fisik stok per rak/kategori, rekonsiliasi selisih, dan penjadwalan',
    iconName: 'ClipboardCheck',
  },
  {
    key: 'restock',
    name: 'Restock Barang',
    description: 'Pencatatan penambahan stok dan perhitungan HPP terbobot otomatis',
    iconName: 'RefreshCw',
  },
  {
    key: 'finance',
    name: 'Keuangan & Laba Rugi',
    description: 'Laporan laba rugi, pencatatan biaya operasional, dan arus kas',
    iconName: 'TrendingUp',
  },
  {
    key: 'branches',
    name: 'Manajemen Cabang',
    description: 'Manajemen cabang toko fisik, kode cabang, dan status aktivasi',
    iconName: 'Store',
  },
  {
    key: 'perangkat_kasir',
    name: 'Perangkat Kasir',
    description: 'Integrasi printer struk POS, pembuka laci kasir otomatis, dan scanner barcode',
    iconName: 'Printer',
  },
  {
    key: 'integrasi_channel',
    name: 'Integrasi Channel',
    description: 'Koneksi marketplace omnichannel (Shopee, Tokopedia, TikTok Shop, GoFood, GrabFood, ShopeeFood) & sinkronisasi pesanan',
    iconName: 'Share2',
  },
  {
    key: 'users',
    name: 'User Management',
    description: 'Manajemen staf kasir, pembuatan user, role, dan izin akses',
    iconName: 'Users',
  },
  {
    key: 'settings',
    name: 'Profile / Account Settings',
    description: 'Pengaturan identitas toko/warung, profil akun, dan ganti kata sandi',
    iconName: 'Settings',
  },
];

export const MODULE_LABELS: Record<AppModule, string> = {
  dashboard: 'Dashboard',
  orders: 'Pesanan (Kasir)',
  products: 'Produk & Stok',
  inventory: 'Inventaris & Gudang',
  categories: 'Kategori',
  racks: 'Rak & Lokasi',
  stock_opname: 'Stock Opname',
  restock: 'Restock Barang',
  finance: 'Keuangan & Laba Rugi',
  branches: 'Cabang Toko',
  perangkat_kasir: 'Perangkat Kasir',
  integrasi_channel: 'Integrasi Channel',
  users: 'User Management',
  settings: 'Profil / Pengaturan',
};

export const MODULE_DESCRIPTIONS: Record<AppModule, string> = {
  dashboard: 'Ringkasan penjualan, grafik performa, dan stok kritis',
  orders: 'Kasir POS, input pesanan belanja, dan cetak invoice',
  products: 'Katalog barang, harga jual, HPP, scan barcode',
  inventory: 'Audit stok fisik, tata letak rak, dan rekonsiliasi persediaan',
  categories: 'Manajemen master kategori barang',
  racks: 'Manajemen master rak dan kode penempatan barang',
  stock_opname: 'Audit stok fisik, rekonsiliasi selisih, dan jadwal audit berkala',
  restock: 'Catat restock & hitung HPP rata-rata terbobot',
  finance: 'Pencatatan laba bersih, beban operasional, dan laporan',
  branches: 'Manajemen multi-cabang fisik, aktivasi, dan alamat toko',
  perangkat_kasir: 'Konfigurasi printer thermal, laci kasir (drawer), dan scanner barcode',
  integrasi_channel: 'Manajemen koneksi penjualan omnichannel resmi, pemetaan produk & sinkronisasi inventori terpusat',
  users: 'Kelola data pengguna, role, dan pembatasan modul',
  settings: 'Identitas toko, profil akun, dan ganti kata sandi',
};

export const FULL_PERMISSIONS: Record<AppModule, ModulePermission> = {
  dashboard: { canView: true, canCreate: true, canEdit: true, canDelete: true },
  orders: { canView: true, canCreate: true, canEdit: true, canDelete: true },
  products: { canView: true, canCreate: true, canEdit: true, canDelete: true },
  inventory: { canView: true, canCreate: true, canEdit: true, canDelete: true },
  categories: { canView: true, canCreate: true, canEdit: true, canDelete: true },
  racks: { canView: true, canCreate: true, canEdit: true, canDelete: true },
  stock_opname: { canView: true, canCreate: true, canEdit: true, canDelete: true },
  restock: { canView: true, canCreate: true, canEdit: true, canDelete: true },
  finance: { canView: true, canCreate: true, canEdit: true, canDelete: true },
  branches: { canView: true, canCreate: true, canEdit: true, canDelete: true },
  perangkat_kasir: { canView: true, canCreate: true, canEdit: true, canDelete: true },
  integrasi_channel: { canView: true, canCreate: true, canEdit: true, canDelete: true },
  users: { canView: true, canCreate: true, canEdit: true, canDelete: true },
  settings: { canView: true, canCreate: true, canEdit: true, canDelete: true },
};

export const NO_PERMISSIONS: Record<AppModule, ModulePermission> = {
  dashboard: { canView: false, canCreate: false, canEdit: false, canDelete: false },
  orders: { canView: false, canCreate: false, canEdit: false, canDelete: false },
  products: { canView: false, canCreate: false, canEdit: false, canDelete: false },
  inventory: { canView: false, canCreate: false, canEdit: false, canDelete: false },
  categories: { canView: false, canCreate: false, canEdit: false, canDelete: false },
  racks: { canView: false, canCreate: false, canEdit: false, canDelete: false },
  stock_opname: { canView: false, canCreate: false, canEdit: false, canDelete: false },
  restock: { canView: false, canCreate: false, canEdit: false, canDelete: false },
  finance: { canView: false, canCreate: false, canEdit: false, canDelete: false },
  branches: { canView: false, canCreate: false, canEdit: false, canDelete: false },
  perangkat_kasir: { canView: false, canCreate: false, canEdit: false, canDelete: false },
  integrasi_channel: { canView: false, canCreate: false, canEdit: false, canDelete: false },
  users: { canView: false, canCreate: false, canEdit: false, canDelete: false },
  settings: { canView: false, canCreate: false, canEdit: false, canDelete: false },
};

export const DEFAULT_ROLES: AppRole[] = [
  {
    id: 'role-owner-admin',
    name: 'Owner / Admin',
    description: 'Akses penuh ke seluruh modul operasional, keuangan, pengaturan dan manajemen pengguna.',
    isSystem: true,
    permissions: JSON.parse(JSON.stringify(FULL_PERMISSIONS)),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'role-kasir',
    name: 'Kasir',
    description: 'Melayani transaksi pesanan kasir, melihat katalog produk & mencetak struk belanja.',
    isSystem: false,
    permissions: {
      dashboard: { canView: true, canCreate: false, canEdit: false, canDelete: false },
      orders: { canView: true, canCreate: true, canEdit: true, canDelete: false },
      products: { canView: true, canCreate: false, canEdit: false, canDelete: false },
      inventory: { canView: true, canCreate: false, canEdit: false, canDelete: false },
      categories: { canView: true, canCreate: false, canEdit: false, canDelete: false },
      racks: { canView: true, canCreate: false, canEdit: false, canDelete: false },
      stock_opname: { canView: true, canCreate: true, canEdit: true, canDelete: false },
      restock: { canView: false, canCreate: false, canEdit: false, canDelete: false },
      finance: { canView: false, canCreate: false, canEdit: false, canDelete: false },
      branches: { canView: true, canCreate: false, canEdit: false, canDelete: false },
      perangkat_kasir: { canView: true, canCreate: true, canEdit: true, canDelete: false },
      integrasi_channel: { canView: false, canCreate: false, canEdit: false, canDelete: false },
      users: { canView: false, canCreate: false, canEdit: false, canDelete: false },
      settings: { canView: true, canCreate: false, canEdit: true, canDelete: false },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'role-finance',
    name: 'Finance / Akuntansi',
    description: 'Akses laporan keuangan, pencatatan biaya operasional, pendapatan, dan laba rugi.',
    isSystem: false,
    permissions: {
      dashboard: { canView: true, canCreate: false, canEdit: false, canDelete: false },
      orders: { canView: true, canCreate: false, canEdit: false, canDelete: false },
      products: { canView: true, canCreate: false, canEdit: false, canDelete: false },
      inventory: { canView: true, canCreate: false, canEdit: false, canDelete: false },
      categories: { canView: true, canCreate: false, canEdit: false, canDelete: false },
      racks: { canView: false, canCreate: false, canEdit: false, canDelete: false },
      stock_opname: { canView: true, canCreate: false, canEdit: false, canDelete: false },
      restock: { canView: true, canCreate: false, canEdit: false, canDelete: false },
      finance: { canView: true, canCreate: true, canEdit: true, canDelete: true },
      branches: { canView: true, canCreate: false, canEdit: false, canDelete: false },
      perangkat_kasir: { canView: false, canCreate: false, canEdit: false, canDelete: false },
      integrasi_channel: { canView: false, canCreate: false, canEdit: false, canDelete: false },
      users: { canView: false, canCreate: false, canEdit: false, canDelete: false },
      settings: { canView: true, canCreate: false, canEdit: true, canDelete: false },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'role-gudang',
    name: 'Staff Gudang / Stok',
    description: 'Kelola master barang, kategori produk, penempatan rak, stock opname, dan pencatatan restock barang masuk.',
    isSystem: false,
    permissions: {
      dashboard: { canView: true, canCreate: false, canEdit: false, canDelete: false },
      orders: { canView: true, canCreate: false, canEdit: false, canDelete: false },
      products: { canView: true, canCreate: true, canEdit: true, canDelete: false },
      inventory: { canView: true, canCreate: true, canEdit: true, canDelete: true },
      categories: { canView: true, canCreate: true, canEdit: true, canDelete: false },
      racks: { canView: true, canCreate: true, canEdit: true, canDelete: true },
      stock_opname: { canView: true, canCreate: true, canEdit: true, canDelete: true },
      restock: { canView: true, canCreate: true, canEdit: true, canDelete: false },
      finance: { canView: false, canCreate: false, canEdit: false, canDelete: false },
      branches: { canView: true, canCreate: false, canEdit: false, canDelete: false },
      perangkat_kasir: { canView: false, canCreate: false, canEdit: false, canDelete: false },
      integrasi_channel: { canView: false, canCreate: false, canEdit: false, canDelete: false },
      users: { canView: false, canCreate: false, canEdit: false, canDelete: false },
      settings: { canView: true, canCreate: false, canEdit: true, canDelete: false },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const STAGING_INITIAL_USERS: AppUser[] = [
  {
    id: 'usr-staging-0000-0000-000000000000',
    authUserId: 'usr-staging-0000-0000-000000000000',
    name: 'Staging Demo Operator',
    username: 'admin',
    email: 'staging@example.com',
    phone: '081234567890',
    roleId: 'role-owner-admin',
    branchAccess: ['*'],
    status: 'active',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    onboardingCompleted: true,
  },
  {
    id: 'usr-kasir-siti',
    authUserId: 'usr-kasir-siti',
    name: 'Siti Rahmawati',
    username: 'kasir_siti',
    email: 'kasir_siti@warung.internal',
    phone: '081298765432',
    roleId: 'role-kasir',
    branchAccess: ['branch-1'],
    status: 'active',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    onboardingCompleted: true,
  },
  {
    id: 'usr-finance-budi',
    authUserId: 'usr-finance-budi',
    name: 'Budi Hartono',
    username: 'akuntan_budi',
    email: 'akuntan_budi@warung.internal',
    phone: '085712345678',
    roleId: 'role-finance',
    branchAccess: ['*'],
    status: 'active',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    onboardingCompleted: true,
  },
  {
    id: 'usr-gudang-agus',
    authUserId: 'usr-gudang-agus',
    name: 'Agus Pratama',
    username: 'gudang_agus',
    email: 'gudang_agus@warung.internal',
    phone: '087811223344',
    roleId: 'role-gudang',
    branchAccess: ['branch-1', 'branch-2'],
    status: 'active',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    onboardingCompleted: true,
  },
];

// Generate clean username from name
export function generateUsername(name: string, existingUsernames: string[] = []): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 15) || 'user';

  let candidate = base;
  let counter = 1;
  const existingSet = new Set(existingUsernames.map((u) => u.toLowerCase()));

  while (existingSet.has(candidate.toLowerCase())) {
    candidate = `${base}_${counter}`;
    counter++;
  }

  return candidate;
}

// Generate random secure password (8-10 chars, letters, numbers, symbol)
export function generateSecurePassword(length: number = 8): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz';
  const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const nums = '23456789';
  const symbols = '!@#$%&*';

  let pwd = '';
  // Ensure at least 1 upper, 1 lower, 1 num, 1 symbol
  pwd += uppers[Math.floor(Math.random() * uppers.length)];
  pwd += chars[Math.floor(Math.random() * chars.length)];
  pwd += nums[Math.floor(Math.random() * nums.length)];
  pwd += symbols[Math.floor(Math.random() * symbols.length)];

  const all = chars + uppers + nums;
  while (pwd.length < length) {
    pwd += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle
  return pwd.split('').sort(() => 0.5 - Math.random()).join('');
}

// Check permission helper
export function checkPermission(
  role: AppRole | null | undefined,
  module: AppModule,
  action: 'view' | 'create' | 'edit' | 'delete' = 'view'
): boolean {
  if (!role) return false;
  if (role.isSystem || role.id === 'role-owner-admin') return true;

  const modPerm = role.permissions?.[module];
  if (!modPerm) return false;

  switch (action) {
    case 'view':
      return Boolean(modPerm.canView);
    case 'create':
      return Boolean(modPerm.canCreate);
    case 'edit':
      return Boolean(modPerm.canEdit);
    case 'delete':
      return Boolean(modPerm.canDelete);
    default:
      return false;
  }
}

// Credentials registry for username authentication
const CREDENTIALS_STORE_KEY = 'warung_user_credentials_v1';

export const credentialsStore = {
  getCredentials(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    try {
      const data = localStorage.getItem(CREDENTIALS_STORE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },
  saveCredential(username: string, password: string): void {
    if (typeof window === 'undefined') return;
    try {
      const all = credentialsStore.getCredentials();
      all[username.toLowerCase()] = password;
      localStorage.setItem(CREDENTIALS_STORE_KEY, JSON.stringify(all));
    } catch (e) {
      console.error('Failed to save credential mapping:', e);
    }
  },
  verifyPassword(username: string, password: string): boolean {
    const all = credentialsStore.getCredentials();
    const stored = all[username.toLowerCase()];
    if (stored) {
      return stored === password;
    }
    // Default demo passwords
    const validPasswords = [
      'StagingDemo2026!',
      'KasirWarung2026!',
      'FinanceWarung2026!',
      'GudangWarung2026!',
    ];
    if (validPasswords.includes(password)) {
      return true;
    }
    return false;
  },
  validateCredentials(usernameOrEmail: string, password: string): AppUser | null {
    const input = usernameOrEmail.toLowerCase().trim();
    const creds = credentialsStore.getCredentials();

    // Check custom saved credentials first
    const customPass = creds[input];

    // Find demo user match
    const demoUser = STAGING_INITIAL_USERS.find((u) => {
      return (
        u.username.toLowerCase() === input ||
        u.email.toLowerCase() === input ||
        (input === 'staging' && u.email === 'staging@example.com') ||
        (input === 'owner' && u.id.includes('staging')) ||
        (input === 'kasir1' && u.id.includes('kasir')) ||
        (input === 'finance1' && u.id.includes('finance')) ||
        (input === 'gudang1' && u.id.includes('gudang'))
      );
    });

    if (demoUser) {
      // If custom password was set for this demo user
      if (customPass) {
        if (customPass === password) return demoUser;
      } else {
        // Match default demo passwords
        if (
          password === 'StagingDemo2026!' ||
          password === 'KasirWarung2026!' ||
          password === 'FinanceWarung2026!' ||
          password === 'GudangWarung2026!'
        ) {
          return demoUser;
        }
      }
    }

    // Check custom users stored in local store if in browser
    if (typeof window !== 'undefined') {
      try {
        const localData = localStorage.getItem('warung_pos_local_data_v1');
        if (localData) {
          const parsed = JSON.parse(localData);
          if (parsed.users && Array.isArray(parsed.users)) {
            const found = parsed.users.find((u: AppUser) => {
              return (
                u.username.toLowerCase() === input ||
                (u.email && u.email.toLowerCase() === input)
              );
            });
            if (found) {
              if (customPass && customPass === password) {
                return found;
              }
              if (password === 'StagingDemo2026!' || password.length >= 6) {
                return found;
              }
            }
          }
        }
      } catch (err) {
        console.error('Error reading local user data:', err);
      }
    }

    return null;
  },
  registerUserCredential(user: Partial<AppUser> & { password?: string }): void {
    if (user.username && user.password) {
      credentialsStore.saveCredential(user.username, user.password);
    }
  },
  updatePassword(username: string, newPassword: string): void {
    credentialsStore.saveCredential(username, newPassword);
  },
};

// Helper to get application login URL
export function getAppLoginUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'https://app-warung.id';
}

// Format clean access summary for User Detail modal
export function formatModuleAccessSummary(role?: AppRole | null): {
  module: AppModule;
  label: string;
  description: string;
  accessText: string;
  accessType: 'full' | 'partial' | 'view_only' | 'none';
}[] {
  const isSuperAdmin = !role || role.isSystem || role.id === 'role-owner-admin';
  const permissions = role?.permissions || ({} as Record<AppModule, ModulePermission>);

  return (Object.keys(MODULE_LABELS) as AppModule[]).map((mod) => {
    const label = MODULE_LABELS[mod];
    const desc = MODULE_DESCRIPTIONS[mod];

    if (isSuperAdmin) {
      return {
        module: mod,
        label,
        description: desc,
        accessText: 'View, Create, Edit, Delete (Akses Penuh)',
        accessType: 'full',
      };
    }

    const p = permissions[mod];
    if (!p || !p.canView) {
      return {
        module: mod,
        label,
        description: desc,
        accessText: 'Tidak Ada Akses (No Access)',
        accessType: 'none',
      };
    }

    const actions: string[] = ['View'];
    if (p.canCreate) actions.push('Create');
    if (p.canEdit) actions.push('Edit');
    if (p.canDelete) actions.push('Delete');

    let accessType: 'full' | 'partial' | 'view_only' = 'partial';
    if (actions.length === 4) {
      accessType = 'full';
    } else if (actions.length === 1 && actions[0] === 'View') {
      accessType = 'view_only';
    }

    return {
      module: mod,
      label,
      description: desc,
      accessText: actions.join(', '),
      accessType,
    };
  });
}

// Clean formatted plain-text credentials for sharing to staff
export function formatCredentialsText(params: {
  loginUrl: string;
  username: string;
  password?: string;
  name?: string;
  roleName?: string;
}): string {
  const lines: string[] = [];
  if (params.name) lines.push(`Nama: ${params.name}`);
  if (params.roleName) lines.push(`Role: ${params.roleName}`);
  lines.push(`Login URL: ${params.loginUrl}`);
  lines.push(`Username: ${params.username}`);
  if (params.password) {
    lines.push(`Password: ${params.password}`);
  }
  return lines.join('\n');
}

// Branch access helpers
export function canAccessAllBranches(
  user?: { roleId?: string; branchAccess?: string[] } | null,
  role?: AppRole | null
): boolean {
  if (!user) return true;
  if (user.roleId === 'role-owner-admin' || role?.id === 'role-owner-admin') return true;
  if (!user.branchAccess || user.branchAccess.length === 0) return true;
  return user.branchAccess.includes('*');
}

export function hasBranchAccess(
  user?: { roleId?: string; branchAccess?: string[] } | null,
  branchId?: string | null,
  role?: AppRole | null
): boolean {
  if (!branchId || branchId === 'all') return canAccessAllBranches(user, role);
  if (!user) return true;
  if (user.roleId === 'role-owner-admin' || role?.id === 'role-owner-admin') return true;
  if (!user.branchAccess || user.branchAccess.length === 0) return true;
  return user.branchAccess.includes('*') || user.branchAccess.includes(branchId);
}

