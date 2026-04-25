import React, { lazy, Suspense } from 'react';
import { createHashRouter, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { PageLoader } from '../components/shared/PageLoader';

// Auth & Dashboard (Migrated)
const LoginPage = lazy(() => import('../features/auth/LoginPage'));
const DashboardPage = lazy(() => import('../features/dashboard/DashboardPage'));

// Generic fallback for unmigrated features
const fallbackComponent = (name: string) => () => (
  <div className="flex-1 flex flex-col items-center justify-center h-full gap-3 text-muted-foreground bg-background min-h-[80vh]">
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

// Stub pages for routing
const CustomersPage = lazy(() => Promise.resolve({ default: fallbackComponent('Müşteriler') }));
const SuppliersPage = lazy(() => Promise.resolve({ default: fallbackComponent('Tedarikçiler') }));
const InventoryPage = lazy(() => Promise.resolve({ default: fallbackComponent('Stok Yönetimi') }));
const SalesPage = lazy(() => Promise.resolve({ default: fallbackComponent('Satışlar') }));
const PurchasesPage = lazy(() => Promise.resolve({ default: fallbackComponent('Alışlar') }));
const PaymentsPage = lazy(() => Promise.resolve({ default: fallbackComponent('Ödemeler') }));
const ReportsPage = lazy(() => Promise.resolve({ default: fallbackComponent('Raporlar') }));
const SettingsPage = lazy(() => Promise.resolve({ default: fallbackComponent('Ayarlar') }));

export const router = createHashRouter([
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <Suspense fallback={<PageLoader />}><LoginPage /></Suspense> },
    ],
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Suspense fallback={<PageLoader />}><DashboardPage /></Suspense> },
      { path: 'customers', element: <Suspense fallback={<PageLoader />}><CustomersPage /></Suspense> },
      { path: 'suppliers', element: <Suspense fallback={<PageLoader />}><SuppliersPage /></Suspense> },
      { path: 'inventory', element: <Suspense fallback={<PageLoader />}><InventoryPage /></Suspense> },
      { path: 'sales', element: <Suspense fallback={<PageLoader />}><SalesPage /></Suspense> },
      { path: 'purchases', element: <Suspense fallback={<PageLoader />}><PurchasesPage /></Suspense> },
      { path: 'payments', element: <Suspense fallback={<PageLoader />}><PaymentsPage /></Suspense> },
      { path: 'reports', element: <Suspense fallback={<PageLoader />}><ReportsPage /></Suspense> },
      { path: 'settings', element: <Suspense fallback={<PageLoader />}><SettingsPage /></Suspense> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
