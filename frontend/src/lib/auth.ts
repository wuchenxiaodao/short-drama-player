import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from './types';

interface AuthState {
  token: string | null;
  userId: number | null;
  user: User | null;
  isLoggedIn: boolean;
  setAuth: (token: string, userId: number) => void;
  setUser: (user: User) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      userId: null,
      user: null,
      isLoggedIn: false,

      setAuth: (token: string, userId: number) => {
        set({ token, userId, isLoggedIn: true });
      },

      setUser: (user: User) => {
        set({ user });
      },

      logout: () => {
        set({ token: null, userId: null, user: null, isLoggedIn: false });
      },

      loadFromStorage: () => {
        const state = get();
        if (state.token && state.userId) {
          set({ isLoggedIn: true });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        userId: state.userId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token && state?.userId) {
          state.isLoggedIn = true;
        }
      },
    }
  )
);
