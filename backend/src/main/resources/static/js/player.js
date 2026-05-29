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
        // 自动播放下一集
        console.log('视频播放结束');
    },

    play() {
        this.videoElement.play();
    },

    pause() {
        this.videoElement.pause();
    }
};
