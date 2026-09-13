const xarcanoid_i18n = {
    lang: "ru",
    storage_key: "xarcanoid_lang",
    strings: {
        ru: {
            player: "Игрок",
            guest_status: "Гость — счёт в таблицу не попадёт",
            signed_in: "Вы вошли как {name}",
            username: "Имя",
            password: "Пароль",
            login: "Войти",
            register: "Регистрация",
            logout: "Выйти",
            leaders: "Лидеры",
            leaderboard_empty: "Пока пусто — сломай пару кирпичей.",
            leaderboard_unavailable: "Таблица пока недоступна.",
            score: "очки",
            lives: "жизни",
            level: "уровень",
            overlay_hint: "Стрелки или A/D — каретка. Пробел — пуск шара.",
            play: "Играть",
            play_again: "Ещё раз",
            game_over: "Игра окончена",
            over_stats: "Счёт {score}, уровень {level}.",
            score_saved: " Результат записан в таблицу.",
            score_save_fail: " Не удалось сохранить: {error}",
            score_need_login: " Войдите, чтобы попасть в лидеры.",
            controls_hint: "Мышь тоже двигает каретку. После проигрыша счёт сохранится, если вы вошли.",
            lang_aria: "Язык",
            invalid_username: "Имя: 3–20 символов, латиница, цифры и _",
            invalid_password: "Пароль: от 4 до 64 символов",
            username_taken: "Такой игрок уже есть",
            bad_credentials: "Неверное имя или пароль",
            login_required: "Нужно войти, чтобы сохранить счёт",
            bad_numbers: "Счёт и уровень должны быть числами",
            bad_score: "Счёт вне допустимого диапазона",
            bad_level: "Уровень вне допустимого диапазона",
            request_failed: "Ошибка запроса",
        },
        en: {
            player: "Player",
            guest_status: "Guest — the score will not be saved",
            signed_in: "Signed in as {name}",
            username: "Username",
            password: "Password",
            login: "Log in",
            register: "Register",
            logout: "Log out",
            leaders: "Leaders",
            leaderboard_empty: "Empty for now — break a few bricks.",
            leaderboard_unavailable: "Leaderboard is unavailable.",
            score: "score",
            lives: "lives",
            level: "level",
            overlay_hint: "Arrows or A/D move the paddle. Space serves the ball.",
            play: "Play",
            play_again: "Play again",
            game_over: "Game over",
            over_stats: "Score {score}, level {level}.",
            score_saved: " Result saved to the board.",
            score_save_fail: " Could not save: {error}",
            score_need_login: " Log in to join the leaders.",
            controls_hint: "The mouse also moves the paddle. After a loss the score is saved if you are signed in.",
            lang_aria: "Language",
            invalid_username: "Name: 3–20 characters, latin letters, digits and _",
            invalid_password: "Password: 4 to 64 characters",
            username_taken: "That player already exists",
            bad_credentials: "Wrong name or password",
            login_required: "Log in to save the score",
            bad_numbers: "Score and level must be numbers",
            bad_score: "Score is out of range",
            bad_level: "Level is out of range",
            request_failed: "Request failed",
        },
    },

    load() {
        const saved = localStorage.getItem(this.storage_key);
        this.lang = saved === "en" || saved === "ru" ? saved : "ru";
        return this.lang;
    },

    set_lang(lang) {
        this.lang = lang === "en" ? "en" : "ru";
        localStorage.setItem(this.storage_key, this.lang);
        this.apply();
    },

    toggle() {
        this.set_lang(this.lang === "ru" ? "en" : "ru");
    },

    t(key, vars) {
        const table = this.strings[this.lang] || this.strings.ru;
        let text = table[key] || this.strings.en[key] || key;
        if (vars) {
            Object.keys(vars).forEach((name) => {
                text = text.replaceAll("{" + name + "}", String(vars[name]));
            });
        }
        return text;
    },

    apply() {
        document.documentElement.lang = this.lang;
        document.querySelectorAll("[data-i18n]").forEach((node) => {
            node.textContent = this.t(node.getAttribute("data-i18n"));
        });
        const lang_btn = document.getElementById("lang_btn");
        if (lang_btn) {
            lang_btn.setAttribute("aria-label", this.t("lang_aria"));
            lang_btn.querySelector("[data-lang='ru']").classList.toggle("active", this.lang === "ru");
            lang_btn.querySelector("[data-lang='en']").classList.toggle("active", this.lang === "en");
        }
    },
};
