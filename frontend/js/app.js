// 加载状态管理
const loadingManager = {
    show() {
        const loader = document.getElementById('global-loader');
        if (loader) loader.classList.remove('hidden');
    },

    hide() {
        const loader = document.getElementById('global-loader');
        if (loader) loader.classList.add('hidden');
    }
};

// 错误处理
const errorHandler = {
    handle(error, context) {
        console.error(`Error in ${context}:`, error);
        this.showMessage('操作失败，请稍后重试', 'error');
    },

    showMessage(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
};

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
        loadingManager.show();
        try {
            await Promise.all([
                this.loadRecommendDramas(),
                this.loadHotDramas()
            ]);
        } finally {
            loadingManager.hide();
        }
    },

    async loadRecommendDramas() {
        const container = document.getElementById('recommend-list');
        utils.showLoading(container);

        try {
            const response = await api.getRecommendDramas();
            const dramas = (response.data || response).content;
            if (dramas) this.renderDramaList(container, dramas);
        } catch (error) {
            utils.showError(container, '加载失败');
            errorHandler.handle(error, 'loadRecommendDramas');
        }
    },

    async loadHotDramas() {
        const container = document.getElementById('hot-list');
        utils.showLoading(container);

        try {
            const response = await api.getHotDramas();
            const dramas = (response.data || response).content;
            if (dramas) this.renderDramaList(container, dramas);
        } catch (error) {
            utils.showError(container, '加载失败');
            errorHandler.handle(error, 'loadHotDramas');
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
        try {
            const response = await api.getDramaDetail(dramaId);
            const drama = response.data || response;
            state.currentDrama = drama;
            this.renderDramaDetail(drama);
            this.navigateTo('detail');
        } catch (error) {
            errorHandler.handle(error, 'showDramaDetail');
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
        try {
            const response = await api.getEpisodePlayInfo(episodeId);
            const episode = response.data || response;
            state.currentEpisode = episode;
            player.loadEpisode(episode);
            this.navigateTo('player');
            player.play();
        } catch (error) {
            errorHandler.handle(error, 'playEpisode');
        }
    },

    showSearch() {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById('search-page').classList.add('active');
        document.getElementById('search-input').focus();
        const container = document.getElementById('search-results');
        container.className = 'search-results';
        container.innerHTML = '<div class="search-empty">输入关键词搜索短剧</div>';
    },

    closeSearch() {
        document.getElementById('search-input').value = '';
        this.navigateTo('home');
    },

    _searchTimer: null,

    onSearchInput(value) {
        clearTimeout(this._searchTimer);
        const keyword = value.trim();
        const container = document.getElementById('search-results');
        if (!keyword) {
            container.className = 'search-results';
            container.innerHTML = '<div class="search-empty">输入关键词搜索短剧</div>';
            return;
        }
        this._searchTimer = setTimeout(() => this.doSearch(keyword), 300);
    },

    async doSearch(keyword) {
        const container = document.getElementById('search-results');
        container.className = 'search-results';
        utils.showLoading(container);
        try {
            const response = await api.searchDramas(keyword);
            const dramas = (response.data || response).content;
            if (!dramas || dramas.length === 0) {
                container.innerHTML = '<div class="search-empty">未找到相关短剧</div>';
            } else {
                container.className = 'search-results drama-grid';
                this.renderDramaList(container, dramas);
            }
        } catch (error) {
            utils.showError(container, '搜索失败');
            errorHandler.handle(error, 'doSearch');
        }
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
