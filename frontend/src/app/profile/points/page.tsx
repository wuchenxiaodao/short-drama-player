'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth';
import { getPointsBalance, getPointsHistory } from '@/lib/api-client';

export default function PointsPage() {
  const user = useAuthStore((s) => s.user);
  const [balance, setBalance] = useState<number>(0);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      Promise.all([
        getPointsBalance().catch(() => 0),
        getPointsHistory().catch(() => []),
      ]).then(([bal, hist]) => {
        setBalance(typeof bal === 'number' ? bal : 0);
        setHistory(Array.isArray(hist) ? hist : Array.isArray(hist?.content) ? hist.content : []);
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const earnWays = [
    { icon: '📺', label: '观看短剧', points: '+2/集' },
    { icon: '🎯', label: '参与互动', points: '+5~10/次' },
    { icon: '🥚', label: '发现彩蛋', points: '+5/个' },
    { icon: '💬', label: '发表评论', points: '+3/条' },
  ];

  const spendWays = [
    { icon: '💡', label: '购买提示', points: '-10/次' },
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-drama-surface rounded w-32" />
          <div className="h-24 bg-drama-surface rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-xl font-bold text-drama-text">我的积分</h1>

      {/* 积分余额 */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl p-6 text-center">
        <p className="text-primary-100 text-sm">当前积分</p>
        <p className="text-4xl font-bold text-white mt-1">{balance}</p>
      </div>

      {/* 获取途径 */}
      <div>
        <h2 className="text-base font-medium text-drama-text mb-3">如何获取积分</h2>
        <div className="grid grid-cols-2 gap-3">
          {earnWays.map((way) => (
            <div key={way.label} className="bg-drama-card rounded-lg p-3 flex items-center gap-3">
              <span className="text-2xl">{way.icon}</span>
              <div>
                <p className="text-sm text-drama-text">{way.label}</p>
                <p className="text-xs text-primary-400">{way.points}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 消费途径 */}
      <div>
        <h2 className="text-base font-medium text-drama-text mb-3">积分用途</h2>
        <div className="grid grid-cols-2 gap-3">
          {spendWays.map((way) => (
            <div key={way.label} className="bg-drama-card rounded-lg p-3 flex items-center gap-3">
              <span className="text-2xl">{way.icon}</span>
              <div>
                <p className="text-sm text-drama-text">{way.label}</p>
                <p className="text-xs text-drama-muted">{way.points}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 积分历史 */}
      {history.length > 0 && (
        <div>
          <h2 className="text-base font-medium text-drama-text mb-3">积分记录</h2>
          <div className="bg-drama-card rounded-xl divide-y divide-drama-border">
            {history.map((item, i) => (
              <div key={i} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-drama-text">{item.description || item.reason || '积分变动'}</p>
                  <p className="text-xs text-drama-muted">{item.createdAt || item.time || ''}</p>
                </div>
                <span className={`text-sm font-medium ${(item.amount || item.points || 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {(item.amount || item.points || 0) > 0 ? '+' : ''}{item.amount || item.points || 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
