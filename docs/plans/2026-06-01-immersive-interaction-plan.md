# 沉浸式交互改造实施计划

> 基于 `short-drama-player-沉浸式交互设计文档.md` 制定
> 核心原则：**视频永不停，交互浮上来**

---

## 一、文档结构分析

设计文档共7章，核心改动集中在：

| 章节 | 内容 | 与当前代码的关系 |
|------|------|-----------------|
| 一、问题 | 当前是打断式（暂停→弹窗→恢复） | ✅ 准确，当前 InteractionOverlay 确实会遮罩+倒计时 |
| 二、EMOJI雨 | 明星功能，emoji从底部飘上去 | ❌ 当前 EmojiPicker 只是一个简单选择器，无飘浮/点赞 |
| 三、各类型沉浸式设计 | 7种类型的非打断式交互 | ❌ 当前全部是底部弹出面板+倒计时，无差异化 |
| 四、技术实现 | player.js + interaction.js + CSS | ⚠️ 文档用原生JS，项目用React/Next.js，需适配 |
| 五、后端改动 | emojiReactions/emojiReaction/isSend | ❌ 后端完全缺失这些字段 |
| 六、执行计划 | 3步走 | ⚠️ 需要适配React架构重新规划 |
| 七、Claude Code指令 | 执行指令 | 需要重写为React版指令 |

---

## 二、当前代码 vs 设计文档 差距矩阵

### 2.1 前端差距

| 组件 | 当前状态 | 设计文档要求 | 差距等级 |
|------|---------|-------------|---------|
| **VideoPlayer** | 不感知互动，无 playbackRate 控制 | QUIZ时减速到0.3x，其他不干扰 | 🔴 大 |
| **InteractionOverlay** | 统一遮罩+倒计时，所有类型同质化 | 按类型差异化渲染，无遮罩 | 🔴 大 |
| **EmojiPicker** | 简单选择器，选一个emoji飘上去消失 | emoji雨飘浮+点赞+发送+计数 | 🔴 大 |
| **VotePanel** | 底部面板，选后显示百分比 | 底部半透明浮层，视频继续播放 | 🟡 中 |
| **ChoicePanel** | 底部面板，选后显示反馈 | 右侧滑入卡片，视频继续播放 | 🟡 中 |
| **QuizPanel** | 底部面板，答对emoji雨 | 底部浮层+视频减速0.3x | 🟡 中 |
| **EggPopup** | 底部弹出+emoji雨效果 | 右上角通知+画面闪光+自动收集 | 🔴 大 |
| **InfoPopup** | 底部弹出 | 右上角弹出+5秒收起+小图标保留 | 🟡 中 |
| **LinkCard** | 底部弹出 | 底部浮条+5秒消失 | 🟢 小 |

### 2.2 后端差距

| 模型/字段 | 当前状态 | 设计文档要求 | 差距等级 |
|----------|---------|-------------|---------|
| InteractionPoint.emojiReactions | 不存在 | TEXT字段存JSON `{"🔥":12}` | 🔴 大 |
| InteractionAnswer.emojiReaction | 不存在 | String字段存用户点赞/发送的emoji | 🔴 大 |
| InteractionAnswer.isSend | 不存在 | Boolean区分主动发送vs点赞 | 🟡 中 |
| AnswerRequest.emojiReaction | 不存在 | 请求参数 | 🟡 中 |
| AnswerRequest.isSend | 不存在 | 请求参数 | 🟢 小 |
| InteractionService emoji统计 | 不存在 | 更新emojiReactions JSON | 🔴 大 |

---

## 三、沉浸式体验要素识别

设计文档定义的5个沉浸式核心要素：

1. **视频不暂停** — 除QUIZ减速外，视频始终播放
2. **交互浮层化** — 交互作为"第二层"浮在视频上，可忽略
3. **位置差异化** — VOTE/QUIZ底部、CHOICE右侧、EGG/INFO右上角、LINK底部
4. **时间约束** — 每种类型有不同倒计时，超时自动处理
5. **微交互反馈** — emoji雨飘浮点赞、彩蛋闪光、答题粒子效果

---

## 四、修改内容优先级排序

### P0 — 核心体验（必须实现）

| # | 改动 | 原因 |
|---|------|------|
| 1 | **VideoPlayer 增加 playbackRate 控制** | 这是"视频不暂停"的基础，QUIZ减速0.3x |
| 2 | **InteractionOverlay 移除统一遮罩** | 当前遮罩会遮挡视频，与沉浸式矛盾 |
| 3 | **EmojiPicker → EmojiRain 重写** | 明星功能，设计文档重点描述 |
| 4 | **EggPopup 改为右上角通知+闪光** | 当前是底部弹出，与设计差异最大 |

### P1 — 体验升级（应该实现）

| # | 改动 | 原因 |
|---|------|------|
| 5 | **VotePanel 改为底部半透明浮层** | 视频继续播放，投票浮层化 |
| 6 | **ChoicePanel 改为右侧滑入卡片** | 位置差异化，不遮挡主画面 |
| 7 | **QuizPanel 视频减速联动** | QUIZ是唯一减速的，需与VideoPlayer联动 |
| 8 | **后端 emojiReactions/emojiReaction/isSend** | 支撑emoji雨的点赞/发送数据持久化 |

### P2 — 锦上添花（可选实现）

| # | 改动 | 原因 |
|---|------|------|
| 9 | **InfoPopup 收起后保留小图标** | 可重新打开，提升信息可达性 |
| 10 | **LinkCard 底部浮条样式优化** | 当前已接近设计，微调即可 |
| 11 | **CSS动画性能优化** | will-change、GPU加速等 |

---

## 五、具体修改方案

### 步骤1：VideoPlayer 暴露 playbackRate 控制

**文件**: `frontend/src/components/VideoPlayer.tsx`

**改动**:
- 新增 `onInteractionStart` / `onInteractionEnd` 回调prop
- 新增 `setPlaybackRate(rate: number)` 方法（通过 ref 暴露）
- 保存当前速度到 ref，互动结束后恢复

```typescript
// VideoPlayer 新增 props
interface VideoPlayerProps {
  // ...existing
  playbackRateOverride?: number; // 外部控制播放速度
}

// useEffect 监听 playbackRateOverride
useEffect(() => {
  if (videoRef.current) {
    videoRef.current.playbackRate = playbackRateOverride ?? speed;
  }
}, [playbackRateOverride, speed]);
```

### 步骤2：InteractionOverlay 移除统一遮罩，按类型差异化渲染

**文件**: `frontend/src/components/InteractionOverlay.tsx`

**改动**:
- 移除 `<div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]">` 统一遮罩
- 每种类型独立渲染位置：
  - EMOJI: 全屏飘浮 + 底部按钮栏
  - VOTE/QUIZ: 底部浮层（不遮挡全屏）
  - CHOICE: 右侧滑入卡片
  - EGG: 右上角通知
  - INFO: 右上角信息卡
  - LINK: 底部浮条
- 新增 `onPlaybackRateChange` 回调给 play page

### 步骤3：EmojiPicker → EmojiRain 重写（明星功能）

**文件**: `frontend/src/components/interaction/EmojiPicker.tsx` → 重命名为 `EmojiRain.tsx`

**改动**:
- emoji从底部飘向顶部，正弦曲线轨迹
- 每300ms生成一个飘浮emoji，持续8秒
- 飘过的emoji可点击点赞（放大1.5x+金色闪光+粒子扩散）
- 底部快捷按钮栏（滑入滑出）
- 按钮旁显示各emoji点赞计数
- 10秒后收起按钮栏

```typescript
// 核心状态
const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
const [emojiCounts, setEmojiCounts] = useState<Record<string, number>>({});
const [showBar, setShowBar] = useState(true);

// 生成飘浮emoji
useEffect(() => {
  const interval = setInterval(() => {
    const emoji = emojiList[Math.floor(Math.random() * emojiList.length)];
    setFloatingEmojis(prev => [...prev, {
      id: Date.now() + Math.random(),
      emoji,
      startX: 10 + Math.random() * 80,
      size: 24 + Math.random() * 16,
      duration: 3 + Math.random() * 3,
      sway: (20 + Math.random() * 40) * (Math.random() > 0.5 ? 1 : -1),
    }]);
  }, 300);
  // 8秒后停止生成
  const stopTimer = setTimeout(() => clearInterval(interval), 8000);
  // 10秒后收起按钮
  const barTimer = setTimeout(() => setShowBar(false), 10000);
  return () => { clearInterval(interval); clearTimeout(stopTimer); clearTimeout(barTimer); };
}, []);
```

### 步骤4：EggPopup 改为右上角通知+画面闪光

**文件**: `frontend/src/components/interaction/EggPopup.tsx`

**改动**:
- 移除底部弹出 + emoji雨效果
- 改为右上角弹出通知（3秒自动收起）
- 触发时画面金色闪光（0.5秒 radial-gradient overlay）
- 自动收集，不需要用户操作
- 积分+5飘浮动画

### 步骤5：VotePanel 改为底部半透明浮层

**文件**: `frontend/src/components/interaction/VotePanel.tsx`

**改动**:
- 移除当前 bg-drama-card 全屏面板
- 改为底部半透明浮层 `backdrop-filter: blur(8px); background: rgba(0,0,0,0.6)`
- 视频继续播放（InteractionOverlay 不再暂停）
- 10秒倒计时，超时自动关闭
- 投票后显示结果3秒后收起

### 步骤6：ChoicePanel 改为右侧滑入卡片

**文件**: `frontend/src/components/interaction/ChoicePanel.tsx`

**改动**:
- 移除底部面板
- 改为右侧滑入卡片（宽度180px，半透明）
- 10秒倒计时，超时自动选第一项
- 选择后显示反馈文本2秒后滑出

### 步骤7：QuizPanel 视频减速联动

**文件**: `frontend/src/components/interaction/QuizPanel.tsx` + `play/page.tsx`

**改动**:
- QUIZ触发时通知 VideoPlayer 减速到0.3x
- 答对恢复正常速度 + 积分奖励动画
- 答错恢复正常速度 + 抖动反馈
- 倒计时15秒（比其他类型多5秒）
- 通过 InteractionOverlay 的 `onPlaybackRateChange` 回调实现

### 步骤8：后端 emoji 支持

**文件**:
- `InteractionPoint.java` — 新增 `emojiReactions` 字段
- `InteractionAnswer.java` — 新增 `emojiReaction` + `isSend` 字段
- `AnswerRequest.java` — 新增 `emojiReaction` + `isSend`
- `InteractionService.java` — 处理emoji统计更新

```java
// InteractionPoint.java
@Column(name = "emoji_reactions", columnDefinition = "TEXT")
private String emojiReactions;

// InteractionAnswer.java
@Column(name = "emoji_reaction")
private String emojiReaction;

@Column(name = "is_send")
private Boolean isSend;

// InteractionService.submitAnswer 新增
if (point.getInteractionType() == InteractionPoint.InteractionType.EMOJI
    && request.getEmojiReaction() != null) {
    updateEmojiStats(point, request.getEmojiReaction(), Boolean.TRUE.equals(request.getIsSend()));
}

private void updateEmojiStats(InteractionPoint point, String emoji, boolean isSend) {
    Map<String, Integer> stats = new HashMap<>();
    if (point.getEmojiReactions() != null) {
        try {
            stats = new ObjectMapper().readValue(point.getEmojiReactions(), Map.class);
        } catch (Exception e) { /* ignore */ }
    }
    stats.merge(emoji, 1, Integer::sum);
    try {
        point.setEmojiReactions(new ObjectMapper().writeValueAsString(stats));
        interactionPointRepository.save(point);
    } catch (Exception e) { /* ignore */ }
}
```

### 步骤9：InfoPopup 收起后保留小图标

**文件**: `frontend/src/components/interaction/InfoPopup.tsx`

**改动**:
- 5秒后自动收起，但保留右上角小📖图标
- 点击图标可重新展开
- 15秒后完全移除

### 步骤10：CSS动画优化

**文件**: `frontend/src/app/globals.css` 或组件内 `<style jsx>`

**新增动画**:
- `floatUp` — emoji雨飘浮（正弦曲线）
- `particleBurst` — 点赞粒子扩散
- `eggFlash` — 彩蛋金色闪光
- `slideInRight` — 右侧滑入
- `slideUp` — 底部滑入
- `shake` — 答错抖动
- `pointFloat` — 积分飘浮

---

## 六、进度安排

| 阶段 | 步骤 | 依赖 | 说明 |
|------|------|------|------|
| **阶段1** | 步骤1+2 | 无 | 基础架构：VideoPlayer控制 + Overlay去遮罩 |
| **阶段2** | 步骤3 | 阶段1 | 明星功能：EmojiRain |
| **阶段3** | 步骤4+5+6 | 阶段1 | 位置差异化：EggPopup + VotePanel + ChoicePanel |
| **阶段4** | 步骤7 | 阶段1 | QUIZ减速联动 |
| **阶段5** | 步骤8 | 无（可与前端并行） | 后端emoji支持 |
| **阶段6** | 步骤9+10 | 阶段3 | 锦上添花：InfoPopup + CSS优化 |

---

## 七、质量验收标准

### 功能验收

| # | 验收项 | 验收方法 |
|---|--------|---------|
| 1 | EMOJI/VOTE/CHOICE/INFO/LINK 触发时视频不暂停 | 播放视频到互动时间点，确认视频持续播放 |
| 2 | QUIZ 触发时视频减速到0.3x | 播放到QUIZ时间点，确认视频明显减速 |
| 3 | QUIZ 结束后恢复正常速度 | 答题或超时后，确认视频恢复正常速度 |
| 4 | Emoji雨飘浮效果 | emoji从底部飘向顶部，有弧线轨迹 |
| 5 | Emoji雨点赞反馈 | 点击飘浮emoji，放大+金色闪光+粒子扩散 |
| 6 | Emoji雨发送功能 | 点击底部按钮，自己的emoji也飘上去 |
| 7 | EggPopup右上角通知+闪光 | 彩蛋触发时画面闪光，右上角弹出通知 |
| 8 | VotePanel底部浮层不遮挡 | 投票浮层在底部，视频画面可见 |
| 9 | ChoicePanel右侧滑入 | 选项从右侧滑入，不遮挡主画面 |
| 10 | 各类型倒计时正确 | EMOJI/VOTE/CHOICE 10s, QUIZ 15s, EGG 3s, INFO 5s, LINK 5s |

### 性能验收

| # | 验收项 | 标准 |
|---|--------|------|
| 1 | Emoji雨不卡顿 | 60fps，无掉帧 |
| 2 | 互动浮层不影响视频解码 | CPU占用增加 < 5% |
| 3 | CSS动画使用GPU加速 | will-change + transform 动画 |

### 兼容性验收

| # | 验收项 | 标准 |
|---|--------|------|
| 1 | 安卓模拟器浏览器正常 | Chrome/WebView 兼容 |
| 2 | 后端H2模式正常启动 | 无JPA/SQL错误 |
| 3 | 前端 `next build` 通过 | 无TypeScript/编译错误 |
| 4 | 后端 `mvn compile` 通过 | 无编译错误 |

---

## 八、风险与注意事项

1. **React适配** — 设计文档用原生JS（document.createElement），需全部改为React组件+状态管理
2. **VideoPlayer ref** — playbackRate控制需要通过useImperativeHandle暴露给父组件
3. **Emoji雨性能** — 大量DOM元素飘浮可能影响性能，考虑使用CSS animation而非JS动画
4. **移动端适配** — 右侧滑入卡片在窄屏上可能遮挡过多画面，需响应式处理
5. **后端emojiReactions并发** — 多用户同时点赞可能产生竞态，需考虑乐观锁或原子更新
