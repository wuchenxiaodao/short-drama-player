const player = {
    videoElement: null,
    currentEpisode: null,
    interactionPoints: [],
    currentTime: 0,
    _lastReportTime: 0,

    init() {
        this.videoElement = document.getElementById('video-player');
        this.setupEventListeners();
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
                this.videoElement.currentTime = episode.lastPositionMs / 1000;
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

    onVideoEnded() {
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
