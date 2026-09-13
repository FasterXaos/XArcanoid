(() => {
    const auth_status = document.getElementById("auth_status");
    const auth_form = document.getElementById("auth_form");
    const auth_error = document.getElementById("auth_error");
    const username_input = document.getElementById("username_input");
    const password_input = document.getElementById("password_input");
    const register_btn = document.getElementById("register_btn");
    const logout_btn = document.getElementById("logout_btn");
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

    function set_auth_error(message) {
        auth_error.textContent = message || "";
    }

    function render_auth() {
        if (current_user) {
            auth_status.textContent = "Вы вошли как " + current_user.username;
            auth_status.classList.remove("guest");
            auth_form.classList.add("hidden");
            logout_btn.classList.remove("hidden");
        } else {
            auth_status.textContent = "Гость — счёт в таблицу не попадёт";
            auth_status.classList.add("guest");
            auth_form.classList.remove("hidden");
            logout_btn.classList.add("hidden");
        }
    }

    function render_leaderboard(entries) {
        leaderboard_list.innerHTML = "";
        if (!entries.length) {
            leaderboard_empty.classList.remove("hidden");
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

    async function refresh_session() {
        const payload = await xarcanoid_api.me();
        current_user = payload.user;
        render_auth();
    }

    async function refresh_leaderboard() {
        const payload = await xarcanoid_api.leaderboard();
        render_leaderboard(payload.entries || []);
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
        xarcanoid_game.start();
    });

    function show_overlay(title, text, button_label) {
        overlay_title.textContent = title;
        overlay_text.textContent = text;
        start_btn.textContent = button_label;
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
            let text = "Счёт " + result.score + ", уровень " + result.level + ".";
            if (current_user) {
                try {
                    await xarcanoid_api.submit_score(result.score, result.level);
                    await refresh_leaderboard();
                    text += " Результат записан в таблицу.";
                } catch (error) {
                    text += " Не удалось сохранить: " + error.message;
                }
            } else {
                text += " Войдите, чтобы попасть в лидеры.";
            }
            show_overlay("Игра окончена", text, "Ещё раз");
        },
    );

    refresh_session().catch((error) => set_auth_error(error.message));
    refresh_leaderboard().catch(() => {
        leaderboard_empty.textContent = "Таблица пока недоступна.";
    });
})();
