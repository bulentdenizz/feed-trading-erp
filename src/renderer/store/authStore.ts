import { create } from 'zustand';

export interface AuthState {
  userId: number | null;
  username: string | null;
  role: 'admin' | 'staff' | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  // Actions
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (userId: number, username: string, role: 'admin' | 'staff', token: string) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  username: null,
  role: null,
  token: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      // Call IPC to authenticate
      const result = await (window as any).auth.login(username, password);

      if (result) {
        set({
          userId: result.userId,
          username: result.username,
          role: result.role,
          token: result.token,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({
        error: message,
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = useAuthStore.getState().token;
      if (!token) {
        throw new Error('No token found');
      }
      // Call IPC to logout
      await (window as any).auth.logout(token);
      set({
        userId: null,
        username: null,
        role: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Logout failed';
      set({
        error: message,
        isLoading: false,
      });
      throw error;
    }
  },

  setUser: (userId: number, username: string, role: 'admin' | 'staff', token: string) => {
    set({
      userId,
      username,
      role,
      token,
      isAuthenticated: true,
    });
  },

  clearUser: () => {
    set({
      userId: null,
      username: null,
      role: null,
      token: null,
      isAuthenticated: false,
    });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));
