# 用户体验优化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 逐个解决47个用户体验问题，从P0核心缺失到P3锦上添花，使短剧互动播放器达到主流App体验水平。

**Architecture:** 前端 Next.js 14 App Router + Tailwind CSS，后端 Spring Boot REST API。优化主要集中在前端组件层，不涉及后端改动（除非明确标注需要后端配合）。

**Tech Stack:** React 18, Next.js 14, Tailwind CSS, zustand, TypeScript

---

## 当前状态分析

- 前端已有完整的页面结构（首页/详情/播放/搜索/个人中心等）
- 后端API基本完整，前端已对接大部分接口
- 上一轮已修复18个功能Bug（API路径、返回格式、定时器等）
- 核心体验缺失：短视频流不自动播放、无底部导航、弹幕性能差、互动无法跳过、移动端手势缺失等

---

## Task 1: ClipCard 自动播放 + 播完自动切换

**Files:**
- Modify: `frontend/src/components/clip/ClipCard.tsx:37-46` (isActive useEffect)
- Modify: `frontend/src/components/clip/ClipFlow.tsx:59-69` (showClip + 切换逻辑)

- [ ] **Step 1: 修改 ClipCard — isActive 时自动播放**

在 `ClipCard.tsx` 的 `useEffect` 中，当 `isActive=true` 时，设置 `video.currentTime = start` 后自动调用 `video.play()`：

```tsx
// ClipCard.tsx 第37-46行，替换现有 useEffect
useEffect(() => {
  const video = videoRef.current;
  if (!video) return;
  if (isActive) {
    video.currentTime = clip.startTime;
    video.play().catch(() => {});
  } else {
    video.pause();
  }
}, [isActive, clip.startTime]);
```

- [ ] **Step 2: 修改 ClipCard — 播放到 endTime 时通知父组件切换**

添加 `onEnded` 回调 prop：

```tsx
// ClipCardProps 增加
interface ClipCardProps {
  clip: HighlightClip;
  isActive: boolean;
  onWatchFull?: (clip: HighlightClip) => void;
  onClipEnded?: () => void;  // 新增
}

// handleTimeUpdate 中，当 progress >= 100 时
if (video.currentTime >= clip.endTime) {
  video.pause();
  onClipEnded?.();
  return;
}
```

- [ ] **Step 3: 修改 ClipFlow — 接收 onClipEnded 自动切换下一条**

```tsx
// ClipFlow.tsx 渲染 ClipCard 时
<ClipCard
  key={clip.id}
  clip={clip}
  isActive={index === currentIndex}
  onWatchFull={handleWatchFull}
  onClipEnded={() => {
    if (currentIndex < clips.length - 1) {
      showClip(currentIndex + 1);
    } else if (hasMore) {
      loadClips();
    }
  }}
/>
```

- [ ] **Step 4: 验证 — 启动前端确认编译通过**

Run: `cd frontend && npx next build`

---

## Task 2: 移动端底部 Tab 导航

**Files:**
- Create: `frontend/src/components/BottomTabBar.tsx`
- Modify: `frontend/src/app/layout.tsx` (添加 BottomTabBar)
- Modify: `frontend/src/components/Header.tsx` (移动端隐藏部分导航)

- [ ] **Step 1: 创建 BottomTabBar 组件**

```tsx
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Grid3X3, User } from 'lucide-react';

const tabs = [
  { href: '/', label: '首页', icon: Home },
  { href: '/?list=true', label: '分类', icon: Grid3X3 },
  { href: '/profile', label: '我的', icon: User },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/' && !typeof window !== 'undefined' && !new URLSearchParams(window.location.search).has('list');
    }
    if (href === '/?list=true') {
      return typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('list');
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-drama-bg/95 backdrop-blur-lg border-t border-drama-border/50 safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
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
```

- [ ] **Step 2: 在 layout.tsx 中添加 BottomTabBar，main 增加 pb-14**

```tsx
// layout.tsx
import BottomTabBar from '@/components/BottomTabBar';

// body 内
<AuthInitializer />
<Header />
<main className="pt-16 pb-14 md:pb-0">{children}</main>
<BottomTabBar />
```

- [ ] **Step 3: 验证编译通过**

---

## Task 3: 播放结束倒计时确认（替代直接跳集）

**Files:**
- Modify: `frontend/src/app/drama/[id]/play/page.tsx:156-164` (handleEnded)

- [ ] **Step 1: 添加倒计时状态**

```tsx
// play/page.tsx 新增 state
const [showNextEpisode, setShowNextEpisode] = useState(false);
const [nextCountdown, setNextCountdown] = useState(5);
```

- [ ] **Step 2: 修改 handleEnded 逻辑**

```tsx
const handleEnded = useCallback(() => {
  if (!episode || !drama) return;
  reportProgress(episode.id, currentTimeMsRef.current, true).catch(() => {});

  if (episodeNumber < drama.totalEpisodes) {
    setShowNextEpisode(true);
    setNextCountdown(5);
  }
}, [episode, drama, episodeNumber]);
```

- [ ] **Step 3: 添加倒计时 useEffect**

```tsx
useEffect(() => {
  if (!showNextEpisode) return;
  if (nextCountdown <= 0) {
    // 自动跳转
    router.push(`/drama/${dramaId}/play?ep=${episodeNumber + 1}`);
    setShowNextEpisode(false);
    return;
  }
  const timer = setTimeout(() => setNextCountdown((c) => c - 1), 1000);
  return () => clearTimeout(timer);
}, [showNextEpisode, nextCountdown, episodeNumber, dramaId, router]);
```

- [ ] **Step 4: 添加倒计时 UI**

在视频区域下方添加倒计时卡片：

```tsx
{showNextEpisode && (
  <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 bg-drama-card/95 backdrop-blur-md rounded-xl px-5 py-3 flex items-center gap-3 shadow-lg border border-drama-border/50">
    <span className="text-drama-text text-sm">下一集：第{episodeNumber + 1}集</span>
    <span className="text-primary-500 font-bold text-lg">{nextCountdown}s</span>
    <button
      onClick={() => router.push(`/drama/${dramaId}/play?ep=${episodeNumber + 1}`)}
      className="px-3 py-1 bg-primary-500 text-white text-sm rounded-full hover:bg-primary-600 transition-colors"
    >
      立即播放
    </button>
    <button
      onClick={() => setShowNextEpisode(false)}
      className="px-3 py-1 bg-drama-surface text-drama-muted text-sm rounded-full hover:text-drama-text transition-colors"
    >
      取消
    </button>
  </div>
)}
```

- [ ] **Step 5: 验证编译通过**

---

## Task 4: 互动面板增加跳过按钮

**Files:**
- Modify: `frontend/src/components/InteractionOverlay.tsx:330-365` (overlay渲染区域)
- Modify: `frontend/src/components/interaction/QuizPanel.tsx` (增加跳过)
- Modify: `frontend/src/components/interaction/ChoicePanel.tsx` (增加跳过)
- Modify: `frontend/src/components/interaction/VotePanel.tsx` (增加跳过)

- [ ] **Step 1: InteractionOverlay 增加跳过回调 prop 和 UI**

在 overlay 渲染区域（遮罩层）添加跳过按钮：

```tsx
// InteractionOverlay.tsx 遮罩层区域增加跳过按钮
{(activeInteraction || activePanel) && (
  <div className="absolute inset-0 z-10 bg-black/20" onClick={closeActiveInteraction}>
    <button
      onClick={(e) => {
        e.stopPropagation();
        closeActiveInteraction();
        closePanel();
      }}
      className="absolute top-3 right-3 z-30 px-3 py-1.5 bg-drama-card/80 backdrop-blur-sm text-drama-muted text-xs rounded-full hover:text-drama-text transition-colors"
    >
      跳过 ✕
    </button>
  </div>
)}
```

- [ ] **Step 2: QuizPanel 增加跳过按钮**

在 QuizPanel 右上角增加跳过按钮，调用 `onClose` 回调：

```tsx
// QuizPanel.tsx 在面板顶部添加
<button
  onClick={onClose}
  className="absolute top-2 right-2 px-2 py-1 text-drama-muted text-xs rounded-full hover:text-drama-text hover:bg-drama-surface/50 transition-colors"
>
  跳过
</button>
```

- [ ] **Step 3: ChoicePanel 和 VotePanel 同样增加跳过按钮**

- [ ] **Step 4: 验证编译通过**

---

## Task 5: 弹幕改用 CSS 动画 + 轨道碰撞检测

**Files:**
- Modify: `frontend/src/components/danmaku/DanmakuLayer.tsx` (核心重写弹幕渲染逻辑)

- [ ] **Step 1: 重写弹幕渲染 — 使用 CSS @keyframes 动画**

替换现有的 `Date.now()` + `transform: translateX` 逻辑，改为：

```tsx
// DanmakuLayer.tsx 核心改动

// 轨道分配：碰撞检测
const trackEndTimes = useRef<number[]>(new Array(TRACK_COUNT).fill(0));

function allocateTrack(): number {
  const now = Date.now();
  let bestTrack = 0;
  let earliestEnd = Infinity;
  for (let i = 0; i < TRACK_COUNT; i++) {
    if (trackEndTimes.current[i] <= now) {
      bestTrack = i;
      earliestEnd = trackEndTimes.current[i];
      break; // 找到空闲轨道立即使用
    }
    if (trackEndTimes.current[i] < earliestEnd) {
      earliestEnd = trackEndTimes.current[i];
      bestTrack = i;
    }
  }
  // 估算弹幕完全进入屏幕的时间
  trackEndTimes.current[bestTrack] = now + DANMAKU_DURATION * 0.3;
  return bestTrack;
}

// 弹幕组件使用 CSS animation
function DanmakuItem({ text, track, color }: { text: string; track: number; color?: string }) {
  const topPercent = (track / TRACK_COUNT) * 100;
  return (
    <div
      className="danmaku-item absolute whitespace-nowrap text-white text-base font-bold"
      style={{
        top: `${topPercent}%`,
        right: 0,
        transform: 'translateX(100%)',
        animation: `danmakuScroll ${DANMAKU_DURATION}ms linear forwards`,
        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
        color: color || 'white',
      }}
    >
      {text}
    </div>
  );
}
```

- [ ] **Step 2: 添加 CSS keyframes**

```tsx
// DanmakuLayer.tsx 顶部添加全局样式
<style jsx global>{`
  @keyframes danmakuScroll {
    from { transform: translateX(100%); }
    to { transform: translateX(-100vw); }
  }
`}</style>
```

- [ ] **Step 3: 简化 activeDanmaku 管理 — 不再需要 Date.now() 计算 progress**

```tsx
// 新的弹幕添加逻辑
useEffect(() => {
  const newDanmaku = visibleDanmaku.filter(
    (d) => !shownIdsRef.current.has(d.id)
  );
  if (newDanmaku.length === 0) return;

  const items = newDanmaku.map((d) => ({
    id: d.id,
    text: d.content,
    track: allocateTrack(),
    color: d.color,
    createdAt: Date.now(),
  }));

  setActiveDanmaku((prev) => [...prev, ...items]);
  newDanmaku.forEach((d) => shownIdsRef.current.add(d.id));
}, [visibleDanmaku]);

// 清理过期弹幕（DANMAKU_DURATION 之后）
useEffect(() => {
  const timer = setInterval(() => {
    const cutoff = Date.now() - DANMAKU_DURATION;
    setActiveDanmaku((prev) =>
      prev.filter((d) => d.createdAt > cutoff)
    );
  }, 2000);
  return () => clearInterval(timer);
}, []);
```

- [ ] **Step 4: 验证编译通过**

---

## Task 6: 移动端播放器手势操作

**Files:**
- Modify: `frontend/src/components/VideoPlayer.tsx` (添加 touch 手势层)

- [ ] **Step 1: 添加手势状态和常量**

```tsx
// VideoPlayer.tsx 新增
const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
const lastTapRef = useRef<number>(0);
```

- [ ] **Step 2: 实现双击暂停/播放（替代300ms延迟判定）**

```tsx
// 修改 handleVideoClick
const handleVideoClick = useCallback((e: React.MouseEvent) => {
  if (dragging) return;
  const now = Date.now();
  const timeSinceLastTap = now - lastTapRef.current;
  lastTapRef.current = now;

  if (timeSinceLastTap < 300) {
    // 双击：全屏切换
    toggleFullscreen();
  } else {
    // 单击：延迟判定（300ms内无第二次点击则暂停/播放）
    setTimeout(() => {
      if (Date.now() - lastTapRef.current >= 280) {
        togglePlay();
      }
    }, 300);
  }
}, [dragging, toggleFullscreen, togglePlay]);
```

- [ ] **Step 3: 添加 touch 事件处理 — 左右滑动快进/快退**

```tsx
const handleTouchStart = useCallback((e: React.TouchEvent) => {
  const touch = e.touches[0];
  touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
}, []);

const handleTouchEnd = useCallback((e: React.TouchEvent) => {
  if (!touchStartRef.current) return;
  const touch = e.changedTouches[0];
  const dx = touch.clientX - touchStartRef.current.x;
  const dy = touch.clientY - touchStartRef.current.y;
  const dt = Date.now() - touchStartRef.current.time;

  // 水平滑动 > 50px 且时间 < 500ms → 快进/快退
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 500) {
    const video = videoRef.current;
    if (!video) return;
    const seekAmount = dx > 0 ? SEEK_STEP : -SEEK_STEP;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seekAmount));
  }
  touchStartRef.current = null;
}, []);
```

- [ ] **Step 4: 在视频容器上绑定 touch 事件**

```tsx
// VideoPlayer.tsx 视频容器 div 添加
onTouchStart={handleTouchStart}
onTouchEnd={handleTouchEnd}
```

- [ ] **Step 5: 进度条添加 touch 事件**

在 `handleProgressMouseDown` 旁边添加 `handleProgressTouchStart`：

```tsx
const handleProgressTouchStart = useCallback((e: React.TouchEvent) => {
  e.preventDefault();
  const bar = e.currentTarget;
  const rect = bar.getBoundingClientRect();
  const x = e.touches[0].clientX - rect.left;
  const ratio = Math.max(0, Math.min(1, x / rect.width));
  const video = videoRef.current;
  if (video?.duration) {
    video.currentTime = ratio * video.duration;
  }
  setDragging(true);

  const handleTouchMove = (ev: TouchEvent) => {
    const newX = ev.touches[0].clientX - rect.left;
    const newRatio = Math.max(0, Math.min(1, newX / rect.width));
    if (video?.duration) {
      video.currentTime = newRatio * video.duration;
    }
  };
  const handleTouchEnd = () => {
    setDragging(false);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  };
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd);
}, []);
```

- [ ] **Step 6: 验证编译通过**

---

## Task 7: 视频缓冲/加载状态指示

**Files:**
- Modify: `frontend/src/components/VideoPlayer.tsx` (添加 buffering state + UI)

- [ ] **Step 1: 添加 buffering 状态**

```tsx
const [buffering, setBuffering] = useState(false);
```

- [ ] **Step 2: 在事件监听 useEffect 中添加 waiting/canplay 事件**

```tsx
// 在现有事件绑定 useEffect 中添加
video.addEventListener('waiting', () => setBuffering(true));
video.addEventListener('canplay', () => setBuffering(false));
video.addEventListener('playing', () => setBuffering(false));
```

- [ ] **Step 3: 添加加载指示器 UI**

```tsx
{buffering && (
  <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
    <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin" />
  </div>
)}
```

- [ ] **Step 4: 验证编译通过**

---

## Task 8: 历史页展示观看进度信息

**Files:**
- Modify: `frontend/src/app/profile/history/page.tsx` (重写渲染逻辑)

- [ ] **Step 1: 替换 DramaCard 为自定义历史卡片**

```tsx
// history/page.tsx 重写渲染部分
{items.map((item) => {
  if (!item.drama) return null;
  const progressPercent = item.durationMs
    ? Math.min(100, Math.round((item.positionMs / item.durationMs) * 100))
    : 0;
  const positionStr = formatDuration(item.positionMs);

  return (
    <Link
      key={item.episodeId}
      href={`/drama/${item.drama.id}/play?ep=${item.episodeNumber}`}
      className="block rounded-lg overflow-hidden bg-drama-card hover:bg-drama-card/80 transition-colors"
    >
      <div className="relative aspect-video">
        <img
          src={resolveUrl(item.drama.coverUrl)}
          alt={item.drama.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div className="h-full bg-primary-500" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>
      <div className="p-2">
        <h3 className="text-sm font-medium text-drama-text truncate">{item.drama.title}</h3>
        <p className="text-xs text-drama-muted mt-0.5">
          第{item.episodeNumber}集 · {positionStr}
        </p>
        <button className="mt-1 text-xs text-primary-500 hover:text-primary-400">
          继续观看 →
        </button>
      </div>
    </Link>
  );
})}
```

- [ ] **Step 2: 添加 formatDuration 工具函数**

```tsx
function formatDuration(ms: number): string {
  if (!ms || ms <= 0) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
```

- [ ] **Step 3: 验证编译通过**

---

## Task 9: 详情页续播支持

**Files:**
- Modify: `frontend/src/app/drama/[id]/page.tsx:54-71` (加载逻辑) + `186-192` (播放按钮)

- [ ] **Step 1: 添加续播状态**

```tsx
const [continueInfo, setContinueInfo] = useState<{ episodeNumber: number; positionMs: number } | null>(null);
```

- [ ] **Step 2: 在 useEffect 中加载续播信息**

```tsx
// 在现有 Promise.all 之后添加
getContinueWatching().then((data) => {
  const item = (data?.content || data || []).find((d: any) => d.id === dramaId || d.dramaId === dramaId);
  if (item) {
    setContinueInfo({
      episodeNumber: item.lastEpisodeNumber || item.episodeNumber || 1,
      positionMs: item.lastPositionMs || item.positionMs || 0,
    });
  }
}).catch(() => {});
```

- [ ] **Step 3: 修改播放按钮**

```tsx
{continueInfo ? (
  <Link
    href={`/drama/${dramaId}/play?ep=${continueInfo.episodeNumber}`}
    className="px-6 py-2.5 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors flex items-center gap-2"
  >
    <Play className="w-4 h-4" /> 继续播放 第{continueInfo.episodeNumber}集
  </Link>
) : (
  <Link
    href={`/drama/${dramaId}/play`}
    className="px-6 py-2.5 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors flex items-center gap-2"
  >
    <Play className="w-4 h-4" /> 立即播放
  </Link>
)}
```

- [ ] **Step 4: 验证编译通过**

---

## Task 10: 选集切换保存进度 + shallow routing

**Files:**
- Modify: `frontend/src/app/drama/[id]/play/page.tsx:302-320` (选集按钮)

- [ ] **Step 1: 选集切换前保存进度**

```tsx
// 选集点击处理函数
const handleEpisodeChange = useCallback(async (newEp: number) => {
  // 先保存当前进度
  if (episode && isLoggedIn) {
    await reportProgress(episode.id, currentTimeMsRef.current, false).catch(() => {});
  }
  // 使用 shallow routing 避免整页刷新
  router.push(`/drama/${dramaId}/play?ep=${newEp}`, { scroll: false });
}, [episode, isLoggedIn, dramaId, router]);
```

- [ ] **Step 2: 选集按钮使用 handleEpisodeChange 替代 Link**

```tsx
{episodes.map((ep) => (
  <button
    key={ep.id}
    onClick={() => handleEpisodeChange(ep.episodeNumber)}
    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
      ep.episodeNumber === episodeNumber
        ? 'bg-primary-500 text-white'
        : 'bg-drama-surface text-drama-muted hover:text-drama-text'
    }`}
  >
    {ep.episodeNumber}
  </button>
))}
```

- [ ] **Step 3: 验证编译通过**

---

## Task 11: 导航入口扩充

**Files:**
- Modify: `frontend/src/components/Header.tsx:9-12` (navLinks)

- [ ] **Step 1: 扩充 navLinks**

```tsx
const navLinks = [
  { href: '/?list=true', label: '首页' },
  { href: '/?list=clips', label: '短视频' },
  { href: '/eggs', label: '彩蛋图鉴' },
];
```

- [ ] **Step 2: 已登录用户下拉菜单增加快捷入口**

在用户下拉菜单中增加"我的追剧"和"观看历史"链接：

```tsx
<Link href="/profile/favorites" className="block px-4 py-2 text-sm text-drama-text hover:bg-drama-surface">我的追剧</Link>
<Link href="/profile/history" className="block px-4 py-2 text-sm text-drama-text hover:bg-drama-surface">观看历史</Link>
```

- [ ] **Step 3: 验证编译通过**

---

## Task 12: DramaCard 增加评分和互动标记

**Files:**
- Modify: `frontend/src/components/DramaCard.tsx:40-51` (信息区域)

- [ ] **Step 1: 在卡片信息区增加评分和互动标签**

```tsx
// DramaCard.tsx 信息区域
<div className="p-2">
  <h3 className="text-sm font-medium text-drama-text truncate">{drama.title}</h3>
  <div className="flex items-center gap-1.5 mt-0.5">
    <span className="text-xs text-drama-muted">{drama.category}</span>
    {drama.rating > 0 && (
      <span className="text-xs text-yellow-400">★ {drama.rating.toFixed(1)}</span>
    )}
  </div>
  <div className="flex items-center gap-1.5 mt-0.5">
    <span className="text-xs text-drama-muted">{drama.totalEpisodes}集</span>
    <span className="text-xs text-primary-400">互动</span>
  </div>
</div>
```

- [ ] **Step 2: 验证编译通过**

---

## Task 13: 详情页统一使用独立 CommentSection 组件

**Files:**
- Modify: `frontend/src/app/drama/[id]/page.tsx` (删除内联 CommentSection，改用独立组件)

- [ ] **Step 1: 删除内联 CommentSection（第287-400行）**

- [ ] **Step 2: 导入独立 CommentSection 组件**

```tsx
import CommentSection from '@/components/CommentSection';
```

- [ ] **Step 3: 替换评论区域渲染**

```tsx
{/* 评论区 */}
<div className="mt-6">
  <CommentSection dramaId={dramaId} />
</div>
```

- [ ] **Step 4: 删除不再需要的评论相关 state 和函数**

删除：`comments`, `commentPage`, `commentText`, `submitting`, `commentSort` 等 state，以及 `handleCommentSubmit`, `handleCommentLike` 函数，和评论加载 useEffect。

- [ ] **Step 5: 验证编译通过**

---

## Task 14: 评分组件简化为5星制

**Files:**
- Modify: `frontend/src/components/RatingInput.tsx` (重写评分逻辑)

- [ ] **Step 1: 简化为5星制，去掉半星**

核心改动：5颗星，每颗1分，点击直接提交1-5分。后端10分制，前端提交时 `score * 2`。

```tsx
// RatingInput.tsx 核心改动
const STAR_COUNT = 5;

const handleClick = async (starIndex: number) => {
  const score = (starIndex + 1) * 2; // 转为10分制
  setSubmitting(true);
  try {
    await submitRating(dramaId, score);
    setUserScore(score);
    const stats = await getRatingStats(dramaId);
    setAvgRating(stats.avgRating);
    setRatingCount(stats.ratingCount);
    onRate?.(score);
  } catch { /* */ }
  setSubmitting(false);
};

// 渲染5颗星
{Array.from({ length: STAR_COUNT }, (_, i) => {
  const filled = userScore ? (i + 1) * 2 <= userScore : (i + 1) * 2 <= (hoverScore || 0);
  return (
    <button key={i} onClick={() => handleClick(i)} onMouseEnter={() => setHoverScore((i + 1) * 2)} onMouseLeave={() => setHoverScore(null)}>
      <Star className={`w-7 h-7 transition-colors ${filled ? 'text-yellow-400 fill-yellow-400' : 'text-drama-muted'}`} />
    </button>
  );
})}
```

- [ ] **Step 2: 验证编译通过**

---

## Task 15: 全局错误 Toast + 加载骨架屏

**Files:**
- Create: `frontend/src/components/GlobalToast.tsx`
- Modify: `frontend/src/app/page.tsx` (替换黑屏 fallback)
- Modify: `frontend/src/lib/api-client.ts` (错误时触发 toast)

- [ ] **Step 1: 创建 GlobalToast 组件（基于 zustand 全局状态）**

```tsx
// frontend/src/lib/toast-store.ts
import { create } from 'zustand';

interface ToastState {
  message: string;
  type: 'error' | 'success' | 'info';
  visible: boolean;
  showToast: (message: string, type?: 'error' | 'success' | 'info') => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: '',
  type: 'info',
  visible: false,
  showToast: (message, type = 'info') => set({ message, type, visible: true }),
  hideToast: () => set({ visible: false }),
}));
```

```tsx
// frontend/src/components/GlobalToast.tsx
'use client';
import { useEffect, useState } from 'react';
import { useToastStore } from '@/lib/toast-store';

export default function GlobalToast() {
  const { message, type, visible, hideToast } = useToastStore();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => { hideToast(); setShow(false); }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, hideToast]);

  if (!show) return null;

  const bgColor = type === 'error' ? 'bg-red-500/90' : type === 'success' ? 'bg-green-500/90' : 'bg-primary-500/90';

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
      <div className={`px-5 py-2.5 rounded-xl text-sm text-white font-medium ${bgColor} backdrop-blur-sm shadow-lg animate-in slide-in-from-top fade-in duration-300`}>
        {message}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 在 layout.tsx 中添加 GlobalToast**

- [ ] **Step 3: 替换首页黑屏 fallback**

```tsx
// page.tsx fallback
<div className="h-screen bg-drama-bg flex items-center justify-center">
  <div className="text-center">
    <div className="w-10 h-10 border-3 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto" />
    <p className="text-drama-muted text-sm mt-3">加载中...</p>
  </div>
</div>
```

- [ ] **Step 4: 在 api-client.ts 的 request 函数中，网络错误时触发 toast**

```tsx
// api-client.ts request 函数 catch 块中
catch (err) {
  if (err instanceof ApiError) throw err;
  // 网络错误
  if (typeof window !== 'undefined') {
    const { showToast } = require('./toast-store').useToastStore.getState();
    showToast('网络异常，请稍后重试', 'error');
  }
  throw err;
}
```

- [ ] **Step 5: 验证编译通过**

---

## Task 16: 分类动态获取 + DramaListPage 优化

**Files:**
- Modify: `frontend/src/components/DramaListPage.tsx:12` (硬编码分类)

- [ ] **Step 1: 改为从后端动态获取分类**

```tsx
// DramaListPage.tsx
const [categories, setCategories] = useState<string[]>(['全部']);
const [category, setCategory] = useState('全部');

useEffect(() => {
  getCategories().then((cats) => {
    if (Array.isArray(cats) && cats.length > 0) {
      setCategories(['全部', ...cats]);
    }
  }).catch(() => {});
}, []);
```

- [ ] **Step 2: 验证编译通过**

---

## Task 17: ClipFlow 导航优化（替换 emoji）

**Files:**
- Modify: `frontend/src/components/clip/ClipFlow.tsx:153` (emoji 按钮)

- [ ] **Step 1: 替换 emoji 为带文字的图标按钮**

```tsx
// 替换 <a href="/" className="text-xl" title="剧列表">📺</a>
<Link href="/?list=true" className="flex items-center gap-1 text-sm text-drama-muted hover:text-drama-text transition-colors">
  <Grid3X3 className="w-4 h-4" />
  <span>短剧</span>
</Link>
```

- [ ] **Step 2: 验证编译通过**

---

## Task 18: 个人中心增加勋章入口

**Files:**
- Modify: `frontend/src/app/profile/page.tsx:82-101` (菜单项)
- Create: `frontend/src/app/profile/medals/page.tsx` (勋章墙页面)
- Modify: `frontend/src/lib/api-client.ts` (添加 getMedals API)

- [ ] **Step 1: api-client.ts 添加 getMedals 函数**

```tsx
export async function getMedals(userId: number) {
  return apiGet<any>(`/api/user/${userId}/medals`);
}
```

- [ ] **Step 2: 个人中心菜单增加"我的勋章"**

```tsx
{ href: '/profile/medals', label: '我的勋章', icon: Award },
```

- [ ] **Step 3: 创建勋章墙页面**

```tsx
// frontend/src/app/profile/medals/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth';
import { getMedals } from '@/lib/api-client';

export default function MedalsPage() {
  const user = useAuthStore((s) => s.user);
  const [medals, setMedals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      getMedals(user.id).then((data) => setMedals(Array.isArray(data) ? data : []))
        .catch(() => {}).finally(() => setLoading(false));
    }
  }, [user?.id]);

  if (loading) return <div className="text-center py-20 text-drama-muted">加载中...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-drama-text mb-6">我的勋章</h1>
      {medals.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-drama-muted">还没有获得勋章</p>
          <p className="text-sm text-drama-muted mt-2">观看短剧、参与互动即可解锁勋章</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {medals.map((medal) => (
            <div key={medal.id} className="bg-drama-card rounded-xl p-4 text-center">
              <div className="text-4xl mb-2">{medal.icon || '🏅'}</div>
              <h3 className="text-sm font-medium text-drama-text">{medal.name}</h3>
              <p className="text-xs text-drama-muted mt-1">{medal.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: 验证编译通过**

---

## Task 19: 积分历史 + 用途说明

**Files:**
- Modify: `frontend/src/app/profile/page.tsx` (积分区域)
- Create: `frontend/src/app/profile/points/page.tsx` (积分详情页)
- Modify: `frontend/src/lib/api-client.ts` (添加 getPointsHistory)

- [ ] **Step 1: api-client.ts 添加积分历史 API**

```tsx
export async function getPointsHistory() {
  return apiGet<any>('/api/points/history');
}
```

- [ ] **Step 2: 个人中心积分区域增加"查看详情"链接**

```tsx
<Link href="/profile/points" className="text-xs text-primary-400 hover:text-primary-300">
  查看详情 →
</Link>
```

- [ ] **Step 3: 创建积分详情页（余额 + 获取记录 + 用途说明）**

- [ ] **Step 4: 验证编译通过**

---

## Task 20: 彩蛋收集进度激励 + 提示优化

**Files:**
- Modify: `frontend/src/app/eggs/page.tsx` (进度条 + 提示)

- [ ] **Step 1: 添加总体进度条**

```tsx
// eggs/page.tsx 在统计区域
<div className="w-full bg-drama-surface rounded-full h-2 mt-2">
  <div className="bg-primary-500 h-2 rounded-full transition-all" style={{ width: `${(collectedCount / totalCount) * 100}%` }} />
</div>
<p className="text-xs text-drama-muted mt-1">
  再收集{totalCount - collectedCount}个即可解锁全部彩蛋
</p>
```

- [ ] **Step 2: 未收集彩蛋增加提示**

```tsx
// 未收集的彩蛋卡片
<div className="bg-drama-surface/50 rounded-lg p-3 text-center border border-dashed border-drama-border">
  <div className="text-2xl mb-1 opacity-30">🥚</div>
  <p className="text-xs text-drama-muted">???</p>
  <p className="text-[10px] text-drama-muted/60 mt-0.5">在{group.dramaTitle}中探索</p>
</div>
```

- [ ] **Step 3: 验证编译通过**

---

## Task 21-47: P2/P3 优化项（简要列出）

以下为 P2/P3 优化项，每项对应一个实施步骤，在 P0/P1 完成后依次实施：

| # | 优化项 | 涉及文件 |
|---|--------|---------|
| 21 | Banner 轮播过渡动画 | Banner.tsx |
| 22 | Banner 移动端切换按钮常显 | Banner.tsx |
| 23 | DramaCard 移动端按压反馈 | DramaCard.tsx |
| 24 | 点赞动画反馈 | ClipCard.tsx |
| 25 | 收藏页取消收藏功能 | favorites/page.tsx |
| 26 | 搜索结果关键词高亮 | search/page.tsx |
| 27 | 热门搜索动态获取 | search/page.tsx |
| 28 | 在线人数模糊化 | play/page.tsx |
| 29 | 分享改用 Toast | drama/[id]/page.tsx |
| 30 | 退出登录确认弹窗 | profile/page.tsx |
| 31 | 登录表单实时校验 | login/page.tsx |
| 32 | ClipCard "从第N集看" | ClipCard.tsx |
| 33 | 移动端竖屏保留倍速/画质 | VideoPlayer.tsx |
| 34 | 弹幕开关持久化 | DanmakuLayer.tsx |
| 35 | 弹幕设置面板 | DanmakuLayer.tsx |
| 36 | 选集显示集名+进度 | play/page.tsx |
| 37 | 选集分组+自动滚动 | play/page.tsx |
| 38 | 画中画模式 | VideoPlayer.tsx |
| 39 | 预加载下一集 | play/page.tsx |
| 40 | 锁屏模式 | VideoPlayer.tsx |
| 41 | 字幕支持 | VideoPlayer.tsx |
| 42 | 新手引导 | page.tsx |
| 43 | 排行榜 | 新建页面 |
| 44 | AI面板引导优化 | play/page.tsx |
| 45 | 搜索自动补全 | search/page.tsx |
| 46 | 注册后引导 | register/page.tsx |
| 47 | 个人资料编辑 | profile/page.tsx |

---

## 验证步骤

每个 Task 完成后：
1. 运行 `cd frontend && npx next build` 确认编译无错误
2. 关键改动在浏览器/模拟器中手动验证
3. 全部 Task 完成后运行 `cd backend && mvnw clean compile -DskipTests` 确认后端无影响

---

## 假设与决策

1. **后端不动**：所有优化仅涉及前端，除非明确需要新增后端API（如积分历史）
2. **渐进实施**：按 Task 1-20 顺序实施，每个 Task 独立可验证
3. **Tailwind 优先**：UI 样式使用现有 Tailwind 类名体系，不引入新 CSS 框架
4. **移动端优先**：所有改动优先考虑移动端体验，桌面端作为增强
5. **不破坏现有功能**：每个改动保持向后兼容，不改变现有 API 接口
