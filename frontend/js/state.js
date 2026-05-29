const state = {
    currentPage: 'home',
    history: [],
    currentDrama: null,
    currentEpisode: null,
    userId: localStorage.getItem('userId') || null,
    token: localStorage.getItem('drama_token') || null,

    setPage(page) {
        if (this.currentPage && this.currentPage !== page) {
            this.history.push(this.currentPage);
            if (this.history.length > 10) {
                this.history.shift();
            }
        }
        this.currentPage = page;
    },

    goBack() {
        if (this.history.length > 0) {
            const prevPage = this.history.pop();
            this.currentPage = prevPage;
            return prevPage;
        }
        this.currentPage = 'home';
        return 'home';
    },

    clearHistory() {
        this.history = [];
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
    }
};
