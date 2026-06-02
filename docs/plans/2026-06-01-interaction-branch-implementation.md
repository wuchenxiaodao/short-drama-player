# 互动分支逻辑实施计划

> 日期：2026-06-01
> 基于：2026-06-01-interaction-branch-design.md
> 状态：✅ 已完成

---

## 一、需求分析与分解

### 1.1 核心问题

四轮需求文档标记为"严重"：后端已有分支数据结构（`nextInteraction`、`prerequisite`），但前端从未消费，用户选A和选B看到的后续互动完全一样。

### 1.2 需求矩阵

| 需求ID | 描述 | 优先级 | 涉及层 | 状态 |
|--------|------|--------|--------|------|
| BR-1 | 前端消费 nextInteractionId，选择后跳转到对应分支互动 | P0 | 前端 | ✅ |
| BR-2 | 前端消费 prerequisite，只触发满足前置条件的互动 | P0 | 前端 | ✅ |
| BR-3 | 选择后显示 feedbackText 反馈文本 | P0 | 前端 | ✅ |
| BR-4 | InteractionPoint 添加 branchGroupId 字段 | P0 | 后端+前端 | ✅ |
| BR-5 | DataInitializer 构建至少2条分支链路 | P0 | 后端 | ✅ |
| BR-6 | 互动视觉升级（模糊背景+弹入动画+倒计时） | P0 | 前端 | ✅ |
| BR-7 | AI剧情生成（续写/分支文本） | P1 | 全栈 | ✅ |

### 1.3 依赖关系

```
BR-4 (branchGroupId字段)
  ├── BR-5 (DataInitializer使用branchGroupId)
  └── BR-1 (前端消费branchGroupId)
        ├── BR-2 (前置条件检查)
        └── BR-3 (feedbackText展示)
              └── BR-6 (视觉升级)
BR-7 (独立，可并行)
```

---

## 二、角色属性定义

### 2.1 后端模型变更

**InteractionPoint.java** — 新增字段：

```java
@Column(name = "branch_group_id")
private Long branchGroupId;
```

**InteractionPoint.java** — 序列化修复：

```java
@JsonIgnore
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "prerequisite_id")
private InteractionPoint prerequisite;

@JsonProperty("prerequisiteId")
public Long getPrerequisiteId() {
    return prerequisite != null ? prerequisite.getId() : null;
}
```

**InteractionOption.java** — 序列化修复：

```java
@JsonIgnore
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "next_interaction_id")
private InteractionPoint nextInteraction;

@JsonProperty("nextInteractionId")
public Long getNextInteractionId() {
    return nextInteraction != null ? nextInteraction.getId() : null;
}
```

### 2.2 前端类型变更

**types.ts** — InteractionPoint 新增：

```typescript
branchGroupId?: number | null;
prerequisiteId?: number | null;
prerequisiteChoiceOptionId?: number | null;
```

### 2.3 分支状态管理

在 InteractionOverlay 组件内部管理：

```typescript
const [currentBranchId, setCurrentBranchId] = useState<number | null>(null);
const [branchHistory, setBranchHistory] = useState<BranchChoice[]>([]);
const triggeredRef = useRef<Set<number>>(new Set());
const chosenOptionsRef = useRef<Map<number, number>>(new Map());
```

---

## 三、互动逻辑设计

### 3.1 分支过滤算法

```
对于每个互动点 interaction：
1. 已触发？ → 跳过
2. 时间不匹配？ → 跳过
3. 有 branchGroupId 且 currentBranchId !== branchGroupId？ → 跳过
4. 有 prerequisiteId 且该互动未被触发？ → 跳过
5. 有 prerequisiteChoiceOptionId 且用户未选择该option？ → 跳过
6. → 触发此互动
```

### 3.2 选择处理流程

```
用户选择 option：
1. 记录 chosenOptionsRef.set(interactionId, optionId)
2. 记录 branchHistory.push({interactionId, optionId, branchId})
3. 如果 option.nextInteractionId → setCurrentBranchId(nextInteractionId)
4. 显示 FeedbackToast(option.feedbackText)
5. 标记 triggeredRef.add(interactionId)
6. 调用 onAnswer(interactionId, optionId)
```

### 3.3 倒计时逻辑

```
互动弹出时启动10秒倒计时：
- 每秒更新 countdown 值
- 倒计时结束 → 自动选择第一个选项
- 用户手动选择 → 清除倒计时
```

---

## 四、实施步骤（详细代码级）

### Step 1: BR-4 — 后端 InteractionPoint 添加 branchGroupId ✅

**文件**: `backend/src/main/java/com/drama/model/InteractionPoint.java`

变更：
1. 添加 `@Column(name = "branch_group_id") private Long branchGroupId;`
2. 在 `prerequisite` 字段添加 `@JsonIgnore`
3. 添加 `@JsonProperty("prerequisiteId")` 方法返回 prerequisite.getId()
4. 添加 Jackson 导入 (`com.fasterxml.jackson.annotation.JsonIgnore`, `JsonProperty`)

### Step 2: BR-4 — 后端 InteractionOption 序列化修复 ✅

**文件**: `backend/src/main/java/com/drama/model/InteractionOption.java`

变更：
1. 在 `nextInteraction` 字段添加 `@JsonIgnore`
2. 添加 `@JsonProperty("nextInteractionId")` 方法返回 nextInteraction.getId()

### Step 3: BR-4 — 前端类型更新 ✅

**文件**: `frontend/src/lib/types.ts`

变更：
1. InteractionPoint 添加 `branchGroupId?: number | null;`
2. InteractionPoint 添加 `prerequisiteId?: number | null;`
3. InteractionPoint 添加 `prerequisiteChoiceOptionId?: number | null;`

### Step 4: BR-5 — DataInitializer 更新 ✅

**文件**: `backend/src/main/java/com/drama/config/DataInitializer.java`

变更：
1. `buildChoiceWithBranches()` 中，保存分支互动后设置 `branchGroupId = branch.getId()`
2. 分支选项也添加 `feedbackText` 设置（`bOpt.setFeedbackText(bo.branchOptionDefs.get(j).feedbackText)`）
3. 现有4个短剧已有分支链路数据（北派寻宝笔记、天下第一纨绔、十八岁太奶奶、荒年全村啃树皮）

### Step 5: BR-1+BR-2 — InteractionOverlay 分支逻辑 ✅

**文件**: `frontend/src/components/InteractionOverlay.tsx`（完全重写）

变更：
1. 添加分支追踪状态（currentBranchId, branchHistory, chosenOptionsRef）
2. 添加 `canTrigger()` 函数：branchGroupId 过滤 + prerequisite 检查
3. 修改触发逻辑：使用 canTrigger 过滤
4. 添加 `handleBranchAnswer()` 函数：消费 nextInteractionId，更新 currentBranchId，显示 feedbackText
5. 添加倒计时状态和逻辑（10秒自动选择第一项）
6. 添加模糊遮罩层（`bg-black/40 backdrop-blur-[2px]`）
7. 添加倒计时进度条UI

### Step 6: BR-3 — FeedbackToast 组件 ✅

**新文件**: `frontend/src/components/FeedbackToast.tsx`

功能：
- 接收 message prop
- 顶部居中显示，渐变背景（`from-primary-600/90 to-primary-500/90`）
- 弹入动画（`animate-in slide-in-from-top fade-in`）
- 3秒自动消失（由 InteractionOverlay 控制）

### Step 7: BR-6 — 视觉升级 ✅

**文件**: `frontend/src/components/InteractionOverlay.tsx`

变更：
1. 添加全屏模糊遮罩层（`bg-black/40 backdrop-blur-[2px]`）
2. 添加10秒倒计时进度条（`bg-primary-500` 渐变条）
3. 超时自动选择第一项（`handleAutoSelect()`）
4. 点击遮罩层也触发自动选择

### Step 8: BR-7 — AI剧情生成 ✅

**新文件**:
- `backend/src/main/java/com/drama/model/GeneratedStory.java` — 实体，含 episode, user, prompt, content, type 字段
- `backend/src/main/java/com/drama/repository/GeneratedStoryRepository.java` — JPA Repository
- `backend/src/main/java/com/drama/service/AIStoryService.java` — 服务层，支持分支生成和续写
- `backend/src/main/java/com/drama/controller/AIStoryController.java` — REST API

**API端点**:
- `POST /api/ai-story/branch` — 生成分支剧情
- `POST /api/ai-story/continue` — 续写剧情
- `GET /api/ai-story/my` — 获取用户生成的故事

**前端API**:
- `generateBranch(episodeId, prompt)` — api-client.ts
- `generateContinue(episodeId, prompt)` — api-client.ts
- `getMyStories()` — api-client.ts

**设计决策**:
- 无AI API Key时返回演示文本（保证功能可用性）
- GeneratedStory 使用 `@JsonIgnore` + `@PostLoad` + `@Transient` 避免懒加载序列化问题
- 需要认证（`AuthUtils.requireUserId()`）

### Step 9: 质量验证 ✅

1. `mvn compile` — ✅ 后端编译通过
2. `mvn test` — ✅ 后端测试通过
3. `next build` — ✅ 前端构建通过

---

## 五、质量验证标准

### 5.1 分支逻辑验证

- [ ] 播放北派寻宝笔记第2集，30秒弹出"寻宝方向选择"
- [ ] 选"古墓" → 看到反馈文本 → 50秒弹出古墓分支QUIZ
- [ ] 重播，选"密室" → 看到反馈文本 → 50秒弹出密室分支QUIZ
- [ ] 两个分支体验明显不同

### 5.2 前置条件验证

- [ ] 有prerequisite的互动点仅在前置互动被触发后才出现
- [ ] 有prerequisiteChoiceOptionId的互动点仅在用户选择了指定option后才出现

### 5.3 视觉反馈验证

- [ ] 互动弹窗有模糊背景效果
- [ ] 10秒倒计时正常工作
- [ ] 超时后自动选择第一项
- [ ] feedbackText以Toast形式显示，3秒后消失

### 5.4 构建验证

- [x] `mvn compile` 成功
- [x] `next build` 成功
- [x] `mvn test` 成功

---

## 六、决策记录

| 决策 | 选择 | 原因 |
|------|------|------|
| 分支状态管理位置 | InteractionOverlay组件内部 | 避免play page过度复杂，分支逻辑是overlay的职责 |
| prerequisite序列化 | @JsonIgnore + @JsonProperty | 避免LazyInitializationException，前端只需ID |
| branchGroupId赋值时机 | 保存分支互动后立即设置 | JPA需要先保存获取ID，再设置branchGroupId |
| 倒计时实现 | useState + useEffect + setInterval | 简单直接，避免引入额外依赖 |
| AI故事生成 | 无Key时返回演示文本 | 保证功能可用性，不依赖外部API |
| GeneratedStory序列化 | @JsonIgnore + @PostLoad + @Transient | 避免懒加载序列化问题，@PostLoad填充ID |
| 分支选项feedbackText | DataInitializer中添加bOpt.setFeedbackText | 之前遗漏，分支选项也需要反馈文本 |
| 遮罩层点击 | 触发自动选择 | 提供跳过互动的方式 |

---

## 七、变更文件清单

### 修改文件

| 文件 | 变更类型 | 描述 |
|------|----------|------|
| `backend/.../model/InteractionPoint.java` | 修改 | 添加branchGroupId字段，@JsonIgnore prerequisite，@JsonProperty prerequisiteId |
| `backend/.../model/InteractionOption.java` | 修改 | @JsonIgnore nextInteraction，@JsonProperty nextInteractionId |
| `backend/.../config/DataInitializer.java` | 修改 | 设置branchGroupId，添加分支选项feedbackText |
| `frontend/src/lib/types.ts` | 修改 | InteractionPoint添加3个新字段 |
| `frontend/src/components/InteractionOverlay.tsx` | 重写 | 完整分支逻辑+倒计时+视觉升级 |
| `frontend/src/lib/api-client.ts` | 修改 | 添加3个AI故事API函数 |

### 新增文件

| 文件 | 描述 |
|------|------|
| `frontend/src/components/FeedbackToast.tsx` | 反馈文本Toast组件 |
| `backend/.../model/GeneratedStory.java` | AI生成故事实体 |
| `backend/.../repository/GeneratedStoryRepository.java` | JPA Repository |
| `backend/.../service/AIStoryService.java` | AI故事服务（含演示模式） |
| `backend/.../controller/AIStoryController.java` | REST API控制器 |
| `docs/plans/2026-06-01-interaction-branch-implementation.md` | 本文档 |
