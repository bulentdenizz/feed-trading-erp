import { lazy, Suspense } from 'react';
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
  <div className="flex-1 flex flex-col px-8 py-6 bg-background min-h-screen no-scrollbar">
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-1">{name}</h1>
        <p className="text-sm font-medium text-muted-foreground">Bu sayfa henüz geliştirme aşamasındadır</p>
      </div>
    </div>
    
    <div className="flex-1 flex flex-col items-center justify-center bg-card border border-border/60 rounded-2xl shadow-sm p-12">
      <div className="w-20 h-20 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center mb-6 shadow-inner">
        <span className="text-4xl">🏗️</span>
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">Çalışmalar Devam Ediyor</h2>
      <p className="text-muted-foreground text-center max-w-sm mb-8 font-medium">
        {name} modülü şu anda geliştiriliyor. En kısa sürede tüm özellikleri ile hizmetinizde olacak.
      </p>
      <div className="flex gap-3">
        <div className="px-4 py-2 bg-muted/50 rounded-xl text-xs font-semibold text-muted-foreground uppercase tracking-wider">v1.2.0-beta</div>
      </div>
    </div>
  </div>
);

// Stub pages for routing
const CustomersPage = lazy(() => import('../features/customers/CustomersPage'));
const SuppliersPage = lazy(() => import('../features/suppliers/SuppliersPage'));
const InventoryPage = lazy(() => import('../features/inventory/InventoryPage'));
const SalesPage = lazy(() => import('../features/sales/SalesPage'));
const PurchasesPage = lazy(() => import('../features/purchases/PurchasesPage'));
const PaymentsPage = lazy(() => import('../features/payments/PaymentsPage'));
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
