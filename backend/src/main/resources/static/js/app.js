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
        // Mine page auth button is handled in loadMinePage
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
                state.user = { username: data.username, nickname: data.nickname, points: data.points };
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
        state.user = null;
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

        document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        if (page === 'home') {
            this.loadHomePage();
        } else if (page === 'mine') {
            this.loadMinePage();
        }
    },

    async loadHomePage() {
        loadingManager.show();
        try {
            const tasks = [this.loadRecommendDramas(), this.loadHotDramas(), this.loadCategories()];
            if (state.isLoggedIn()) {
                tasks.push(this.loadContinueWatching());
            } else {
                const section = document.getElementById('continue-section');
                if (section) section.style.display = 'none';
            }
            await Promise.all(tasks);
        } finally {
            loadingManager.hide();
        }
    },

    async loadCategories() {
        try {
            const res = await api.request(`${API_BASE_URL}/drama/categories`);
            const categories = res.data || res;
            const container = document.getElementById('category-tabs');
            if (!container || !categories || categories.length === 0) return;
            container.innerHTML = `
                <span class="category-tab active" data-category="">全部</span>
                ${categories.map(cat => `<span class="category-tab" data-category="${interaction.escapeHtml(cat)}">${interaction.escapeHtml(cat)}</span>`).join('')}
            `;
            container.querySelectorAll('.category-tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    container.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    this.filterByCategory(tab.dataset.category);
                });
            });
        } catch (e) {}
    },

    async filterByCategory(category) {
        const container = document.getElementById('recommend-list');
        utils.showLoading(container);
        try {
            if (!category) {
                await this.loadRecommendDramas();
                return;
            }
            const res = await api.request(`${API_BASE_URL}/drama/category/${encodeURIComponent(category)}?page=0&size=20`);
            const dramas = (res.data || res).content;
            if (dramas && dramas.length > 0) {
                this.renderDramaList(container, dramas);
            } else {
                container.innerHTML = '<div class="search-empty">该分类暂无短剧</div>';
            }
        } catch (e) {
            utils.showError(container, '加载失败');
        }
    },

    async loadContinueWatching() {
        try {
            const res = await api.request(`${API_BASE_URL}/drama/continue`);
            const dramas = res.data || res;
            const section = document.getElementById('continue-section');
            const container = document.getElementById('continue-list');
            if (!section || !container) return;
            if (!dramas || dramas.length === 0) {
                section.style.display = 'none';
                return;
            }
            section.style.display = 'block';
            this.renderDramaList(container, dramas);
        } catch (e) {
            const section = document.getElementById('continue-section');
            if (section) section.style.display = 'none';
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
        container.innerHTML = dramas.map(drama => {
            const tags = [];
            if (drama.isHot) tags.push('<span class="drama-card-tag hot">🔥 热播</span>');
            if (drama.isNew) tags.push('<span class="drama-card-tag new">✨ 新剧</span>');
            const rating = drama.rating > 0 ? `<span class="drama-card-rating">★ ${drama.rating.toFixed(1)}</span>` : '';
            return `
            <div class="drama-card" onclick="app.showDramaDetail(${drama.id})">
                <div class="drama-card-cover">
                    ${drama.coverUrl ? `<img src="${drama.coverUrl}" alt="${drama.title}" onerror="this.style.display='none'">` : ''}
                    <span class="cover-emoji">🎬</span>
                    ${tags.length > 0 ? `<div class="drama-card-tags">${tags.join('')}</div>` : ''}
                </div>
                <div class="drama-card-info">
                    <div class="drama-card-title">${drama.title}</div>
                    <div class="drama-card-meta">
                        <span>${drama.category || ''} · ${drama.totalEpisodes}集</span>
                        ${rating}
                    </div>
                </div>
            </div>`;
        }).join('');
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

        container.innerHTML = episodes.map(ep => {
            const hasProgress = ep.watchPositionMs && ep.watchPositionMs > 0;
            // 判断是否看完：进度>90%或后端返回completed标记
            const isCompleted = ep.completed || (hasProgress && ep.durationSeconds
                && ep.watchPositionMs / (ep.durationSeconds * 1000) > 0.9);
            return `
            <div class="episode-item ${isCompleted ? 'episode-completed' : (hasProgress ? 'episode-watching' : '')}"
                 onclick="app.playEpisode(${ep.id})">
                <span class="episode-number">${ep.episodeNumber}</span>
                <span class="episode-title">${ep.title || '第' + ep.episodeNumber + '集'}</span>
                ${isCompleted ? '<span class="episode-status completed">✓</span>' : ''}
                ${hasProgress && !isCompleted ? '<span class="episode-status watching">▸</span>' : ''}
            </div>`;
        }).join('');
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

        // 获取当前选中的分类
        const activeCategory = document.querySelector('.category-tab.active')?.dataset.category;

        try {
            let url = `${API_BASE_URL}/drama/search?keyword=${encodeURIComponent(keyword)}`;
            if (activeCategory) {
                url += `&category=${encodeURIComponent(activeCategory)}`;
            }
            const response = await api.request(url);
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

    loadMinePage() {
        const nicknameEl = document.getElementById('mine-nickname');
        const pointsEl = document.getElementById('mine-points');
        const authBtn = document.getElementById('mine-auth-btn');

        if (state.isLoggedIn()) {
            nicknameEl.textContent = state.user?.nickname || state.user?.username || '用户';
            pointsEl.textContent = `积分：${state.user?.points || 0}`;
            authBtn.textContent = '退出登录';
            authBtn.onclick = () => this.logout();
        } else {
            nicknameEl.textContent = '未登录';
            pointsEl.textContent = '登录后享受更多功能';
            authBtn.textContent = '登录 / 注册';
            authBtn.onclick = () => this.showLoginPage();
        }
    },

    async showFavoriteList() {
        if (!state.isLoggedIn()) {
            this.showLoginPage();
            return;
        }
        try {
            const res = await api.request(`${API_BASE_URL}/favorite/list`);
            const dramas = res.data || res;
            const container = document.createElement('div');
            container.className = 'drama-grid';
            if (!dramas || dramas.length === 0) {
                container.innerHTML = '<div class="search-empty">暂无追剧</div>';
            } else {
                this.renderDramaList(container, dramas);
            }

            const pageEl = document.getElementById('mine-page');
            const existing = pageEl.querySelector('.favorite-list-section');
            if (existing) existing.remove();

            const section = document.createElement('div');
            section.className = 'favorite-list-section';
            section.style.padding = '0 16px';
            section.innerHTML = '<h3 style="margin-bottom:12px;color:var(--text-primary)">我的追剧</h3>';
            section.appendChild(container);
            pageEl.appendChild(section);
        } catch (e) {
            errorHandler.handle(e, 'showFavoriteList');
        }
    },

    async showWatchHistory() {
        if (!state.isLoggedIn()) {
            this.showLoginPage();
            return;
        }
        try {
            const res = await api.request(`${API_BASE_URL}/progress/history`);
            const history = res.data || res;
            const container = document.createElement('div');
            container.className = 'drama-grid';
            if (!history || history.length === 0) {
                container.innerHTML = '<div class="search-empty">暂无观看记录</div>';
            } else {
                this.renderDramaList(container, history);
            }

            const pageEl = document.getElementById('mine-page');
            const existing = pageEl.querySelector('.watch-history-section');
            if (existing) existing.remove();

            const section = document.createElement('div');
            section.className = 'watch-history-section';
            section.style.padding = '0 16px';
            section.innerHTML = '<h3 style="margin-bottom:12px;color:var(--text-primary)">观看历史</h3>';
            section.appendChild(container);
            pageEl.appendChild(section);
        } catch (e) {
            errorHandler.handle(e, 'showWatchHistory');
        }
    },

    showAIStoryPanel() {
        if (!state.isLoggedIn()) {
            this.showLoginPage();
            return;
        }

        const currentEpisode = state.currentEpisode;
        if (!currentEpisode) {
            errorHandler.showMessage('请先播放剧集', 'error');
            return;
        }

        const overlay = document.getElementById('interaction-overlay');
        overlay.classList.remove('hidden');
        overlay.innerHTML = `
            <div class="interaction-popup ai-story-popup">
                <h3 class="ai-story-title">🤖 AI 剧情生成</h3>
                <p class="ai-story-desc">选择一个方向，AI 将为你生成独特的剧情</p>
                <div class="ai-story-options">
                    <button class="ai-option-btn" onclick="app.generateAIStory('branch', '主角发现了隐藏的秘密')">
                        🔮 发现秘密
                    </button>
                    <button class="ai-option-btn" onclick="app.generateAIStory('branch', '突然出现了新的敌人')">
                        ⚔️ 新的敌人
                    </button>
                    <button class="ai-option-btn" onclick="app.generateAIStory('continue', '故事向意想不到的方向发展')">
                        🌀 意外转折
                    </button>
                    <button class="ai-option-btn" onclick="app.generateAIStory('continue', '主角获得了强大的力量')">
                        💪 获得力量
                    </button>
                </div>
                <div class="ai-story-custom">
                    <input type="text" id="ai-prompt-input" placeholder="或者输入你的想法..." maxlength="100">
                    <button onclick="app.generateAIStory('branch', document.getElementById('ai-prompt-input').value)">生成</button>
                </div>
                <button class="continue-btn" onclick="document.getElementById('interaction-overlay').classList.add('hidden')">关闭</button>
            </div>
        `;
    },

    async generateAIStory(type, prompt) {
        if (!prompt.trim()) {
            errorHandler.showMessage('请输入剧情方向', 'error');
            return;
        }

        const currentEpisode = state.currentEpisode;
        if (!currentEpisode) return;

        const overlay = document.getElementById('interaction-overlay');
        overlay.innerHTML = `
            <div class="interaction-popup ai-story-popup">
                <div class="ai-loading">
                    <div class="loader-spinner"></div>
                    <p>AI 正在创作中...</p>
                </div>
            </div>
        `;

        try {
            const endpoint = type === 'branch' ? '/api/ai-story/branch' : '/api/ai-story/continue';
            const res = await api.request(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    episodeId: currentEpisode.episodeId || currentEpisode.id,
                    prompt: prompt
                })
            });

            const story = res.data || res;
            overlay.innerHTML = `
                <div class="interaction-popup ai-story-popup">
                    <h3 class="ai-story-title">🤖 AI 生成结果</h3>
                    <div class="ai-story-content">
                        ${story.content.replace(/\n/g, '<br>')}
                    </div>
                    <div class="ai-story-actions">
                        <button class="continue-btn" onclick="document.getElementById('interaction-overlay').classList.add('hidden')">继续观看</button>
                        <button class="ai-retry-btn" onclick="app.showAIStoryPanel()">重新生成</button>
                    </div>
                </div>
            `;
        } catch (e) {
            errorHandler.handle(e, 'generateAIStory');
            overlay.classList.add('hidden');
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
