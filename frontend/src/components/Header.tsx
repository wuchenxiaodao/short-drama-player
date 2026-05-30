'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/lib/auth';

const navLinks = [
  { href: '/', label: '首页' },
  { href: '/search', label: '搜索' },
  { href: '/eggs', label: '彩蛋图鉴' },
];

export default function Header() {
  const pathname = usePathname();
  const { isLoggedIn, user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  function handleLogout() {
    logout();
    setUserMenuOpen(false);
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-drama-bg/80 backdrop-blur-lg border-b border-drama-border/50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent"
          >
            短剧TV
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors ${
                  pathname === link.href
                    ? 'text-primary-400 font-medium'
                    : 'text-drama-muted hover:text-drama-text'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {mounted && (
            <>
              {isLoggedIn ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.nickname}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary-400" />
                      </div>
                    )}
                    <ChevronDown
                      className={`w-4 h-4 text-drama-muted transition-transform ${
                        userMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-40 bg-drama-card border border-drama-border rounded-lg shadow-xl py-1 animate-in fade-in slide-in-from-top-1">
                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-drama-text hover:bg-drama-surface transition-colors"
                      >
                        <User className="w-4 h-4" />
                        个人中心
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-drama-text hover:bg-drama-surface transition-colors w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        退出
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="px-4 py-1.5 text-sm bg-primary-500 hover:bg-primary-600 text-white rounded-full transition-colors"
                >
                  登录
                </Link>
              )}
            </>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-drama-muted hover:text-drama-text"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-drama-border/50 bg-drama-bg/95 backdrop-blur-lg">
          <nav className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                  pathname === link.href
                    ? 'text-primary-400 bg-primary-500/10 font-medium'
                    : 'text-drama-muted hover:text-drama-text hover:bg-drama-surface'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {mounted && !isLoggedIn && (
              <Link
                href="/login"
                className="block px-3 py-2 rounded-lg text-sm text-primary-400 hover:bg-drama-surface transition-colors"
              >
                登录
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
