# P3 后实测修复 — 继续执行计划

> 基于上次会话的进度：步骤1已完成并提交，步骤2-4代码已改但未提交，步骤5-7未开始

---

## 当前状态

| 步骤 | 描述 | 状态 |
|------|------|------|
| 步骤1 | H2启动失败修复 | ✅ 已提交 |
| 步骤2 | SecurityConfig移除/api/auth/me | 🔧 代码已改，未提交 |
| 步骤3 | FavoriteController加@Transactional | 🔧 代码已改，未提交 |
| 步骤4 | PointsController加@Transactional | 🔧 代码已改，未提交 |
| 步骤5 | EggController NPE+N+1修复 | ❌ 未开始 |
| 步骤6 | 前端弹幕登录检查 | ❌ 未开始 |
| 步骤7 | 弹幕限流 | ❌ 未开始 |

---

## 执行步骤

### 步骤A: 编译验证 + 提交步骤2-4

步骤2-4的代码改动已经就位（SecurityConfig、FavoriteController、PointsController），需要：
1. `mvn package -DskipTests` 验证编译通过
2. `git add -A && git commit -m "fix: 并发安全-SecurityConfig移除permitAll+FavoriteController/PointsController加@Transactional"`

### 步骤B: 修复EggController NPE+N+1

**问题**: `EggController.getCollection()` 第39行 `egg.getEpisode().getDrama().getId()` — episode/drama 是 LAZY 加载，在循环中逐个访问触发 N+1 查询 + 潜在 NPE。

**修复方案**: 在 `InteractionPointRepository` 中添加 JOIN FETCH 查询方法，替代当前的 `findByInteractionType`。

**文件1**: `backend/src/main/java/com/drama/repository/InteractionPointRepository.java`

添加方法：
```java
@Query("SELECT ip FROM InteractionPoint ip JOIN FETCH ip.episode e JOIN FETCH e.drama WHERE ip.interactionType = :type")
List<InteractionPoint> findByInteractionTypeWithEpisodeAndDrama(@Param("type") InteractionPoint.InteractionType type);
```

**文件2**: `backend/src/main/java/com/drama/controller/EggController.java`

将第29行：
```java
List<InteractionPoint> allEggs = interactionPointRepository.findByInteractionType(InteractionPoint.InteractionType.EGG);
```
改为：
```java
List<InteractionPoint> allEggs = interactionPointRepository.findByInteractionTypeWithEpisodeAndDrama(InteractionPoint.InteractionType.EGG);
```

验证：`mvn package -DskipTests`
提交：`git add -A && git commit -m "fix: EggController NPE+N+1-JOIN FETCH查询预加载关联实体"`

### 步骤C: 前端弹幕登录检查

**问题**: `DanmakuSystem.sendDanmaku` 未检查登录状态，未登录用户发送弹幕会 401 但无提示。

**现状确认**: `state.js` 第33行已有 `isLoggedIn()` 方法，可直接使用。

**文件**: `backend/src/main/resources/static/js/player.js`

在 `DanmakuSystem.sendDanmaku` 方法开头添加登录检查：
```javascript
async sendDanmaku(episodeId, content, positionMs) {
    if (!state.isLoggedIn()) {
        app.showLoginPage();
        return;
    }
    try {
        // ... 现有逻辑
```

提交：`git add -A && git commit -m "fix: 前端弹幕发送前检查登录状态"`

### 步骤D: 弹幕限流

**问题**: `DanmakuController.sendDanmaku` 无频率限制。

**注意**: H2 profile 排除了 Redis 自动配置（application-h2.yml 第24-25行），所以 `StringRedisTemplate` 在 H2 模式下为 null。需要用 `@Autowired(required = false)` 注入并做 null 检查，与 DramaService 中的模式一致。

**文件**: `backend/src/main/java/com/drama/controller/DanmakuController.java`

1. 添加 `StringRedisTemplate` 字段（`@Autowired(required = false)`）
2. 在 `sendDanmaku` 方法中添加限流逻辑：
```java
if (redisTemplate != null) {
    String rateLimitKey = "danmaku:rate:" + userId;
    Long count = redisTemplate.opsForValue().increment(rateLimitKey);
    if (count != null && count == 1) {
        redisTemplate.expire(rateLimitKey, 60, java.util.concurrent.TimeUnit.SECONDS);
    }
    if (count != null && count > 10) {
        throw new BusinessException(429, "发送太频繁，请稍后再试");
    }
}
```

验证：`mvn package -DskipTests`
提交：`git add -A && git commit -m "feat: 弹幕限流-Redis每分钟10条"`

### 步骤E: 重新构建 + 启动 + 用户视角测试

1. `mvn package -DskipTests`
2. 启动后端：`java -jar target/short-drama-player-1.0.0.jar --spring.profiles.active=h2`
3. 用 gstack 浏览器测试完整流程：
   - 首页加载 → 推荐列表
   - 点击剧集 → 详情页
   - 播放视频 → 弹幕/互动
   - 登录 → 收藏/评论/积分
   - 彩蛋图鉴
4. 记录问题

### 步骤F: 生成最终评估报告

根据测试结果，给出：
1. 各修复项是否生效
2. 新发现的问题
3. 给 Claude Code 的后续修复方案
4. 分步喂指令的方法

---

## 注意事项

1. PowerShell 不支持 `&&`，需要用 `;` 或分步执行
2. H2 模式下 Redis 不可用，限流逻辑需要 null 检查
3. `@Autowired(required = false)` 是项目中已有的模式（参考 DramaService）
4. `state.isLoggedIn()` 已存在于 state.js 第33行
5. 每个步骤改之前先读文件确认现状
