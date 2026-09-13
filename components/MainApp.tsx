'use client';

import React, { useSyncExternalStore, useEffect, useRef } from 'react';
import { AppModule } from '@/types';
import { AppProvider, useApp } from '@/context/AppContext';
import { getFirstPermittedTab, getRoleDefaultLandingTab } from '@/lib/rbac';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { AuthView } from '@/components/AuthView';
import { DashboardView } from '@/components/DashboardView';
import { OwnerMobileMonitor } from '@/components/OwnerMobileMonitor';
import { ProductsView } from '@/components/ProductsView';
import { PromotionsView } from '@/components/PromotionsView';
import { InventarisView } from '@/components/InventarisView';
import { OrdersView } from '@/components/OrdersView';
import { FinanceView } from '@/components/FinanceView';
import { BranchManagementView } from '@/components/BranchManagementView';
import { SettingsView } from '@/components/SettingsView';
import { PerangkatKasirView } from '@/components/PerangkatKasirView';
import { UserManagementView } from '@/components/UserManagementView';
import { OmnichannelView } from '@/components/OmnichannelView';
import { ExportDataView } from '@/components/ExportDataView';
import { CreateOrderModal } from '@/components/CreateOrderModal';
import { RestockModal } from '@/components/RestockModal';
import { CashierShiftModal } from '@/components/CashierShiftModal';
import { ZReportReceiptModal } from '@/components/ZReportReceiptModal';

const emptySubscribe = () => () => {};

function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function MainAppContent() {
  const {
    isAuthenticated,
    activeTab,
    setActiveTab,
    currentUserRole,
    hasPermission,
    isCreateOrderModalOpen,
    restockModalProductId,
    isShiftModalOpen,
    selectedShiftForZReport,
  } = useApp();

  // Role-based landing & permission safeguard
  const lastUserRoleRef = useRef<string | null>(null);
  const initialMobileCheckDoneRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isAuthenticated || !currentUserRole) return;

    const userRoleKey = `${currentUserRole.id}`;
    // When the active user's role initializes or switches, forcibly land on their designated module
    if (lastUserRoleRef.current !== userRoleKey) {
      lastUserRoleRef.current = userRoleKey;
      let targetLanding = getRoleDefaultLandingTab(currentUserRole.id, currentUserRole);

      // Mobile Device Detection: If accessed via smartphone/tablet (< 768px or mobile UA) and user has dashboard view (e.g. Owner/Admin),
      // default landing directly to 'owner_monitor'
      const isMobileDevice = typeof window !== 'undefined' && (
        window.innerWidth < 768 ||
        /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
      );

      if (isMobileDevice && targetLanding === 'dashboard' && hasPermission('dashboard', 'view')) {
        targetLanding = 'owner_monitor';
      }

      const isTargetPermitted = targetLanding === 'owner_monitor'
        ? hasPermission('dashboard', 'view')
        : hasPermission(targetLanding as AppModule, 'view');
      if (isTargetPermitted) {
        setActiveTab(targetLanding);
        return;
      }
      const fallback = getFirstPermittedTab(currentUserRole);
      setActiveTab(fallback);
      return;
    }

    // Secondary safeguard: on initial session mount, if user is already authenticated on mobile and on dashboard, redirect to owner_monitor
    if (!initialMobileCheckDoneRef.current) {
      initialMobileCheckDoneRef.current = true;
      const isMobileDevice = typeof window !== 'undefined' && (
        window.innerWidth < 768 ||
        /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
      );
      if (isMobileDevice && activeTab === 'dashboard' && hasPermission('dashboard', 'view')) {
        setActiveTab('owner_monitor');
        return;
      }
    }

    // Permission safeguard: if user attempts to view an unauthorized tab, bounce immediately
    const isAuthorized = activeTab === 'owner_monitor'
      ? hasPermission('dashboard', 'view')
      : hasPermission(activeTab as AppModule, 'view');

    if (!isAuthorized) {
      const fallback = getFirstPermittedTab(currentUserRole);
      if (fallback && fallback !== activeTab) {
        setActiveTab(fallback);
      }
    }
  }, [isAuthenticated, currentUserRole, activeTab, hasPermission, setActiveTab]);

  // 1. Auth Check (Internal Login view)
  if (!isAuthenticated) {
    return <AuthView />;
  }

  // 2. Authenticated App Layout (Left Sidebar + Main Content + Topbar)
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex selection:bg-teal-500/20 selection:text-teal-900">
      {/* Persistent Left Sidebar for Desktop */}
      <Sidebar isMobileDrawer={false} />

      {/* Slide-out Navigation Drawer for Mobile */}
      <Sidebar isMobileDrawer={true} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header Bar */}
        <Topbar />

        {/* Dynamic Page Views */}
        <main className="flex-1 w-full px-3 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'owner_monitor' && <OwnerMobileMonitor />}
          {activeTab === 'orders' && <OrdersView />}
          {activeTab === 'products' && <ProductsView />}
          {activeTab === 'promotions' && <PromotionsView />}
          {(activeTab === 'inventory' || activeTab === 'stock_opname') && <InventarisView />}
          {activeTab === 'finance' && <FinanceView />}
          {activeTab === 'branches' && <BranchManagementView />}
          {activeTab === 'perangkat_kasir' && <PerangkatKasirView />}
          {activeTab === 'integrasi_channel' && <OmnichannelView />}
          {activeTab === 'export_data' && <ExportDataView />}
          {activeTab === 'users' && <UserManagementView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Action Modals */}
      {isCreateOrderModalOpen && <CreateOrderModal />}
      {restockModalProductId && <RestockModal />}
      {isShiftModalOpen && <CashierShiftModal />}
      {selectedShiftForZReport && <ZReportReceiptModal />}
    </div>
  );
}

export function MainApp() {
  const isClient = useIsClient();

  if (!isClient) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
