import React, { useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import './styles/theme.css';

export default function App() {
  const { isAuthenticated, token } = useAuthStore();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated (e.g., from session)
    const checkAuth = async () => {
      if (token) {
        try {
          await (window as any).auth.validateSession();
        } catch (error) {
          console.error('Session validation failed:', error);
          useAuthStore.getState().clearUser();
        }
      }
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, [token]);

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <DashboardPage /> : <LoginPage />;
}