'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, User } from 'lucide-react';
import { useAuthStore } from '@/lib/auth';

export default function EditProfilePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    // TODO: 调用后端更新API
    setTimeout(() => {
      setSaving(false);
      router.back();
    }, 1000);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/profile" className="text-drama-muted hover:text-drama-text">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-drama-text">编辑资料</h1>
      </div>

      <div className="bg-drama-card rounded-lg p-6 border border-drama-border/50 space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-500/10 flex items-center justify-center">
            <User className="w-8 h-8 text-primary-500" />
          </div>
          <button className="text-sm text-primary-500 hover:text-primary-400">
            更换头像
          </button>
        </div>

        <div>
          <label className="block text-sm text-drama-muted mb-1.5">昵称</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full px-4 py-3 bg-drama-surface border border-drama-border rounded-lg text-drama-text focus:outline-none focus:border-primary-500 transition-colors"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
}
