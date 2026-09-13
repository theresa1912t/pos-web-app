'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  TrendingUp,
  Printer,
  Settings,
  Store,
  Globe,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  LogOut,
  X,
  UserCheck,
  Users,
  Shield,
  Building2,
  Boxes,
  BadgePercent,
  Zap,
  FileSpreadsheet,
} from 'lucide-react';

interface SidebarProps {
  isMobileDrawer?: boolean;
}

export function Sidebar({ isMobileDrawer = false }: SidebarProps) {
  const {
    activeTab,
    setActiveTab,
    products,
    promotions,
    channelSyncErrors,
    settings,
    user,
    currentUserRole,
    hasPermission,
    logout,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    isMobileNavOpen,
    setIsMobileNavOpen,
  } = useApp();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const lowStockCount = products.filter(
    (p) => !p.isArchived && p.stock <= (p.minStockThreshold ?? 5)
  ).length;

  const unresolvedErrorCount = channelSyncErrors?.filter((e) => !e.resolved).length || 0;
  const activePromoCount = promotions?.filter((p) => p.isActive).length || 0;

  const rawNavItems = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      icon: LayoutDashboard,
      visible: hasPermission('dashboard', 'view'),
    },
    {
      id: 'orders' as const,
      label: 'Kasir',
      icon: ShoppingCart,
      visible: hasPermission('orders', 'view'),
    },
    {
      id: 'products' as const,
      label: 'Produk',
      icon: Package,
      visible: hasPermission('products', 'view'),
    },
    {
      id: 'promotions' as const,
      label: 'Promosi',
      icon: BadgePercent,
      badge: activePromoCount > 0 ? activePromoCount : undefined,
      visible: hasPermission('promotions', 'view'),
    },
    {
      id: 'inventory' as const,
      label: 'Inventaris',
      icon: Boxes,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      visible: hasPermission('inventory', 'view') || hasPermission('stock_opname', 'view') || hasPermission('racks', 'view'),
    },
    {
      id: 'finance' as const,
      label: 'Keuangan',
      icon: TrendingUp,
      visible: hasPermission('finance', 'view'),
    },
    {
      id: 'branches' as const,
      label: 'Cabang',
      icon: Building2,
      visible: hasPermission('branches', 'view'),
    },
    {
      id: 'perangkat_kasir' as const,
      label: 'Perangkat Kasir',
      icon: Printer,
      visible: hasPermission('perangkat_kasir', 'view'),
    },
    {
      id: 'integrasi_channel' as const,
      label: 'Integrasi Saluran',
      icon: Globe,
      badge: unresolvedErrorCount > 0 ? unresolvedErrorCount : undefined,
      visible: hasPermission('integrasi_channel', 'view'),
    },
    {
      id: 'export_data' as const,
      label: 'Ekspor Data',
      icon: FileSpreadsheet,
      visible: hasPermission('export_data', 'view'),
    },
    {
      id: 'users' as const,
      label: 'Pengguna',
      icon: Users,
      visible: hasPermission('users', 'view'),
    },
  ];

  const navItems = rawNavItems.filter((i) => i.visible);

  const handleNavClick = (tabId: typeof activeTab) => {
    setActiveTab(tabId);
    setIsProfileMenuOpen(false);
    if (isMobileDrawer) {
      setIsMobileNavOpen(false);
    }
  };

  const handleProfileSettingsClick = () => {
    setActiveTab('settings');
    setIsProfileMenuOpen(false);
    if (isMobileDrawer) {
      setIsMobileNavOpen(false);
    }
  };

  const handleLogoutClick = () => {
    setIsProfileMenuOpen(false);
    if (isMobileDrawer) {
      setIsMobileNavOpen(false);
    }
    logout();
  };

  // Sidebar container content
  const sidebarContent = (
    <div className="flex flex-col h-full bg-white text-slate-900 border-r border-slate-200 select-none">
      {/* Brand & Store Header */}
      <div className={`p-4 border-b border-slate-200 flex items-center ${isSidebarCollapsed && !isMobileDrawer ? 'justify-center' : 'justify-between'}`}>
        <div className="flex items-center space-x-3 overflow-hidden">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-medium shrink-0 shadow-sm transition-all bg-teal-600"
            style={{ backgroundColor: settings.brandColor || '#0d9488' }}
          >
            {settings.logo ? (
              <img
                src={settings.logo}
                alt="Logo"
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <Store className="w-5 h-5" />
            )}
          </div>
          {(!isSidebarCollapsed || isMobileDrawer) && (
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-slate-900 truncate leading-tight">
                {settings.name || 'Warung Juara'}
              </h2>
              <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 mt-0.5">
                {settings.businessType || 'Warung POS'}
              </span>
            </div>
          )}
        </div>

        {/* Mobile Close Button */}
        {isMobileDrawer && (
          <button
            onClick={() => setIsMobileNavOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Desktop Collapse Toggle Button */}
        {!isMobileDrawer && (
          <button
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            className={`hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer ${
              isSidebarCollapsed ? 'absolute -right-3.5 top-5 bg-white border border-slate-200 shadow-sm z-20' : ''
            }`}
            title={isSidebarCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className={`px-2 pb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase ${isSidebarCollapsed && !isMobileDrawer ? 'hidden' : 'block'}`}>
          Menu Utama
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-nav-${item.id}`}
              onClick={() => handleNavClick(item.id)}
              title={item.label}
              className={`w-full flex items-center rounded-xl transition-all duration-150 cursor-pointer ${
                isSidebarCollapsed && !isMobileDrawer
                  ? 'justify-center p-3'
                  : 'px-3.5 py-2.5 space-x-3 text-sm font-medium'
              } ${
                isActive
                  ? 'bg-teal-50 text-teal-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-teal-600' : 'text-slate-400'
                }`}
              />
              {(!isSidebarCollapsed || isMobileDrawer) && (
                <span className="flex-1 text-left">{item.label}</span>
              )}
              {item.badge !== undefined && (
                <span
                  className={`rounded-full bg-red-500 text-white font-bold shrink-0 ${
                    isSidebarCollapsed && !isMobileDrawer
                      ? 'absolute top-1 right-1 w-2 h-2 p-0'
                      : 'px-2 py-0.5 text-[10px]'
                  }`}
                >
                  {isSidebarCollapsed && !isMobileDrawer ? '' : item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Footer Profile with Dropdown */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/80 relative" ref={profileRef}>
        {/* Profile Trigger Button */}
        <button
          id="sidebar-profile-menu-btn"
          onClick={() => setIsProfileMenuOpen((prev) => !prev)}
          className={`w-full flex items-center rounded-xl transition-all duration-150 cursor-pointer border ${
            activeTab === 'settings'
              ? 'bg-teal-50 border-teal-200 text-teal-800'
              : 'border-transparent hover:bg-white hover:border-slate-200 text-slate-800'
          } ${
            isSidebarCollapsed && !isMobileDrawer
              ? 'justify-center p-2'
              : 'px-2.5 py-2 space-x-2.5'
          }`}
          aria-expanded={isProfileMenuOpen}
          title="Profil & Akun Kasir"
        >
          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-bold flex items-center justify-center text-xs shrink-0 border border-teal-200">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>

          {(!isSidebarCollapsed || isMobileDrawer) && (
            <>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
                  {user?.name || 'Kasir Warung'}
                </p>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className="text-[10px] font-mono text-slate-500 truncate">
                    @{user?.username || user?.email?.split('@')[0] || 'user'}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-teal-50 text-teal-700 font-medium border border-teal-200 shrink-0">
                    {currentUserRole?.name || 'Owner'}
                  </span>
                </div>
              </div>
              <ChevronUp
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                  isProfileMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </>
          )}
        </button>

        {/* Profile Dropdown Popup Menu */}
        {isProfileMenuOpen && (
          <div
            className={`bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in duration-150 ${
              isSidebarCollapsed && !isMobileDrawer
                ? 'absolute bottom-2 left-full ml-3 w-56'
                : 'absolute bottom-full left-2 right-2 mb-2'
            }`}
          >
            <div className="px-3.5 py-2.5 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-900 truncate">
                {user?.name || 'Kasir Warung'}
              </p>
              <p className="text-[11px] font-mono text-slate-500 truncate">
                @{user?.username || user?.email?.split('@')[0] || 'user'}
              </p>
              <div className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full w-fit border border-teal-200">
                <Shield className="w-3 h-3" />
                <span>Role: {currentUserRole?.name || 'Owner / Admin'}</span>
              </div>
            </div>

            {hasPermission('settings', 'view') && (
              <button
                id="sidebar-profile-settings-btn"
                onClick={handleProfileSettingsClick}
                className={`w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-teal-50 text-teal-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Pengaturan & Lisensi</span>
              </button>
            )}

            <div className="px-3.5 py-2 flex items-center justify-between text-xs text-slate-600 bg-slate-50/70 rounded-lg mx-2 my-1 border border-slate-100">
              <span className="text-[11px] text-slate-500 font-medium">Sistem:</span>
              <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                Dedicated Enterprise
              </span>
            </div>

            <div className="border-t border-slate-100 my-1"></div>

            <button
              id="sidebar-logout-btn"
              onClick={handleLogoutClick}
              className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span>Keluar / Ganti Akun</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // If mobile drawer mode, wrap in backdrop overlay
  if (isMobileDrawer) {
    if (!isMobileNavOpen) return null;
    return (
      <div className="fixed inset-0 z-50 lg:hidden animate-in fade-in duration-200">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
          onClick={() => setIsMobileNavOpen(false)}
        />
        {/* Slide-out drawer panel */}
        <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl z-50 transform transition-transform ease-in-out duration-200">
          {sidebarContent}
        </div>
      </div>
    );
  }

  // Desktop persistent sidebar
  return (
    <aside
      className={`hidden lg:block shrink-0 sticky top-0 h-screen transition-all duration-200 z-30 ${
        isSidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {sidebarContent}
    </aside>
  );
}
