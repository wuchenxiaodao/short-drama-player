# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 工作规范

- **全程使用中文交流**，包括回复、注释说明、commit message 等
- **思考过程用中文表示**
- **重要改动先备份**：在进行任何重要代码修改前，先将当前状态提交并推送到 GitHub 进行备份，确认备份成功后再执行修改

## Project Overview

短剧互动播放器 — 一款为短剧设计的沉浸式互动娱乐平台，核心体验是"观看-互动-再参与"的闭环。后端是 Spring Boot REST API，前端是 SPA 单页应用。

## Commands

### Backend (Java 17, Maven)

```bash
cd backend

# Build
./mvnw clean package -DskipTests

# Run locally with H2 (no external DB needed)
java -jar target/short-drama-player-1.0.0.jar --spring.profiles.active=h2

# Run tests
./mvnw test

# Run single test class
./mvnw test -Dtest=DramaServiceTest
```

### Docker (full stack: MySQL + Redis + Backend)

```bash
# From project root
docker-compose up -d          # start all
docker-compose ps              # check health
docker-compose logs -f backend # tail backend logs
docker-compose down            # stop all
```

## Architecture

### Backend (`backend/`)

Standard Spring Boot layered architecture under `com.drama`:

- **controller/** — REST endpoints. Each controller maps to a domain (Drama, Episode, Interaction, Progress, Auth, Comment, Rating, UserProfile).
- **service/** — Business logic. Services call repositories directly; no extra abstraction layers.
- **model/** — JPA entities. Key entities: `Drama`, `Episode`, `InteractionPoint`, `InteractionAnswer`, `WatchProgress` (composite PK via `WatchProgressId`), `User`, `Comment`, `CommentLike`, `Rating`, `Medal`, `UserMedal`, `UserEgg`.
- **repository/** — Spring Data JPA interfaces.
- **dto/** — Request/response objects. Controllers map between DTOs and entities.
- **config/** — `DataInitializer` seeds sample data on startup; `RedisConfig` for cache; `WebConfig` for CORS.

Database profiles:
- `h2` — in-memory, zero config, for local dev
- default — MySQL via environment variables (`MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`)

JPA uses `ddl-auto=update` so schema evolves from entity definitions. The `sql/init.sql` only creates the database and user.

### Content (`short-drama/`)

Video files organized by drama title (e.g. `短剧名/第1集.mp4`). These are local assets not committed to git — the `videos/` gitignore rule excludes them. The `DataInitializer` seeds drama metadata; video paths are resolved at runtime.

### Kubernetes (`k8s/`)

Deployment manifests for ACK/TKE: `backend.yaml`, `mysql.yaml`, `redis.yaml`. Use `k8s/deploy.sh` to apply.

## API Endpoints

All prefixed with `/api`:

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/drama/recommend?page=0&size=10` | Recommended dramas |
| GET | `/drama/hot?page=0&size=10` | Hot dramas |
| GET | `/drama/{id}/detail` | Drama detail |
| GET | `/drama/search?keyword=...` | Search dramas |
| GET | `/drama/new?page=0&size=10` | Newest dramas |
| GET | `/episode/{id}/playinfo` | Play info + interaction points |
| POST | `/interaction/answer` | Submit interaction answer |
| GET | `/interaction/{id}/stats` | Interaction statistics |
| POST | `/progress/report` | Report watch progress |
| POST | `/auth/register` | Register |
| POST | `/auth/login` | Login |
| GET | `/auth/{userId}` | Get user info |
| GET | `/comment/{interactionId}` | List comments |
| GET | `/comment/{interactionId}/count` | Comment count |
| GET | `/comment/replies/{parentCommentId}` | Reply thread |
| POST | `/comment` | Create comment |
| POST | `/comment/{commentId}/like` | Like comment |
| POST | `/rating/submit` | Submit rating |
| GET | `/rating/stats?dramaId=...` | Rating stats |
| GET | `/rating/user?userId=...&dramaId=...` | User's rating |
| GET | `/user/{userId}/eggs` | Collected easter eggs |
| GET | `/user/{userId}/eggs/count` | Easter egg count |
| GET | `/user/{userId}/medals` | Earned medals |
| GET | `/user/{userId}/medals/check/{medalCode}` | Check specific medal |
| GET | `/favorite/list` | User's favorites |
| GET | `/favorite/check?dramaId=...` | Check if favorited |
| POST | `/favorite/toggle` | Toggle favorite |
| GET | `/danmaku/episode/{episodeId}` | Episode danmaku |
| POST | `/danmaku` | Send danmaku |
| GET | `/points` | User points |
| GET | `/points/history` | Points history |
| GET | `/drama/categories` | Category list |
| GET | `/drama/continue` | Continue watching |
