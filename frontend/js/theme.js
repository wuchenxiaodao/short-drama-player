const themeManager = {
    currentTheme: 'dark',

    init() {
        const saved = localStorage.getItem('theme');
        if (saved) {
            this.currentTheme = saved;
        }
        this.apply(this.currentTheme);
    },

    toggle() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.apply(this.currentTheme);
        localStorage.setItem('theme', this.currentTheme);
    },

    apply(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const btn = document.getElementById('theme-toggle');
        if (btn) {
            btn.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }
};
