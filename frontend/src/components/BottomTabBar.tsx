'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Home, Grid3X3, User } from 'lucide-react';
import { Suspense } from 'react';

const tabs = [
  { href: '/', label: '首页', icon: Home, match: 'home' },
  { href: '/?list=true', label: '分类', icon: Grid3X3, match: 'list' },
  { href: '/profile', label: '我的', icon: User, match: 'profile' },
];

function BottomTabBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isActive = (tab: typeof tabs[0]) => {
    if (tab.match === 'home') {
      return pathname === '/' && !searchParams.has('list');
    }
    if (tab.match === 'list') {
      return pathname === '/' && searchParams.has('list');
    }
    return pathname.startsWith(tab.href.split('?')[0]);
  };

  const isClipFlow = pathname === '/' && !searchParams.has('list');
  if (isClipFlow) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-drama-bg/95 backdrop-blur-lg border-t border-drama-border/50">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab);
          return (
            <Link
              key={tab.match}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                active ? 'text-primary-500' : 'text-drama-muted hover:text-drama-text'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function BottomTabBar() {
  return (
    <Suspense fallback={null}>
      <BottomTabBarInner />
    </Suspense>
  );
}
