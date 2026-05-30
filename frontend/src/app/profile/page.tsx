'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Coins,
  Bookmark,
  Egg,
  Clock,
  LogOut,
  LogIn,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth';
import { getMe, getPointsBalance } from '@/lib/api-client';

export default function ProfilePage() {
  const router = useRouter();
  const { isLoggedIn, user, logout, setUser } = useAuthStore();
  const [points, setPoints] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    async function fetchUserData() {
      try {
        if (!user) {
          const me = await getMe();
          setUser(me);
        }
        const balance = await getPointsBalance();
        setPoints(balance);
      } catch {
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [isLoggedIn, user, setUser]);

  function handleLogout() {
    logout();
    router.push('/');
  }

  if (!mounted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="animate-pulse bg-drama-card rounded-2xl h-48 mb-6" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <User className="w-16 h-16 text-drama-muted mx-auto mb-4" />
        <h2 className="text-xl font-medium text-drama-text mb-2">请先登录</h2>
        <p className="text-drama-muted mb-6">登录后查看个人中心</p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:from-primary-600 hover:to-primary-700 transition-all"
        >
          <LogIn className="w-4 h-4" />
          去登录
        </Link>
      </div>
    );
  }

  const menuItems = [
    {
      icon: Bookmark,
      label: '我的追剧',
      href: '/profile/favorites',
      color: 'text-blue-400',
    },
    {
      icon: Egg,
      label: '彩蛋图鉴',
      href: '/eggs',
      color: 'text-primary-400',
    },
    {
      icon: Clock,
      label: '观看历史',
      href: '/profile/history',
      color: 'text-green-400',
    },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {loading ? (
        <div className="animate-pulse bg-drama-card rounded-2xl h-48" />
      ) : (
        <div className="bg-drama-card rounded-2xl p-6 border border-drama-border/50">
          <div className="flex items-center gap-4">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.nickname}
                className="w-16 h-16 rounded-full object-cover border-2 border-primary-500/30"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center border-2 border-primary-500/30">
                <User className="w-8 h-8 text-primary-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-medium text-drama-text truncate">
                {user?.nickname || '用户'}
              </h2>
              <p className="text-sm text-drama-muted">@{user?.username}</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-drama-border/50">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-400" />
              <span className="text-sm text-drama-muted">积分余额</span>
              <span className="ml-auto text-lg font-bold text-amber-400">
                {points !== null ? points : '--'}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-drama-card rounded-2xl border border-drama-border/50 overflow-hidden">
        {menuItems.map((item, index) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-4 px-6 py-4 hover:bg-drama-surface transition-colors ${
              index < menuItems.length - 1 ? 'border-b border-drama-border/30' : ''
            }`}
          >
            <item.icon className={`w-5 h-5 ${item.color}`} />
            <span className="text-drama-text">{item.label}</span>
            <svg
              className="w-4 h-4 text-drama-muted ml-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>

      <button
        onClick={handleLogout}
        className="w-full py-3 bg-drama-card border border-drama-border/50 rounded-2xl text-red-400 font-medium hover:bg-red-500/10 hover:border-red-500/20 transition-all flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        退出登录
      </button>
    </div>
  );
}
