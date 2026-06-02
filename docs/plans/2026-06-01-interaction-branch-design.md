# 互动分支逻辑设计文档

> 日期：2026-06-01
> 基于：short-drama-player-四轮需求对照改进指南 §2a.2 + §2b
> 目标：让用户的选择真正影响剧情走向，实现真正的互动分支体验

---

## 一、需求分析

### 1.1 当前问题（四轮需求文档标记为"严重"）

后端 `InteractionOption` 已有 `nextInteraction` 字段，`InteractionPoint` 已有 `prerequisite` 字段，分支链路数据结构已构建。但**前端从未消费这些分支数据**，用户选A和选B看到的后续互动完全一样——互动是假的。

### 1.2 需求分解

| 需求ID | 描述 | 优先级 | 当前状态 |
|--------|------|--------|----------|
| BR-1 | 前端消费 nextInteractionId，选择后跳转到对应分支互动 | P0 | ❌ 未实现 |
| BR-2 | 前端消费 prerequisite，只触发满足前置条件的互动 | P0 | ❌ 未实现 |
| BR-3 | 选择后显示 feedbackText 反馈文本 | P0 | ❌ 未实现 |
| BR-4 | InteractionPoint 添加 branchGroupId 字段 | P0 | ❌ 未实现 |
| BR-5 | DataInitializer 构建至少2条分支链路（每条2级深度） | P0 | ❌ 未实现 |
| BR-6 | 互动视觉升级（模糊背景+弹入动画+倒计时） | P0 | ❌ 未实现 |
| BR-7 | AI剧情生成（续写/分支文本） | P1 | ❌ 未实现 |

### 1.3 数据流分析

```
用户选择Option A
  → Option A.nextInteractionId = 101
  → 记录 currentBranchId = 101
  → 显示 Option A.feedbackText
  → 后续时间点检查：只触发 branchGroupId === currentBranchId 的互动
  → 互动点101在45秒触发 → 显示A分支剧情
```

```
用户选择Option B
  → Option B.nextInteractionId = 201
  → 记录 currentBranchId = 201
  → 显示 Option B.feedbackText
  → 后续时间点检查：只触发 branchGroupId === currentBranchId 的互动
  → 互动点201在45秒触发 → 显示B分支剧情
```

---

## 二、角色属性定义（互动分支属性）

### 2.1 后端模型变更

**InteractionPoint 新增字段：**

```java
@Column(name = "branch_group_id")
private Long branchGroupId;  // null=主线互动，非null=分支专属互动
```

### 2.2 前端类型变更

**InteractionPoint 新增字段：**

```typescript
export interface InteractionPoint {
  id: number;
  timestampMs: number;
  interactionType: InteractionType;
  questionText: string;
  hint: string;
  hintCost: number;
  options?: InteractionOption[];
  infoContent?: InfoContent;
  linkContent?: LinkContent;
  emojiList?: string[];
  branchGroupId?: number | null;  // 新增
  prerequisiteId?: number | null;  // 新增
  prerequisiteChoiceOptionId?: number | null;  // 新增
}
```

### 2.3 分支状态管理

在播放页新增分支追踪状态：

```typescript
const [currentBranchId, setCurrentBranchId] = useState<number | null>(null);
const [branchHistory, setBranchHistory] = useState<Array<{
  interactionId: number;
  optionId: number;
  branchId: number | null;
}>>([]);
const [triggeredInteractions, setTriggeredInteractions] = useState<Set<number>>(new Set());
```

---

## 三、互动逻辑设计

### 3.1 分支过滤逻辑

InteractionOverlay 的互动触发逻辑修改为：

```
对于每个互动点：
1. 检查是否已触发（triggeredInteractions）
2. 检查时间是否匹配（|currentTimeMs - timestampMs| <= TOLERANCE）
3. 检查分支匹配：
   - 如果互动点无 branchGroupId → 主线互动，始终触发
   - 如果互动点有 branchGroupId → 仅当 currentBranchId === branchGroupId 时触发
4. 检查前置条件：
   - 如果互动点有 prerequisiteId → 仅当 prerequisiteId 对应的互动已被触发时才触发
   - 如果互动点有 prerequisiteChoiceOptionId → 仅当用户选择了该option时才触发
```

### 3.2 选择处理逻辑

用户选择选项后：

```
1. 记录选择到 branchHistory
2. 如果 option.nextInteractionId 存在 → setCurrentBranchId(nextInteractionId)
3. 显示 option.feedbackText（3秒后消失）
4. 标记当前互动为已触发
5. 提交答案到后端
```

### 3.3 反馈文本展示

新增 FeedbackToast 组件：
- 在视频播放区域顶部居中显示
- 渐变背景 + 白色文字
- 3秒后自动消失
- 弹入动画效果

### 3.4 互动视觉升级

- 互动弹窗添加 `backdrop-filter: blur(4px)` 半透明遮罩
- 选项弹入动画 `animate-in slide-in-from-bottom`
- 10秒倒计时（超时自动选第一项）
- 选择后选项高亮 + 进度条动画

---

## 四、DataInitializer 分支链路设计

### 4.1 北派寻宝笔记第1集分支链路

```
主线(15秒): "你听到古墓中有异响，怎么办？"
  ├─ Option A: "循声而去" → nextInteractionId=101, feedbackText="你选择了循声而去，黑暗中似乎有什么在等待..."
  │   └─ 分支A(45秒, branchGroupId=101): "前方出现岔路，左边有微光..."
  │       ├─ Option A1: "走向微光" → nextInteractionId=102, feedbackText="微光越来越亮..."
  │       │   └─ 分支A1(75秒, branchGroupId=102): EGG "你发现了一处隐藏的宝藏！" 
  │       └─ Option A2: "原地等待" → feedbackText="你选择谨慎行事..."
  │
  └─ Option B: "先观察再行动" → nextInteractionId=201, feedbackText="你冷静观察，发现了地上的机关痕迹..."
      └─ 分支B(45秒, branchGroupId=201): "机关似乎可以破解..."
          ├─ Option B1: "尝试破解" → nextInteractionId=202, feedbackText="机关被触发了！"
          │   └─ 分支B1(75秒, branchGroupId=202): QUIZ "破解机关需要什么知识？"
          └─ Option B2: "绕道而行" → feedbackText="你选择安全路线..."
```

### 4.2 天下第一纨绔第1集分支链路

```
主线(20秒): "面对挑衅，你如何应对？"
  ├─ Option A: "正面迎战" → nextInteractionId=301, feedbackText="你选择了正面硬刚！"
  │   └─ 分支A(50秒, branchGroupId=301): VOTE "你认为谁会赢？"
  │
  └─ Option B: "以退为进" → nextInteractionId=401, feedbackText="你选择了韬光养晦..."
      └─ 分支B(50秒, branchGroupId=401): INFO "以退为进的策略解析"
```

---

## 五、AI剧情生成设计（P1）

### 5.1 后端新增

- `GeneratedStory` 实体：存储AI生成的剧情
- `AIStoryController`：`/api/ai-story/branch` 和 `/api/ai-story/continue`
- `AIStoryService`：调用大模型API，无Key时返回演示文本

### 5.2 前端新增

- 剧集播放完毕后弹出"续写剧情"卡片
- 预设3个选项 + 自定义输入
- 调用 `/api/ai-story/continue` 生成剧情文本
- 展示生成结果（纯文本，可收藏）

---

## 六、实施优先级

| 批次 | 优先级 | 任务 | 预估时间 |
|------|--------|------|----------|
| 1 | P0 | BR-4: InteractionPoint添加branchGroupId字段 | 30min |
| 1 | P0 | BR-5: DataInitializer构建分支链路数据 | 1.5h |
| 1 | P0 | BR-1+BR-2: 前端消费分支数据+前置条件 | 2h |
| 1 | P0 | BR-3: 选择后显示feedbackText | 30min |
| 1 | P0 | BR-6: 互动视觉升级+倒计时 | 1h |
| 2 | P1 | BR-7: AI剧情生成 | 3h |

**总预估：8.5小时**

---

## 七、质量验证标准

### 7.1 分支逻辑验证

- [ ] 播放北派寻宝笔记第1集，15秒弹出选择
- [ ] 选A → 看到"循声而去"反馈文本 → 45秒弹出A分支互动（而非B分支）
- [ ] 重播，选B → 看到"观察"反馈文本 → 45秒弹出B分支互动（而非A分支）
- [ ] 两个分支体验明显不同
- [ ] 分支A1的EGG彩蛋仅在选A→选A1路径上触发
- [ ] 分支B1的QUIZ仅在选B→选B1路径上触发

### 7.2 前置条件验证

- [ ] 有prerequisite的互动点仅在前置互动被触发后才出现
- [ ] 有prerequisiteChoiceOptionId的互动点仅在用户选择了指定option后才出现

### 7.3 视觉反馈验证

- [ ] 互动弹窗有模糊背景效果
- [ ] 选项有弹入动画
- [ ] 10秒倒计时正常工作
- [ ] 超时后自动选择第一项
- [ ] feedbackText以Toast形式显示，3秒后消失

### 7.4 AI剧情生成验证

- [ ] 无API Key时返回演示文本
- [ ] 有API Key时调用大模型生成剧情
- [ ] 生成结果正确展示
- [ ] 生成记录保存到数据库

### 7.5 构建验证

- [ ] `mvn compile` 成功
- [ ] `next build` 成功
- [ ] 后端单元测试通过
