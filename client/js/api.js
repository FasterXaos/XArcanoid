// Browser stand-in for the cloud API. The same method names, no server.
const xarcanoid_api = {
    storage_key: "xarcanoid_itch",
    player: "You",
    power_kinds: ["wide", "narrow", "slow", "fast", "life", "sticky", "score", "dual"],
    cast: {
        survival: [
            { username: "FXFX", score: 172400, level: 11, max_combo: 38, difficulty: "overdrive" },
            { username: "Corebreaker", score: 141880, level: 11, max_combo: 33, difficulty: "overdrive" },
            { username: "AAAA", score: 98640, level: 9, max_combo: 21, difficulty: "standard" },
            { username: "Brickline", score: 64040, level: 7, max_combo: 14, difficulty: "standard" },
            { username: "AbyssMiss", score: 22150, level: 4, max_combo: 7, difficulty: "standard" },
        ],
        campaign: [
            { username: "NovaPaddle", score: 151200, level: 10, max_combo: 29, difficulty: "standard" },
            { username: "FXFX", score: 126540, level: 10, max_combo: 28, difficulty: "overdrive" },
            { username: "NightArcade", score: 74330, level: 11, max_combo: 15, difficulty: "overdrive" },
            { username: "AAAA", score: 50880, level: 6, max_combo: 12, difficulty: "standard" },
        ],
    },
    memory: null,

    catalog() {
        return xarcanoid_achievements.rows.reduce((all, row) => all.concat(row), []);
    },

    load_state() {
        if (this.memory) {
            return this.memory;
        }
        let parsed = null;
        try {
            parsed = JSON.parse(localStorage.getItem(this.storage_key) || "null");
        } catch (error) {
            parsed = null;
        }
        const state = parsed && typeof parsed === "object" ? parsed : {};
        state.unlocked = Array.isArray(state.unlocked) ? state.unlocked : [];
        state.streak = Number.isInteger(state.streak) ? state.streak : 0;
        state.powerups = Array.isArray(state.powerups) ? state.powerups : [];
        state.runs = state.runs && typeof state.runs === "object" ? state.runs : {};
        if (!state.unlocked.includes("new_player")) {
            state.unlocked.push("new_player");
        }
        this.memory = state;
        this.save_state();
        return state;
    },

    save_state() {
        try {
            localStorage.setItem(this.storage_key, JSON.stringify(this.memory));
        } catch (error) {
            // Private mode keeps the in-memory copy for this tab.
        }
    },

    maybe_platinum(state) {
        const needs = this.catalog().filter((id) => id !== "platinum");
        const complete = needs.every((id) => state.unlocked.includes(id));
        if (complete && !state.unlocked.includes("platinum")) {
            state.unlocked.push("platinum");
        }
    },

    achievement_items(state) {
        return this.catalog().map((id) => {
            const unlocked = state.unlocked.includes(id);
            return {
                id,
                unlocked,
                hidden: id === "cheats" && !unlocked,
                percent: 0,
                holders: 0,
                players: 0,
            };
        });
    },

    me() {
        this.load_state();
        return Promise.resolve({ ok: true, user: { username: this.player } });
    },

    login() {
        return this.me();
    },

    register() {
        return this.me();
    },

    logout() {
        return Promise.resolve({ ok: true });
    },

    submit_score(score, level, max_combo, difficulty, mode) {
        if (!Number.isInteger(score) || score < 0 || score > 999999) {
            return Promise.reject(new Error("bad_score"));
        }
        if (!Number.isInteger(level) || level < 1 || level > 9999) {
            return Promise.reject(new Error("bad_level"));
        }
        if (!Number.isInteger(max_combo) || max_combo < 0 || max_combo > 9999) {
            return Promise.reject(new Error("bad_numbers"));
        }
        if (difficulty !== "standard" && difficulty !== "overdrive") {
            return Promise.reject(new Error("bad_numbers"));
        }
        if (mode !== "campaign" && mode !== "survival") {
            return Promise.reject(new Error("bad_numbers"));
        }
        const state = this.load_state();
        const previous = state.runs[mode];
        const better = !previous
            || score > previous.score
            || (score === previous.score && level > previous.level);
        if (better) {
            state.runs[mode] = { score, level, max_combo, difficulty };
            this.save_state();
        }
        return Promise.resolve({ ok: true });
    },

    leaderboard(mode) {
        const cast = (this.cast[mode] || []).map((entry) => ({ ...entry }));
        const mine = this.load_state().runs[mode];
        if (mine) {
            cast.push({
                username: this.player,
                score: mine.score,
                level: mine.level,
                max_combo: mine.max_combo,
                difficulty: mine.difficulty,
            });
        }
        cast.sort((a, b) => b.score - a.score || b.level - a.level || a.username.localeCompare(b.username));
        return Promise.resolve({ ok: true, entries: cast.slice(0, 10) });
    },

    achievements() {
        const state = this.load_state();
        return Promise.resolve({ ok: true, items: this.achievement_items(state) });
    },

    unlock_achievement(id) {
        const state = this.load_state();
        if (!this.catalog().includes(id) || id === "platinum") {
            return Promise.reject(new Error("bad_numbers"));
        }
        if (!state.unlocked.includes(id)) {
            state.unlocked.push(id);
        }
        this.maybe_platinum(state);
        this.save_state();
        return Promise.resolve({ ok: true, items: this.achievement_items(state) });
    },

    achievement_progress(event, kind) {
        const state = this.load_state();
        if (event === "campaign_loss") {
            state.streak += 1;
            if (state.streak >= 5 && !state.unlocked.includes("madness")) {
                state.unlocked.push("madness");
            }
        } else if (event === "campaign_win") {
            state.streak = 0;
        } else if (event === "powerup" && this.power_kinds.includes(kind)) {
            if (!state.powerups.includes(kind)) {
                state.powerups.push(kind);
            }
            const complete = this.power_kinds.every((item) => state.powerups.includes(item));
            if (complete && !state.unlocked.includes("all_drops")) {
                state.unlocked.push("all_drops");
            }
        }
        this.maybe_platinum(state);
        this.save_state();
        return Promise.resolve({ ok: true, items: this.achievement_items(state) });
    },
};
