(() => {
    const auth_card = document.getElementById("auth_card");
    const player_name = document.getElementById("player_name");
    const auth_status = document.getElementById("auth_status");
    const auth_form = document.getElementById("auth_form");
    const auth_error = document.getElementById("auth_error");
    const username_input = document.getElementById("username_input");
    const password_input = document.getElementById("password_input");
    const register_btn = document.getElementById("register_btn");
    const logout_btn = document.getElementById("logout_btn");
    const lang_btn = document.getElementById("lang_btn");
    const music_btn = document.getElementById("music_btn");
    const sfx_btn = document.getElementById("sfx_btn");
    const help_btn = document.getElementById("help_btn");
    const settings_btn = document.getElementById("settings_btn");
    const help_modal = document.getElementById("help_modal");
    const settings_modal = document.getElementById("settings_modal");
    const changelog_text = document.getElementById("changelog_text");
    const settings_music_on = document.getElementById("settings_music_on");
    const settings_sfx_on = document.getElementById("settings_sfx_on");
    const settings_music_vol = document.getElementById("settings_music_vol");
    const settings_sfx_vol = document.getElementById("settings_sfx_vol");
    const settings_board_on = document.getElementById("settings_board_on");
    const leaders_card = document.getElementById("leaders_card");
    const theme_select = document.getElementById("theme_select");
    const difficulty_select = document.getElementById("difficulty_select");
    const mode_select = document.getElementById("mode_select");
    const leaders_mode_label = document.getElementById("leaders_mode_label");
    const hud_score = document.getElementById("hud_score");
    const hud_combo = document.getElementById("hud_combo");
    const hud_time = document.getElementById("hud_time");
    const end_btn = document.getElementById("end_btn");
    const leaderboard_list = document.getElementById("leaderboard_list");
    const leaderboard_empty = document.getElementById("leaderboard_empty");
    const hud_lives = document.getElementById("hud_lives");
    const hud_level = document.getElementById("hud_level");
    const hud_level_name = document.getElementById("hud_level_name");
    const hud_power = document.getElementById("hud_power");
    const overlay = document.getElementById("overlay");
    const overlay_title = document.getElementById("overlay_title");
    const overlay_text = document.getElementById("overlay_text");
    const start_btn = document.getElementById("start_btn");
    const canvas = document.getElementById("game_canvas");

    let current_user = null;
    let overlay_mode = "intro";
    let countdown_number = 3;
    let last_over = null;
    let last_auth_error = "";
    let leaderboard_failed = false;
    let show_leaderboard = localStorage.getItem("xarcanoid_show_board") !== "0";

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
            auth_card.classList.add("signed_in");
            player_name.textContent = current_user.username;
            player_name.classList.remove("hidden");
            auth_form.classList.add("hidden");
            logout_btn.classList.remove("hidden");
        } else {
            auth_card.classList.remove("signed_in");
            player_name.textContent = "";
            player_name.classList.add("hidden");
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
            const diff_key = "diff_tag_" + (entry.difficulty || "standard");
            item.innerHTML =
                '<span class="rank">' + (index + 1) + "</span>" +
                "<span>" + escape_html(entry.username) + "</span>" +
                "<span>" + entry.score + "</span>" +
                '<span class="combo">x' + (entry.max_combo || 0) + "</span>" +
                '<span class="diff_tag">' + escape_html(t(diff_key)) + "</span>";
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
        start_btn.classList.remove("hidden");
        if (overlay_mode === "win" && last_over) {
            overlay_title.textContent = t("win_title");
            overlay_text.textContent = last_over.text;
            start_btn.textContent = t("play_again");
            return;
        }
        if (overlay_mode === "over" && last_over) {
            overlay_title.textContent = t("game_over");
            overlay_text.textContent = last_over.text;
            start_btn.textContent = t("play_again");
            return;
        }
        if (overlay_mode === "pause") {
            overlay_title.textContent = t("paused");
            overlay_text.textContent = t("paused_hint");
            start_btn.classList.add("hidden");
            return;
        }
        if (overlay_mode === "countdown") {
            overlay_title.textContent = String(countdown_number);
            overlay_text.textContent = "";
            start_btn.classList.add("hidden");
            return;
        }
        overlay_title.textContent = "XArcanoid";
        overlay_text.textContent = t("overlay_hint");
        start_btn.textContent = t("play");
    }

    function format_time(seconds) {
        const total = Math.max(0, Math.floor(seconds));
        const minutes = Math.floor(total / 60);
        const rest = total % 60;
        return minutes + ":" + String(rest).padStart(2, "0");
    }

    function apply_language() {
        xarcanoid_i18n.apply();
        leaders_mode_label.textContent = "· " + t("mode_" + mode_select.value);
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
            const payload = await xarcanoid_api.leaderboard(mode_select.value);
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

    function render_audio_buttons() {
        const music_on = xarcanoid_audio.is_music_on();
        const sfx_on = xarcanoid_audio.is_sfx_on();
        [music_btn, settings_music_on].forEach((btn) => {
            btn.classList.toggle("is_off", !music_on);
            btn.setAttribute("aria-pressed", music_on ? "true" : "false");
        });
        [sfx_btn, settings_sfx_on].forEach((btn) => {
            btn.classList.toggle("is_off", !sfx_on);
            btn.setAttribute("aria-pressed", sfx_on ? "true" : "false");
        });
        settings_music_vol.value = String(Math.round(xarcanoid_audio.music_volume() * 100));
        settings_sfx_vol.value = String(Math.round(xarcanoid_audio.sfx_volume() * 100));
        render_board_button();
    }

    function render_board_button() {
        settings_board_on.classList.toggle("is_off", !show_leaderboard);
        settings_board_on.setAttribute("aria-pressed", show_leaderboard ? "true" : "false");
        leaders_card.classList.toggle("hidden", !show_leaderboard);
    }

    function open_modal(modal) {
        help_modal.classList.add("hidden");
        settings_modal.classList.add("hidden");
        modal.classList.remove("hidden");
        xarcanoid_game.pause();
    }

    function close_modals() {
        help_modal.classList.add("hidden");
        settings_modal.classList.add("hidden");
    }

    async function load_changelog() {
        if (changelog_text.dataset.loaded === "1") {
            return;
        }
        changelog_text.textContent = t("guide_log_loading");
        try {
            const response = await fetch("/changelog");
            if (!response.ok) {
                throw new Error("fail");
            }
            changelog_text.textContent = await response.text();
            changelog_text.dataset.loaded = "1";
        } catch (error) {
            changelog_text.textContent = t("guide_log_fail");
        }
    }

    lang_btn.addEventListener("click", () => {
        xarcanoid_i18n.toggle();
        apply_language();
    });

    music_btn.addEventListener("click", () => {
        xarcanoid_audio.unlock();
        xarcanoid_audio.toggle_music();
        if (xarcanoid_audio.is_music_on() && xarcanoid_game.is_running()) {
            xarcanoid_audio.start_music();
        }
        render_audio_buttons();
    });

    sfx_btn.addEventListener("click", () => {
        xarcanoid_audio.unlock();
        xarcanoid_audio.toggle_sfx();
        render_audio_buttons();
    });

    help_btn.addEventListener("click", () => {
        open_modal(help_modal);
        load_changelog();
    });

    settings_btn.addEventListener("click", () => {
        open_modal(settings_modal);
        render_audio_buttons();
    });

    document.querySelectorAll("[data-close]").forEach((node) => {
        node.addEventListener("click", close_modals);
    });

    help_modal.addEventListener("click", (event) => {
        if (event.target === help_modal) {
            close_modals();
        }
    });

    settings_modal.addEventListener("click", (event) => {
        if (event.target === settings_modal) {
            close_modals();
        }
    });

    window.addEventListener("keydown", (event) => {
        if (event.code === "Escape") {
            close_modals();
        }
    });

    settings_music_on.addEventListener("click", () => {
        xarcanoid_audio.unlock();
        xarcanoid_audio.toggle_music();
        if (xarcanoid_audio.is_music_on() && xarcanoid_game.is_running()) {
            xarcanoid_audio.start_music();
        }
        render_audio_buttons();
    });

    settings_sfx_on.addEventListener("click", () => {
        xarcanoid_audio.unlock();
        xarcanoid_audio.toggle_sfx();
        render_audio_buttons();
    });

    settings_board_on.addEventListener("click", () => {
        show_leaderboard = !show_leaderboard;
        localStorage.setItem("xarcanoid_show_board", show_leaderboard ? "1" : "0");
        render_board_button();
    });

    settings_music_vol.addEventListener("input", () => {
        xarcanoid_audio.unlock();
        xarcanoid_audio.set_music_volume(Number(settings_music_vol.value) / 100);
    });

    settings_sfx_vol.addEventListener("input", () => {
        xarcanoid_audio.unlock();
        xarcanoid_audio.set_sfx_volume(Number(settings_sfx_vol.value) / 100);
    });

    document.addEventListener("pointerdown", () => {
        xarcanoid_audio.unlock();
    }, { once: true });

    theme_select.addEventListener("change", () => {
        xarcanoid_themes.apply(theme_select.value);
    });

    difficulty_select.addEventListener("change", () => {
        xarcanoid_game.set_difficulty(difficulty_select.value);
    });

    mode_select.addEventListener("change", () => {
        xarcanoid_game.set_game_mode(mode_select.value);
        leaders_mode_label.textContent = "· " + t("mode_" + mode_select.value);
        refresh_leaderboard();
    });

    hud_score.addEventListener("click", () => {
        xarcanoid_game.debug_clear_stage();
    });

    overlay.addEventListener("click", (event) => {
        if (event.target === start_btn) {
            return;
        }
        if (overlay_mode === "pause") {
            xarcanoid_game.request_resume();
        }
    });

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            xarcanoid_game.pause();
        }
    });

    window.addEventListener("blur", () => {
        xarcanoid_game.pause();
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
        end_btn.classList.remove("hidden");
        xarcanoid_game.set_difficulty(difficulty_select.value);
        xarcanoid_game.set_game_mode(mode_select.value);
        xarcanoid_audio.unlock();
        xarcanoid_audio.set_ducked(false);
        xarcanoid_audio.start_music();
        xarcanoid_game.start();
    });

    end_btn.addEventListener("click", () => {
        xarcanoid_game.end_run();
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
            hud_score.textContent = hud.counts_score ? String(hud.score) : t("score_joke");
            hud_score.classList.toggle("cheat_hint", !hud.counts_score);
            hud_combo.textContent = String(hud.combo);
            hud_time.textContent = format_time(hud.elapsed_s);
            hud_lives.textContent = Number.isFinite(hud.lives) ? String(hud.lives) : "∞";
            hud_level.textContent = String(hud.level);
            hud_level_name.textContent = hud.layout_id ? t("level_" + hud.layout_id) : "";
            if (!hud.powerup) {
                hud_power.textContent = "—";
            } else {
                hud_power.textContent = hud.powerup.split("+").map((kind) => t("power_" + kind)).join(" · ");
            }
        },
        async (result) => {
            end_btn.classList.add("hidden");
            xarcanoid_audio.stop_music();
            xarcanoid_audio.set_ducked(false);
            if (!result.counts_score && !result.campaign_win) {
                show_overlay_over(t("over_practice"));
                return;
            }
            const should_save = result.counts_score && (result.campaign_win || (result.mode === "survival" && !result.won));
            let text = result.campaign_win
                ? t("win_text", { score: result.score })
                : t("over_stats", { score: result.score, level: result.level });
            if (should_save && current_user) {
                try {
                    await xarcanoid_api.submit_score(
                        result.score,
                        result.level,
                        result.max_combo || 0,
                        result.difficulty || "standard",
                        result.mode || "survival",
                    );
                    await refresh_leaderboard();
                    text += t("score_saved");
                } catch (error) {
                    text += t("score_save_fail", { error: translate_error(error.message) });
                }
            } else if (should_save && !current_user) {
                text += t("score_need_login");
            }
            if (result.campaign_win) {
                overlay_mode = "win";
                last_over = { text };
                render_overlay();
                overlay.classList.remove("hidden");
                return;
            }
            show_overlay_over(text);
        },
        (state) => {
            if (state.mode === "paused") {
                overlay_mode = "pause";
                xarcanoid_audio.set_ducked(true);
                render_overlay();
                overlay.classList.remove("hidden");
                return;
            }
            if (state.mode === "countdown") {
                overlay_mode = "countdown";
                countdown_number = state.number;
                render_overlay();
                overlay.classList.remove("hidden");
                return;
            }
            if (state.mode === "off" && (overlay_mode === "pause" || overlay_mode === "countdown")) {
                overlay_mode = "playing";
                xarcanoid_audio.set_ducked(false);
                overlay.classList.add("hidden");
                start_btn.classList.remove("hidden");
            }
        },
    );

    xarcanoid_themes.list.forEach((theme) => {
        const option = document.createElement("option");
        option.value = theme.id;
        option.textContent = theme.name;
        theme_select.appendChild(option);
    });
    const loaded_theme = xarcanoid_themes.load();
    theme_select.value = loaded_theme.id;

    xarcanoid_audio.load();
    render_audio_buttons();
    xarcanoid_game.set_game_mode(mode_select.value);
    xarcanoid_i18n.load();
    apply_language();
    refresh_session().catch((error) => set_auth_error(error.message));
    refresh_leaderboard();
})();
