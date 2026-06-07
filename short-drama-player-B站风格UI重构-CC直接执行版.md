---
AIGC:
    Label: "1"
    ContentProducer: 001191110102MACQD9K64018705
    ProduceID: 3893789529999548_0/project_7646276768982335753-files/short-drama-player-B站风格UI重构-CC直接执行版.md
    ReservedCode1: ""
    ContentPropagator: 001191110102MACQD9K64028705
    PropagateID: 3893789529999548#1780827005234
    ReservedCode2: ""
---
# B站风格前端UI重构——Claude Code 直接执行版

> 项目路径: C:\Users\wang\short-drama-player
> 执行方式: 分3批喂入，每批开头 `/plan`，每批结尾 `/compact`，每完成关键文件 `git commit`
> 原则: 不删除现有功能，只改视觉层。先读再改，不猜。

---

# ===== 第一批：基础设施（CSS变量 + 全局样式 + 导航栏 + Grid卡片） =====

/plan
我要把短剧前端从"简陋原型"升级为"B站级视频平台质感"。
策略：新建 variables.css 放所有设计token，然后逐步改 style.css、player页、clip-flow页。
不删功能，只改视觉。先做基础设施和首页。

## 步骤1：创建 variables.css

创建文件 `frontend/css/variables.css`，内容如下（完整复制）：

```css
/* ===== B站风格设计Token ===== */
:root {
    /* ===== 品牌色 ===== */
    --brand-pink: #FB7299;
    --brand-pink-hover: #FC8BAB;
    --brand-pink-active: #E85680;
    --brand-pink-10: rgba(251,114,153,0.1);
    --brand-pink-20: rgba(251,114,153,0.2);
    --brand-pink-30: rgba(251,114,153,0.3);
    --brand-blue: #23ADE5;
    --brand-blue-hover: #4BBDE9;

    /* ===== 背景色(亮色) ===== */
    --bg-base: #F4F5F7;
    --bg-card: #FFFFFF;
    --bg-elevated: #FFFFFF;
    --bg-hover: #F1F2F3;
    --bg-active: #E3E5E7;
    --bg-overlay: rgba(0,0,0,0.5);

    /* ===== 背景色(暗色) ===== */
    --bg-base-dark: #17181A;
    --bg-card-dark: #222325;
    --bg-elevated-dark: #2C2D2F;
    --bg-hover-dark: #2F3032;
    --bg-active-dark: #3A3B3D;

    /* ===== 文字色 ===== */
    --text-primary: #18191C;
    --text-secondary: #61666D;
    --text-tertiary: #9499A0;
    --text-link: #FB7299;
    --text-white: #FFFFFF;

    /* ===== 边框/分割线 ===== */
    --border-line: #E3E5E7;
    --border-line-dark: #363738;

    /* ===== 圆角 ===== */
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-xl: 16px;
    --radius-full: 9999px;

    /* ===== 阴影 ===== */
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
    --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
    --shadow-lg: 0 8px 24px rgba(0,0,0,0.12);
    --shadow-card-hover: 0 6px 20px rgba(0,0,0,0.12);
    --shadow-float: 0 12px 32px rgba(0,0,0,0.16);

    /* ===== 毛玻璃 ===== */
    --glass-filter: blur(20px) saturate(180%);
    --glass-bg: rgba(255,255,255,0.72);
    --glass-bg-dark: rgba(34,35,37,0.78);
    --glass-border: rgba(255,255,255,0.18);

    /* ===== 动画 ===== */
    --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
    --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
    --duration-fast: 150ms;
    --duration-normal: 250ms;
    --duration-slow: 400ms;

    /* ===== 间距 ===== */
    --space-xs: 4px;
    --space-sm: 8px;
    --space-md: 16px;
    --space-lg: 24px;
    --space-xl: 32px;
    --space-2xl: 48px;

    /* ===== 字体 ===== */
    --font-family: "PingFang SC", "HarmonyOS Sans SC", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif;
    --font-mono: "SF Mono", "Fira Code", "Consolas", monospace;

    /* ===== 尺寸 ===== */
    --nav-height: 64px;
    --card-min-width: 240px;
    --page-max-width: 1440px;
    --page-padding: 20px;
}

/* 暗色主题 */
[data-theme="dark"] {
    --bg-base: #17181A;
    --bg-card: #222325;
    --bg-elevated: #2C2D2F;
    --bg-hover: #2F3032;
    --bg-active: #3A3B3D;
    --text-primary: #E6E6E6;
    --text-secondary: #999999;
    --text-tertiary: #666666;
    --border-line: #363738;
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.2);
    --shadow-md: 0 4px 12px rgba(0,0,0,0.3);
    --shadow-lg: 0 8px 24px rgba(0,0,0,0.4);
    --shadow-card-hover: 0 6px 20px rgba(0,0,0,0.35);
}
```

## 步骤2：修改 index.html 引入 variables.css

读当前 index.html：
```
cat frontend/index.html
```

在 `<head>` 中所有 `<link rel="stylesheet">` 标签的**最前面**，加这一行：
```html
    <link rel="stylesheet" href="css/variables.css">
```

确保 variables.css 在 style.css 之前引入。

## 步骤3：修改 player.html 引入 variables.css

读当前 player.html：
```
cat frontend/player.html
```

同样在 `<head>` 中所有 CSS link 之前加：
```html
    <link rel="stylesheet" href="css/variables.css">
```

## 步骤4：修改 clip-flow.html 引入 variables.css（如果该文件存在）

```
ls frontend/clip-flow.html
```

如果存在，读它并在 CSS link 最前面加：
```html
    <link rel="stylesheet" href="css/variables.css">
```

## 步骤5：重写 style.css 的全局基础样式

读当前 style.css：
```
cat frontend/css/style.css
```

找到 `body` 和 `html` 相关的全局样式，把旧的硬编码颜色全部替换。在 style.css 的**最开头**（所有选择器之前）加入以下内容：

```css
/* ===== 全局基础 ===== */
html {
    scroll-behavior: smooth;
}

body {
    font-family: var(--font-family);
    background: var(--bg-base);
    color: var(--text-primary);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    margin: 0;
    padding: 0;
}

a {
    color: var(--text-link);
    text-decoration: none;
    transition: color var(--duration-fast);
}
a:hover {
    color: var(--brand-pink-hover);
}

/* 通用文字截断 */
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
}
.line-clamp-1 {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* 通用标题 */
h1 { font-size: 24px; font-weight: 700; line-height: 1.3; }
h2 { font-size: 20px; font-weight: 600; line-height: 1.4; }
h3 { font-size: 16px; font-weight: 600; line-height: 1.4; }
small, .text-sm { font-size: 12px; color: var(--text-tertiary); }
```

然后把 style.css 中所有旧的硬编码颜色值做以下全局替换（用编辑器的查找替换）：

| 旧值 | 新值 | 说明 |
|------|------|------|
| `#ff4757` | `var(--brand-pink)` | 正红→品牌粉 |
| `#ff6b81` | `var(--brand-pink-hover)` | 浅红→粉色hover |
| `#e84118` | `var(--brand-pink-active)` | 深红→粉色active |
| `#000000` / `#000` (body背景) | `var(--bg-base)` | 纯黑→浅灰底 |
| `#1a1a2e` / `#16213e` (深色背景) | `var(--bg-card)` | 深色→白卡片 |
| `#ffffff` / `#fff` (卡片背景) | `var(--bg-card)` | 硬编码白→变量 |
| `#eee` / `#cccccc` (次要文字) | `var(--text-secondary)` | 灰文字→变量 |
| `#999` / `#888` (辅助文字) | `var(--text-tertiary)` | 浅灰文字→变量 |
| `border-radius: 24px` | `border-radius: var(--radius-lg)` | 过大圆角→12px |
| `border-radius: 20px` | `border-radius: var(--radius-lg)` | 过大圆角→12px |

**注意**：不要把 `#000` 替换到 `box-shadow` 或渐变中的颜色，只替换背景色和文字色。用你的判断力，不确定的保留原值。

## 步骤6：重写导航栏样式

在 style.css 中找到导航栏相关样式（`.nav` / `#nav` / `header` / `.header` 等），替换为以下 B站毛玻璃风格：

```css
/* ===== 导航栏 - B站毛玻璃风格 ===== */
.nav,
header,
#nav {
    position: sticky;
    top: 0;
    z-index: 100;
    height: var(--nav-height);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--page-padding);
    background: var(--glass-bg);
    backdrop-filter: var(--glass-filter);
    -webkit-backdrop-filter: var(--glass-filter);
    border-bottom: 1px solid var(--border-line);
    transition: box-shadow var(--duration-normal);
}

/* 滚动时加阴影（JS配合） */
.nav.scrolled,
header.scrolled {
    box-shadow: var(--shadow-md);
}

/* Logo */
.nav .logo,
.nav .brand,
header h1 {
    font-size: 20px;
    font-weight: 700;
    color: var(--brand-pink);
    letter-spacing: -0.5px;
}

/* 导航链接 */
.nav a,
header nav a {
    color: var(--text-secondary);
    font-size: 14px;
    padding: 6px 12px;
    border-radius: var(--radius-full);
    transition: all var(--duration-fast) var(--ease-out);
}
.nav a:hover,
header nav a:hover {
    color: var(--brand-pink);
    background: var(--brand-pink-10);
}

/* 搜索框 */
.search-box,
input[type="search"],
input[type="text"].search {
    border: 2px solid var(--border-line);
    border-radius: var(--radius-full);
    padding: 8px 16px;
    font-size: 14px;
    background: var(--bg-card);
    color: var(--text-primary);
    outline: none;
    transition: all var(--duration-fast) var(--ease-out);
    width: 240px;
}
.search-box:focus,
input[type="search"]:focus {
    border-color: var(--brand-pink);
    box-shadow: 0 0 0 3px var(--brand-pink-20);
}
```

然后在 `frontend/js/main.js` 的末尾加导航栏滚动阴影逻辑（如果还没有的话）：

```javascript
// 导航栏滚动加阴影
const nav = document.querySelector('.nav, header, #nav');
if (nav) {
    window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });
}
```

## 步骤7：重写剧列表为B站Grid卡片

在 style.css 中找到剧列表/卡片相关的样式（`.drama-list` / `.drama-grid` / `.card` / `.drama-card` 等），替换核心布局和卡片样式：

```css
/* ===== 剧列表Grid - B站风格 ===== */
.drama-grid,
.drama-list,
.grid-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 20px;
    padding: var(--space-lg) var(--page-padding);
    max-width: var(--page-max-width);
    margin: 0 auto;
}

/* ===== 视频卡片 - B站风格 ===== */
.drama-card,
.card,
.video-card {
    background: var(--bg-card);
    border-radius: var(--radius-lg);
    overflow: hidden;
    cursor: pointer;
    transition: all var(--duration-normal) var(--ease-out);
    box-shadow: var(--shadow-sm);
}

.drama-card:hover,
.card:hover,
.video-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-card-hover);
}

/* 封面区 */
.card-cover,
.drama-card .cover,
.video-card img {
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    display: block;
    background: var(--bg-hover);
}

/* 时长角标 */
.duration-badge,
.time-badge {
    position: absolute;
    bottom: 8px;
    right: 8px;
    background: rgba(0,0,0,0.75);
    color: #fff;
    font-size: 12px;
    padding: 1px 6px;
    border-radius: var(--radius-sm);
    font-family: var(--font-mono);
}

/* 卡片信息区 */
.card-info,
.drama-card .info {
    padding: 12px 14px 16px;
}

.card-title,
.drama-card .title,
.video-card h3 {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    line-height: 1.4;
    margin: 0 0 6px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.card-meta,
.drama-card .meta {
    font-size: 12px;
    color: var(--text-tertiary);
    display: flex;
    align-items: center;
    gap: 4px;
}

/* 播放量图标 */
.play-count::before {
    content: "▶ ";
    font-size: 10px;
}
```

**重要**：上面选择器写了好几个（`.drama-card, .card, .video-card`），你需要读一下实际HTML用的class名，只保留匹配的那一组。不确定就全留着，CSS多写不影响。

## 步骤8：如果卡片HTML结构需要调整

读 index.html 中的卡片列表区域：
```
cat frontend/index.html
```

看卡片的结构。如果封面没有包在相对定位容器里（时长角标需要absolute定位），给封面容器加 `position: relative`。

如果封面容器没有包装div，在 style.css 里给封面的父元素加：
```css
.drama-card .cover-wrap,
.card .thumb {
    position: relative;
    overflow: hidden;
}
```

## 步骤9：提交第一批

```bash
cd C:\Users\wang\short-drama-player
git add -A
git commit -m "refactor(ui): B站风格基础设施 - variables.css + 导航栏毛玻璃 + Grid卡片 + 全局颜色替换"
```

/compact

---
---

# ===== 第二批：组件规范（分类Tab + 按钮 + 播放器页 + 互动样式） =====

## 步骤10：重写分类标签/Tab样式

在 style.css 中找到分类/标签/tab相关样式（`.category` / `.tag` / `.tab` / `.filter` 等），替换为：

```css
/* ===== 分类标签Tab - B站风格 ===== */
.category-bar,
.tag-bar,
.tab-bar,
.filter-bar {
    display: flex;
    gap: var(--space-md);
    overflow-x: auto;
    scrollbar-width: none;
    padding: var(--space-sm) var(--page-padding);
    max-width: var(--page-max-width);
    margin: 0 auto;
}
.category-bar::-webkit-scrollbar,
.tag-bar::-webkit-scrollbar,
.tab-bar::-webkit-scrollbar {
    display: none;
}

.category-bar button,
.tag-bar button,
.tab-bar button,
.tag-btn,
.filter-btn {
    flex-shrink: 0;
    padding: 6px 16px;
    border-radius: var(--radius-full);
    font-size: 14px;
    color: var(--text-secondary);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-out);
    white-space: nowrap;
    outline: none;
    position: relative;
}

.category-bar button:hover,
.tag-bar button:hover,
.filter-btn:hover {
    color: var(--brand-pink);
    background: var(--brand-pink-10);
}

.category-bar button.active,
.tag-bar button.active,
.filter-btn.active,
.tag-btn.active {
    color: var(--brand-pink);
    font-weight: 600;
}

/* 底部指示线 */
.category-bar button.active::after,
.tag-bar button.active::after,
.filter-btn.active::after {
    content: "";
    position: absolute;
    bottom: -2px;
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 2.5px;
    border-radius: 2px;
    background: var(--brand-pink);
}
```

## 步骤11：重写按钮系统

在 style.css 中找到按钮相关样式，在后面追加B站风格按钮（不删旧的，用更高优先级覆盖）：

```css
/* ===== 按钮系统 - B站风格 ===== */

/* 主按钮（粉色胶囊） */
.btn-primary,
button.primary,
.btn-pink {
    background: var(--brand-pink);
    color: #fff;
    border: none;
    border-radius: var(--radius-full);
    font-weight: 600;
    padding: 10px 24px;
    font-size: 14px;
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-out);
    outline: none;
}
.btn-primary:hover,
button.primary:hover,
.btn-pink:hover {
    background: var(--brand-pink-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px var(--brand-pink-20);
}
.btn-primary:active,
button.primary:active,
.btn-pink:active {
    background: var(--brand-pink-active);
    transform: translateY(0);
}

/* 幽灵按钮 */
.btn-ghost,
button.ghost {
    background: transparent;
    color: var(--brand-pink);
    border: 1.5px solid var(--brand-pink);
    border-radius: var(--radius-full);
    padding: 9px 22px;
    font-size: 14px;
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-out);
    outline: none;
}
.btn-ghost:hover,
button.ghost:hover {
    background: var(--brand-pink-10);
}

/* 文字按钮 */
.btn-text {
    background: none;
    color: var(--text-secondary);
    border: none;
    padding: 4px 8px;
    font-size: 14px;
    cursor: pointer;
    transition: color var(--duration-fast);
}
.btn-text:hover {
    color: var(--brand-pink);
}

/* 通用按钮弹性点击 */
button:active {
    transform: scale(0.96);
    transition: transform 0.1s;
}
```

## 步骤12：重写播放器页面样式

读当前播放器页面的样式（可能在 style.css 或单独的 player.css 里）：
```
cat frontend/css/style.css | grep -n "player\|\.play\|video\|progress\|control"
```

在 style.css 中找到播放器相关样式，替换/追加核心部分：

```css
/* ===== 播放器页面 - B站沉浸风格 ===== */
.player-page,
.player-container {
    background: #000;
    color: #fff;
    min-height: 100vh;
}

/* 视频区 */
.video-wrapper,
.player-wrap {
    position: relative;
    background: #000;
    max-width: 100%;
}

/* 控制栏 - 底部渐变 */
.player-controls,
.video-controls {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 12px 16px;
    background: linear-gradient(transparent, rgba(0,0,0,0.8));
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 10;
}

/* 控制按钮 - 圆形毛玻璃 */
.player-controls button,
.video-controls button {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(255,255,255,0.12);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: none;
    color: #fff;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--duration-fast);
}
.player-controls button:hover,
.video-controls button:hover {
    background: rgba(255,255,255,0.22);
}

/* 进度条 - 品牌粉 */
.progress-bar,
.seek-bar,
input[type="range"].progress {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 3px;
    background: rgba(255,255,255,0.2);
    border-radius: 2px;
    outline: none;
    cursor: pointer;
    transition: height 0.15s;
}
.progress-bar:hover,
.seek-bar:hover,
input[type="range"].progress:hover {
    height: 6px;
}
.progress-bar::-webkit-slider-thumb,
.seek-bar::-webkit-slider-thumb,
input[type="range"].progress::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--brand-pink);
    cursor: pointer;
    box-shadow: 0 0 4px rgba(0,0,0,0.3);
}

/* 剧名信息区 */
.drama-info-panel,
.episode-info {
    background: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.9));
    padding: var(--space-lg);
    color: #fff;
}
.drama-info-panel h2,
.episode-info h2 {
    font-size: 18px;
    font-weight: 700;
    text-shadow: 0 1px 4px rgba(0,0,0,0.5);
}
```

## 步骤13：更新 interaction.css 为B站风格

读当前 interaction.css：
```
cat frontend/css/interaction.css
```

在文件**末尾**追加以下B站风格覆盖（不删旧代码）：

```css
/* ===== 互动组件 - B站风格覆盖 ===== */

/* 弹幕 */
.danmaku-item {
    text-shadow: 1px 1px 2px rgba(0,0,0,0.6);
    opacity: 0.85;
    font-size: 16px;
    font-weight: 600;
}

/* 互动按钮组 */
.interaction-bar button,
.quick-bar button {
    background: rgba(255,255,255,0.12);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border-radius: 50%;
    border: none;
    color: #fff;
    transition: all var(--duration-fast) var(--ease-out);
}
.interaction-bar button:hover,
.quick-bar button:hover {
    background: rgba(255,255,255,0.22);
    transform: scale(1.1);
}

/* 投票/选择面板 */
.vote-panel,
.choice-panel,
.quiz-panel {
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-radius: var(--radius-xl);
    border: 1px solid rgba(255,255,255,0.1);
    padding: var(--space-lg);
}

.vote-option,
.choice-option {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: var(--radius-md);
    padding: 12px 16px;
    color: #fff;
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-out);
}
.vote-option:hover,
.choice-option:hover {
    background: var(--brand-pink-20);
    border-color: var(--brand-pink);
}

/* 点赞动画 */
.like-btn.liked,
.btn-like.liked {
    color: var(--brand-pink);
    animation: like-pop 0.3s var(--ease-spring);
}
@keyframes like-pop {
    0% { transform: scale(1); }
    50% { transform: scale(1.3); }
    100% { transform: scale(1); }
}

/* Emoji飘浮 */
.emoji-float {
    animation: emoji-rise 2s var(--ease-out) forwards;
}
@keyframes emoji-rise {
    0% { opacity: 1; transform: translateY(0) scale(1); }
    100% { opacity: 0; transform: translateY(-120px) scale(1.5); }
}
```

## 步骤14：提交第二批

```bash
cd C:\Users\wang\short-drama-player
git add -A
git commit -m "refactor(ui): B站风格组件 - 分类Tab + 按钮系统 + 播放器沉浸 + 互动样式"
```

/compact

---
---

# ===== 第三批：片段流B站化 + 动效 + 暗色主题 + 骨架屏 + 验证 =====

## 步骤15：clip-flow.css 替换品牌色

读当前 clip-flow.css：
```
cat frontend/css/clip-flow.css
```

做以下全局替换：

| 旧值 | 新值 | 说明 |
|------|------|------|
| `#ff4757` | `var(--brand-pink)` | 正红→品牌粉 |
| `#ff6b81` | `var(--brand-pink-hover)` | 浅红→粉色hover |

然后在 clip-flow.css 中找到导航栏区域，替换为毛玻璃：

```css
/* 替换 #clip-nav 原有样式 */
#clip-nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    background: var(--glass-bg-dark);
    backdrop-filter: var(--glass-filter);
    -webkit-backdrop-filter: var(--glass-filter);
    border-bottom: 1px solid rgba(255,255,255,0.08);
}
```

找到标签按钮样式，替换为：

```css
/* 替换 .tag-btn 原有样式 */
.tag-btn {
    flex-shrink: 0;
    padding: 4px 14px;
    border-radius: var(--radius-full);
    border: 1px solid rgba(255,255,255,0.2);
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.65);
    font-size: 13px;
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-out);
    outline: none;
}
.tag-btn:hover {
    color: #fff;
    background: var(--brand-pink-20);
    border-color: var(--brand-pink);
}
.tag-btn.active {
    background: var(--brand-pink);
    border-color: var(--brand-pink);
    color: #fff;
    font-weight: 600;
}
```

找到"从第1集看"按钮样式，替换为渐变粉：

```css
/* 替换 .btn-watch-full 原有样式 */
.btn-watch-full {
    flex: 1;
    padding: 13px 20px;
    border-radius: var(--radius-full);
    background: linear-gradient(135deg, var(--brand-pink), var(--brand-pink-hover));
    border: none;
    color: #fff;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 15px var(--brand-pink-30);
    outline: none;
    transition: all var(--duration-fast) var(--ease-out);
}
.btn-watch-full:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px var(--brand-pink-30);
}
.btn-watch-full:active {
    transform: scale(0.96);
}
```

找到进度条样式，把颜色改为品牌粉：
```css
/* 把 .clip-progress-bar 的 background 从 #ff4757 改为： */
.clip-progress-bar {
    background: var(--brand-pink);
}
```

找到 spinner 颜色，改为品牌粉：
```css
/* 把 .spinner 的 border-top-color 从 #ff4757 改为： */
.spinner {
    border-top-color: var(--brand-pink);
}
```

找到标签角标 `.clip-tag` 的样式，替换为6色映射：

```css
/* 替换 .clip-tag 原有样式 */
.clip-tag {
    display: inline-block;
    padding: 2px 10px;
    border-radius: var(--radius-sm);
    font-size: 11px;
    font-weight: 600;
    margin-bottom: 8px;
}
/* 标签6色映射 */
.clip-tag[data-tag="SWEET"],
.clip-tag.tag-SWEET { background: var(--brand-pink); color: #fff; }
.clip-tag[data-tag="THRILL"],
.clip-tag.tag-THRILL { background: #FF6633; color: #fff; }
.clip-tag[data-tag="FUNNY"],
.clip-tag.tag-FUNNY { background: #FFB027; color: #fff; }
.clip-tag[data-tag="SHOCK"],
.clip-tag.tag-SHOCK { background: var(--brand-blue); color: #fff; }
.clip-tag[data-tag="ANGRY"],
.clip-tag.tag-ANGRY { background: #F6465D; color: #fff; }
.clip-tag[data-tag="SAD"],
.clip-tag.tag-SAD { background: #7B67EE; color: #fff; }
```

**注意**：clip-player.js 中 render() 方法里 `.clip-tag` 的 HTML 需要加上 `data-tag` 属性。读 clip-player.js：
```
cat frontend/js/clip-player.js
```

找到 `<div class="clip-tag">` 那行，改为：
```html
<div class="clip-tag" data-tag="${this.clip.tag || ''}">${this.clip.tagLabel || ''}</div>
```

## 步骤16：添加全局动效

在 style.css 末尾追加：

```css
/* ===== 全局动效 ===== */

/* 卡片hover浮起 */
.drama-card,
.video-card,
.card {
    transition: transform var(--duration-normal) var(--ease-out),
                box-shadow var(--duration-normal) var(--ease-out);
}

/* 页面淡入 */
.page-enter {
    animation: fadeIn var(--duration-slow) var(--ease-out);
}
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

/* Toast通知底部滑入 */
.toast,
.notification {
    animation: slideUp 0.3s var(--ease-spring);
}
@keyframes slideUp {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

/* 骨架屏脉动 */
.skeleton {
    background: linear-gradient(90deg,
        var(--bg-hover) 25%,
        var(--bg-active) 50%,
        var(--bg-hover) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: var(--radius-md);
}
@keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

/* 通用 hover 上浮 */
.hover-lift {
    transition: transform var(--duration-normal) var(--ease-out);
}
.hover-lift:hover {
    transform: translateY(-4px);
}
```

## 步骤17：添加暗色主题切换功能

在 `frontend/js/main.js` 末尾追加：

```javascript
// ===== 暗色主题切换 =====
function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    html.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
    localStorage.setItem('theme', html.getAttribute('data-theme'));
}

// 初始化主题
(function initTheme() {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', saved || (prefersDark ? 'dark' : 'light'));
})();
```

然后在 index.html 和 player.html 的导航栏区域，加一个主题切换按钮。读 index.html 找到导航栏：
```
cat frontend/index.html
```

在导航栏的合适位置（比如右侧区域）加：
```html
<button onclick="toggleTheme()" title="切换主题" style="background:none;border:none;font-size:20px;cursor:pointer;padding:4px 8px;">🌙</button>
```

在 player.html 的合适位置也加上同样的按钮。

## 步骤18：给剧列表加骨架屏loading

在 style.css 中已经有了 `.skeleton` 样式（步骤16）。现在需要在 JS 里配合。

在 main.js 中找到加载剧列表的函数（可能是 `loadDramas` 或 `fetchDramas`），在发起请求前显示骨架屏，数据回来后替换。

大致模式（根据实际函数名调整）：
```javascript
// 在加载函数的开头：
const grid = document.querySelector('.drama-grid, .grid-container, #drama-list');
if (grid) {
    grid.innerHTML = Array(8).fill('').map(() =>
        '<div class="card"><div class="skeleton" style="aspect-ratio:16/9"></div><div style="padding:12px"><div class="skeleton" style="height:14px;width:80%;margin-bottom:8px"></div><div class="skeleton" style="height:12px;width:50%"></div></div></div>'
    ).join('');
}
// 数据回来后 grid.innerHTML = ... 正常渲染
```

## 步骤19：验证

启动后端：
```bash
cd C:\Users\wang\short-drama-player\backend
.\mvnw.cmd spring-boot:run
```

浏览器打开 http://localhost:8080/ （或 http://localhost:8080/index.html?list=true ）

检查项：
1. ✅ 页面底色是 #F4F5F7（浅灰），不再是纯黑
2. ✅ 导航栏毛玻璃效果，滚动有阴影
3. ✅ 剧列表是 auto-fill Grid 布局，卡片白底圆角
4. ✅ 卡片hover上浮4px + 阴影加深
5. ✅ 品牌色是 #FB7299（粉），不再是 #ff4757（红）
6. ✅ 分类Tab是透明底+粉色指示线，不是红底白字
7. ✅ 按钮是粉色胶囊，hover上浮，点击弹性
8. ✅ 播放器页面暗色背景，进度条品牌粉色
9. ✅ 互动面板圆角毛玻璃
10. ✅ 暗色主题切换按钮正常
11. ✅ 骨架屏loading有脉动动画
12. ✅ 点击🌙切换暗色/亮色正常，刷新后保持

## 步骤20：最终提交

```bash
cd C:\Users\wang\short-drama-player
git add -A
git commit -m "refactor(ui): B站风格前端重构完成

- variables.css: 完整设计token体系(品牌粉/毛玻璃/阴影/动画)
- 导航栏: 毛玻璃吸顶+滚动阴影
- 剧列表: auto-fill Grid + 白底圆角卡片 + hover上浮
- 分类Tab: 透明底+粉色指示线
- 按钮: 粉色胶囊+弹性点击
- 播放器: 暗色沉浸+粉色进度条+圆形毛玻璃控制按钮
- 互动: 毛玻璃面板+点赞弹性+emoji飘浮
- clip-flow: 品牌粉替换+6色标签+渐变CTA
- 动效: fadeIn/shimmer骨架屏/弹幕滑入/Toast上滑
- 暗色主题: data-theme切换+localStorage持久化"
git push
```

---

> 本内容由 Coze AI 生成，请遵循相关法律法规及《人工智能生成合成内容标识办法》使用与传播。
