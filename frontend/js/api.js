const API_BASE_URL = '/api';

const api = {
    async getRecommendDramas(page = 0, size = 10) {
        const response = await fetch(`${API_BASE_URL}/drama/recommend?page=${page}&size=${size}`);
        return response.json();
    },

    async getHotDramas(page = 0, size = 10) {
        const response = await fetch(`${API_BASE_URL}/drama/hot?page=${page}&size=${size}`);
        return response.json();
    },

    async getDramaDetail(id) {
        const response = await fetch(`${API_BASE_URL}/drama/${id}/detail`);
        return response.json();
    },

    async searchDramas(keyword) {
        const response = await fetch(`${API_BASE_URL}/drama/search?keyword=${encodeURIComponent(keyword)}`);
        return response.json();
    },

    async getEpisodePlayInfo(episodeId) {
        const response = await fetch(`${API_BASE_URL}/episode/${episodeId}/playinfo`);
        return response.json();
    },

    async submitAnswer(userId, interactionPointId, selectedOption) {
        const response = await fetch(`${API_BASE_URL}/interaction/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, interactionPointId, selectedOption })
        });
        return response.json();
    },

    async getInteractionStats(interactionId) {
        const response = await fetch(`${API_BASE_URL}/interaction/${interactionId}/stats`);
        return response.json();
    }
};
