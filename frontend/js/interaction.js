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
                <div class="interaction-question">${point.questionText || point.question}</div>
                <div class="interaction-options">
        `;

        const options = point.options || [];
        options.forEach(option => {
            const optId = option.id || option;
            const optText = option.text || option;
            html += `
                <button class="interaction-option" data-id="${optId}" onclick="interaction.selectOption(${optId}, '${optText.replace(/'/g, "\\'")}')">
                    ${optText}
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

    async selectOption(optionId, optionText) {
        try {
            const result = await api.submitAnswer(this.currentPoint.id, optionId);
            this.showResult(result, optionText);
        } catch (error) {
            errorHandler.handle(error, 'selectOption');
        }
    },

    showResult(result, selectedOption) {
        const options = document.querySelectorAll('.interaction-option');
        options.forEach(btn => {
            btn.disabled = true;
        });

        const resultDiv = document.getElementById('interaction-result');
        resultDiv.innerHTML = `
            <div class="interaction-points">
                ${result.correct !== false ? '回答正确' : '答错了'}
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
