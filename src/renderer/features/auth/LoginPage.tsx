import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import '../../styles/theme.css';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      // Error is already set in the store
      console.error('Login error:', err);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-card border border-border/60 rounded-2xl shadow-2xl p-8 backdrop-blur-sm">
        <div className="mb-10">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <div className="w-8 h-8 bg-primary rounded-lg shadow-lg shadow-primary/30" />
          </div>
          <h1 className="text-3xl font-bold text-center tracking-tight text-foreground mb-2">ERP Sistemi</h1>
          <p className="text-center text-muted-foreground font-medium">Hesabınıza giriş yapın</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 ml-1">
              Kullanıcı Adı
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              className="w-full px-4 py-3 bg-muted/30 border border-border/60 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-sm font-medium"
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 ml-1">
              Şifre
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-muted/30 border border-border/60 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-sm font-medium"
              disabled={isLoading}
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm font-medium border border-red-100 dark:border-red-900 animate-pulse">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
          >
            {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-border/40 text-center">
          <p className="text-xs text-muted-foreground font-medium">
            Test hesabı: <span className="text-foreground">admin / admin</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
