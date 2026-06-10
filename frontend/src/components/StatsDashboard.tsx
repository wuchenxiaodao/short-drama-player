'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { apiGet } from '@/lib/api-client';
import type { InteractionStats, InteractionType } from '@/lib/types';

interface StatsDashboardProps {
  dramaId?: number;
}

const TYPE_COLORS: Record<InteractionType, string> = {
  QUIZ: '#8b5cf6',
  VOTE: '#3b82f6',
  CHOICE: '#ec4899',
  EGG: '#f59e0b',
  INFO: '#10b981',
  LINK: '#06b6d4',
  EMOJI: '#f97316',
};

const TYPE_LABELS: Record<InteractionType, string> = {
  QUIZ: '问答',
  VOTE: '投票',
  CHOICE: '选择',
  EGG: '彩蛋',
  INFO: '信息',
  LINK: '链接',
  EMOJI: '表情',
};

const ALL_TYPES: InteractionType[] = ['QUIZ', 'VOTE', 'CHOICE', 'EGG', 'INFO', 'LINK', 'EMOJI'];

function SkeletonCard() {
  return (
    <div className="bg-drama-card rounded-xl p-5 border border-drama-border/50 animate-pulse">
      <div className="h-4 bg-drama-surface rounded w-20 mb-3" />
      <div className="h-8 bg-drama-surface rounded w-16 mb-2" />
      <div className="h-3 bg-drama-surface rounded w-24" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="bg-drama-card rounded-xl p-5 border border-drama-border/50 animate-pulse">
      <div className="h-4 bg-drama-surface rounded w-24 mb-4" />
      <div className="h-48 bg-drama-surface rounded" />
    </div>
  );
}

export default function StatsDashboard({ dramaId }: StatsDashboardProps) {
  const [stats, setStats] = useState<InteractionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const path = dramaId
          ? `/api/interaction/stats/drama/${dramaId}`
          : '/api/interaction/stats/overview';
        const data = await apiGet<InteractionStats>(path);
        setStats(data);
      } catch {
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [dramaId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SkeletonChart />
          <SkeletonChart />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-10 h-10 text-drama-muted mx-auto mb-3" />
        <p className="text-drama-muted">暂无统计数据</p>
      </div>
    );
  }

  const trendUp = stats.totalInteractions > 0;
  const participationPercent = Math.round(stats.participationRate * 100);

  const topInteractionsData = stats.topInteractions.slice(0, 5).map((item, index) => ({
    name: `互动${item.interactionId}`,
    count: item.count,
    fill: ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'][index],
  }));

  const typeDistributionData = ALL_TYPES.map((type) => ({
    name: TYPE_LABELS[type],
    value: stats.typeDistribution[type] || 0,
    color: TYPE_COLORS[type],
  })).filter((d) => d.value > 0);

  const ringData = [
    { name: '参与', value: participationPercent },
    { name: '未参与', value: 100 - participationPercent },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-drama-card rounded-xl p-5 border border-drama-border/50">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-primary-400" />
            <span className="text-xs text-drama-muted">总互动次数</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-drama-text">
              {stats.totalInteractions.toLocaleString()}
            </span>
            {trendUp ? (
              <TrendingUp className="w-4 h-4 text-green-400 mb-1" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400 mb-1" />
            )}
          </div>
        </div>

        <div className="bg-drama-card rounded-xl p-5 border border-drama-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-primary-400" />
            <span className="text-xs text-drama-muted">参与率</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-drama-text">{participationPercent}%</span>
            <div className="w-12 h-12">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ringData}
                    dataKey="value"
                    innerRadius={14}
                    outerRadius={20}
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                  >
                    <Cell fill="#ec4899" />
                    <Cell fill="#252540" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-drama-card rounded-xl p-5 border border-drama-border/50">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-primary-400" />
            <span className="text-xs text-drama-muted">热门互动TOP5</span>
          </div>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topInteractionsData}
                layout="vertical"
                margin={{ left: 0, right: 8, top: 0, bottom: 0 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={48}
                  tick={{ fill: '#8888aa', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a2e',
                    border: '1px solid #333355',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#e0e0f0',
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {topInteractionsData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-drama-card rounded-xl p-5 border border-drama-border/50">
          <div className="flex items-center gap-2 mb-2">
            <PieChartIcon className="w-4 h-4 text-primary-400" />
            <span className="text-xs text-drama-muted">类型分布</span>
          </div>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeDistributionData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  outerRadius={40}
                  stroke="none"
                >
                  {typeDistributionData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a2e',
                    border: '1px solid #333355',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#e0e0f0',
                  }}
                  formatter={(value: number, name: string) => [value, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
            {typeDistributionData.map((d) => (
              <span key={d.name} className="flex items-center gap-1 text-[10px] text-drama-muted">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: d.color }}
                />
                {d.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
