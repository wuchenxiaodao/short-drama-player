'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import ClipFlow from '@/components/clip/ClipFlow';
import DramaListPage from '@/components/DramaListPage';

function HomeContent() {
  const searchParams = useSearchParams();
  const showList = searchParams.has('list');

  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const shown = localStorage.getItem('guide-shown');
    if (!shown) setShowGuide(true);
  }, []);

  if (showList) return <DramaListPage />;
  return (
    <>
      <ClipFlow />
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-drama-card rounded-xl p-6 mx-4 max-w-sm w-full border border-drama-border/50 shadow-xl">
            <h3 className="text-lg font-medium text-drama-text mb-3">欢迎使用短剧TV</h3>
            <div className="space-y-3 text-sm text-drama-muted">
              <p>🎬 浏览推荐短剧，点击即可观看</p>
              <p>🎮 观看中可参与互动选择，影响剧情走向</p>
              <p>🥚 探索隐藏彩蛋，收集勋章赢积分</p>
              <p>💬 发送弹幕，与其他观众实时互动</p>
            </div>
            <button
              onClick={() => { setShowGuide(false); localStorage.setItem('guide-shown', 'true'); }}
              className="w-full mt-5 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              开始体验
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="h-screen bg-drama-bg flex items-center justify-center">
  <div className="text-center">
    <div className="w-10 h-10 border-[3px] border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto" />
    <p className="text-drama-muted text-sm mt-3">加载中...</p>
  </div>
</div>}>
      <HomeContent />
    </Suspense>
  );
}
