// Types
export interface SentimentMatch {
  emoji: string;
  weight: number;       // 0-1, how strongly the danmaku matches this emoji
  sentiment: string;    // dimension name
}

export interface DanmakuAnalysis {
  danmakuId: number;
  content: string;
  matches: SentimentMatch[];
  topEmoji: string | null;  // the best matching emoji
}

// Sentiment-to-emoji mapping with Chinese keywords
const SENTIMENT_MAP = {
  surprise: {
    emoji: '😱',
    keywords: ['卧槽', '天哪', '我的天', '震惊', '不敢相信', '什么', '啊这', '不会吧', '太离谱', '离谱', '惊了', '惊呆', '没想到', '意外', '吓死', '吓人', '太突然', 'omg', 'wow'],
  },
  funny: {
    emoji: '😂',
    keywords: ['哈哈', '笑死', '搞笑', '逗', '乐死', '太逗了', '笑喷', '哈哈哈哈', '笑哭', '绝了', '沙雕', '好笑', '笑出声', 'hhhh', '2333', '乐了', '绷不住', '笑不活了', 'lol'],
  },
  love: {
    emoji: '❤️',
    keywords: ['爱了', '喜欢', '好看', '太好了', '甜', '嗑', 'CP', '绝美', '美', '帅', '可爱', '心动', '表白', '好甜', '好爱', '太甜了', '好帅', '好美', '宝藏', '神仙'],
  },
  fear: {
    emoji: '👀',
    keywords: ['害怕', '恐怖', '吓人', '阴森', '诡异', '胆小', '不敢看', '可怕', '瘆人', '细思极恐', '背后发凉', '头皮发麻', '紧张', '悬疑', '惊悚'],
  },
  applause: {
    emoji: '👏',
    keywords: ['厉害', '牛', '强', '棒', '优秀', '精彩', '绝了', '太棒了', '牛逼', '佩服', '瑞思拜', 'respect', '赞', '点赞', '太强了', '666', '大佬', '高手'],
  },
  sad: {
    emoji: '😭',
    keywords: ['哭', '泪', '伤心', '难过', '感动', '心疼', '泪目', '哭了', '太惨了', '可怜', '意难平', '破防', 'emo', '难受', '悲伤', '惋惜', '遗憾'],
  },
};

const DEFAULT_EMOJIS = ['🔥', '😂', '❤️', '😱', '👏'];

// Position decay factor: earlier matches get slightly higher weight
const POSITION_DECAY = 0.95;
// Weight normalization factor
const MAX_WEIGHT_PER_KEYWORD = 0.3;

class DanmakuSentimentAnalyzer {
  private cache: Map<number, DanmakuAnalysis[]> = new Map();

  /**
   * Analyze a single danmaku's sentiment and return matched emojis with weights.
   */
  analyzeContent(content: string): SentimentMatch[] {
    if (!content || !content.trim()) {
      return [];
    }

    const lowerContent = content.toLowerCase().trim();
    const results: SentimentMatch[] = [];

    for (const [sentiment, config] of Object.entries(SENTIMENT_MAP)) {
      let totalWeight = 0;
      let matchCount = 0;

      for (let i = 0; i < config.keywords.length; i++) {
        const keyword = config.keywords[i].toLowerCase();
        const index = lowerContent.indexOf(keyword);

        if (index !== -1) {
          matchCount++;
          // Position bonus: earlier in text = higher weight (capped by decay)
          const positionBonus = Math.pow(POSITION_DECAY, index / content.length);
          totalWeight += MAX_WEIGHT_PER_KEYWORD * positionBonus;
        }
      }

      if (matchCount > 0) {
        // Normalize weight to 0-1 range, cap at 1.0
        const normalizedWeight = Math.min(1, totalWeight);
        results.push({
          emoji: config.emoji,
          weight: parseFloat(normalizedWeight.toFixed(4)),
          sentiment,
        });
      }
    }

    // Sort by weight descending
    results.sort((a, b) => b.weight - a.weight);
    return results;
  }

  /**
   * Analyze a batch of danmaku for an episode with caching support.
   */
  analyzeEpisode(danmakuList: { id: number; content: string }[]): DanmakuAnalysis[] {
    if (!danmakuList || danmakuList.length === 0) {
      return [];
    }

    // Use first danmaku id as episode cache key (or could use a dedicated episodeId)
    const cacheKey = danmakuList[0]?.id ?? 0;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && cached.length === danmakuList.length) {
      return cached;
    }

    const results: DanmakuAnalysis[] = danmakuList.map((dm) => {
      const matches = this.analyzeContent(dm.content);
      return {
        danmakuId: dm.id,
        content: dm.content,
        matches,
        topEmoji: matches.length > 0 ? matches[0].emoji : null,
      };
    });

    // Cache the results
    this.cache.set(cacheKey, results);

    return results;
  }

  /**
   * Get the best emoji for a given time window of danmaku.
   * Aggregates all sentiment matches in the window and returns the dominant emoji.
   */
  getEmojiForTimeWindow(danmakuInWindow: { id: number; content: string }[]): string {
    if (!danmakuInWindow || danmakuInWindow.length === 0) {
      return DEFAULT_EMOJIS[Math.floor(Math.random() * DEFAULT_EMOJIS.length)];
    }

    // Aggregate weights across all danmaku in window
    const aggregatedWeights: Map<string, number> = new Map();
    let hasStrongMatch = false;

    for (const dm of danmakuInWindow) {
      const matches = this.analyzeContent(dm.content);
      for (const match of matches) {
        const current = aggregatedWeights.get(match.emoji) ?? 0;
        aggregatedWeights.set(match.emoji, current + match.weight);
        if (match.weight >= 0.3) {
          hasStrongMatch = true;
        }
      }
    }

    // If no strong matches found, fallback to random default emoji
    if (aggregatedWeights.size === 0 || !hasStrongMatch) {
      return DEFAULT_EMOJIS[Math.floor(Math.random() * DEFAULT_EMOJIS.length)];
    }

    // Find emoji with highest aggregate weight
    let bestEmoji = DEFAULT_EMOJIS[0];
    let maxWeight = 0;

    aggregatedWeights.forEach((weight, emoji) => {
      if (weight > maxWeight) {
        maxWeight = weight;
        bestEmoji = emoji;
      }
    });

    return bestEmoji;
  }

  /**
   * Clear cache for a specific episode or all caches.
   */
  clearCache(episodeId?: number): void {
    if (episodeId !== undefined) {
      this.cache.delete(episodeId);
    } else {
      this.cache.clear();
    }
  }
}

export const sentimentAnalyzer = new DanmakuSentimentAnalyzer();
