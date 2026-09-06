'use client';

import React, { useSyncExternalStore } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { AuthView } from '@/components/AuthView';
import { OnboardingView } from '@/components/OnboardingView';
import { DashboardView } from '@/components/DashboardView';
import { ProductsView } from '@/components/ProductsView';
import { InventarisView } from '@/components/InventarisView';
import { OrdersView } from '@/components/OrdersView';
import { FinanceView } from '@/components/FinanceView';
import { BranchManagementView } from '@/components/BranchManagementView';
import { SettingsView } from '@/components/SettingsView';
import { PerangkatKasirView } from '@/components/PerangkatKasirView';
import { UserManagementView } from '@/components/UserManagementView';
import { OmnichannelView } from '@/components/OmnichannelView';
import { CreateOrderModal } from '@/components/CreateOrderModal';
import { RestockModal } from '@/components/RestockModal';

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
    hasCompletedOnboarding,
    activeTab,
    isCreateOrderModalOpen,
    restockModalProductId,
  } = useApp();

  // 1. Auth Check (Login / Register view)
  if (!isAuthenticated) {
    return <AuthView />;
  }

  // 2. Onboarding Flow Check (3-step initial setup)
  if (!hasCompletedOnboarding) {
    return <OnboardingView />;
  }

  // 3. Authenticated App Layout (Left Sidebar + Main Content + Topbar)
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
          {activeTab === 'orders' && <OrdersView />}
          {activeTab === 'products' && <ProductsView />}
          {(activeTab === 'inventory' || activeTab === 'stock_opname') && <InventarisView />}
          {activeTab === 'finance' && <FinanceView />}
          {activeTab === 'branches' && <BranchManagementView />}
          {activeTab === 'perangkat_kasir' && <PerangkatKasirView />}
          {activeTab === 'integrasi_channel' && <OmnichannelView />}
          {activeTab === 'users' && <UserManagementView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Action Modals */}
      {isCreateOrderModalOpen && <CreateOrderModal />}
      {restockModalProductId && <RestockModal />}
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
