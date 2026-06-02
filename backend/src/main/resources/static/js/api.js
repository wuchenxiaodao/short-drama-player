const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:8080/api' : '/api';

const apiCache = {
    cache: new Map(),
    ttl: 5 * 60 * 1000,
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        if (Date.now() - item.timestamp > this.ttl) { this.cache.delete(key); return null; }
        return item.data;
    },
    set(key, data) { this.cache.set(key, { data, timestamp: Date.now() }); },
    clear() { this.cache.clear(); }
};

const api = {
    async request(url, options = {}) {
        const token = localStorage.getItem('drama_token');
        if (token) {
            options.headers = options.headers || {};
            options.headers['Authorization'] = 'Bearer ' + token;
        }
        try {
            const response = await fetch(url, options);
            if (response.status === 401) {
                localStorage.removeItem('drama_token');
                localStorage.removeItem('userId');
                window.location.reload();
                throw new Error('Unauthorized');
            }
            if (!response.ok) throw { status: response.status, message: response.statusText };

            // 写操作后清除相关缓存
            if (options.method && options.method !== 'GET') {
                this.invalidateCache(url);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    invalidateCache(url) {
        const path = new URL(url, 'http://x').pathname;
        // 清除相关缓存键
        for (const key of apiCache.cache.keys()) {
            if (path.includes('/favorite/') && (key.includes('detail') || key.includes('recommend') || key.includes('hot'))) {
                apiCache.cache.delete(key);
            }
            if (path.includes('/rating/') && key.includes('detail')) {
                apiCache.cache.delete(key);
            }
            if (path.includes('/comment/') && key.includes('detail')) {
                apiCache.cache.delete(key);
            }
        }
    },

    async getRecommendDramas(page = 0, size = 10) {
        const cacheKey = `recommend_${page}_${size}`;
        const cached = apiCache.get(cacheKey);
        if (cached) return cached;
        const data = await this.request(`${API_BASE_URL}/drama/recommend?page=${page}&size=${size}`);
        apiCache.set(cacheKey, data);
        return data;
    },

    async getHotDramas(page = 0, size = 10) {
        const cacheKey = `hot_${page}_${size}`;
        const cached = apiCache.get(cacheKey);
        if (cached) return cached;
        const data = await this.request(`${API_BASE_URL}/drama/hot?page=${page}&size=${size}`);
        apiCache.set(cacheKey, data);
        return data;
    },

    async getDramaDetail(id) {
        const cacheKey = `detail_${id}`;
        const cached = apiCache.get(cacheKey);
        if (cached) return cached;
        const data = await this.request(`${API_BASE_URL}/drama/${id}/detail`);
        apiCache.set(cacheKey, data);
        return data;
    },

    async searchDramas(keyword) {
        return this.request(`${API_BASE_URL}/drama/search?keyword=${encodeURIComponent(keyword)}`);
    },

    async getEpisodePlayInfo(episodeId) {
        return this.request(`${API_BASE_URL}/episode/${episodeId}/playinfo`);
    },

    async submitAnswer(interactionId, choiceId) {
        return this.request(`${API_BASE_URL}/interaction/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ interactionId, choiceId })
        });
    },

    async getInteractionStats(interactionId) {
        return this.request(`${API_BASE_URL}/interaction/${interactionId}/stats`);
    },

    async submitRating(dramaId, score) {
        return this.request(`${API_BASE_URL}/rating/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dramaId, score })
        });
    },

    async reportProgress(episodeId, positionMs) {
        return this.request(`${API_BASE_URL}/progress/report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ episodeId, positionMs })
        });
    },

    async login(username, password) {
        return this.request(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
    },

    async register(username, password, nickname) {
        return this.request(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, nickname })
        });
    },

    async getComments(interactionId, sort, page, size) {
        return this.request(`${API_BASE_URL}/comment/${interactionId}?sort=${sort || 'hot'}&page=${page || 0}&size=${size || 20}`);
    },

    async postComment(interactionId, content, parentCommentId) {
        return this.request(`${API_BASE_URL}/comment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ interactionId, content, parentCommentId })
        });
    },

    async toggleCommentLike(commentId) {
        return this.request(`${API_BASE_URL}/comment/${commentId}/like`, {
            method: 'POST'
        });
    },

    async getNewDramas(page, size) {
        return this.request(`${API_BASE_URL}/drama/new?page=${page || 0}&size=${size || 10}`);
    }
};
