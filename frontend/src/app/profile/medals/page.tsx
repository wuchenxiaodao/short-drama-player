'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth';
import { getMedals } from '@/lib/api-client';

export default function MedalsPage() {
  const user = useAuthStore((s) => s.user);
  const [medals, setMedals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      getMedals(user.id)
        .then((data) => setMedals(Array.isArray(data) ? data : []))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-drama-surface rounded w-32" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-drama-card rounded-xl p-4">
                <div className="w-10 h-10 bg-drama-surface rounded-full mx-auto mb-2" />
                <div className="h-4 bg-drama-surface rounded w-16 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-drama-text mb-6">我的勋章</h1>
      {medals.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🏅</div>
          <p className="text-drama-muted">还没有获得勋章</p>
          <p className="text-sm text-drama-muted mt-2">观看短剧、参与互动即可解锁勋章</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {medals.map((medal) => (
            <div key={medal.id || medal.code} className="bg-drama-card rounded-xl p-4 text-center hover:bg-drama-card/80 transition-colors">
              <div className="text-4xl mb-2">{medal.icon || '🏅'}</div>
              <h3 className="text-sm font-medium text-drama-text">{medal.name}</h3>
              {medal.description && (
                <p className="text-xs text-drama-muted mt-1">{medal.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
