# 短剧互动播放器 — 深度用户视角改进指南

> 基于 [wuchenxiaodao/short-drama-player](https://github.com/wuchenxiaodao/short-drama-player)
> 目标：让项目从"能跑"变成"好用"，以深度用户体验为核心驱动
> 执行工具：Claude Code（模型 xiaomimimov2.5pro）
> 生成时间：2026-05-30

---

## 使用说明

1. 每个任务独立成块，包含：问题→目标→改哪个文件→完整代码→验证方式
2. 按优先级排序，P0 必须先做，P1 紧随，P2/P3 按需
3. 建议每次执行 1-2 个任务后 `mvn package -DskipTests && java -jar target/short-drama-player-1.0.0.jar --spring.profiles.active=h2` 验证
4. 每个代码块标注了文件路径，直接在 Claude Code 中用 `/plan` 确认方向后执行

---

## P0 — 必须立即修复（体验断裂 / 开箱即废）

---

### P0-1. 内置测试视频，开箱即用

**问题：** 用户第一次启动看到黑屏，连个demo视频都没有，第一印象就是"坏了"。

**目标：** DataInitializer 中所有剧集使用公开测试视频URL，启动即可播放。

**修改文件：** `backend/src/main/java/com/drama/config/DataInitializer.java`

**操作：** 找到所有 `setVideoUrl` 调用，将路径替换为公开测试视频。如果找不到视频相关的URL，搜索 `videoUrl` 字段赋值处。

```java
// 在 DataInitializer 中，找到创建 Episode 的代码
// 将所有 episode.setVideoUrl(...) 统一改为：

// 方案：使用不同时长的公开测试视频模拟短剧
episode.setVideoUrl("https://www.w3schools.com/html/mov_bbb.mp4");

// 或者更好：使用不同视频区分不同剧集（每个短剧用不同视频）
// 北派寻宝笔记的剧集
episode.setVideoUrl("https://www.w3schools.com/html/mov_bbb.mp4");

// 天下第一纨绔的剧集
episode.setVideoUrl("https://www.w3schools.com/html/movie.mp4");

// 十八岁太奶奶的剧集
episode.setVideoUrl("https://www.w3schools.com/html/mov_bbb.mp4");

// 其他短剧类似，轮换使用这两个测试视频
```

同时在 Episode 实体或 VideoController 中添加视频加载失败提示。

**修改文件：** `backend/src/main/resources/static/js/player.js`

```javascript
// 在 video 元素的事件监听中添加错误处理
// 找到 setupEventListeners 方法或 video 元素初始化的地方，添加：

this.videoElement.addEventListener('error', (e) => {
    const errorDisplay = document.getElementById('player-error');
    if (errorDisplay) {
        errorDisplay.textContent = '视频加载失败，请检查网络连接或稍后重试';
        errorDisplay.style.display = 'block';
    }
});

this.videoElement.addEventListener('loadeddata', () => {
    const errorDisplay = document.getElementById('player-error');
    if (errorDisplay) {
        errorDisplay.style.display = 'none';
    }
});
```

**修改文件：** `backend/src/main/resources/static/index.html`（或对应的播放器HTML模板）

```html
<!-- 在播放器区域添加错误提示容器 -->
<!-- 找到 video 元素附近，添加 -->
<div id="player-error" style="display:none; color:#fff; text-align:center; padding:20px; background:rgba(0,0,0,0.8); position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); border-radius:8px;"></div>
```

**验证：**
1. `mvn package -DskipTests` 
2. 启动后端 `--spring.profiles.active=h2`
3. 打开浏览器访问，进入任意短剧点击播放
4. 确认视频能播放（即使是测试视频），黑屏时有错误提示

---

### P0-2. 互动选择影响后续体验（核心卖点修复）

**问题：** 用户选A或选B，看的内容完全一样。互动=弹窗广告，不是真互动。

**目标：** 最小可行版：不同选择 → 显示不同的后续互动问题 + 显示不同的反馈文本。完整版需要分支视频，但先做轻量版让用户感受到"选择有影响"。

#### 第一步：后端 — InteractionOption 增加 nextInteractionId 字段

**修改文件：** `backend/src/main/java/com/drama/model/InteractionOption.java`

添加字段：
```java
// 在 InteractionOption 类中添加：

@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "next_interaction_id")
private InteractionPoint nextInteraction;  // 选了这个选项后，跳转到哪个互动点

@Column(length = 500)
private String feedbackText;  // 选择后的反馈文本，如"你选择了正面硬刚！敌人被你的气势震慑住了"
```

**修改文件：** 无需额外SQL迁移，JPA auto-ddl 会自动创建列（H2模式）。MySQL模式需在 `sql/init.sql` 中添加：

```sql
ALTER TABLE interaction_options ADD COLUMN next_interaction_id BIGINT;
ALTER TABLE interaction_options ADD COLUMN feedback_text VARCHAR(500);
```

#### 第二步：后端 — PlayInfo 返回分支信息

**修改文件：** `backend/src/main/java/com/drama/service/EpisodeService.java`

找到 `buildInteractionInfo` 或 `PlayInfo.InteractionInfo` 的构建逻辑，修改 OptionInfo：

```java
// 在 PlayInfo 内部类 OptionInfo 中添加字段：
private Long nextInteractionId;    // 选择后跳转的下一个互动ID
private String feedbackText;       // 选择后的反馈文本

// 在 buildInteractionInfo 方法中，构建 OptionInfo 时赋值：
OptionInfo optInfo = new OptionInfo();
optInfo.setId(opt.getId());
optInfo.setOptionIndex(opt.getOptionIndex());
optInfo.setOptionText(opt.getOptionText());
optInfo.setIsCorrect(opt.getIsCorrect());
optInfo.setNextInteractionId(opt.getNextInteraction() != null ? opt.getNextInteraction().getId() : null);
optInfo.setFeedbackText(opt.getFeedbackText());
```

#### 第三步：后端 — DataInitializer 构建分支互动链

**修改文件：** `backend/src/main/java/com/drama/config/DataInitializer.java`

在每部剧的互动点创建中，构建选择→不同后续互动的链路。以"北派寻宝笔记"为例：

```java
// 找到 initBeiPaiXunBao 或类似方法（创建北派寻宝笔记互动点的地方）
// 在已有的 CHOICE 互动点之后，添加分支互动点

// 第1集 — 抉择点（已有或新增）
InteractionPoint choice1 = createInteraction(episode1, 15000, "CHOICE", 
    "你发现了古墓入口，怎么进去？", null, null);

// 创建选项A — 正门突破
InteractionOption optA = createOption(choice1, 1L, "正门突破！直接闯进去", false);
optA.setFeedbackText("💪 你选择了正面硬刚！石门轰然倒塌，但惊动了守墓人...");

// 创建选项B — 暗道潜入
InteractionOption optB = createOption(choice1, 2L, "寻找暗道，悄悄潜入", false);
optB.setFeedbackText("🤫 你选择了智取！发现了一条隐蔽的裂缝，成功潜入...");

// 创建选项C — 假装路过
InteractionOption optC = createOption(choice1, 3L, "先观察，假装路过后再来", false);
optC.setFeedbackText("👀 你选择了谨慎行事！在外围发现了重要线索...");

// 创建分支互动A — 只有选了A才会出现
InteractionPoint branchA = createInteraction(episode1, 35000, "QUIZ",
    "守墓人出现了！他的弱点是什么？", null, null);
branchA.setPrerequisite(choice1);
branchA.setPrerequisiteChoiceOptionId(optA.getId());
optA.setNextInteraction(branchA);

// 为branchA添加答题选项
InteractionOption branchA_opt1 = createOption(branchA, 1L, "他左眼的伤疤", true);
InteractionOption branchA_opt2 = createOption(branchA, 2L, "他手中的法器", false);
InteractionOption branchA_opt3 = createOption(branchA, 3L, "他的影子", false);

// 创建分支互动B — 只有选了B才会出现
InteractionPoint branchB = createInteraction(episode1, 35000, "QUIZ",
    "暗道中出现了三扇门，哪扇门是正确的？", null, null);
branchB.setPrerequisite(choice1);
branchB.setPrerequisiteChoiceOptionId(optB.getId());
optB.setNextInteraction(branchB);

InteractionOption branchB_opt1 = createOption(branchB, 1L, "左边刻着龙纹的门", false);
InteractionOption branchB_opt2 = createOption(branchB, 2L, "中间没有花纹的门", true);
InteractionOption branchB_opt3 = createOption(branchB, 3L, "右边刻着蛇纹的门", false);

// 创建分支互动C — 只有选了C才会出现
InteractionPoint branchC = createInteraction(episode1, 35000, "VOTE",
    "你发现有人在监视古墓，你打算？", null, null);
branchC.setPrerequisite(choice1);
branchC.setPrerequisiteChoiceOptionId(optC.getId());
optC.setNextInteraction(branchC);

InteractionOption branchC_opt1 = createOption(branchC, 1L, "跟踪监视者", false);
InteractionOption branchC_opt2 = createOption(branchC, 2L, "回去告诉队友", false);
InteractionOption branchC_opt3 = createOption(branchC, 3L, "设下陷阱等他来", false);
```

**注意：** `createOption` 方法的签名可能不同，请根据 DataInitializer 中已有的辅助方法调整。关键是确保选项对象上有 `nextInteraction` 和 `feedbackText` 字段。

需要为每部剧的 CHOICE 类型互动添加至少一个分支。模板相同，内容不同。

#### 第四步：前端 — 显示反馈文本 + 分支跳转

**修改文件：** `backend/src/main/resources/static/js/interaction.js`（或 `preview.html` 中互动相关代码）

```javascript
// 找到 showResult 或处理互动答案回调的方法
// 修改为：根据用户选择的选项显示反馈文本

showResult(result, selectedOptionId) {
    const options = document.querySelectorAll('.interaction-option');
    options.forEach(btn => btn.disabled = true);

    const type = this.currentPoint.type;
    let resultHtml = '';

    // 查找用户选择的选项，获取反馈文本和下一个互动ID
    const selectedOption = this.currentPoint.options?.find(o => o.id === selectedOptionId);
    const feedbackText = selectedOption?.feedbackText || '';
    const nextInteractionId = selectedOption?.nextInteractionId || null;

    if (type === 'QUIZ') {
        const correctOpt = this.currentPoint.options?.find(o => o.isCorrect);
        const isCorrect = correctOpt && selectedOptionId === correctOpt.id;
        resultHtml = isCorrect ? '✅ 回答正确！+10分' : '❌ 答错了！正确答案是：' + (correctOpt?.optionText || '');
        if (feedbackText) {
            resultHtml += `<div class="feedback-text" style="margin-top:8px;padding:8px;background:rgba(255,255,255,0.1);border-radius:6px;font-size:14px;">${feedbackText}</div>`;
        }
    } else if (type === 'CHOICE') {
        resultHtml = feedbackText || '你做出了选择！';
        if (nextInteractionId) {
            resultHtml += '<div class="branch-hint" style="margin-top:8px;font-size:12px;color:#aaa;">你的选择将影响后续剧情...</div>';
        }
    } else if (type === 'VOTE') {
        resultHtml = this.buildStatsHtml(result);
        if (feedbackText) {
            resultHtml += `<div class="feedback-text" style="margin-top:8px;padding:8px;background:rgba(255,255,255,0.1);border-radius:6px;font-size:14px;">${feedbackText}</div>`;
        }
    } else if (type === 'EGG') {
        resultHtml = '🥚 彩蛋已收集！+5分';
        if (feedbackText) {
            resultHtml += `<div class="feedback-text" style="margin-top:8px;padding:8px;background:rgba(255,255,255,0.1);border-radius:6px;font-size:14px;">${feedbackText}</div>`;
        }
    }

    resultHtml += '<button class="continue-btn" onclick="interaction.close()">继续观看</button>';
    document.getElementById('interaction-result').innerHTML = resultHtml;

    // 如果有分支互动，更新互动点列表
    if (nextInteractionId) {
        this.pendingBranchId = nextInteractionId;
    }
},
```

#### 第五步：前端 — 分支互动触发逻辑

**修改文件：** `backend/src/main/resources/static/js/player.js`

```javascript
// 找到 checkInteractionPoints 方法
// 修改逻辑：支持动态添加新的互动点

checkInteractionPoints() {
    if (!this.interactionPoints || this.interactionPoints.length === 0) return;
    const currentTimeMs = Math.floor(this.currentTime * 1000);
    
    for (const point of this.interactionPoints) {
        if (point.shown) continue;
        // 检查前置条件是否满足
        if (point.prerequisiteId) {
            const prereqMet = this.answeredInteractions?.some(
                a => a.interactionId === point.prerequisiteId && a.choiceIndex === point.prerequisiteChoiceIndex
            );
            if (!prereqMet) continue;
        }
        // 时间匹配（1秒容差）
        if (Math.abs(point.timestampMs - currentTimeMs) < 1000) {
            point.shown = true;
            this.showInteraction(point);
            break;
        }
    }
},
```

**验证：**
1. 启动后端
2. 进入北派寻宝笔记第1集
3. 到15秒时出现抉择互动
4. 选择不同选项，应看到不同的反馈文本
5. 继续播放，到35秒时应看到不同的后续互动（根据选择不同）

---

### P0-3. 修复 EpisodeController userId 鉴权漏洞

**问题：** playInfo() 的 userId 从 query param 获取，任何人可传任意 userId 获取他人观看进度。

**修改文件：** `backend/src/main/java/com/drama/controller/EpisodeController.java`

```java
// 找到 playInfo 方法，修改为：

@GetMapping("/{id}/playinfo")
public ApiResponse<PlayInfo> playInfo(@PathVariable Long id) {
    Long userId = AuthUtils.getCurrentUserId();  // 从 JWT 获取，可能为 null（未登录用户）
    return ApiResponse.success(episodeService.getPlayInfo(id, userId));
}
```

**验证：**
1. 启动后端
2. 不带 token 访问 `GET /api/episode/1/playinfo` — 应正常返回（无进度信息）
3. 登录后带 token 访问 — 应返回带 personally 进度信息
4. 尝试传 `?userId=999` — 应忽略该参数

---

### P0-4. 修复 OnlineController userId 伪造漏洞

**问题：** heartbeat() 的 userId 从请求体获取，可伪造任意用户在线状态。

**修改文件：** `backend/src/main/java/com/drama/controller/OnlineController.java`

```java
// 找到 heartbeat 方法，修改为：

@PostMapping("/heartbeat")
public Map<String, Object> heartbeat(@RequestBody Map<String, Object> body) {
    Long userId = AuthUtils.requireUserId();  // 从 JWT 获取，强制登录
    Long episodeId = Long.valueOf(body.get("episodeId").toString());
    onlineService.heartbeat(userId, episodeId);
    return Map.of("success", true);
}
```

**修改文件：** `backend/src/main/java/com/drama/config/SecurityConfig.java`

```java
// 找到 filterChain 方法中的 permitAll 配置
// 将 /api/online/** 改为只放行 GET 请求：

// 替换：
// .requestMatchers("/api/online/**").permitAll()
// 改为：
.requestMatchers(HttpMethod.GET, "/api/online/episode/**").permitAll()
// POST /api/online/heartbeat 走 anyRequest().authenticated()
```

**验证：**
1. 不带 token POST `/api/online/heartbeat` — 应返回 401/403
2. 登录后带 token POST — 应正常
3. 请求体中的 userId 应被忽略

---

### P0-5. 修复 JwtUtil 默认密钥 + 删除 AuthController.getUser() 信息泄露

**问题：** JWT 默认密钥可被伪造；`GET /api/auth/{userId}` 任何人可遍历用户信息。

**修改文件：** `backend/src/main/java/com/drama/config/JwtUtil.java`

```java
// 找到 secret 字段的 @Value 注解，修改为：

@Value("${jwt.secret}")  // 移除默认值，强制配置
private String secret;

// 找到或新增 @PostConstruct validateSecret 方法：
@PostConstruct
public void validateSecret() {
    Set<String> forbidden = Set.of(
        "defaultSecretKeyMustBeAtLeast32BytesLong!!",
        "a]9kL2mN5pQ8sT1vX3yA6bC0dE7fG4hI"
    );
    if (secret == null || secret.length() < 32) {
        throw new IllegalStateException("jwt.secret 必须配置且至少32字符");
    }
    if (forbidden.contains(secret)) {
        throw new IllegalStateException("jwt.secret 不能使用默认值，请在配置文件或环境变量中设置安全密钥");
    }
}
```

**修改文件：** `backend/src/main/resources/application-h2.yml`

```yaml
# 在文件中添加（开发环境专用密钥，不能用于生产）
jwt:
  secret: "h2DevOnlySecretKey_MustBeAtLeast32Bytes!!_DoNotUseInProd"
```

**修改文件：** `backend/src/main/java/com/drama/controller/AuthController.java`

```java
// 找到 getUser() 方法（GET /api/auth/{userId}），直接删除整个方法
// 如果还有其他公开暴露用户信息的接口，一并删除或改为需要认证
```

**修改文件：** `backend/src/main/java/com/drama/config/SecurityConfig.java`

```java
// 找到 .requestMatchers("/api/auth/**").permitAll()
// 改为精确路径：
.requestMatchers("/api/auth/register", "/api/auth/login", "/api/auth/me").permitAll()
// /api/auth/{userId} 不再 permitAll，走 anyRequest().authenticated()
```

**验证：**
1. 不配 jwt.secret 启动 — 应报错 `IllegalStateException`
2. 使用默认密钥启动 — 应报错
3. 使用安全密钥启动 — 正常
4. `GET /api/auth/1` 不带 token — 应返回 401/403
5. `POST /api/auth/login` — 不受影响，仍可公开访问

---

## P1 — 核心功能缺陷（直接影响用户体验）

---

### P1-1. 播放进度记忆（前端未调用后端API）

**问题：** 后端有 `/api/progress/report` 和 `lastPositionMs` 返回，但前端从未上报进度、也从未恢复播放位置。

**修改文件：** `backend/src/main/resources/static/js/player.js`

```javascript
// 1. 找到 setupEventListeners 方法或 video 元素事件绑定处
// 添加进度上报（每10秒上报一次）

// 在类中添加属性：
this.progressReportTimer = null;
this.PROGRESS_REPORT_INTERVAL = 10000; // 10秒

// 在 setupEventListeners 或 init 方法中添加：
setupProgressReport() {
    if (this.progressReportTimer) clearInterval(this.progressReportTimer);
    this.progressReportTimer = setInterval(() => {
        this.reportProgress();
    }, this.PROGRESS_REPORT_INTERVAL);
},

async reportProgress() {
    if (!this.currentEpisode || !state.isLoggedIn()) return;
    const positionMs = Math.floor(this.currentTime * 1000);
    const durationMs = Math.floor(this.videoElement.duration * 1000) || 0;
    if (positionMs <= 0) return;
    try {
        await api.reportProgress(this.currentEpisode.id || this.currentEpisode.episodeId, positionMs);
    } catch (e) {
        // 静默失败，不影响播放
    }
},

// 2. 在 loadEpisode 方法中添加记忆播放
async loadEpisode(episode) {
    this.currentEpisode = episode;
    this.interactionPoints = (episode.interactions || []).map(p => ({
        ...p,
        shown: false
    }));
    
    // 设置视频源
    this.videoElement.src = episode.videoUrl;
    document.getElementById('player-title').textContent = episode.title || '';
    
    // 记忆播放：恢复上次观看位置
    if (episode.lastPositionMs && episode.lastPositionMs > 0) {
        const resumePosition = episode.lastPositionMs / 1000;
        this.videoElement.addEventListener('loadedmetadata', () => {
            // 只有在视频时长大于恢复位置时才恢复
            if (this.videoElement.duration > resumePosition + 2) {
                this.videoElement.currentTime = resumePosition;
                // 显示"已恢复到上次观看位置"提示
                this.showResumeHint(resumePosition);
            }
        }, { once: true });
    }
    
    // 开始进度上报
    this.setupProgressReport();
},

showResumeHint(positionSec) {
    const hint = document.createElement('div');
    hint.className = 'resume-hint';
    hint.textContent = `已恢复到 ${Math.floor(positionSec / 60)}:${String(Math.floor(positionSec % 60)).padStart(2, '0')}`;
    hint.style.cssText = 'position:absolute;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.7);color:#fff;padding:6px 16px;border-radius:20px;font-size:13px;z-index:10;transition:opacity 0.5s;';
    const playerContainer = document.getElementById('player-container') || this.videoElement.parentElement;
    playerContainer.style.position = 'relative';
    playerContainer.appendChild(hint);
    setTimeout(() => { hint.style.opacity = '0'; }, 2500);
    setTimeout(() => { hint.remove(); }, 3000);
},

// 3. 在播放结束或切换剧集时上报最终进度
onVideoEnded() {
    this.reportProgress(); // 上报最终进度
    clearInterval(this.progressReportTimer);
    // ... 原有的自动连播逻辑
},
```

**修改文件：** `backend/src/main/resources/static/js/api.js`（确认 reportProgress 方法存在）

```javascript
// 确认 api.js 中有此方法，如果没有则添加：
async reportProgress(episodeId, positionMs) {
    return this.post('/api/progress/report', {
        episodeId: episodeId,
        positionMs: positionMs
    });
},
```

**修改文件：** `backend/src/main/resources/static/js/state.js`（确认 isLoggedIn 方法存在）

```javascript
// 确认 state 对象中有此方法，如果没有则添加：
isLoggedIn() {
    return !!this.token;
},
```

**验证：**
1. 登录后播放任意剧集，播放10秒以上
2. 关闭浏览器或刷新页面
3. 重新打开同一剧集，应显示"已恢复到 X:XX"提示并跳转到上次位置

---

### P1-2. 追剧/收藏功能

**问题：** 用户无法收藏短剧，无法快速回到之前看过的剧。

**目标：** 添加收藏功能 + "继续观看"入口。

#### 第一步：后端 — 收藏模型

**新建文件：** `backend/src/main/java/com/drama/model/Favorite.java`

```java
package com.drama.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "favorites", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"userId", "dramaId"})
})
public class Favorite {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long dramaId;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
```

**新建文件：** `backend/src/main/java/com/drama/repository/FavoriteRepository.java`

```java
package com.drama.repository;

import com.drama.model.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    Optional<Favorite> findByUserIdAndDramaId(Long userId, Long dramaId);
    List<Favorite> findByUserIdOrderByCreatedAtDesc(Long userId);
    boolean existsByUserIdAndDramaId(Long userId, Long dramaId);
    
    @Query("SELECT f.dramaId FROM Favorite f WHERE f.userId = :userId ORDER BY f.createdAt DESC")
    List<Long> findDramaIdsByUserId(Long userId);
    
    void deleteByUserIdAndDramaId(Long userId, Long dramaId);
}
```

#### 第二步：后端 — 收藏 Controller + Service

**新建文件：** `backend/src/main/java/com/drama/controller/FavoriteController.java`

```java
package com.drama.controller;

import com.drama.common.ApiResponse;
import com.drama.common.AuthUtils;
import com.drama.dto.DramaSummary;
import com.drama.model.Favorite;
import com.drama.repository.FavoriteRepository;
import com.drama.service.DramaService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/favorite")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteRepository favoriteRepository;
    private final DramaService dramaService;

    @PostMapping("/{dramaId}")
    public ApiResponse<Map<String, Object>> toggleFavorite(@PathVariable Long dramaId) {
        Long userId = AuthUtils.requireUserId();
        var existing = favoriteRepository.findByUserIdAndDramaId(userId, dramaId);
        boolean favorited;
        if (existing.isPresent()) {
            favoriteRepository.delete(existing.get());
            favorited = false;
        } else {
            Favorite fav = new Favorite();
            fav.setUserId(userId);
            fav.setDramaId(dramaId);
            favoriteRepository.save(fav);
            favorited = true;
        }
        return ApiResponse.success(Map.of("favorited", favorited, "dramaId", dramaId));
    }

    @GetMapping("/list")
    public ApiResponse<List<DramaSummary>> getFavorites() {
        Long userId = AuthUtils.requireUserId();
        List<Long> dramaIds = favoriteRepository.findDramaIdsByUserId(userId);
        List<DramaSummary> favorites = dramaIds.stream()
                .map(id -> dramaService.getDetail(id, userId))
                .filter(d -> d != null)
                .map(d -> {
                    DramaSummary s = new DramaSummary();
                    s.setId(d.getId());
                    s.setTitle(d.getTitle());
                    s.setCategory(d.getCategory());
                    s.setRating(d.getRating());
                    s.setViewCount(d.getViewCount());
                    s.setCoverUrl(d.getCoverUrl());
                    return s;
                })
                .toList();
        return ApiResponse.success(favorites);
    }

    @GetMapping("/check/{dramaId}")
    public ApiResponse<Map<String, Object>> checkFavorite(@PathVariable Long dramaId) {
        Long userId = AuthUtils.getCurrentUserId();
        boolean favorited = userId != null && favoriteRepository.existsByUserIdAndDramaId(userId, dramaId);
        return ApiResponse.success(Map.of("favorited", favorited));
    }
}
```

#### 第三步：前端 — 收藏按钮 + 继续观看入口

**修改文件：** `backend/src/main/resources/static/js/app.js`（或 `preview.html` 中的 app 对象）

```javascript
// 在短剧详情页渲染方法中，添加收藏按钮
// 找到 renderDramaDetail 或类似方法

async toggleFavorite(dramaId) {
    if (!state.isLoggedIn()) {
        app.showLoginPage();
        return;
    }
    try {
        const result = await api.post(`/api/favorite/${dramaId}`);
        const btn = document.getElementById('favorite-btn');
        if (result.favorited) {
            btn.classList.add('favorited');
            btn.innerHTML = '❤️ 已追剧';
        } else {
            btn.classList.remove('favorited');
            btn.innerHTML = '🤍 追剧';
        }
    } catch (e) {
        console.error('收藏失败:', e);
    }
},

// 在详情页HTML中添加收藏按钮（在标题旁边）
// <button id="favorite-btn" onclick="app.toggleFavorite(drama.id)">🤍 追剧</button>
```

```javascript
// 添加"继续观看"功能 — 在首页渲染方法中
async loadContinueWatching() {
    if (!state.isLoggedIn()) return [];
    try {
        // 调用进度接口获取未看完的剧集
        const progresses = await api.get('/api/progress/continue');
        return progresses || [];
    } catch (e) {
        return [];
    }
},
```

**修改文件：** `backend/src/main/resources/static/css/style.css`（或对应CSS文件）

```css
/* 收藏按钮样式 */
#favorite-btn {
    background: rgba(255,255,255,0.15);
    border: 1px solid rgba(255,255,255,0.3);
    color: #fff;
    padding: 8px 20px;
    border-radius: 20px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s;
}
#favorite-btn.favorited {
    background: rgba(255,64,129,0.2);
    border-color: #ff4081;
    color: #ff4081;
}
#favorite-btn:hover {
    background: rgba(255,255,255,0.25);
}

/* 继续观看区域 */
.continue-watching {
    padding: 16px 0;
}
.continue-watching h3 {
    color: #fff;
    font-size: 16px;
    margin-bottom: 12px;
    padding-left: 16px;
}
.continue-watching .drama-list {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    padding: 0 16px;
    scrollbar-width: none;
}
.continue-watching .drama-list::-webkit-scrollbar {
    display: none;
}
```

**验证：**
1. 登录后进入短剧详情页，点击"追剧"按钮
2. 按钮变为"❤️ 已追剧"
3. 再次点击取消追剧
4. 查看首页是否有"继续观看"区域

---

### P1-3. 首页推荐去重 + 相关推荐 fallback

**问题：** 推荐和热播显示完全一样的内容；相关推荐永远为空。

**修改文件：** `backend/src/main/java/com/drama/service/DramaService.java`

```java
// 找到 getRecommended 方法，修改推荐逻辑：

public Page<DramaSummary> getRecommended(int page, int size) {
    // 推荐列表：优先新品 + 评分高的，与热播（按播放量）区分开
    Page<Drama> dramas = dramaRepository.findByIsNewTrueOrderByCreatedAtDesc(
        PageRequest.of(page, Math.min(size, 50)));
    
    // 如果新品不足，fallback 到全部按创建时间倒序
    if (dramas.isEmpty()) {
        dramas = dramaRepository.findAllByOrderByCreatedAtDesc(
            PageRequest.of(page, Math.min(size, 50)));
    }
    
    return mapToSummaryPage(dramas);
},
```

**修改文件：** `backend/src/main/java/com/drama/repository/DramaRepository.java`

```java
// 添加两个查询方法：
Page<Drama> findByIsNewTrueOrderByCreatedAtDesc(Pageable pageable);
Page<Drama> findAllByOrderByCreatedAtDesc(Pageable pageable);
Page<Drama> findByIdNot(Long id, Pageable pageable);
```

**修改文件：** `backend/src/main/java/com/drama/service/DramaService.java`

```java
// 找到 getRelatedDramas 方法，添加 fallback：

private List<DramaSummary> getRelatedDramas(Drama drama) {
    // 先找同分类
    List<Drama> relatedDramas = dramaRepository.findByCategoryAndIdNot(
            drama.getCategory(), drama.getId(), PageRequest.of(0, 6));
    
    // 同分类没有，fallback 到其他分类
    if (relatedDramas.isEmpty()) {
        relatedDramas = dramaRepository.findByIdNot(drama.getId(), PageRequest.of(0, 6));
    }
    
    if (relatedDramas.isEmpty()) return List.of();
    
    // 批量查询 ratingCount（避免 N+1）
    List<Long> ids = relatedDramas.stream().map(Drama::getId).collect(Collectors.toList());
    List<Object[]> counts = ratingRepository.countByDramaIds(ids);
    Map<Long, Long> ratingCountMap = new HashMap<>();
    for (Object[] row : counts) {
        ratingCountMap.put((Long) row[0], (Long) row[1]);
    }
    
    return relatedDramas.stream()
            .map(d -> toSummary(d, ratingCountMap.getOrDefault(d.getId(), 0L)))
            .collect(Collectors.toList());
},
```

**验证：**
1. 启动后端，查看首页
2. 推荐列表应显示"新品"标记的短剧（与热播不同）
3. 进入短剧详情页，相关推荐区域应显示其他短剧

---

### P1-4. 搜索增强

**问题：** 只能搜剧名，没有分类筛选、没有热度排序。

**修改文件：** `backend/src/main/java/com/drama/repository/DramaRepository.java`

```java
// 找到搜索方法，增强为多字段搜索：

@Query("SELECT d FROM Drama d WHERE " +
    "LOWER(d.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
    "LOWER(d.category) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
    "LOWER(d.description) LIKE LOWER(CONCAT('%', :keyword, '%'))")
Page<Drama> search(@Param("keyword") String keyword, Pageable pageable);
```

**修改文件：** `backend/src/main/java/com/drama/controller/DramaController.java`

```java
// 找到 search 方法，修改排序逻辑：

@GetMapping("/search")
public ApiResponse<Page<DramaSummary>> search(
        @RequestParam String keyword,
        @RequestParam(defaultValue = "0") @Min(0) int page,
        @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size) {
    // 搜索结果按播放量排序，热门剧排前面
    Page<DramaSummary> result = dramaService.search(keyword, page, size);
    return ApiResponse.success(result);
},
```

**修改文件：** `backend/src/main/java/com/drama/service/DramaService.java`

```java
// 添加 search 方法（如果不存在）：

public Page<DramaSummary> search(String keyword, int page, int size) {
    Page<Drama> dramas = dramaRepository.search(
        keyword, PageRequest.of(page, Math.min(size, 50), Sort.by(Sort.Direction.DESC, "viewCount")));
    return mapToSummaryPage(dramas);
},
```

**前端搜索增强：**

**修改文件：** `backend/src/main/resources/static/js/app.js`

```javascript
// 添加搜索建议和搜索历史
// 找到搜索相关方法，增强：

doSearch(keyword) {
    if (!keyword || keyword.trim().length === 0) return;
    
    // 保存搜索历史
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    if (!history.includes(keyword)) {
        history.unshift(keyword);
        if (history.length > 10) history.pop();
        localStorage.setItem('searchHistory', JSON.stringify(history));
    }
    
    // 执行搜索
    this.searchKeyword = keyword;
    this.loadSearchResults(keyword);
},

showSearchHistory() {
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    if (history.length === 0) return;
    
    const container = document.getElementById('search-history');
    if (!container) return;
    container.innerHTML = history.map(h => 
        `<div class="search-history-item" onclick="app.doSearch('${h.replace(/'/g, "\\'")}')">${h}</div>`
    ).join('');
    container.style.display = 'block';
},
```

**验证：**
1. 搜索"寻宝" — 应能搜到北派寻宝笔记
2. 搜索"悬疑" — 应能搜到分类为悬疑的短剧
3. 搜索历史应出现在搜索页面

---

### P1-5. 评论系统改为短剧级别（保留互动点评论）

**问题：** 评论只能挂在互动点上，用户想在短剧详情页看评论和发评论。

**修改文件：** `backend/src/main/java/com/drama/model/Comment.java`

```java
// 添加 dramaId 字段（如果不存在）：

@Column
private Long dramaId;  // 短剧级别评论，null 表示互动点评论
```

**修改文件：** `backend/src/main/java/com/drama/repository/CommentRepository.java`

```java
// 添加短剧级别评论查询方法：

Page<Comment> findByDramaIdOrderByCreatedAtDesc(Long dramaId, Pageable pageable);
Page<Comment> findByDramaIdOrderByLikeCountDesc(Long dramaId, Pageable pageable);
long countByDramaId(Long dramaId);
```

**修改文件：** `backend/src/main/java/com/drama/controller/CommentController.java`

```java
// 添加短剧级别评论接口：

@GetMapping("/drama/{dramaId}")
public ApiResponse<?> getDramaComments(
        @PathVariable Long dramaId,
        @RequestParam(defaultValue = "hot") String sort,
        @RequestParam(defaultValue = "0") @Min(0) int page,
        @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
    return ApiResponse.success(commentService.getDramaComments(dramaId, sort, page, size));
},

@GetMapping("/drama/{dramaId}/count")
public ApiResponse<Map<String, Object>> getDramaCommentCount(@PathVariable Long dramaId) {
    long count = commentService.getDramaCommentCount(dramaId);
    return ApiResponse.success(Map.of("count", count));
},
```

**修改文件：** `backend/src/main/java/com/drama/service/CommentService.java`

```java
// 添加短剧级别评论方法：

public CommentResponse.PageResult getDramaComments(Long dramaId, String sort, int page, int size) {
    Pageable pageable = PageRequest.of(page, size,
        "hot".equals(sort) ? Sort.by(Sort.Direction.DESC, "likeCount") 
                           : Sort.by(Sort.Direction.DESC, "createdAt"));
    
    Page<Comment> commentPage = commentRepository.findByDramaIdOrderByLikeCountDesc(dramaId, pageable);
    // ... 使用与 getComments 相同的逻辑构建响应
    // 但无需过滤 interactionId，按 dramaId 查询
},

public long getDramaCommentCount(Long dramaId) {
    return commentRepository.countByDramaId(dramaId);
},
```

**前端 — 短剧详情页评论区：**

**修改文件：** `backend/src/main/resources/static/js/app.js`

```javascript
// 在 renderDramaDetail 方法中，添加评论区区域

async loadDramaComments(dramaId, page = 0) {
    try {
        const result = await api.get(`/api/comment/drama/${dramaId}?sort=hot&page=${page}&size=20`);
        this.renderComments(result);
    } catch (e) {
        console.error('加载评论失败:', e);
    }
},

async postDramaComment(dramaId, content) {
    if (!state.isLoggedIn()) {
        this.showLoginPage();
        return;
    }
    try {
        await api.post('/api/comment', {
            dramaId: dramaId,
            content: content
        });
        this.loadDramaComments(dramaId);
    } catch (e) {
        alert('评论失败，请重试');
    }
},
```

**验证：**
1. 进入短剧详情页，应看到评论区
2. 发表评论，应出现在评论列表中
3. 原有的互动点评论不受影响

---

## P2 — 社交与参与感

---

### P2-1. 彩蛋图鉴页面

**问题：** 彩蛋收集了没地方看，收集动力为零。

**新建文件：** `backend/src/main/java/com/drama/controller/EggController.java`

```java
package com.drama.controller;

import com.drama.common.ApiResponse;
import com.drama.common.AuthUtils;
import com.drama.model.InteractionPoint;
import com.drama.model.UserEgg;
import com.drama.repository.InteractionPointRepository;
import com.drama.repository.UserEggRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/eggs")
@RequiredArgsConstructor
public class EggController {

    private final UserEggRepository userEggRepository;
    private final InteractionPointRepository interactionPointRepository;

    @GetMapping("/collection")
    public ApiResponse<EggCollectionResponse> getCollection() {
        Long userId = AuthUtils.requireUserId();
        
        // 获取所有彩蛋互动点
        List<InteractionPoint> allEggs = interactionPointRepository.findByInteractionType("EGG");
        
        // 获取用户已收集的彩蛋
        List<UserEgg> userEggs = userEggRepository.findByUserId(userId);
        Set<Long> collectedIds = userEggs.stream()
                .map(UserEgg::getInteractionId)
                .collect(Collectors.toSet());
        
        // 按剧集分组
        Map<Long, List<EggInfo>> byDrama = new LinkedHashMap<>();
        for (InteractionPoint egg : allEggs) {
            Long dramaId = egg.getEpisode().getDrama().getId();
            String dramaTitle = egg.getEpisode().getDrama().getTitle();
            
            EggInfo info = new EggInfo();
            info.setId(egg.getId());
            info.setQuestionText(egg.getQuestionText());
            info.setCollected(collectedIds.contains(egg.getId()));
            info.setDramaId(dramaId);
            info.setDramaTitle(dramaTitle);
            
            if (info.isCollected()) {
                UserEgg userEgg = userEggs.stream()
                    .filter(ue -> ue.getInteractionId().equals(egg.getId()))
                    .findFirst().orElse(null);
                if (userEgg != null) {
                    info.setEggContent(userEgg.getEggContent());
                    info.setCollectedAt(userEgg.getCollectedAt());
                }
            }
            
            byDrama.computeIfAbsent(dramaId, k -> new ArrayList<>()).add(info);
        }
        
        EggCollectionResponse response = new EggCollectionResponse();
        response.setTotalEggs(allEggs.size());
        response.setCollectedEggs(collectedIds.size());
        response.setByDrama(byDrama);
        return ApiResponse.success(response);
    }

    @Data
    public static class EggInfo {
        private Long id;
        private String questionText;
        private boolean collected;
        private String eggContent;
        private String collectedAt;
        private Long dramaId;
        private String dramaTitle;
    }

    @Data
    public static class EggCollectionResponse {
        private int totalEggs;
        private int collectedEggs;
        private Map<Long, List<EggInfo>> byDrama;
    }
}
```

**修改文件：** `backend/src/main/java/com/drama/repository/InteractionPointRepository.java`

```java
// 添加：
List<InteractionPoint> findByInteractionType(String interactionType);
```

**修改文件：** `backend/src/main/java/com/drama/repository/UserEggRepository.java`

```java
// 确认存在：
List<UserEgg> findByUserId(Long userId);
```

**前端彩蛋图鉴页面：**

**修改文件：** `backend/src/main/resources/static/js/app.js`

```javascript
// 添加彩蛋图鉴渲染方法
async showEggCollection() {
    if (!state.isLoggedIn()) {
        this.showLoginPage();
        return;
    }
    try {
        const result = await api.get('/api/eggs/collection');
        this.renderEggCollection(result);
    } catch (e) {
        console.error('加载彩蛋图鉴失败:', e);
    }
},

renderEggCollection(data) {
    const container = document.getElementById('main-content');
    let html = `
        <div class="egg-collection-page">
            <div class="egg-header">
                <button onclick="app.showHome()" class="back-btn">← 返回</button>
                <h2>🥚 彩蛋图鉴</h2>
                <div class="egg-progress">已收集 ${data.collectedEggs}/${data.totalEggs}</div>
            </div>
            <div class="egg-progress-bar">
                <div class="egg-progress-fill" style="width:${(data.collectedEggs/data.totalEggs*100).toFixed(0)}%"></div>
            </div>`;
    
    for (const [dramaId, eggs] of Object.entries(data.byDrama || {})) {
        const dramaTitle = eggs[0]?.dramaTitle || '未知短剧';
        html += `<div class="egg-drama-section">
            <h3>${dramaTitle}</h3>
            <div class="egg-grid">`;
        
        for (const egg of eggs) {
            if (egg.collected) {
                html += `<div class="egg-card collected">
                    <div class="egg-icon">🥚</div>
                    <div class="egg-name">${egg.questionText || '神秘彩蛋'}</div>
                    <div class="egg-content">${egg.eggContent || ''}</div>
                </div>`;
            } else {
                html += `<div class="egg-card locked">
                    <div class="egg-icon">❓</div>
                    <div class="egg-name">未发现</div>
                </div>`;
            }
        }
        
        html += `</div></div>`;
    }
    
    html += `</div>`;
    container.innerHTML = html;
},
```

**CSS样式：**

```css
.egg-collection-page { padding: 16px; }
.egg-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.egg-header h2 { color: #fff; margin: 0; }
.egg-progress { color: #ffd700; font-size: 14px; }
.egg-progress-bar { height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; margin-bottom: 24px; }
.egg-progress-fill { height: 100%; background: linear-gradient(90deg, #ffd700, #ff9800); border-radius: 3px; transition: width 0.5s; }
.egg-drama-section { margin-bottom: 24px; }
.egg-drama-section h3 { color: #ccc; font-size: 14px; margin-bottom: 12px; }
.egg-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 12px; }
.egg-card { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; text-align: center; transition: all 0.3s; }
.egg-card.collected { border: 1px solid #ffd700; background: rgba(255,215,0,0.08); }
.egg-card.locked { opacity: 0.5; }
.egg-icon { font-size: 32px; margin-bottom: 8px; }
.egg-name { color: #fff; font-size: 12px; }
.egg-content { color: #aaa; font-size: 11px; margin-top: 4px; }
```

**验证：**
1. 登录后找到彩蛋图鉴入口
2. 应看到按剧集分组的彩蛋列表
3. 已收集的金色高亮，未收集的灰色问号
4. 进度条显示收集进度

---

### P2-2. 积分消费闭环

**问题：** 积分攒了没处花，互动动力减半。

**修改文件：** `backend/src/main/java/com/drama/model/InteractionPoint.java`

```java
// 添加字段：

@Column(length = 200)
private String hint;  // 答题提示（花积分查看）

@Column
private Integer hintCost = 50;  // 查看提示花费的积分数
```

**新建文件：** `backend/src/main/java/com/drama/controller/PointsController.java`

```java
package com.drama.controller;

import com.drama.common.ApiResponse;
import com.drama.common.AuthUtils;
import com.drama.common.BusinessException;
import com.drama.model.InteractionPoint;
import com.drama.model.User;
import com.drama.repository.InteractionPointRepository;
import com.drama.repository.UserRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/points")
@RequiredArgsConstructor
public class PointsController {

    private final UserRepository userRepository;
    private final InteractionPointRepository interactionPointRepository;

    @GetMapping("/balance")
    public ApiResponse<Map<String, Object>> getBalance() {
        Long userId = AuthUtils.requireUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(404, "用户不存在"));
        return ApiResponse.success(Map.of("points", user.getPoints()));
    }

    @PostMapping("/hint")
    public ApiResponse<Map<String, Object>> buyHint(@RequestBody BuyHintRequest request) {
        Long userId = AuthUtils.requireUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(404, "用户不存在"));
        
        InteractionPoint point = interactionPointRepository.findById(request.getInteractionId())
                .orElseThrow(() -> new BusinessException(404, "互动不存在"));
        
        int cost = point.getHintCost() != null ? point.getHintCost() : 50;
        if (user.getPoints() < cost) {
            throw new BusinessException(400, "积分不足，需要" + cost + "积分");
        }
        
        // 扣减积分（原子操作）
        userRepository.addPoints(userId, -cost);
        
        return ApiResponse.success(Map.of(
            "hint", point.getHint() != null ? point.getHint() : "暂无提示",
            "remainingPoints", user.getPoints() - cost
        ));
    }

    @Data
    public static class BuyHintRequest {
        private Long interactionId;
    }
}
```

**修改文件：** `backend/src/main/java/com/drama/config/DataInitializer.java`

```java
// 在创建 QUIZ 类型互动时，添加提示文本和费用：
// 找到 QUIZ 互动点的创建代码，添加：

quizPoint.setHint("提示：仔细看画面中的细节，答案就在那里！");
quizPoint.setHintCost(50);
```

**前端 — 答题提示按钮：**

**修改文件：** `backend/src/main/resources/static/js/interaction.js`

```javascript
// 在 QUIZ 互动的弹窗HTML中，添加提示按钮：

// 找到 createInteractionHTML 方法中 QUIZ 类型的部分
// 在选项列表后添加：
if (this.currentPoint.type === 'QUIZ') {
    html += `<button class="hint-btn" onclick="interaction.buyHint()">
        💡 使用提示 (50积分)
    </button>`;
}

// 添加 buyHint 方法：
async buyHint() {
    if (!state.isLoggedIn()) {
        app.showLoginPage();
        return;
    }
    try {
        const result = await api.post('/api/points/hint', {
            interactionId: this.currentPoint.id
        });
        // 显示提示
        const hintDiv = document.getElementById('interaction-hint');
        if (hintDiv) {
            hintDiv.textContent = '💡 ' + result.hint;
            hintDiv.style.display = 'block';
        } else {
            const container = document.getElementById('interaction-content');
            const hint = document.createElement('div');
            hint.id = 'interaction-hint';
            hint.style.cssText = 'margin-top:8px;padding:8px;background:rgba(255,215,0,0.15);border:1px solid #ffd700;border-radius:6px;color:#ffd700;font-size:13px;';
            hint.textContent = '💡 ' + result.hint;
            container.appendChild(hint);
        }
        // 隐藏提示按钮
        const hintBtn = document.querySelector('.hint-btn');
        if (hintBtn) hintBtn.style.display = 'none';
    } catch (e) {
        alert(e.message || '积分不足或获取提示失败');
    }
},
```

**验证：**
1. 答题互动出现时，应看到"💡 使用提示 (50积分)"按钮
2. 点击后扣除积分并显示提示文本
3. 积分不足时提示"积分不足"

---

### P2-3. 弹幕功能（最小可行版）

**问题：** 短剧没弹幕，氛围感为零。

**新建文件：** `backend/src/main/java/com/drama/model/Danmaku.java`

```java
package com.drama.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "danmaku")
public class Danmaku {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long episodeId;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, length = 200)
    private String content;

    @Column(nullable = false)
    private Long positionMs;  // 发送时视频的播放位置（毫秒）

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
```

**新建文件：** `backend/src/main/java/com/drama/repository/DanmakuRepository.java`

```java
package com.drama.repository;

import com.drama.model.Danmaku;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DanmakuRepository extends JpaRepository<Danmaku, Long> {
    List<Danmaku> findByEpisodeIdAndPositionMsBetweenOrderByPositionMsAsc(
        Long episodeId, Long startMs, Long endMs);
    List<Danmaku> findTop200ByEpisodeIdOrderByPositionMsAsc(Long episodeId);
}
```

**新建文件：** `backend/src/main/java/com/drama/controller/DanmakuController.java`

```java
package com.drama.controller;

import com.drama.common.ApiResponse;
import com.drama.common.AuthUtils;
import com.drama.common.BusinessException;
import com.drama.model.Danmaku;
import com.drama.repository.DanmakuRepository;
import com.drama.repository.UserRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/danmaku")
@RequiredArgsConstructor
public class DanmakuController {

    private final DanmakuRepository danmakuRepository;
    private final UserRepository userRepository;

    @GetMapping("/episode/{episodeId}")
    public ApiResponse<List<Danmaku>> getDanmaku(@PathVariable Long episodeId) {
        List<Danmaku> list = danmakuRepository.findTop200ByEpisodeIdOrderByPositionMsAsc(episodeId);
        return ApiResponse.success(list);
    }

    @PostMapping("/send")
    public ApiResponse<Danmaku> sendDanmaku(@RequestBody DanmakuRequest request) {
        Long userId = AuthUtils.requireUserId();
        
        // 内容校验
        if (request.getContent() == null || request.getContent().trim().isEmpty()) {
            throw new BusinessException(400, "弹幕内容不能为空");
        }
        if (request.getContent().length() > 100) {
            throw new BusinessException(400, "弹幕内容不能超过100字");
        }
        
        Danmaku danmaku = new Danmaku();
        danmaku.setEpisodeId(request.getEpisodeId());
        danmaku.setUserId(userId);
        danmaku.setContent(request.getContent().trim());
        danmaku.setPositionMs(request.getPositionMs());
        
        danmakuRepository.save(danmaku);
        return ApiResponse.success(danmaku);
    }

    @Data
    public static class DanmakuRequest {
        private Long episodeId;
        private String content;
        private Long positionMs;
    }
}
```

**前端弹幕渲染：**

**修改文件：** `backend/src/main/resources/static/js/player.js`

```javascript
// 添加弹幕系统
class DanmakuSystem {
    constructor(videoElement) {
        this.videoElement = videoElement;
        this.container = null;
        this.danmakuList = [];
        this.activeDanmaku = [];
        this.isDanmakuOn = true;
        this.init();
    }

    init() {
        // 创建弹幕容器
        this.container = document.createElement('div');
        this.container.className = 'danmaku-container';
        this.container.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:70%;pointer-events:none;overflow:hidden;z-index:5;';
        this.videoElement.parentElement.style.position = 'relative';
        this.videoElement.parentElement.appendChild(this.container);
    }

    async loadDanmaku(episodeId) {
        try {
            const result = await api.get(`/api/danmaku/episode/${episodeId}`);
            this.danmakuList = result || [];
        } catch (e) {
            this.danmakuList = [];
        }
    }

    checkDanmaku(currentTimeMs) {
        if (!this.isDanmakuOn) return;
        for (const d of this.danmakuList) {
            if (!d.shown && Math.abs(d.positionMs - currentTimeMs) < 500) {
                d.shown = true;
                this.showDanmaku(d.content);
            }
        }
    }

    showDanmaku(text) {
        const el = document.createElement('div');
        el.className = 'danmaku-item';
        el.textContent = text;
        el.style.cssText = `
            position:absolute;
            right:-${text.length * 14}px;
            top:${Math.random() * 80 + 5}%;
            color:#fff;
            font-size:14px;
            white-space:nowrap;
            text-shadow:1px 1px 2px rgba(0,0,0,0.8);
            animation:danmaku-scroll ${6 + Math.random() * 3}s linear forwards;
            pointer-events:none;
        `;
        this.container.appendChild(el);
        setTimeout(() => el.remove(), 10000);
    }

    async sendDanmaku(episodeId, content, positionMs) {
        try {
            const result = await api.post('/api/danmaku/send', {
                episodeId, content, positionMs
            });
            // 自己发的弹幕立即显示
            this.showDanmaku(content);
            this.danmakuList.push({
                positionMs, content, shown: true
            });
        } catch (e) {
            console.error('发送弹幕失败:', e);
        }
    }

    toggle() {
        this.isDanmakuOn = !this.isDanmakuOn;
        this.container.style.display = this.isDanmakuOn ? 'block' : 'none';
        return this.isDanmakuOn;
    }
}
```

**CSS动画：**

```css
@keyframes danmaku-scroll {
    from { transform: translateX(0); }
    to { transform: translateX(calc(-100vw - 100%)); }
}
```

**弹幕输入UI（在播放器控制栏添加）：**

```html
<!-- 在播放器控制栏添加弹幕输入框 -->
<div class="danmaku-input-bar" style="display:flex;gap:8px;padding:8px;background:rgba(0,0,0,0.6);">
    <input type="text" id="danmaku-input" placeholder="发一条弹幕..." 
           maxlength="100" style="flex:1;padding:6px 12px;border-radius:16px;border:none;background:rgba(255,255,255,0.15);color:#fff;font-size:13px;">
    <button onclick="player.sendCurrentDanmaku()" style="padding:6px 16px;border-radius:16px;border:none;background:#ff6b6b;color:#fff;font-size:13px;">发送</button>
    <button onclick="player.toggleDanmaku()" id="danmaku-toggle" style="padding:6px 10px;border-radius:16px;border:none;background:rgba(255,255,255,0.15);color:#fff;font-size:13px;">弹幕🔊</button>
</div>
```

**在 player.js 中初始化弹幕：**

```javascript
// 在 loadEpisode 方法中添加：
this.danmaku = new DanmakuSystem(this.videoElement);
this.danmaku.loadDanmaku(episode.id || episode.episodeId);

// 在 timeupdate 事件中添加弹幕检查：
this.danmaku?.checkDanmaku(Math.floor(this.currentTime * 1000));

// 添加发送弹幕方法：
sendCurrentDanmaku() {
    const input = document.getElementById('danmaku-input');
    const content = input?.value?.trim();
    if (!content) return;
    const positionMs = Math.floor(this.currentTime * 1000);
    this.danmaku.sendDanmaku(this.currentEpisode.id, content, positionMs);
    input.value = '';
},

toggleDanmaku() {
    const isOn = this.danmaku.toggle();
    const btn = document.getElementById('danmaku-toggle');
    btn.textContent = isOn ? '弹幕🔊' : '弹幕🔇';
},
```

**修改文件：** `backend/src/main/java/com/drama/config/SecurityConfig.java`

```java
// 添加弹幕接口权限：
// GET /api/danmaku/episode/** 公开
// POST /api/danmaku/send 需要认证
.requestMatchers(HttpMethod.GET, "/api/danmaku/episode/**").permitAll()
```

**验证：**
1. 播放任意剧集，应看到弹幕飘过（如果已有弹幕数据）
2. 在弹幕输入框输入文字，点击发送
3. 弹幕应立即显示并保存到后端
4. 刷新页面重新播放，之前发的弹幕应在对应时间点出现
5. 点击弹幕开关可关闭/开启弹幕

---

## P3 — 体验打磨

---

### P3-1. 倍速记忆

**修改文件：** `backend/src/main/resources/static/js/player.js`

```javascript
// 在 setPlaybackRate 或倍速切换方法中：

changeSpeed(speed) {
    this.videoElement.playbackRate = speed;
    localStorage.setItem('playbackSpeed', speed.toString());
    // 更新UI显示当前倍速
    const speedDisplay = document.getElementById('current-speed');
    if (speedDisplay) speedDisplay.textContent = speed + 'x';
},

// 在 loadEpisode 方法中，恢复倍速：
const savedSpeed = parseFloat(localStorage.getItem('playbackSpeed') || '1');
this.videoElement.playbackRate = savedSpeed;
```

---

### P3-2. 分享功能

**修改文件：** `backend/src/main/resources/static/js/app.js`

```javascript
// 添加分享方法：

shareDrama(drama) {
    const shareData = {
        title: drama.title,
        text: `我在看《${drama.title}》，超好看！`,
        url: window.location.origin + '/#drama/' + drama.id
    };
    
    if (navigator.share) {
        navigator.share(shareData).catch(() => {});
    } else {
        // Fallback: 复制链接
        navigator.clipboard.writeText(shareData.url).then(() => {
            alert('链接已复制到剪贴板！');
        }).catch(() => {
            // 最终 fallback
            prompt('复制以下链接分享给朋友：', shareData.url);
        });
    }
},
```

---

### P3-3. H2 中文编码修复

**修改文件：** `backend/src/main/resources/application-h2.yml`

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:drama_player;DB_CLOSE_DELAY=-1;MODE=MYSQL
    hikari:
      connection-init-sql: SET NAMES UTF-8
```

---

### P3-4. 并发安全修复（批量处理）

以下所有"读-改-写"改为原子SQL操作：

**修改文件：** `backend/src/main/java/com/drama/repository/DramaRepository.java`

```java
@Modifying
@Transactional
@Query("UPDATE Drama d SET d.viewCount = d.viewCount + :increment WHERE d.id = :id")
void incrementViewCountBy(@Param("id") Long id, @Param("increment") Long increment);

@Modifying
@Transactional
@Query("UPDATE Drama d SET d.rating = :rating WHERE d.id = :id")
void updateRating(@Param("id") Long id, @Param("rating") Double rating);
```

**修改文件：** `backend/src/main/java/com/drama/repository/CommentRepository.java`

```java
@Modifying
@Transactional
@Query("UPDATE Comment c SET c.likeCount = c.likeCount + 1 WHERE c.id = :id")
void incrementLikeCount(@Param("id") Long id);

@Modifying
@Transactional
@Query("UPDATE Comment c SET c.likeCount = GREATEST(c.likeCount - 1, 0) WHERE c.id = :id")
void decrementLikeCount(@Param("id") Long id);
```

**修改文件：** `backend/src/main/java/com/drama/repository/UserRepository.java`

```java
@Modifying
@Transactional
@Query("UPDATE User u SET u.points = u.points + :points WHERE u.id = :id")
void addPoints(@Param("id") Long id, @Param("points") int points);
```

**修改文件：** `backend/src/main/java/com/drama/service/DramaService.java`

```java
// syncViewCountToDatabase 改为：
private void syncViewCountToDatabase(Long dramaId, Long increment) {
    dramaRepository.incrementViewCountBy(dramaId, increment);
}
```

**修改文件：** `backend/src/main/java/com/drama/service/CommentService.java`

```java
// toggleLike 改为：
if (existing.isPresent()) {
    commentLikeRepository.delete(existing.get());
    commentRepository.decrementLikeCount(commentId);
    return false;
} else {
    CommentLike like = new CommentLike();
    like.setUserId(userId);
    like.setCommentId(commentId);
    commentLikeRepository.save(like);
    commentRepository.incrementLikeCount(commentId);
    return true;
}
```

---

### P3-5. InteractionPoint LAZY 加载修复

**修改文件：** `backend/src/main/java/com/drama/repository/InteractionPointRepository.java`

```java
// 添加 JOIN FETCH 查询：
@Query("SELECT ip FROM InteractionPoint ip LEFT JOIN FETCH ip.options WHERE ip.episode.id = :episodeId ORDER BY ip.timestampMs ASC")
List<InteractionPoint> findWithOptionsByEpisodeId(@Param("episodeId") Long episodeId);
```

**修改文件：** `backend/src/main/java/com/drama/service/EpisodeService.java`

```java
// 找到查询互动点的代码，改为：
List<InteractionPoint> points = interactionPointRepository.findWithOptionsByEpisodeId(episodeId);
```

---

### P3-6. JwtFilter 异常日志

**修改文件：** `backend/src/main/java/com/drama/config/JwtFilter.java`

```java
// 找到 catch (Exception ignored) {} 改为：

@Override
protected void doFilterInternal(HttpServletRequest request,
                                 HttpServletResponse response,
                                 FilterChain filterChain)
        throws ServletException, IOException {
    String header = request.getHeader("Authorization");
    if (header != null && header.startsWith("Bearer ")) {
        String token = header.substring(7);
        try {
            Long userId = jwtUtil.validateToken(token);
            UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(userId, null, List.of());
            SecurityContextHolder.getContext().setAuthentication(auth);
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            log.debug("JWT token expired: {}", e.getMessage());
        } catch (io.jsonwebtoken.SecurityException e) {
            log.warn("JWT security violation: {}", e.getMessage());
        } catch (Exception e) {
            log.warn("JWT validation failed: {}", e.getMessage());
        }
    }
    filterChain.doFilter(request, response);
}
```

类上添加 `@Slf4j` 注解（如果使用 Lombok）或 `private static final Logger log = LoggerFactory.getLogger(JwtFilter.class);`。

---

### P3-7. CORS 配置

**修改文件：** `backend/src/main/java/com/drama/config/SecurityConfig.java`

```java
// 在 filterChain 方法开头添加：

http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
    .csrf(csrf -> csrf.disable())
    // ... 其余配置不变

// 添加 Bean：
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(List.of("http://localhost:3000", "http://localhost:8080"));
    configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    configuration.setAllowedHeaders(List.of("*"));
    configuration.setAllowCredentials(true);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", configuration);
    return source;
}
```

---

### P3-8. API 分页上限

**修改文件：** 所有 Controller 中有 page/size 参数的方法

统一添加 `@Max(100)` 限制 size 参数。示例：

```java
@GetMapping("/recommend")
public ApiResponse<Page<DramaSummary>> recommend(
        @RequestParam(defaultValue = "0") @Min(0) int page,
        @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size) {
    return ApiResponse.success(dramaService.getRecommended(page, size));
}
```

对所有 `/recommend`, `/hot`, `/new`, `/search`, comment, rating 等接口的 size 参数统一添加 `@Max(100)`。

---

### P3-9. Redis viewCount 过期策略修复

**修改文件：** `backend/src/main/java/com/drama/service/DramaService.java`

```java
// 找到 incrementViewCountWithRedis 方法，修改为：

private void incrementViewCountWithRedis(Long dramaId) {
    String key = "drama:view:" + dramaId;
    Long count = redisTemplate.opsForValue().increment(key);
    // 不再设置1小时过期
    // 每10次同步一次到数据库，降低数据丢失风险
    if (count != null && count % 10 == 0) {
        syncViewCountToDatabase(dramaId, 10L);
        redisTemplate.opsForValue().set(key, "0");  // 重置计数
    }
},
```

---

### P3-10. OnlineService Redis 改 Sorted Set

**修改文件：** `backend/src/main/java/com/drama/service/OnlineService.java`

```java
// 找到 heartbeat 方法中使用 Set 的逻辑，改为 Sorted Set：

private static final long HEARTBEAT_TTL_MS = 30_000;

public void heartbeat(Long userId, Long episodeId) {
    if (redisTemplate != null) {
        String key = KEY_PREFIX + episodeId;
        double score = System.currentTimeMillis();
        redisTemplate.opsForZSet().add(key, String.valueOf(userId), score);
        // 清理过期用户
        redisTemplate.opsForZSet().removeRangeByScore(key, 0, System.currentTimeMillis() - HEARTBEAT_TTL_MS);
    } else {
        localOnline.computeIfAbsent(episodeId, k -> new ConcurrentHashMap<>()).put(userId, System.currentTimeMillis());
    }
}

public long getOnlineCount(Long episodeId) {
    if (redisTemplate != null) {
        String key = KEY_PREFIX + episodeId;
        redisTemplate.opsForZSet().removeRangeByScore(key, 0, System.currentTimeMillis() - HEARTBEAT_TTL_MS);
        Long count = redisTemplate.opsForZSet().zCard(key);
        return count != null ? count : 0;
    }
    // local 逻辑不变
    ConcurrentHashMap<Long, Long> users = localOnline.get(episodeId);
    if (users == null) return 0;
    long now = System.currentTimeMillis();
    users.entrySet().removeIf(e -> now - e.getValue() > HEARTBEAT_TTL_MS);
    return users.size();
}

public Set<String> getOnlineUsers(Long episodeId) {
    if (redisTemplate != null) {
        String key = KEY_PREFIX + episodeId;
        redisTemplate.opsForZSet().removeRangeByScore(key, 0, System.currentTimeMillis() - HEARTBEAT_TTL_MS);
        return redisTemplate.opsForZSet().range(key, 0, -1);
    }
    // local 逻辑不变
    ConcurrentHashMap<Long, Long> users = localOnline.get(episodeId);
    if (users == null) return Set.of();
    long now = System.currentTimeMillis();
    users.entrySet().removeIf(e -> now - e.getValue() > HEARTBEAT_TTL_MS);
    return users.keySet().stream().map(String::valueOf).collect(Collectors.toSet());
}
```

---

### P3-11. 删除 android/ 空壳 + README 诚实化

**操作：** 删除 `android/` 目录

```bash
rm -rf android/
```

**修改文件：** `README.md`

```markdown
## 修改点：

1. 技术栈表删除 Android 行，或改为：
| 移动端 | 规划中（PWA / Kotlin + Jetpack Compose + ExoPlayer） |

2. 删除路线图中的 "Android 原生应用"，改为：
- [ ] PWA 移动端适配

3. 添加项目状态章节：
## 项目状态

| 模块 | 完成度 | 说明 |
|------|--------|------|
| 后端 API | 85% | 核心接口完成，部分需安全加固 |
| 前端 | 70% | 核心页面完成，弹幕/图鉴开发中 |
| 互动系统 | 60% | 基础互动完成，分支剧情开发中 |
| 移动端 | 0% | 规划中 |

4. 数据库设计补全缺失的表：
- `favorites` — 用户收藏
- `danmaku` — 弹幕
```

---

### P3-12. RatingController 使用 DTO 替代 Map

**新建文件：** `backend/src/main/java/com/drama/dto/RatingRequest.java`

```java
package com.drama.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RatingRequest {
    @NotNull(message = "短剧ID不能为空")
    private Long dramaId;
    @NotNull(message = "评分不能为空")
    @Min(value = 1, message = "评分最低1分")
    @Max(value = 10, message = "评分最高10分")
    private Integer score;
}
```

**修改文件：** `backend/src/main/java/com/drama/controller/RatingController.java`

```java
// 找到 submit 方法，将 @RequestBody Map<String, Object> body 替换为：

@PostMapping("/submit")
public ApiResponse<Map<String, Object>> submit(@Valid @RequestBody RatingRequest request) {
    Long userId = AuthUtils.requireUserId();
    // 用 request.getDramaId() / request.getScore() 替换原来的手动类型转换
    // ... 后续逻辑不变
}
```

---

## 执行计划总览

| 批次 | 任务 | 预估时间 | 说明 |
|------|------|---------|------|
| **第1批** | P0-1~5 | 2-3天 | 安全+开箱体验+核心互动，做完项目才算"能用" |
| **第2批** | P1-1~5 | 3-4天 | 播放器基本功+内容消费体验，做完才像"产品" |
| **第3批** | P2-1~3 | 3-4天 | 社交+参与感，做完才有"留存" |
| **第4批** | P3-1~12 | 2-3天 | 打磨+清理+安全加固，做完才算"合格" |

**建议：** 每批做完后做一次完整功能验证，确认无回归再继续下一批。

---

## 验证清单

每批完成后，执行以下验证：

### 启动验证
```bash
cd backend
./mvnw clean package -DskipTests
java -jar target/short-drama-player-1.0.0.jar --spring.profiles.active=h2
```

### 功能验证

- [ ] 首页加载正常，推荐和热播不重复
- [ ] 搜索可用，支持分类关键词
- [ ] 短剧详情页显示封面、选集、相关推荐、评论区
- [ ] 点击剧集可播放视频（测试视频）
- [ ] 互动点正常触发，不同选择有不同反馈
- [ ] 播放进度记忆：关闭页面重新打开能恢复位置
- [ ] 收藏/追剧功能可用
- [ ] 弹幕发送和显示正常
- [ ] 彩蛋图鉴页面可访问
- [ ] 答题提示（积分消费）可用
- [ ] 登录/注册正常，JWT 鉴权生效
- [ ] 未登录无法访问需认证的接口

### 安全验证

- [ ] `GET /api/auth/1` 无 token 返回 401
- [ ] `POST /api/online/heartbeat` 无 token 返回 401
- [ ] `GET /api/episode/1/playinfo?userId=999` 忽略 query param 的 userId
- [ ] 默认 JWT 密钥无法启动
- [ ] 分页 size=999999 被限制为 100
