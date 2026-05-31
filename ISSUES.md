# 短剧播放平台 — 完整问题清单

> 审查日期：2026-05-30
> 对照文档：`2026-05-30-fullstack-redesign-spec.md`
> 审查范围：前端 28 个文件 + 后端 48 个文件 + 部署配置 13 个文件
> 独立问题总数：约 251 个

---

## 一、规格文档未完成项（6个）

| # | 子项目 | 规格要求 | 当前状态 | 严重度 |
|---|--------|---------|---------|--------|
| S1 | SP-2 | DramaCard 显示时长 mm:ss | ❌ 缺失 | 🟡中 |
| S2 | SP-2 | 断点续播从后端获取播放位置 | ⚠️ UI有但API未接入 | 🟡中 |
| S3 | SP-3 | 统计看板-小时分布折线图 | ❌ 缺失 | 🟡中 |
| S4 | SP-3 | StatsDashboard 被页面引用 | ❌ 组件孤立，用户无法访问 | 🔴高 |
| S5 | SP-5 | docker-compose.yml | ❌ 文件缺失 | 🔴高 |
| S6 | SP-6 | 全部5项文档 | ❌ 均未完成 | 🟡中 |

---

## 二、前端问题（120个）

### 🔴 高严重度（20个）

| # | 文件 | 问题 |
|---|------|------|
| F1 | play/page.tsx:43 | `interactions` 状态声明但 `setInteractions` 从未调用，互动功能完全失效 |
| F2 | play/page.tsx:46 | `resumePositionMs` 始终为 0，断点续播失效 |
| F3 | play/page.tsx:101-112 | `currentTimeMs` 在 useEffect 依赖数组中，15秒定时器每次 timeUpdate 重建，严重性能问题 |
| F4 | VotePanel.tsx:36 | `totalVotes` 使用假公式 `(optionIndex+1)*3+7`，投票数据造假 |
| F5 | layout.tsx | 缺少全局 Error Boundary，渲染错误导致白屏 |
| F6 | InteractionOverlay.tsx:89 | `onSend` 忽略 emoji 参数，始终传 `optionId: 0`，表情互动失效 |
| F7 | DramaCard.tsx:26 | `src={drama.coverUrl}` 未调用 `resolveUrl()`，图片无法加载 |
| F8 | Banner.tsx:46 | 同上，封面图无法加载 |
| F9 | DramaGrid.tsx:29 | 同上，列表模式封面图无法加载 |
| F10 | drama/[id]/page.tsx:152 | 同上，详情页封面图无法加载 |
| F11 | profile/page.tsx:111 | `src={user.avatarUrl}` 未调用 `resolveUrl()`，头像无法加载 |
| F12 | InfoPopup.tsx:57 | `info.imageUrl` 未调用 `resolveUrl()`，信息弹窗图片无法加载 |
| F13 | LinkCard.tsx:23 | `link.coverUrl` 未调用 `resolveUrl()`，推荐卡片封面无法加载 |
| F14 | api-client.ts:112-237 | 几乎所有 API 函数使用 `any` 泛型参数，完全丧失类型安全 |
| F15 | types.ts | 缺少 `Page<T>` 泛型类型对应 Spring Data 分页响应 |
| F16 | types.ts:1-14 | `Drama` 接口缺少 `episodes` 字段，play/page.tsx 访问 `detail.episodes` 会类型错误 |
| F17 | page.tsx:10 | `categories` 硬编码，`getCategories()` API 已存在却未使用 |
| F18 | drama/[id]/page.tsx:250-365 | 本地 `CommentSection` 与 `src/components/CommentSection.tsx` 功能重复 |
| F19 | VideoPlayer.tsx:498-507 | 播放按钮覆盖层 `pointer-events-none` 但内部 div 有 `onClick`，点击事件永远不触发 |
| F20 | CommentSection.tsx:42 | `pageNum` 从 1 开始但 API 期望 0-based，跳过第一页评论 |

### 🟡 中严重度（50个）

| # | 文件 | 问题 |
|---|------|------|
| F21 | layout.tsx:16 | `className="dark"` 硬编码暗色模式，无法切换 |
| F22 | layout.tsx:17 | 缺少 skip-to-content 链接 |
| F23 | layout.tsx:19 | `pt-16` 硬编码 Header 高度偏移 |
| F24 | page.tsx:18 | `page` 从 1 开始，与 Spring Data 0-based 混淆 |
| F25 | page.tsx:26 | `(res: any)` 使用 any 类型 |
| F26 | page.tsx:27 | `.catch(() => {})` 静默吞掉推荐接口错误 |
| F27 | page.tsx:54 | catch 块静默吞掉错误且 `setHasMore(false)` 可能不正确 |
| F28 | page.tsx:98-109 | 分类按钮缺少 `aria-pressed` |
| F29 | page.tsx:112-135 | 排序按钮缺少 `aria-pressed` |
| F30 | drama/[id]/page.tsx:35 | `Number(params.id)` 无验证，可能产生 NaN |
| F31 | drama/[id]/page.tsx:61,71 | `(res: any)` 使用 any 类型 |
| F32 | drama/[id]/page.tsx:73 | `commentPage` 在依赖数组中但从未变化 |
| F33 | drama/[id]/page.tsx:83,96,115,131 | 多处 `catch {}` 静默吞掉错误 |
| F34 | drama/[id]/page.tsx:99 | 使用原生 `alert()` 而非 toast |
| F35 | drama/[id]/page.tsx:239 | `ep === 1` 硬编码高亮第1集 |
| F36 | drama/[id]/page.tsx:336 | `username.charAt(0)` 若 username 为空返回空字符串 |
| F37 | drama/[id]/page.tsx:43 | `commentPage` 无分页 UI，评论只能看第一页 |
| F38 | play/page.tsx:37 | `Number(searchParams.get('ep')) \|\| 1` — ep=0 时默认为 1 |
| F39 | play/page.tsx:60,63,84 | 多处 `(x: any)` 使用 any 类型 |
| F40 | play/page.tsx:70 | `.catch(() => {})` 静默吞掉详情加载错误 |
| F41 | play/page.tsx:87 | `console.error` 残留 |
| F42 | play/page.tsx:34 | `useSearchParams()` 未被 Suspense 包裹 |
| F43 | play/page.tsx:200-209 | DanmakuLayer 与视频控件 z-index 可能冲突 |
| F44 | search/page.tsx:9 | `HOT_SEARCHES` 硬编码 |
| F45 | search/page.tsx:52 | `searchDramas` 不支持分页 |
| F46 | search/page.tsx:76-83 | `handleSearch` 可能导致双重搜索 |
| F47 | search/page.tsx:101-108 | 搜索输入框缺少 `aria-label` |
| F48 | eggs/page.tsx:11-31 | 3个接口定义在组件文件内，应放入 types.ts |
| F49 | eggs/page.tsx:60 | 硬编码 API 路径 |
| F50 | eggs/page.tsx:169 | `bg-opacity-20` 与渐变类一起使用无效 |
| F51 | login/page.tsx:24 | `!password.trim()` 密码不应 trim |
| F52 | login/register | `<label>` 缺少 `htmlFor`，`<input>` 缺少 `id`（6处） |
| F53 | login/register | 密码显示/隐藏按钮缺少 `aria-label`（3处） |
| F54 | register/page.tsx:37 | 密码仅检查长度 ≥ 6，无复杂度要求 |
| F55 | profile/page.tsx:86,99 | `/profile/favorites` 和 `/profile/history` 路由无对应页面 |
| F56 | profile/page.tsx:43 | `catch {}` 静默吞掉用户数据加载错误 |
| F57 | api-client.ts:23-26 | 端口 8080 硬编码 |
| F58 | api-client.ts:57-92 | `request()` 无请求超时设置 |
| F59 | api-client.ts:57-92 | 无请求重试逻辑 |
| F60 | api-client.ts:70 | fetch 无 AbortController，组件卸载时无法取消请求 |
| F61 | api-client.ts:76-78 | 401 处理使用 `window.location.href` 硬跳转 |
| F62 | api-client.ts:85-89 | 双状态码检查 `code !== 0 && code !== 200` 说明后端 API 不一致 |
| F63 | api-client.ts:85 | `res.json()` 假设响应一定是 JSON |
| F64 | auth.ts:36-41 | `loadFromStorage` 死代码 |
| F65 | auth.ts:46-48 | `partialize` 不持久化 `user` 对象，刷新后丢失 |
| F66 | auth.ts | 无 token 过期检查 |
| F67 | auth.ts | 无 refresh token 机制 |
| F68 | utils.ts:8-12 | `formatDuration` 不处理超过60分钟的视频 |
| F69 | utils.ts:14-27 | `formatTimeAgo` 超过1天只显示月/日，跨年无法区分 |
| F70 | Header.tsx:100 | `animate-in` 需要 tailwindcss-animate 插件，可能未安装 |

### 🟢 低严重度（50个）

| # | 文件 | 问题 |
|---|------|------|
| F71 | page.tsx:53 | `data.length >= 20` 硬编码分页大小 |
| F72 | page.tsx:94 | `recommendDramas.slice(0, 5)` 请求已设 size=5，slice 多余 |
| F73 | page.tsx:139-149 | 骨架屏缺少 `aria-busy="true"` |
| F74 | drama/[id]/page.tsx:146 | `Array.from({length: totalEpisodes})` 若值很大生成大量 DOM |
| F75 | play/page.tsx:148 | `.slice(0, 5)` 硬编码评论数量限制 |
| F76 | play/page.tsx:54 | `episodeTitle` 冗余状态 |
| F77 | search/page.tsx:10 | `MAX_HISTORY = 15` 魔法数字 |
| F78 | search/page.tsx:11 | `STORAGE_KEY` 无命名空间前缀 |
| F79 | search/page.tsx:22-27 | `saveSearchHistory()` 未处理 localStorage 异常 |
| F80 | search/page.tsx:143,169 | `<span onClick>` 应使用 `<button>` |
| F81 | eggs/page.tsx:114-118 | `totalEggs`/`collectedEggs` 每次渲染重新计算 |
| F82 | login/page.tsx:48 | `min-h-[calc(100vh-4rem)]` 硬编码 Header 高度 |
| F83 | login/page.tsx:20-44 | 无登录尝试次数限制 |
| F84 | register/page.tsx:61 | 同 F82 |
| F85 | register/page.tsx:27 | 无用户名/昵称长度限制 |
| F86 | profile/page.tsx:82-101 | `menuItems` 每次渲染重新创建 |
| F87 | profile/page.tsx:152-159 | 内联 SVG 而非使用 lucide-react |
| F88 | profile/page.tsx:20 | `user` rehydration 后可能为 null 导致闪烁 |
| F89 | api-client.ts:31-35 | `resolveUrl()` 不处理协议相对 URL |
| F90 | api-client.ts:64 | GET 请求也设置 Content-Type 多余 |
| F91 | api-client.ts:57-92 | 无网络错误与业务错误区分 |
| F92 | auth.ts:6-13 | `AuthState` 接口包含未使用的 `loadFromStorage` |
| F93 | auth.ts:32-33 | `logout` 不调用后端 API 使 token 失效 |
| F94 | types.ts:26 | `Stream.quality` 仅有 '720p'\|'1080p'，缺少其他画质 |
| F95 | types.ts:106-112 | `User.avatarUrl` 不允许 null，但用户可能无头像 |
| F96 | types.ts:139-143 | `ApiResponse<T>` 假设 data 总是存在 |
| F97 | types.ts:87-96 | `Comment.replies` 可选但 `replyCount` 不是，语义不一致 |
| F98 | utils.ts:14-27 | `formatTimeAgo` 不处理未来时间 |
| F99 | utils.ts:29-37 | `formatNumber` 不处理负数 |
| F100 | utils.ts:39-42 | `truncateText` 可能在多字节字符中间截断 |
| F101 | Header.tsx:28-35 | 点击外部关闭菜单仅监听 mousedown |
| F102 | Header.tsx:82-86 | 头像图片无 onerror 处理 |
| F103 | Header.tsx:130-134 | 移动端菜单按钮缺少 `aria-label`/`aria-expanded` |
| F104 | Banner.tsx:48 | `transition-all` 配合 `key` 导致图片重新挂载，动画无效 |
| F105 | Banner.tsx:42-43 | `onMouseEnter/Leave` 在触摸设备上无效 |
| F106 | Banner.tsx:63-87 | 前进/后退/指示器缺少 `aria-label` |
| F107 | Banner.tsx:25 | 自动播放间隔 3000ms 硬编码 |
| F108 | DramaCard.tsx:12-16 | `getBadge` 函数与 DramaGrid 重复 |
| F109 | DramaCard.tsx:28 | `<img>` 缺少 `loading="lazy"` |
| F110 | DramaCard.tsx:28 | 图片无 onerror 回退处理 |
| F111 | DramaGrid.tsx:60-65 | localStorage 初始化可能导致 hydration mismatch |
| F112 | VideoPlayer.tsx:56-60 | speed 初始化访问 localStorage，可能 hydration mismatch |
| F113 | VideoPlayer.tsx:152-192 | 键盘事件 useEffect 无依赖数组，每次渲染重新绑定 |
| F114 | VideoPlayer.tsx:269-290 | mouseDown 后组件卸载，mouseMove/mouseUp 不会被清理 |
| F115 | VideoPlayer.tsx:301-312 | 切换画质清除已缓冲数据，导致重新缓冲 |
| F116 | VideoPlayer.tsx:345-351 | `<video>` 无 poster 属性 |
| F117 | VideoPlayer.tsx:345-351 | 无视频加载失败处理 |
| F118 | VideoPlayer.tsx:69 | `'ontouchstart' in window` 检测不可靠 |
| F119 | VideoPlayer.tsx:336 | 竖屏简化模式移除太多控件 |
| F120 | VideoPlayer.tsx:423-432 | 音量滑块默认不可见，键盘用户无法操作 |

---

## 三、后端问题（127个）

### 🔴 高严重度（17个）

| # | 文件 | 问题 |
|---|------|------|
| B1 | PlayInfo.java:29 | `isCorrect` 暴露在 OptionInfo 中，客户端可直接看到正确答案 |
| B2 | FavoriteRepository.java:18 | `deleteByUserIdAndDramaId` 缺少 `@Modifying`+`@Transactional`，运行时抛异常 |
| B3 | Drama.java:40 | `@OneToMany` 缺少 `orphanRemoval = true`，删除 Drama 时 Episode 成为孤儿 |
| B4 | DramaService.java:173 | `toSummary()` 中 N+1 查询，分页场景下对每个 Drama 执行一次 Episode 查询 |
| B5 | EggController.java:39 | N+1 查询：循环中 `egg.getEpisode().getDrama().getId()` 触发 LAZY 链 |
| B6 | PointsController.java:48-52 | 先读用户积分再扣减，竞态条件，并发时可能多次扣费 |
| B7 | OnlineController.java:20 | `body.get("episodeId").toString()` 无空值检查，NPE |
| B8 | UserProfileController.java:23,33,38 | 无权限校验，任何用户可查看任意用户数据 |
| B9 | SecurityConfig.java:59 | `/h2-console/**` 公开可访问，生产环境风险极大 |
| B10 | application.yml:6 | `allowPublicKeyRetrieval=true` 允许中间人攻击 |
| B11 | application.yml:6 | `useSSL=false` 生产环境数据库连接未加密 |
| B12 | application.yml:8 | 默认 MySQL 密码 `root` 提交在代码仓库 |
| B13 | application.yml:12 | `ddl-auto: update` 生产环境可能导致数据丢失 |
| B14 | application.yml:31 | 默认 JWT 密钥 `pleaseSetJwtSecretViaEnvironmentVariable!` 弱密钥 |
| B15 | DataInitializer.java:35 | Demo 用户密码 `123456` 极弱 |
| B16 | GlobalExceptionHandler.java:21 | 401 等小于 400 的业务码被错误映射为 500，前端无法正确处理 401 |
| B17 | pom.xml:30-32 | `spring-boot-starter-data-redis` 非可选依赖，无 Redis 时启动失败 |

### 🟡 中严重度（62个）

| # | 文件 | 问题 |
|---|------|------|
| B18-B29 | 所有 12 个 Model | 使用 `@Data` 而非 `@Getter/@Setter`（12处） |
| B30-B40 | 所有 11 个 Controller | 未使用 `ResponseEntity<ApiResponse<T>>`（11处） |
| B41 | Episode.java:30 | `String streams` 存储 JSON，应使用 `@Convert` 或独立实体 |
| B42 | Episode.java:34 | LAZY 集合事务外访问风险 |
| B43 | InteractionPoint.java:39 | `prerequisiteChoiceOptionId` 反范式化，无外键约束 |
| B44 | InteractionAnswer.java:16 | `Long userId` 无外键约束 |
| B45 | Comment.java:15,19,21,27 | 4个 Long ID 字段无外键约束 |
| B46 | Comment.java:31 | `likeCount` 反范式化计数器，可能与 CommentLike 不同步 |
| B47 | User.java:5 | `@Data` 生成的 `toString()` 包含 password 字段 |
| B48 | User.java:27 | `Integer points` 无非负约束 |
| B49 | Favorite.java:10 | UniqueConstraint 使用 Java 字段名而非数据库列名 |
| B50 | Rating.java:22 | `score` 无 `@Min/@Max` 实体层约束 |
| B51 | Rating.java:9 | UniqueConstraint 命名风格与 Favorite 不一致 |
| B52 | CommentRequest.java:10-12 | `interactionId`/`dramaId` 都可选，缺少"至少一个非空"校验 |
| B53 | ProgressReport.java:11 | `positionMs` 无 `@Min(0)` 校验 |
| B54 | LoginRequest.java | 无登录失败次数限制 |
| B55 | RegisterRequest.java:13 | 密码无复杂度要求 |
| B56 | AnswerRequest.java:9 | 未校验 `choiceId` 是否属于 `interactionId` |
| B57 | CommentResponse.java:16 | 递归结构可能无限递归 |
| B58 | DramaController.java:43-45 | `detailShort()` 完全委托 `detail()`，多余端点 |
| B59 | EpisodeController.java:8 | 直接注入 Repository，绕过 Service 层 |
| B60 | EpisodeController.java:43-52 | `parseStreams()` 业务逻辑在 Controller 中 |
| B61 | EpisodeController.java:50 | 静默吞掉 JSON 解析错误 |
| B62 | InteractionController.java:48 | `sendEmoji()` 空操作端点 |
| B63 | CommentController.java:27 | `sort` 参数无白名单校验 |
| B64 | DanmakuController.java:22-27 | 混用构造器注入和字段注入 |
| B65 | DanmakuController.java:46-55 | 限流仅 Redis 可用时生效 |
| B66 | DanmakuController.java:57-63 | 直接使用 Repository 绕过 Service |
| B67 | DanmakuController.java:68-72 | 内部类 `DanmakuRequest` 应放 dto 包 |
| B68 | FavoriteController.java:7 | 直接注入多个 Repository，绕过 Service |
| B69 | FavoriteController.java:29 | `@Transactional` 放在 Controller 上 |
| B70 | FavoriteController.java:55 | `findAllById` 不保证顺序，收藏列表顺序错乱 |
| B71 | FavoriteController.java:69-79 | 映射逻辑应在 Service 层 |
| B72 | PointsController.java:35 | `BuyHintRequest` 无 `@Valid` |
| B73 | PointsController.java:52 | 返回的 `remainingPoints` 不准确 |
| B74 | EggController.java:50-56 | O(n*m) 复杂度查找，应预建 Map |
| B75 | OnlineController.java:18 | 返回 `Map` 而非 `ApiResponse`，与其他 Controller 不一致 |
| B76 | UserProfileController.java:23 | 返回原始实体而非 DTO |
| B77 | DramaService.java:49 | 搜索关键字转义未处理 `\` |
| B78 | DramaService.java:70 | 每次访问详情页增加浏览量，无去重 |
| B79 | DramaService.java:171 | `substring(0, 50)` 可能截断多字节字符 |
| B80 | DramaService.java:189-191 | Redis 浏览量计数 increment 和 set 非原子操作 |
| B81 | InteractionService.java:96 | `point.getOptions()` 触发 LAZY 加载 N+1 |
| B82 | InteractionService.java:104-109 | `collectEgg()` 存 `questionText` 而非彩蛋内容 |
| B83 | InteractionService.java:178 | `answerRepository.count()` 全表扫描 |
| B84 | EpisodeService.java:73 | N+1 查询 LAZY 加载 |
| B85 | CommentService.java:60,148 | 直接调用 `AuthUtils` 静态方法，无法单元测试 |
| B86 | CommentService.java:193-203 | `replyCount` 参数从未使用，`replies` 始终为 null |
| B87 | CommentService.java:117-125 | `getDramaComments()` 与 `getComments()` 大量重复 |
| B88 | ProgressService.java:27 | `positionMs` 无非负校验 |
| B89 | DramaRepository.java:23 | `findByCategoryAndIdNot` 返回 `List` 但接受 `Pageable`，应返回 `Page` |
| B90 | SecurityConfig.java:26 | 默认 CORS 过于宽松 |
| B91 | SecurityConfig.java:41 | CSRF 完全禁用无文档说明 |
| B92 | SecurityConfig.java:76 | `allowCredentials(true)` 配合通配符 origin patterns |
| B93 | WebConfig.java:17-21 | CORS 配置与 SecurityConfig 重复 |
| B94 | WebConfig.java:26-50 | 视频路径检测逻辑依赖硬编码目录名 |
| B95 | WebConfig.java:39 | `"北派寻宝笔记"` 硬编码中文目录名 |
| B96 | DataInitializer.java:41 | 初始化不够健壮，部分失败后重启不重试 |
| B97 | DataInitializer.java:421 | 视频路径含中文，URL 编码可能不匹配 |
| B98 | DataInitializer.java:424 | Streams JSON 字符串拼接，应使用 ObjectMapper |
| B99 | DataInitializer.java:166,241,307,342,397 | 5处 `.get(0)` 无越界检查 |
| B100 | JwtFilter.java:38 | 空权限列表，无法实现角色控制 |
| B101 | application-h2.yml:14 | `ddl-auto: create` 每次重启清空数据 |
| B102 | pom.xml | 缺少 `spring-boot-starter-actuator` |

### 🟢 低严重度（48个）

| # | 文件 | 问题 |
|---|------|------|
| B103 | Drama.java:24 | 分类值硬编码在注释中 |
| B104 | Drama.java:28 | `Double rating` 浮点精度丢失 |
| B105 | Episode.java:29 | `columnDefinition = "TEXT"` 数据库特定语法 |
| B106 | Danmaku.java:28 | `@Column(nullable=false)` 与 `@PrePersist` 重复 |
| B107 | WatchProgress.java:22 | `completed` 默认值可能为 null |
| B108 | Medal.java:29-30 | 空 `@PrePersist` 方法 |
| B109 | InteractionOption.java:26-27 | LAZY 加载事务外风险 |
| B110 | InteractionStats.java:10 | Long 作为 Map key，JSON 序列化为字符串 |
| B111 | ApiResponse.java:1 | 位于 common 包而非 dto 包 |
| B112 | DramaController.java:49 | keyword 无最小长度校验 |
| B113 | EpisodeController.java:33 | `ApiResponse<Object>` 无类型信息 |
| B114 | InteractionController.java:22 | 同上 |
| B115 | InteractionController.java:48 | 接收 `Map<String, Object>` 而非类型化 DTO |
| B116 | RatingController.java:28 | `getUserRating()` 使用 `@RequestParam` 而非 `@PathVariable` |
| B117 | DramaService.java:33-34 | `@Autowired(required=false)` 与 `@RequiredArgsConstructor` 混用 |
| B118 | DramaService.java:117 | `ep.getEpisodeNumber() <= 3` 硬编码 |
| B119 | DramaService.java:155-157 | `toSummary(Drama d)` 死代码 |
| B120 | InteractionService.java:33-34 | 同 B117 |
| B121 | CommentService.java:29-37 | `parentCommentId` 始终传 null，方法签名误导 |
| B122 | RatingService.java:31-33 | 两次独立查询可合并 |
| B123 | RatingService.java:33 | 四舍五入逻辑重复 |
| B124 | AuthService.java:43 | 登录/注册响应字段不一致 |
| B125 | OnlineService.java:24 | 线程池无自定义线程名 |
| B126 | OnlineService.java:50 | 本地 fallback ConcurrentHashMap 不删除过期 key |
| B127 | DramaRepository.java:27 | `LIKE %keyword%` 前缀通配符导致全表扫描 |
| B128 | InteractionAnswerRepository.java:21-22 | 方法名暗示固定5条但由 Pageable 决定 |
| B129 | CommentRepository.java:15-16 | 方法名极长，应使用 `@Query` |
| B130 | UserRepository.java:17-19 | `addPoints()` 无负数余额检查 |
| B131 | InteractionOptionRepository.java | 空 Repository 接口，死代码 |
| B132 | SecurityConfig.java:57 | `/api/video/**` 放行规则对应不存在的 Controller |
| B133 | SecurityConfig.java:60 | `/css/**`, `/js/**` 等静态资源路径不存在 |
| B134 | JwtUtil.java:29-31 | 默认密钥检查值硬编码 |
| B135 | JwtUtil.java:35-37 | `getKey()` 每次请求重新生成 SecretKey |
| B136 | JwtFilter.java:40-46 | JWT 验证失败仅 debug/warn 级别日志 |
| B137 | SwaggerConfig.java:21 | 占位符邮箱 |
| B138 | RedisConfig.java:10 | `@ConditionalOnBean` 与自动配置顺序可能冲突 |
| B139 | AuthUtils.java:9 | 使用 SecurityContextHolder 静态方法，无法 mock |
| B140 | AuthUtils.java:13 | 未检查类型转换 |
| B141 | BusinessException.java:9 | `code` 不校验是否为有效 HTTP 状态码 |
| B142 | GlobalExceptionHandler.java:28 | 仅返回第一个校验错误 |
| B143 | CommentService.java | 绝大多数方法无日志输出 |
| B144 | 全部 API | 无版本号如 `/api/v1/` |
| B145 | DataInitializer.java | 种子数据量大但无分批保存 |
| B146 | JwtUtil.java | 无 token 黑名单机制 |
| B147 | WebConfig.java:57-73 | Android preview.html 处理不应在后端 |
| B148 | CommentService.java | `getComments()` 的 `parentCommentId` 参数始终传 null |
| B149 | OnlineService.java:82-87 | `ConcurrentHashMap.entrySet().removeIf()` 语义不够清晰 |
| B150 | ProgressService.java:27 | `positionMs` 未校验是否超过剧集时长 |

---

## 四、部署配置问题（22个）

### 🔴 高严重度（6个）

| # | 文件 | 问题 |
|---|------|------|
| D1 | docker-compose.yml:33 vs api-client.ts:20 | 环境变量名 `NEXT_PUBLIC_API_URL` vs `NEXT_PUBLIC_API_BASE_URL` 不一致，Docker 部署 API 调用全部失败 |
| D2 | docker-compose.yml | backend 服务未挂载 videos 目录，容器内视频文件 404 |
| D3 | nginx/nginx.conf:102 | 视频路径 `/video/` vs 后端 `/videos/**`，nginx 代理视频 404 |
| D4 | docker-compose.yml | 后端 `VIDEO_BASE_URL` 默认指向 9000 端口，不存在 |
| D5 | docker-compose.yml | 后端 `IMAGE_BASE_URL` 默认指向 9000 端口，不存在 |
| D6 | docker-compose.yml:33 | `NEXT_PUBLIC_API_URL: http://backend:8080` 是容器内部地址，浏览器无法访问 |

### 🟡 中严重度（9个）

| # | 文件 | 问题 |
|---|------|------|
| D7 | .env.example:1-4 | 硬编码弱密码 |
| D8 | docker-compose.yml:54,57 | 默认密码为 `changeme` |
| D9 | backup.sh:26 | MySQL 密码默认值与 docker-compose 不一致 |
| D10 | sql/init.sql:7-8 | 创建了冗余用户 |
| D11 | docker-compose.yml:20 | nginx healthcheck 自签证书验证失败 |
| D12 | docker-compose.yml:20 | healthcheck 命令格式错误（`||` 在 CMD 中无效） |
| D13 | api-client.ts:18-29 | Docker 部署下绕过 nginx 直接访问后端 |
| D14 | next.config.js:10-12 | `env` 配置变量名与代码不匹配 |
| D15 | backend/Dockerfile | 没有安装 curl，healthcheck 依赖 curl |

### 🟢 低严重度（7个）

| # | 文件 | 问题 |
|---|------|------|
| D16 | docker-compose.yml:1 | `version: '3.8'` 已弃用 |
| D17 | generate-cert.sh | 无执行权限提示 |
| D18 | frontend/Dockerfile:11-13 | standalone 模式可能需要额外文件 |
| D19 | deploy.ps1:123 | `ExportRSAPrivateKeyPem` 可能不支持 PowerShell 5.1 |
| D20 | backup.sh | 不备份 Redis 数据 |
| D21 | frontend/package.json | 缺少 `typecheck` 脚本 |
| D22 | nginx.conf:82-87,130-135 | 静态文件缓存规则重叠 |

---

## 五、跨文件系统性问题（9个）

| # | 类别 | 严重度 | 描述 |
|---|------|--------|------|
| X1 | 类型安全 | 🔴高 | api-client.ts 中几乎所有 API 函数返回 `any`，整个前端几乎无 API 层类型安全 |
| X2 | 图片加载 | 🔴高 | `resolveUrl()` 在 7 处未调用（DramaCard、Banner、DramaGrid、Detail、Profile、InfoPopup、LinkCard） |
| X3 | 代码重复 | 🟡中 | `getBadge` 在 DramaCard/DramaGrid 重复；`EmojiRainEffect` 在 QuizPanel/EggPopup 重复；CommentSection 在组件和页面中重复 |
| X4 | 错误处理 | 🟡中 | 大量 `catch {}` 静默吞掉错误（前端约 15 处，后端约 5 处） |
| X5 | 可访问性 | 🟡中 | 多处 `<span onClick>` 应为 `<button>`；label/input 未关联；按钮缺少 aria-label |
| X6 | 兼容性 | 🟡中 | 多个组件使用 `<style jsx>`，Next.js App Router 默认不支持 |
| X7 | 分层违反 | 🔴高 | FavoriteController、DanmakuController、EpisodeController 直接操作 Repository |
| X8 | N+1查询 | 🔴高 | DramaService.toSummary()、EggController、InteractionService、EpisodeService 均存在 |
| X9 | 规范违反 | 🔴高 | 所有 12 个 Model 用 `@Data`；所有 11 个 Controller 未用 `ResponseEntity` |

---

## 六、统计汇总

| 严重度 | 前端 | 后端 | 部署 | 系统性 | 合计 |
|--------|------|------|------|--------|------|
| 🔴 高 | 20 | 17 | 6 | 4 | **47** |
| 🟡 中 | 50 | 62 | 9 | 5 | **126** |
| 🟢 低 | 50 | 48 | 7 | 0 | **105** |
| **合计** | **120** | **127** | **22** | **9** | **278** |

> 注：部分问题在跨文件系统性问题中与单文件问题有重叠，去重后独立问题约 **251 个**。

---

## 七、修复优先级建议

### 第一优先级：阻塞性问题（不修复则核心功能不可用）

| 问题编号 | 描述 | 影响范围 |
|---------|------|---------|
| F1 | 播放页互动功能完全失效 | 所有用户 |
| F19 | 播放按钮点击不触发 | 所有用户 |
| F4 | 投票数据造假 | 所有用户 |
| F7-F13 | 7处图片无法加载 | 所有页面 |
| B16 | 401 被映射为 500 | 登录/权限 |
| D1-D6 | Docker 部署完全不可用 | 部署环境 |

### 第二优先级：安全问题

| 问题编号 | 描述 | 影响范围 |
|---------|------|---------|
| B1 | Quiz 答案泄露 | 答题公平性 |
| B9 | H2 Console 公开 | 生产安全 |
| B10-B14 | 数据库/JWT 弱配置 | 生产安全 |
| B6 | 积分扣减竞态条件 | 积分系统 |
| B8 | 用户数据无权限校验 | 隐私 |

### 第三优先级：数据正确性

| 问题编号 | 描述 | 影响范围 |
|---------|------|---------|
| F20 | 评论分页跳过第一页 | 评论系统 |
| B2 | 删除收藏抛异常 | 收藏功能 |
| B4-B5 | N+1 查询性能 | 列表/彩蛋页 |
| B70 | 收藏列表顺序错乱 | 收藏功能 |
| F2 | 断点续播失效 | 播放体验 |
