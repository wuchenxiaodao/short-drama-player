'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import ClipFlow from '@/components/clip/ClipFlow';
import DramaListPage from '@/components/DramaListPage';

function HomeContent() {
  const searchParams = useSearchParams();
  const showList = searchParams.has('list');

  if (showList) return <DramaListPage />;
  return <ClipFlow />;
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="h-screen bg-black" />}>
      <HomeContent />
    </Suspense>
  );
}
