import React, { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { router } from './routes';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
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

const FullPageLoader = () => (
  <div className="flex items-center justify-center h-screen bg-background">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p className="mt-4 text-slate-500">Uygulama yükleniyor...</p>
    </div>
  </div>
);

export default function App() {
  const { token, clearUser } = useAuthStore();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      if (token) {
        try {
          // validateSession via new API layer
          await window.api.auth.validate(token);
        } catch (error) {
          console.error('Session validation failed:', error);
          clearUser();
        }
      }
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, [token, clearUser]);

  if (isCheckingAuth) {
    return <FullPageLoader />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </QueryClientProvider>
  );
}