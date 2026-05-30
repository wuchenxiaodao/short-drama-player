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

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

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

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    handleUnauthorized();
    throw new ApiError(401, '未授权，请重新登录');
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

export async function getRecommendDramas(): Promise<Drama[]> {
  return apiGet<Drama[]>('/api/dramas/recommend');
}

export async function getHotDramas(): Promise<Drama[]> {
  return apiGet<Drama[]>('/api/dramas/hot');
}

export async function getNewDramas(): Promise<Drama[]> {
  return apiGet<Drama[]>('/api/dramas/new');
}

export async function searchDramas(keyword: string): Promise<Drama[]> {
  return apiGet<Drama[]>(`/api/dramas/search?keyword=${encodeURIComponent(keyword)}`);
}

export async function getDramaDetail(id: number): Promise<Drama> {
  return apiGet<Drama>(`/api/dramas/${id}`);
}

export async function getEpisodePlayInfo(
  dramaId: number,
  episodeNumber: number
): Promise<Episode> {
  return apiGet<Episode>(`/api/dramas/${dramaId}/episodes/${episodeNumber}`);
}

export async function getEpisodeStreams(
  dramaId: number,
  episodeNumber: number
): Promise<Stream[]> {
  return apiGet<Stream[]>(
    `/api/dramas/${dramaId}/episodes/${episodeNumber}/streams`
  );
}

export async function submitAnswer(
  interactionId: number,
  selectedOptionId: number
): Promise<InteractionAnswer> {
  return apiPost<InteractionAnswer>(`/api/interactions/${interactionId}/answer`, {
    selectedOptionId,
  });
}

export async function getInteractionStats(
  dramaId: number
): Promise<InteractionStats> {
  return apiGet<InteractionStats>(`/api/interactions/stats?dramaId=${dramaId}`);
}

export async function getInteractionOverview(
  dramaId: number,
  episodeNumber: number
): Promise<InteractionStats> {
  return apiGet<InteractionStats>(
    `/api/interactions/overview?dramaId=${dramaId}&episodeNumber=${episodeNumber}`
  );
}

export async function getDramaInteractionStats(
  dramaId: number
): Promise<InteractionStats> {
  return apiGet<InteractionStats>(`/api/dramas/${dramaId}/interactions/stats`);
}

export async function sendEmoji(
  interactionId: number,
  emoji: string
): Promise<void> {
  return apiPost<void>(`/api/interactions/${interactionId}/emoji`, { emoji });
}

export async function getComments(
  dramaId: number,
  page = 1,
  size = 20
): Promise<Comment[]> {
  return apiGet<Comment[]>(
    `/api/dramas/${dramaId}/comments?page=${page}&size=${size}`
  );
}

export async function postComment(
  dramaId: number,
  content: string,
  parentId?: number
): Promise<Comment> {
  return apiPost<Comment>(`/api/dramas/${dramaId}/comments`, {
    content,
    parentId,
  });
}

export async function toggleCommentLike(
  commentId: number
): Promise<void> {
  return apiPost<void>(`/api/comments/${commentId}/like`);
}

export async function getDanmaku(
  episodeId: number
): Promise<Danmaku[]> {
  return apiGet<Danmaku[]>(`/api/episodes/${episodeId}/danmaku`);
}

export async function sendDanmaku(
  episodeId: number,
  content: string,
  positionMs: number
): Promise<Danmaku> {
  return apiPost<Danmaku>(`/api/episodes/${episodeId}/danmaku`, {
    content,
    positionMs,
  });
}

export async function toggleFavorite(dramaId: number): Promise<void> {
  return apiPost<void>(`/api/dramas/${dramaId}/favorite`);
}

export async function checkFavorite(dramaId: number): Promise<boolean> {
  return apiGet<boolean>(`/api/dramas/${dramaId}/favorite/check`);
}

export async function getFavorites(): Promise<Favorite[]> {
  return apiGet<Favorite[]>('/api/favorites');
}

export async function submitRating(
  dramaId: number,
  score: number
): Promise<Rating> {
  return apiPost<Rating>(`/api/dramas/${dramaId}/rating`, { score });
}

export async function getUserRating(dramaId: number): Promise<Rating | null> {
  return apiGet<Rating | null>(`/api/dramas/${dramaId}/rating/mine`);
}

export async function getRatingStats(
  dramaId: number
): Promise<{ average: number; count: number }> {
  return apiGet<{ average: number; count: number }>(
    `/api/dramas/${dramaId}/rating/stats`
  );
}

export async function reportProgress(
  episodeId: number,
  positionMs: number,
  completed: boolean
): Promise<void> {
  return apiPost<void>('/api/watch-progress', {
    episodeId,
    positionMs,
    completed,
  });
}

export async function login(
  username: string,
  password: string
): Promise<{ token: string; userId: number }> {
  return apiPost<{ token: string; userId: number }>('/api/auth/login', {
    username,
    password,
  });
}

export async function register(
  username: string,
  password: string,
  nickname: string
): Promise<{ token: string; userId: number }> {
  return apiPost<{ token: string; userId: number }>('/api/auth/register', {
    username,
    password,
    nickname,
  });
}

export async function getMe(): Promise<User> {
  return apiGet<User>('/api/auth/me');
}

export async function getEggCollection(): Promise<UserEgg[]> {
  return apiGet<UserEgg[]>('/api/eggs/collection');
}

export async function getPointsBalance(): Promise<number> {
  return apiGet<number>('/api/points/balance');
}

export async function buyHint(interactionId: number): Promise<string> {
  return apiPost<string>(`/api/interactions/${interactionId}/hint`, {});
}

export async function getCategories(): Promise<string[]> {
  return apiGet<string[]>('/api/categories');
}

export async function getDramasByCategory(
  category: string,
  page = 1,
  size = 20
): Promise<Drama[]> {
  return apiGet<Drama[]>(
    `/api/dramas?category=${encodeURIComponent(category)}&page=${page}&size=${size}`
  );
}
