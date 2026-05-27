const app = {
    init() {
        player.init();
        this.loadHomePage();
        this.setupNavigation();
    },

    setupNavigation() {
        // 底部导航
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.navigateTo(page);
            });
        });
    },

    navigateTo(page) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(`${page}-page`).classList.add('active');
        state.setPage(page);

        if (page === 'home') {
            this.loadHomePage();
        }
    },

    async loadHomePage() {
        await Promise.all([
            this.loadRecommendDramas(),
            this.loadHotDramas()
        ]);
    },

    async loadRecommendDramas() {
        const container = document.getElementById('recommend-list');
        utils.showLoading(container);

        try {
            const response = await api.getRecommendDramas();
            if (response.code === 200) {
                this.renderDramaList(container, response.data.content);
            }
        } catch (error) {
            utils.showError(container, '加载失败');
        }
    },

    async loadHotDramas() {
        const container = document.getElementById('hot-list');
        utils.showLoading(container);

        try {
            const response = await api.getHotDramas();
            if (response.code === 200) {
                this.renderDramaList(container, response.data.content);
            }
        } catch (error) {
            utils.showError(container, '加载失败');
        }
    },

    renderDramaList(container, dramas) {
        container.innerHTML = dramas.map(drama => `
            <div class="drama-card" onclick="app.showDramaDetail(${drama.id})">
                <div class="drama-card-cover">🎬</div>
                <div class="drama-card-info">
                    <div class="drama-card-title">${drama.title}</div>
                    <div class="drama-card-episodes">${drama.totalEpisodes}集</div>
                </div>
            </div>
        `).join('');
    },

    async showDramaDetail(dramaId) {
        const response = await api.getDramaDetail(dramaId);
        if (response.code === 200) {
            state.currentDrama = response.data;
            this.renderDramaDetail(response.data);
            this.navigateTo('detail');
        }
    },

    renderDramaDetail(drama) {
        document.getElementById('detail-title').textContent = drama.title;
        document.getElementById('detail-description').textContent = drama.description;
        document.getElementById('detail-episodes').textContent = `共${drama.totalEpisodes}集`;
        document.getElementById('detail-status').textContent = drama.status === 'ONGOING' ? '连载中' : '已完结';

        // 加载剧集列表
        this.loadEpisodes(drama.id);
    },

    async loadEpisodes(dramaId) {
        const container = document.getElementById('episode-grid');
        // 这里需要调用获取剧集列表的API
        container.innerHTML = '<p>加载中...</p>';
    },

    async playEpisode(episodeId) {
        const response = await api.getEpisodePlayInfo(episodeId);
        if (response.code === 200) {
            state.currentEpisode = response.data;
            player.loadEpisode(response.data);
            this.navigateTo('player');
            player.play();
        }
    },

    showSearch() {
        // 搜索功能
        console.log('显示搜索');
    },

    goBack() {
        if (state.previousPage) {
            this.navigateTo(state.previousPage);
        } else {
            this.navigateTo('home');
        }
    }
};

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
