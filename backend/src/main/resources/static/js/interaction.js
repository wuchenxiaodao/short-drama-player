const interaction = {
    currentPoint: null,
    countdown: 0,
    countdownTimer: null,
    pendingBranchId: null,
    _emojiRainTimers: [],
    _autoCloseTimer: null,

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    showByType(point) {
        this.currentPoint = point;
        const type = point.type || point.interactionType;
        switch (type) {
            case 'EMOJI':  this.showEmojiRain(point); break;
            case 'QUIZ':   this.showQuizOverlay(point); break;
            case 'VOTE':   this.showVotePanel(point); break;
            case 'CHOICE': this.showChoicePanel(point); break;
            case 'EGG':    this.showEggPopup(point); break;
            case 'INFO':   this.showInfoBar(point); break;
            case 'LINK':   this.showLinkCard(point); break;
            default:       this.showDefaultPopup(point); break;
        }
    },

    // ========== EMOJI ==========
    showEmojiRain(point) {
        const emojis = point.emojis || ['❤️', '😂', '😮', '🔥', '👏'];
        this._startEmojiRainSystem(emojis);
        // 自动提交，无需用户操作
        if (point.id) {
            api.submitAnswer(point.id, 0).catch(() => {});
        }
    },

    _startEmojiRainSystem(emojis) {
        this._cleanupEmojiRain();
        // 底部快捷栏
        this._showEmojiBar(emojis);
        // 自动飘出模拟其他用户
        const autoTimer = setInterval(() => {
            this._spawnFloatingEmoji(emojis[Math.floor(Math.random() * emojis.length)]);
        }, 2000 + Math.random() * 1000);
        this._emojiRainTimers.push(autoTimer);
        // 8秒后停止自动飘出
        this._emojiRainTimers.push(setTimeout(() => this._cleanupEmojiRain(), 8000));
    },

    _showEmojiBar(emojis) {
        const existing = document.getElementById('emoji-quick-bar');
        if (existing) existing.remove();

        const bar = document.createElement('div');
        bar.id = 'emoji-quick-bar';
        bar.className = 'emoji-quick-bar';
        emojis.forEach(em => {
            const btn = document.createElement('button');
            btn.className = 'emoji-quick-btn';
            btn.textContent = em;
            btn.onclick = () => {
                for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
                    setTimeout(() => this._spawnFloatingEmoji(em), i * 150);
                }
            };
            bar.appendChild(btn);
        });
        // 👍 点赞按钮
        const likeBtn = document.createElement('button');
        likeBtn.className = 'emoji-quick-btn';
        likeBtn.textContent = '👍';
        likeBtn.onclick = () => {
            for (let i = 0; i < 3; i++) {
                setTimeout(() => this._spawnFloatingEmoji('👍'), i * 100);
            }
        };
        bar.appendChild(likeBtn);

        const container = document.getElementById('player-container') || document.body;
        container.appendChild(bar);
        // 5秒后自动收起
        this._emojiRainTimers.push(setTimeout(() => {
            bar.classList.add('hiding');
            setTimeout(() => bar.remove(), 400);
        }, 5000));
    },

    _spawnFloatingEmoji(emoji) {
        const container = document.getElementById('player-container') || document.body;
        const el = document.createElement('div');
        el.className = 'emoji-float-item';
        el.textContent = emoji;
        el.style.left = `${10 + Math.random() * 80}%`;
        el.style.animationDuration = `${3 + Math.random() * 2}s`;
        el.style.fontSize = `${24 + Math.random() * 12}px`;
        el.onclick = (e) => {
            e.stopPropagation();
            this._likeEmoji(el);
        };
        container.appendChild(el);
        setTimeout(() => el.remove(), 5500);
    },

    _likeEmoji(el) {
        if (el.dataset.liked) return;
        el.dataset.liked = '1';
        el.classList.add('emoji-liked');
        // 6个粒子爆裂
        for (let i = 0; i < 6; i++) {
            const particle = document.createElement('div');
            particle.className = 'emoji-particle';
            const angle = (i / 6) * Math.PI * 2;
            const dist = 40 + Math.random() * 20;
            particle.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
            particle.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
            particle.textContent = '✨';
            el.parentElement.appendChild(particle);
            setTimeout(() => particle.remove(), 700);
        }
        setTimeout(() => el.classList.remove('emoji-liked'), 500);
    },

    _cleanupEmojiRain() {
        this._emojiRainTimers.forEach(t => clearInterval(t));
        this._emojiRainTimers = [];
        const bar = document.getElementById('emoji-quick-bar');
        if (bar) bar.remove();
    },

    // ========== QUIZ ==========
    showQuizOverlay(point) {
        player.slowDown();
        const overlay = this._getOrCreateOverlay();
        overlay.innerHTML = this._buildBottomPanel(point, 'quiz');
        overlay.classList.remove('hidden');
        this._bindPanelOptionEvents(overlay, point);
        // 10秒倒计时（可选，不强制选择）
        this._startPanelCountdown(overlay, 10, () => {
            this._closePanel();
        });
    },

    // ========== VOTE ==========
    showVotePanel(point) {
        const overlay = this._getOrCreateOverlay();
        overlay.innerHTML = this._buildBottomPanel(point, 'vote');
        overlay.classList.remove('hidden');
        this._bindPanelOptionEvents(overlay, point);
        this._autoCloseTimer = setTimeout(() => this._closePanel(), 8000);
    },

    // ========== CHOICE ==========
    showChoicePanel(point) {
        const overlay = this._getOrCreateOverlay();
        overlay.innerHTML = this._buildBottomPanel(point, 'choice');
        overlay.classList.remove('hidden');
        this._bindPanelOptionEvents(overlay, point);
    },

    // ========== EGG ==========
    showEggPopup(point) {
        const popup = document.createElement('div');
        popup.className = 'interaction-egg-popup';
        popup.innerHTML = '🥚 彩蛋！+5分';
        const container = document.getElementById('player-container') || document.body;
        container.appendChild(popup);
        // 自动提交
        if (point.id) {
            api.submitAnswer(point.id, 0).catch(() => {});
        }
        this.triggerSimpleEmojiRain(['🥚', '🎁', '✨']);
        setTimeout(() => {
            popup.classList.add('hiding');
            setTimeout(() => popup.remove(), 400);
        }, 2500);
    },

    // ========== INFO ==========
    showInfoBar(point) {
        const bar = document.createElement('div');
        bar.className = 'interaction-info-bar';
        bar.textContent = point.questionText || point.content || '信息';
        const container = document.getElementById('player-container') || document.body;
        container.appendChild(bar);
        if (point.id) {
            api.submitAnswer(point.id, 0).catch(() => {});
        }
        setTimeout(() => {
            bar.classList.add('hiding');
            setTimeout(() => bar.remove(), 400);
        }, 3500);
    },

    // ========== LINK ==========
    showLinkCard(point) {
        const card = document.createElement('div');
        card.className = 'interaction-link-card';
        const title = point.questionText || point.title || '相关链接';
        const url = point.linkUrl || '#';
        card.innerHTML = `
            <div class="link-card-title">${this.escapeHtml(title)}</div>
            <a class="link-card-btn" href="${this.escapeHtml(url)}" target="_blank">查看详情</a>
        `;
        const container = document.getElementById('player-container') || document.body;
        container.appendChild(card);
        if (point.id) {
            api.submitAnswer(point.id, 0).catch(() => {});
        }
        setTimeout(() => {
            card.classList.add('hiding');
            setTimeout(() => card.remove(), 400);
        }, 5000);
    },

    // ========== DEFAULT ==========
    showDefaultPopup(point) {
        this.showChoicePanel(point);
    },

    // ========== 通用底部面板构建 ==========
    _getOrCreateOverlay() {
        let overlay = document.getElementById('interaction-bottom-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'interaction-bottom-overlay';
            overlay.className = 'interaction-bottom-panel';
            const container = document.getElementById('player-container') || document.body;
            container.appendChild(overlay);
        }
        return overlay;
    },

    _buildBottomPanel(point, panelType) {
        const options = point.options || [];
        let html = `<div class="panel-header">
                <span class="panel-question">${this.escapeHtml(point.questionText || point.question || '')}</span>
                <button class="panel-close-btn" onclick="interaction._closePanel()">✕</button>
            </div>
            <div class="panel-options">`;

        options.forEach(option => {
            const optId = option.id || option;
            const optText = option.text || option;
            html += `<button class="interaction-option" data-id="${optId}">${this.escapeHtml(optText)}</button>`;
        });

        html += `</div>`;

        if (panelType === 'quiz' && point.hintCost) {
            html += `<button class="hint-btn" onclick="interaction.buyHint()">💡 提示 (${point.hintCost}积分)</button>`;
        }

        html += `<div id="interaction-hint" class="interaction-hint" style="display:none"></div>
            <div id="interaction-result" class="interaction-result"></div>
            <div id="panel-countdown" class="panel-countdown"></div>`;
        return html;
    },

    _bindPanelOptionEvents(overlay, point) {
        overlay.querySelectorAll('.interaction-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const optionId = parseInt(btn.dataset.id);
                this.selectOption(optionId);
            });
        });
    },

    _startPanelCountdown(overlay, seconds, onExpire) {
        this.countdown = seconds;
        const el = overlay.querySelector('#panel-countdown');
        if (el) el.textContent = `${this.countdown}s`;
        this.countdownTimer = setInterval(() => {
            this.countdown--;
            if (el) {
                el.textContent = `${this.countdown}s`;
                if (this.countdown <= 3) el.style.color = '#EF4444';
            }
            if (this.countdown <= 0) {
                clearInterval(this.countdownTimer);
                onExpire();
            }
        }, 1000);
    },

    _closePanel() {
        if (this.countdownTimer) clearInterval(this.countdownTimer);
        if (this._autoCloseTimer) clearTimeout(this._autoCloseTimer);
        const panel = document.getElementById('interaction-bottom-overlay');
        if (panel) panel.remove();
        if (this.currentPoint?.type === 'QUIZ') player.restoreSpeed();
    },

    // ========== 核心逻辑保留 ==========
    async selectOption(optionId) {
        try {
            const result = await api.submitAnswer(this.currentPoint.id, optionId);
            this.showResult(result, optionId);
        } catch (error) {
            errorHandler.handle(error, 'selectOption');
        }
    },

    showResult(result, selectedOptionId) {
        const options = document.querySelectorAll('.interaction-option');
        options.forEach(btn => btn.disabled = true);

        const type = this.currentPoint.type;
        let resultHtml = '';

        const selectedOption = this.currentPoint.options?.find(o => o.id === selectedOptionId);
        const feedbackText = selectedOption?.feedbackText || '';
        const nextInteractionId = selectedOption?.nextInteractionId || null;

        if (type === 'QUIZ') {
            const correctOpt = this.currentPoint.options.find(o => o.isCorrect);
            const isCorrect = correctOpt && selectedOptionId === correctOpt.id;
            if (isCorrect) {
                options.forEach(btn => {
                    if (parseInt(btn.dataset.id) === selectedOptionId) btn.classList.add('correct');
                });
                resultHtml = '✅ 回答正确 +10分';
                this.triggerSimpleEmojiRain(['🎉', '⭐', '🏆', '💯']);
            } else {
                options.forEach(btn => {
                    const id = parseInt(btn.dataset.id);
                    if (id === selectedOptionId) btn.classList.add('wrong');
                    if (correctOpt && id === correctOpt.id) btn.classList.add('correct');
                });
                resultHtml = '❌ 答错了';
            }
            if (feedbackText) {
                resultHtml += `<div class="feedback-text">${this.escapeHtml(feedbackText)}</div>`;
            }
            // 答完恢复速度
            setTimeout(() => player.restoreSpeed(), 1500);
        } else if (type === 'CHOICE') {
            resultHtml = feedbackText || '你做出了选择！';
            if (nextInteractionId) {
                resultHtml += '<div class="branch-hint">你的选择将影响后续剧情...</div>';
            }
        } else if (type === 'VOTE') {
            resultHtml = this.buildStatsHtml(result);
            if (feedbackText) {
                resultHtml += `<div class="feedback-text">${this.escapeHtml(feedbackText)}</div>`;
            }
        } else if (type === 'EGG') {
            resultHtml = '🥚 彩蛋已收集 +5分';
            this.triggerSimpleEmojiRain(['🥚', '🎁', '✨']);
        } else {
            resultHtml = '已提交';
        }

        if (nextInteractionId) {
            this.pendingBranchId = nextInteractionId;
            player.interactionPoints.forEach(p => {
                if (p.prerequisiteId === this.currentPoint.id && p.prerequisiteChoiceOptionId === selectedOptionId) {
                    p.prerequisiteMet = true;
                }
            });
        }

        if (type === 'VOTE' || type === 'CHOICE') {
            resultHtml += `
                <div class="interaction-comment">
                    <input type="text" id="interaction-comment-input" placeholder="说说你的看法..." maxlength="200">
                    <button onclick="interaction.postComment()">发送</button>
                </div>
            `;
        }

        resultHtml += '<button class="continue-btn" onclick="interaction._closePanel()">继续观看</button>';
        const resultEl = document.getElementById('interaction-result');
        if (resultEl) resultEl.innerHTML = resultHtml;
    },

    buildStatsHtml(result) {
        if (!result || !result.optionStats) return '<div class="stats-title">投票结果</div>';
        const options = this.currentPoint.options || [];
        let html = '<div class="stats-title">投票结果</div>';
        options.forEach(opt => {
            const stat = result.optionStats[opt.id];
            const pct = stat ? stat.percentage : 0;
            html += `
                <div class="stats-bar">
                    <span class="stats-label">${this.escapeHtml(opt.text)}</span>
                    <div class="stats-bar-bg"><div class="stats-bar-fill" style="width:${pct}%"></div></div>
                    <span class="stats-pct">${pct}%</span>
                </div>
            `;
        });
        return html;
    },

    // 简化版emoji雨（用于QUIZ答对、EGG等场景）
    triggerSimpleEmojiRain(emojis) {
        const container = document.createElement('div');
        container.className = 'emoji-rain';
        document.body.appendChild(container);

        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                const emoji = document.createElement('div');
                emoji.className = 'emoji-rain-item';
                emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                emoji.style.left = `${Math.random() * 100}%`;
                emoji.style.animationDuration = `${1 + Math.random() * 2}s`;
                container.appendChild(emoji);
            }, i * 80);
        }
        setTimeout(() => container.remove(), 3500);
    },

    async buyHint() {
        if (!state.isLoggedIn()) {
            app.showLoginPage();
            return;
        }
        try {
            const res = await api.request(`${API_BASE_URL}/points/hint`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ interactionId: this.currentPoint.id })
            });
            const data = res.data || res;
            const hintDiv = document.getElementById('interaction-hint');
            if (hintDiv) {
                hintDiv.textContent = '💡 ' + (data.hint || '暂无提示');
                hintDiv.style.display = 'block';
            }
            const hintBtn = document.querySelector('.hint-btn');
            if (hintBtn) hintBtn.style.display = 'none';
        } catch (e) {
            errorHandler.handle(e, 'buyHint');
        }
    },

    async postComment() {
        const input = document.getElementById('interaction-comment-input');
        const content = input?.value?.trim();
        if (!content) return;

        if (!state.isLoggedIn()) {
            app.showLoginPage();
            return;
        }

        try {
            const dramaId = state.currentDrama?.id;
            if (!dramaId) return;

            await api.request(`${API_BASE_URL}/comment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dramaId, content })
            });

            input.value = '';
            errorHandler.showMessage('评论成功', 'success');
        } catch (e) {
            errorHandler.handle(e, 'postComment');
        }
    },

    close() {
        if (this.countdownTimer) clearInterval(this.countdownTimer);
        if (this._autoCloseTimer) clearTimeout(this._autoCloseTimer);
        const overlay = document.getElementById('interaction-overlay');
        if (overlay) overlay.classList.add('hidden');
        this._closePanel();
    },

    // ========== 弹幕情绪 → Emoji ==========
    _EMOJI_KEYWORDS: {
        '🔥': ['火', '燃', '帅', '酷', '厉害', '牛', 'awesome', 'fire', '绝了'],
        '😂': ['笑', '哈哈', '搞笑', '逗', 'funny', 'lol', '笑死', '绷不住'],
        '❤️': ['爱', '喜欢', '甜', '好甜', 'love', 'cute', '磕到了', '心动'],
        '😱': ['惊', '吓', '天哪', '不会吧', 'wow', 'omg', '卧槽', '离谱'],
        '👏': ['好', '棒', '赞', 'nice', 'great', 'bravo', '绝绝子'],
        '😭': ['哭', '泪', '感动', '呜呜', 'sad', '破防'],
        '😡': ['气', '怒', '过分', 'angry', '可恶', '该死'],
    },

    _lastDanmakuEmojiTime: 0,
    _DANMAKU_EMOJI_COOLDOWN: 5000,

    onDanmakuShow(content) {
        const now = Date.now();
        if (now - this._lastDanmakuEmojiTime < this._DANMAKU_EMOJI_COOLDOWN) return;
        const emoji = this._matchDanmakuToEmoji(content);
        if (!emoji) return;
        this._lastDanmakuEmojiTime = now;
        this._spawnFloatingEmoji(emoji);
    },

    _matchDanmakuToEmoji(content) {
        for (const [emoji, keywords] of Object.entries(this._EMOJI_KEYWORDS)) {
            if (keywords.some(kw => content.includes(kw))) return emoji;
        }
        return null;
    }
};
