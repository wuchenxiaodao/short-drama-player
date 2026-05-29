const player = {
    videoElement: null,
    currentEpisode: null,
    interactionPoints: [],
    currentTime: 0,

    init() {
        this.videoElement = document.getElementById('video-player');
        this.setupEventListeners();
    },

    setupEventListeners() {
        this.videoElement.addEventListener('timeupdate', utils.throttle(() => {
            this.currentTime = this.videoElement.currentTime;
            this.checkInteractionPoints();
        }, 1000));

        this.videoElement.addEventListener('ended', () => {
            this.onVideoEnded();
        });
    },

    loadEpisode(episode) {
        this.currentEpisode = episode;
        this.interactionPoints = episode.interactionPoints || [];
        this.videoElement.src = episode.videoUrl;
        document.getElementById('player-title').textContent = episode.title;
    },

    checkInteractionPoints() {
        const currentTime = Math.floor(this.currentTime);
        const point = this.interactionPoints.find(p =>
            p.timestamp === currentTime && !p.shown
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

    onVideoEnded() {
        const drama = state.currentDrama;
        const currentEp = state.currentEpisode;
        if (!drama || !currentEp) return;

        const episodes = drama.episodes || [];
        const currentIndex = episodes.findIndex(ep => ep.id === currentEp.episodeId);
        if (currentIndex >= 0 && currentIndex < episodes.length - 1) {
            const nextEpisode = episodes[currentIndex + 1];
            app.playEpisode(nextEpisode.id);
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
