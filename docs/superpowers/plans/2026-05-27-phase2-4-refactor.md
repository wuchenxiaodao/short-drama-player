# 短剧互动播放器重构计划 - 第二阶段到第四阶段

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成后端代码深度重构、前端代码完善和性能优化、UI/UX 改进

**Architecture:** 在第一阶段基础上，继续优化代码结构、性能和用户体验

**Tech Stack:** Java 17, Spring Boot 3.2, JavaScript, HTML5, CSS3

---

## 第二阶段：后端代码深度重构

### Task 1: Service 层优化 - DramaService

**Files:**
- Modify: `backend/src/main/java/com/drama/service/DramaService.java`

- [ ] **Step 1: 优化 getDetail 方法**

```java
public DramaDetail getDetail(Long dramaId, Long userId) {
    Drama drama = dramaRepository.findById(dramaId)
            .orElseThrow(() -> new RuntimeException("Drama not found: " + dramaId));

    incrementViewCount(dramaId);

    List<Episode> episodes = episodeRepository.findByDramaIdOrderByEpisodeNumberAsc(dramaId);
    Map<Long, Long> progressMap = getWatchProgress(userId, episodes);

    DramaDetail detail = buildDramaDetail(drama, episodes, progressMap);
    detail.setRelatedDramas(getRelatedDramas(drama));

    return detail;
}

private Map<Long, Long> getWatchProgress(Long userId, List<Episode> episodes) {
    Map<Long, Long> progressMap = new HashMap<>();
    if (userId == null) return progressMap;

    for (Episode ep : episodes) {
        watchProgressRepository.findByUserIdAndEpisodeId(userId, ep.getId())
                .ifPresent(p -> progressMap.put(ep.getId(), p.getPositionMs()));
    }
    return progressMap;
}

private DramaDetail buildDramaDetail(Drama drama, List<Episode> episodes, Map<Long, Long> progressMap) {
    DramaDetail detail = new DramaDetail();
    detail.setId(drama.getId());
    detail.setTitle(drama.getTitle());
    detail.setDescription(drama.getDescription());
    detail.setCoverUrl(drama.getCoverUrl());
    detail.setCategory(drama.getCategory());
    detail.setTotalEpisodes(drama.getTotalEpisodes());
    detail.setRating(drama.getRating());
    detail.setRatingCount(ratingRepository.getRatingCount(drama.getId()));
    detail.setViewCount(drama.getViewCount());
    detail.setEpisodes(buildEpisodeInfoList(episodes, progressMap));
    return detail;
}

private List<DramaDetail.EpisodeInfo> buildEpisodeInfoList(List<Episode> episodes, Map<Long, Long> progressMap) {
    return episodes.stream().map(ep -> {
        DramaDetail.EpisodeInfo info = new DramaDetail.EpisodeInfo();
        info.setId(ep.getId());
        info.setEpisodeNumber(ep.getEpisodeNumber());
        info.setTitle(ep.getTitle());
        info.setDurationSeconds(ep.getDurationSeconds());
        info.setWatchPositionMs(progressMap.get(ep.getId()));
        info.setIsHot(ep.getEpisodeNumber() <= 3);
        return info;
    }).collect(Collectors.toList());
}

private List<DramaSummary> getRelatedDramas(Drama drama) {
    return dramaRepository.findByCategoryAndIdNot(
            drama.getCategory(), drama.getId(), PageRequest.of(0, 6))
            .stream().map(this::toSummary).collect(Collectors.toList());
}
```

- [ ] **Step 2: 优化 incrementViewCount 方法**

```java
private void incrementViewCount(Long dramaId) {
    if (redisTemplate != null) {
        incrementViewCountWithRedis(dramaId);
    } else {
        incrementViewCountWithDatabase(dramaId);
    }
}

private void incrementViewCountWithRedis(Long dramaId) {
    String key = "drama:view:" + dramaId;
    Long count = redisTemplate.opsForValue().increment(key);
    if (count != null && count == 1) {
        redisTemplate.expire(key, 1, TimeUnit.HOURS);
    }
    if (count != null && count % 100 == 0) {
        syncViewCountToDatabase(dramaId, 100L);
    }
}

private void incrementViewCountWithDatabase(Long dramaId) {
    dramaRepository.findById(dramaId).ifPresent(d -> {
        d.setViewCount(d.getViewCount() + 1);
        dramaRepository.save(d);
    });
}

private void syncViewCountToDatabase(Long dramaId, Long increment) {
    dramaRepository.findById(dramaId).ifPresent(d -> {
        d.setViewCount(d.getViewCount() + increment);
        dramaRepository.save(d);
    });
}
```

- [ ] **Step 3: 验证编译**

Run: `cd backend && ./mvnw clean compile -DskipTests`
Expected: BUILD SUCCESS

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/drama/service/DramaService.java
git commit -m "refactor: 优化 DramaService 方法结构"
```

---

### Task 2: Service 层优化 - EpisodeService

**Files:**
- Modify: `backend/src/main/java/com/drama/service/EpisodeService.java`

- [ ] **Step 1: 优化 getPlayInfo 方法**

```java
public PlayInfo getPlayInfo(Long episodeId, Long userId) {
    Episode episode = episodeRepository.findById(episodeId)
            .orElseThrow(() -> new RuntimeException("Episode not found: " + episodeId));

    PlayInfo playInfo = buildPlayInfo(episode);
    playInfo.setLastPositionMs(getLastPosition(userId, episodeId));
    playInfo.setInteractions(buildInteractionInfoList(episodeId));

    return playInfo;
}

private PlayInfo buildPlayInfo(Episode episode) {
    PlayInfo playInfo = new PlayInfo();
    playInfo.setEpisodeId(episode.getId());
    playInfo.setVideoUrl(episode.getVideoUrl());
    playInfo.setDurationSeconds(episode.getDurationSeconds());
    return playInfo;
}

private Long getLastPosition(Long userId, Long episodeId) {
    if (userId == null) return null;
    return watchProgressRepository.findByUserIdAndEpisodeId(userId, episodeId)
            .map(WatchProgress::getPositionMs)
            .orElse(null);
}

private List<PlayInfo.InteractionInfo> buildInteractionInfoList(Long episodeId) {
    List<InteractionPoint> points = interactionPointRepository.findByEpisodeIdOrderByTimestampMsAsc(episodeId);
    return points.stream()
            .map(this::buildInteractionInfo)
            .collect(Collectors.toList());
}

private PlayInfo.InteractionInfo buildInteractionInfo(InteractionPoint point) {
    PlayInfo.InteractionInfo info = new PlayInfo.InteractionInfo();
    info.setId(point.getId());
    info.setTimestampMs(point.getTimestampMs());
    info.setType(point.getInteractionType().name());
    info.setQuestionText(point.getQuestionText());
    info.setOptions(parseOptions(point.getOptionsJson()));
    return info;
}

private List<PlayInfo.InteractionInfo.OptionInfo> parseOptions(String optionsJson) {
    try {
        List<Map<String, Object>> options = objectMapper.readValue(
                optionsJson, new TypeReference<>() {});
        return options.stream().map(o -> {
            PlayInfo.InteractionInfo.OptionInfo opt = new PlayInfo.InteractionInfo.OptionInfo();
            opt.setId(((Number) o.get("id")).longValue());
            opt.setText((String) o.get("text"));
            return opt;
        }).collect(Collectors.toList());
    } catch (Exception e) {
        return List.of();
    }
}
```

- [ ] **Step 2: 验证编译**

Run: `cd backend && ./mvnw clean compile -DskipTests`
Expected: BUILD SUCCESS

- [ ] **Step 3: Commit**

```bash
git add backend/src/main/java/com/drama/service/EpisodeService.java
git commit -m "refactor: 优化 EpisodeService 方法结构"
```

---

### Task 3: Service 层优化 - InteractionService

**Files:**
- Modify: `backend/src/main/java/com/drama/service/InteractionService.java`

- [ ] **Step 1: 优化 submitAnswer 方法**

```java
@Transactional
public boolean submitAnswer(AnswerRequest request) {
    if (isAlreadyAnswered(request.getUserId(), request.getInteractionId())) {
        return false;
    }

    InteractionPoint point = getInteractionPoint(request.getInteractionId());
    User user = getUser(request.getUserId());

    saveAnswer(request, point);
    updateRedisStats(request);
    processRewards(point, request, user);

    return true;
}

private boolean isAlreadyAnswered(Long userId, Long interactionId) {
    return answerRepository.findByUserIdAndInteractionPointId(userId, interactionId).isPresent();
}

private InteractionPoint getInteractionPoint(Long interactionId) {
    return interactionPointRepository.findById(interactionId)
            .orElseThrow(() -> new RuntimeException("Interaction not found"));
}

private User getUser(Long userId) {
    return userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
}

private void saveAnswer(AnswerRequest request, InteractionPoint point) {
    InteractionAnswer answer = new InteractionAnswer();
    answer.setUserId(request.getUserId());
    answer.setInteractionPoint(point);
    answer.setSelectedOptionId(request.getChoiceId());
    answerRepository.save(answer);
}

private void updateRedisStats(AnswerRequest request) {
    if (redisTemplate == null) return;

    String redisKey = "interaction:count:" + request.getInteractionId();
    redisTemplate.opsForHash().increment(redisKey, String.valueOf(request.getChoiceId()), 1);
    redisTemplate.expire(redisKey, 24, TimeUnit.HOURS);

    String totalKey = "interaction:total:" + request.getInteractionId();
    redisTemplate.opsForValue().increment(totalKey);
    redisTemplate.expire(totalKey, 24, TimeUnit.HOURS);
}

private void processRewards(InteractionPoint point, AnswerRequest request, User user) {
    if (isCorrectAnswer(point, request.getChoiceId())) {
        addPoints(user, 10);
    }

    if (point.getInteractionType() == InteractionPoint.InteractionType.EGG) {
        collectEgg(request.getUserId(), request.getInteractionId(), point.getQuestionText());
        addPoints(user, 5);
    }
}

private boolean isCorrectAnswer(InteractionPoint point, Long choiceId) {
    return point.getCorrectOptionId() != null && point.getCorrectOptionId().equals(choiceId);
}

private void addPoints(User user, int points) {
    user.setPoints(user.getPoints() + points);
    userRepository.save(user);
}

private void collectEgg(Long userId, Long interactionId, String eggContent) {
    UserEgg egg = new UserEgg();
    egg.setUserId(userId);
    egg.setInteractionId(interactionId);
    egg.setEggContent(eggContent);
    userEggRepository.save(egg);
}
```

- [ ] **Step 2: 优化 getStats 方法**

```java
public InteractionStats getStats(Long interactionId) {
    if (redisTemplate != null) {
        InteractionStats stats = getStatsFromRedis(interactionId);
        if (stats != null) return stats;
    }
    return getStatsFromDatabase(interactionId);
}

private InteractionStats getStatsFromRedis(Long interactionId) {
    String countKey = "interaction:count:" + interactionId;
    String totalKey = "interaction:total:" + interactionId;

    Map<Object, Object> counts = redisTemplate.opsForHash().entries(countKey);
    String totalStr = redisTemplate.opsForValue().get(totalKey);
    long total = totalStr != null ? Long.parseLong(totalStr) : 0;

    if (total <= 0) return null;

    InteractionStats stats = new InteractionStats();
    stats.setInteractionId(interactionId);
    stats.setTotalParticipants(total);
    stats.setOptionStats(buildOptionStatsFromRedis(counts, total));
    return stats;
}

private Map<Long, InteractionStats.OptionStats> buildOptionStatsFromRedis(Map<Object, Object> counts, long total) {
    Map<Long, InteractionStats.OptionStats> optionStats = new HashMap<>();
    for (Map.Entry<Object, Object> e : counts.entrySet()) {
        long count = Long.parseLong(e.getValue().toString());
        InteractionStats.OptionStats os = new InteractionStats.OptionStats();
        os.setCount(count);
        os.setPercentage(Math.round(count * 100.0 / total * 10.0) / 10.0);
        optionStats.put(Long.parseLong(e.getKey().toString()), os);
    }
    return optionStats;
}

private InteractionStats getStatsFromDatabase(Long interactionId) {
    List<Object[]> dbCounts = answerRepository.countByOption(interactionId);
    long total = answerRepository.countByInteractionPointId(interactionId);

    InteractionStats stats = new InteractionStats();
    stats.setInteractionId(interactionId);
    stats.setTotalParticipants(total);
    stats.setOptionStats(buildOptionStatsFromDatabase(dbCounts, total));
    return stats;
}

private Map<Long, InteractionStats.OptionStats> buildOptionStatsFromDatabase(List<Object[]> dbCounts, long total) {
    Map<Long, Long> dbMap = new HashMap<>();
    for (Object[] row : dbCounts) {
        dbMap.put((Long) row[0], (Long) row[1]);
    }

    Map<Long, InteractionStats.OptionStats> optionStats = new HashMap<>();
    for (Map.Entry<Long, Long> e : dbMap.entrySet()) {
        InteractionStats.OptionStats os = new InteractionStats.OptionStats();
        os.setCount(e.getValue());
        os.setPercentage(total > 0 ? Math.round(e.getValue() * 100.0 / total * 10.0) / 10.0 : 0);
        optionStats.put(e.getKey(), os);
    }
    return optionStats;
}
```

- [ ] **Step 3: 验证编译**

Run: `cd backend && ./mvnw clean compile -DskipTests`
Expected: BUILD SUCCESS

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/drama/service/InteractionService.java
git commit -m "refactor: 优化 InteractionService 方法结构"
```

---

### Task 4: 添加 Swagger API 文档

**Files:**
- Modify: `backend/pom.xml`
- Create: `backend/src/main/java/com/drama/config/SwaggerConfig.java`

- [ ] **Step 1: 添加 Swagger 依赖**

```xml
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.3.0</version>
</dependency>
```

- [ ] **Step 2: 创建 Swagger 配置**

```java
package com.drama.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("短剧互动播放器 API")
                        .version("1.0.0")
                        .description("短剧互动播放器后端 API 文档")
                        .contact(new Contact()
                                .name("Developer")
                                .email("developer@example.com")));
    }
}
```

- [ ] **Step 3: 验证编译**

Run: `cd backend && ./mvnw clean compile -DskipTests`
Expected: BUILD SUCCESS

- [ ] **Step 4: Commit**

```bash
git add backend/pom.xml backend/src/main/java/com/drama/config/SwaggerConfig.java
git commit -m "feat: 添加 Swagger API 文档支持"
```

---

## 第三阶段：前端代码完善和性能优化

### Task 5: 前端性能优化

**Files:**
- Modify: `frontend/js/app.js`
- Modify: `frontend/js/utils.js`

- [ ] **Step 1: 添加图片懒加载**

```javascript
// 在 utils.js 中添加
const lazyLoad = {
    observer: null,

    init() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    this.observer.unobserve(img);
                }
            });
        });
    },

    observe(selector) {
        document.querySelectorAll(selector).forEach(img => {
            this.observer.observe(img);
        });
    }
};
```

- [ ] **Step 2: 优化 API 请求缓存**

```javascript
// 在 api.js 中添加缓存
const apiCache = {
    cache: new Map(),
    ttl: 5 * 60 * 1000, // 5分钟

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }
        return item.data;
    },

    set(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    },

    clear() {
        this.cache.clear();
    }
};

// 修改 api 方法添加缓存
const api = {
    async getRecommendDramas(page = 0, size = 10) {
        const cacheKey = `recommend_${page}_${size}`;
        const cached = apiCache.get(cacheKey);
        if (cached) return cached;

        const response = await fetch(`${API_BASE_URL}/drama/recommend?page=${page}&size=${size}`);
        const data = await response.json();
        apiCache.set(cacheKey, data);
        return data;
    },

    // ... 其他方法类似
};
```

- [ ] **Step 3: 添加防抖和节流优化**

```javascript
// 在 app.js 中优化搜索
const app = {
    // ... 其他方法

    init() {
        player.init();
        this.loadHomePage();
        this.setupNavigation();
        this.setupSearch();
    },

    setupSearch() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', utils.debounce((e) => {
                this.performSearch(e.target.value);
            }, 300));
        }
    },

    async performSearch(keyword) {
        if (!keyword.trim()) return;
        const results = await api.searchDramas(keyword);
        this.renderSearchResults(results);
    }
};
```

- [ ] **Step 4: Commit**

```bash
git add frontend/js/
git commit -m "perf: 添加前端性能优化（懒加载、缓存、防抖）"
```

---

### Task 6: 前端错误处理

**Files:**
- Modify: `frontend/js/api.js`
- Modify: `frontend/js/app.js`

- [ ] **Step 1: 添加统一错误处理**

```javascript
// 在 api.js 中添加
const apiErrorHandler = {
    handle(error, context) {
        console.error(`API Error in ${context}:`, error);

        if (error.status === 401) {
            this.handleUnauthorized();
        } else if (error.status === 404) {
            this.handleNotFound(context);
        } else if (error.status >= 500) {
            this.handleServerError();
        } else {
            this.handleGenericError(error.message);
        }
    },

    handleUnauthorized() {
        // 清除用户状态
        localStorage.removeItem('userId');
        state.userId = null;
        this.showMessage('请重新登录', 'warning');
    },

    handleNotFound(context) {
        this.showMessage('请求的资源不存在', 'info');
    },

    handleServerError() {
        this.showMessage('服务器错误，请稍后重试', 'error');
    },

    handleGenericError(message) {
        this.showMessage(message || '操作失败', 'error');
    },

    showMessage(message, type = 'info') {
        // 创建消息提示
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
};

// 修改 api 方法添加错误处理
const api = {
    async request(url, options = {}) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw { status: response.status, message: response.statusText };
            }
            return await response.json();
        } catch (error) {
            apiErrorHandler.handle(error, url);
            throw error;
        }
    },

    async getRecommendDramas(page = 0, size = 10) {
        return this.request(`${API_BASE_URL}/drama/recommend?page=${page}&size=${size}`);
    },

    // ... 其他方法类似
};
```

- [ ] **Step 2: 添加加载状态管理**

```javascript
// 在 app.js 中添加
const loadingManager = {
    show() {
        const loader = document.getElementById('global-loader');
        if (loader) loader.classList.remove('hidden');
    },

    hide() {
        const loader = document.getElementById('global-loader');
        if (loader) loader.classList.add('hidden');
    }
};

// 修改数据加载方法
const app = {
    async loadHomePage() {
        loadingManager.show();
        try {
            await Promise.all([
                this.loadRecommendDramas(),
                this.loadHotDramas()
            ]);
        } finally {
            loadingManager.hide();
        }
    }
};
```

- [ ] **Step 3: Commit**

```bash
git add frontend/js/
git commit -m "feat: 添加前端错误处理和加载状态管理"
```

---

## 第四阶段：UI/UX 改进

### Task 7: 改进交互动画

**Files:**
- Modify: `frontend/css/interaction.css`
- Modify: `frontend/js/interaction.js`

- [ ] **Step 1: 添加投票动画**

```css
/* 在 interaction.css 中添加 */
@keyframes voteAnimation {
    0% { transform: scale(0); opacity: 0; }
    50% { transform: scale(1.2); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
}

@keyframes emojiRain {
    0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}

.vote-animation {
    animation: voteAnimation 0.5s ease-out;
}

.emoji-rain {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1000;
}

.emoji {
    position: absolute;
    font-size: 30px;
    animation: emojiRain 2s linear forwards;
}
```

- [ ] **Step 2: 添加投票动画效果**

```javascript
// 在 interaction.js 中添加
const interaction = {
    // ... 其他方法

    showVoteAnimation(isCorrect) {
        const overlay = document.getElementById('interaction-overlay');
        overlay.classList.add('vote-animation');

        if (isCorrect) {
            this.createEmojiRain(['🎉', '🎊', '✨', '💪']);
        }

        setTimeout(() => {
            overlay.classList.remove('vote-animation');
        }, 500);
    },

    createEmojiRain(emojis) {
        const container = document.createElement('div');
        container.className = 'emoji-rain';
        document.body.appendChild(container);

        for (let i = 0; i < 20; i++) {
            const emoji = document.createElement('span');
            emoji.className = 'emoji';
            emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            emoji.style.left = `${Math.random() * 100}%`;
            emoji.style.animationDelay = `${Math.random() * 1}s`;
            container.appendChild(emoji);
        }

        setTimeout(() => {
            container.remove();
        }, 2000);
    },

    showResult(result, selectedOption) {
        // ... 现有代码

        // 添加动画效果
        this.showVoteAnimation(result.correct);
    }
};
```

- [ ] **Step 3: Commit**

```bash
git add frontend/css/interaction.css frontend/js/interaction.js
git commit -m "feat: 添加投票动画和表情雨效果"
```

---

### Task 8: 改进响应式设计

**Files:**
- Modify: `frontend/css/styles.css`

- [ ] **Step 1: 添加响应式断点**

```css
/* 在 styles.css 中添加 */
@media (max-width: 320px) {
    .drama-grid {
        grid-template-columns: 1fr;
    }

    .episode-grid {
        grid-template-columns: repeat(3, 1fr);
    }

    .top-bar h1 {
        font-size: 18px;
    }
}

@media (min-width: 321px) and (max-width: 430px) {
    .drama-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .episode-grid {
        grid-template-columns: repeat(4, 1fr);
    }
}

@media (min-width: 431px) {
    .drama-grid {
        grid-template-columns: repeat(3, 1fr);
    }

    .episode-grid {
        grid-template-columns: repeat(5, 1fr);
    }
}

/* 横屏模式 */
@media (orientation: landscape) {
    .player-container {
        aspect-ratio: 16/9;
        max-height: 100vh;
    }

    .player-controls {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(transparent, rgba(0,0,0,0.8));
    }
}
```

- [ ] **Step 2: 添加触摸优化**

```css
/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
    .drama-card {
        cursor: default;
    }

    .drama-card:active {
        transform: scale(0.98);
    }

    .episode-btn {
        min-height: 44px;
        min-width: 44px;
    }

    .interaction-option {
        min-height: 48px;
    }
}

/* 高分辨率屏幕优化 */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
    .drama-card-cover {
        image-rendering: -webkit-optimize-contrast;
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/css/styles.css
git commit -m "feat: 改进响应式设计和触摸优化"
```

---

### Task 9: 添加主题切换功能

**Files:**
- Modify: `frontend/index.html`
- Create: `frontend/js/theme.js`
- Modify: `frontend/css/styles.css`

- [ ] **Step 1: 创建主题切换脚本**

```javascript
// frontend/js/theme.js
const theme = {
    current: localStorage.getItem('theme') || 'dark',

    init() {
        this.apply(this.current);
        this.setupToggle();
    },

    apply(themeName) {
        document.documentElement.setAttribute('data-theme', themeName);
        localStorage.setItem('theme', themeName);
        this.current = themeName;
    },

    toggle() {
        const newTheme = this.current === 'dark' ? 'light' : 'dark';
        this.apply(newTheme);
    },

    setupToggle() {
        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
        }
    }
};
```

- [ ] **Step 2: 添加亮色主题样式**

```css
/* 在 styles.css 中添加 */
[data-theme="light"] {
    --deep-black: #FFFFFF;
    --dark-gray: #F3F4F6;
    --medium-gray: #E5E7EB;
    --light-gray: #6B7280;
    --card-bg: #FFFFFF;
    --text-primary: #111827;
    --text-secondary: #4B5563;
}

[data-theme="light"] body {
    background: var(--deep-black);
    color: var(--text-primary);
}

[data-theme="light"] .drama-card {
    background: var(--card-bg);
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

[data-theme="light"] .top-bar {
    background: var(--dark-gray);
}

[data-theme="light"] .detail-header {
    background: var(--dark-gray);
}
```

- [ ] **Step 3: 添加主题切换按钮**

```html
<!-- 在 index.html 的 top-bar 中添加 -->
<div class="top-bar">
    <h1>短剧播放器</h1>
    <div class="top-actions">
        <button id="theme-toggle" class="theme-toggle">🌙</button>
        <div class="search-icon" onclick="app.showSearch()">🔍</div>
    </div>
</div>
```

- [ ] **Step 4: Commit**

```bash
git add frontend/index.html frontend/js/theme.js frontend/css/styles.css
git commit -m "feat: 添加亮色/暗色主题切换功能"
```

---

## 最终验证

### Task 10: 运行完整测试套件

**Files:**
- None

- [ ] **Step 1: 运行后端测试**

Run: `cd backend && ./mvnw test`
Expected: All tests PASS

- [ ] **Step 2: 验证前端文件**

```bash
# 检查前端文件完整性
ls -la frontend/
ls -la frontend/css/
ls -la frontend/js/
```

- [ ] **Step 3: 提交所有更改**

```bash
git add -A
git commit -m "feat: 完成全栈重构 - 后端优化、前端性能改进、UI/UX 增强"
```

- [ ] **Step 4: 推送到 GitHub**

```bash
git push origin master
```

---

## 完成检查清单

- [ ] Service 层方法职责单一，代码清晰
- [ ] 统一响应格式已应用到所有 Controller
- [ ] 前端性能优化（懒加载、缓存、防抖）
- [ ] 前端错误处理完善
- [ ] 交互动画效果增强
- [ ] 响应式设计优化
- [ ] 主题切换功能可用
- [ ] 所有测试通过
- [ ] 代码已推送到 GitHub

---

**计划完成！** 准备开始执行。
