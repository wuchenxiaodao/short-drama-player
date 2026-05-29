const interaction = {
    currentPoint: null,

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
    },

    createInteractionHTML(point) {
        let html = `
            <div class="interaction-popup">
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

        html += `
                </div>
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
        } else if (type === 'VOTE' || type === 'CHOICE') {
            resultHtml = this.buildStatsHtml(result);
        } else if (type === 'EGG') {
            resultHtml = '🥚 彩蛋已收集 +5分';
            this.triggerEmojiRain(['🥚', '🎁', '✨']);
        } else {
            resultHtml = '已提交';
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

    close() {
        const overlay = document.getElementById('interaction-overlay');
        overlay.classList.add('hidden');
        player.play();
    }
};
