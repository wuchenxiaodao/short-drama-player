'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/auth';

/**
 * 全局 Auth 初始化组件
 * 在应用启动时检查 token 有效性并获取用户信息
 */
export default function AuthInitializer() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const fetchUser = useAuthStore((s) => s.fetchUser);

  useEffect(() => {
    if (isLoggedIn) {
      fetchUser();
    }
  }, []); // 仅在挂载时执行一次

  return null;
}
