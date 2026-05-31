# 短剧互动播放器 (Short Drama Interactive Player)

一款为短剧设计的沉浸式互动娱乐平台，核心体验是"观看-互动-再参与"的闭环。

## 技术栈

| 模块 | 技术 |
|------|------|
| 后端 | Java 17 + Spring Boot 3.2 + Spring Security + JWT + JPA + H2/MySQL + Redis |
| 前端 | SPA（单页应用） - HTML5 + CSS3 + JavaScript |
| 部署 | Docker Compose / Kubernetes (ACK/TKE) |

## 快速开始

### 后端 API 本地运行

```bash
cd backend
./mvnw clean package -DskipTests
java -jar target/short-drama-player-1.0.0.jar --spring.profiles.active=h2
```

启动后访问 `http://localhost:8080`

### Docker 部署

```bash
cp .env.example .env  # 编辑密码配置
docker-compose up -d
```

## API 接口

### 认证（公开）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册（返回 JWT token） |
| POST | `/api/auth/login` | 用户登录（返回 JWT token） |
| GET | `/api/auth/me` | 获取当前用户信息（需登录） |

### 短剧（公开）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/drama/recommend?page=0&size=10` | 推荐短剧（按评分排序） |
| GET | `/api/drama/hot?page=0&size=10` | 热播短剧（按播放量排序） |
| GET | `/api/drama/new?page=0&size=10` | 最新短剧 |
| GET | `/api/drama/search?keyword=...` | 搜索短剧（支持剧集标题） |
| GET | `/api/drama/{id}/detail` | 短剧详情 |

### 播放（公开）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/episode/{id}/playinfo` | 播放信息 + 互动点列表 |

### 互动（部分需登录）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/interaction/{id}/stats` | 互动统计数据（公开） |
| POST | `/api/interaction/answer` | 提交互动答案（需登录） |

### 进度（需登录）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/progress/report` | 上报播放进度 |

### 评分（部分需登录）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/rating/stats?dramaId=...` | 评分统计（公开） |
| GET | `/api/rating/user?dramaId=...` | 用户评分（需登录） |
| POST | `/api/rating/submit` | 提交评分（需登录） |

### 评论（部分需登录）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/comment/{interactionId}` | 评论列表（公开） |
| GET | `/api/comment/{interactionId}/count` | 评论数量（公开） |
| GET | `/api/comment/replies/{parentCommentId}` | 回复列表（公开） |
| POST | `/api/comment` | 发表评论（需登录） |
| POST | `/api/comment/{id}/like` | 点赞/取消点赞（需登录） |

### 收藏（需登录）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/favorite/list` | 收藏列表 |
| GET | `/api/favorite/check?dramaId=...` | 检查是否收藏 |
| POST | `/api/favorite/toggle` | 切换收藏状态 |

### 弹幕（部分需登录）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/danmaku/episode/{episodeId}` | 弹幕列表（公开） |
| POST | `/api/danmaku` | 发送弹幕（需登录） |

### 积分（需登录）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/points` | 获取积分 |
| GET | `/api/points/history` | 积分历史 |

### 在线状态（部分需登录）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/online/episode/{id}/count` | 在线人数（公开） |
| GET | `/api/online/episode/{id}/users` | 在线用户列表（公开） |
| POST | `/api/online/heartbeat` | 心跳上报（需登录） |

## 核心功能

- 首页：沉浸式横幅轮播 + 双列瀑布流列表 + 搜索历史
- 详情页：高斯模糊背景、选集列表、相关推荐、底部播放栏
- 播放器：全屏播放、进度条、倍速、记忆播放、自动连播
- 互动系统：投票（表情雨+实时统计）、答题（限时+积分）、抉择（剧情选择+前置条件）、彩蛋（金光特效）
- 安全：JWT 鉴权 + BCrypt 密码加密 + 原子操作 + CORS 配置
- 后端：完整 REST API + H2/MySQL 双模式 + Redis 缓存 + Docker 部署

## 数据库设计

- `dramas` — 短剧信息（title, category, rating, viewCount）
- `episodes` — 剧集信息（episodeNumber, videoUrl, durationSeconds）
- `interaction_points` — 互动点配置（timestampMs, interactionType, questionText）
- `interaction_options` — 互动选项（optionIndex, optionText, isCorrect）
- `interaction_answers` — 用户互动记录（userId, interactionPoint, selectedOptionId）
- `watch_progress` — 观看进度（复合主键：userId + episodeId）
- `users` — 用户信息（BCrypt 密码, points）
- `comments` — 评论（content, likeCount）
- `comment_likes` — 点赞记录（userId, commentId）
- `ratings` — 评分（userId, dramaId, score）
- `favorites` — 收藏记录（userId, dramaId）
- `danmaku` — 弹幕（userId, episodeId, content, timestampMs）
- `user_eggs` — 彩蛋收集（userId, interactionId, eggContent）

## 环境要求

- 后端：Java 17+
- 部署：Docker + Docker Compose

## 路线图

- [x] 安全加固（JWT + BCrypt + 原子操作）
- [x] 数据模型修正（选项拆表 + N+1 修复）
- [x] 异常处理规范化
- [x] 多集互动 + 前置条件
- [x] 搜索优化（剧集标题 + 搜索历史）
- [x] 并发安全（原子 SQL UPDATE）
- [x] CORS 配置 + 分页上限
- [x] 弹幕功能
- [x] 彩蛋收集图鉴
- [x] 成就勋章墙
- [x] 收藏功能
- [x] 评论系统
- [x] 封面图优化
- [x] 分类筛选
