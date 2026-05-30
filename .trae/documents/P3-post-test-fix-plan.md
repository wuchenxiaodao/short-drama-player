# P3后实测问题清单与Claude Code执行方案

> 测试时间：2026-05-30
> 基于 commit `5a794c5` (feat(P3): 分页上限@Max(100)+Redis计数重置) 后的代码

---

## 一、P3任务完成验证

| 任务 | 状态 | 说明 |
|------|------|------|
| P3-1 倍速记忆 | ✅ 完成 | changeSpeed存localStorage，loadEpisode恢复 |
| P3-2 分享 | ✅ 完成 | shareDrama优先navigator.share，fallback clipboard |
| P3-3 H2编码 | ❌ **引入致命Bug** | CHARSET=UTF-8导致H2启动失败 |
| P3-4 并发安全 | ✅ 完成 | 原子方法已添加，Service已改用 |
| P3-5 LAZY加载 | ✅ 完成 | JOIN FETCH已实现 |
| P3-6 JwtFilter日志 | ✅ 完成 | @Slf4j + 按异常类型分别处理 |
| P3-7 CORS | ✅ 完成 | corsConfigurationSource Bean已配置 |
| P3-8 分页上限 | ✅ 完成 | 所有Controller的size参数已加@Max(100) |
| P3-9 Redis viewCount | ✅ 完成 | 去掉expire，每10次同步DB |
| P3-10 OnlineService | ✅ 完成 | Sorted Set + 按时间戳清理 |
| P3-11 删除android+README | ✅ 完成 | 目录已删除 |
| P3-12 RatingController DTO | ✅ 完成 | RatingRequest + @Valid |

---

## 二、致命Bug（必须立即修复）

### BUG-1: H2数据库启动失败 — CHARSET参数不兼容

**文件**: `backend/src/main/resources/application-h2.yml` 第6行

**现象**: `java -jar target/short-drama-player-1.0.0.jar --spring.profiles.active=h2` 启动失败

**错误**: `Unsupported connection setting "CHARSET" [90113-224]`

**根因**: H2 2.2.x 不再支持 `CHARSET=UTF-8` 连接参数。P3-3在URL中添加了`;CHARSET=UTF-8`导致崩溃。

**修复**:

```yaml
# application-h2.yml — 修改第6行
# 错误写法：
url: jdbc:h2:mem:drama_player;DB_CLOSE_DELAY=-1;MODE=MYSQL;CHARSET=UTF-8
# 正确写法（去掉CHARSET，H2 2.x默认UTF-8）：
url: jdbc:h2:mem:drama_player;DB_CLOSE_DELAY=-1;MODE=MYSQL
```

同时第11行的 `connection-init-sql: SET NAMES UTF-8` 在H2中也不支持（这是MySQL语法），需要删除或改为H2兼容语法。

```yaml
# 删除或注释掉第10-11行
# hikari:
#   connection-init-sql: SET NAMES UTF-8
```

---

## 三、P0-P2新增功能引入的问题

### BUG-2: FavoriteController — N+1查询 + 无事务并发问题

**文件**: `backend/src/main/java/com/drama/controller/FavoriteController.java`

**问题**:
1. `getFavorites` 对每个dramaId逐个调用`dramaService.getDetail()`，N+1查询
2. `toggleFavorite` 先查后存/删，无`@Transactional`，并发可重复收藏
3. 缺少Service层，Controller直接操作Repository

**修复**:

```java
// FavoriteController.java — 修复toggleFavorite并发问题
@PostMapping("/{dramaId}")
@Transactional
public ApiResponse<Map<String, Object>> toggleFavorite(@PathVariable Long dramaId) {
    Long userId = AuthUtils.requireUserId();
    Optional<Favorite> existing = favoriteRepository.findByUserIdAndDramaId(userId, dramaId);
    if (existing.isPresent()) {
        favoriteRepository.delete(existing.get());
        return ApiResponse.success(Map.of("favorited", false));
    } else {
        Favorite fav = new Favorite();
        fav.setUserId(userId);
        fav.setDramaId(dramaId);
        favoriteRepository.save(fav);
        return ApiResponse.success(Map.of("favorited", true));
    }
}

// getFavorites — 批量查询替代逐个查询
@GetMapping("/list")
public ApiResponse<List<DramaSummary>> getFavorites() {
    Long userId = AuthUtils.requireUserId();
    List<Long> dramaIds = favoriteRepository.findDramaIdsByUserId(userId);
    if (dramaIds.isEmpty()) return ApiResponse.success(List.of());
    List<Drama> dramas = dramaRepository.findAllById(dramaIds);
    // ... 批量转换为DramaSummary
}
```

---

### BUG-3: PointsController — 竞态条件导致积分超扣

**文件**: `backend/src/main/java/com/drama/controller/PointsController.java`

**问题**:
1. `buyHint` 先查余额再扣减，无`@Transactional`，并发可绕过余额检查
2. 返回值`remainingPoints`使用旧实体计算，与数据库不一致

**修复**:

```java
@PostMapping("/hint")
@Transactional
public ApiResponse<Map<String, Object>> buyHint(@RequestBody BuyHintRequest request) {
    Long userId = AuthUtils.requireUserId();
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new BusinessException(404, "用户不存在"));
    int cost = 5;
    if (user.getPoints() < cost) {
        throw new BusinessException(400, "积分不足");
    }
    userRepository.addPoints(userId, -cost);
    int remaining = user.getPoints() - cost;
    return ApiResponse.success(Map.of("remainingPoints", remaining, "cost", cost));
}
```

---

### BUG-4: EggController — NPE风险 + N+1查询

**文件**: `backend/src/main/java/com/drama/controller/EggController.java`

**问题**:
1. `egg.getEpisode().getDrama().getId()` — episode/drama可能为null（LAZY未初始化）
2. 循环中逐个访问关联实体，N+1查询

**修复**:

```java
// EggController.java — 使用JOIN FETCH查询
// 在UserEggRepository中添加：
@Query("SELECT ue FROM UserEgg ue JOIN FETCH ue.interactionPoint ip JOIN FETCH ip.episode e JOIN FETCH e.drama WHERE ue.userId = :userId ORDER BY ue.collectedAt DESC")
List<UserEgg> findByUserIdWithDetails(@Param("userId") Long userId);
```

---

### BUG-5: SecurityConfig — /api/auth/me 不应 permitAll

**文件**: `backend/src/main/java/com/drama/config/SecurityConfig.java`

**问题**: `/api/auth/me` 设为permitAll，但该接口返回当前登录用户信息，未登录时应返回401。

**修复**: 从permitAll列表中移除`/api/auth/me`。

---

### BUG-6: DanmakuController — 无限流 + 无内容审核

**文件**: `backend/src/main/java/com/drama/controller/DanmakuController.java`

**问题**: 发送弹幕无频率限制，用户可无限刷弹幕；无敏感词过滤。

**修复**:

```java
// 简单限流：同一用户每分钟最多10条弹幕
@PostMapping("/send")
public ApiResponse<Map<String, Object>> sendDanmaku(@RequestBody DanmakuRequest request) {
    Long userId = AuthUtils.requireUserId();
    // 限流检查
    String rateLimitKey = "danmaku:rate:" + userId;
    if (redisTemplate != null) {
        Long count = redisTemplate.opsForValue().increment(rateLimitKey);
        if (count != null && count == 1) {
            redisTemplate.expire(rateLimitKey, 60, java.util.concurrent.TimeUnit.SECONDS);
        }
        if (count != null && count > 10) {
            throw new BusinessException(429, "发送太频繁，请稍后再试");
        }
    }
    // 内容校验
    String content = request.getContent();
    if (content == null || content.trim().isEmpty() || content.length() > 100) {
        throw new BusinessException(400, "弹幕内容不合法");
    }
    // ... 保存
}
```

---

## 四、前端实测问题

### FE-1: 弹幕功能调用不存在的后端接口

**现象**: player.js中`DanmakuSystem`调用`/api/danmaku/episode/${episodeId}`和`/api/danmaku/send`，但SecurityConfig中只放行了`GET /api/danmaku/episode/**`，发送弹幕需要认证。

**影响**: 未登录用户发送弹幕会401，但前端没有提示登录。

**修复**: 在`DanmakuSystem.sendDanmaku`中添加登录检查：

```javascript
async sendDanmaku(episodeId, content, positionMs) {
    if (!state.isLoggedIn()) {
        app.showLoginPage();
        return;
    }
    // ... 现有逻辑
}
```

---

### FE-2: 彩蛋图鉴页面 — 后端EggController的N+1问题

**现象**: 点击🥚图标进入彩蛋图鉴，如果彩蛋数据多，加载会很慢。

**根因**: EggController循环中逐个访问`egg.getEpisode().getDrama()`触发懒加载。

**修复**: 同BUG-4。

---

### FE-3: 追剧按钮 — 未登录时点击无反应

**现象**: 未登录时点击"🤍 追剧"按钮，前端调用`app.toggleFavorite()`，该方法会检查`state.isLoggedIn()`并跳转登录页，但`state.isLoggedIn()`方法可能不存在。

**修复**: 在`state.js`中确认`isLoggedIn()`方法存在：

```javascript
isLoggedIn() {
    return !!this.token;
}
```

---

### FE-4: 评论功能 — 后端Comment模型可能缺少dramaId字段

**现象**: 前端`postDramaComment`发送`{dramaId: ..., content: ...}`，但后端`CommentRequest`可能只有`interactionId`和`content`字段。

**修复**: 检查`CommentRequest`是否有`dramaId`字段，如果没有需要添加。

---

## 五、Claude Code分步执行方案

### 执行原则
1. 每个BUG一个commit
2. 改之前先`cat`读文件确认现状
3. 改完立即`mvn package -DskipTests`验证编译
4. 以实际代码为准，目标不变，自行适配实现方式

---

### 步骤1: 修复致命Bug — H2启动失败（最高优先级）

```
读取 backend/src/main/resources/application-h2.yml
将第6行 url 中的 ;CHARSET=UTF-8 删除
将第10-11行的 connection-init-sql 删除或注释
保存
mvn package -DskipTests
java -jar target/short-drama-player-1.0.0.jar --spring.profiles.active=h2（验证启动成功后Ctrl+C停止）
git add -A && git commit -m "fix: H2启动失败-移除不兼容的CHARSET参数"
```

---

### 步骤2: 修复SecurityConfig — 移除/api/auth/me的permitAll

```
读取 backend/src/main/java/com/drama/config/SecurityConfig.java
从permitAll列表中移除 /api/auth/me
保存
mvn package -DskipTests
git add -A && git commit -m "fix: /api/auth/me不应permitAll"
```

---

### 步骤3: 修复FavoriteController并发问题

```
读取 backend/src/main/java/com/drama/controller/FavoriteController.java
在toggleFavorite方法上加@Transactional
在类上添加 @Transactional(readOnly = true)，toggleFavorite方法上加 @Transactional
保存
mvn package -DskipTests
git add -A && git commit -m "fix: FavoriteController并发安全-添加@Transactional"
```

---

### 步骤4: 修复PointsController竞态条件

```
读取 backend/src/main/java/com/drama/controller/PointsController.java
在buyHint方法上加@Transactional
保存
mvn package -DskipTests
git add -A && git commit -m "fix: PointsController竞态条件-添加@Transactional"
```

---

### 步骤5: 修复EggController NPE + N+1

```
读取 backend/src/main/java/com/drama/controller/EggController.java
读取 backend/src/main/java/com/drama/repository/UserEggRepository.java
在UserEggRepository中添加JOIN FETCH查询方法
修改EggController使用新查询方法
保存
mvn package -DskipTests
git add -A && git commit -m "fix: EggController NPE+N+1-JOIN FETCH查询"
```

---

### 步骤6: 前端修复 — 弹幕登录检查 + state.isLoggedIn

```
读取 backend/src/main/resources/static/js/player.js
读取 backend/src/main/resources/static/js/state.js
在DanmakuSystem.sendDanmaku中添加登录检查
确认state.isLoggedIn()方法存在
保存
git add -A && git commit -m "fix: 前端弹幕登录检查+state.isLoggedIn"
```

---

### 步骤7: 弹幕限流

```
读取 backend/src/main/java/com/drama/controller/DanmakuController.java
在sendDanmaku方法中添加简单限流逻辑（Redis计数器，每分钟10条）
保存
mvn package -DskipTests
git add -A && git commit -m "feat: 弹幕限流-每分钟10条"
```

---

## 六、给用户的Claude Code使用方法

### 方法：分批喂指令

将上述7个步骤逐个喂给Claude Code，每次只给一个步骤。格式如下：

```
执行步骤1：修复H2启动失败

读取 backend/src/main/resources/application-h2.yml
将第6行 url 中的 ;CHARSET=UTF-8 删除
将第10-11行的 connection-init-sql 删除或注释
保存
mvn package -DskipTests
java -jar target/short-drama-player-1.0.0.jar --spring.profiles.active=h2（验证启动成功后Ctrl+C停止）
git add -A && git commit -m "fix: H2启动失败-移除不兼容的CHARSET参数"

改之前先cat读一下当前文件内容，确认现状再动手，不要猜。
```

等Claude Code完成步骤1后，再给步骤2：

```
执行步骤2：修复SecurityConfig

读取 backend/src/main/java/com/drama/config/SecurityConfig.java
从permitAll列表中移除 /api/auth/me
保存
mvn package -DskipTests
git add -A && git commit -m "fix: /api/auth/me不应permitAll"

改之前先cat读一下当前文件内容，确认现状再动手，不要猜。
```

以此类推，每个步骤独立执行。

### 如果CC执行中出了问题

**卡住/理解错了：**
```
停。你理解错了，[具体说明正确理解]。重来这个任务。
```

**改出bug了：**
```
回退：git checkout -- [出问题的文件]
重新执行步骤X，注意 [具体注意事项]。
```

**context快满了：**
```
/compact
继续执行步骤X，你之前已经完成了 [列已完成项]，现在接着做。
```

---

## 七、评估标准

所有步骤完成后，用以下方式验证：

1. **编译验证**: `mvn package -DskipTests` 成功
2. **启动验证**: `java -jar target/short-drama-player-1.0.0.jar --spring.profiles.active=h2` 启动成功
3. **API验证**:
   - `curl http://localhost:8080/api/drama/recommend?page=0&size=2` 返回200
   - `curl http://localhost:8080/api/auth/me` 未登录时返回401（不再permitAll）
   - 注册+登录后调用收藏/弹幕/积分接口正常
4. **前端验证**: 浏览器打开 `http://localhost:8080/` 测试完整流程
5. **Git验证**: `git log --oneline` 确认每个步骤都有独立commit
