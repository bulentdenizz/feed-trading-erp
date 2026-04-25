import React, { lazy, Suspense } from 'react';

// Lazy load components to keep bundle size small and load pages on demand
export const DashboardPage = lazy(() => import('./DashboardPage').catch(() => {
  return { default: () => <div className="p-8">Sayfa yüklenemedi. (DashboardPage)</div> }
}));

export const LoginPage = lazy(() => import('./LoginPage').catch(() => {
  return { default: () => <div className="p-8">Sayfa yüklenemedi. (LoginPage)</div> }
}));

// Provide minimal fallback components for not-yet-created pages
const fallbackComponent = (name: string) => () => (
  <div className="flex-1 flex flex-col items-center justify-center h-full gap-3 text-muted-foreground bg-background">
    <div className="text-center mb-6 w-full px-6">
      <h1 className="text-3xl font-bold text-foreground text-left">{name}</h1>
    </div>
    <div className="flex-1 flex flex-col items-center justify-center gap-3">
      <div className="w-12 h-12 rounded-xl border border-border flex items-center justify-center">
        <span className="text-2xl">🚧</span>
      </div>
      <p className="text-sm">Sayfa içeriği yakında eklenecek...</p>
    </div>
  </div>
);

export const CustomersPage = lazy(() => import('./CustomersPage').catch(() => {
  return { default: fallbackComponent('Müşteriler') }
}));

export const SuppliersPage = lazy(() => import('./SuppliersPage').catch(() => {
  return { default: fallbackComponent('Tedarikçiler') }
}));

export const InventoryPage = lazy(() => import('./InventoryPage').catch(() => {
  return { default: fallbackComponent('Stok Yönetimi') }
}));

export const SalesPage = lazy(() => import('./SalesPage').catch(() => {
  return { default: fallbackComponent('Satışlar') }
}));

export const PurchasesPage = lazy(() => import('./PurchasesPage').catch(() => {
  return { default: fallbackComponent('Alışlar') }
}));

export const PaymentsPage = lazy(() => import('./PaymentsPage').catch(() => {
  return { default: fallbackComponent('Ödemeler') }
}));

export const ReportsPage = lazy(() => import('./ReportsPage').catch(() => {
  return { default: fallbackComponent('Raporlar') }
}));

export const SettingsPage = lazy(() => import('./SettingsPage').catch(() => {
  return { default: fallbackComponent('Ayarlar') }
}));
