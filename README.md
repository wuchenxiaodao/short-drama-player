# 短剧互动播放器 (Short Drama Interactive Player)

一款为短剧设计的沉浸式互动娱乐平台，核心体验是"观看-互动-再参与"的闭环。

## 技术栈

| 模块 | 技术 |
|------|------|
| 后端 | Java 17 + Spring Boot 3.2 + Spring Security + JWT + JPA + H2/MySQL + Redis |
| 前端 | 纯 HTML5 + CSS3 + JavaScript（preview.html） |
| 部署 | Docker Compose / Kubernetes (ACK/TKE) |

## 项目结构

```
short-drama-player/
├── backend/          # Spring Boot 后端 API
│   ├── src/main/java/com/drama/
│   │   ├── config/       # 配置类（Redis、跨域、安全、数据初始化）
│   │   ├── controller/   # REST 控制器
│   │   ├── dto/          # 数据传输对象
│   │   ├── model/        # JPA 实体
│   │   ├── repository/   # 数据访问层
│   │   └── service/      # 业务逻辑层
│   └── pom.xml
├── k8s/              # Kubernetes 部署配置
├── sql/              # 数据库初始化脚本
├── preview.html      # 网页版完整 UI
└── docker-compose.yml
```

## 快速开始

### 网页预览（无需安装）

双击 `preview.html` 即可在浏览器中体验完整 UI 流程。

### 后端 API 本地运行

```bash
cd backend
# 需要 Java 17
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

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| GET | `/api/drama/recommend?page=0&size=10` | 推荐短剧列表 |
| GET | `/api/drama/hot?page=0&size=10` | 热播短剧列表 |
| GET | `/api/drama/search?keyword=...` | 搜索短剧（支持剧集标题） |
| GET | `/api/drama/{id}/detail` | 短剧详情 |
| GET | `/api/episode/{id}/playinfo` | 播放信息 + 互动点列表 |
| POST | `/api/interaction/answer` | 提交互动答案（需登录） |
| GET | `/api/interaction/{id}/stats` | 互动统计数据 |
| POST | `/api/progress/report` | 上报播放进度（需登录） |
| POST | `/api/rating/submit` | 提交评分（需登录） |
| POST | `/api/comment` | 发表评论（需登录） |

## 核心功能

- 首页：沉浸式横幅轮播 + 双列瀑布流列表 + 搜索历史
- 详情页：高斯模糊背景、选集列表、相关推荐、底部播放栏
- 播放器：全屏播放、进度条、倍速、记忆播放、自动连播
- 互动系统：投票（表情雨+实时统计）、答题（限时+积分）、抉择（剧情选择+前置条件）、彩蛋（金光特效）
- 安全：JWT 鉴权 + BCrypt 密码加密 + 受保护端点
- 后端：完整 REST API + H2/MySQL 双模式 + Redis 缓存 + Docker 部署

## 数据库设计

- `dramas` — 短剧信息
- `episodes` — 剧集信息
- `interaction_points` — 互动点配置（时间戳、类型、问题）
- `interaction_options` — 互动选项（关联互动点）
- `interaction_answers` — 用户互动记录
- `watch_progress` — 观看进度（复合主键：user_id + episode_id）
- `users` — 用户信息（BCrypt 密码）
- `comments` — 评论
- `ratings` — 评分

## 环境要求

- 后端：Java 17+
- 部署：Docker + Docker Compose

## 路线图

- [x] 安全加固（JWT + BCrypt）
- [x] 数据模型修正（选项拆表 + N+1 修复）
- [x] 异常处理规范化
- [x] 多集互动 + 前置条件
- [x] 搜索优化（剧集标题 + 搜索历史）
- [ ] Android 原生应用
- [ ] 弹幕功能
- [ ] 彩蛋收集图鉴
- [ ] 成就勋章墙
