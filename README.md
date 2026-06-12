# 短剧互动播放器 (Short Drama Interactive Player)

一款为短剧设计的沉浸式互动娱乐平台，核心体验是"观看-互动-再参与"的闭环。

## 技术栈

| 模块 | 技术 |
|------|------|
| 后端 | Java 17 + Spring Boot 3.2 + Spring Security + JWT + JPA + H2/MySQL + Redis |
| 前端 | Next.js 14 (App Router) + TypeScript + Tailwind CSS + Zustand |
| 部署 | Docker Compose / Kubernetes (ACK/TKE) |

## 快速开始

### 后端 API 本地运行

```bash
cd backend
./mvnw clean package -DskipTests
java -jar target/short-drama-player-1.0.0.jar --spring.profiles.active=h2
```

启动后访问 `http://localhost:8080`

### 前端本地运行

```bash
cd frontend
npm install
npx next dev -p 3000 -H 0.0.0.0
```

启动后访问 `http://localhost:3000`

### Docker 部署

#### 1. 环境准备

- 安装 [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- 确保 Docker Desktop 正在运行

#### 2. 配置镜像加速器（国内网络必选）

编辑 `~/.docker/daemon.json`（Windows 路径：`C:\Users\<用户名>\.docker\daemon.json`）：

```json
{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://docker.xuanyuan.me"
  ]
}
```

保存后重启 Docker Desktop。

#### 3. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，修改数据库密码等配置（可选，有默认值）：

```env
MYSQL_ROOT_PASSWORD=drama_root_2024
MYSQL_DATABASE=short_drama
MYSQL_USER=drama
MYSQL_PASSWORD=drama_pass_2024
REDIS_PASSWORD=drama_redis_2024
JWT_SECRET=mySecretKeyForJwtTokenGeneration2024
```

#### 4. 启动服务

```bash
docker-compose up -d
```

首次启动需要下载镜像，约 10-20 分钟。

#### 5. 访问

- 本地：http://localhost
- 安卓模拟器：http://172.16.8.117（使用本机 IP）
- Android Studio 模拟器：http://10.0.2.2

#### 常用命令

```bash
docker-compose ps              # 查看状态
docker-compose logs -f         # 查看日志
docker-compose down            # 停止服务
docker-compose down -v         # 停止并清空数据
docker-compose up -d --build   # 重新构建启动
```

## 核心功能

### 首页
- 沉浸式横幅轮播
- 双列瀑布流列表
- 搜索历史记录
- 分类筛选（古装、悬疑、甜宠、都市）

### 详情页
- 高斯模糊背景
- 选集列表
- 相关推荐
- 底部播放栏

### 播放器
- 全屏播放
- 进度条控制
- 倍速播放
- 记忆播放位置
- 自动连播

### 互动系统
- **投票**：表情雨 + 实时统计
- **答题**：限时答题 + 积分奖励
- **抉择**：剧情选择 + 前置条件
- **彩蛋**：金光特效 + 收集图鉴

### 社交功能
- 弹幕系统
- 评论系统（支持回复）
- 点赞功能
- 收藏功能
- 评分系统

### 用户系统
- JWT 鉴权
- 积分系统
- 成就勋章墙
- 观看历史

## API 接口

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| GET | `/api/auth/me` | 获取当前用户信息 |

### 短剧

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/drama/recommend?page=0&size=10` | 推荐短剧 |
| GET | `/api/drama/hot?page=0&size=10` | 热播短剧 |
| GET | `/api/drama/new?page=0&size=10` | 最新短剧 |
| GET | `/api/drama/search?keyword=...` | 搜索短剧 |
| GET | `/api/drama/{id}/detail` | 短剧详情 |
| GET | `/api/drama/categories` | 分类列表 |
| GET | `/api/drama/category/{category}` | 分类下的短剧 |

### 播放

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/episode/{id}/playinfo` | 播放信息 + 互动点 |

### 互动

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/interaction/{id}/stats` | 互动统计 |
| POST | `/api/interaction/answer` | 提交互动答案 |
| POST | `/api/interaction/emoji` | 发送表情 |

### 弹幕

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/danmaku/episode/{episodeId}` | 弹幕列表 |
| POST | `/api/danmaku/send` | 发送弹幕 |

### 评论

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/comment/drama/{dramaId}` | 评论列表 |
| POST | `/api/comment` | 发表评论 |
| POST | `/api/comment/{id}/like` | 点赞评论 |

### 收藏

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/favorite/list` | 收藏列表 |
| GET | `/api/favorite/check/{dramaId}` | 检查收藏 |
| POST | `/api/favorite/{dramaId}` | 切换收藏 |

### 评分

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/rating/stats?dramaId=...` | 评分统计 |
| GET | `/api/rating/user?dramaId=...` | 用户评分 |
| POST | `/api/rating/submit` | 提交评分 |

### 积分

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/points/balance` | 积分余额 |
| GET | `/api/points/history` | 积分历史 |
| POST | `/api/points/hint` | 购买提示 |

### 用户

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/eggs/collection` | 彩蛋收集 |
| GET | `/api/user/{userId}/medals` | 成就勋章 |

## 数据库设计

| 表名 | 说明 |
|------|------|
| `dramas` | 短剧信息 |
| `episodes` | 剧集信息 |
| `interaction_points` | 互动点配置 |
| `interaction_options` | 互动选项 |
| `interaction_answers` | 用户互动记录 |
| `watch_progress` | 观看进度 |
| `users` | 用户信息 |
| `comments` | 评论 |
| `comment_likes` | 点赞记录 |
| `ratings` | 评分 |
| `favorites` | 收藏 |
| `danmaku` | 弹幕 |
| `user_eggs` | 彩蛋收集 |
| `user_medals` | 成就勋章 |

## 环境要求

- Java 17+
- Node.js 18+
- Docker + Docker Compose（可选）

## 项目结构

```
short-drama-player/
├── backend/                # Spring Boot 后端
│   ├── src/
│   │   └── main/
│   │       ├── java/com/drama/
│   │       │   ├── controller/   # REST 控制器
│   │       │   ├── service/      # 业务逻辑
│   │       │   ├── model/        # JPA 实体
│   │       │   ├── repository/   # 数据访问
│   │       │   ├── dto/          # 数据传输对象
│   │       │   └── config/       # 配置类
│   │       └── resources/
│   └── pom.xml
├── frontend/               # Next.js 前端
│   ├── src/
│   │   ├── app/            # 页面路由
│   │   ├── components/     # React 组件
│   │   └── lib/            # 工具库
│   ├── public/             # 静态资源
│   └── package.json
├── short-drama/            # 视频资源
├── k8s/                    # Kubernetes 部署
└── docker-compose.yml
```

## 许可证

MIT License
