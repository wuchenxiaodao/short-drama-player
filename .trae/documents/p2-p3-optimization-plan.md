# P2/P3 用户体验优化实施计划（Task 21-47）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 逐个解决27个P2/P3用户体验问题，使短剧互动播放器达到主流App体验水平。

**Architecture:** 前端 Next.js 14 App Router + Tailwind CSS，后端 Spring Boot REST API。优化主要集中在前端组件层，不涉及后端改动。

**Tech Stack:** React 18, Next.js 14, Tailwind CSS, zustand, TypeScript

---

## Task 21: Banner 轮播过渡动画

**Files:**
- Modify: `frontend/src/components/Banner.tsx`

**问题:** 当前图片切换使用 `key={drama.id}` 强制重新渲染，导致直接跳变而非淡入淡出。

- [ ] **Step 1: 改用双图层叠加实现淡入淡出**

替换当前单 `<img key={drama.id}>` 方案，改为同时渲染当前图和下一张图，通过 opacity 过渡实现淡入淡出：

```tsx
// Banner.tsx 核心改动
const [prevIndex, setPrevIndex] = useState(0);
const [transitioning, setTransitioning] = useState(false);

const next = useCallback(() => {
  setPrevIndex(current);
  setCurrent((prev) => (prev + 1) % dramas.length);
  setTransitioning(true);
}, [current, dramas.length]);

const prev = useCallback(() => {
  setPrevIndex(current);
  setCurrent((p) => (p - 1 + dramas.length) % dramas.length);
  setTransitioning(true);
}, [current, dramas.length]);

// 渲染区域：两层图片叠加
<div className="relative w-full h-full">
  {/* 底层：上一张 */}
  <img
    src={resolveUrl(dramas[prevIndex]?.coverUrl)}
    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
    style={{ opacity: transitioning ? 0 : 1 }}
  />
  {/* 上层：当前张 */}
  <img
    src={resolveUrl(drama.coverUrl)}
    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
    style={{ opacity: transitioning ? 1 : 1 }}
    onLoad={() => setTransitioning(false)}
  />
</div>
```

- [ ] **Step 2: 验证编译通过**

---

## Task 22: Banner 移动端切换按钮常显

**Files:**
- Modify: `frontend/src/components/Banner.tsx`

**问题:** `opacity-0 group-hover:opacity-100` 在触屏设备上永远不可见。

- [ ] **Step 1: 移动端常显切换按钮**

将左右箭头按钮的 `opacity-0 group-hover:opacity-100` 改为移动端常显、桌面端 hover 显示：

```tsx
// 替换 className
className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white md:opacity-0 md:group-hover:opacity-100 transition-opacity"
```

- [ ] **Step 2: 添加触摸滑动支持**

在 Banner 容器上添加 touch 事件处理：

```tsx
const touchStartRef = useRef<{ x: number } | null>(null);

const handleTouchStart = (e: React.TouchEvent) => {
  touchStartRef.current = { x: e.touches[0].clientX };
};

const handleTouchEnd = (e: React.TouchEvent) => {
  if (!touchStartRef.current) return;
  const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
  if (Math.abs(dx) > 50) {
    dx > 0 ? prev() : next();
  }
  touchStartRef.current = null;
};

// 容器 div 添加
onTouchStart={handleTouchStart}
onTouchEnd={handleTouchEnd}
```

- [ ] **Step 3: 验证编译通过**

---

## Task 23: DramaCard 移动端按压反馈

**Files:**
- Modify: `frontend/src/components/DramaCard.tsx`

**问题:** 移动端缺少 `active:scale-95` 等触觉反馈，hover 效果在触屏无意义。

- [ ] **Step 1: 添加 active 状态按压反馈**

```tsx
// DramaCard.tsx Link className 修改
<Link href={`/drama/${drama.id}`} className="block group">
  <div className="rounded-lg overflow-hidden bg-drama-card transition-all duration-200 group-hover:scale-[1.02] group-hover:shadow-lg group-hover:shadow-black/20 active:scale-[0.97]">
```

- [ ] **Step 2: 图片添加懒加载**

```tsx
<img
  src={resolveUrl(drama.coverUrl)}
  alt={drama.title}
  className="w-full h-full object-cover"
  loading="lazy"
/>
```

- [ ] **Step 3: 验证编译通过**

---

## Task 24: 点赞动画反馈

**Files:**
- Modify: `frontend/src/components/clip/ClipCard.tsx`

**问题:** 点赞无动画，体验单薄。

- [ ] **Step 1: 添加点赞缩放弹跳动画**

```tsx
// ClipCard.tsx handleLike 修改
const [likeAnimating, setLikeAnimating] = useState(false);

const handleLike = useCallback(() => {
  if (liked) return; // 已点赞则不可取消
  setLiked(true);
  setLikeAnimating(true);
  recordClipLike(clip.id).catch(() => {});
  setTimeout(() => setLikeAnimating(false), 600);
}, [clip.id, liked]);

// 按钮渲染修改
<button
  className={`btn-action ${liked ? 'liked' : ''} ${likeAnimating ? 'animate-bounce' : ''}`}
  onClick={handleLike}
>
  <Heart className={`w-5 h-5 transition-transform ${liked ? 'fill-current scale-110' : ''} ${likeAnimating ? 'scale-125' : ''}`} />
  {liked && <span className="text-xs ml-0.5">+1</span>}
</button>
```

- [ ] **Step 2: 验证编译通过**

---

## Task 25: 收藏页取消收藏功能

**Files:**
- Modify: `frontend/src/app/profile/favorites/page.tsx`

**问题:** 只能查看收藏列表，不能在此页面取消追剧。

- [ ] **Step 1: 添加取消收藏按钮和逻辑**

```tsx
// favorites/page.tsx
import { toggleFavorite, useToastStore } from '@/lib/api-client';

// 在 DramaCard 旁边添加取消收藏按钮
<div className="relative group">
  <DramaCard key={d.id} drama={d} />
  <button
    onClick={async (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        await toggleFavorite(d.id);
        setDramas((prev) => prev.filter((item) => item.id !== d.id));
        // 使用 toast 提示
        const { showToast } = await import('@/lib/toast-store').then(m => m.useToastStore.getState());
        showToast('已取消追剧', 'success');
      } catch {}
    }}
    className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white/70 hover:text-white hover:bg-red-500/80 transition-all opacity-0 group-hover:opacity-100"
    title="取消追剧"
  >
    <X className="w-4 h-4" />
  </button>
</div>
```

- [ ] **Step 2: 移动端常显取消按钮（不依赖 hover）**

移动端使用 `md:opacity-0 md:group-hover:opacity-100 opacity-60` 策略。

- [ ] **Step 3: 验证编译通过**

---

## Task 26: 搜索结果关键词高亮

**Files:**
- Modify: `frontend/src/app/search/page.tsx`

**问题:** 搜索结果中关键词未高亮显示。

- [ ] **Step 1: 创建高亮工具函数**

```tsx
// search/page.tsx 内添加
function HighlightText({ text, keyword }: { text: string; keyword: string }) {
  if (!keyword.trim()) return <>{text}</>;
  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span key={i} className="text-primary-400 font-medium">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
```

- [ ] **Step 2: 由于搜索结果使用 DramaGrid/DramaCard 组件，需要通过 prop 传递关键词**

在 DramaCard 中添加可选 `highlightKeyword` prop，在标题渲染时使用 HighlightText：

```tsx
// DramaCard.tsx
interface DramaCardProps {
  drama: Drama;
  highlightKeyword?: string;
}

// 标题渲染
<h3 className="text-sm font-medium text-drama-text truncate">
  {highlightKeyword ? <HighlightText text={drama.title} keyword={highlightKeyword} /> : drama.title}
</h3>
```

- [ ] **Step 3: 搜索页传递 keyword 给 DramaGrid**

- [ ] **Step 4: 验证编译通过**

---

## Task 27: 热门搜索动态获取

**Files:**
- Modify: `frontend/src/app/search/page.tsx`
- Modify: `frontend/src/lib/api-client.ts`（如需新增API）

**问题:** `HOT_SEARCHES` 硬编码3个关键词。

- [ ] **Step 1: 改用后端热门短剧标题作为热门搜索**

由于后端没有专门的热搜API，利用已有的 `/api/drama/hot` 接口获取热门短剧标题：

```tsx
// search/page.tsx
import { getHotDramas } from '@/lib/api-client';

const [hotSearches, setHotSearches] = useState<string[]>(HOT_SEARCHES);

useEffect(() => {
  getHotDramas(0, 8)
    .then((res: any) => {
      const dramas = res?.content || res || [];
      if (Array.isArray(dramas) && dramas.length > 0) {
        setHotSearches(dramas.map((d: any) => d.title).slice(0, 8));
      }
    })
    .catch(() => {});
}, []);
```

- [ ] **Step 2: 验证编译通过**

---

## Task 28: 在线人数模糊化

**Files:**
- Modify: `frontend/src/app/drama/[id]/play/page.tsx`

**问题:** 显示精确数字（如"127人在线"）不合理，应模糊化显示。

- [ ] **Step 1: 添加人数模糊化工具函数**

```tsx
// play/page.tsx 内添加
function formatOnlineCount(count: number): string {
  if (count <= 0) return '';
  if (count < 10) return '少量观众在看';
  if (count < 100) return `${Math.floor(count / 10) * 10}+人在线`;
  if (count < 1000) return `${Math.floor(count / 100) * 100}+人在线`;
  if (count < 10000) return `${(count / 1000).toFixed(1)}千人在看`;
  return `${(count / 10000).toFixed(1)}万人在看`;
}
```

- [ ] **Step 2: 替换在线人数显示**

```tsx
// 替换原来的 {onlineCount}人在线
{onlineCount > 0 && (
  <span className="ml-2 inline-flex items-center gap-0.5">
    <Users className="w-3 h-3" />
    {formatOnlineCount(onlineCount)}
  </span>
)}
```

- [ ] **Step 3: 验证编译通过**

---

## Task 29: 分享改用 Toast

**Files:**
- Modify: `frontend/src/app/drama/[id]/page.tsx`

**问题:** 分享成功后用 `alert('链接已复制到剪贴板')`，不优雅。

- [ ] **Step 1: 替换 alert 为 toast**

```tsx
// drama/[id]/page.tsx handleShare 修改
import { useToastStore } from '@/lib/toast-store';

const handleShare = useCallback(async () => {
  const shareData = {
    title: drama?.title || '短剧推荐',
    text: `推荐你看《${drama?.title}》`,
    url: window.location.href,
  };
  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch {}
  } else {
    try {
      await navigator.clipboard.writeText(window.location.href);
      useToastStore.getState().showToast('链接已复制到剪贴板', 'success');
    } catch {
      useToastStore.getState().showToast('复制失败，请手动复制', 'error');
    }
  }
}, [drama]);
```

- [ ] **Step 2: 收藏操作也添加 toast 反馈**

```tsx
const handleFavorite = useCallback(async () => {
  if (!isLoggedIn) { router.push('/login'); return; }
  try {
    await toggleFavorite(dramaId);
    setIsFavorited((prev) => !prev);
    useToastStore.getState().showToast(isFavorited ? '已取消追剧' : '追剧成功', 'success');
  } catch {}
}, [dramaId, isLoggedIn, router, isFavorited]);
```

- [ ] **Step 3: 验证编译通过**

---

## Task 30: 退出登录确认弹窗

**Files:**
- Modify: `frontend/src/app/profile/page.tsx`

**问题:** 点击退出登录直接退出，可能误触。

- [ ] **Step 1: 添加确认弹窗**

```tsx
// profile/page.tsx
const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

// 退出按钮修改
<button
  onClick={() => setShowLogoutConfirm(true)}
  className="w-full py-3 bg-drama-card border border-drama-border/50 rounded-lg text-red-400 font-medium hover:bg-red-500/10 hover:border-red-500/20 transition-all flex items-center justify-center gap-2"
>
  <LogOut className="w-4 h-4" />
  退出登录
</button>

{/* 确认弹窗 */}
{showLogoutConfirm && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div className="bg-drama-card rounded-xl p-6 mx-4 max-w-sm w-full border border-drama-border/50 shadow-xl">
      <h3 className="text-lg font-medium text-drama-text mb-2">确认退出登录？</h3>
      <p className="text-sm text-drama-muted mb-6">退出后需要重新登录才能使用个人功能</p>
      <div className="flex gap-3">
        <button
          onClick={() => setShowLogoutConfirm(false)}
          className="flex-1 py-2.5 bg-drama-surface text-drama-text rounded-lg hover:bg-drama-border transition-colors"
        >
          取消
        </button>
        <button
          onClick={() => { logout(); router.push('/'); }}
          className="flex-1 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          退出
        </button>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 2: 验证编译通过**

---

## Task 31: 登录表单实时校验

**Files:**
- Modify: `frontend/src/app/login/page.tsx`

**问题:** 输入时无即时校验反馈，只在提交时才报错。

- [ ] **Step 1: 添加实时校验状态和提示**

```tsx
// login/page.tsx
const [touched, setTouched] = useState({ username: false, password: false });

// 用户名输入框
<div>
  <label className="block text-sm text-drama-muted mb-1.5">用户名</label>
  <input
    type="text"
    value={username}
    onChange={(e) => setUsername(e.target.value)}
    onBlur={() => setTouched((t) => ({ ...t, username: true }))}
    placeholder="请输入用户名"
    className={`w-full px-4 py-3 bg-drama-surface border rounded-lg text-drama-text placeholder:text-drama-muted focus:outline-none transition-colors ${
      touched.username && !username.trim() ? 'border-red-500 focus:border-red-500' : 'border-drama-border focus:border-primary-500'
    }`}
  />
  {touched.username && !username.trim() && (
    <p className="text-xs text-red-400 mt-1">请输入用户名</p>
  )}
</div>

// 密码输入框同理
```

- [ ] **Step 2: 注册页同步添加实时校验**

在 register/page.tsx 中添加同样的实时校验逻辑（密码长度、确认密码一致性等）。

- [ ] **Step 3: 验证编译通过**

---

## Task 32: ClipCard "从第N集看"

**Files:**
- Modify: `frontend/src/components/clip/ClipCard.tsx`

**问题:** 当前固定显示"从第1集看"，应显示片段实际来源的集数。

- [ ] **Step 1: 使用 clip.episodeId 或推算集数**

HighlightClip 类型中有 `episodeId` 字段，但没有 `episodeNumber`。需要在 ClipCard 中根据 episodeId 推算或直接显示：

```tsx
// ClipCard.tsx 修改按钮文本
<button className="btn-watch-full" onClick={handleClickThrough}>
  <Film className="w-4 h-4" />
  看完整剧
</button>
```

由于无法确定集数，改为更通用的"看完整剧"文案，同时跳转到详情页而非直接播放：

- [ ] **Step 2: 修改 handleClickThrough 跳转到详情页**

```tsx
const handleClickThrough = useCallback(() => {
  recordClipClick(clip.id).catch(() => {});
  onWatchFull?.(clip);
}, [clip.id, clip, onWatchFull]);

// ClipFlow.tsx 中 handleWatchFull 修改为跳转详情页
const handleWatchFull = useCallback((clip: HighlightClip) => {
  router.push(`/drama/${clip.dramaId}`);
}, [router]);
```

- [ ] **Step 3: 验证编译通过**

---

## Task 33: 移动端竖屏保留倍速/画质

**Files:**
- Modify: `frontend/src/components/VideoPlayer.tsx`

**问题:** 竖屏模式（`simplified`）隐藏了倍速和画质控件，用户需要这些功能。

- [ ] **Step 1: 竖屏模式下保留倍速按钮**

```tsx
// VideoPlayer.tsx 修改控制栏
<div className="flex items-center gap-2">
  <div className="flex items-center gap-2">
    <button onClick={togglePlay} className="text-white hover:text-primary-400 transition-colors">
      {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
    </button>
    <span className="text-xs text-white/80 tabular-nums min-w-[80px]">
      {formatTime(currentTime)} / {formatTime(duration)}
    </span>
  </div>

  <div className="flex items-center gap-2">
    {/* 竖屏也显示倍速 */}
    <div className="relative">
      <button
        onClick={() => { setShowSpeedMenu(!showSpeedMenu); setShowQualityMenu(false); }}
        className="text-xs text-white/80 hover:text-white px-1.5 py-0.5 rounded transition-colors"
      >
        {speed}x
      </button>
      {showSpeedMenu && (
        <div className="absolute bottom-full right-0 mb-2 bg-drama-card/95 backdrop-blur-md border border-drama-border rounded-lg py-1 min-w-[80px]">
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSpeedChange(s)}
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                speed === s ? 'text-primary-400 bg-primary-500/10' : 'text-drama-text hover:bg-drama-surface'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      )}
    </div>

    {/* 仅非竖屏显示音量 */}
    {!simplified && (
      <div className="flex items-center gap-1 group/vol">
        <button onClick={() => setMuted((m) => !m)} className="text-white hover:text-primary-400 transition-colors">
          <VolumeIcon className="w-4 h-4" />
        </button>
        <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
          onChange={handleVolumeSlider}
          className="w-16 h-1 accent-primary-500 cursor-pointer opacity-0 group-hover/vol:opacity-100 transition-opacity"
        />
      </div>
    )}

    {/* 仅非竖屏显示画质 */}
    {!simplified && streams && streams.length > 1 && (
      <div className="relative">
        <button onClick={() => { setShowQualityMenu(!showQualityMenu); setShowSpeedMenu(false); }}
          className="text-xs text-white/80 hover:text-white px-1.5 py-0.5 rounded transition-colors"
        >
          {quality}
        </button>
        {/* 画质菜单 */}
      </div>
    )}

    <button onClick={toggleFullscreen} className="text-white hover:text-primary-400 transition-colors">
      {fullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
    </button>
  </div>
</div>
```

- [ ] **Step 2: 验证编译通过**

---

## Task 34: 弹幕开关持久化

**Files:**
- Modify: `frontend/src/components/danmaku/DanmakuLayer.tsx`

**问题:** 刷新页面后弹幕开关状态丢失。

- [ ] **Step 1: 弹幕开关状态持久化到 localStorage**

```tsx
// DanmakuLayer.tsx
const [danmakuEnabled, setDanmakuEnabled] = useState(() => {
  if (typeof window === 'undefined') return enabled;
  const saved = localStorage.getItem('danmaku-enabled');
  return saved !== null ? saved === 'true' : enabled;
});

// 切换时保存
const toggleDanmaku = useCallback(() => {
  setDanmakuEnabled((prev) => {
    const next = !prev;
    localStorage.setItem('danmaku-enabled', String(next));
    return next;
  });
}, []);

// 按钮修改
<button onClick={toggleDanmaku} ...>
  弹幕{danmakuEnabled ? '开' : '关'}
</button>
```

- [ ] **Step 2: 验证编译通过**

---

## Task 35: 弹幕设置面板

**Files:**
- Modify: `frontend/src/components/danmaku/DanmakuLayer.tsx`

**问题:** 弹幕字号/透明度/密度不可调。

- [ ] **Step 1: 添加弹幕设置状态和面板**

```tsx
// DanmakuLayer.tsx 新增
const [showSettings, setShowSettings] = useState(false);
const [danmakuOpacity, setDanmakuOpacity] = useState(() => {
  if (typeof window === 'undefined') return 0.8;
  return parseFloat(localStorage.getItem('danmaku-opacity') || '0.8');
});
const [danmakuFontSize, setDanmakuFontSize] = useState(() => {
  if (typeof window === 'undefined') return 16;
  return parseInt(localStorage.getItem('danmaku-font-size') || '16');
});

// 设置面板 UI
{showSettings && (
  <div className="absolute top-10 right-3 z-30 bg-drama-card/95 backdrop-blur-md rounded-lg p-3 border border-drama-border w-48 space-y-3">
    <div className="flex items-center justify-between">
      <span className="text-xs text-drama-muted">透明度</span>
      <span className="text-xs text-drama-text">{Math.round(danmakuOpacity * 100)}%</span>
    </div>
    <input type="range" min={0.2} max={1} step={0.1} value={danmakuOpacity}
      onChange={(e) => {
        const v = parseFloat(e.target.value);
        setDanmakuOpacity(v);
        localStorage.setItem('danmaku-opacity', String(v));
      }}
      className="w-full h-1 accent-primary-500"
    />
    <div className="flex items-center justify-between">
      <span className="text-xs text-drama-muted">字号</span>
      <span className="text-xs text-drama-text">{danmakuFontSize}px</span>
    </div>
    <input type="range" min={12} max={24} step={2} value={danmakuFontSize}
      onChange={(e) => {
        const v = parseInt(e.target.value);
        setDanmakuFontSize(v);
        localStorage.setItem('danmaku-font-size', String(v));
      }}
      className="w-full h-1 accent-primary-500"
    />
  </div>
)}
```

- [ ] **Step 2: 弹幕渲染应用透明度和字号**

```tsx
// 弹幕层 style 修改
style={{ opacity: danmakuEnabled ? danmakuOpacity : 0 }}

// 单条弹幕 style 修改
style={{
  top: `${(d.track / TRACK_COUNT) * 100}%`,
  right: 0,
  animation: `danmakuScroll ${DANMAKU_DURATION}ms linear forwards`,
  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
  color: d.color || 'white',
  fontSize: `${danmakuFontSize}px`,
}}
```

- [ ] **Step 3: 添加设置按钮（齿轮图标）**

在弹幕开关按钮旁添加设置按钮：

```tsx
<button onClick={() => setShowSettings(!showSettings)} className="p-1.5 rounded-md bg-drama-card/80 text-drama-text hover:text-primary-400 transition-colors">
  <Settings className="w-3.5 h-3.5" />
</button>
```

- [ ] **Step 4: 验证编译通过**

---

## Task 36: 选集显示集名+进度

**Files:**
- Modify: `frontend/src/app/drama/[id]/play/page.tsx`

**问题:** 选集按钮只显示数字，无集名和观看进度。

- [ ] **Step 1: 选集按钮增加集名**

需要从 drama.episodes 获取每集标题。当前 `getDramaDetail` 返回的 episodes 数据中包含 title 字段：

```tsx
// play/page.tsx 修改选集区域
// 从 drama detail 获取 episodes 列表（含标题）
const [episodeList, setEpisodeList] = useState<{episodeNumber: number; title: string}[]>([]);

// 在 loadEpisodeData 中设置
if (drama?.episodes) {
  setEpisodeList(drama.episodes.map((e: any) => ({
    episodeNumber: e.episodeNumber,
    title: e.title || `第${e.episodeNumber}集`,
  })));
}

// 选集渲染修改
<div className="flex gap-2 overflow-x-auto scrollbar-hidden pb-2">
  {(episodeList.length > 0 ? episodeList : episodes.map((ep) => ({ episodeNumber: ep, title: `第${ep}集` }))).map((ep) => (
    <button
      key={ep.episodeNumber}
      onClick={() => handleEpisodeChange(ep.episodeNumber)}
      className={cn(
        'flex-shrink-0 px-4 py-2 rounded text-sm transition-colors',
        ep.episodeNumber === episodeNumber
          ? 'bg-primary-500 text-white font-medium'
          : 'bg-drama-surface text-drama-muted hover:text-drama-text hover:bg-drama-surface/80'
      )}
    >
      <span>{ep.episodeNumber}</span>
      <span className="text-xs ml-1 opacity-70">{ep.title}</span>
    </button>
  ))}
</div>
```

- [ ] **Step 2: 验证编译通过**

---

## Task 37: 选集分组+自动滚动

**Files:**
- Modify: `frontend/src/app/drama/[id]/play/page.tsx`

**问题:** 多集时无分组，当前集不在视野内。

- [ ] **Step 1: 当前集自动滚动到可见区域**

```tsx
// play/page.tsx 添加 ref
const episodeScrollRef = useRef<HTMLDivElement>(null);

// useEffect 自动滚动到当前集
useEffect(() => {
  if (!episodeScrollRef.current) return;
  const activeBtn = episodeScrollRef.current.querySelector('[data-active="true"]');
  activeBtn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
}, [episodeNumber]);

// 选集容器添加 ref
<div ref={episodeScrollRef} className="flex gap-2 overflow-x-auto scrollbar-hidden pb-2">
  {/* ... */}
  <button data-active={ep.episodeNumber === episodeNumber} ...>
```

- [ ] **Step 2: 验证编译通过**

---

## Task 38: 画中画模式

**Files:**
- Modify: `frontend/src/components/VideoPlayer.tsx`

**问题:** 不支持 PiP 模式，切后台即停止播放。

- [ ] **Step 1: 添加画中画按钮和逻辑**

```tsx
// VideoPlayer.tsx 新增
import { PictureInPicture2 } from 'lucide-react';

const togglePiP = useCallback(async () => {
  const video = videoRef.current;
  if (!video) return;
  try {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else {
      await video.requestPictureInPicture();
    }
  } catch (err) {
    console.warn('PiP not supported');
  }
}, []);

// 控制栏添加 PiP 按钮（在全屏按钮前）
<button onClick={togglePiP} className="text-white hover:text-primary-400 transition-colors" title="画中画">
  <PictureInPicture2 className="w-5 h-5" />
</button>
```

- [ ] **Step 2: 验证编译通过**

---

## Task 39: 预加载下一集

**Files:**
- Modify: `frontend/src/app/drama/[id]/play/page.tsx`

**问题:** 无预加载，切换集数有等待。

- [ ] **Step 1: 当前集播放到80%时预加载下一集视频**

```tsx
// play/page.tsx 添加预加载逻辑
const preloadedRef = useRef<Set<number>>(new Set());

useEffect(() => {
  if (!drama || !episode) return;
  const progress = currentTimeMs / (episode.durationSeconds * 1000);
  if (progress > 0.8 && episodeNumber < drama.totalEpisodes) {
    const nextEp = episodeNumber + 1;
    if (!preloadedRef.current.has(nextEp)) {
      preloadedRef.current.add(nextEp);
      // 使用 link preload 预加载
      const nextEpInfo = drama.episodes?.find((e: any) => e.episodeNumber === nextEp);
      if (nextEpInfo?.videoUrl) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = resolveUrl(nextEpInfo.videoUrl);
        link.as = 'video';
        document.head.appendChild(link);
      }
    }
  }
}, [currentTimeMs, drama, episode, episodeNumber]);
```

- [ ] **Step 2: 验证编译通过**

---

## Task 40: 锁屏模式

**Files:**
- Modify: `frontend/src/components/VideoPlayer.tsx`

**问题:** 无防误触锁定，全屏时容易误操作。

- [ ] **Step 1: 添加锁屏状态和按钮**

```tsx
// VideoPlayer.tsx 新增
const [locked, setLocked] = useState(false);

// 锁屏按钮（控制栏左侧）
<button
  onClick={() => setLocked(!locked)}
  className={`text-white hover:text-primary-400 transition-colors ${locked ? 'text-primary-400' : ''}`}
  title={locked ? '解锁' : '锁定'}
>
  {locked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
</button>
```

- [ ] **Step 2: 锁屏时隐藏其他控件，只显示解锁按钮**

```tsx
// 控制栏区域
{!locked && (
  <>
    {/* 进度条 + 播放控制等 */}
  </>
)}

{/* 锁屏时只显示解锁按钮 */}
{locked && (
  <div className="absolute left-4 top-1/2 -translate-y-1/2 z-30">
    <button onClick={() => setLocked(false)} className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-primary-400">
      <Unlock className="w-5 h-5" />
    </button>
  </div>
)}
```

- [ ] **Step 3: 添加 Lock/Unlock 图标导入**

```tsx
import { Play, Pause, ..., Lock, Unlock } from 'lucide-react';
```

- [ ] **Step 4: 验证编译通过**

---

## Task 41: 字幕支持

**Files:**
- Modify: `frontend/src/components/VideoPlayer.tsx`

**问题:** 无字幕轨道支持。

**说明:** 字幕支持需要后端提供字幕文件（SRT/VTT），当前后端未提供此API。此任务仅做前端预留，添加字幕渲染层。

- [ ] **Step 1: 添加字幕渲染层**

```tsx
// VideoPlayer.tsx 新增
interface SubtitleCue {
  startTime: number;
  endTime: number;
  text: string;
}

// 字幕显示（预留，数据从 props 传入）
{currentTime > 0 && (
  <div className="absolute bottom-12 left-0 right-0 text-center pointer-events-none z-5">
    <span className="inline-block px-3 py-1 bg-black/60 text-white text-sm rounded">
      {/* 字幕内容将从此处渲染 */}
    </span>
  </div>
)}
```

由于后端暂无字幕API，此任务标记为**预留**，不实际渲染字幕内容。

- [ ] **Step 2: 验证编译通过**

---

## Task 42: 新手引导

**Files:**
- Modify: `frontend/src/app/page.tsx`

**问题:** 首次使用无功能引导。

- [ ] **Step 1: 添加首次访问引导提示**

使用 localStorage 记录是否已展示引导：

```tsx
// page.tsx 添加
const [showGuide, setShowGuide] = useState(false);

useEffect(() => {
  const shown = localStorage.getItem('guide-shown');
  if (!shown) setShowGuide(true);
}, []);

// 引导弹窗
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
```

- [ ] **Step 2: 验证编译通过**

---

## Task 43: 排行榜

**Files:**
- Create: `frontend/src/app/ranking/page.tsx`
- Modify: `frontend/src/components/Header.tsx`（添加入口）

**问题:** 无热门/评分排行页面。

- [ ] **Step 1: 创建排行榜页面**

利用已有的 `/api/drama/hot` 和 `/api/drama/recommend` 接口：

```tsx
// frontend/src/app/ranking/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Trophy, Flame, Star } from 'lucide-react';
import { getHotDramas, getRecommendedDramas } from '@/lib/api-client';
import DramaCard from '@/components/DramaCard';
import type { Drama } from '@/lib/types';

const TABS = [
  { key: 'hot', label: '热播榜', icon: Flame },
  { key: 'rating', label: '好评榜', icon: Star },
];

export default function RankingPage() {
  const [tab, setTab] = useState('hot');
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetcher = tab === 'hot' ? getHotDramas : getRecommendedDramas;
    fetcher(0, 20)
      .then((res: any) => setDramas(res?.content || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Trophy className="w-6 h-6 text-amber-400" />
        <h1 className="text-xl font-bold text-drama-text">排行榜</h1>
      </div>

      <div className="flex gap-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm transition-colors ${
                tab === t.key ? 'bg-primary-500 text-white' : 'bg-drama-surface text-drama-muted hover:text-drama-text'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-drama-card animate-pulse aspect-video" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {dramas.map((d, i) => (
            <div key={d.id} className="relative">
              {i < 3 && (
                <span className={`absolute top-1 left-1 z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                  i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : 'bg-amber-700'
                }`}>
                  {i + 1}
                </span>
              )}
              <DramaCard drama={d} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Header 添加排行榜入口**

- [ ] **Step 3: 验证编译通过**

---

## Task 44: AI面板引导优化

**Files:**
- Modify: `frontend/src/app/drama/[id]/play/page.tsx`

**问题:** AI面板展开/收起无动画，结果展示简陋。

- [ ] **Step 1: 添加展开/收起过渡动画**

```tsx
// play/page.tsx AI面板区域修改
<div className={`overflow-hidden transition-all duration-300 ${showAiPanel ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
  <div className="mt-3 space-y-3">
    {/* AI 面板内容 */}
  </div>
</div>
```

- [ ] **Step 2: AI结果添加打字机效果**

```tsx
// 简单的打字机效果
const [displayedResult, setDisplayedResult] = useState('');
const [isTyping, setIsTyping] = useState(false);

useEffect(() => {
  if (!aiResult) { setDisplayedResult(''); return; }
  setIsTyping(true);
  let i = 0;
  const timer = setInterval(() => {
    if (i < aiResult.length) {
      setDisplayedResult(aiResult.slice(0, i + 1));
      i++;
    } else {
      clearInterval(timer);
      setIsTyping(false);
    }
  }, 30);
  return () => clearInterval(timer);
}, [aiResult]);

// 渲染
{displayedResult && (
  <div className="bg-drama-surface rounded-lg p-3 text-sm text-drama-text/90 whitespace-pre-wrap leading-relaxed">
    {displayedResult}
    {isTyping && <span className="animate-pulse">|</span>}
  </div>
)}
```

- [ ] **Step 3: 验证编译通过**

---

## Task 45: 搜索自动补全

**Files:**
- Modify: `frontend/src/app/search/page.tsx`

**问题:** 输入时无下拉建议。

- [ ] **Step 1: 添加搜索建议下拉**

利用已有的 `searchDramas` API，在用户输入时显示前5条匹配结果：

```tsx
// search/page.tsx 新增
const [suggestions, setSuggestions] = useState<Drama[]>([]);
const [showSuggestions, setShowSuggestions] = useState(false);

// 修改防抖 useEffect
useEffect(() => {
  if (timerRef.current) clearTimeout(timerRef.current);
  if (!keyword.trim()) {
    setResults([]);
    setSearched(false);
    setSuggestions([]);
    return;
  }
  timerRef.current = setTimeout(async () => {
    // 搜索建议（取前5条）
    try {
      const data = await searchDramas(keyword.trim());
      const list = Array.isArray(data) ? data : (data?.content || []);
      setSuggestions(list.slice(0, 5));
      setShowSuggestions(true);
    } catch {}
  }, 200);

  // 完整搜索（300ms 防抖）
  timerRef.current = setTimeout(() => {
    doSearch(keyword);
  }, 300);
  return () => { if (timerRef.current) clearTimeout(timerRef.current); };
}, [keyword, doSearch]);

// 搜索框下方显示建议
{showSuggestions && suggestions.length > 0 && !searched && (
  <div className="absolute top-full left-0 right-0 mt-1 bg-drama-card border border-drama-border rounded-lg shadow-xl z-20 overflow-hidden">
    {suggestions.map((d) => (
      <Link
        key={d.id}
        href={`/drama/${d.id}`}
        className="flex items-center gap-3 px-4 py-2.5 hover:bg-drama-surface transition-colors"
        onClick={() => { setShowSuggestions(false); saveSearchHistory(d.title); }}
      >
        <img src={resolveUrl(d.coverUrl)} alt="" className="w-10 h-7 rounded object-cover" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-drama-text truncate">{d.title}</p>
          <p className="text-xs text-drama-muted">{d.category} · {d.totalEpisodes}集</p>
        </div>
      </Link>
    ))}
  </div>
)}
```

- [ ] **Step 2: 点击外部关闭建议列表**

- [ ] **Step 3: 验证编译通过**

---

## Task 46: 注册后引导

**Files:**
- Modify: `frontend/src/app/register/page.tsx`

**问题:** 注册后直接跳首页，无引导流程。

- [ ] **Step 1: 注册成功后显示欢迎弹窗**

```tsx
// register/page.tsx 修改 handleSubmit
try {
  const data = await register(username.trim(), password, nickname.trim());
  setAuth(data.token, data.userId || data.user?.id);
  const user = await getMe();
  setUser(user);

  // 显示欢迎弹窗而非直接跳转
  setShowWelcome(true);
} catch ...

// 欢迎弹窗
const [showWelcome, setShowWelcome] = useState(false);

{showWelcome && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div className="bg-drama-card rounded-xl p-6 mx-4 max-w-sm w-full border border-drama-border/50 shadow-xl text-center">
      <div className="text-4xl mb-3">🎉</div>
      <h3 className="text-lg font-medium text-drama-text mb-2">注册成功！</h3>
      <p className="text-sm text-drama-muted mb-5">欢迎加入短剧TV，开始你的互动追剧之旅</p>
      <div className="space-y-2">
        <Link href="/" className="block w-full py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          onClick={() => setShowWelcome(false)}>
          开始浏览
        </Link>
        <Link href="/eggs" className="block w-full py-2.5 bg-drama-surface text-drama-text rounded-lg hover:bg-drama-border transition-colors"
          onClick={() => setShowWelcome(false)}>
          查看彩蛋图鉴
        </Link>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 2: 验证编译通过**

---

## Task 47: 个人资料编辑

**Files:**
- Modify: `frontend/src/app/profile/page.tsx`
- Create: `frontend/src/app/profile/edit/page.tsx`

**问题:** 头像/昵称不可修改。

**说明:** 后端目前没有用户资料更新API，此任务仅做前端UI预留。

- [ ] **Step 1: 个人中心头像区域添加编辑入口**

```tsx
// profile/page.tsx 头像区域添加编辑按钮
<div className="relative inline-block">
  {user?.avatarUrl ? (
    <img src={user.avatarUrl} alt={user.nickname} className="w-16 h-16 rounded-full object-cover border-2 border-primary-500/20" />
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
```

- [ ] **Step 2: 创建编辑页面（UI预留）**

```tsx
// frontend/src/app/profile/edit/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Pencil } from 'lucide-react';
import { useAuthStore } from '@/lib/auth';

export default function EditProfilePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    // TODO: 调用后端更新API
    setTimeout(() => {
      setSaving(false);
      router.back();
    }, 1000);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/profile" className="text-drama-muted hover:text-drama-text">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-drama-text">编辑资料</h1>
      </div>

      <div className="bg-drama-card rounded-lg p-6 border border-drama-border/50 space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-500/10 flex items-center justify-center">
            <User className="w-8 h-8 text-primary-500" />
          </div>
          <button className="text-sm text-primary-500 hover:text-primary-400">
            更换头像
          </button>
        </div>

        <div>
          <label className="block text-sm text-drama-muted mb-1.5">昵称</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full px-4 py-3 bg-drama-surface border border-drama-border rounded-lg text-drama-text focus:outline-none focus:border-primary-500 transition-colors"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 验证编译通过**

---

## 验证步骤

每个 Task 完成后：
1. 运行 `cd frontend && npx next build` 确认编译无错误
2. 关键改动在浏览器/模拟器中手动验证
3. 全部 Task 完成后运行 `cd backend && mvnw clean compile -DskipTests` 确认后端无影响

---

## 假设与决策

1. **后端不动**：所有优化仅涉及前端，除非明确需要新增后端API（Task 41字幕、Task 47资料编辑为预留）
2. **渐进实施**：按 Task 21-47 顺序实施，每个 Task 独立可验证
3. **Tailwind 优先**：UI 样式使用现有 Tailwind 类名体系，不引入新 CSS 框架
4. **移动端优先**：所有改动优先考虑移动端体验，桌面端作为增强
5. **不破坏现有功能**：每个改动保持向后兼容，不改变现有 API 接口
6. **localStorage 持久化**：弹幕设置、引导状态等使用 localStorage，不引入新状态管理
