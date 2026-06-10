'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, TrendingUp } from 'lucide-react';
import { searchDramas, getHotDramas, resolveUrl } from '@/lib/api-client';
import type { Drama } from '@/lib/types';
import DramaGrid from '@/components/DramaGrid';
import Link from 'next/link';

const HOT_SEARCHES = ['北派寻宝', '天下第一', '十八岁太奶奶'];
const MAX_HISTORY = 15;
const STORAGE_KEY = 'search-history';

function getSearchHistory(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveSearchHistory(keyword: string) {
  const history = getSearchHistory().filter((h) => h !== keyword);
  history.unshift(keyword);
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export default function SearchPage() {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [hotSearches, setHotSearches] = useState<string[]>(HOT_SEARCHES);
  const [suggestions, setSuggestions] = useState<Drama[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setHistory(getSearchHistory());
    inputRef.current?.focus();
    getHotDramas(0, 8)
      .then((data: any) => {
        const list = Array.isArray(data) ? data : (data?.content || []);
        if (list.length > 0) {
          const titles = list.map((d: any) => d?.title).filter(Boolean) as string[];
          if (titles.length > 0) setHotSearches(titles);
        }
      })
      .catch(() => {});
  }, []);

  const doSearch = useCallback(async (kw: string) => {
    if (!kw.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchDramas(kw.trim());
      setResults(Array.isArray(data) ? data : (data?.content || []));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!keyword.trim()) {
      setResults([]);
      setSearched(false);
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    // 搜索建议（200ms 防抖）
    const suggestTimer = setTimeout(async () => {
      try {
        const data = await searchDramas(keyword.trim());
        const list = Array.isArray(data) ? data : (data?.content || []);
        setSuggestions(list.slice(0, 5));
        setShowSuggestions(true);
      } catch {}
    }, 200);
    // 完整搜索（300ms 防抖）
    timerRef.current = setTimeout(() => {
      doSearch(keyword);
      setShowSuggestions(false);
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      clearTimeout(suggestTimer);
    };
  }, [keyword, doSearch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-search-box]')) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  function handleSearch(kw: string) {
    const trimmed = kw.trim();
    if (!trimmed) return;
    setKeyword(trimmed);
    saveSearchHistory(trimmed);
    setHistory(getSearchHistory());
    doSearch(trimmed);
  }

  function handleClearHistory() {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  }

  function handleRemoveHistory(item: string) {
    const updated = getSearchHistory().filter((h) => h !== item);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setHistory(updated);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex gap-3">
        <div className="flex-1 relative" data-search-box>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-drama-muted" />
          <input
            ref={inputRef}
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(keyword)}
            onFocus={() => { if (suggestions.length > 0 && keyword.trim()) setShowSuggestions(true); }}
            placeholder="搜索短剧名称..."
            className="w-full pl-10 pr-4 py-3 bg-drama-surface border border-drama-border rounded-full text-drama-text placeholder:text-drama-muted focus:outline-none focus:border-primary-500 transition-colors"
          />
          {keyword && (
            <button
              onClick={() => setKeyword('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-drama-muted hover:text-drama-text"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {showSuggestions && suggestions.length > 0 && !searched && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-drama-card border border-drama-border rounded-lg shadow-xl z-20 overflow-hidden">
              {suggestions.map((d) => (
                <Link
                  key={d.id}
                  href={`/drama/${d.id}`}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-drama-surface transition-colors"
                  onClick={() => { setShowSuggestions(false); saveSearchHistory(d.title); }}
                >
                  <img src={resolveUrl(d.coverUrl)} alt="" className="w-10 h-7 rounded object-cover" loading="lazy" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-drama-text truncate">{d.title}</p>
                    <p className="text-xs text-drama-muted">{d.category} · {d.totalEpisodes}集</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => handleSearch(keyword)}
          className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-full font-medium transition-colors"
        >
          搜索
        </button>
      </div>

      {!searched && (
        <>
          {history.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-drama-text">搜索历史</h3>
                <button
                  onClick={handleClearHistory}
                  className="text-xs text-drama-muted hover:text-primary-500 transition-colors"
                >
                  清除
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {history.map((item) => (
                  <span
                    key={item}
                    className="group inline-flex items-center gap-1 px-3 py-1.5 bg-drama-surface rounded-full text-sm text-drama-muted hover:text-drama-text hover:bg-drama-surface cursor-pointer transition-colors"
                    onClick={() => handleSearch(item)}
                  >
                    {item}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveHistory(item);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-primary-500" />
              <h3 className="text-sm font-medium text-drama-text">热门搜索</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {hotSearches.map((item) => (
                <span
                  key={item}
                  onClick={() => handleSearch(item)}
                  className="px-3 py-1.5 bg-primary-500/10 rounded-full text-sm text-primary-500 hover:bg-primary-500/20 cursor-pointer transition-colors"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      {searched && (
        <div>
          {results.length === 0 && !loading ? (
            <div className="text-center py-20">
              <Search className="w-12 h-12 text-drama-muted mx-auto mb-4" />
              <p className="text-drama-muted">未找到相关短剧</p>
            </div>
          ) : (
            <DramaGrid dramas={results} loading={loading} highlightKeyword={keyword} />
          )}
        </div>
      )}

      {!searched && !keyword && (
        <div className="text-center py-20">
          <Search className="w-12 h-12 text-drama-muted mx-auto mb-4" />
          <p className="text-drama-muted">输入关键词搜索短剧</p>
        </div>
      )}
    </div>
  );
}
