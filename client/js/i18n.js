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
            overlay_hint: "Стрелки или A/D — каретка. Пробел или клик — пуск шара. P — пауза в любой момент, пробел — пауза когда шар уже в полёте.",
            play: "Играть",
            play_again: "Ещё раз",
            game_over: "Игра окончена",
            over_stats: "Счёт {score}, уровень {level}.",
            over_practice: "Тренировка окончена. Счёт не пишется.",
            score_saved: " Результат записан в таблицу.",
            score_save_fail: " Не удалось сохранить: {error}",
            score_need_login: " Войдите, чтобы попасть в лидеры.",
            controls_hint: "Мышь тоже двигает каретку. Пробел пускает шар с каретки и ставит паузу, если шар уже летит.",
            lang_aria: "Язык",
            music_aria: "Музыка",
            sfx_aria: "Звуки",
            theme: "Тема",
            paused: "Пауза",
            paused_hint: "P или пробел — продолжить. После паузы короткий отсчёт.",
            difficulty: "Сложность",
            diff_practice: "Тренировка",
            diff_standard: "Обычная",
            diff_overdrive: "Разгон",
            combo: "комбо",
            time: "время",
            end_run: "Завершить",
            score_joke: "ツ",
            invalid_username: "Имя: 3–20 символов, латиница, цифры и _",
            invalid_password: "Пароль: от 4 до 64 символов",
            username_taken: "Такой игрок уже есть",
            bad_credentials: "Неверное имя или пароль",
            login_required: "Нужно войти, чтобы сохранить счёт",
            bad_numbers: "Счёт и уровень должны быть числами",
            bad_score: "Счёт вне допустимого диапазона",
            bad_level: "Уровень вне допустимого диапазона",
            request_failed: "Ошибка запроса",
            help_aria: "Справка",
            settings_aria: "Настройки",
            close_aria: "Закрыть",
            help_title: "Гайд",
            settings_title: "Настройки",
            settings_music: "Музыка",
            settings_sfx: "Звуки",
            settings_music_vol: "Громкость музыки",
            settings_sfx_vol: "Громкость звуков",
            settings_board: "Таблица лидеров",
            guide_concept_title: "Концепт",
            guide_concept: "XArcanoid — браузерный арканоид. Физика шара считается у вас в клиенте, сервер хранит только аккаунт и таблицу лидеров. Сломай все кирпичи, чтобы перейти на следующий этап; не упусти шар за нижний край в бездну.",
            guide_controls_title: "Управление",
            guide_controls: "Каретка: стрелки или A/D, либо мышь над полем. Пробел или клик по полю запускает шар с каретки. P ставит паузу в любой момент. Пробел ставит паузу, только если шар уже летит. После паузы идёт отсчёт 3-2-1 за 1.5 с. Уход со вкладки тоже ставит паузу. «Завершить» обрывает текущую игру.",
            guide_rules_title: "Правила",
            guide_rules: "Кирпичи дают очки, каретка отбивает шар под углом, зависящим от края удара. Стены и потолок отражают шар, пол — потеря жизни. После промаха скорость чуть падает, но не ниже стартовой для режима. До «мягкого» потолка скорость растёт как обычно; дальше ползёт медленно, чтобы бесконечная игра всё же усложнялась.",
            guide_diff_title: "Сложность",
            guide_diff: "Тренировка: обычная скорость, бесконечные жизни, отсутствие счёта, в таблицу ничего не пишется. Обычная: три жизни, стандартный старт. Разгон: ×1.5 к очкам, шар быстрее, одна жизнь. Сложность применяется с новой игры.",
            guide_score_title: "Счёт и комбо",
            guide_score: "За ломание кирпича: ((очки кирпича + комбо) × сложность × уровень × жизни × время) с округлением вниз. Сложность: тренировка 0, обычная 1, разгон 1.5. Уровень: 1 + 0.15×(этап-1). Жизни: 1 + 0.5/(число жизней) — чем меньше жизней, тем больше прибавка. Время: 1 + секунды/60, таймер идёт только пока шар в полёте. Комбо растёт +1, +2, +3… за кирпичи подряд и сбрасывается от каретки или падения. В таблицу пишется лучший забег и его макс. комбо, только для вошедших игроков.",
            guide_extra_title: "Ещё",
            guide_extra: "Темы и громкость — в шестерёнке. Нота и динамик на панели быстро включают музыку и SFX. Звук синтезируется в браузере, без файлов; браузер может молчать до первого клика. Гость может играть, но рекорд не сохранится.",
            guide_log_title: "Журнал изменений",
            guide_log_loading: "Загрузка журнала…",
            guide_log_fail: "Не удалось загрузить журнал.",
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
            overlay_hint: "Arrows or A/D move the paddle. Space or click serves. P pauses anytime; Space pauses while the ball is in flight.",
            play: "Play",
            play_again: "Play again",
            game_over: "Game over",
            over_stats: "Score {score}, level {level}.",
            over_practice: "Practice over. The score is not saved.",
            score_saved: " Result saved to the board.",
            score_save_fail: " Could not save: {error}",
            score_need_login: " Log in to join the leaders.",
            controls_hint: "The mouse also moves the paddle. Space serves from the paddle and pauses once the ball is flying.",
            lang_aria: "Language",
            music_aria: "Music",
            sfx_aria: "Sound",
            theme: "Theme",
            paused: "Paused",
            paused_hint: "P or Space to continue. A short countdown starts after pause.",
            difficulty: "Difficulty",
            diff_practice: "Practice",
            diff_standard: "Standard",
            diff_overdrive: "Overdrive",
            combo: "combo",
            time: "time",
            end_run: "End run",
            score_joke: "ツ",
            invalid_username: "Name: 3–20 characters, latin letters, digits and _",
            invalid_password: "Password: 4 to 64 characters",
            username_taken: "That player already exists",
            bad_credentials: "Wrong name or password",
            login_required: "Log in to save the score",
            bad_numbers: "Score and level must be numbers",
            bad_score: "Score is out of range",
            bad_level: "Level is out of range",
            request_failed: "Request failed",
            help_aria: "Help",
            settings_aria: "Settings",
            close_aria: "Close",
            help_title: "Guide",
            settings_title: "Settings",
            settings_music: "Music",
            settings_sfx: "Sounds",
            settings_music_vol: "Music volume",
            settings_sfx_vol: "Sound volume",
            settings_board: "Leaderboard",
            guide_concept_title: "Concept",
            guide_concept: "XArcanoid is a browser arkanoid. Ball physics run in your client; the server only stores the account and the leaderboard. Break every brick to reach the next stage; do not let the ball fall off the bottom into the abyss.",
            guide_controls_title: "Controls",
            guide_controls: "Paddle: arrows or A/D, or the mouse over the field. Space or a click on the field serves the ball from the paddle. P pauses at any moment. Space pauses only if the ball is already flying. After pause a 3-2-1 countdown runs for 1.5 s. Leaving the tab also pauses. End run aborts the current game.",
            guide_rules_title: "Rules",
            guide_rules: "Bricks give points; the paddle returns the ball at an angle that depends on which edge you hit. Walls and the ceiling bounce the ball; the floor costs a life. After a miss, speed drops a little, but not below the mode's start speed. Up to the “soft” cap, speed grows as usual; after that it creeps slowly so an endless game still gets harder.",
            guide_diff_title: "Difficulty",
            guide_diff: "Practice: normal speed, infinite lives, no score, nothing is written to the board. Standard: three lives, default start. Overdrive: ×1.5 points, faster ball, one life. Difficulty applies from a new game.",
            guide_score_title: "Score and combo",
            guide_score: "For breaking a brick: ((brick points + combo) × difficulty × level × lives × time), rounded down. Difficulty: practice 0, standard 1, overdrive 1.5. Level: 1 + 0.15×(stage-1). Lives: 1 + 0.5/(life count) — fewer lives, larger bonus. Time: 1 + seconds/60; the timer runs only while the ball is in flight. Combo grows +1, +2, +3… for bricks in a row and resets on the paddle or a fall. The board stores the best run and its max combo, for signed-in players only.",
            guide_extra_title: "Also",
            guide_extra: "Themes and volume live in the gear menu. The note and speaker buttons on the bar toggle music and SFX quickly. Audio is synthesized in the browser; it may stay silent until the first click. Guests can play, but scores are not saved.",
            guide_log_title: "Changelog",
            guide_log_loading: "Loading changelog…",
            guide_log_fail: "Could not load the changelog.",
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
        const music_btn = document.getElementById("music_btn");
        if (music_btn) {
            music_btn.setAttribute("aria-label", this.t("music_aria"));
        }
        const sfx_btn = document.getElementById("sfx_btn");
        if (sfx_btn) {
            sfx_btn.setAttribute("aria-label", this.t("sfx_aria"));
        }
        const help_btn = document.getElementById("help_btn");
        if (help_btn) {
            help_btn.setAttribute("aria-label", this.t("help_aria"));
        }
        const settings_btn = document.getElementById("settings_btn");
        if (settings_btn) {
            settings_btn.setAttribute("aria-label", this.t("settings_aria"));
        }
        const settings_music_on = document.getElementById("settings_music_on");
        if (settings_music_on) {
            settings_music_on.setAttribute("aria-label", this.t("music_aria"));
        }
        const settings_sfx_on = document.getElementById("settings_sfx_on");
        if (settings_sfx_on) {
            settings_sfx_on.setAttribute("aria-label", this.t("sfx_aria"));
        }
        const settings_board_on = document.getElementById("settings_board_on");
        if (settings_board_on) {
            settings_board_on.setAttribute("aria-label", this.t("settings_board"));
        }
        document.querySelectorAll("[data-close]").forEach((node) => {
            node.setAttribute("aria-label", this.t("close_aria"));
        });
    },
};
