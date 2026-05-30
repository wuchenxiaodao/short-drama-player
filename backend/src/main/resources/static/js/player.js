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

    setupEventListeners() {
        this.videoElement.addEventListener('timeupdate', utils.throttle(() => {
            this.currentTime = this.videoElement.currentTime;
            this.checkInteractionPoints();
            this.reportProgress();
        }, 1000));

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
            Math.abs(p.timestampMs - currentTimeMs) < 1000 && !p.shown
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
    }
};
