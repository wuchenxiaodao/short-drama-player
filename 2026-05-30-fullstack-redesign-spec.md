# 短剧平台全栈重构设计规格

> 日期：2026-05-30
> 方向：务实路线 + 高光互动A + 本地部署B
> 方案：前端Next.js重写 + 后端Spring Boot API保留 + 前后端同步开发

---

## 一、架构总览

```
┌─────────────────────────────────────────────────────┐
│              Nginx (反代 + HTTPS + 静态缓存)          │
│              端口: 80/443                            │
├───────────────────────┬─────────────────────────────┤
│   Next.js 前端         │   Spring Boot API           │
│   端口: 3000           │   端口: 8080                 │
│                       │                             │
│   App Router          │   34个现有API端点            │
│   React 组件化         │   16个现有数据实体           │
│   TypeScript          │   新增API端点                │
│   Tailwind + shadcn   │   新增互动类型               │
│   自定义播放器          │   统计看板API               │
├───────────────────────┴─────────────────────────────┤
│   MySQL 8.0  │  Redis 7  │  本地视频存储              │
└─────────────────────────────────────────────────────┘
```

### 技术栈

| 层 | 技术 | 版本 |
|----|------|------|
| 前端框架 | Next.js (App Router) | 14+ |
| UI库 | React + TypeScript | 18+ |
| 样式 | Tailwind CSS + shadcn/ui | 4+ |
| 状态管理 | Zustand | 4+ |
| 视频播放 | video.js / 自定义HTML5 | - |
| 后端框架 | Spring Boot | 3.2.5 |
| 数据库 | MySQL / H2(开发) | 8.0 / 2.2 |
| 缓存 | Redis | 7 |
| 反代 | Nginx | latest |
| 容器 | Docker + Docker Compose | - |

---

## 二、子项目分解

### SP-1: Next.js 前端骨架

**目标**: 搭建Next.js项目，实现路由、布局、API客户端、认证体系

**路由结构**:
```
app/
  layout.tsx            → 全局布局(Header+Footer)
  page.tsx              → 首页
  drama/
    [id]/
      page.tsx          → 短剧详情页
      play/
        page.tsx        → 播放页
  search/
    page.tsx            → 搜索页
  eggs/
    page.tsx            → 彩蛋图鉴
  login/
    page.tsx            → 登录
  register/
    page.tsx            → 注册
  profile/
    page.tsx            → 个人中心
```

**核心模块**:
- `lib/api-client.ts` — API请求封装(Bearer Token自动携带、401处理、缓存)
- `lib/auth.ts` — 认证状态管理(Zustand store + localStorage持久化)
- `lib/types.ts` — TypeScript类型定义(Drama, Episode, InteractionPoint等)
- `components/ui/` — shadcn/ui基础组件

**交付物**:
- Next.js项目初始化完成
- 所有路由页面骨架(可访问，显示占位内容)
- API客户端可正常调用Spring Boot后端
- 登录/注册流程可走通

---

### SP-2: 基础播放功能增强

**目标**: 实现需求规格一中所有必选功能

#### 2.1 短剧列表页面

**新增功能**:
- 网格/列表布局切换按钮(右上角图标切换)
- DramaCard组件增加: 简介(50字截断)、时长(格式化mm:ss)、更新状态标识("更新中"/"已完结")
- 无限滚动加载(IntersectionObserver + 后端分页API)
- 分类筛选Tab(全部/都市/甜宠/古装/悬疑)
- 按热度/更新时间排序切换

**新增后端API**:
```
GET /api/drama/categories          → 返回分类列表
GET /api/drama/category/{category} → 按分类筛选(分页)
```

**DramaCard组件设计**:
```
┌──────────────────────────┐
│  [封面图 16:9]            │
│  更新中                   │  ← 状态标识(右上角badge)
├──────────────────────────┤
│  短剧标题                 │
│  都市 · 20集 · 12:30      │  ← 分类+集数+时长
│  这是一段简介文字最多五十... │  ← 50字截断
└──────────────────────────┘
```

#### 2.2 自定义视频播放器

**替代原生`<video controls>`，实现自定义控制栏**:

```
┌──────────────────────────────────────────────────┐
│                                                  │
│              视频画面区域                          │
│         (弹幕层叠加在上方)                         │
│                                                  │
├──────────────────────────────────────────────────┤
│  ━━━━━━━━━━━●━━━━━━━━━━━━━━━━━━  进度条(可拖拽)   │
│  ▶  02:30 / 10:00   🔊━━━   1.0x  720p  ⛶      │
│  播放  时间           音量   倍速  清晰度  全屏     │
└──────────────────────────────────────────────────┘
```

**控制功能**:
- 播放/暂停(点击视频区域或按钮)
- 进度条拖拽(显示预览时间)
- 音量调节(滑块+静音切换)
- 倍速选择(0.5x/0.75x/1.0x/1.25x/1.5x/2.0x，记忆到localStorage)
- 清晰度选择(720p/1080p，需后端支持多流)
- 全屏切换(含竖屏/横屏自动切换)
- 当前时间/总时长显示
- 断点续播(显示恢复提示)

**新增后端API**:
```
GET /api/episode/{id}/streams → 返回多清晰度流地址
Response: {
  "streams": [
    { "quality": "720p", "url": "..." },
    { "quality": "1080p", "url": "..." }
  ]
}
```

**移动端适配**:
- 竖屏: 播放器占满宽度，控制栏简化
- 横屏: 自动全屏，控制栏完整显示
- 使用CSS `orientation` media query + JS `screen.orientation` API

---

### SP-3: 高光互动增强

**目标**: 实现需求规格二A中所有功能

#### 3.1 新增互动类型

**INFO类型(信息展示类)**:
```typescript
interface InfoInteraction {
  type: 'INFO';
  title: string;        // 弹窗标题
  content: string;      // 弹窗内容(支持HTML)
  category: 'note' | 'character' | 'knowledge';  // 注释/角色/知识点
  imageUrl?: string;    // 可选配图
}
```

前端渲染: 右下角弹出信息卡片，不暂停视频，3秒后自动消失或点击关闭。

**LINK类型(功能触发类)**:
```typescript
interface LinkInteraction {
  type: 'LINK';
  title: string;        // 推荐标题
  description: string;  // 推荐描述
  url: string;          // 跳转链接
  coverUrl?: string;    // 推荐封面
  linkType: 'related' | 'product' | 'external';  // 相关内容/商品/外部链接
}
```

前端渲染: 底部滑出推荐卡片，点击跳转，不影响视频播放。

**EMOJI类型(表情包)**:
```typescript
interface EmojiInteraction {
  type: 'EMOJI';
  emojis: string[];     // 可选表情列表 ['🔥', '😂', '❤️', '😱', '👏']
}
```

前端渲染: 视频上方弹出表情选择栏，选择后表情飘过屏幕。

#### 3.2 后端扩展

**InteractionType枚举新增**:
```java
public enum InteractionType {
    CHOICE, VOTE, EGG, QUIZ,
    INFO,   // 新增：信息展示
    LINK,   // 新增：功能触发
    EMOJI   // 新增：表情包
}
```

**新增API**:
```
POST /api/interaction/emoji          → 发送表情
GET  /api/interaction/stats/overview → 全局互动统计
GET  /api/interaction/stats/drama/{id} → 短剧互动统计
```

**统计看板数据结构**:
```json
{
  "totalInteractions": 1234,
  "participationRate": 0.78,
  "topInteractions": [
    { "id": 1, "type": "QUIZ", "questionText": "...", "participationCount": 456 }
  ],
  "typeDistribution": { "QUIZ": 40, "VOTE": 30, "CHOICE": 20, "EGG": 10 },
  "hourlyDistribution": [12, 34, 56, ...]
}
```

#### 3.3 前端统计看板

**StatsDashboard组件**:
- 互动参与率(环形图)
- 互动类型分布(饼图)
- 热门互动点TOP5(横向柱状图)
- 时段分布(折线图)

使用轻量图表库: recharts

---

### SP-4: 后端API增强

**目标**: 为SP-2/SP-3提供后端支持，与前端并行开发

#### 4.1 数据模型扩展

**Episode新增streams字段**:
```java
@Column(columnDefinition = "TEXT")
private String streams;  // JSON: [{"quality":"720p","url":"..."},{"quality":"1080p","url":"..."}]
```

**DataInitializer更新**:
- 为每集添加多清晰度流地址(720p/1080p)
- 新增INFO/LINK/EMOJI类型互动点种子数据
- Drama增加简介字段(50字以内)

#### 4.2 新增/修改API汇总

| API | 方法 | 说明 |
|-----|------|------|
| `/api/drama/categories` | GET | 分类列表 |
| `/api/drama/category/{category}` | GET | 按分类筛选 |
| `/api/episode/{id}/streams` | GET | 多清晰度流 |
| `/api/interaction/emoji` | POST | 发送表情 |
| `/api/interaction/stats/overview` | GET | 全局统计 |
| `/api/interaction/stats/drama/{id}` | GET | 短剧统计 |

#### 4.3 现有API调整

- `DramaController` — 增加分类筛选、简介字段返回
- `EpisodeController` — 增加streams端点
- `InteractionController` — 扩展支持INFO/LINK/EMOJI类型
- `DramaSummary` DTO — 增加description、duration、status字段

---

### SP-5: 本地部署方案

**目标**: 完善docker-compose，实现一键部署+HTTPS+备份+局域网访问

#### 5.1 docker-compose增强

```yaml
services:
  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/certs:/etc/nginx/certs
      - nextjs-build:/usr/share/nginx/html  # Next.js静态导出
    depends_on: [backend]

  nextjs:
    build: ./frontend
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8080
    # 构建后导出静态文件，由nginx服务

  backend:
    build: ./backend
    ports: ["8080:8080"]
    depends_on: [mysql, redis]

  mysql:
    image: mysql:8.0
    volumes: [mysql-data:/var/lib/mysql]

  redis:
    image: redis:7-alpine
```

#### 5.2 Nginx配置

```nginx
server {
    listen 443 ssl http2;
    ssl_certificate     /etc/nginx/certs/cert.pem;
    ssl_certificate_key /etc/nginx/certs/key.pem;

    # 前端静态资源
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri.html /index.html;
    }

    # API反代
    location /api/ {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 视频文件反代(支持range请求)
    location /videos/ {
        proxy_pass http://backend:8080;
        proxy_set_header Range $http_range;
    }
}
```

#### 5.3 一键部署脚本

**deploy.ps1 (Windows)**:
```powershell
# 1. 检查Docker是否运行
# 2. 生成自签名HTTPS证书(如不存在)
# 3. docker-compose build
# 4. docker-compose up -d
# 5. 等待健康检查通过
# 6. 输出访问地址(https://localhost)
```

**deploy.sh (Linux/macOS)**:
```bash
# 同上，bash版本
```

#### 5.4 备份脚本

**backup.sh**:
```bash
# 1. mysqldump导出数据库
# 2. 打包视频文件目录
# 3. 压缩备份文件(带日期)
# 4. 保留最近7天备份
```

#### 5.5 局域网发现

- 启动时在终端显示本机IP地址
- 可选: mDNS广播(docker容器内avahi-daemon)
- 访问密码: Nginx basic auth(可选开关)

#### 5.6 容量预警

- 磁盘使用率>80%时日志告警
- 视频目录大小监控端点: `GET /api/admin/storage-stats`

---

### SP-6: 文档与测试

**交付物清单**:

| 文档 | 内容 |
|------|------|
| API接口文档 | Swagger/OpenAPI规范，所有端点+请求/响应示例 |
| 部署指南 | 环境要求+一键部署步骤+配置说明+故障排查 |
| 功能测试报告 | 每个功能模块的测试用例+测试结果 |
| 用户操作手册 | 截图+操作步骤，面向终端用户 |
| 数据库设计文档 | ER图+表结构+字段说明 |

---

## 三、执行顺序与依赖关系

```
SP-1 (Next.js骨架)
  ├── SP-2 (基础播放) ──→ SP-3 (高光互动增强)
  │                            │
SP-4 (后端API增强) ──────────→│
                               │
                          SP-5 (本地部署)
                               │
                          SP-6 (文档与测试)
```

**建议执行顺序**:
1. SP-1 + SP-4 并行启动
2. SP-1 完成后 → SP-2
3. SP-2 + SP-4 完成后 → SP-3
4. SP-3 完成后 → SP-5
5. SP-5 完成后 → SP-6

---

## 四、关键技术决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 前端渲染模式 | SSR + CSR混合 | 首页SSR利于SEO，播放页CSR利于交互 |
| 视频播放器 | 自定义HTML5 | 需求要求自定义UI，video.js引入过重 |
| 状态管理 | Zustand | 轻量、TypeScript友好、比Redux简单 |
| 图表库 | recharts | React生态、轻量、声明式 |
| 前端部署方式 | 静态导出(next export) | 无需Node.js运行时，Nginx直接服务 |
| 认证方案 | JWT(沿用现有) | 后端不变，前端改用Zustand管理token |

---

## 五、需求覆盖度映射

### 必选功能覆盖

| 需求 | 子项目 | 状态 |
|------|--------|------|
| 一.1 短剧列表(网格/列表切换) | SP-2 | ✅ |
| 一.1 封面+标题+简介+时长+更新状态 | SP-2 | ✅ |
| 一.1 分页/无限滚动 | SP-2 | ✅ |
| 一.1 热度/更新时间/分类筛选 | SP-2 | ✅ |
| 一.2 播放/暂停/进度/音量/全屏 | SP-2 | ✅ |
| 一.2 清晰度选择 | SP-2 | ✅ |
| 一.2 倍速播放 | SP-2 | ✅(已有) |
| 一.2 播放记忆 | SP-2 | ✅(已有) |
| 一.2 移动端适配 | SP-2 | ✅ |
| 二.A.1 时间轴触发 | - | ✅(已有) |
| 二.A.2 信息展示类 | SP-3 | ✅ |
| 二.A.2 轻互动类(投票/问答/表情) | SP-3 | ✅ |
| 二.A.2 功能触发类 | SP-3 | ✅ |
| 二.A.3 互动视觉反馈 | - | ✅(已有) |
| 二.A.4 互动数据记录 | SP-3 | ✅(增强) |
| 四.B.1 一键部署脚本 | SP-5 | ✅ |
| 四.B.1 服务自启动 | SP-5 | ✅ |
| 四.B.1 服务管理界面 | SP-5 | ⚠️(终端状态显示) |
| 四.B.2 本地IP/局域网 | SP-5 | ✅ |
| 四.B.2 端口映射 | SP-5 | ✅ |
| 四.B.2 访问密码 | SP-5 | ✅ |
| 四.B.3 轻量级数据库 | - | ✅(H2/MySQL) |
| 四.B.3 本地视频存储 | - | ✅(已有) |
| 四.B.3 数据备份恢复 | SP-5 | ✅ |

### 可选功能覆盖

| 需求 | 子项目 | 状态 |
|------|--------|------|
| 三.1 互动内容实时展示 | SP-3 | ✅ |
| 三.1 互动排序/筛选 | SP-3 | ✅ |
| 三.1 互动统计看板 | SP-3 | ✅ |
| 三.2 评论系统 | - | ✅(已有) |
| 三.2 评论审核 | SP-4 | ✅(基础敏感词) |
