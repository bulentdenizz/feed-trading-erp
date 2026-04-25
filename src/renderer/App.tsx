import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import Sidebar, { Page } from './components/layout/Sidebar';
import {
  LoginPage,
  DashboardPage,
  CustomersPage,
  SuppliersPage,
  InventoryPage,
  SalesPage,
  PurchasesPage,
  PaymentsPage,
  ReportsPage,
  SettingsPage
} from './pages';
import './styles/theme.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

const PageLoader = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

export default function App() {
  const { isAuthenticated, token } = useAuthStore();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  useEffect(() => {
    // Check if user is already authenticated (e.g., from session)
    const checkAuth = async () => {
      if (token) {
        try {
          // validateSession in new API layer
          await window.api.auth.validate();
        } catch (error) {
          console.error('Session validation failed:', error);
          useAuthStore.getState().clearUser();
        }
      }
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, [token]);

  const renderPage = useMemo(() => {
    return (page: Page) => {
      switch (page) {
        case 'dashboard': return <DashboardPage />;
        case 'customers': return <CustomersPage />;
        case 'suppliers': return <SuppliersPage />;
        case 'inventory': return <InventoryPage />;
        case 'sales':     return <SalesPage />;
        case 'purchases': return <PurchasesPage />;
        case 'payments':  return <PaymentsPage />;
        case 'reports':   return <ReportsPage />;
        case 'settings':  return <SettingsPage />;
        default:          return <DashboardPage />;
      }
    };
  }, []);

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-slate-500">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {!isAuthenticated ? (
        <Suspense fallback={<PageLoader />}>
          <LoginPage />
        </Suspense>
      ) : (
        <div className="flex h-screen bg-background overflow-hidden text-slate-900">
          <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
          
          <main className="flex-1 overflow-auto bg-background">
            <Suspense fallback={<PageLoader />}>
              {renderPage(currentPage)}
            </Suspense>
          </main>
        </div>
      )}
    </QueryClientProvider>
  );
}