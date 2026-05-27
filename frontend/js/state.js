const state = {
    currentPage: 'home',
    previousPage: null,
    currentDrama: null,
    currentEpisode: null,
    userId: localStorage.getItem('userId') || '1',

    setPage(page) {
        this.previousPage = this.currentPage;
        this.currentPage = page;
    },

    goBack() {
        if (this.previousPage) {
            this.currentPage = this.previousPage;
            this.previousPage = null;
        }
    }
};
