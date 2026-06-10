import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from './types';
import { getMe } from './api-client';

interface AuthState {
  token: string | null;
  userId: number | null;
  user: User | null;
  isLoggedIn: boolean;
  setAuth: (token: string, userId: number) => void;
  setUser: (user: User) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
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
        // 登录后自动获取用户信息
        get().fetchUser();
      },

      setUser: (user: User) => {
        set({ user });
      },

      logout: () => {
        set({ token: null, userId: null, user: null, isLoggedIn: false });
      },

      fetchUser: async () => {
        try {
          const user = await getMe();
          if (user) set({ user });
        } catch {
          // token 无效则登出
          set({ token: null, userId: null, user: null, isLoggedIn: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        userId: state.userId,
      }),
      onRehydrateStorage: () => {
        // 返回一个函数，在 rehydration 完成后执行
        return (state) => {
          if (state?.token && state?.userId) {
            state.isLoggedIn = true;
            // 延迟获取用户信息，确保 store 已完全初始化
            setTimeout(() => {
              useAuthStore.getState().fetchUser();
            }, 100);
          }
        };
      },
    }
  )
);
