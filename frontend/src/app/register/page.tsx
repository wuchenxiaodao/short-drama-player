'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { register, getMe } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth';
import { ApiError } from '@/lib/api-client';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth, setUser } = useAuthStore();
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({ username: false, nickname: false, password: false, confirmPassword: false });
  const [showWelcome, setShowWelcome] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!username.trim() || !nickname.trim() || !password.trim()) {
      setError('请填写所有必填项');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (password.length < 6) {
      setError('密码长度至少6位');
      return;
    }

    setLoading(true);
    try {
      const data = await register(username.trim(), password, nickname.trim());
      setAuth(data.token, data.userId || data.user?.id);
      const user = await getMe();
      setUser(user);
      setShowWelcome(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('注册失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-drama-card rounded-lg p-8 shadow-xl border border-drama-border/50">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-500">
              短剧TV
            </h1>
            <p className="text-drama-muted text-sm mt-2">创建新账号</p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-drama-muted mb-1.5">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, username: true }))}
                placeholder="请输入用户名"
                className={`w-full px-4 py-3 bg-drama-surface border ${touched.username && !username.trim() ? 'border-red-500 focus:border-red-500' : 'border-drama-border focus:border-primary-500'} rounded-lg text-drama-text placeholder:text-drama-muted focus:outline-none transition-colors`}
              />
              {touched.username && !username.trim() && <p className="text-xs text-red-400 mt-1">请输入用户名</p>}
            </div>

            <div>
              <label className="block text-sm text-drama-muted mb-1.5">昵称</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="请输入昵称"
                className="w-full px-4 py-3 bg-drama-surface border border-drama-border rounded-lg text-drama-text placeholder:text-drama-muted focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-drama-muted mb-1.5">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  placeholder="请输入密码（至少6位）"
                  className={`w-full px-4 py-3 pr-12 bg-drama-surface border ${touched.password && password.length < 6 ? 'border-red-500 focus:border-red-500' : 'border-drama-border focus:border-primary-500'} rounded-lg text-drama-text placeholder:text-drama-muted focus:outline-none transition-colors`}
                />
                {touched.password && password.length < 6 && <p className="text-xs text-red-400 mt-1">密码长度至少6位</p>}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-drama-muted hover:text-drama-text transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-drama-muted mb-1.5">确认密码</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
                  placeholder="请再次输入密码"
                  className={`w-full px-4 py-3 pr-12 bg-drama-surface border ${touched.confirmPassword && confirmPassword !== password ? 'border-red-500 focus:border-red-500' : 'border-drama-border focus:border-primary-500'} rounded-lg text-drama-text placeholder:text-drama-muted focus:outline-none transition-colors`}
                />
                {touched.confirmPassword && confirmPassword !== password && <p className="text-xs text-red-400 mt-1">两次输入的密码不一致</p>}
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-drama-muted hover:text-drama-text transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  注册
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-drama-muted text-sm">已有账号？</span>
            <Link
              href="/login"
              className="text-primary-500 text-sm hover:text-primary-400 ml-1 transition-colors"
            >
              去登录
            </Link>
          </div>
        </div>
      </div>

      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-drama-card rounded-xl p-6 mx-4 max-w-sm w-full border border-drama-border/50 shadow-xl text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-lg font-medium text-drama-text mb-2">注册成功！</h3>
            <p className="text-sm text-drama-muted mb-5">欢迎加入短剧TV，开始你的互动追剧之旅</p>
            <div className="space-y-2">
              <Link href="/" className="block w-full py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                onClick={() => setShowWelcome(false)}>
                开始浏览
              </Link>
              <Link href="/eggs" className="block w-full py-2.5 bg-drama-surface text-drama-text rounded-lg hover:bg-drama-border transition-colors"
                onClick={() => setShowWelcome(false)}>
                查看彩蛋图鉴
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
