# 短剧TV平台完整开发实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 基于现有75%完成度的代码库，修复所有致命/严重问题，补全缺失功能，完成从开发到可交付的完整闭环。

**Architecture:** Next.js 14 (App Router) + Spring Boot 3.2.5 前后端分离架构，前端通过动态API Base URL检测连接后端，后端通过Spring Security + JWT实现认证，H2(开发)/MySQL(生产)双数据源，Redis缓存互动统计。

**Tech Stack:** Next.js 14 / React 18 / TypeScript / Tailwind CSS / Zustand / Recharts | Spring Boot 3.2.5 / JPA / Spring Security / JWT / Redis | Docker / K8s / Nginx

**当前状态:** 项目已完成约75%，存在6个P0致命问题、10个P1严重问题，详见 `TEST_REPORT.md`

---

## 阶段一：系统架构确认与技术选型固化（已完成，需文档化）

> 项目架构已搭建完成，此阶段主要是确认现有选型并补充缺失的架构文档。

### Task 1.1: 确认系统架构图

**Files:**
- Create: `docs/architecture.md`

- [ ] **Step 1: 编写系统架构文档**

创建 `docs/architecture.md`，内容包含：
- 整体架构图（ASCII或Mermaid格式）：前端(Next.js) → Nginx反向代理 → 后端(Spring Boot) → MySQL/H2 + Redis
- 前端架构：App Router页面路由、Zustand状态管理、API Client层
- 后端架构：Controller → Service → Repository → Model分层
- 数据流：用户请求 → JWT认证 → 业务处理 → 数据持久化
- 视频流：浏览器 → Nginx(/videos/) → 后端静态资源映射 → 本地文件系统
- 互动系统：VideoPlayer时间监听 → InteractionOverlay → API提交 → Redis统计

- [ ] **Step 2: 确认技术栈选型清单**

在架构文档中明确记录已选型的技术栈：

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 前端框架 | Next.js (App Router) | 14.x | SSR/CSR混合渲染 |
| UI库 | Tailwind CSS + Lucide Icons | 3.x | 样式+图标 |
| 状态管理 | Zustand (persist) | 4.x | 认证状态持久化 |
| 图表 | Recharts | 2.x | 互动统计仪表盘 |
| 后端框架 | Spring Boot | 3.2.5 | REST API服务 |
| ORM | Spring Data JPA + Hibernate | - | 数据持久化 |
| 认证 | Spring Security + JWT | - | 无状态认证 |
| 缓存 | Redis (可选) | - | 互动统计+在线人数 |
| 开发数据库 | H2 In-Memory | - | 零配置开发 |
| 生产数据库 | MySQL | 8.x | 生产数据存储 |
| 容器化 | Docker + Docker Compose | - | 本地/云部署 |
| 编排 | Kubernetes (可选) | - | 生产级编排 |
| 反向代理 | Nginx | - | HTTPS/路由/负载均衡 |
| 视频存储 | 本地文件系统 | - | MP4视频文件 |

- [ ] **Step 3: 确认API接口规范**

在架构文档中记录现有API规范：
- 统一响应格式：`{ code: number, message: string, data: T }`
- 认证方式：Bearer Token (JWT) 在 Authorization Header
- 分页格式：Spring Data Page 对象（content数组 + pageable + totalElements）
- 错误码：200成功、400参数错误、401未认证、403无权限、404不存在、500服务器错误

- [ ] **Step 4: Commit**

```bash
git add docs/architecture.md
git commit -m "docs: add system architecture document"
```

---

## 阶段二：核心功能修复与完善（P0+P1问题修复）

> 这是最高优先级阶段，修复6个致命问题和10个严重问题，恢复核心功能可用性。

### Task 2.1: 重建VideoController.java（P0-02）

**Files:**
- Create: `backend/src/main/java/com/drama/controller/VideoController.java`
- Modify: `backend/src/main/java/com/drama/config/SecurityConfig.java`

- [ ] **Step 1: 创建VideoController.java**

```java
package com.drama.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.HandlerMapping;

import jakarta.servlet.http.HttpServletRequest;
import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
public class VideoController {

    @Value("${video.base-path:#{null}}")
    private String configuredBasePath;

    private String getBasePath() {
        if (configuredBasePath != null && !configuredBasePath.isEmpty()) {
            return configuredBasePath;
        }
        String userDir = System.getProperty("user.dir");
        String[] candidates = {
            userDir + File.separator + "videos",
            userDir + File.separator + ".." + File.separator + "videos",
        };
        for (String path : candidates) {
            File dir = new File(path);
            if (dir.isDirectory()) {
                return path;
            }
        }
        return userDir + File.separator + "videos";
    }

    @GetMapping("/videos/**")
    public ResponseEntity<Resource> getVideo(HttpServletRequest request) throws IOException {
        String fullPath = (String) request.getAttribute(HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE);
        String relativePath = fullPath.substring("/videos/".length());

        Path videoPath = Paths.get(getBasePath()).resolve(relativePath).normalize();
        File videoFile = videoPath.toFile();

        if (!videoFile.exists() || !videoFile.isFile()) {
            return ResponseEntity.notFound().build();
        }

        if (!videoPath.startsWith(Paths.get(getBasePath()).normalize())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        long fileSize = videoFile.length();
        String rangeHeader = request.getHeader("Range");

        if (rangeHeader != null && rangeHeader.startsWith("bytes=")) {
            return handleRangeRequest(videoFile, fileSize, rangeHeader);
        }

        return ResponseEntity.ok()
                .contentType(MediaTypeFactory.getMediaResource(videoFile.getName())
                        .orElse(MediaType.APPLICATION_OCTET_STREAM))
                .contentLength(fileSize)
                .header("Accept-Ranges", "bytes")
                .body(new FileSystemResource(videoFile));
    }

    private ResponseEntity<Resource> handleRangeRequest(File videoFile, long fileSize, String rangeHeader) throws IOException {
        String[] ranges = rangeHeader.substring("bytes=".length()).split("-");
        long start = Long.parseLong(ranges[0]);
        long end = ranges.length > 1 && !ranges[1].isEmpty()
                ? Long.parseLong(ranges[1])
                : Math.min(start + 1024 * 1024 - 1, fileSize - 1);

        if (start >= fileSize || end >= fileSize) {
            return ResponseEntity.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
                    .header("Content-Range", "bytes */" + fileSize)
                    .build();
        }

        long contentLength = end - start + 1;

        return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                .contentType(MediaTypeFactory.getMediaResource(videoFile.getName())
                        .orElse(MediaType.APPLICATION_OCTET_STREAM))
                .contentLength(contentLength)
                .header("Accept-Ranges", "bytes")
                .header("Content-Range", "bytes " + start + "-" + end + "/" + fileSize)
                .body(new FileSystemResource(videoFile));
    }
}
```

- [ ] **Step 2: 在SecurityConfig中放行/videos/****

在 `SecurityConfig.java` 的 `authorizeHttpRequests` 中，在 `.anyRequest().authenticated()` 之前添加：

```java
.requestMatchers("/videos/**").permitAll()
```

- [ ] **Step 3: 在SecurityConfig的CORS中添加/videos/**

修改 `corsConfigurationSource()` 方法，将 `source.registerCorsConfiguration("/api/**", config)` 后追加：

```java
source.registerCorsConfiguration("/videos/**", config);
```

- [ ] **Step 4: 启动后端验证**

Run: `cd backend && mvn spring-boot:run`
Expected: 启动成功，日志中无错误

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/drama/controller/VideoController.java backend/src/main/java/com/drama/config/SecurityConfig.java
git commit -m "feat: recreate VideoController with HTTP Range support and security config"
```

---

### Task 2.2: 重建videos目录与测试视频（P0-01）

**Files:**
- Create: `videos/` 目录结构
- Modify: `.gitignore`

- [ ] **Step 1: 创建videos目录结构**

```bash
mkdir -p videos/北派寻宝笔记
mkdir -p videos/天下第一纨绔
mkdir -p videos/十八岁太奶奶驾到，重整家族荣耀第三部
mkdir -p videos/幸得相遇离婚时
mkdir -p videos/荒年全村啃树皮，我有系统满仓肉
mkdir -p videos/家里家外
```

- [ ] **Step 2: 生成测试视频文件**

使用FFmpeg为每个短剧生成至少1集测试视频（10秒黑色背景+文字）：

```bash
# 为每部短剧生成第1集测试视频
for drama in "北派寻宝笔记" "天下第一纨绔" "十八岁太奶奶驾到，重整家族荣耀第三部" "幸得相遇离婚时" "荒年全村啃树皮，我有系统满仓肉" "家里家外"; do
  ffmpeg -f lavfi -i color=c=black:s=1280x720:d=10 -vf "drawtext=text='${drama} 第1集':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2" -c:v libx264 -t 10 "videos/${drama}/第1集.mp4" -y 2>/dev/null || echo "FFmpeg not available, creating placeholder"
done
```

如果FFmpeg不可用，创建占位文件：

```bash
for drama in "北派寻宝笔记" "天下第一纨绔" "十八岁太奶奶驾到，重整家族荣耀第三部" "幸得相遇离婚时" "荒年全村啃树皮，我有系统满仓肉" "家里家外"; do
  touch "videos/${drama}/第1集.mp4"
done
```

- [ ] **Step 3: 更新.gitignore**

在 `.gitignore` 中添加：

```
videos/**/*.mp4
!videos/**/.gitkeep
```

- [ ] **Step 4: 创建.gitkeep保持目录结构**

```bash
for drama in "北派寻宝笔记" "天下第一纨绔" "十八岁太奶奶驾到，重整家族荣耀第三部" "幸得相遇离婚时" "荒年全村啃树皮，我有系统满仓肉" "家里家外"; do
  touch "videos/${drama}/.gitkeep"
done
```

- [ ] **Step 5: Commit**

```bash
git add videos/ .gitignore
git commit -m "feat: recreate videos directory structure with .gitkeep files"
```

---

### Task 2.3: 修复播放页互动点数据未加载（P0-04）

**Files:**
- Modify: `frontend/src/app/drama/[id]/play/page.tsx`
- Modify: `backend/src/main/java/com/drama/controller/InteractionController.java`

- [ ] **Step 1: 后端新增按剧集获取互动点端点**

在 `InteractionController.java` 中添加：

```java
@GetMapping("/episode/{episodeId}")
public ApiResponse<List<InteractionPoint>> getByEpisode(@PathVariable Long episodeId) {
    List<InteractionPoint> points = interactionPointRepository
            .findWithOptionsByEpisodeId(episodeId);
    return ApiResponse.success(points);
}
```

- [ ] **Step 2: 在SecurityConfig中放行新端点**

在 `SecurityConfig.java` 的 permitAll 中添加：

```java
.requestMatchers("/api/interaction/episode/**").permitAll()
```

- [ ] **Step 3: 前端api-client添加获取互动点方法**

在 `frontend/src/lib/api-client.ts` 中添加：

```typescript
export async function getEpisodeInteractions(episodeId: number) {
  return apiGet<any>(`/api/interaction/episode/${episodeId}`);
}
```

- [ ] **Step 4: 修改play/page.tsx加载互动点数据**

在 `play/page.tsx` 的 `loadEpisodeData` 函数中，在 `setEpisode(ep)` 之后添加互动点加载：

```typescript
async function loadEpisodeData(episodeId: number) {
  try {
    const ep = await getEpisodePlayInfo(episodeId);
    setEpisode(ep);

    const [danmakus, comms, interactionPoints] = await Promise.all([
      getDanmaku(episodeId).catch(() => []),
      getComments(dramaId, 0, 5).catch(() => ({ content: [] })),
      getEpisodeInteractions(episodeId).catch(() => []),
    ]);
    setDanmakuList(Array.isArray(danmakus) ? danmakus : []);
    const commentData = comms as any;
    setComments(Array.isArray(commentData) ? commentData : (commentData?.content || []));
    setInteractions(Array.isArray(interactionPoints) ? interactionPoints : []);
  } catch (err) {
    console.error('Failed to load episode data:', err);
  }
}
```

同时在文件顶部import中添加 `getEpisodeInteractions`。

- [ ] **Step 5: 启动前后端验证**

Run: 后端 `mvn spring-boot:run`，前端 `npx next dev`
Expected: 播放页加载时能看到互动点数据

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/drama/\[id\]/play/page.tsx frontend/src/lib/api-client.ts backend/src/main/java/com/drama/controller/InteractionController.java backend/src/main/java/com/drama/config/SecurityConfig.java
git commit -m "feat: load interaction points in play page and add episode interaction endpoint"
```

---

### Task 2.4: 修复PlayInfo streams字段为空（P0-06）

**Files:**
- Modify: `backend/src/main/java/com/drama/dto/PlayInfo.java`
- Modify: `backend/src/main/java/com/drama/service/EpisodeService.java`

- [ ] **Step 1: 检查PlayInfo DTO**

读取 `PlayInfo.java`，确认是否有 `streams` 字段及其类型。如果streams是String类型（JSON字符串），需要改为List<Stream>类型或添加解析逻辑。

- [ ] **Step 2: 修复EpisodeService中PlayInfo的streams映射**

在 `EpisodeService.java` 的 `getPlayInfo` 方法中，确保streams JSON字符串被正确解析为Stream对象列表。如果Episode实体的streams字段是String类型，需要：

```java
// 在PlayInfo构建时解析streams
if (episode.getStreams() != null && !episode.getStreams().isEmpty()) {
    try {
        ObjectMapper mapper = new ObjectMapper();
        List<StreamInfo> streamList = mapper.readValue(episode.getStreams(),
            mapper.getTypeFactory().constructCollectionType(List.class, StreamInfo.class));
        playInfo.setStreams(streamList);
    } catch (Exception e) {
        log.warn("Failed to parse streams JSON for episode {}", episodeId);
    }
}
```

- [ ] **Step 3: 验证API返回streams数据**

Run: `curl http://localhost:8080/api/episode/1/playinfo`
Expected: 返回的data中streams字段包含720p和1080p两个流对象

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/drama/dto/PlayInfo.java backend/src/main/java/com/drama/service/EpisodeService.java
git commit -m "fix: populate streams field in PlayInfo response"
```

---

### Task 2.5: 新增/api/eggs/catalog端点（P0-03）

**Files:**
- Modify: `backend/src/main/java/com/drama/controller/EggController.java`
- Modify: `backend/src/main/java/com/drama/config/SecurityConfig.java`

- [ ] **Step 1: 在EggController中添加catalog端点**

在 `EggController.java` 中添加：

```java
@GetMapping("/catalog")
public ApiResponse<List<EggCatalogEntry>> getCatalog() {
    List<InteractionPoint> allEggs = interactionPointRepository
            .findByInteractionTypeWithEpisodeAndDrama(InteractionPoint.InteractionType.EGG);

    List<EggCatalogEntry> catalog = allEggs.stream().map(egg -> {
        EggCatalogEntry entry = new EggCatalogEntry();
        entry.setId(egg.getId());
        entry.setDramaId(egg.getEpisode().getDrama().getId());
        entry.setDramaTitle(egg.getEpisode().getDrama().getTitle());
        entry.setEggContent(egg.getQuestionText());
        entry.setInteractionId(egg.getId());
        return entry;
    }).collect(Collectors.toList());

    return ApiResponse.success(catalog);
}

@Data
public static class EggCatalogEntry {
    private Long id;
    private Long dramaId;
    private String dramaTitle;
    private String eggContent;
    private Long interactionId;
}
```

- [ ] **Step 2: 在SecurityConfig中放行catalog端点**

在 `SecurityConfig.java` 的 permitAll 中添加：

```java
.requestMatchers("/api/eggs/catalog").permitAll()
```

- [ ] **Step 3: 验证API**

Run: `curl -H "Authorization: Bearer <token>" http://localhost:8080/api/eggs/catalog`
Expected: 返回200和彩蛋目录列表

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/drama/controller/EggController.java backend/src/main/java/com/drama/config/SecurityConfig.java
git commit -m "feat: add /api/eggs/catalog endpoint for egg collection page"
```

---

### Task 2.6: 修复封面图URL未使用resolveUrl（P1-01）

**Files:**
- Modify: `frontend/src/components/Banner.tsx`
- Modify: `frontend/src/components/DramaCard.tsx`
- Modify: `frontend/src/components/DramaGrid.tsx`
- Modify: `frontend/src/app/drama/[id]/page.tsx`

- [ ] **Step 1: 修改Banner.tsx**

在 `Banner.tsx` 中：
- 添加import: `import { resolveUrl } from '@/lib/api-client';`
- 将 `<img src={drama.coverUrl}` 改为 `<img src={resolveUrl(drama.coverUrl)}`

- [ ] **Step 2: 修改DramaCard.tsx**

在 `DramaCard.tsx` 中：
- 添加import: `import { resolveUrl } from '@/lib/api-client';`
- 将 `<img src={drama.coverUrl}` 改为 `<img src={resolveUrl(drama.coverUrl)}`

- [ ] **Step 3: 修改DramaGrid.tsx**

在 `DramaGrid.tsx` 的 `DramaListItem` 组件中：
- 添加import: `import { resolveUrl } from '@/lib/api-client';`
- 将 `<img src={drama.coverUrl}` 改为 `<img src={resolveUrl(drama.coverUrl)}`

- [ ] **Step 4: 修改详情页**

在 `drama/[id]/page.tsx` 中：
- 添加import: `import { resolveUrl } from '@/lib/api-client';`
- 将 `<img src={drama.coverUrl}` 改为 `<img src={resolveUrl(drama.coverUrl)}`

- [ ] **Step 5: 验证封面图加载**

在安卓模拟器中打开 `http://10.0.2.2:3000`，确认封面图正常显示

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/Banner.tsx frontend/src/components/DramaCard.tsx frontend/src/components/DramaGrid.tsx frontend/src/app/drama/\[id\]/page.tsx
git commit -m "fix: use resolveUrl for all cover image URLs to support emulator access"
```

---

### Task 2.7: 修复搜索结果数据解析错误（P1-02）

**Files:**
- Modify: `frontend/src/app/search/page.tsx`

- [ ] **Step 1: 修复doSearch函数**

在 `search/page.tsx` 的 `doSearch` 函数中，将：

```typescript
const data = await searchDramas(kw.trim());
setResults(data);
```

改为：

```typescript
const data = await searchDramas(kw.trim());
setResults(Array.isArray(data) ? data : (data?.content || []));
```

- [ ] **Step 2: 验证搜索功能**

在搜索页输入"北派"，确认搜索结果正确显示

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/search/page.tsx
git commit -m "fix: parse search results from Page object correctly"
```

---

### Task 2.8: 修复收藏状态和积分显示错误（P1-03 + P1-04）

**Files:**
- Modify: `frontend/src/app/drama/[id]/page.tsx`
- Modify: `frontend/src/app/profile/page.tsx`

- [ ] **Step 1: 修复详情页收藏状态判断**

在 `drama/[id]/page.tsx` 中，将：

```typescript
checkFavorite(dramaId).catch(() => false),
```

和对应的 `.then` 中：

```typescript
setIsFavorited(!!fav);
```

改为：

```typescript
checkFavorite(dramaId).catch(() => ({ favorited: false })),
```

```typescript
setIsFavorited(!!fav?.favorited);
```

- [ ] **Step 2: 修复个人中心积分显示**

在 `profile/page.tsx` 中，将：

```typescript
const balance = await getPointsBalance();
setPoints(balance);
```

改为：

```typescript
const balance = await getPointsBalance();
setPoints(typeof balance === 'number' ? balance : balance?.points ?? 0);
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/drama/\[id\]/page.tsx frontend/src/app/profile/page.tsx
git commit -m "fix: correct favorite status check and points display parsing"
```

---

### Task 2.9: 修复登录数据解构和空搜索问题（P1-05 + P1-09）

**Files:**
- Modify: `frontend/src/app/login/page.tsx`
- Modify: `frontend/src/app/register/page.tsx`
- Modify: `backend/src/main/java/com/drama/service/DramaService.java`

- [ ] **Step 1: 修复登录页数据解构**

在 `login/page.tsx` 中，将：

```typescript
const { token, userId } = await login(username.trim(), password);
setAuth(token, userId);
```

改为：

```typescript
const data = await login(username.trim(), password);
setAuth(data.token, data.userId || data.user?.id);
```

- [ ] **Step 2: 修复注册页同样的问题**

在 `register/page.tsx` 中做相同修改。

- [ ] **Step 3: 修复空搜索返回所有数据**

在 `DramaService.java` 的 `search` 方法中，添加空关键词检查：

```java
public Page<DramaSummary> search(String keyword, int page, int size) {
    if (keyword == null || keyword.trim().isEmpty()) {
        return Page.empty(PageRequest.of(page, size));
    }
    // ... 原有搜索逻辑
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/login/page.tsx frontend/src/app/register/page.tsx backend/src/main/java/com/drama/service/DramaService.java
git commit -m "fix: login data destructuring and empty search keyword handling"
```

---

### Task 2.10: 创建缺失的profile子页面（P1-08）

**Files:**
- Create: `frontend/src/app/profile/favorites/page.tsx`
- Create: `frontend/src/app/profile/history/page.tsx`

- [ ] **Step 1: 创建我的追剧页面**

创建 `frontend/src/app/profile/favorites/page.tsx`：

```typescript
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bookmark, ChevronLeft } from 'lucide-react';
import { getFavorites } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth';
import DramaCard from '@/components/DramaCard';
import type { Drama } from '@/lib/types';

export default function FavoritesPage() {
  const { isLoggedIn } = useAuthStore();
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) return;
    getFavorites()
      .then((res: any) => {
        const list = Array.isArray(res) ? res : (res?.content || []);
        setDramas(list.map((f: any) => f.drama || f));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Bookmark className="w-16 h-16 text-drama-muted mx-auto mb-4" />
        <p className="text-drama-muted">请先登录</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/profile" className="text-drama-muted hover:text-drama-text">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-drama-text">我的追剧</h1>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-drama-card animate-pulse aspect-video" />
          ))}
        </div>
      ) : dramas.length === 0 ? (
        <div className="text-center py-20 text-drama-muted">还没有追剧记录</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {dramas.map((d) => <DramaCard key={d.id} drama={d} />)}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 创建观看历史页面**

创建 `frontend/src/app/profile/history/page.tsx`：

```typescript
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, ChevronLeft } from 'lucide-react';
import { useAuthStore } from '@/lib/auth';
import { apiGet } from '@/lib/api-client';
import DramaCard from '@/components/DramaCard';
import type { Drama } from '@/lib/types';

interface HistoryItem {
  drama: Drama;
  episodeId: number;
  episodeNumber: number;
  positionMs: number;
  lastWatchedAt: string;
}

export default function HistoryPage() {
  const { isLoggedIn } = useAuthStore();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) return;
    apiGet<any>('/api/progress/history')
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.content || []);
        setItems(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Clock className="w-16 h-16 text-drama-muted mx-auto mb-4" />
        <p className="text-drama-muted">请先登录</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/profile" className="text-drama-muted hover:text-drama-text">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-drama-text">观看历史</h1>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-drama-card animate-pulse aspect-video" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-drama-muted">还没有观看记录</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => item.drama && <DramaCard key={item.drama.id} drama={item.drama} />)}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/profile/favorites/page.tsx frontend/src/app/profile/history/page.tsx
git commit -m "feat: add profile favorites and history pages"
```

---

## 阶段三：内容互动能力完善

### Task 3.1: 完善互动组件数据传递

**Files:**
- Modify: `frontend/src/components/InteractionOverlay.tsx`
- Modify: `frontend/src/components/interaction/QuizPanel.tsx`
- Modify: `frontend/src/components/interaction/VotePanel.tsx`
- Modify: `frontend/src/components/interaction/ChoicePanel.tsx`

- [ ] **Step 1: 检查并修复互动组件的props类型匹配**

读取每个互动组件，确认其接收的props类型与InteractionOverlay传递的commonProps一致。特别检查：
- `interaction` 对象结构是否与后端返回的InteractionPoint匹配
- `onAnswer` 回调参数是否正确（interactionId + optionId）
- 后端返回的options中id字段是否为Long类型（前端用number）

- [ ] **Step 2: 修复InteractionOverlay中互动触发后的反馈逻辑**

在 `InteractionOverlay.tsx` 中，当用户选择选项后，应显示投票/答题结果统计：

```typescript
function handleAnswer(interactionId: number, optionId: number) {
    onAnswer(interactionId, optionId);
    // 可选：立即获取统计数据显示结果
}
```

- [ ] **Step 3: 验证互动触发**

在播放页播放视频，确认到达互动时间点时弹出互动面板

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/InteractionOverlay.tsx frontend/src/components/interaction/
git commit -m "fix: align interaction component props with backend data structure"
```

---

### Task 3.2: 添加互动统计实时展示

**Files:**
- Modify: `frontend/src/components/interaction/VotePanel.tsx`
- Modify: `frontend/src/components/interaction/QuizPanel.tsx`

- [ ] **Step 1: 投票后显示投票分布**

在 `VotePanel.tsx` 中，用户投票后调用 `getInteractionStats(interactionId)` 获取统计，显示各选项百分比进度条。

- [ ] **Step 2: 答题后显示正确率和分布**

在 `QuizPanel.tsx` 中，用户答题后显示正确/错误反馈，并展示各选项选择分布。

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/interaction/VotePanel.tsx frontend/src/components/interaction/QuizPanel.tsx
git commit -m "feat: show interaction statistics after user votes or answers quiz"
```

---

## 阶段四：用户互动能力开发

### Task 4.1: 添加评论排序功能

**Files:**
- Modify: `frontend/src/app/drama/[id]/page.tsx`

- [ ] **Step 1: 在CommentSection中添加排序切换**

在详情页的CommentSection中添加"最热/最新"排序切换按钮，调用 `getComments(dramaId, 0, 20, sort)` 时传入不同sort参数。

- [ ] **Step 2: Commit**

```bash
git add frontend/src/app/drama/\[id\]/page.tsx
git commit -m "feat: add comment sorting toggle in detail page"
```

---

### Task 4.2: 添加评分功能

**Files:**
- Create: `frontend/src/components/RatingInput.tsx`
- Modify: `frontend/src/app/drama/[id]/page.tsx`

- [ ] **Step 1: 创建RatingInput组件**

创建 `frontend/src/components/RatingInput.tsx`，实现1-10分星级评分组件，调用 `submitRating` 和 `getUserRating` API。

- [ ] **Step 2: 在详情页集成评分组件**

在详情页简介区域下方添加RatingInput组件。

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/RatingInput.tsx frontend/src/app/drama/\[id\]/page.tsx
git commit -m "feat: add drama rating component in detail page"
```

---

### Task 4.3: 添加继续观看功能

**Files:**
- Modify: `frontend/src/app/page.tsx`
- Modify: `frontend/src/lib/api-client.ts`

- [ ] **Step 1: 在api-client中添加getContinueWatching**

```typescript
export async function getContinueWatching() {
  return apiGet<any>('/api/drama/continue');
}
```

- [ ] **Step 2: 在首页添加继续观看区域**

在首页Banner下方添加"继续观看"横向滚动列表，仅登录用户可见。

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/page.tsx frontend/src/lib/api-client.ts
git commit -m "feat: add continue watching section on homepage"
```

---

### Task 4.4: 添加在线人数显示

**Files:**
- Modify: `frontend/src/app/drama/[id]/play/page.tsx`
- Modify: `frontend/src/lib/api-client.ts`

- [ ] **Step 1: 在api-client中添加getOnlineCount**

```typescript
export async function getOnlineCount(episodeId: number) {
  return apiGet<any>(`/api/online/episode/${episodeId}/count`);
}
```

- [ ] **Step 2: 在播放页显示在线人数**

在播放页标题区域添加在线人数显示，定时刷新（每30秒）。

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/drama/\[id\]/play/page.tsx frontend/src/lib/api-client.ts
git commit -m "feat: show online viewer count on play page"
```

---

## 阶段五：后台服务与数据库完善

### Task 5.1: 添加观看历史API

**Files:**
- Modify: `backend/src/main/java/com/drama/controller/ProgressController.java`
- Modify: `backend/src/main/java/com/drama/service/ProgressService.java`

- [ ] **Step 1: 在ProgressController中添加历史记录端点**

```java
@GetMapping("/history")
public ApiResponse<List<WatchHistoryItem>> getHistory() {
    Long userId = AuthUtils.requireUserId();
    return ApiResponse.success(progressService.getWatchHistory(userId));
}
```

- [ ] **Step 2: 在ProgressService中实现历史查询**

查询用户最近的观看记录，关联Drama信息返回。

- [ ] **Step 3: Commit**

```bash
git add backend/src/main/java/com/drama/controller/ProgressController.java backend/src/main/java/com/drama/service/ProgressService.java
git commit -m "feat: add watch history API endpoint"
```

---

### Task 5.2: 修复断点续播功能

**Files:**
- Modify: `frontend/src/app/drama/[id]/play/page.tsx`
- Modify: `backend/src/main/java/com/drama/service/EpisodeService.java`

- [ ] **Step 1: 后端在playinfo中返回上次播放位置**

在 `EpisodeService.getPlayInfo()` 中，如果用户已认证，查询WatchProgress返回上次播放位置。

- [ ] **Step 2: 前端使用返回的播放位置**

在 `play/page.tsx` 中，从playinfo获取resumePosition并设置到 `setResumePositionMs()`。

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/drama/\[id\]/play/page.tsx backend/src/main/java/com/drama/service/EpisodeService.java
git commit -m "feat: implement resume playback from last watch position"
```

---

### Task 5.3: DataInitializer添加status字段

**Files:**
- Modify: `backend/src/main/java/com/drama/config/DataInitializer.java`

- [ ] **Step 1: 为每部短剧设置status字段**

在DataInitializer的每个init方法中添加：

```java
d.setStatus("completed"); // 或 "ongoing"
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/main/java/com/drama/config/DataInitializer.java
git commit -m "fix: set drama status field in DataInitializer"
```

---

### Task 5.4: 添加注册字段校验

**Files:**
- Modify: `backend/src/main/java/com/drama/dto/RegisterRequest.java`

- [ ] **Step 1: 添加校验注解**

```java
@NotBlank(message = "用户名不能为空")
@Size(min = 3, max = 20, message = "用户名长度3-20位")
@Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "用户名只能包含字母、数字和下划线")
private String username;

@NotBlank(message = "密码不能为空")
@Size(min = 6, max = 50, message = "密码长度6-50位")
private String password;

@NotBlank(message = "昵称不能为空")
@Size(min = 1, max = 30, message = "昵称长度1-30位")
private String nickname;
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/main/java/com/drama/dto/RegisterRequest.java
git commit -m "feat: add validation annotations to RegisterRequest"
```

---

## 阶段六：服务部署实现

### Task 6.1: 重建docker-compose.yml（P0-05）

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: 创建docker-compose.yml**

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-drama123}
      MYSQL_DATABASE: drama_player
      MYSQL_USER: drama
      MYSQL_PASSWORD: ${MYSQL_PASSWORD:-drama123}
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./sql/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD:-drama123}
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD:-drama123}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      SPRING_PROFILES_ACTIVE: default
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/drama_player?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
      SPRING_DATASOURCE_USERNAME: drama
      SPRING_DATASOURCE_PASSWORD: ${MYSQL_PASSWORD:-drama123}
      SPRING_DATA_REDIS_HOST: redis
      SPRING_DATA_REDIS_PASSWORD: ${REDIS_PASSWORD:-drama123}
      JWT_SECRET: ${JWT_SECRET:-dramaPlayerSecretKeyForJwtTokenGeneration2024}
      VIDEO_BASE_PATH: /app/videos
    volumes:
      - ./videos:/app/videos
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_BASE_URL: http://backend:8080
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/certs:/etc/nginx/certs:ro
    depends_on:
      - frontend
      - backend

volumes:
  mysql_data:
  redis_data:
```

- [ ] **Step 2: 验证docker-compose配置**

Run: `docker compose config`
Expected: 无语法错误

- [ ] **Step 3: Commit**

```bash
git add docker-compose.yml
git commit -m "feat: recreate docker-compose.yml with all services"
```

---

### Task 6.2: 本地开发环境部署脚本优化

**Files:**
- Modify: `deploy.ps1`

- [ ] **Step 1: 更新deploy.ps1**

确保Windows部署脚本支持：
- 检查Docker Desktop是否运行
- 自动创建.env文件（从.env.example复制）
- 一键启动/停止服务
- 查看服务状态

- [ ] **Step 2: Commit**

```bash
git add deploy.ps1
git commit -m "improve: update Windows deployment script"
```

---

## 阶段七：测试与优化

### Task 7.1: 后端单元测试补充

**Files:**
- Create: `backend/src/test/java/com/drama/service/CommentServiceTest.java`
- Create: `backend/src/test/java/com/drama/service/RatingServiceTest.java`
- Create: `backend/src/test/java/com/drama/service/OnlineServiceTest.java`

- [ ] **Step 1: 编写CommentServiceTest**

测试评论CRUD、点赞、回复、排序功能。

- [ ] **Step 2: 编写RatingServiceTest**

测试评分提交、重复评分、平均分计算。

- [ ] **Step 3: 编写OnlineServiceTest**

测试在线心跳、过期清理、人数统计。

- [ ] **Step 4: 运行所有测试**

Run: `cd backend && mvn test`
Expected: 所有测试通过

- [ ] **Step 5: Commit**

```bash
git add backend/src/test/
git commit -m "test: add unit tests for Comment, Rating, and Online services"
```

---

### Task 7.2: 前端关键路径集成测试

**Files:**
- Create: `frontend/__tests__/api-client.test.ts`

- [ ] **Step 1: 安装测试依赖**

Run: `cd frontend && npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom`

- [ ] **Step 2: 配置vitest**

在 `frontend/package.json` 中添加：
```json
"scripts": { "test": "vitest" }
```

创建 `frontend/vitest.config.ts`。

- [ ] **Step 3: 编写api-client测试**

测试 `resolveUrl`、`getApiBaseUrl` 函数在不同hostname下的行为。

- [ ] **Step 4: 运行测试**

Run: `cd frontend && npm test`
Expected: 测试通过

- [ ] **Step 5: Commit**

```bash
git add frontend/__tests__/ frontend/vitest.config.ts frontend/package.json
git commit -m "test: add frontend unit tests for api-client utilities"
```

---

### Task 7.3: 安卓模拟器兼容性测试

- [ ] **Step 1: 启动所有服务**

后端(8080) + 前端(3000) + 模拟器

- [ ] **Step 2: 测试所有页面**

逐页测试：首页 → 登录 → 注册 → 详情 → 播放 → 搜索 → 个人中心 → 彩蛋图鉴

- [ ] **Step 3: 记录并修复发现的问题**

更新 `TEST_REPORT.md`

- [ ] **Step 4: Commit**

```bash
git add TEST_REPORT.md
git commit -m "test: update test report after compatibility testing"
```

---

### Task 7.4: 安全审查与修复

**Files:**
- Modify: `backend/src/main/java/com/drama/config/SecurityConfig.java`

- [ ] **Step 1: H2控制台仅开发环境可用**

在SecurityConfig中添加Profile条件：

```java
@Profile("h2")
@Bean
public WebSecurityCustomizer h2ConsoleCustomizer() {
    return web -> web.ignoring().requestMatchers("/h2-console/**");
}
```

- [ ] **Step 2: 检查JWT密钥安全性**

确保生产环境JWT密钥通过环境变量注入，不在代码中硬编码。

- [ ] **Step 3: 检查SQL注入风险**

确认所有Repository方法使用参数化查询，无字符串拼接SQL。

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/drama/config/SecurityConfig.java
git commit -m "security: restrict H2 console to dev profile only"
```

---

## 阶段八：文档编写与项目交付

### Task 8.1: API接口文档

**Files:**
- Create: `docs/api-reference.md`

- [ ] **Step 1: 整理所有API端点文档**

列出所有25+个API端点，包含：URL、方法、参数、请求体、响应格式、认证要求、示例。

- [ ] **Step 2: Commit**

```bash
git add docs/api-reference.md
git commit -m "docs: add comprehensive API reference document"
```

---

### Task 8.2: 部署指南

**Files:**
- Create: `docs/deployment-guide.md`

- [ ] **Step 1: 编写本地开发部署指南**

包含：环境要求、安装步骤、启动命令、模拟器测试、常见问题。

- [ ] **Step 2: 编写Docker部署指南**

包含：Docker Compose启动、环境变量配置、数据持久化、SSL配置。

- [ ] **Step 3: 编写K8s部署指南**

包含：K8s配置说明、部署脚本使用、HPA配置、监控集成。

- [ ] **Step 4: Commit**

```bash
git add docs/deployment-guide.md
git commit -m "docs: add deployment guide for local, Docker, and K8s"
```

---

### Task 8.3: 项目交付清单

**Files:**
- Create: `docs/delivery-checklist.md`

- [ ] **Step 1: 编写交付清单**

包含：
- [ ] 所有P0/P1问题已修复
- [ ] 核心功能链路可用（浏览→播放→互动→社交）
- [ ] Docker部署可一键启动
- [ ] 安卓模拟器兼容性测试通过
- [ ] 后端单元测试覆盖率>60%
- [ ] API文档完整
- [ ] 部署指南完整
- [ ] 源代码已提交到Git仓库

- [ ] **Step 2: 逐项验证交付清单**

- [ ] **Step 3: Commit**

```bash
git add docs/delivery-checklist.md
git commit -m "docs: add project delivery checklist"
```

---

## 任务依赖关系图

```
阶段二（核心修复）
  Task 2.1 (VideoController) ──→ Task 2.2 (videos目录)
  Task 2.3 (互动点加载) ←── Task 2.4 (streams修复)
  Task 2.5 (eggs/catalog)
  Task 2.6 (resolveUrl) ──→ 独立
  Task 2.7~2.10 ──→ 独立（可并行）

阶段三（互动完善）←── 阶段二完成
  Task 3.1 ←── Task 2.3
  Task 3.2 ←── Task 3.1

阶段四（用户互动）←── 阶段二完成
  Task 4.1~4.4 ──→ 独立（可并行）

阶段五（后端完善）←── 阶段二完成
  Task 5.1~5.4 ──→ 独立（可并行）

阶段六（部署）←── 阶段二完成
  Task 6.1 ←── Task 2.1, 2.2
  Task 6.2 ──→ 独立

阶段七（测试）←── 阶段三~六完成
  Task 7.1~7.4

阶段八（文档）←── 阶段七完成
  Task 8.1~8.3
```

## 预估工时

| 阶段 | 任务数 | 预估工时 | 说明 |
|------|--------|---------|------|
| 阶段一：架构确认 | 1 | 0.5天 | 已完成，仅需文档化 |
| 阶段二：核心修复 | 10 | 5-7天 | P0+P1问题，最高优先级 |
| 阶段三：互动完善 | 2 | 2-3天 | 依赖阶段二 |
| 阶段四：用户互动 | 4 | 3-4天 | 可与阶段三/五并行 |
| 阶段五：后端完善 | 4 | 2-3天 | 可与阶段三/四并行 |
| 阶段六：部署 | 2 | 2-3天 | 依赖阶段二 |
| 阶段七：测试 | 4 | 3-5天 | 依赖阶段三~六 |
| 阶段八：文档 | 3 | 2-3天 | 贯穿全程 |
| **合计** | **30** | **20-29天** | 单人开发预估 |

## 执行建议

1. **阶段二必须最先完成**，否则后续所有功能测试都无法进行
2. **阶段三~六可并行执行**，建议使用subagent-driven-development分派独立任务
3. **每完成一个Task立即commit**，保持原子性提交
4. **每个阶段结束后运行完整测试**，确保无回归
5. **阶段七的模拟器测试应覆盖所有页面**，截图记录
