const interaction = {
    currentPoint: null,
    countdown: 0,
    countdownTimer: null,
    pendingBranchId: null,

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    show(point) {
        this.currentPoint = point;
        const overlay = document.getElementById('interaction-overlay');
        overlay.classList.remove('hidden');
        overlay.innerHTML = this.createInteractionHTML(point);
        this.bindOptionEvents();
        this.startCountdown(10);
    },

    startCountdown(seconds) {
        this.countdown = seconds;
        const countdownEl = document.getElementById('interaction-countdown');
        if (countdownEl) {
            countdownEl.textContent = `${this.countdown}s`;
            countdownEl.style.display = 'block';
        }

        this.countdownTimer = setInterval(() => {
            this.countdown--;
            if (countdownEl) {
                countdownEl.textContent = `${this.countdown}s`;
                if (this.countdown <= 3) countdownEl.style.color = '#EF4444';
            }
            if (this.countdown <= 0) {
                clearInterval(this.countdownTimer);
                this.autoSelect();
            }
        }, 1000);
    },

    autoSelect() {
        const firstBtn = document.querySelector('.interaction-option');
        if (firstBtn) {
            firstBtn.click();
        } else {
            this.close();
        }
    },

    createInteractionHTML(point) {
        let html = `
            <div class="interaction-popup">
                <div id="interaction-countdown" class="interaction-countdown">10s</div>
                <div class="interaction-question">${this.escapeHtml(point.questionText || point.question)}</div>
                <div class="interaction-options">
        `;

        const options = point.options || [];
        options.forEach(option => {
            const optId = option.id || option;
            const optText = option.text || option;
            html += `
                <button class="interaction-option" data-id="${optId}">
                    ${this.escapeHtml(optText)}
                </button>
            `;
        });

        html += `</div>`;

        if (this.currentPoint.type === 'QUIZ') {
            html += `<button class="hint-btn" onclick="interaction.buyHint()">💡 使用提示 (${this.currentPoint.hintCost || 50}积分)</button>`;
        }

        html += `
                <div id="interaction-hint" class="interaction-hint" style="display:none"></div>
                <div id="interaction-result" class="interaction-result"></div>
            </div>
        `;

        return html;
    },

    bindOptionEvents() {
        document.querySelectorAll('.interaction-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const optionId = parseInt(btn.dataset.id);
                this.selectOption(optionId);
            });
        });
    },

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
                this.triggerEmojiRain(['🎉', '⭐', '🏆', '💯']);
            } else {
                options.forEach(btn => {
                    const id = parseInt(btn.dataset.id);
                    if (id === selectedOptionId) btn.classList.add('wrong');
                    if (correctOpt && id === correctOpt.id) btn.classList.add('correct');
                });
                resultHtml = '❌ 答错了';
            }
            if (feedbackText) {
                resultHtml += `<div class="feedback-text" style="margin-top:8px;padding:8px;background:rgba(255,255,255,0.1);border-radius:6px;font-size:14px;">${this.escapeHtml(feedbackText)}</div>`;
            }
        } else if (type === 'CHOICE') {
            resultHtml = feedbackText || '你做出了选择！';
            if (nextInteractionId) {
                resultHtml += '<div class="branch-hint" style="margin-top:8px;font-size:12px;color:#aaa;">你的选择将影响后续剧情...</div>';
            }
        } else if (type === 'VOTE') {
            resultHtml = this.buildStatsHtml(result);
            if (feedbackText) {
                resultHtml += `<div class="feedback-text" style="margin-top:8px;padding:8px;background:rgba(255,255,255,0.1);border-radius:6px;font-size:14px;">${this.escapeHtml(feedbackText)}</div>`;
            }
        } else if (type === 'EGG') {
            resultHtml = '🥚 彩蛋已收集 +5分';
            this.triggerEmojiRain(['🥚', '🎁', '✨']);
            if (feedbackText) {
                resultHtml += `<div class="feedback-text" style="margin-top:8px;padding:8px;background:rgba(255,255,255,0.1);border-radius:6px;font-size:14px;">${this.escapeHtml(feedbackText)}</div>`;
            }
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

        // 互动评论输入框
        if (type === 'VOTE' || type === 'CHOICE') {
            resultHtml += `
                <div class="interaction-comment">
                    <input type="text" id="interaction-comment-input" placeholder="说说你的看法..." maxlength="200">
                    <button onclick="interaction.postComment()">发送</button>
                </div>
            `;
        }

        resultHtml += '<button class="continue-btn" onclick="interaction.close()">继续观看</button>';
        document.getElementById('interaction-result').innerHTML = resultHtml;
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

    triggerEmojiRain(emojis) {
        const container = document.createElement('div');
        container.className = 'emoji-rain';
        document.body.appendChild(container);

        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const emoji = document.createElement('div');
                emoji.className = 'emoji-rain-item';
                emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                emoji.style.left = `${Math.random() * 100}%`;
                emoji.style.animationDuration = `${1 + Math.random() * 2}s`;
                container.appendChild(emoji);
            }, i * 100);
        }

        setTimeout(() => container.remove(), 3000);
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
        const overlay = document.getElementById('interaction-overlay');
        overlay.classList.add('hidden');
        player.play();
    }
};
