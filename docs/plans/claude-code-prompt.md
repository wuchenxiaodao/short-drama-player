# Claude Code 执行指令

## 项目背景

这是一个短剧互动播放平台项目（short-drama-player），采用 Next.js 14 + Spring Boot 3.2.5 前后端分离架构。项目已完成约75%，但此前Claude Code工具错误删除了关键文件（VideoController.java、docker-compose.yml、videos/目录），导致核心功能不可用。

完整测试报告见：`TEST_REPORT.md`
完整实施计划见：`docs/plans/2026-06-01-full-implementation-plan.md`

## 执行规则

1. **严格按照计划中的Task顺序执行**，每个Task完成后必须commit再继续下一个
2. **每个Task的代码必须完整**，不允许placeholder或TODO
3. **commit信息格式**：`feat:` / `fix:` / `docs:` / `test:` 前缀 + 简短描述
4. **后端代码规范**：使用Lombok、Spring Data JPA、统一ApiResponse返回格式
5. **前端代码规范**：TypeScript严格模式、Tailwind CSS样式、Zustand状态管理
6. **关键约定**：
   - 后端API分页从0开始（page=0是第一页）
   - 前端所有相对URL（如 `/covers/xxx.webp`、`/videos/xxx.mp4`）必须通过 `resolveUrl()` 转换为完整后端URL
   - 安卓模拟器通过 `10.0.2.2` 访问宿主机
   - Spring Boot 需绑定 `0.0.0.0` 才能从模拟器访问
   - Next.js 需 `-H 0.0.0.0` 才能从模拟器访问

## 执行范围：阶段二 — 核心功能修复（P0+P1问题）

这是最高优先级阶段，必须最先完成。包含10个Task：

### Task 2.1: 重建VideoController.java
- 创建 `backend/src/main/java/com/drama/controller/VideoController.java`
- 实现HTTP Range请求支持（206 Partial Content）
- 支持视频文件流式传输
- 在SecurityConfig中放行 `/videos/**`
- 在SecurityConfig的CORS中添加 `/videos/**`

### Task 2.2: 重建videos目录与测试视频
- 创建6个短剧的videos子目录
- 使用FFmpeg生成测试视频（或创建占位文件）
- 更新.gitignore排除mp4但保留目录结构
- 创建.gitkeep保持目录

### Task 2.3: 修复播放页互动点数据未加载
- 后端InteractionController新增 `GET /api/interaction/episode/{episodeId}` 端点
- 前端api-client.ts新增 `getEpisodeInteractions()` 方法
- 修改play/page.tsx在loadEpisodeData中加载互动点数据
- SecurityConfig放行新端点

### Task 2.4: 修复PlayInfo streams字段为空
- 检查PlayInfo DTO的streams字段类型
- 修复EpisodeService中streams JSON解析逻辑
- 确保API返回包含720p/1080p流信息

### Task 2.5: 新增/api/eggs/catalog端点
- EggController添加catalog端点
- 返回所有EGG类型互动点列表（含dramaId、dramaTitle、eggContent）
- SecurityConfig放行该端点

### Task 2.6: 修复封面图URL未使用resolveUrl
- Banner.tsx、DramaCard.tsx、DramaGrid.tsx、drama/[id]/page.tsx
- 所有 `<img src={drama.coverUrl}>` 改为 `<img src={resolveUrl(drama.coverUrl)}>`

### Task 2.7: 修复搜索结果数据解析错误
- search/page.tsx中 `setResults(data)` 改为 `setResults(Array.isArray(data) ? data : (data?.content || []))`

### Task 2.8: 修复收藏状态和积分显示错误
- drama/[id]/page.tsx: `setIsFavorited(!!fav)` 改为 `setIsFavorited(!!fav?.favorited)`
- profile/page.tsx: `setPoints(balance)` 改为 `setPoints(typeof balance === 'number' ? balance : balance?.points ?? 0)`

### Task 2.9: 修复登录数据解构和空搜索问题
- login/page.tsx: `const { token, userId } = await login(...)` 改为 `const data = await login(...); setAuth(data.token, data.userId || data.user?.id)`
- register/page.tsx做同样修改
- DramaService.java: search方法空关键词返回空结果

### Task 2.10: 创建缺失的profile子页面
- 创建 `frontend/src/app/profile/favorites/page.tsx`（我的追剧）
- 创建 `frontend/src/app/profile/history/page.tsx`（观看历史）

## 开始执行

请从Task 2.1开始，逐个完成所有10个Task。每完成一个Task，执行git commit后继续下一个。
