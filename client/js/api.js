const xarcanoid_api = {
    async request(path, options) {
        const response = await fetch(path, {
            headers: { "Content-Type": "application/json" },
            ...options,
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || payload.ok === false) {
            throw new Error(payload.error || "Ошибка запроса");
        }
        return payload;
    },

    me() {
        return this.request("/api/me");
    },

    login(username, password) {
        return this.request("/api/login", {
            method: "POST",
            body: JSON.stringify({ username, password }),
        });
    },

    register(username, password) {
        return this.request("/api/register", {
            method: "POST",
            body: JSON.stringify({ username, password }),
        });
    },

    logout() {
        return this.request("/api/logout", { method: "POST", body: "{}" });
    },

    submit_score(score, level) {
        return this.request("/api/score", {
            method: "POST",
            body: JSON.stringify({ score, level }),
        });
    },

    leaderboard() {
        return this.request("/api/leaderboard");
    },
};
