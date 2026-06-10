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
  Award,
  Pencil,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth';
import { getMe, getPointsBalance } from '@/lib/api-client';

export default function ProfilePage() {
  const router = useRouter();
  const { isLoggedIn, user, logout, setUser } = useAuthStore();
  const [points, setPoints] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
        setPoints(balance?.points ?? balance ?? 0);
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
        <div className="animate-pulse bg-drama-card rounded-lg h-48 mb-6" />
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
      icon: Award,
      label: '我的勋章',
      href: '/profile/medals',
      color: 'text-amber-400',
    },
    {
      icon: Egg,
      label: '彩蛋图鉴',
      href: '/eggs',
      color: 'text-accent-400',
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
        <div className="animate-pulse bg-drama-card rounded-lg h-48" />
      ) : (
        <div className="bg-drama-card rounded-lg p-6 border border-drama-border/50">
          <div className="flex items-center gap-4">
            <div className="relative inline-block">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.nickname}
                  className="w-16 h-16 rounded-full object-cover border-2 border-primary-500/20"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary-500/10 flex items-center justify-center border-2 border-primary-500/20">
                  <User className="w-8 h-8 text-primary-500" />
                </div>
              )}
              <Link
                href="/profile/edit"
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center text-white"
              >
                <Pencil className="w-3 h-3" />
              </Link>
            </div>
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
              <Link href="/profile/points" className="text-xs text-primary-400 hover:text-primary-300 ml-2">
                查看详情 →
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="bg-drama-card rounded-lg border border-drama-border/50 overflow-hidden">
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
        onClick={() => setShowLogoutConfirm(true)}
        className="w-full py-3 bg-drama-card border border-drama-border/50 rounded-lg text-red-400 font-medium hover:bg-red-500/10 hover:border-red-500/20 transition-all flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        退出登录
      </button>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowLogoutConfirm(false)}>
          <div className="bg-drama-card rounded-xl p-6 mx-4 max-w-sm w-full border border-drama-border/50 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-drama-text text-center mb-2">确认退出登录？</h3>
            <p className="text-sm text-drama-muted text-center mb-6">退出后需要重新登录才能使用个人功能</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 bg-drama-surface text-drama-text rounded-lg text-sm font-medium hover:bg-drama-border/50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => { logout(); router.push('/'); }}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
