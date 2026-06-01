# 短剧TV项目 - 安卓模拟器全面测试整改文档

> 测试日期：2026-06-01
> 测试环境：Android Emulator (1080x1920) + Chrome + Next.js 14 + Spring Boot 3.2.5
> 测试方法：API接口测试 + 模拟器页面截图 + 代码审查
> 前置说明：Claude Code工具此前删除了 `VideoController.java`、`docker-compose.yml`、`videos/` 目录

---

## 一、问题总览

| 严重级别 | 数量 | 说明 |
|---------|------|------|
| 🔴 致命 (P0) | 6 | 核心功能完全不可用 |
| 🟠 严重 (P1) | 10 | 主要功能异常或数据错误 |
| 🟡 中等 (P2) | 12 | 功能可用但存在明显缺陷 |
| 🔵 轻微 (P3) | 8 | 体验优化或小问题 |
| **合计** | **36** | |

---

## 二、致命问题 (P0) — 核心功能不可用

### P0-01: 视频文件目录被删除，视频播放完全失败
- **现象**: `videos/` 目录被Claude Code删除，所有视频URL指向不存在的本地文件
- **影响**: 播放页视频无法加载，返回403 Forbidden
- **API验证**: `GET /videos/北派寻宝笔记/第1集.mp4` → 403
- **整改建议**: 
  1. 重新创建 `videos/` 目录及子目录结构
  2. 放入测试视频文件（至少每个短剧放1集）
  3. 在 `.gitignore` 中排除大文件但保留目录结构
- **预期效果**: 视频可正常加载播放
- **涉及文件**: 项目根目录 `videos/`

### P0-02: VideoController.java 被删除，视频无法拖拽/快进
- **现象**: 之前创建的 `VideoController.java`（支持HTTP Range请求）被删除
- **影响**: 即使视频文件存在，也无法实现视频拖拽、快进、断点续播功能
- **整改建议**: 
  1. 重新创建 `VideoController.java`，实现HTTP Range请求支持
  2. 支持视频文件的分块传输（206 Partial Content）
  3. 支持视频流式加载，避免一次性加载大文件
- **预期效果**: 视频可拖拽进度条、快进、断点续播
- **涉及文件**: `backend/src/main/java/com/drama/controller/VideoController.java`

### P0-03: /api/eggs/catalog 端点不存在，彩蛋图鉴页500错误
- **现象**: 前端 `eggs/page.tsx` 调用 `GET /api/eggs/catalog`，但后端 `EggController.java` 未定义此端点
- **影响**: 彩蛋图鉴页登录后加载失败，显示空白或错误
- **API验证**: `GET /api/eggs/catalog` → 500 Internal Server Error
- **整改建议**: 
  1. 在 `EggController.java` 中新增 `/api/eggs/catalog` 端点
  2. 返回所有EGG类型互动点的列表，包含dramaId、dramaTitle、eggContent、interactionId
  3. 在 `SecurityConfig.java` 中将此端点加入permitAll或authenticated
- **预期效果**: 彩蛋图鉴页正常展示所有彩蛋目录
- **涉及文件**: `EggController.java`, `SecurityConfig.java`, `eggs/page.tsx`

### P0-04: 播放页互动点数据未加载，InteractionOverlay始终为空
- **现象**: 播放页 `play/page.tsx` 中 `interactions` 状态初始化为空数组，从未从API获取数据
- **影响**: 所有互动功能（投票、答题、选择、彩蛋、信息卡、链接卡、表情）均不触发
- **代码位置**: `play/page.tsx` 第43行 `const [interactions, setInteractions] = useState<InteractionPoint[]>([])` 从未被赋值
- **整改建议**: 
  1. 在 `loadEpisodeData()` 函数中添加获取互动点数据的逻辑
  2. 调用 `GET /api/interaction/episode/{episodeId}` 或类似端点
  3. 如果后端没有此端点，需要新增
  4. 将返回数据设置到 `setInteractions()`
- **预期效果**: 视频播放到指定时间点时自动弹出互动面板
- **涉及文件**: `play/page.tsx`, 后端可能需新增端点

### P0-05: docker-compose.yml 被删除，Docker部署完全不可用
- **现象**: `docker-compose.yml` 被Claude Code删除
- **影响**: 无法通过Docker Compose一键部署项目
- **整改建议**: 
  1. 重新创建 `docker-compose.yml`
  2. 包含服务：nginx、nextjs、backend、mysql、redis
  3. 配置正确的网络、卷挂载、环境变量
- **预期效果**: `docker-compose up -d` 即可一键部署
- **涉及文件**: 项目根目录 `docker-compose.yml`

### P0-06: PlayInfo streams字段为空，画质切换功能失效
- **现象**: `GET /api/episode/1/playinfo` 返回的 `streams` 字段为空
- **影响**: VideoPlayer的画质切换按钮不显示，无法切换720p/1080p
- **API验证**: `streams=` (空值)
- **整改建议**: 
  1. 检查 `EpisodeService.getPlayInfo()` 方法，确保streams字段被正确填充
  2. DataInitializer中已设置streams JSON，但PlayInfo DTO可能未解析
  3. 确保PlayInfo DTO包含streams列表并正确从Episode实体映射
- **预期效果**: 播放页显示画质切换按钮，可切换720p/1080p
- **涉及文件**: `EpisodeService.java`, `PlayInfo.java`

---

## 三、严重问题 (P1) — 主要功能异常

### P1-01: 封面图URL未使用resolveUrl，图片加载失败
- **现象**: Banner、DramaCard、DramaGrid、详情页等组件直接使用 `drama.coverUrl`（如 `/covers/clean_beipai.webp`），未调用 `resolveUrl()` 转换为完整URL
- **影响**: 在安卓模拟器上，相对路径的图片请求发送到前端(10.0.2.2:3000)而非后端(10.0.2.2:8080)，导致图片404
- **整改建议**: 所有 `<img src={drama.coverUrl}>` 改为 `<img src={resolveUrl(drama.coverUrl)}>`
- **涉及文件**: `Banner.tsx`, `DramaCard.tsx`, `DramaGrid.tsx`, `drama/[id]/page.tsx`

### P1-02: searchDramas返回Page对象但前端当作数组使用
- **现象**: `searchDramas()` 返回的是 `ApiResponse<Page<DramaSummary>>`，`data` 是Page对象（含content、pageable等），但前端 `doSearch()` 直接 `setResults(data)` 将Page对象当作数组
- **影响**: 搜索结果无法正确渲染，DramaGrid收到非数组数据
- **整改建议**: 修改 `doSearch()` 为 `setResults(data.content || [])`
- **涉及文件**: `search/page.tsx` 第52行

### P1-03: checkFavorite返回对象但前端期望布尔值
- **现象**: `GET /api/favorite/check/1` 返回 `{code:200, data:{favorited:true}}`，但前端 `checkFavorite(dramaId).then(fav => setIsFavorited(!!fav))` 中 `fav` 实际是 `{favorited:true}` 对象
- **影响**: `!!fav` 始终为true（因为对象是truthy），收藏状态显示错误
- **整改建议**: 修改为 `setIsFavorited(!!fav?.favorited)` 或后端直接返回布尔值
- **涉及文件**: `drama/[id]/page.tsx` 第58行, `api-client.ts`

### P1-04: getPointsBalance返回对象但前端期望数字
- **现象**: `GET /api/points/balance` 返回 `{code:200, data:{points:0}}`，但前端 `getPointsBalance()` 返回的data是 `{points:0}` 对象
- **影响**: 个人中心积分显示为 `[object Object]` 而非数字
- **整改建议**: 修改 `profile/page.tsx` 中 `setPoints(balance.points)` 或修改API返回纯数字
- **涉及文件**: `profile/page.tsx` 第41行

### P1-05: login返回数据结构与前端解构不匹配
- **现象**: `login()` 函数返回 `apiPost('/api/auth/login', ...)` 的结果，即 `ApiResponse.data`，包含 `{token, userId, user}`。但前端 `const { token, userId } = await login(...)` 解构时，如果后端返回的字段名不一致（如后端返回的userId可能为null），会导致后续 `setAuth(token, userId)` 传入null
- **影响**: 登录后可能userId为null，导致需要userId的API调用失败
- **整改建议**: 
  1. 检查后端AuthController的login返回结构
  2. 确保返回userId字段
  3. 前端添加fallback：`const userId = data.userId || data.user?.id`
- **涉及文件**: `login/page.tsx` 第31行, `AuthController.java`

### P1-06: /videos/** 路径未在SecurityConfig中放行
- **现象**: `SecurityConfig.java` 的permitAll列表中未包含 `/videos/**`，视频资源请求会被Spring Security拦截
- **影响**: 即使视频文件存在，未认证用户也无法访问视频文件（返回403）
- **整改建议**: 在SecurityConfig中添加 `.requestMatchers("/videos/**").permitAll()`
- **涉及文件**: `SecurityConfig.java` 第59行附近

### P1-07: /videos/** 路径未配置CORS
- **现象**: `WebConfig.java` 的CORS配置仅覆盖 `/api/**`，`SecurityConfig.java` 的CORS也仅注册 `/api/**`
- **影响**: 前端从10.0.2.2:3000请求10.0.2.2:8080/videos/xxx时可能遇到CORS拦截
- **整改建议**: 在CORS配置中添加 `/videos/**` 路径
- **涉及文件**: `WebConfig.java`, `SecurityConfig.java`

### P1-08: 个人中心链接指向不存在的路由
- **现象**: `profile/page.tsx` 中菜单项链接到 `/profile/favorites` 和 `/profile/history`，但前端没有这些页面
- **影响**: 点击"我的追剧"或"观看历史"会显示404页面
- **整改建议**: 
  1. 创建 `/profile/favorites/page.tsx` 和 `/profile/history/page.tsx`
  2. 或暂时将链接改为已有页面（如收藏列表用 `/eggs` 替代）
- **涉及文件**: `profile/page.tsx` 第86-99行

### P1-09: 空搜索关键词返回所有数据
- **现象**: `GET /api/drama/search?keyword=&page=0&size=10` 返回所有6条短剧数据
- **影响**: 用户清空搜索框时会看到所有短剧，而非空结果
- **整改建议**: 后端搜索方法在keyword为空时应返回空结果或拒绝请求
- **涉及文件**: `DramaService.java` 的search方法

### P1-10: 非法dramaId返回原始404而非友好错误
- **现象**: `GET /api/drama/999/detail` 返回原始HTTP 404，未经过GlobalExceptionHandler包装
- **影响**: 前端收到非标准错误响应，无法正确解析错误信息
- **整改建议**: 确保DramaService抛出BusinessException(404, "短剧不存在")，由GlobalExceptionHandler统一处理
- **涉及文件**: `DramaService.java`, `GlobalExceptionHandler.java`

---

## 四、中等问题 (P2) — 功能可用但有明显缺陷

### P2-01: 弹幕发送后前端数据格式可能不匹配
- **现象**: `sendDanmakuApi()` 返回的数据结构可能与前端Danmaku类型不匹配
- **影响**: 发送弹幕后新弹幕可能无法正确显示
- **整改建议**: 检查后端DanmakuController返回结构，确保与前端Danmaku类型一致
- **涉及文件**: `DanmakuController.java`, `play/page.tsx`

### P2-02: 断点续播功能未完整实现
- **现象**: `play/page.tsx` 中 `resumePositionMs` 始终为0，未从后端获取上次播放进度
- **影响**: 用户刷新页面或切换集数后，无法从上次观看位置继续播放
- **整改建议**: 在loadEpisodeData中调用进度API获取上次播放位置
- **涉及文件**: `play/page.tsx` 第46行

### P2-03: 详情页选集高亮逻辑错误
- **现象**: `drama/[id]/page.tsx` 中选集高亮固定为第1集（`ep === 1`），未根据URL参数动态高亮
- **影响**: 用户从播放页返回详情页时，当前集数不高亮
- **整改建议**: 从URL参数获取当前集数，动态设置高亮
- **涉及文件**: `drama/[id]/page.tsx` 第239行

### P2-04: 首页Banner点击无跳转
- **现象**: Banner组件展示推荐短剧封面，但点击Banner没有跳转到详情页
- **影响**: 用户无法通过Banner进入短剧详情
- **整改建议**: 给Banner添加Link包裹或onClick跳转
- **涉及文件**: `Banner.tsx`

### P2-05: 评论排序功能未实现
- **现象**: `getComments()` API支持sort参数（hot/newest），但前端评论区域没有排序切换UI
- **影响**: 用户无法切换评论排序方式
- **整改建议**: 在CommentSection中添加排序切换按钮
- **涉及文件**: `drama/[id]/page.tsx` 的CommentSection

### P2-06: 评论回复功能未实现
- **现象**: 后端 `postComment()` 支持parentCommentId参数，前端Comment类型有replies字段，但前端没有回复UI
- **影响**: 用户无法回复评论
- **整改建议**: 添加评论回复输入框和嵌套展示
- **涉及文件**: `drama/[id]/page.tsx` 的CommentSection

### P2-07: 评分功能前端未实现
- **现象**: 后端有完整的评分API（submitRating、getUserRating、getRatingStats），但前端没有评分UI
- **影响**: 用户无法对短剧评分
- **整改建议**: 在详情页添加星级评分组件
- **涉及文件**: `drama/[id]/page.tsx`

### P2-08: 继续观看功能前端未实现
- **现象**: 后端有 `/api/drama/continue` 端点，但前端首页没有"继续观看"区域
- **影响**: 用户无法快速回到上次观看的短剧
- **整改建议**: 在首页Banner下方添加"继续观看"横向滚动列表
- **涉及文件**: `page.tsx`（首页）

### P2-09: 在线人数功能前端未展示
- **现象**: 后端有 `/api/online/episode/{id}/count` 端点，但播放页未显示在线人数
- **影响**: 用户无法看到当前有多少人同时在看
- **整改建议**: 在播放页添加在线人数显示
- **涉及文件**: `play/page.tsx`

### P2-10: WebConfig视频路径检测依赖特定目录名
- **现象**: `WebConfig.java` 第39行检查 `new File(dir, "北派寻宝笔记").isDirectory()` 来定位videos目录
- **影响**: 如果videos目录存在但子目录名不同，视频路径会回退到默认路径
- **整改建议**: 使用配置属性（application.yml）指定视频路径，而非硬编码检测
- **涉及文件**: `WebConfig.java`

### P2-11: H2控制台在生产环境可访问
- **现象**: SecurityConfig中 `/h2-console/**` 被设为permitAll
- **影响**: 生产环境下任何人可访问H2数据库控制台
- **整改建议**: 仅在开发profile下允许H2控制台访问
- **涉及文件**: `SecurityConfig.java`

### P2-12: 注册无用户名长度/格式校验
- **现象**: 后端RegisterRequest无字段校验注解，前端仅检查非空
- **影响**: 用户可注册极短用户名或特殊字符用户名
- **整改建议**: 添加@Size、@Pattern等校验注解
- **涉及文件**: `RegisterRequest.java`, `register/page.tsx`

---

## 五、轻微问题 (P3) — 体验优化

### P3-01: Chrome "No internet connection" 横幅
- **现象**: 安卓模拟器Chrome中HTTP页面顶部显示"No internet connection"横幅
- **影响**: 影响用户体验，让用户误以为网络不可用
- **整改建议**: 这是Chrome对HTTP页面的标准行为，可忽略；生产环境使用HTTPS后自动消失

### P3-02: 首页分类标签无横向滚动指示
- **现象**: 移动端分类标签（全部/都市/甜宠/古装/悬疑）可横向滚动但无滚动指示器
- **影响**: 用户可能不知道还有更多分类
- **整改建议**: 添加渐变遮罩或滚动指示器
- **涉及文件**: `page.tsx` 第97行

### P3-03: 搜索页输入框未自动聚焦
- **现象**: 虽然代码中有 `inputRef.current?.focus()`，但在模拟器中Chrome可能阻止自动聚焦
- **影响**: 用户需要手动点击输入框
- **整改建议**: 可接受，浏览器安全策略限制

### P3-04: 视频播放器移动端竖屏模式控件简化
- **现象**: VideoPlayer在移动端竖屏时隐藏了音量、倍速、画质控件
- **影响**: 移动端用户无法调整播放速度和画质
- **整改建议**: 添加一个设置菜单入口，将倍速和画质选项放入菜单
- **涉及文件**: `VideoPlayer.tsx` 第415-489行

### P3-05: 详情页状态字段未在DataInitializer中设置
- **现象**: Drama实体的status字段在DataInitializer中未设置，默认可能为null
- **影响**: 详情页显示"更新中/已完结"可能为空或显示异常
- **整改建议**: 在DataInitializer中为每个Drama设置status字段
- **涉及文件**: `DataInitializer.java`

### P3-06: 搜索历史在无痕模式下不可用
- **现象**: 搜索历史使用localStorage存储，无痕模式下不可用
- **影响**: 无痕模式下搜索历史功能失效
- **整改建议**: 添加try-catch处理localStorage异常（当前代码已有部分处理）

### P3-07: DramaGrid布局切换在移动端体验不佳
- **现象**: 移动端网格/列表切换按钮较小，且列表模式在窄屏上图片过小
- **影响**: 移动端操作不便
- **整改建议**: 移动端默认使用网格模式，隐藏切换按钮
- **涉及文件**: `DramaGrid.tsx`

### P3-08: 缺少全局404页面
- **现象**: 访问不存在的路由时显示Next.js默认404页面
- **影响**: 404页面风格与应用不一致
- **整改建议**: 创建 `app/not-found.tsx` 自定义404页面
- **涉及文件**: 新建 `frontend/src/app/not-found.tsx`

---

## 六、API接口测试结果汇总

| API端点 | 方法 | 认证 | 结果 | 备注 |
|---------|------|------|------|------|
| `/api/drama/recommend` | GET | 否 | ✅ 200 | 返回4条推荐短剧 |
| `/api/drama/hot` | GET | 否 | ✅ 200 | 返回4条热门短剧 |
| `/api/drama/new` | GET | 否 | ✅ 200 | 返回4条最新短剧 |
| `/api/drama/search` | GET | 否 | ✅ 200 | 搜索"北派"返回1条结果 |
| `/api/drama/categories` | GET | 否 | ✅ 200 | 返回4个分类 |
| `/api/drama/1/detail` | GET | 否 | ✅ 200 | 返回19集详情 |
| `/api/drama/999/detail` | GET | 否 | ❌ 404 | 未包装为ApiResponse |
| `/api/episode/1/playinfo` | GET | 否 | ✅ 200 | streams字段为空 |
| `/api/auth/login` | POST | 否 | ✅ 200 | 返回JWT token |
| `/api/auth/login(错误密码)` | POST | 否 | ✅ 401 | 正确拒绝 |
| `/api/auth/register` | POST | 否 | ✅ 200 | 注册成功 |
| `/api/auth/me` | GET | 是 | ✅ 200 | 返回用户信息 |
| `/api/auth/me(无token)` | GET | 否 | ❌ 403 | 正确拒绝 |
| `/api/favorite/1` | POST | 是 | ✅ 200 | 切换收藏成功 |
| `/api/favorite/check/1` | GET | 是 | ✅ 200 | 返回{favorited:true} |
| `/api/comment/drama/1` | GET | 否 | ✅ 200 | 返回空评论列表 |
| `/api/comment` | POST | 是 | ✅ 200 | 发表评论成功 |
| `/api/danmaku/episode/1` | GET | 否 | ✅ 200 | 返回空弹幕列表 |
| `/api/interaction/stats/overview` | GET | 否 | ✅ 200 | 返回统计概览 |
| `/api/eggs/collection` | GET | 是 | ✅ 200 | 返回空彩蛋集合 |
| `/api/eggs/catalog` | GET | 是 | ❌ 500 | 端点不存在 |
| `/api/points/balance` | GET | 是 | ✅ 200 | 返回{points:0} |
| `/api/rating/submit` | POST | 是 | ✅ 200 | 评分成功 |
| `/api/progress/report` | POST | 是 | ✅ 200 | 进度上报成功 |
| `/videos/xxx.mp4` | GET | 否 | ❌ 403 | 文件不存在+安全拦截 |

---

## 七、前端页面测试结果汇总

| 页面 | 路由 | 状态 | 主要问题 |
|------|------|------|----------|
| 首页 | `/` | ⚠️ 部分可用 | 封面图加载失败(P1-01)，Banner无跳转(P2-04) |
| 登录 | `/login` | ✅ 基本可用 | userId可能为null(P1-05) |
| 注册 | `/register` | ✅ 基本可用 | 缺少用户名格式校验(P2-12) |
| 详情 | `/drama/1` | ⚠️ 部分可用 | 封面图404(P1-01)，收藏状态错误(P1-03)，无评分UI(P2-07) |
| 播放 | `/drama/1/play` | ❌ 不可用 | 视频无法播放(P0-01/02)，互动不触发(P0-04)，画质切换失效(P0-06) |
| 搜索 | `/search` | ⚠️ 部分可用 | 搜索结果解析错误(P1-02) |
| 个人中心 | `/profile` | ⚠️ 部分可用 | 积分显示错误(P1-04)，链接404(P1-08) |
| 彩蛋图鉴 | `/eggs` | ❌ 不可用 | catalog端点500(P0-03) |

---

## 八、修复优先级建议

### 第一批（立即修复）— 恢复核心功能
1. **P0-01**: 重建 `videos/` 目录和测试视频
2. **P0-02**: 重建 `VideoController.java`
3. **P0-04**: 播放页加载互动点数据
4. **P0-06**: 修复PlayInfo streams字段
5. **P1-01**: 所有封面图使用resolveUrl
6. **P1-06**: SecurityConfig放行 `/videos/**`
7. **P1-07**: CORS配置添加 `/videos/**`

### 第二批（尽快修复）— 修复数据流问题
8. **P0-03**: 新增 `/api/eggs/catalog` 端点
9. **P1-02**: 修复搜索结果数据解析
10. **P1-03**: 修复收藏状态判断
11. **P1-04**: 修复积分显示
12. **P1-05**: 修复登录数据解构
13. **P1-08**: 创建缺失的profile子页面

### 第三批（计划修复）— 完善功能
14. **P0-05**: 重建 `docker-compose.yml`
15. **P2-01~P2-12**: 逐步完善各项功能
16. **P3-01~P3-08**: 体验优化

---

## 九、测试截图清单

| 截图文件 | 页面 | 说明 |
|---------|------|------|
| `screenshots/test_homepage.png` | 首页 | 首页加载状态 |
| `screenshots/test_login.png` | 登录页 | 登录表单 |
| `screenshots/test_detail.png` | 详情页 | 短剧详情+选集 |
| `screenshots/test_play.png` | 播放页 | 视频播放器（视频无法加载） |
| `screenshots/test_search.png` | 搜索页 | 搜索界面 |
| `screenshots/test_profile.png` | 个人中心 | 用户信息页 |
| `screenshots/test_eggs.png` | 彩蛋图鉴 | 彩蛋页面 |

---

## 十、测试结论

项目当前状态**不适合发布**，6个致命问题导致核心功能（视频播放、互动系统、彩蛋图鉴）完全不可用。主要原因是Claude Code工具错误删除了关键文件（VideoController.java、videos/目录、docker-compose.yml），以及前后端数据接口存在多处不匹配。

建议按照第八节的修复优先级，先完成第一批修复恢复核心功能，再逐步完善其余问题。预计第一批修复完成后，项目可达到基本可用状态。
