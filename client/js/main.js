(() => {
    const auth_status = document.getElementById("auth_status");
    const auth_form = document.getElementById("auth_form");
    const auth_error = document.getElementById("auth_error");
    const username_input = document.getElementById("username_input");
    const password_input = document.getElementById("password_input");
    const register_btn = document.getElementById("register_btn");
    const logout_btn = document.getElementById("logout_btn");
    const lang_btn = document.getElementById("lang_btn");
    const leaderboard_list = document.getElementById("leaderboard_list");
    const leaderboard_empty = document.getElementById("leaderboard_empty");
    const hud_score = document.getElementById("hud_score");
    const hud_lives = document.getElementById("hud_lives");
    const hud_level = document.getElementById("hud_level");
    const overlay = document.getElementById("overlay");
    const overlay_title = document.getElementById("overlay_title");
    const overlay_text = document.getElementById("overlay_text");
    const start_btn = document.getElementById("start_btn");
    const canvas = document.getElementById("game_canvas");

    let current_user = null;
    let overlay_mode = "intro";
    let last_over = null;
    let last_auth_error = "";
    let leaderboard_failed = false;

    function t(key, vars) {
        return xarcanoid_i18n.t(key, vars);
    }

    function translate_error(message) {
        if (!message) {
            return "";
        }
        const known = t(message);
        return known === message ? message : known;
    }

    function set_auth_error(message) {
        last_auth_error = message || "";
        auth_error.textContent = translate_error(last_auth_error);
    }

    function render_auth() {
        if (current_user) {
            auth_status.textContent = t("signed_in", { name: current_user.username });
            auth_status.classList.remove("guest");
            auth_form.classList.add("hidden");
            logout_btn.classList.remove("hidden");
        } else {
            auth_status.textContent = t("guest_status");
            auth_status.classList.add("guest");
            auth_form.classList.remove("hidden");
            logout_btn.classList.add("hidden");
        }
        auth_error.textContent = translate_error(last_auth_error);
    }

    function render_leaderboard(entries) {
        leaderboard_list.innerHTML = "";
        if (!entries.length) {
            leaderboard_empty.classList.remove("hidden");
            leaderboard_empty.textContent = t("leaderboard_empty");
            return;
        }
        leaderboard_empty.classList.add("hidden");
        entries.forEach((entry, index) => {
            const item = document.createElement("li");
            item.innerHTML =
                '<span class="rank">' + (index + 1) + "</span>" +
                "<span>" + escape_html(entry.username) + "</span>" +
                "<span>" + entry.score + "</span>";
            leaderboard_list.appendChild(item);
        });
    }

    function escape_html(text) {
        return String(text)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;");
    }

    function render_overlay() {
        if (overlay_mode === "over" && last_over) {
            overlay_title.textContent = t("game_over");
            overlay_text.textContent = last_over.text;
            start_btn.textContent = t("play_again");
            return;
        }
        overlay_title.textContent = "XArcanoid";
        overlay_text.textContent = t("overlay_hint");
        start_btn.textContent = t("play");
    }

    function apply_language() {
        xarcanoid_i18n.apply();
        render_auth();
        render_overlay();
        if (leaderboard_failed) {
            leaderboard_empty.textContent = t("leaderboard_unavailable");
            leaderboard_empty.classList.remove("hidden");
        } else if (!leaderboard_list.children.length) {
            leaderboard_empty.textContent = t("leaderboard_empty");
        }
    }

    async function refresh_session() {
        const payload = await xarcanoid_api.me();
        current_user = payload.user;
        render_auth();
    }

    async function refresh_leaderboard() {
        try {
            const payload = await xarcanoid_api.leaderboard();
            leaderboard_failed = false;
            render_leaderboard(payload.entries || []);
        } catch (error) {
            leaderboard_failed = true;
            leaderboard_empty.textContent = t("leaderboard_unavailable");
            leaderboard_empty.classList.remove("hidden");
        }
    }

    async function submit_auth(kind) {
        set_auth_error("");
        const username = username_input.value.trim();
        const password = password_input.value;
        try {
            const payload = kind === "register"
                ? await xarcanoid_api.register(username, password)
                : await xarcanoid_api.login(username, password);
            current_user = payload.user;
            password_input.value = "";
            render_auth();
        } catch (error) {
            set_auth_error(error.message);
        }
    }

    lang_btn.addEventListener("click", () => {
        xarcanoid_i18n.toggle();
        apply_language();
    });

    auth_form.addEventListener("submit", (event) => {
        event.preventDefault();
        submit_auth("login");
    });

    register_btn.addEventListener("click", () => {
        submit_auth("register");
    });

    logout_btn.addEventListener("click", async () => {
        await xarcanoid_api.logout();
        current_user = null;
        render_auth();
    });

    start_btn.addEventListener("click", () => {
        overlay.classList.add("hidden");
        overlay_mode = "playing";
        xarcanoid_game.start();
    });

    function show_overlay_over(text) {
        last_over = { text };
        overlay_mode = "over";
        render_overlay();
        overlay.classList.remove("hidden");
    }

    xarcanoid_game.attach(
        canvas,
        (hud) => {
            hud_score.textContent = String(hud.score);
            hud_lives.textContent = String(hud.lives);
            hud_level.textContent = String(hud.level);
        },
        async (result) => {
            let text = t("over_stats", { score: result.score, level: result.level });
            if (current_user) {
                try {
                    await xarcanoid_api.submit_score(result.score, result.level);
                    await refresh_leaderboard();
                    text += t("score_saved");
                } catch (error) {
                    text += t("score_save_fail", { error: translate_error(error.message) });
                }
            } else {
                text += t("score_need_login");
            }
            show_overlay_over(text);
        },
    );

    xarcanoid_i18n.load();
    apply_language();
    refresh_session().catch((error) => set_auth_error(error.message));
    refresh_leaderboard();
})();
