const xarcanoid_game = (() => {
    const brick_points = [50, 40, 30, 20, 10];
    const default_theme = {
        bg: "#070b12",
        wall: "#1c2a3d",
        frame: "#1c2a3d",
        paddle: "#d9e4f5",
        paddle_glow: "#ffffff",
        paddle_stripe: "#ff8a3d",
        ball: "#f4fbff",
        classic: true,
        bricks: ["#ff5d6c", "#ff8a3d", "#f5d76e", "#6ee7a8", "#3ec6ff"],
    };

    let canvas = null;
    let ctx = null;
    let on_hud = null;
    let on_over = null;
    let on_pause_ui = null;
    let theme = default_theme;
    let pause_state = "off";
    let countdown_left = 0;
    let last_countdown_number = 0;

    let width = 860;
    let height = 560;
    let running = false;
    let waiting_serve = true;
    let last_ts = 0;

    const difficulties = {
        practice: {
            id: "practice",
            lives: Infinity,
            start_speed: 260,
            hit_speed_cap: 460,
            level_speed_cap: 420,
            hard_speed_cap: 960,
            score_mult: 0,
            counts_score: false,
            paddle_width: 108,
            drop_chance: 0.32,
            drop_table: [
                { kind: "wide", weight: 22 },
                { kind: "slow", weight: 18 },
                { kind: "life", weight: 16 },
                { kind: "sticky", weight: 14 },
                { kind: "score", weight: 16 },
                { kind: "dual", weight: 12 },
                { kind: "narrow", weight: 8 },
                { kind: "fast", weight: 6 },
            ],
        },
        standard: {
            id: "standard",
            lives: 3,
            start_speed: 260,
            hit_speed_cap: 460,
            level_speed_cap: 420,
            hard_speed_cap: 960,
            score_mult: 1,
            counts_score: true,
            paddle_width: 88,
            drop_chance: 0.16,
            drop_table: [
                { kind: "wide", weight: 16 },
                { kind: "slow", weight: 14 },
                { kind: "life", weight: 10 },
                { kind: "sticky", weight: 12 },
                { kind: "score", weight: 12 },
                { kind: "dual", weight: 10 },
                { kind: "narrow", weight: 16 },
                { kind: "fast", weight: 20 },
            ],
        },
        overdrive: {
            id: "overdrive",
            lives: 1,
            start_speed: 340,
            hit_speed_cap: 560,
            level_speed_cap: 520,
            hard_speed_cap: 1100,
            score_mult: 1.5,
            counts_score: true,
            paddle_width: 70,
            drop_chance: 0.11,
            drop_table: [
                { kind: "wide", weight: 8 },
                { kind: "slow", weight: 8 },
                { kind: "life", weight: 4 },
                { kind: "sticky", weight: 8 },
                { kind: "score", weight: 10 },
                { kind: "dual", weight: 6 },
                { kind: "narrow", weight: 28 },
                { kind: "fast", weight: 34 },
            ],
        },
    };

    const LEVELS = [
        {
            id: "row",
            map: [
                ".............",
                ".###########.",
                ".###########.",
                ".###########.",
                ".###########.",
                ".###########.",
                ".............",
                ".............",
            ],
        },
        {
            id: "grid",
            map: [
                ".............",
                ".#.#.#.#.#.#.",
                "#.#.#.#.#.#.#",
                ".#.#.#.#.#.#.",
                "#.#.#.#.#.#.#",
                ".#.#.#.#.#.#.",
                "#.#.#.#.#.#.#",
                ".............",
            ],
        },
        {
            id: "gap",
            map: [
                ".............",
                "#####...#####",
                "#####...#####",
                "#####...#####",
                "#####...#####",
                "#####...#####",
                "#####...#####",
                ".............",
            ],
        },
        {
            id: "wedge",
            map: [
                ".............",
                "....#####....",
                "...#######...",
                "..#########..",
                ".###########.",
                "#############",
                ".............",
                ".............",
            ],
        },
        {
            id: "frame",
            map: [
                ".............",
                "#############",
                "#...........#",
                "#...........#",
                "#...........#",
                "#...........#",
                "#############",
                ".............",
            ],
        },
        {
            id: "saw",
            map: [
                ".............",
                "#.##.##.##.##",
                ".##.##.##.##.",
                "#.##.##.##.##",
                ".##.##.##.##.",
                "#.##.##.##.##",
                ".##.##.##.##.",
                ".............",
            ],
        },
        {
            id: "piers",
            map: [
                ".............",
                "###..###..###",
                "###..###..###",
                "###..###..###",
                "###..###..###",
                "###..###..###",
                "###..###..###",
                ".............",
            ],
        },
        {
            id: "shell",
            map: [
                ".............",
                "@@@@@@@@@@@@@",
                "@###########@",
                "@##.......##@",
                "@##.......##@",
                "@###########@",
                "@@@@@@@@@@@@@",
                ".............",
            ],
        },
        {
            id: "lane",
            map: [
                "#####....####",
                "#####....####",
                ".............",
                "####....#####",
                "####....#####",
                ".............",
                "#####....####",
                "#####....####",
            ],
        },
        {
            id: "swarm",
            map: [
                "@.#.@.#.@.#.@",
                ".#@#.#@#.#@#.",
                "@.#.@.#.@.#.@",
                "..@@.##.@@...",
                "...@@.##.@@..",
                "@.#.@.#.@.#.@",
                ".#@#.#@#.#@#.",
                "@.#.@.#.@.#.@",
            ],
        },
    ];

    let selected_difficulty_id = "standard";
    let difficulty = difficulties.standard;
    let score = 0;
    let lives = 3;
    let level = 1;
    let combo = 0;
    let max_combo = 0;
    let elapsed_s = 0;
    let last_hud_second = -1;
    let layout_index = 0;
    let last_layout_index = -1;

    const power_styles = {
        wide: { fill: "#3ec6ff", mark: "W" },
        narrow: { fill: "#ff8a3d", mark: "N" },
        slow: { fill: "#6ee7a8", mark: "S" },
        fast: { fill: "#ff5d6c", mark: "F" },
        life: { fill: "#7cff9a", mark: "+" },
        sticky: { fill: "#c9a6ff", mark: "C" },
        score: { fill: "#f5d76e", mark: "$" },
        dual: { fill: "#e8eef8", mark: "2" },
    };
    const power_duration = 10;

    let paddle = { x: 0, y: 0, w: 88, h: 12, speed: 460 };
    let balls = [];
    let pointer_held = false;
    let bricks = [];
    let drops = [];
    let size_effect = null;
    let sticky_remain = 0;
    let core = null;
    let game_mode = "campaign";
    let editing = false;
    let custom_grid = null;
    let hover_cell = null;
    const BOSS_LOOK = {
        bg: "#16060c",
        wall: "#4a1420",
        frame: "#ff4d6a",
        core: "#ff5d6c",
        glow: "#ffd0d8",
    };
    let keys = { left: false, right: false };
    let mouse_x = null;

    function attach(game_canvas, hud_callback, over_callback, pause_callback) {
        canvas = game_canvas;
        ctx = canvas.getContext("2d");
        width = canvas.width;
        height = canvas.height;
        on_hud = hud_callback;
        on_over = over_callback;
        on_pause_ui = pause_callback;

        window.addEventListener("keydown", on_key_down);
        window.addEventListener("keyup", on_key_up);
        canvas.addEventListener("pointerdown", on_pointer_down);
        canvas.addEventListener("pointermove", on_pointer_move);
        canvas.addEventListener("pointerup", on_pointer_up);
        canvas.addEventListener("pointercancel", on_pointer_up);
        canvas.addEventListener("pointerleave", () => {
            if (!pointer_held) {
                mouse_x = null;
            }
            if (editing) {
                hover_cell = null;
                draw();
            }
        });

        reset_round(true);
        draw();
        report_hud();
    }

    function start() {
        difficulty = difficulties[selected_difficulty_id] || difficulties.standard;
        score = 0;
        combo = 0;
        max_combo = 0;
        elapsed_s = 0;
        last_hud_second = -1;
        last_layout_index = -1;
        core = null;
        lives = difficulty.lives;
        level = 1;
        drops = [];
        size_effect = null;
        sticky_remain = 0;
        paddle.w = difficulty.paddle_width;
        reset_balls();
        running = true;
        waiting_serve = true;
        pause_state = "off";
        countdown_left = 0;
        reset_round(true);
        last_ts = 0;
        report_hud();
        requestAnimationFrame(tick);
    }

    function set_difficulty(id) {
        selected_difficulty_id = difficulties[id] ? id : "standard";
    }

    function set_game_mode(id) {
        if (id === "survival") {
            game_mode = "survival";
        } else if (id === "custom") {
            game_mode = "custom";
        } else {
            game_mode = "campaign";
        }
        if (game_mode === "custom" && !running) {
            enter_editor();
        } else if (game_mode !== "custom") {
            editing = false;
            hover_cell = null;
        }
    }

    function ensure_custom_grid() {
        if (custom_grid) {
            return;
        }
        const grid = grid_metrics();
        custom_grid = [];
        for (let row = 0; row < grid.rows; row += 1) {
            custom_grid.push(Array(grid.cols).fill(0));
        }
    }

    function enter_editor() {
        editing = true;
        running = false;
        core = null;
        drops = [];
        pause_state = "off";
        if (typeof xarcanoid_audio !== "undefined") {
            xarcanoid_audio.set_boss_phase(0);
            xarcanoid_audio.stop_music();
        }
        ensure_custom_grid();
        bricks = build_custom_bricks();
        paddle.w = difficulty.paddle_width;
        paddle.y = bound_bottom() - 20;
        paddle.x = clamp((width - paddle.w) / 2, bound_left(), bound_right() - paddle.w);
        reset_balls();
        draw();
        report_hud();
    }

    function cell_at(mx, my) {
        const grid = grid_metrics();
        const col = Math.floor((mx - grid.side) / (grid.brick_w + grid.gap));
        const row = Math.floor((my - grid.top) / (grid.brick_h + grid.gap));
        if (row < 0 || col < 0 || row >= grid.rows || col >= grid.cols) {
            return null;
        }
        const rect = cell_rect(grid, col, row);
        if (mx > rect.x + rect.w || my > rect.y + rect.h) {
            return null;
        }
        return { row, col };
    }

    function paint_custom_cell(event) {
        const rect = canvas.getBoundingClientRect();
        const mx = (event.clientX - rect.left) * (width / rect.width);
        const my = (event.clientY - rect.top) * (height / rect.height);
        const cell = cell_at(mx, my);
        if (!cell) {
            return;
        }
        ensure_custom_grid();
        custom_grid[cell.row][cell.col] = (custom_grid[cell.row][cell.col] + 1) % 3;
        bricks = build_custom_bricks();
        draw();
    }

    function build_custom_bricks() {
        ensure_custom_grid();
        const grid = grid_metrics();
        const list = [];
        for (let row = 0; row < grid.rows; row += 1) {
            for (let col = 0; col < grid.cols; col += 1) {
                const cell = custom_grid[row][col];
                if (!cell) {
                    continue;
                }
                const rect = cell_rect(grid, col, row);
                const hp = cell === 2 ? 2 : 1;
                list.push({
                    x: rect.x,
                    y: rect.y,
                    w: rect.w,
                    h: rect.h,
                    row,
                    col,
                    hp,
                    color: theme.bricks[row % 5] || theme.bricks[0],
                    points: brick_points[Math.min(row, brick_points.length - 1)] * hp,
                    alive: true,
                });
            }
        }
        return list;
    }

    function start_from_editor() {
        if (game_mode !== "custom") {
            return;
        }
        difficulty = difficulties[selected_difficulty_id] || difficulties.standard;
        score = 0;
        combo = 0;
        max_combo = 0;
        elapsed_s = 0;
        last_hud_second = -1;
        lives = difficulty.lives;
        level = 1;
        drops = [];
        size_effect = null;
        sticky_remain = 0;
        core = null;
        editing = false;
        hover_cell = null;
        paddle.w = difficulty.paddle_width;
        reset_balls();
        bricks = build_custom_bricks();
        paddle.y = bound_bottom() - 20;
        paddle.x = clamp((width - paddle.w) / 2, bound_left(), bound_right() - paddle.w);
        layout_parked();
        running = true;
        waiting_serve = true;
        pause_state = "countdown";
        countdown_left = 1.5;
        last_countdown_number = 0;
        report_countdown();
        report_hud();
        last_ts = 0;
        requestAnimationFrame(tick);
    }

    function is_editing() {
        return editing;
    }

    function debug_clear_stage() {
        if (!running || difficulty.id !== "practice") {
            return;
        }
        drops = [];
        if (core && core.hp > 0) {
            defeat_core();
            return;
        }
        advance_level();
    }

    const FRAME = 6;

    function field_inset() {
        return FRAME;
    }

    function bound_left() {
        return field_inset();
    }

    function bound_right() {
        return width - field_inset();
    }

    function bound_top() {
        return field_inset();
    }

    function bound_bottom() {
        return height - field_inset();
    }

    function is_boss_level(lvl) {
        return lvl > 0 && lvl % 11 === 0;
    }

    function core_max_hp() {
        if (difficulty.id === "practice") {
            return 18;
        }
        if (difficulty.id === "overdrive") {
            return 36;
        }
        return 26;
    }

    function end_run() {
        if (!running) {
            return;
        }
        finish(false);
    }

    function set_theme(next_theme) {
        theme = next_theme || default_theme;
        if (bricks.length) {
            bricks.forEach((brick) => {
                brick.color = theme.bricks[brick.row % 5] || theme.bricks[0];
            });
        }
        draw();
    }

    function pause() {
        if (!running || pause_state !== "off") {
            return;
        }
        pause_state = "paused";
        if (on_pause_ui) {
            on_pause_ui({ mode: "paused" });
        }
    }

    function request_resume() {
        if (!running || pause_state !== "paused") {
            return;
        }
        pause_state = "countdown";
        countdown_left = 1.5;
        last_countdown_number = 0;
        report_countdown();
    }

    function is_paused() {
        return pause_state !== "off";
    }

    function report_countdown() {
        const number = Math.max(1, Math.ceil(countdown_left / 0.5));
        if (number === last_countdown_number) {
            return;
        }
        last_countdown_number = number;
        if (on_pause_ui) {
            on_pause_ui({ mode: "countdown", number });
        }
    }

    function play_sfx(name) {
        if (typeof xarcanoid_audio !== "undefined") {
            xarcanoid_audio.play(name);
        }
    }

    function is_running() {
        return running;
    }

    function is_typing_in_field(event) {
        const target = event.target;
        if (!target || typeof target.closest !== "function") {
            return false;
        }
        if (document.querySelector(".modal:not(.hidden)")) {
            return true;
        }
        return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
    }

    function on_key_down(event) {
        if (is_typing_in_field(event)) {
            return;
        }
        if (event.code === "ArrowLeft" || event.code === "KeyA") {
            keys.left = true;
            mouse_x = null;
            event.preventDefault();
        }
        if (event.code === "ArrowRight" || event.code === "KeyD") {
            keys.right = true;
            mouse_x = null;
            event.preventDefault();
        }
        if (event.code === "KeyP") {
            event.preventDefault();
            toggle_pause_from_key();
            return;
        }
        if (event.code === "Space") {
            event.preventDefault();
            if (!running) {
                return;
            }
            if (pause_state === "countdown") {
                return;
            }
            if (pause_state === "paused") {
                request_resume();
                return;
            }
            if (balls.some((item) => item.parked)) {
                serve_one();
                return;
            }
            pause();
        }
    }

    function toggle_pause_from_key() {
        if (!running || pause_state === "countdown") {
            return;
        }
        if (pause_state === "paused") {
            request_resume();
            return;
        }
        pause();
    }

    function on_key_up(event) {
        if (is_typing_in_field(event)) {
            return;
        }
        if (event.code === "ArrowLeft" || event.code === "KeyA") {
            keys.left = false;
        }
        if (event.code === "ArrowRight" || event.code === "KeyD") {
            keys.right = false;
        }
    }

    function pointer_pos(event) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left) * (width / rect.width),
            y: (event.clientY - rect.top) * (height / rect.height),
        };
    }

    function on_pointer_down(event) {
        if (editing) {
            paint_custom_cell(event);
            return;
        }
        pointer_held = true;
        try {
            canvas.setPointerCapture(event.pointerId);
        } catch (err) {
            // ignore
        }
        const pos = pointer_pos(event);
        mouse_x = pos.x;
        if (running && pause_state === "off" && balls.some((item) => item.parked)) {
            serve_one();
        }
    }

    function on_pointer_move(event) {
        const pos = pointer_pos(event);
        if (editing) {
            hover_cell = cell_at(pos.x, pos.y);
            draw();
            return;
        }
        if (event.pointerType === "mouse" || pointer_held) {
            mouse_x = pos.x;
        }
    }

    function on_pointer_up() {
        pointer_held = false;
    }

    function create_ball(speed) {
        return {
            x: paddle.x + paddle.w / 2,
            y: paddle.y - 7,
            r: 6,
            vx: 0,
            vy: 0,
            speed: speed || difficulty.start_speed,
            parked: true,
            touching_core: false,
        };
    }

    function reset_balls() {
        balls = [create_ball(difficulty.start_speed)];
        layout_parked();
    }

    function layout_parked() {
        const parked = balls.filter((item) => item.parked);
        parked.forEach((item, index) => {
            item.vx = 0;
            item.vy = 0;
            item.x = paddle.x + paddle.w / 2 + (index - (parked.length - 1) / 2) * (item.r * 2.5);
            item.y = paddle.y - item.r - 1;
        });
    }

    function serve_one() {
        const parked = balls.filter((item) => item.parked);
        if (!parked.length) {
            return;
        }
        const item = parked[0];
        const dir = Math.random() < 0.5 ? -1 : 1;
        const angle = (-Math.PI / 2) + dir * (0.35 + Math.random() * 0.25);
        item.parked = false;
        item.vx = Math.cos(angle) * item.speed;
        item.vy = Math.sin(angle) * item.speed;
        waiting_serve = balls.every((entry) => entry.parked);
        play_sfx("serve");
        layout_parked();
    }

    function serve_all() {
        while (balls.some((item) => item.parked)) {
            serve_one();
        }
    }

    function max_ball_speed() {
        let speed = difficulty.start_speed;
        balls.forEach((item) => {
            if (item.speed > speed) {
                speed = item.speed;
            }
        });
        return speed;
    }

    function reset_round(rebuild_bricks) {
        paddle.y = bound_bottom() - 20;
        paddle.x = clamp((width - paddle.w) / 2, bound_left(), bound_right() - paddle.w);
        reset_balls();
        waiting_serve = true;
        if (rebuild_bricks) {
            core = null;
            bricks = build_bricks();
        }
    }

    function choose_layout() {
        if (level <= LEVELS.length) {
            layout_index = level - 1;
        } else if (is_boss_level(level)) {
            layout_index = 0;
        } else {
            let pick = Math.floor(Math.random() * LEVELS.length);
            if (pick === last_layout_index) {
                pick = (pick + 1) % LEVELS.length;
            }
            layout_index = pick;
        }
        last_layout_index = layout_index;
        return LEVELS[layout_index];
    }

    function build_bricks() {
        if (game_mode === "custom") {
            return build_custom_bricks();
        }
        if (is_boss_level(level)) {
            return build_boss();
        }
        if (typeof xarcanoid_audio !== "undefined") {
            xarcanoid_audio.set_boss_phase(0);
        }
        const layout = choose_layout();
        const map = layout.map;
        const rows = map.length;
        const cols = map[0].length;
        const top = 40;
        const gap = 3;
        const side = 22;
        const brick_w = (width - side * 2 - gap * (cols - 1)) / cols;
        const brick_h = 20;
        const list = [];
        for (let row = 0; row < rows; row += 1) {
            const line = map[row];
            for (let col = 0; col < cols; col += 1) {
                const cell = line[col];
                if (cell !== "#" && cell !== "@") {
                    continue;
                }
                const hp = cell === "@" ? 2 : 1;
                list.push({
                    x: side + col * (brick_w + gap),
                    y: top + row * (brick_h + gap),
                    w: brick_w,
                    h: brick_h,
                    row,
                    hp,
                    color: theme.bricks[row % 5] || theme.bricks[0],
                    points: brick_points[Math.min(row, brick_points.length - 1)] * hp,
                    alive: true,
                });
            }
        }
        return list;
    }

    function grid_metrics() {
        const cols = 13;
        const rows = 8;
        const top = 40;
        const gap = 3;
        const side = 22;
        const brick_w = (width - side * 2 - gap * (cols - 1)) / cols;
        const brick_h = 20;
        return { cols, rows, top, gap, side, brick_w, brick_h };
    }

    function cell_rect(grid, col, row) {
        return {
            x: grid.side + col * (grid.brick_w + grid.gap),
            y: grid.top + row * (grid.brick_h + grid.gap),
            w: grid.brick_w,
            h: grid.brick_h,
        };
    }

    function make_shell(kind) {
        const grid = core.grid;
        const list = [];
        for (let row = 2; row <= 5; row += 1) {
            for (let col = 4; col <= 8; col += 1) {
                const in_core = row >= 3 && row <= 4 && col >= 5 && col <= 7;
                if (in_core) {
                    continue;
                }
                const rect = cell_rect(grid, col, row);
                if (rect_near_any_ball(rect, 22)) {
                    continue;
                }
                const hp = kind === "armor" ? 2 : 1;
                list.push({
                    x: rect.x + core.shift,
                    y: rect.y,
                    w: rect.w,
                    h: rect.h,
                    base_x: rect.x,
                    row,
                    col,
                    hp,
                    kind: "shell",
                    color: theme.bricks[row % 5] || theme.bricks[0],
                    points: brick_points[Math.min(row, brick_points.length - 1)] * hp,
                    alive: true,
                });
            }
        }
        return list;
    }

    function build_boss() {
        const grid = grid_metrics();
        const a = cell_rect(grid, 5, 3);
        const b = cell_rect(grid, 7, 4);
        const hp = core_max_hp();
        core = {
            x: a.x,
            y: a.y,
            w: b.x + b.w - a.x,
            h: b.y + b.h - a.y,
            base_x: a.x,
            shift: 0,
            vx: 52,
            hp,
            max_hp: hp,
            hits: 0,
            phase: 1,
            pending_phase: 1,
            spawn_t: 0,
            grid,
        };
        if (typeof xarcanoid_audio !== "undefined") {
            xarcanoid_audio.set_boss_phase(1);
        }
        layout_index = 0;
        last_layout_index = -1;
        return make_shell("normal");
    }

    function desired_boss_phase() {
        const ratio = core.hp / core.max_hp;
        if (ratio <= 6 / 26) {
            return 3;
        }
        if (ratio <= 16 / 26) {
            return 2;
        }
        return 1;
    }

    function boss_shell_box() {
        let min_x = core.x;
        let min_y = core.y;
        let max_x = core.x + core.w;
        let max_y = core.y + core.h;
        bricks.forEach((brick) => {
            if (!brick.alive || brick.kind !== "shell") {
                return;
            }
            min_x = Math.min(min_x, brick.x);
            min_y = Math.min(min_y, brick.y);
            max_x = Math.max(max_x, brick.x + brick.w);
            max_y = Math.max(max_y, brick.y + brick.h);
        });
        const pad = 34;
        return {
            min_x: min_x - pad,
            min_y: min_y - pad,
            max_x: max_x + pad,
            max_y: max_y + pad,
        };
    }

    function item_outside_box(item, box) {
        return item.x + item.r < box.min_x
            || item.x - item.r > box.max_x
            || item.y + item.r < box.min_y
            || item.y - item.r > box.max_y;
    }

    function ball_outside_boss_frame() {
        const box = boss_shell_box();
        return balls.every((item) => item.parked || item_outside_box(item, box));
    }

    function apply_boss_phase() {
        const wanted = desired_boss_phase();
        if (wanted > (core.pending_phase || core.phase)) {
            core.pending_phase = wanted;
        }
        try_apply_boss_phase();
    }

    function try_apply_boss_phase() {
        const wanted = core.pending_phase || core.phase;
        if (wanted <= core.phase) {
            core.pending_phase = core.phase;
            return;
        }
        if (!ball_outside_boss_frame()) {
            return;
        }
        const vx = wanted === 3 ? 120 : 82;
        core.phase = wanted;
        core.pending_phase = wanted;
        core.vx = Math.sign(core.vx || 1) * vx;
        bricks = bricks.filter((brick) => brick.kind === "spawn" && brick.alive).concat(make_shell("armor"));
        clamp_boss_shift();
        sync_boss_positions();
        if (typeof xarcanoid_audio !== "undefined") {
            xarcanoid_audio.set_boss_phase(wanted);
        }
    }

    function drop_from_core() {
        let kind = null;
        if (difficulty.id === "practice") {
            kind = pick_from(["wide", "slow", "life", "sticky", "score"]);
        } else if (difficulty.id === "overdrive") {
            kind = pick_from(["narrow", "fast"]);
        }
        if (!kind) {
            return;
        }
        drops.push({
            kind,
            x: core.x + core.w / 2 - 14,
            y: core.y + core.h,
            w: 28,
            h: 14,
            vy: 108,
        });
    }

    function pick_from(list) {
        return list[Math.floor(Math.random() * list.length)];
    }

    function boss_rail_limits() {
        const gap = 6;
        let min_base = core.base_x;
        let max_base = core.base_x + core.w;
        bricks.forEach((brick) => {
            if (!brick.alive || brick.kind === "spawn" || brick.base_x === undefined) {
                return;
            }
            min_base = Math.min(min_base, brick.base_x);
            max_base = Math.max(max_base, brick.base_x + brick.w);
        });
        return {
            min_shift: bound_left() + gap - min_base,
            max_shift: bound_right() - gap - max_base,
        };
    }

    function clamp_boss_shift() {
        const rail = boss_rail_limits();
        if (rail.min_shift > rail.max_shift) {
            core.shift = (rail.min_shift + rail.max_shift) / 2;
            return "mid";
        }
        if (core.shift <= rail.min_shift) {
            core.shift = rail.min_shift;
            return "left";
        }
        if (core.shift >= rail.max_shift) {
            core.shift = rail.max_shift;
            return "right";
        }
        return "ok";
    }

    function sync_boss_positions() {
        core.x = core.base_x + core.shift;
        bricks.forEach((brick) => {
            if (brick.kind !== "spawn" && brick.base_x !== undefined) {
                brick.x = brick.base_x + core.shift;
            }
        });
    }

    function update_boss(dt) {
        if (!core || core.hp <= 0) {
            return;
        }
        core.shift += core.vx * dt;
        const hit = clamp_boss_shift();
        if (hit === "left") {
            core.vx = Math.abs(core.vx);
        } else if (hit === "right") {
            core.vx = -Math.abs(core.vx);
        }
        sync_boss_positions();
        try_apply_boss_phase();
        if (core.phase >= 3) {
            core.spawn_t += dt;
            if (core.spawn_t >= 1.7) {
                core.spawn_t = 0;
                spawn_boss_guard();
            }
        }
    }

    function spawn_boss_guard() {
        const grid = core.grid;
        const free_rows = [];
        for (let row = 6; row < grid.rows; row += 1) {
            free_rows.push(row);
        }
        if (!free_rows.length) {
            return;
        }
        const row = free_rows[Math.floor(Math.random() * free_rows.length)];
        const col = Math.floor(Math.random() * grid.cols);
        const taken = bricks.some((brick) => brick.alive && brick.row === row && brick.col === col);
        if (taken) {
            return;
        }
        const rect = cell_rect(grid, col, row);
        if (rect_near_any_ball(rect, 22)) {
            return;
        }
        const hp = Math.random() < 0.45 ? 2 : 1;
        bricks.push({
            x: rect.x,
            y: rect.y,
            w: rect.w,
            h: rect.h,
            row,
            col,
            hp,
            kind: "spawn",
            color: theme.bricks[row % 5] || theme.bricks[0],
            points: brick_points[Math.min(row, brick_points.length - 1)] * hp,
            alive: true,
        });
    }

    function rect_near_any_ball(rect, gap) {
        return balls.some((item) => {
            if (item.parked) {
                return false;
            }
            return !(item.x + item.r + gap < rect.x
                || item.x - item.r - gap > rect.x + rect.w
                || item.y + item.r + gap < rect.y
                || item.y - item.r - gap > rect.y + rect.h);
        });
    }

    function bounce_core_item(item) {
        if (!core || core.hp <= 0) {
            return false;
        }
        const hit = circle_hits_rect(item, core);
        if (!hit) {
            item.touching_core = false;
            return false;
        }
        bounce_and_separate(item, core);
        if (item.touching_core) {
            return false;
        }
        item.touching_core = true;
        core.hp -= 1;
        core.hits += 1;
        play_sfx("paddle");
        drop_from_core();
        apply_boss_phase();
        report_hud();
        if (core.hp <= 0) {
            defeat_core();
            return true;
        }
        return false;
    }

    function defeat_core() {
        core = null;
        bricks = [];
        drops = [];
        if (typeof xarcanoid_audio !== "undefined") {
            xarcanoid_audio.set_boss_phase(0);
        }
        if (game_mode === "campaign") {
            finish(true);
            return;
        }
        advance_level();
    }

    function tick(ts) {
        if (!running) {
            return;
        }
        const dt = last_ts ? Math.min(0.032, (ts - last_ts) / 1000) : 0;
        last_ts = ts;
        if (pause_state === "paused") {
            requestAnimationFrame(tick);
            return;
        }
        if (pause_state === "countdown") {
            countdown_left -= dt;
            if (countdown_left <= 0) {
                pause_state = "off";
                if (on_pause_ui) {
                    on_pause_ui({ mode: "off" });
                }
            } else {
                report_countdown();
                requestAnimationFrame(tick);
                return;
            }
        }
        update(dt);
        draw();
        if (running) {
            requestAnimationFrame(tick);
        }
    }

    function update(dt) {
        tick_effects(dt);
        update_drops(dt);
        move_paddle(dt);
        layout_parked();
        const classic_wait = balls.every((item) => item.parked) && sticky_remain <= 0;
        waiting_serve = classic_wait;
        if (classic_wait) {
            return;
        }
        elapsed_s += dt;
        const second = Math.floor(elapsed_s);
        if (second !== last_hud_second) {
            last_hud_second = second;
            report_hud();
        }

        const fallen = [];
        balls.forEach((item) => {
            if (item.parked) {
                return;
            }
            if (step_ball(item, dt)) {
                fallen.push(item);
            }
        });
        if (fallen.length) {
            combo = 0;
            play_sfx("fall");
            balls = balls.filter((item) => fallen.indexOf(item) === -1);
            if (!balls.length) {
                if (!Number.isFinite(lives)) {
                    reset_balls();
                    waiting_serve = true;
                    report_hud();
                    return;
                }
                lives -= 1;
                report_hud();
                if (lives <= 0) {
                    finish(false);
                    return;
                }
                reset_balls();
                waiting_serve = true;
            }
        }
        if (!running) {
            return;
        }
        update_boss(dt);
        if (!running) {
            return;
        }

        if ((!core || core.hp <= 0) && !bricks.some((brick) => brick.alive)) {
            if (game_mode === "custom") {
                finish(true);
                return;
            }
            advance_level();
        }
    }

    function step_ball(item, dt) {
        const dist = Math.hypot(item.vx, item.vy) * dt;
        const steps = Math.max(1, Math.ceil(dist / 5));
        const sdt = dt / steps;
        for (let i = 0; i < steps; i += 1) {
            if (item.parked) {
                return false;
            }
            item.x += item.vx * sdt;
            item.y += item.vy * sdt;
            if (item.x - item.r < bound_left()) {
                item.x = bound_left() + item.r;
                item.vx = Math.abs(item.vx);
                play_sfx("wall");
            }
            if (item.x + item.r > bound_right()) {
                item.x = bound_right() - item.r;
                item.vx = -Math.abs(item.vx);
                play_sfx("wall");
            }
            if (item.y - item.r < bound_top()) {
                item.y = bound_top() + item.r;
                item.vy = Math.abs(item.vy);
                play_sfx("wall");
            }
            bounce_paddle_item(item);
            bounce_bricks_item(item);
            if (bounce_core_item(item)) {
                return false;
            }
            if (item.y + item.r >= bound_bottom()) {
                return true;
            }
        }
        return false;
    }

    function advance_level() {
        if (game_mode === "campaign" && is_boss_level(level)) {
            finish(true);
            return;
        }
        level += 1;
        apply_speed_gain(24, difficulty.level_speed_cap);
        play_sfx("level");
        reset_round(true);
        report_hud();
    }

    function move_paddle(dt) {
        let dir = 0;
        if (keys.left) {
            dir -= 1;
        }
        if (keys.right) {
            dir += 1;
        }
        paddle.x += dir * paddle.speed * dt;
        if (mouse_x !== null && dir === 0) {
            paddle.x = mouse_x - paddle.w / 2;
        }
        paddle.x = Math.max(bound_left(), Math.min(bound_right() - paddle.w, paddle.x));
    }

    function bounce_and_separate(item, rect) {
        const closest_x = clamp(item.x, rect.x, rect.x + rect.w);
        const closest_y = clamp(item.y, rect.y, rect.y + rect.h);
        let dx = item.x - closest_x;
        let dy = item.y - closest_y;
        if (dx === 0 && dy === 0) {
            const left = item.x - rect.x;
            const right = rect.x + rect.w - item.x;
            const top = item.y - rect.y;
            const bottom = rect.y + rect.h - item.y;
            const smallest = Math.min(left, right, top, bottom);
            if (smallest === left) {
                item.x = rect.x - item.r - 0.6;
                item.vx = -Math.abs(item.vx);
            } else if (smallest === right) {
                item.x = rect.x + rect.w + item.r + 0.6;
                item.vx = Math.abs(item.vx);
            } else if (smallest === top) {
                item.y = rect.y - item.r - 0.6;
                item.vy = -Math.abs(item.vy);
            } else {
                item.y = rect.y + rect.h + item.r + 0.6;
                item.vy = Math.abs(item.vy);
            }
            return;
        }
        if (Math.abs(dx) > Math.abs(dy)) {
            item.vx = dx > 0 ? Math.abs(item.vx) : -Math.abs(item.vx);
        } else {
            item.vy = dy > 0 ? Math.abs(item.vy) : -Math.abs(item.vy);
        }
        const dist = Math.hypot(dx, dy) || 1;
        const push = item.r + 0.6 - dist;
        if (push > 0) {
            item.x += (dx / dist) * push;
            item.y += (dy / dist) * push;
        }
    }

    function bounce_paddle_item(item) {
        if (item.parked || item.vy < 0) {
            return;
        }
        const within_x = item.x + item.r > paddle.x && item.x - item.r < paddle.x + paddle.w;
        const hitting_top = item.y + item.r >= paddle.y && item.y + item.r <= paddle.y + paddle.h;
        if (!within_x || !hitting_top) {
            return;
        }
        const hit = (item.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
        const clamped = Math.max(-0.85, Math.min(0.85, hit));
        const angle = -Math.PI / 2 + clamped * 1.05;
        combo = 0;
        play_sfx("paddle");
        if (sticky_remain > 0) {
            item.parked = true;
            layout_parked();
            report_hud();
            return;
        }
        apply_speed_gain(8, difficulty.hit_speed_cap);
        item.speed = max_ball_speed();
        item.vx = Math.cos(angle) * item.speed;
        item.vy = Math.sin(angle) * item.speed;
        item.y = paddle.y - item.r - 0.5;
        report_hud();
    }

    function bounce_bricks_item(item) {
        for (const brick of bricks) {
            if (!brick.alive || !circle_hits_rect(item, brick)) {
                continue;
            }
            if (brick.hp > 1) {
                brick.hp -= 1;
                play_sfx("wall");
            } else {
                brick.alive = false;
                play_sfx("brick");
                add_brick_score(brick.points);
                maybe_drop(brick);
            }
            bounce_and_separate(item, brick);
            report_hud();
            break;
        }
    }

    function circle_hits_rect(circle, rect) {
        const closest_x = clamp(circle.x, rect.x, rect.x + rect.w);
        const closest_y = clamp(circle.y, rect.y, rect.y + rect.h);
        const dx = circle.x - closest_x;
        const dy = circle.y - closest_y;
        return dx * dx + dy * dy <= circle.r * circle.r;
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function pick_drop_kind() {
        const table = difficulty.drop_table || [];
        let total = 0;
        table.forEach((row) => {
            total += row.weight;
        });
        if (total <= 0) {
            return null;
        }
        let roll = Math.random() * total;
        for (const row of table) {
            roll -= row.weight;
            if (roll <= 0) {
                return row.kind;
            }
        }
        return table[table.length - 1].kind;
    }

    function maybe_drop(brick) {
        if (Math.random() > difficulty.drop_chance) {
            return;
        }
        const kind = pick_drop_kind();
        if (!kind) {
            return;
        }
        drops.push({
            kind,
            x: brick.x + brick.w / 2 - 14,
            y: brick.y,
            w: 28,
            h: 14,
            vy: 108,
        });
    }

    function set_paddle_width(next_w) {
        const center = paddle.x + paddle.w / 2;
        paddle.w = clamp(next_w, 48, 168);
        paddle.x = clamp(center - paddle.w / 2, bound_left(), bound_right() - paddle.w);
    }

    function set_ball_speed_now(next_speed) {
        const speed = clamp(next_speed, difficulty.start_speed * 0.7, difficulty.hard_speed_cap);
        balls.forEach((item) => {
            const mag = Math.hypot(item.vx, item.vy);
            item.speed = speed;
            if (mag > 1 && !item.parked) {
                item.vx = (item.vx / mag) * speed;
                item.vy = (item.vy / mag) * speed;
            }
        });
    }

    function apply_power(kind) {
        if (kind === "wide") {
            size_effect = { kind: "wide", remain: power_duration };
            set_paddle_width(difficulty.paddle_width + 36);
            play_sfx("power_good");
            return;
        }
        if (kind === "narrow") {
            size_effect = { kind: "narrow", remain: power_duration };
            set_paddle_width(difficulty.paddle_width - 28);
            play_sfx("power_bad");
            return;
        }
        if (kind === "slow") {
            set_ball_speed_now(max_ball_speed() * 0.82);
            play_sfx("power_good");
            return;
        }
        if (kind === "fast") {
            set_ball_speed_now(max_ball_speed() * 1.18);
            play_sfx("power_bad");
            return;
        }
        if (kind === "dual") {
            const extra = create_ball(max_ball_speed());
            balls.push(extra);
            if (sticky_remain > 0) {
                extra.parked = true;
                layout_parked();
            } else {
                extra.parked = true;
                layout_parked();
                serve_one();
            }
            play_sfx("power_good");
            return;
        }
        if (kind === "life") {
            if (Number.isFinite(lives)) {
                const cap = difficulty.id === "overdrive" ? 2 : 5;
                lives = Math.min(cap, lives + 1);
            }
            play_sfx("power_good");
            return;
        }
        if (kind === "sticky") {
            sticky_remain = power_duration;
            play_sfx("power_good");
            return;
        }
        if (kind === "score") {
            if (difficulty.counts_score) {
                const lives_mult = Number.isFinite(lives) && lives > 0 ? 1 + 0.5 / lives : 1;
                const raw = 80
                    * difficulty.score_mult
                    * (1 + 0.15 * (level - 1))
                    * lives_mult
                    * (1 + elapsed_s / 60);
                score += Math.floor(raw);
            }
            play_sfx("power_good");
        }
    }

    function tick_effects(dt) {
        if (size_effect) {
            size_effect.remain -= dt;
            if (size_effect.remain <= 0) {
                size_effect = null;
                set_paddle_width(difficulty.paddle_width);
                report_hud();
            }
        }
        if (sticky_remain > 0) {
            sticky_remain -= dt;
            if (sticky_remain <= 0) {
                sticky_remain = 0;
                if (balls.some((item) => item.parked)) {
                    serve_all();
                }
                report_hud();
            }
        }
    }

    function update_drops(dt) {
        const kept = [];
        drops.forEach((drop) => {
            drop.y += drop.vy * dt;
            const hit = drop.y + drop.h >= paddle.y
                && drop.y <= paddle.y + paddle.h
                && drop.x + drop.w >= paddle.x
                && drop.x <= paddle.x + paddle.w;
            if (hit) {
                apply_power(drop.kind);
                report_hud();
                return;
            }
            if (drop.y + drop.h < bound_bottom()) {
                kept.push(drop);
            }
        });
        drops = kept;
    }

    function active_power_label() {
        const parts = [];
        if (size_effect) {
            parts.push(size_effect.kind);
        }
        if (sticky_remain > 0) {
            parts.push("sticky");
        }
        return parts.join("+");
    }

    function apply_speed_gain(gain, soft_cap) {
        let speed = max_ball_speed();
        const hard_cap = difficulty.hard_speed_cap;
        if (speed >= hard_cap) {
            return;
        }
        if (speed < soft_cap) {
            const room = soft_cap - speed;
            if (gain <= room) {
                speed += gain;
            } else {
                speed = soft_cap;
                gain -= room;
                if (gain > 0) {
                    speed = Math.min(hard_cap, speed + Math.max(0.35, gain * 0.12));
                }
            }
        } else {
            speed = Math.min(hard_cap, speed + Math.max(0.35, gain * 0.12));
        }
        balls.forEach((item) => {
            const mag = Math.hypot(item.vx, item.vy);
            item.speed = speed;
            if (mag > 1 && !item.parked) {
                item.vx = (item.vx / mag) * speed;
                item.vy = (item.vy / mag) * speed;
            }
        });
    }

    function add_brick_score(base_points) {
        combo += 1;
        if (combo > max_combo) {
            max_combo = combo;
        }
        if (!difficulty.counts_score) {
            return;
        }
        const base = base_points + combo;
        const lives_mult = Number.isFinite(lives) && lives > 0 ? 1 + 0.5 / lives : 1;
        const raw = base
            * difficulty.score_mult
            * (1 + 0.15 * (level - 1))
            * lives_mult
            * (1 + elapsed_s / 60);
        score += Math.floor(raw);
    }

    function finish(won) {
        running = false;
        waiting_serve = true;
        pause_state = "off";
        drops = [];
        if (game_mode === "custom") {
            enter_editor();
        }
        size_effect = null;
        sticky_remain = 0;
        play_sfx(won ? "level" : "over");
        draw();
        if (on_over) {
            on_over({
                won,
                score,
                level,
                lives,
                counts_score: difficulty.counts_score,
                difficulty: difficulty.id,
                max_combo,
                mode: game_mode,
                campaign_win: Boolean(won && game_mode === "campaign"),
            });
        }
    }

    function report_hud() {
        if (on_hud) {
            on_hud({
                score,
                lives,
                level,
                combo,
                max_combo,
                elapsed_s,
                counts_score: difficulty.counts_score,
                powerup: active_power_label(),
                layout_id: core ? "core" : LEVELS[layout_index].id,
            });
        }
    }

    function draw_core() {
        round_rect(core.x, core.y, core.w, core.h, 8);
        ctx.fillStyle = BOSS_LOOK.core;
        ctx.fill();
        const hurt = 1 - core.hp / core.max_hp;
        ctx.fillStyle = "rgba(40, 0, 8, " + (hurt * 0.45).toFixed(3) + ")";
        round_rect(core.x, core.y, core.w, core.h, 8);
        ctx.fill();
        ctx.fillStyle = BOSS_LOOK.glow;
        ctx.globalAlpha = 0.28 * (1 - hurt * 0.7);
        round_rect(core.x + 6, core.y + 4, core.w - 12, 7, 4);
        ctx.fill();
        ctx.globalAlpha = 1;

        const cracks = [
            [[0, 0], [0.12, -0.28], [0.08, -0.52], [0.22, -0.78]],
            [[0, 0], [-0.18, -0.2], [-0.42, -0.18], [-0.7, -0.4]],
            [[0, 0], [0.2, 0.1], [0.48, 0.22], [0.72, 0.08], [0.88, 0.35]],
            [[0, 0], [-0.05, 0.25], [0.1, 0.48], [-0.15, 0.72]],
            [[0, 0], [-0.3, 0.15], [-0.55, 0.42], [-0.8, 0.3]],
            [[0, 0], [0.28, -0.05], [0.45, -0.32], [0.68, -0.55]],
            [[0, 0], [-0.22, 0.35], [-0.12, 0.62], [-0.4, 0.85]],
            [[0, 0], [0.15, 0.4], [0.38, 0.55], [0.2, 0.82]],
            [[0, 0], [0.35, 0.28], [0.62, 0.5]],
            [[0, 0], [-0.38, -0.45], [-0.2, -0.75]],
        ];
        const shown = hurt * cracks.length;
        ctx.save();
        round_rect(core.x, core.y, core.w, core.h, 8);
        ctx.clip();
        ctx.strokeStyle = "rgba(18, 2, 6, 0.9)";
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        const cx = core.x + core.w / 2;
        const cy = core.y + core.h / 2;
        cracks.forEach((path, index) => {
            const vis = clamp(shown - index, 0, 1);
            if (vis <= 0) {
                return;
            }
            ctx.lineWidth = 1.2 + hurt * 1.4;
            ctx.beginPath();
            path.forEach((point, p) => {
                const t = p / Math.max(1, path.length - 1);
                if (t > vis) {
                    return;
                }
                const x = cx + point[0] * core.w * vis;
                const y = cy + point[1] * core.h * vis;
                if (p === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();
        });
        ctx.restore();
    }

    function draw() {
        if (!ctx) {
            return;
        }
        const look = core ? BOSS_LOOK : theme;
        ctx.fillStyle = look.bg;
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = look.frame || look.wall;
        ctx.lineWidth = FRAME;
        ctx.strokeRect(FRAME / 2, FRAME / 2, width - FRAME, height - FRAME);

        if (editing) {
            const grid = grid_metrics();
            ctx.strokeStyle = "rgba(180, 200, 220, 0.35)";
            ctx.lineWidth = 1;
            for (let row = 0; row < grid.rows; row += 1) {
                for (let col = 0; col < grid.cols; col += 1) {
                    const rect = cell_rect(grid, col, row);
                    ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);
                }
            }
            if (hover_cell) {
                const rect = cell_rect(grid, hover_cell.col, hover_cell.row);
                ctx.fillStyle = "rgba(62, 198, 255, 0.22)";
                ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
            }
        }

        for (const brick of bricks) {
            if (!brick.alive) {
                continue;
            }
            ctx.fillStyle = brick.color;
            round_rect(brick.x, brick.y, brick.w, brick.h, 3);
            ctx.fill();
            if (brick.hp > 1) {
                ctx.fillStyle = "rgba(255, 255, 255, 0.38)";
                round_rect(brick.x + 1, brick.y + 1, brick.w - 2, brick.h - 2, 2);
                ctx.fill();
            }
            ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
            ctx.fillRect(brick.x + 2, brick.y + 2, brick.w - 4, 3);
        }

        if (core && core.hp > 0) {
            draw_core();
        }

        ctx.fillStyle = theme.paddle;
        round_rect(paddle.x, paddle.y, paddle.w, paddle.h, 6);
        ctx.fill();
        ctx.fillStyle = theme.paddle_glow || "#ffffff";
        ctx.globalAlpha = 0.55;
        ctx.fillRect(paddle.x + 8, paddle.y + 2, paddle.w - 16, 3);
        ctx.globalAlpha = 1;
        ctx.fillStyle = theme.paddle_stripe;
        ctx.fillRect(paddle.x + 10, paddle.y + 6, paddle.w - 20, 2);

        ctx.save();
        ctx.beginPath();
        ctx.rect(bound_left(), bound_top(), bound_right() - bound_left(), bound_bottom() - bound_top());
        ctx.clip();
        drops.forEach((drop) => {
            const style = power_styles[drop.kind] || power_styles.score;
            ctx.fillStyle = style.fill;
            round_rect(drop.x, drop.y, drop.w, drop.h, 7);
            ctx.fill();
            ctx.fillStyle = "#141414";
            ctx.font = "bold 11px Segoe UI, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(style.mark, drop.x + drop.w / 2, drop.y + drop.h / 2 + 0.5);
        });
        balls.forEach((item) => {
            ctx.beginPath();
            ctx.fillStyle = theme.ball;
            ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = theme.paddle_glow || "#ffffff";
            ctx.globalAlpha = 0.45;
            ctx.beginPath();
            ctx.arc(item.x - 1.5, item.y - 1.5, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });
        ctx.restore();
    }

    function round_rect(x, y, w, h, r) {
        const radius = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + w, y, x + w, y + h, radius);
        ctx.arcTo(x + w, y + h, x, y + h, radius);
        ctx.arcTo(x, y + h, x, y, radius);
        ctx.arcTo(x, y, x + w, y, radius);
        ctx.closePath();
    }

    return {
        attach,
        start,
        end_run,
        is_running,
        pause,
        request_resume,
        is_paused,
        set_theme,
        set_difficulty,
        set_game_mode,
        debug_clear_stage,
        enter_editor,
        start_from_editor,
        is_editing,
        ticker_state() {
            return {
                boss: Boolean(core && core.hp > 0),
                boss_phase: core ? core.phase : 0,
                difficulty: difficulty.id,
                mode: game_mode,
                running,
            };
        },
    };
})();
