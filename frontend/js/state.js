const state = {
    currentPage: 'home',
    previousPage: null,
    currentDrama: null,
    currentEpisode: null,
    userId: localStorage.getItem('userId') || null,
    token: localStorage.getItem('drama_token') || null,

    setPage(page) {
        this.previousPage = this.currentPage;
        this.currentPage = page;
    },

    goBack() {
        if (this.previousPage) {
            this.currentPage = this.previousPage;
            this.previousPage = null;
        }
    },

    isLoggedIn() { return !!this.token; },

    setAuth(token, userId) {
        this.token = token;
        this.userId = userId;
        localStorage.setItem('drama_token', token);
        localStorage.setItem('userId', userId);
    },

    logout() {
        this.token = null;
        this.userId = null;
        localStorage.removeItem('drama_token');
        localStorage.removeItem('userId');
        localStorage.removeItem('drama_user');
    }
};
