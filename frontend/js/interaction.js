const interaction = {
    currentPoint: null,

    show(point) {
        this.currentPoint = point;
        const overlay = document.getElementById('interaction-overlay');
        overlay.classList.remove('hidden');
        overlay.innerHTML = this.createInteractionHTML(point);
    },

    createInteractionHTML(point) {
        let html = `
            <div class="interaction-popup">
                <div class="interaction-question">${point.question}</div>
                <div class="interaction-options">
        `;

        point.options.forEach((option, index) => {
            html += `
                <button class="interaction-option" onclick="interaction.selectOption('${option}')">
                    ${option}
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

    async selectOption(option) {
        const result = await api.submitAnswer(
            state.userId,
            this.currentPoint.id,
            option
        );

        this.showResult(result, option);
    },

    showResult(result, selectedOption) {
        const options = document.querySelectorAll('.interaction-option');
        options.forEach(btn => {
            btn.disabled = true;
            if (btn.textContent.trim() === this.currentPoint.correctAnswer) {
                btn.classList.add('correct');
            } else if (btn.textContent.trim() === selectedOption && !result.correct) {
                btn.classList.add('wrong');
            }
        });

        if (result.correct) {
            this.triggerEmojiRain(['🎉', '⭐', '🏆', '✨', '💯']);
        }

        const resultDiv = document.getElementById('interaction-result');
        resultDiv.innerHTML = `
            <div class="interaction-points">
                ${result.correct ? `+${result.pointsEarned}` : '答错了'}
            </div>
            <button class="continue-btn" onclick="interaction.close()">
                继续观看
            </button>
        `;
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
