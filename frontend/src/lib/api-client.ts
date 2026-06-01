import type {
  ApiResponse,
  Drama,
  Episode,
  InteractionAnswer,
  InteractionStats,
  Comment,
  Danmaku,
  User,
  WatchProgress,
  Favorite,
  Rating,
  UserEgg,
  Stream,
} from './types';
import { useAuthStore } from './auth';

function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (envUrl) return envUrl;
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:8080';
    }
    return `http://${host}:8080`;
  }
  return 'http://localhost:8080';
}

export function resolveUrl(url: string | undefined | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${getApiBaseUrl()}${url.startsWith('/') ? '' : '/'}${url}`;
}

class ApiError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.name = 'ApiError';
  }
}

function getToken(): string | null {
  return useAuthStore.getState().token;
}

function handleUnauthorized(): void {
  useAuthStore.getState().logout();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    handleUnauthorized();
    throw new ApiError(401, '未授权，请重新登录');
  }

  if (res.status === 403) {
    throw new ApiError(403, '没有权限访问');
  }

  const json: ApiResponse<T> = await res.json();

  if (json.code !== 0 && json.code !== 200) {
    throw new ApiError(json.code, json.message);
  }

  return json.data;
}

async function apiGet<T>(path: string): Promise<T> {
  return request<T>('GET', path);
}

async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>('POST', path, body);
}

async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return request<T>('PUT', path, body);
}

async function apiDelete<T>(path: string): Promise<T> {
  return request<T>('DELETE', path);
}

export { ApiError, apiGet, apiPost, apiPut, apiDelete };

export async function getRecommendDramas(page = 0, size = 10) {
  return apiGet<any>(`/api/drama/recommend?page=${page}&size=${size}`);
}

export async function getHotDramas(page = 0, size = 10) {
  return apiGet<any>(`/api/drama/hot?page=${page}&size=${size}`);
}

export async function getNewDramas(page = 0, size = 10) {
  return apiGet<any>(`/api/drama/new?page=${page}&size=${size}`);
}

export async function searchDramas(keyword: string, page = 0, size = 20) {
  return apiGet<any>(`/api/drama/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`);
}

export async function getDramaDetail(id: number) {
  return apiGet<any>(`/api/drama/${id}/detail`);
}

export async function getEpisodePlayInfo(episodeId: number) {
  return apiGet<any>(`/api/episode/${episodeId}/playinfo`);
}

export async function getEpisodeStreams(episodeId: number) {
  return apiGet<any>(`/api/episode/${episodeId}/streams`);
}

export async function getEpisodeInteractions(episodeId: number) {
  return apiGet<any>(`/api/interaction/episode/${episodeId}`);
}

export async function submitAnswer(interactionId: number, choiceId: number) {
  return apiPost<any>('/api/interaction/answer', { interactionId, choiceId });
}

export async function getInteractionStats(interactionId: number) {
  return apiGet<any>(`/api/interaction/${interactionId}/stats`);
}

export async function getInteractionOverview() {
  return apiGet<any>('/api/interaction/stats/overview');
}

export async function getDramaInteractionStats(dramaId: number) {
  return apiGet<any>(`/api/interaction/stats/drama/${dramaId}`);
}

export async function sendEmoji(episodeId: number, emoji: string, positionMs: number) {
  return apiPost<any>('/api/interaction/emoji', { episodeId, emoji, positionMs });
}

export async function getComments(dramaId: number, page = 0, size = 20, sort = 'hot') {
  return apiGet<any>(`/api/comment/drama/${dramaId}?page=${page}&size=${size}&sort=${sort}`);
}

export async function postComment(dramaId: number, content: string, parentId?: number) {
  return apiPost<any>('/api/comment', { dramaId, content, parentCommentId: parentId });
}

export async function toggleCommentLike(commentId: number) {
  return apiPost<any>(`/api/comment/${commentId}/like`);
}

export async function getDanmaku(episodeId: number) {
  return apiGet<any>(`/api/danmaku/episode/${episodeId}`);
}

export async function sendDanmaku(episodeId: number, content: string, positionMs: number) {
  return apiPost<any>('/api/danmaku/send', { episodeId, content, positionMs });
}

export async function toggleFavorite(dramaId: number) {
  return apiPost<any>(`/api/favorite/${dramaId}`);
}

export async function checkFavorite(dramaId: number) {
  return apiGet<any>(`/api/favorite/check/${dramaId}`);
}

export async function getFavorites() {
  return apiGet<any>('/api/favorite/list');
}

export async function submitRating(dramaId: number, score: number) {
  return apiPost<any>('/api/rating/submit', { dramaId, score });
}

export async function getUserRating(dramaId: number) {
  return apiGet<any>(`/api/rating/user?dramaId=${dramaId}`);
}

export async function getRatingStats(dramaId: number) {
  return apiGet<any>(`/api/rating/stats?dramaId=${dramaId}`);
}

export async function reportProgress(episodeId: number, positionMs: number, completed = false) {
  return apiPost<any>('/api/progress/report', { episodeId, positionMs, completed });
}

export async function login(username: string, password: string) {
  return apiPost<any>('/api/auth/login', { username, password });
}

export async function register(username: string, password: string, nickname: string) {
  return apiPost<any>('/api/auth/register', { username, password, nickname });
}

export async function getMe() {
  return apiGet<any>('/api/auth/me');
}

export async function getEggCollection() {
  return apiGet<any>('/api/eggs/collection');
}

export async function getPointsBalance() {
  return apiGet<any>('/api/points/balance');
}

export async function buyHint(interactionId: number) {
  return apiPost<any>('/api/points/hint', { interactionId });
}

export async function getCategories() {
  return apiGet<any>('/api/drama/categories');
}

export async function getDramasByCategory(category: string, page = 0, size = 10) {
  return apiGet<any>(`/api/drama/category/${encodeURIComponent(category)}?page=${page}&size=${size}`);
}
