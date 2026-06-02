---
AIGC:
    Label: "1"
    ContentProducer: 001191110102MACQD9K64018705
    ProduceID: 3893789529999548_0/project_7646276768982335753-files/short-drama-player-改动审查与加强清单.md
    ReservedCode1: ""
    ContentPropagator: 001191110102MACQD9K64028705
    PropagateID: 3893789529999548#1780373345491
    ReservedCode2: ""
---
# short-drama-player 改动审查与加强清单

> 基于 [wuchenxiaodao/short-drama-player](https://github.com/wuchenxiaodao/short-drama-player) 本地代码审查
> 审查时间：2026-06-01
> 对照需求：短剧列表+播放 / 内容互动 / 用户互动 / 服务部署

---

## 一、已完成的改动（对比原始项目）

### ✅ 基础架构（一轮P0-P3 全部落地）

| 项目 | 状态 | 证据 |
|------|------|------|
| JWT鉴权体系 | ✅ | JwtUtil/JwtFilter/SecurityConfig/AuthController 完整 |
| BCrypt密码加密 | ✅ | PasswordEncoder Bean + DataInitializer 使用 encode |
| AuthUtils鉴权工具 | ✅ | EpisodeController/OnlineController 均用 AuthUtils |
| InteractionOption拆表 | ✅ | 独立实体 + nextInteraction + feedbackText |
| BusinessException + GlobalExceptionHandler | ✅ | 全局异常处理 |
| 原子并发方法 | ✅ | DramaRepository.incrementViewCountBy、addPoints 等 |
| Redis计数攒10次同步 | ✅ | DramaService.incrementViewCountWithRedis + incrementViewCountBy |
| JWT密钥从配置读 | ✅ | @Value("${jwt.secret}") |

### ✅ 前端重构（重大改进）

| 项目 | 状态 | 说明 |
|------|------|------|
| 单页应用(SPA) | ✅ | 7个page：home/detail/search/player/eggs/login/mine |
| 模块化JS | ✅ | 拆成 app.js/player.js/interaction.js/api.js/state.js/theme.js/utils.js |
| 独立CSS文件 | ✅ | styles.css/player.css/interaction.css |
| 底部导航栏 | ✅ | 首页/我的 两个Tab |
| 轮播Banner | ✅ | 首页顶部自动轮播 |
| 主题切换 | ✅ | 暗色/亮色 + localStorage持久化 |
| 分类筛选 | ✅ | 动态加载分类Tab + 筛选接口 |
| 继续观看 | ✅ | 登录用户首页显示 |
| 评分UI | ✅ | 5星评分组件 + 评分统计 |
| 评论区 | ✅ | 短剧评论 + 点赞 |
| 弹幕系统 | ✅ | DanmakuSystem + CSS动画 |
| 搜索历史 | ✅ | localStorage + XSS已用escapeHtml |
| 收藏/追剧 | ✅ | 切换收藏 + 我的追剧列表 |
| 彩蛋图鉴 | ✅ | 收集进度 + 按剧分组 |
| 播放进度记忆 | ✅ | reportProgress + 恢复提示 |
| 倍速记忆 | ✅ | localStorage保存 |
| 视频错误提示 | ✅ | errorDisplay |
| 登录/注册 | ✅ | JWT Token + localStorage |
| 互动组件视觉 | ✅ | popIn动画/正确绿色脉冲/错误抖动/emoji雨 |
| "我的"页面 | ✅ | 积分/追剧/彩蛋/主题切换/退出登录 |

### ✅ 封面图（P4-1 已修复）

6部短剧全部使用本地 `/covers/clean_xxx.webp`，SecurityConfig 已放行 `/covers/**`。

### ✅ 互动分支后端（P4-2 部分修复）

- InteractionPoint 已有 `branchGroupId` 字段
- InteractionOption 已有 `nextInteraction` + `feedbackText`
- DataInitializer 使用 `buildChoiceWithBranches` 构建多级分支链路
- 前端 interaction.js 选择后设置 `this.pendingBranchId` + 过滤 `prerequisiteMet`

### ✅ 互动统计（需求3a）

- 后端 InteractionController `/api/interaction/{id}/stats` 已有
- 前端 `buildStatsHtml` 显示投票百分比柱状图
- Redis + DB 双通道统计

### ✅ 部署（需求4）

- docker-compose.yml 含 MySQL/Redis/Backend/Nginx 容器
- nginx.conf 含 SSL/视频流/WebSocket/API代理
- .env.example 已有
- Dockerfile 已有

### ✅ FavoriteController不再虚增浏览量

使用专用查询（dramaMap + ratingCountMap），不再调 getDetail。

---

## 二、仍然存在的问题与加强点

### 🔴 P0 — 核心体验断裂

---

#### 1. 互动分支前端逻辑不完整 — pendingBranchId 存了但没用

**现状：** interaction.js 第114行 `this.pendingBranchId = nextInteractionId;` 设置了分支ID，也做了 `prerequisiteMet = true` 的过滤。但 **player.js 的 `checkInteractionPoints` 没有读取 pendingBranchId 来过滤分支互动**。

**问题本质：** `prerequisite + prerequisiteChoiceOptionId` 的过滤逻辑只能保证"选了A才出现分支A的互动"，但如果互动点没有设 prerequisite（比如主线互动和分支互动在同一时间戳），两个会同时触发。`find()` 只取第一个，可能取到错误的互动。

**当前实际效果：** 由于 DataInitializer 的 `buildChoiceWithBranches` 正确设置了 prerequisite 链路，同一时间戳的分支互动只会触发对应的那个。**所以目前分支功能是能工作的**，但方式是"后端 prerequisite 过滤"，不是前端消费 branchId。

**加强建议：** player.js 的 checkInteractionPoints 应增加 branchGroupId 过滤作为双保险：

```javascript
// player.js — checkInteractionPoints 方法
checkInteractionPoints() {
    const currentTimeMs = Math.floor(this.currentTime * 1000);
    const point = this.interactionPoints.find(p => {
        if (Math.abs(p.timestampMs - currentTimeMs) >= 1000) return false;
        if (p.shown) return false;
        if (p.prerequisiteMet === false) return false;
        // 新增：branchGroupId 过滤
        // 如果互动点有 branchGroupId，必须匹配当前分支
        if (p.branchGroupId && interaction.pendingBranchId) {
            return p.branchGroupId === interaction.pendingBranchId;
        }
        // 如果互动点有 branchGroupId 但用户没有走分支，不触发
        if (p.branchGroupId && !interaction.pendingBranchId) {
            return false;
        }
        return true;
    });

    if (point) {
        point.shown = true;
        this.showInteraction(point);
    }
}
```

同时 InteractionPoint 的 branchGroupId 需要在 API 响应中返回（当前 InteractionPoint 实体已有此字段，但 JSON 序列化需确认是否输出）。

---

#### 2. 互动没有倒计时 — 用户可以无限思考

**现状：** 互动弹出后暂停视频，用户想多久就多久，毫无紧迫感。

**加强：** 给互动加10秒倒计时，超时自动关闭继续播放。

```javascript
// interaction.js — show 方法中添加倒计时
show(point) {
    this.currentPoint = point;
    // ... 现有逻辑
    
    this.startCountdown(10);
},

startCountdown(seconds) {
    this.countdown = seconds;
    const countdownEl = document.createElement('div');
    countdownEl.className = 'interaction-countdown';
    countdownEl.textContent = `${this.countdown}s`;
    document.querySelector('.interaction-popup').appendChild(countdownEl);
    
    this.countdownTimer = setInterval(() => {
        this.countdown--;
        countdownEl.textContent = `${this.countdown}s`;
        if (this.countdown <= 3) countdownEl.style.color = '#EF4444';
        if (this.countdown <= 0) {
            clearInterval(this.countdownTimer);
            this.autoSelect();
        }
    }, 1000);
},

autoSelect() {
    // 自动选第一个选项
    const firstBtn = document.querySelector('.interaction-option');
    if (firstBtn) {
        firstBtn.click();
    } else {
        this.close();
    }
},

close() {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    // ... 现有关闭逻辑
}
```

```css
/* interaction.css */
.interaction-countdown {
    text-align: center;
    font-size: 20px;
    font-weight: 700;
    color: var(--electric-purple, #8B5CF6);
    margin-top: 12px;
    animation: countdownPulse 1s ease infinite;
}
@keyframes countdownPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
}
```

---

### 🟡 P1 — 功能缺失或不够

---

#### 3. 没有AI剧情生成能力（需求2b核心）

**现状：** 需求要求"基于剧情高光、选项、用户输入Prompt等，生成个性化的短剧内容"，项目完全缺失。

**加强方案：** 新建 AIStoryController + AIStoryService + GeneratedStory 实体。支持：
- 用户做出选择后生成后续剧情文本
- 剧尾续写功能（用户输入Prompt驱动）
- 无API Key时返回演示模式文本（零依赖可演示）

详细代码见四轮改进指南 §2b.2。

---

#### 4. 剧集没有"已看完"标记

**现状：** `loadEpisodes` 中只检查 `watchPositionMs > 0` 加了 `episode-watched` 样式（小圆点），但没有明确文字标记，且判断逻辑只是"看过"而非"看完"。

**加强：**

```javascript
// app.js — loadEpisodes 中修改
loadEpisodes(drama) {
    const container = document.getElementById('episode-grid');
    const episodes = drama.episodes || [];
    // ...
    container.innerHTML = episodes.map(ep => {
        const hasProgress = ep.watchPositionMs && ep.watchPositionMs > 0;
        // 判断是否看完：进度>90%或后端返回completed标记
        const isCompleted = ep.completed || (hasProgress && ep.durationSeconds 
            && ep.watchPositionMs / (ep.durationSeconds * 1000) > 0.9);
        return `
        <div class="episode-item ${isCompleted ? 'episode-completed' : (hasProgress ? 'episode-watching' : '')}" 
             onclick="app.playEpisode(${ep.id})">
            <span class="episode-number">${ep.episodeNumber}</span>
            <span class="episode-title">${ep.title || '第' + ep.episodeNumber + '集'}</span>
            ${isCompleted ? '<span class="episode-status completed">✓</span>' : ''}
            ${hasProgress && !isCompleted ? '<span class="episode-status watching">▸</span>' : ''}
        </div>`;
    }).join('');
}
```

```css
.episode-status.completed { color: #10B981; font-size: 12px; }
.episode-status.watching { color: #F59E0B; font-size: 12px; }
.episode-completed { opacity: 0.7; }
```

---

#### 5. VOTE类型互动选择后显示统计但关闭后再也看不到

**现状：** 投票后显示百分比柱状图，但关闭弹窗后数据丢失。无法回顾。

**加强：** 已投票的互动点在 `checkInteractionPoints` 中不重复弹出，但在互动点时间位置显示一个小图标，点击可查看统计：

```javascript
// player.js — checkInteractionPoints 中
// 已回答的互动点显示小标记
if (point.shown && !point.markerShown) {
    point.markerShown = true;
    this.showInteractionMarker(point);
}
```

```javascript
showInteractionMarker(point) {
    const marker = document.createElement('div');
    marker.className = 'interaction-marker';
    marker.textContent = '💬';
    marker.style.cssText = `position:absolute;right:8px;top:${30 + Math.random()*30}%;
        font-size:18px;cursor:pointer;z-index:5;opacity:0.7;transition:opacity 0.2s;`;
    marker.onclick = () => this.showInteraction(point);
    const container = document.getElementById('player-container');
    container.style.position = 'relative';
    container.appendChild(marker);
}
```

---

#### 6. 互动分支只有2级深度，没有"影响最终结局"

**现状：** `buildChoiceWithBranches` 只构建1级分支（选择→分支互动），分支选择后不会再产生新分支。

**加强：** 在 DataInitializer 中构建至少1条3级分支链路，让用户感受到"选择真正影响剧情走向"：

```
选择1（15s）→ 分支A（30s）→ 分支A1（45s）→ 最终结果A
                        → 分支A2（45s）→ 最终结果B
          → 分支B（30s）→ 分支B1（45s）→ 最终结果C
                        → 分支B2（45s）→ 最终结果D
```

---

#### 7. 没有剧集自动播放下一集的过渡UI

**现状：** `onVideoEnded` 直接调用 `app.playEpisode`，没有过渡动画或用户确认。

**加强：** 视频结束后显示"下一集"卡片，3秒倒计时自动播放：

```javascript
onVideoEnded() {
    this.reportProgress();
    const drama = state.currentDrama;
    const currentEp = state.currentEpisode;
    if (!drama || !currentEp) return;

    const episodes = drama.episodes || [];
    const currentId = currentEp.episodeId || currentEp.id;
    const currentIndex = episodes.findIndex(ep => ep.id === currentId);
    
    if (currentIndex >= 0 && currentIndex < episodes.length - 1) {
        this.showNextEpisodeCard(episodes[currentIndex + 1], currentIndex + 1);
    } else {
        this.showLastEpisodeCard(drama);
    }
}

showNextEpisodeCard(nextEp, epNum) {
    const card = document.createElement('div');
    card.className = 'next-episode-card';
    card.innerHTML = `
        <div class="next-info">
            <span>下一集</span>
            <h3>第${epNum}集</h3>
            <span class="next-countdown" id="next-countdown">3秒后自动播放</span>
        </div>
        <div class="next-actions">
            <button onclick="this.closest('.next-episode-card').remove();">取消</button>
            <button onclick="app.playEpisode(${nextEp.id}); this.closest('.next-episode-card').remove();">立即播放</button>
        </div>
    `;
    document.querySelector('.player-container').appendChild(card);
    
    let count = 3;
    this._nextEpTimer = setInterval(() => {
        count--;
        document.getElementById('next-countdown').textContent = `${count}秒后自动播放`;
        if (count <= 0) {
            clearInterval(this._nextEpTimer);
            card.remove();
            app.playEpisode(nextEp.id);
        }
    }, 1000);
}

showLastEpisodeCard(drama) {
    // 最后一集 → 显示续写入口或推荐
    const card = document.createElement('div');
    card.className = 'next-episode-card';
    card.innerHTML = `
        <div class="next-info">
            <span>已看完</span>
            <h3>《${drama.title}》已完结</h3>
            <p>查看更多推荐短剧</p>
        </div>
        <div class="next-actions">
            <button onclick="app.goBack(); this.closest('.next-episode-card').remove();">返回</button>
            <button onclick="app.navigateTo('home'); this.closest('.next-episode-card').remove();">看更多</button>
        </div>
    `;
    document.querySelector('.player-container').appendChild(card);
}
```

```css
.next-episode-card {
    position:absolute; inset:0; background:rgba(0,0,0,0.85);
    display:flex; align-items:center; justify-content:center; z-index:15;
    animation: fadeIn 0.3s ease;
}
.next-info { text-align:center; color:#fff; margin-bottom:16px; }
.next-info h3 { font-size:20px; margin:8px 0; }
.next-countdown { font-size:13px; color:#aaa; }
.next-actions { display:flex; gap:12px; justify-content:center; }
.next-actions button {
    padding:10px 24px; border-radius:20px; cursor:pointer; font-size:14px;
}
.next-actions button:first-child { background:transparent; border:1px solid #666; color:#ccc; }
.next-actions button:last-child { background:var(--electric-purple,#8B5CF6); border:none; color:#fff; }
```

---

#### 8. nginx.conf 代理到 NextJS 前端，但项目用的是后端静态文件

**现状：** docker-compose.yml 有 `frontend` 容器（NextJS），nginx.conf 也代理到 `nextjs_upstream`。但实际前端是后端的 `static/` 目录下的SPA，没有 NextJS 项目。

**问题：** docker-compose up 会因为 frontend Dockerfile 不存在而失败。nginx 代理到不存在的 NextJS 也会 502。

**修复方案：**

方案A：删掉 frontend 容器，nginx 直接代理到 backend 的静态文件

```yaml
# docker-compose.yml — 删除 frontend 服务
# nginx.conf — 修改 location / 代理到 backend
```

```nginx
# nginx.conf — 修改 location /
location / {
    proxy_pass http://backend_upstream;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

方案B：创建一个简单的 NextJS/Docker 前端（工作量大，不推荐）

推荐方案A。

---

#### 9. SSL证书路径硬编码，无证书时nginx启动失败

**现状：** nginx.conf 强制 443 SSL，但 `nginx/certs/` 目录下没有证书文件。docker-compose up 时 nginx 容器会启动失败。

**加强：** 改为HTTP优先，SSL可选：

```nginx
# nginx.conf — 只保留 HTTP server，注释掉 HTTPS
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://backend_upstream;
        # ... headers
    }

    location /api/ {
        proxy_pass http://backend_upstream;
        # ... headers
    }

    location /covers/ {
        proxy_pass http://backend_upstream;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    location /videos/ {
        proxy_pass http://backend_upstream;
        # ... video headers
    }
}

# HTTPS — 取消注释并配置证书后启用
# server {
#     listen 443 ssl;
#     server_name your-domain.com;
#     ssl_certificate /etc/nginx/certs/cert.pem;
#     ssl_certificate_key /etc/nginx/certs/key.pem;
#     ...
# }
```

同时在 README 或 DEPLOY.md 说明如何配置SSL。

---

#### 10. 没有 DEPLOY.md 部署文档

**现状：** README 有简单说明，但没有独立的部署文档，缺少局域网访问、防火墙配置等关键信息。

**加强：** 新建 DEPLOY.md，包含：
- 方案一：Docker一键部署（含修改 nginx.conf 说明）
- 方案二：H2本地零依赖启动
- 方案三：局域网PC部署
- SSL配置指南
- 常见问题排查

---

### 🟢 P2 — 打磨与优化

---

#### 11. 评论只支持短剧级别，互动点没有评论

**现状：** CommentController 有 `/api/comment/{interactionId}` 和 `/api/comment/drama/{dramaId}`，但前端只有短剧评论区，互动点选择后无法评论。

**加强：** 在互动结果弹窗底部加评论输入框：

```javascript
// interaction.js — showResult 中添加
if (type === 'VOTE' || type === 'CHOICE') {
    resultHtml += `
        <div class="interaction-comment">
            <input type="text" id="interaction-comment-input" placeholder="说说你的看法..." maxlength="200">
            <button onclick="interaction.postComment()">发送</button>
        </div>
    `;
}
```

---

#### 12. 弹幕没有颜色/位置选择

**现状：** 弹幕只支持白色文字从右到左滚动，比较单调。

**加强：** 可在发送弹幕时加颜色选择（简单版）：

```javascript
// 弹幕输入栏加颜色按钮
sendCurrentDanmaku(color) {
    const input = document.getElementById('danmaku-input');
    const content = input?.value?.trim();
    if (!content) return;
    this.danmaku.sendDanmaku(
        this.currentEpisode.episodeId || this.currentEpisode.id,
        content,
        Math.floor(this.currentTime * 1000),
        color || '#fff'
    );
    input.value = '';
}

// DanmakuSystem.showDanmaku 加颜色参数
showDanmaku(text, color = '#fff') {
    el.style.color = color;
    // ...
}
```

---

#### 13. 没有观看历史页面

**现状：** "我的"页面只有彩蛋/追剧/主题切换，没有观看历史。

**加强：** 利用已有的 WatchProgress 数据，在"我的"页面加观看历史入口。

---

#### 14. API缓存没有失效机制

**现状：** api.js 有5分钟缓存，但收藏/评分/评论后缓存不会更新。

**加强：** 写操作成功后清除相关缓存：

```javascript
// api.js — request 方法中，POST/PUT/DELETE 成功后清除相关缓存
async request(url, options = {}) {
    // ... 现有逻辑
    const response = await fetch(url, options);
    if (!response.ok) throw { status: response.status, message: response.statusText };
    
    // 写操作后清除缓存
    if (options.method && options.method !== 'GET') {
        const path = new URL(url, 'http://x').pathname;
        // 清除相关缓存键
        for (const key of apiCache.cache.keys()) {
            if (key.includes('recommend') || key.includes('hot') || key.includes('detail')) {
                apiCache.cache.delete(key);
            }
        }
    }
    
    return await response.json();
}
```

---

#### 15. 前端没有全局Loading状态

**现状：** loadHomePage 中有 loadingManager，但页面上没有对应的 HTML 元素 `global-loader`。

**加强：** 在 index.html 添加：

```html
<div id="global-loader" class="global-loader hidden">
    <div class="loader-spinner"></div>
</div>
```

```css
.global-loader {
    position:fixed; inset:0; background:rgba(0,0,0,0.5);
    display:flex; align-items:center; justify-content:center; z-index:9999;
}
.global-loader.hidden { display:none; }
.loader-spinner {
    width:40px; height:40px; border:3px solid #333; border-top-color:#8B5CF6;
    border-radius:50%; animation:spin 0.8s linear infinite;
}
@keyframes spin { to { transform:rotate(360deg); } }
```

---

#### 16. 数据库H2 profile缺少covers目录映射

**现状：** H2模式启动时，`/covers/clean_xxx.webp` 路径对应的静态文件在 `static/covers/` 下，Spring Boot 默认会从 classpath:/static/ 提供静态文件，但需要确认 covers/ 目录确实在 `resources/static/covers/` 下。

**加强：** 检查并确保 `backend/src/main/resources/static/covers/` 下有6个webp文件。如果没有，从项目根目录的 `cover/` 复制过去。

---

#### 17. 错误处理可更友好

**现状：** 401直接刷新页面，其他错误只显示"操作失败"。

**加强：**
- 401：跳转登录页而非刷新（保留当前页面状态）
- 网络错误：显示重试按钮
- 404：显示"内容不存在"而非通用错误

```javascript
// api.js — request 方法
if (response.status === 401) {
    localStorage.removeItem('drama_token');
    // 不刷新，而是跳转登录
    app.showLoginPage();
    throw new Error('Unauthorized');
}
```

---

#### 18. 搜索只支持关键词，不支持分类+关键词组合

**现状：** 分类筛选和搜索是独立的功能，搜索时不保留分类筛选。

**加强：** 搜索和分类可叠加：

```javascript
// app.js — doSearch 中传递当前分类
async doSearch(keyword) {
    const activeCategory = document.querySelector('.category-tab.active')?.dataset.category;
    const url = activeCategory 
        ? `${API_BASE_URL}/drama/search?keyword=${encodeURIComponent(keyword)}&category=${encodeURIComponent(activeCategory)}`
        : `${API_BASE_URL}/drama/search?keyword=${encodeURIComponent(keyword)}`;
    // ...
}
```

后端 DramaController.search 也需要加 category 参数。

---

## 三、总结：优先级排序

| 优先级 | 编号 | 内容 | 对应需求 | 预估 |
|--------|------|------|----------|------|
| **P0** | #1 | 互动分支前端加branchGroupId过滤 | 需求2a | 30min |
| **P0** | #2 | 互动倒计时 | 需求2a体验 | 30min |
| **P0** | #8 | 删frontend容器+修nginx | 需求4 | 20min |
| **P0** | #9 | nginx改HTTP优先 | 需求4 | 15min |
| **P1** | #3 | AI剧情生成 | 需求2b | 3h |
| **P1** | #4 | 已看完标记 | 需求1 | 20min |
| **P1** | #5 | 投票统计回顾 | 需求3a | 45min |
| **P1** | #6 | 3级分支链路 | 需求2a | 1h |
| **P1** | #7 | 下一集过渡卡片 | 需求1 | 45min |
| **P1** | #10 | DEPLOY.md | 需求4 | 1h |
| **P2** | #11 | 互动评论 | 需求3b | 30min |
| **P2** | #12 | 弹幕颜色 | 体验 | 20min |
| **P2** | #13 | 观看历史 | 需求1 | 30min |
| **P2** | #14 | API缓存失效 | 稳定性 | 15min |
| **P2** | #15 | 全局Loading | 体验 | 15min |
| **P2** | #16 | covers目录检查 | 需求1 | 5min |
| **P2** | #17 | 错误处理优化 | 体验 | 30min |
| **P2** | #18 | 搜索+分类组合 | 需求1 | 30min |

**总预估：** 9-10小时

---

## 四、Claude Code 分批执行指令

### 第1批：P0 — 阻塞性修复（1-2小时）

```
/plan
本次执行4个P0级改动：

1. **player.js 加 branchGroupId 过滤**：
   checkInteractionPoints 中增加：如果互动点有 branchGroupId，
   必须匹配 interaction.pendingBranchId 才触发；
   没有 branchGroupId 的主线互动正常触发。

2. **interaction.js 加10秒倒计时**：
   show 方法中启动倒计时，超时自动选第一项；
   close 方法清除定时器。

3. **删除 docker-compose.yml 中 frontend 服务**（NextJS不存在）：
   同时修改 nginx.conf，location / 直接代理到 backend_upstream。
   删除 upstream nextjs_upstream。

4. **nginx.conf 改为HTTP优先**：
   默认只开80端口，443 SSL部分注释掉并加说明。
   简化配置，只保留 / → backend, /api/ → backend, /videos/ → backend。

每完成一个 git commit。
```

### 第2批：P1 — 功能补齐（6-7小时）

```
/plan
本次执行6个P1级改动：

1. **AI剧情生成**（最重要）：
   - 新建 GeneratedStory 实体 + Repository
   - 新建 AIStoryController + AIStoryService
   - 支持 /api/ai-story/branch 和 /api/ai-story/continue
   - 无API Key时返回演示文本
   - 前端：剧尾弹出续写卡片（预设选项+自定义输入）

2. **已看完标记**：loadEpisodes 判断进度>90%显示✓

3. **投票统计回顾**：已投票互动点显示💬图标，点击查看统计

4. **3级分支链路**：DataInitializer 至少1部剧构建3级分支

5. **下一集过渡卡片**：onVideoEnded 显示3秒倒计时卡片
   最后一集显示完结卡片+推荐

6. **DEPLOY.md**：Docker部署/H2本地/局域网PC/SSL指南

每完成一个 git commit。
```

### 第3批：P2 — 打磨优化（2-3小时）

```
/plan
本次执行8个P2级改动：

1. 互动评论：VOTE/CHOICE 结果弹窗加评论输入
2. 弹幕颜色：输入栏加3色选择按钮
3. 观看历史："我的"页加观看历史入口
4. API缓存失效：写操作成功后清除相关缓存
5. 全局Loading：index.html 加 global-loader 元素
6. covers目录检查：确保 static/covers/ 下有6个webp
7. 错误处理优化：401跳登录（不刷新）、网络错误加重试
8. 搜索+分类组合：搜索时保留分类筛选

每完成一个 git commit。
```

---

> 本内容由 Coze AI 生成，请遵循相关法律法规及《人工智能生成合成内容标识办法》使用与传播。
