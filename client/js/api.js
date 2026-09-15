const xarcanoid_api = {
    async request(path, options) {
        const response = await fetch(path, {
            headers: { "Content-Type": "application/json" },
            ...options,
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || payload.ok === false) {
            throw new Error(payload.error || "request_failed");
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

    submit_score(score, level, max_combo, difficulty, mode) {
        return this.request("/api/score", {
            method: "POST",
            body: JSON.stringify({ score, level, max_combo, difficulty, mode }),
        });
    },

    leaderboard(mode) {
        const query = mode ? "?mode=" + encodeURIComponent(mode) : "";
        return this.request("/api/leaderboard" + query);
    },

    achievements() {
        return this.request("/api/achievements");
    },

    unlock_achievement(id) {
        return this.request("/api/achievements/unlock", {
            method: "POST",
            body: JSON.stringify({ id }),
        });
    },

    achievement_progress(event, kind) {
        const body = { event };
        if (kind) {
            body.kind = kind;
        }
        return this.request("/api/achievements/progress", {
            method: "POST",
            body: JSON.stringify(body),
        });
    },
};
