import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import AuthInitializer from '@/components/AuthInitializer';
import BottomTabBar from '@/components/BottomTabBar';
import GlobalToast from '@/components/GlobalToast';
import ErrorBoundary from '@/components/ErrorBoundary';

export const metadata: Metadata = {
  title: '短剧TV - 精彩短剧在线看',
  description: '中文短剧播放平台，海量短剧随心看',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="min-h-screen bg-drama-bg text-drama-text antialiased">
        <AuthInitializer />
        <Header />
        <ErrorBoundary>
        <main className="pt-16 pb-14 md:pb-0">{children}</main>
        </ErrorBoundary>
        <BottomTabBar />
        <GlobalToast />
      </body>
    </html>
  );
}
