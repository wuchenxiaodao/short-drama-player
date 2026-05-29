const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:8080/api' : '/api';

// API 缓存
const apiCache = {
    cache: new Map(),
    ttl: 5 * 60 * 1000, // 5分钟

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }
        return item.data;
    },

    set(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    },

    clear() {
        this.cache.clear();
    }
};

const api = {
    async request(url, options = {}) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw { status: response.status, message: response.statusText };
            }
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
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

    async submitAnswer(userId, interactionPointId, selectedOption) {
        return this.request(`${API_BASE_URL}/interaction/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, interactionPointId, selectedOption })
        });
    },

    async getInteractionStats(interactionId) {
        return this.request(`${API_BASE_URL}/interaction/${interactionId}/stats`);
    }
};
