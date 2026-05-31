const player = {
    videoElement: null,
    currentEpisode: null,
    interactionPoints: [],
    currentTime: 0,
    _lastReportTime: 0,

    init() {
        this.videoElement = document.getElementById('video-player');
        this.setupEventListeners();
        this.setupErrorHandling();
    },

    danmaku: null,

    setupEventListeners() {
        this.videoElement.addEventListener('timeupdate', utils.throttle(() => {
            this.currentTime = this.videoElement.currentTime;
            this.checkInteractionPoints();
            this.reportProgress();
            this.danmaku?.checkDanmaku(Math.floor(this.currentTime * 1000));
        }, 500));

        this.videoElement.addEventListener('ended', () => {
            this.onVideoEnded();
        });
    },

    setupErrorHandling() {
        this.videoElement.addEventListener('error', () => {
            const errorDisplay = document.getElementById('player-error');
            if (errorDisplay) {
                errorDisplay.textContent = '视频加载失败，请检查网络连接或稍后重试';
                errorDisplay.style.display = 'block';
            }
        });

        this.videoElement.addEventListener('loadeddata', () => {
            const errorDisplay = document.getElementById('player-error');
            if (errorDisplay) {
                errorDisplay.style.display = 'none';
            }
        });
    },

    loadEpisode(episode) {
        this.currentEpisode = episode;
        this.interactionPoints = (episode.interactions || []).map(p => ({
            ...p,
            shown: false
        }));
        this.videoElement.src = episode.videoUrl;
        document.getElementById('player-title').textContent = episode.title || '';

        const savedSpeed = parseFloat(localStorage.getItem('playbackSpeed') || '1');
        this.videoElement.playbackRate = savedSpeed;

        if (!this.danmaku) {
            this.danmaku = new DanmakuSystem(this.videoElement);
        }
        this.danmaku.loadDanmaku(episode.episodeId || episode.id);

        if (episode.lastPositionMs && episode.lastPositionMs > 0) {
            this.videoElement.addEventListener('loadedmetadata', () => {
                const resumeSec = episode.lastPositionMs / 1000;
                if (this.videoElement.duration > resumeSec + 2) {
                    this.videoElement.currentTime = resumeSec;
                    this.showResumeHint(resumeSec);
                }
            }, { once: true });
        }
    },

    checkInteractionPoints() {
        const currentTimeMs = Math.floor(this.currentTime * 1000);
        const point = this.interactionPoints.find(p =>
            Math.abs(p.timestampMs - currentTimeMs) < 1000 && !p.shown && p.prerequisiteMet !== false
        );

        if (point) {
            point.shown = true;
            this.showInteraction(point);
        }
    },

    showInteraction(point) {
        this.videoElement.pause();
        interaction.show(point);
    },

    reportProgress() {
        if (!this.currentEpisode || !state.isLoggedIn()) return;
        const now = Date.now();
        if (now - this._lastReportTime < 10000) return;
        this._lastReportTime = now;
        const positionMs = Math.floor(this.currentTime * 1000);
        api.reportProgress(this.currentEpisode.episodeId || this.currentEpisode.id, positionMs).catch(() => {});
    },

    showResumeHint(positionSec) {
        const hint = document.createElement('div');
        hint.className = 'resume-hint';
        hint.textContent = `已恢复到 ${Math.floor(positionSec / 60)}:${String(Math.floor(positionSec % 60)).padStart(2, '0')}`;
        hint.style.cssText = 'position:absolute;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.7);color:#fff;padding:6px 16px;border-radius:20px;font-size:13px;z-index:10;transition:opacity 0.5s;';
        const container = document.getElementById('player-container') || this.videoElement.parentElement;
        container.style.position = 'relative';
        container.appendChild(hint);
        setTimeout(() => { hint.style.opacity = '0'; }, 2500);
        setTimeout(() => { hint.remove(); }, 3000);
    },

    onVideoEnded() {
        this.reportProgress();
        const drama = state.currentDrama;
        const currentEp = state.currentEpisode;
        if (!drama || !currentEp) return;

        const episodes = drama.episodes || [];
        const currentId = currentEp.episodeId || currentEp.id;
        const currentIndex = episodes.findIndex(ep => ep.id === currentId);
        if (currentIndex >= 0 && currentIndex < episodes.length - 1) {
            app.playEpisode(episodes[currentIndex + 1].id);
        } else {
            errorHandler.showMessage('已是最后一集', 'info');
        }
    },

    play() {
        this.videoElement.play();
    },

    pause() {
        this.videoElement.pause();
    },

    changeSpeed(speed) {
        this.videoElement.playbackRate = speed;
        localStorage.setItem('playbackSpeed', speed.toString());
    },

    sendCurrentDanmaku() {
        const input = document.getElementById('danmaku-input');
        const content = input?.value?.trim();
        if (!content || !this.currentEpisode) return;
        const positionMs = Math.floor(this.currentTime * 1000);
        this.danmaku.sendDanmaku(this.currentEpisode.episodeId || this.currentEpisode.id, content, positionMs);
        input.value = '';
    },

    toggleDanmaku() {
        if (!this.danmaku) return;
        const isOn = this.danmaku.toggle();
        const btn = document.getElementById('danmaku-toggle');
        if (btn) btn.textContent = isOn ? '弹幕🔊' : '弹幕🔇';
    }
};

class DanmakuSystem {
    constructor(videoElement) {
        this.videoElement = videoElement;
        this.container = null;
        this.danmakuList = [];
        this.isDanmakuOn = true;
        this.init();
    }

    init() {
        this.container = document.createElement('div');
        this.container.className = 'danmaku-container';
        const parent = this.videoElement.parentElement;
        parent.style.position = 'relative';
        parent.appendChild(this.container);
    }

    async loadDanmaku(episodeId) {
        try {
            const res = await api.request(`${API_BASE_URL}/danmaku/episode/${episodeId}`);
            const list = res.data || res;
            this.danmakuList = (list || []).map(d => ({ ...d, shown: false }));
        } catch (e) {
            this.danmakuList = [];
        }
    }

    checkDanmaku(currentTimeMs) {
        if (!this.isDanmakuOn) return;
        for (const d of this.danmakuList) {
            if (!d.shown && Math.abs(d.positionMs - currentTimeMs) < 800) {
                d.shown = true;
                this.showDanmaku(d.content);
            }
        }
    }

    showDanmaku(text) {
        const el = document.createElement('div');
        el.className = 'danmaku-item';
        el.textContent = text;
        const duration = 6 + Math.random() * 4;
        el.style.cssText = `position:absolute;right:-${text.length * 16}px;top:${5 + Math.random() * 75}%;color:#fff;font-size:14px;white-space:nowrap;text-shadow:1px 1px 2px rgba(0,0,0,0.8);animation:danmaku-scroll ${duration}s linear forwards;pointer-events:none;z-index:5;`;
        this.container.appendChild(el);
        setTimeout(() => el.remove(), (duration + 1) * 1000);
    }

    async sendDanmaku(episodeId, content, positionMs) {
        if (!state.isLoggedIn()) {
            app.showLoginPage();
            return;
        }
        try {
            await api.request(`${API_BASE_URL}/danmaku/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ episodeId, content, positionMs })
            });
            this.showDanmaku(content);
            this.danmakuList.push({ positionMs, content, shown: true });
        } catch (e) {
            errorHandler.handle(e, 'sendDanmaku');
        }
    }

    toggle() {
        this.isDanmakuOn = !this.isDanmakuOn;
        this.container.style.display = this.isDanmakuOn ? 'block' : 'none';
        return this.isDanmakuOn;
    }
}
