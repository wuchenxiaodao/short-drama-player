import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';

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
        <Header />
        <main className="pt-16">{children}</main>
      </body>
    </html>
  );
}
