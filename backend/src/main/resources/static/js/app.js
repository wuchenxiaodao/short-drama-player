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
        setTimeout(() => toast.remove(), 3000);
    }
};

const app = {
    bannerIndex: 0,
    bannerTimer: null,

    init() {
        player.init();
        this.checkAuth();
        this.loadHomePage();
        this.setupNavigation();
    },

    checkAuth() {
        const token = localStorage.getItem('drama_token');
        if (token) {
            state.token = token;
            this.updateAuthUI(true);
        }
    },

    updateAuthUI(loggedIn) {
        const authBtn = document.getElementById('auth-btn');
        if (authBtn) {
            authBtn.textContent = loggedIn ? '退出' : '登录';
            authBtn.onclick = loggedIn ? () => this.logout() : () => this.showLoginPage();
        }
    },

    showLoginPage() {
        this.navigateTo('login');
    },

    async handleLogin() {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();
        if (!username || !password) {
            errorHandler.showMessage('请输入用户名和密码', 'error');
            return;
        }
        try {
            const res = await api.login(username, password);
            const data = res.data || res;
            if (data.token) {
                localStorage.setItem('drama_token', data.token);
                state.token = data.token;
                this.updateAuthUI(true);
                this.navigateTo('home');
                errorHandler.showMessage('登录成功', 'success');
            }
        } catch (error) {
            errorHandler.handle(error, 'handleLogin');
        }
    },

    async handleRegister() {
        const username = document.getElementById('reg-username').value.trim();
        const password = document.getElementById('reg-password').value.trim();
        const nickname = document.getElementById('reg-nickname').value.trim() || username;
        if (!username || !password) {
            errorHandler.showMessage('请输入用户名和密码', 'error');
            return;
        }
        try {
            const res = await api.register(username, password, nickname);
            const data = res.data || res;
            if (data.token) {
                localStorage.setItem('drama_token', data.token);
                state.token = data.token;
                this.updateAuthUI(true);
                this.navigateTo('home');
                errorHandler.showMessage('注册成功', 'success');
            }
        } catch (error) {
            errorHandler.handle(error, 'handleRegister');
        }
    },

    logout() {
        localStorage.removeItem('drama_token');
        state.token = null;
        this.updateAuthUI(false);
        this.navigateTo('home');
        errorHandler.showMessage('已退出登录', 'info');
    },

    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.navigateTo(page);
            });
        });
    },

    navigateTo(page) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const pageEl = document.getElementById(`${page}-page`);
        if (pageEl) {
            pageEl.classList.add('active');
        }
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
            if (dramas) {
                this.renderDramaList(container, dramas);
                this.renderBanner(dramas.slice(0, 5));
            }
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

    renderBanner(dramas) {
        const carousel = document.getElementById('banner-carousel');
        if (!carousel || dramas.length === 0) return;

        carousel.innerHTML = dramas.map((drama, i) => `
            <div class="banner-slide ${i === 0 ? 'active' : ''}" onclick="app.showDramaDetail(${drama.id})">
                <div class="banner-cover" style="background-image: url(${drama.coverUrl || ''})"></div>
                <div class="banner-info">
                    <h3>${drama.title}</h3>
                    <p>${drama.category} · ${drama.totalEpisodes}集</p>
                </div>
            </div>
        `).join('');

        clearInterval(this.bannerTimer);
        this.bannerIndex = 0;
        this.bannerTimer = setInterval(() => {
            this.bannerIndex = (this.bannerIndex + 1) % dramas.length;
            carousel.querySelectorAll('.banner-slide').forEach((slide, i) => {
                slide.classList.toggle('active', i === this.bannerIndex);
            });
        }, 3000);
    },

    renderDramaList(container, dramas) {
        container.innerHTML = dramas.map(drama => `
            <div class="drama-card" onclick="app.showDramaDetail(${drama.id})">
                <div class="drama-card-cover">
                    ${drama.coverUrl ? `<img src="${drama.coverUrl}" alt="${drama.title}" onerror="this.style.display='none'">` : ''}
                    <span class="cover-emoji">🎬</span>
                </div>
                <div class="drama-card-info">
                    <div class="drama-card-title">${drama.title}</div>
                    <div class="drama-card-meta">${drama.category || ''} · ${drama.totalEpisodes}集</div>
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

        const coverImg = document.getElementById('detail-cover-img');
        if (coverImg && drama.coverUrl) {
            coverImg.src = drama.coverUrl;
            coverImg.alt = drama.title;
        }

        this.loadEpisodes(drama);
        this.checkFavoriteStatus(drama.id);
        this.loadDramaComments(drama.id);
        this.loadRating(drama.id);
    },

    async checkFavoriteStatus(dramaId) {
        try {
            const res = await api.request(`${API_BASE_URL}/favorite/check/${dramaId}`);
            const btn = document.getElementById('favorite-btn');
            if (btn && res.data?.favorited) {
                btn.classList.add('favorited');
                btn.innerHTML = '❤️ 已追剧';
            }
        } catch (e) {}
    },

    async toggleFavorite(dramaId) {
        if (!state.isLoggedIn()) {
            this.showLoginPage();
            return;
        }
        try {
            const res = await api.request(`${API_BASE_URL}/favorite/${dramaId}`, { method: 'POST' });
            const btn = document.getElementById('favorite-btn');
            if (res.data?.favorited) {
                btn.classList.add('favorited');
                btn.innerHTML = '❤️ 已追剧';
            } else {
                btn.classList.remove('favorited');
                btn.innerHTML = '🤍 追剧';
            }
        } catch (e) {
            errorHandler.handle(e, 'toggleFavorite');
        }
    },

    async showEggCollection() {
        if (!state.isLoggedIn()) {
            this.showLoginPage();
            return;
        }
        try {
            const res = await api.request(`${API_BASE_URL}/eggs/collection`);
            this.renderEggCollection(res.data || res);
            this.navigateTo('eggs');
        } catch (e) {
            errorHandler.handle(e, 'showEggCollection');
        }
    },

    renderEggCollection(data) {
        const container = document.getElementById('eggs-content');
        if (!container) return;
        const total = data.totalEggs || 0;
        const collected = data.collectedEggs || 0;
        const pct = total > 0 ? (collected / total * 100).toFixed(0) : 0;

        let html = `
            <div class="egg-progress-section">
                <div class="egg-progress-text">已收集 ${collected}/${total}</div>
                <div class="egg-progress-bar"><div class="egg-progress-fill" style="width:${pct}%"></div></div>
            </div>`;

        for (const [dramaId, eggs] of Object.entries(data.byDrama || {})) {
            const dramaTitle = eggs[0]?.dramaTitle || '未知短剧';
            html += `<div class="egg-drama-section"><h3>${dramaTitle}</h3><div class="egg-grid">`;
            for (const egg of eggs) {
                if (egg.collected) {
                    html += `<div class="egg-card collected">
                        <div class="egg-icon">🥚</div>
                        <div class="egg-name">${egg.questionText || '神秘彩蛋'}</div>
                        ${egg.eggContent ? `<div class="egg-content">${egg.eggContent}</div>` : ''}
                    </div>`;
                } else {
                    html += `<div class="egg-card locked">
                        <div class="egg-icon">❓</div>
                        <div class="egg-name">未发现</div>
                    </div>`;
                }
            }
            html += `</div></div>`;
        }
        container.innerHTML = html;
    },

    shareDrama(drama) {
        const shareData = {
            title: drama.title,
            text: `我在看《${drama.title}》，超好看！`,
            url: window.location.origin + '/#drama/' + drama.id
        };
        if (navigator.share) {
            navigator.share(shareData).catch(() => {});
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(shareData.url).then(() => {
                errorHandler.showMessage('链接已复制到剪贴板', 'success');
            }).catch(() => {
                prompt('复制以下链接分享给朋友：', shareData.url);
            });
        } else {
            prompt('复制以下链接分享给朋友：', shareData.url);
        }
    },

    loadEpisodes(drama) {
        const container = document.getElementById('episode-grid');
        const episodes = drama.episodes || [];

        if (episodes.length === 0) {
            container.innerHTML = '<p class="empty-text">暂无剧集</p>';
            return;
        }

        container.innerHTML = episodes.map(ep => `
            <div class="episode-item" onclick="app.playEpisode(${ep.id})">
                <span class="episode-number">${ep.episodeNumber}</span>
                <span class="episode-title">${ep.title || '第' + ep.episodeNumber + '集'}</span>
            </div>
        `).join('');
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
        this.renderSearchHistory();
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
            this.renderSearchHistory();
            return;
        }
        this._searchTimer = setTimeout(() => this.doSearch(keyword), 300);
    },

    async doSearch(keyword) {
        const container = document.getElementById('search-results');
        container.className = 'search-results';
        utils.showLoading(container);
        this.saveSearchHistory(keyword);
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

    getSearchHistory() {
        try { return JSON.parse(localStorage.getItem('search_history') || '[]'); } catch { return []; }
    },

    saveSearchHistory(keyword) {
        let history = this.getSearchHistory().filter(h => h !== keyword);
        history.unshift(keyword);
        if (history.length > 15) history = history.slice(0, 15);
        localStorage.setItem('search_history', JSON.stringify(history));
    },

    renderSearchHistory() {
        const history = this.getSearchHistory();
        const container = document.getElementById('search-history');
        if (!container) return;
        if (history.length === 0) {
            container.style.display = 'none';
            return;
        }
        container.style.display = 'block';
        container.innerHTML = `
            <div class="search-history-title">
                <span>搜索历史</span>
                <span class="clear-history" onclick="app.clearSearchHistory()">清除</span>
            </div>
            <div class="search-tags">
                ${history.map(kw => `<span class="search-tag" data-keyword="${interaction.escapeHtml(kw)}">${interaction.escapeHtml(kw)}</span>`).join('')}
            </div>
        `;
        container.querySelectorAll('.search-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                this.doSearch(tag.dataset.keyword);
            });
        });
    },

    clearSearchHistory() {
        localStorage.removeItem('search_history');
        this.renderSearchHistory();
    },

    async loadDramaComments(dramaId, page = 0) {
        try {
            const res = await api.request(`${API_BASE_URL}/comment/drama/${dramaId}?sort=hot&page=${page}&size=20`);
            const data = res.data || res;
            const container = document.getElementById('drama-comments-list');
            const countEl = document.getElementById('drama-comment-count');
            if (countEl) countEl.textContent = `(${data.total || 0})`;
            if (!container) return;
            if (!data.comments || data.comments.length === 0) {
                container.innerHTML = '<div class="comment-empty">暂无评论，快来抢沙发！</div>';
                return;
            }
            container.innerHTML = data.comments.map(c => `
                <div class="comment-item">
                    <div class="comment-header">
                        <span class="comment-user">${c.nickname || '匿名用户'}</span>
                        <span class="comment-time">${this.formatTime(c.createdAt)}</span>
                    </div>
                    <div class="comment-content">${c.content}</div>
                    <div class="comment-actions">
                        <span class="comment-like ${c.isLiked ? 'liked' : ''}" onclick="app.likeDramaComment(${c.id})">👍 ${c.likeCount || 0}</span>
                    </div>
                </div>
            `).join('');
        } catch (e) {}
    },

    async postDramaComment() {
        if (!state.isLoggedIn()) {
            this.showLoginPage();
            return;
        }
        const input = document.getElementById('drama-comment-input');
        const content = input?.value?.trim();
        if (!content) return;
        try {
            await api.request(`${API_BASE_URL}/comment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dramaId: state.currentDrama?.id, content })
            });
            input.value = '';
            this.loadDramaComments(state.currentDrama?.id);
        } catch (e) {
            errorHandler.handle(e, 'postDramaComment');
        }
    },

    async likeDramaComment(commentId) {
        if (!state.isLoggedIn()) {
            this.showLoginPage();
            return;
        }
        try {
            await api.request(`${API_BASE_URL}/comment/${commentId}/like`, { method: 'POST' });
            this.loadDramaComments(state.currentDrama?.id);
        } catch (e) {}
    },

    formatTime(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
        return `${date.getMonth() + 1}/${date.getDate()}`;
    },

    async loadRating(dramaId) {
        try {
            const res = await api.request(`${API_BASE_URL}/rating/stats?dramaId=${dramaId}`);
            const data = res.data || res;
            const scoreEl = document.getElementById('rating-score');
            const countEl = document.getElementById('rating-count');
            if (scoreEl) scoreEl.textContent = (data.average || 0).toFixed(1);
            if (countEl) countEl.textContent = `(${data.count || 0}人评分)`;
            this.highlightStars(Math.round(data.average || 0));

            const starsContainer = document.getElementById('rating-stars');
            if (starsContainer) {
                starsContainer.querySelectorAll('.star').forEach(star => {
                    star.onclick = () => this.rateDrama(dramaId, parseInt(star.dataset.score));
                });
            }
        } catch (e) {}
    },

    highlightStars(score) {
        const stars = document.querySelectorAll('#rating-stars .star');
        stars.forEach(star => {
            const starScore = parseInt(star.dataset.score);
            star.classList.toggle('active', starScore <= score);
        });
    },

    async rateDrama(dramaId, score) {
        if (!state.isLoggedIn()) {
            this.showLoginPage();
            return;
        }
        try {
            await api.request(`${API_BASE_URL}/rating/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dramaId, score: score * 2 })
            });
            this.highlightStars(score);
            this.loadRating(dramaId);
            errorHandler.showMessage('评分成功', 'success');
        } catch (e) {
            errorHandler.handle(e, 'rateDrama');
        }
    },

    goBack() {
        const prevPage = state.goBack();
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const pageEl = document.getElementById(`${prevPage}-page`);
        if (pageEl) {
            pageEl.classList.add('active');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
