# 短剧互动播放器 — 逐项改进计划

## 阶段一：安全补底（优先级 P0，1-2天）

> 不做这些，项目不能上线，也不能让别人试用。

### 1.1 密码加密

**文件：** `backend/src/main/java/com/drama/config/SecurityConfig.java`（新建）

- 引入 Spring Security 依赖（pom.xml 添加）：
  ```xml
  <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-security</artifactId>
  </dependency>
  ```
- 创建 `SecurityConfig.java`，注入 `PasswordEncoder` Bean：
  ```java
  @Bean
  public PasswordEncoder passwordEncoder() {
      return new BCryptPasswordEncoder();
  }
  ```
- **修改文件：** `backend/src/main/java/com/drama/config/DataInitializer.java`
  - 把 `user.setPassword("123456")` 改为注入 PasswordEncoder 后 `user.setPassword(passwordEncoder.encode("123456"))`
- **修改文件：** 新建 `backend/src/main/java/com/drama/service/AuthService.java`
  - 注册时 `password = passwordEncoder.encode(rawPassword)`
  - 登录时 `passwordEncoder.matches(rawPassword, user.getPassword())`
- **修改文件：** `User.java`
  - password 字段长度从默认 VARCHAR(255) 改为 `@Column(length = 100)`（BCrypt 输出60字符，留余量）

### 1.2 JWT 鉴权体系

**新建文件：**
- `backend/src/main/java/com/drama/config/JwtUtil.java`
  - `generateToken(Long userId, String username)` — 生成 JWT
  - `validateToken(String token)` — 校验并返回 userId
  - 配置项：secret key 放 application.properties，过期时间 7 天
- `backend/src/main/java/com/drama/config/JwtFilter.java`
  - 实现 `OncePerRequestFilter`
  - 从 `Authorization: Bearer <token>` 提取 token
  - 校验后将 userId 放入 `SecurityContextHolder`
- `backend/src/main/java/com/drama/controller/AuthController.java`
  - `POST /api/auth/register` — 注册，返回 token
  - `POST /api/auth/login` — 登录，返回 token
  - `GET /api/auth/me` — 获取当前用户信息

**修改文件：** `SecurityConfig.java`
- 配置哪些路径需要认证：
  - 公开：`/api/auth/**`, `/api/drama/recommend`, `/api/drama/hot`, `/api/drama/new`, `/api/drama/search`, `/api/drama/*/detail`
  - 需认证：`/api/interaction/**`, `/api/progress/**`, `/api/rating/**`

**修改所有 Controller：**
- 不再从 `@RequestParam Long userId` 获取用户 ID
- 改为从 `SecurityContextHolder` 或自定义注解 `@CurrentUser` 获取
- 删除 `DramaController.detail()` 的 `userId` 参数
- 删除 `EpisodeController.playInfo()` 的 `userId` 参数
- 删除 `ProgressController.report()` 的 `ProgressReport.userId`
- 删除 `InteractionController.answer()` 的 `AnswerRequest.userId`

**修改文件：** `AnswerRequest.java`, `ProgressReport.java`
- 删除 `userId` 字段，改为服务层从上下文获取

### 1.3 修复硬编码密码

**文件：** `docker-compose.yml`
- `MYSQL_ROOT_PASSWORD: root` → `MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}`
- 新建 `.env` 文件：`MYSQL_ROOT_PASSWORD=your_secure_password_here`
- Redis 加密码：`command: redis-server --requirepass ${REDIS_PASSWORD}`
- `.env` 加 `REDIS_PASSWORD=another_secure_password`
- 添加 `.env.example` 作为模板，`.env` 加入 `.gitignore`

**文件：** `sql/init.sql`
- `'drama'@'%' IDENTIFIED BY 'drama123'` → `IDENTIFIED BY '${DRAMA_DB_PASSWORD}'`
- 或改为仅限 localhost：`'drama'@'127.0.0.1'`

### 1.4 Redis 安全

**文件：** `docker-compose.yml`
- Redis 不暴露 6379 端口到宿主机（删除 `ports: - "6379:6379"`，只保留内部网络通信）
- 添加 `--requirepass` 如上

**文件：** `application.properties`（或 application-prod.yml）
- 添加 `spring.data.redis.password=${REDIS_PASSWORD}`

---

## 阶段二：数据模型修正（P0，1-2天）

> 当前数据结构有设计缺陷，后续越晚改成本越高。

### 2.1 互动选项拆表

**现状：** `InteractionPoint.optionsJson` 存 JSON 字符串

**改为：**

新建 `backend/src/main/java/com/drama/model/InteractionOption.java`：
```java
@Entity
@Table(name = "interaction_options")
public class InteractionOption {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interaction_id", nullable = false)
    private InteractionPoint interactionPoint;

    @Column(nullable = false)
    private Long optionIndex;  // 选项编号（1,2,3...）

    @Column(nullable = false, length = 200)
    private String optionText;

    private Boolean isCorrect;  // 是否正确答案（QUIZ 类型用）
}
```

**修改 `InteractionPoint.java`：**
- 删除 `optionsJson` 字段
- 删除 `correctOptionId` 字段
- 添加 `@OneToMany(mappedBy = "interactionPoint", cascade = CascadeType.ALL, orphanRemoval = true)`
  `private List<InteractionOption> options;`

**修改 `EpisodeService.buildInteractionInfo()`：**
- 不再调 `parseOptions(optionsJson)`
- 改为遍历 `point.getOptions()`，按 `optionIndex` 排序

**修改 `DataInitializer.createInteraction()`：**
- 把 JSON 字符串参数改为接收 `List<String>` 选项文本
- 每个选项创建 `InteractionOption` 实体
- QUIZ 类型的正确选项设置 `isCorrect = true`

**修改 `InteractionAnswer.java`：**
- `selectedOptionId` → `selectedOptionIndex`，对应 `InteractionOption.optionIndex`

### 2.2 修 viewCount 双写

**问题：** `DramaService.incrementViewCount()` 和 `ProgressService.reportProgress()` 都在加 viewCount

**修改 `ProgressService.java`：**
- 删除 `reportProgress()` 中首次观看时 `d.setViewCount(d.getViewCount() + 1)` 的逻辑
- 观看计数统一由 `DramaService.incrementViewCount()` 负责
- 进度上报只管进度，不管计数

**修改 `DramaService.incrementViewCount()`：**
- 即使没有 Redis 也不应该读-改-写（并发不安全）
- 无 Redis 时改为：`dramaRepository.incrementViewCount(dramaId)` — 在 Repository 加更新查询：
  ```java
  @Modifying
  @Query("UPDATE Drama d SET d.viewCount = d.viewCount + 1 WHERE d.id = :id")
  void incrementViewCount(@Param("id") Long id);
  ```
- 这样用数据库原子操作，避免并发丢数据

### 2.3 Redis 统计落盘

**问题：** 互动投票统计 24h 过期后数据丢失

**修改 `InteractionService.java`：**
- 删除 `redisTemplate.expire(redisKey, 24, TimeUnit.HOURS)`
- 删除 `redisTemplate.expire(totalKey, 24, TimeUnit.HOURS)`
- Redis 缓存不设过期，改为定时落盘

**新建 `backend/src/main/java/com/drama/config/ScheduledTasks.java`：**
```java
@Component
public class ScheduledTasks {
    // 每5分钟把 Redis 互动统计同步到 DB
    @Scheduled(fixedRate = 300000)
    public void syncInteractionStatsToDatabase() {
        // 遍历 interaction:count:* 的 key
        // 把每个选项的计数写入 InteractionAnswer 的统计表
        // 或更新专门的 interaction_stats 表
    }
}
```

**备选方案（更简单）：** 
- 每次提交答案时同时更新 Redis 和 DB
- Redis 作为读缓存，DB 作为持久存储
- `getStats()` 先查 Redis，miss 则查 DB，查完回填 Redis
- Redis 设置 1h 过期（不是 24h），过期后从 DB 重新加载

### 2.4 修 N+1 查询

**修改 `DramaService.getWatchProgress()`：**

现状（N+1）：
```java
for (Episode ep : episodes) {
    watchProgressRepository.findByUserIdAndEpisodeId(userId, ep.getId())
        .ifPresent(p -> progressMap.put(ep.getId(), p.getPositionMs()));
}
```

改为：
- `WatchProgressRepository` 添加：
  ```java
  List<WatchProgress> findByUserIdAndEpisodeIdIn(Long userId, List<Long> episodeIds);
  ```
- `getWatchProgress()` 改为：
  ```java
  List<Long> epIds = episodes.stream().map(Episode::getId).toList();
  List<WatchProgress> progresses = watchProgressRepository
      .findByUserIdAndEpisodeIdIn(userId, epIds);
  progresses.forEach(p -> progressMap.put(p.getEpisodeId(), p.getPositionMs()));
  ```

**修改 `DramaService.toSummary()` 的 ratingCount N+1：**

- `RatingRepository` 添加批量查询：
  ```java
  @Query("SELECT r.dramaId, COUNT(r) FROM Rating r WHERE r.dramaId IN :ids GROUP BY r.dramaId")
  List<Object[]> countByDramaIds(@Param("ids") List<Long> ids);
  ```
- 在 `getRecommended()/getHot()` 返回 Page 后，一次性查出所有 ratingCount
- 缓存到 Map<Long, Long>，toSummary 时直接取

---

## 阶段三：异常处理与 API 规范（P1，1天）

### 3.1 自定义业务异常

**新建 `backend/src/main/java/com/drama/common/BusinessException.java`：**
```java
public class BusinessException extends RuntimeException {
    private final int code;
    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
    }
}
```

**新建 `backend/src/main/java/com/drama/common/GlobalExceptionHandler.java`：**
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(BusinessException.class)
    public ApiResponse<Void> handleBusiness(BusinessException e) {
        return ApiResponse.error(e.getCode(), e.getMessage());
    }
    @ExceptionHandler(RuntimeException.class)
    public ApiResponse<Void> handleRuntime(RuntimeException e) {
        return ApiResponse.error(500, "服务器内部错误");
    }
}
```

**修改所有 Service 的异常抛出：**
- `throw new RuntimeException("Drama not found: " + dramaId)` → `throw new BusinessException(404, "短剧不存在")`
- `throw new RuntimeException("Episode not found")` → `throw new BusinessException(404, "剧集不存在")`
- `throw new RuntimeException("Interaction not found")` → `throw new BusinessException(404, "互动不存在")`
- `throw new RuntimeException("User not found")` → `throw new BusinessException(404, "用户不存在")`

### 3.2 统一 API 响应格式

**问题：** preview.html 的 localAPI 返回格式和后端 ApiResponse 不一致

**修改 `preview.html` 的 `localAPI()` 函数：**
- 所有返回值统一包装成 `{ code: 200, message: "success", data: {...} }` 格式
- 例如 `return {content:getDBDramas().map(dbDramaSummary)}` → `return {code:200, message:"success", data:{content:getDBDramas().map(dbDramaSummary)}}`
- 前端所有 `api()` 调用处，从 `data.content` 改为 `data.data.content`

### 3.3 参数校验

**修改 `AnswerRequest.java`：**
```java
@NotNull(message = "互动ID不能为空")
private Long interactionId;

@NotNull(message = "选项不能为空")
private Long choiceId;
```

**修改 `ProgressReport.java`：**
```java
@NotNull(message = "剧集ID不能为空")
private Long episodeId;

@NotNull(message = "播放位置不能为空")
private Long positionMs;
```

**Controller 方法参数加 `@Valid`：**
```java
public ApiResponse<Object> answer(@Valid @RequestBody AnswerRequest request)
public ApiResponse<Void> report(@Valid @RequestBody ProgressReport report)
```

**pom.xml 添加：**
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

---

## 阶段四：互动体验核心改造（P1，3-5天）

> 这是项目能不能站住脚的关键。

### 4.1 互动点扩展到多集

**修改 `DataInitializer.java`：**

每部剧至少前 5 集都要有互动点，具体配置：

**北派寻宝笔记：**
- 第1集（已有）：投票+答题+彩蛋，保持不变
- 第2集：新增 CHOICE "寻宝方向选择"（古墓/密室/地下河）+ QUIZ "这个暗号代表什么？" + EGG "隐藏地图碎片1"
- 第3集：新增 VOTE "你觉得内鬼是谁？" + CHOICE "分头行动还是一起？" + EGG "隐藏地图碎片2"
- 第4集：新增 QUIZ + CHOICE + EGG "隐藏地图碎片3"
- 第5集：新增 VOTE + EGG "完整地图解锁"

**天下第一纨绔：**
- 第1集（已有）：投票+抉择+彩蛋，保持不变
- 第2集：新增 QUIZ "男主的真实身份？" + CHOICE "面对挑衅你怎么做？" + EGG
- 第3集：新增 VOTE + CHOICE + EGG
- 第4集：新增 QUIZ + VOTE + EGG
- 第5集：新增 CHOICE + EGG

**其他4部剧同理，每部至少前3集有互动。**

具体操作：为每部剧的 `initXxx()` 方法添加 `createInteraction()` 调用，获取第2-5集的 Episode 引用后添加互动点。

### 4.2 抉择影响后续互动（最小可行版）

当前 CHOICE 类型对剧情没有实际影响，但完整的分支视频太重。最小可行方案：

**方案：不同选择 → 不同后续互动问题**

**修改 `InteractionPoint.java`：**
- 新增字段：`@ManyToOne private InteractionPoint prerequisite;`（前置互动）
- 新增字段：`private Long prerequisiteChoiceIndex;`（前置互动的选择值，匹配则显示）

**示例逻辑：**
- 第1集 30s 有 CHOICE："你会怎么做？A.正面硬刚 B.智取 C.假装认怂"
- 第1集 55s 有 QUIZ A（前置=上面CHOICE, prerequisiteChoiceIndex=1）："硬刚的后果是什么？"
- 第1集 55s 有 QUIZ B（前置=上面CHOICE, prerequisiteChoiceIndex=2）："智取的计策是什么？"

**修改 `EpisodeService.buildInteractionInfoList()`：**
- 查询该集所有互动点后，根据用户已答记录，过滤出应显示的互动点
- 如果前置互动未答或选择了不匹配的选项，则跳过该互动点
- 返回给前端时只包含当前用户应看到的互动

**修改 `PlayInfo.InteractionInfo`：**
- 新增 `Long prerequisiteId` 和 `Long prerequisiteChoiceIndex`（前端也需要知道过滤条件）

### 4.3 彩蛋图鉴页面

**新建 `backend/src/main/java/com/drama/controller/EggController.java`：**
```java
@GetMapping("/api/user/{userId}/eggs")
public ApiResponse<List<EggInfo>> getEggs(@PathVariable Long userId)

@GetMapping("/api/user/{userId}/eggs/count")
public ApiResponse<Map<String, Object>> getEggCount(@PathVariable Long userId)

@GetMapping("/api/eggs/collection")  
public ApiResponse<List<EggCollectionInfo>> getEggCollection(@PathVariable Long userId)
// 返回所有剧的所有彩蛋，标记哪些已收集、哪些未收集
```

**新建 `EggInfo.java` / `EggCollectionInfo.java` DTO**

**前端 preview.html：**
- 在个人中心页面添加"彩蛋图鉴"入口
- 新增彩蛋图鉴页面：
  - 按剧集分组展示
  - 已收集的显示内容+金色边框
  - 未收集的显示问号+灰色
  - 顶部显示总收集进度："已收集 3/18"
  - 全部收集一部剧的彩蛋 → 触发特效 + 加50积分

### 4.4 积分消费场景

**新增积分消费接口：**

`backend/src/main/java/com/drama/controller/PointsController.java`：
```java
@PostMapping("/api/points/exchange")
public ApiResponse<ExchangeResult> exchangePoints(
    @RequestBody ExchangeRequest request) 
    // request: type("HINT" | "SKIP_AD" | "UNLOCK_EPISODE"), targetId
```

消费场景：
- **提示卡**（50积分）：答题互动时可以花积分查看提示，高亮正确答案倾向
- **跳过广告**（10积分）：如果未来加广告，可花积分跳过
- **解锁剧集**（100积分）：某些剧集设为"积分解锁"，需花积分观看

**修改 `InteractionPoint.java`：**
- 新增 `private Boolean requiresUnlock;`（是否需要积分解锁的剧集）

**修改 `User.java`：**
- 新增积分消费方法，加 `@Version` 字段防止并发超扣

---

## 阶段五：前端工程化（P1，2天）

### 5.1 拆分 preview.html

当前 70000+ 字符全在一个文件。拆分为：

```
frontend/
├── index.html          — 纯 HTML 结构
├── css/
│   ├── base.css        — CSS 变量、reset、通用样式
│   ├── home.css        — 首页样式
│   ├── detail.css      — 详情页样式
│   ├── player.css      — 播放器样式
│   ├── interaction.css — 互动弹窗样式
│   └── auth.css        — 登录注册样式
├── js/
│   ├── app.js          — 入口、路由、全局状态
│   ├── api.js           — API 层（后端+本地降级）
│   ├── db.js            — localStorage 数据管理
│   ├── home.js          — 首页逻辑
│   ├── detail.js        — 详情页逻辑
│   ├── player.js        — 播放器逻辑
│   ├── interaction.js   — 互动系统逻辑
│   ├── auth.js          — 登录注册逻辑
│   └── cover.js         — SVG 封面生成
```

### 5.2 本地 API 层对齐后端

**修改 `js/api.js`：**
- 所有 localAPI 返回值严格匹配后端 `ApiResponse` 格式
- `api()` 函数改为：后端返回 → 解包 `data` 字段；本地返回 → 同样解包
- 调用方统一拿到的就是 `data` 内容，不用关心来源

### 5.3 前端鉴权对接

**修改 `js/auth.js`：**
- 登录成功后将 JWT token 存入 localStorage
- `api()` 函数在 fetch 时自动带上 `Authorization: Bearer <token>`
- 后端返回 401 时，清除本地 token，跳转登录页

---

## 阶段六：搜索优化（P2，1天）

### 6.1 搜索增强

**修改 `DramaRepository.search()`：**
```java
@Query("SELECT d FROM Drama d WHERE " +
    "d.title LIKE %:keyword% OR " +
    "d.category LIKE %:keyword% OR " +
    "d.description LIKE %:keyword% OR " +
    "d.id IN (SELECT e.drama.id FROM Episode e WHERE e.title LIKE %:keyword%)")
Page<Drama> search(@Param("keyword") String keyword, Pageable pageable);
```

**修改 `DramaController.search()`：**
- 添加排序参数：默认按评分+播放量排序，搜索结果应该把热门剧排前面
- `PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "viewCount"))`

**前端搜索增强：**
- 搜索框输入时显示搜索建议（已看过的剧优先）
- 搜索结果为空时显示热门推荐
- 搜索历史记录（localStorage）

---

## 阶段七：Android 端（P2，3-5天 或 暂时移除）

### 方案A：移除 Android 空壳

如果短期不打算做原生 App：
- 删除 `android/` 目录
- README 技术栈表删除 Android 行
- README 删除"Android 应用"相关描述
- 在 README 添加路线图说明："移动端优先以 PWA/WebView 形式提供，原生 Android 应用规划中"

### 方案B：真正实现 Android 端

**修改 `android/app/build.gradle.kts`：**

添加核心依赖：
```kotlin
implementation("androidx.compose.ui:ui:1.5.4")
implementation("androidx.compose.material3:material3:1.1.2")
implementation("androidx.compose.ui:ui-tooling-preview:1.5.4")
implementation("androidx.activity:activity-compose:1.8.2")
implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")
implementation("androidx.media3:media3-exoplayer:1.2.0")
implementation("androidx.media3:media3-ui:1.2.0")
implementation("com.squareup.retrofit2:retrofit:2.9.0")
implementation("com.squareup.retrofit2:converter-gson:2.9.0")
implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
```

**新建核心文件：**
- `data/api/DramaApiService.kt` — Retrofit 接口定义
- `data/api/ApiClient.kt` — Retrofit 实例 + 拦截器（JWT token）
- `data/repository/DramaRepository.kt` — 数据仓库
- `ui/screens/HomeScreen.kt` — Compose 首页
- `ui/screens/DetailScreen.kt` — Compose 详情页
- `ui/screens/PlayerScreen.kt` — Compose + ExoPlayer 播放器
- `ui/components/InteractionOverlay.kt` — 互动弹窗组件
- `ui/theme/Theme.kt` — 暗色主题
- `viewmodel/HomeViewModel.kt` — 首页状态管理
- `viewmodel/PlayerViewModel.kt` — 播放器状态管理

**AndroidManifest.xml：**
- 添加 INTERNET 权限
- 配置 `android:usesCleartextTraffic="true"`（开发期 HTTP）
- 修改 minSdk 从 24 → 26（README 写的就是 26，build.gradle 却是 24）

---

## 阶段八：部署与运维（P2，1天）

### 8.1 Docker Compose 修复

**修改 `docker-compose.yml`：**
- MySQL 端口不暴露到宿主机（删除 `ports: - "3306:3306"`，只在内网通信）
- Redis 同理不暴露端口
- backend 添加 healthcheck：
  ```yaml
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8080/api/drama/recommend?page=0&size=1"]
    interval: 15s
    timeout: 5s
    retries: 3
  ```
- 添加 `networks:` 定义内部网络
- backend 的 `MYSQL_PASSWORD` 和 `REDIS_PASSWORD` 从 `.env` 读取

### 8.2 deploy.sh 修复

**修改 `deploy.sh`：**
- 添加错误处理：每步检查退出码
- 添加健康检查循环替代 `sleep 10`：
  ```bash
  echo "Waiting for backend..."
  for i in $(seq 1 30); do
    if curl -sf http://localhost:8080/api/drama/recommend?page=0\&size=1 > /dev/null 2>&1; then
      echo "Backend is ready!"
      break
    fi
    echo "Waiting... ($i/30)"
    sleep 2
  done
  ```
- 添加回滚函数：失败时 `docker-compose down`

### 8.3 K8s 配置修复

**`k8s/deployment.yaml`：**
- 添加 `readinessProbe` 和 `livenessProbe`
- 添加 `resources` 限制（CPU/内存）
- ConfigMap 管理环境变量
- Secret 管理密码

---

## 阶段九：代码质量（P3，持续）

### 9.1 添加单元测试

**优先覆盖：**
- `InteractionService.submitAnswer()` — 正常提交、重复提交、QUIZ 加分、EGG 收集
- `DramaService.getDetail()` — 正常查询、不存在的 ID
- `ProgressService.reportProgress()` — 首次上报、更新进度
- `EpisodeService.getPlayInfo()` — 正常查询、互动点解析

**文件位置：** `backend/src/test/java/com/drama/service/`

**pom.xml 修改：** 删除 H2 的 `runtime` scope 重复声明，只保留 `test` scope 的 H2

### 9.2 README 诚实化

**当前问题：** README 声称已实现 Kotlin + Jetpack Compose + ExoPlayer，但代码中没有

**修改：**
- 技术栈表 Android 行改为："Android（规划中）— Kotlin + Jetpack Compose + ExoPlayer"
- 或者按方案A直接删除 Android 相关描述
- "已完成（MVP）"中删除与 Android 相关的功能描述
- 添加"项目状态"章节，诚实说明各模块完成度
- 添加 LICENSE（推荐 MIT）

### 9.3 分支名修正

- `master` → `main`（GitHub 仓库设置中修改默认分支，然后本地重命名）
- 以后功能开发走 feature 分支 + PR

---

## 执行顺序总览

| 阶段 | 内容 | 预估工时 | 前置依赖 |
|------|------|---------|---------|
| 一 | 安全补底 | 1-2天 | 无 |
| 二 | 数据模型修正 | 1-2天 | 无 |
| 三 | 异常处理与API规范 | 1天 | 阶段一（鉴权后统一错误码） |
| 四 | 互动体验核心改造 | 3-5天 | 阶段二（选项拆表后才能做分支互动） |
| 五 | 前端工程化 | 2天 | 阶段一（前端对接JWT） |
| 六 | 搜索优化 | 1天 | 无 |
| 七A | 移除Android空壳 | 0.5天 | 无 |
| 七B | 实现Android端 | 3-5天 | 阶段一+三 |
| 八 | 部署与运维 | 1天 | 阶段一（密码不硬编码后才能配） |
| 九 | 代码质量 | 持续 | 阶段一+二+三完成后开始 |

**建议路线：** 阶段一 → 阶段二 → 阶段三 → 阶段四 → 阶段五 → 阶段七A → 阶段八 → 阶段六 → 阶段九

先把安全和数据模型搞对，然后集中做互动体验（这才是项目的灵魂），前端工程化跟着走，Android空壳先删，搜索和代码质量持续迭代。
