const xarcanoid_game = (() => {
    const brick_points = [50, 40, 30, 20, 10];
    const default_theme = {
        bg: "#070b12",
        wall: "#1c2a3d",
        paddle: "#d9e4f5",
        paddle_stripe: "#ff8a3d",
        ball: "#f4fbff",
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

    let width = 720;
    let height = 480;
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
        },
    };

    let selected_difficulty_id = "standard";
    let difficulty = difficulties.standard;
    let score = 0;
    let lives = 3;
    let level = 1;
    let combo = 0;
    let max_combo = 0;
    let elapsed_s = 0;

    let paddle = { x: 0, y: 0, w: 88, h: 12, speed: 460 };
    let ball = { x: 0, y: 0, r: 6, vx: 0, vy: 0, speed: 260 };
    let bricks = [];
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
        canvas.addEventListener("mousemove", on_mouse_move);
        canvas.addEventListener("mouseleave", () => {
            mouse_x = null;
        });
        canvas.addEventListener("click", () => {
            if (running && waiting_serve && pause_state === "off") {
                serve_ball();
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
        lives = difficulty.lives;
        level = 1;
        ball.speed = difficulty.start_speed;
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

    function end_run() {
        if (!running) {
            return;
        }
        finish(false);
    }

    function set_theme(next_theme) {
        theme = next_theme || default_theme;
        if (bricks.length) {
            bricks.forEach((brick, index) => {
                const row = Math.floor(index / 10);
                brick.color = theme.bricks[row] || theme.bricks[0];
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

    function is_running() {
        return running;
    }

    function is_typing_in_field(event) {
        const target = event.target;
        if (!target || typeof target.closest !== "function") {
            return false;
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
            if (waiting_serve) {
                serve_ball();
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

    function on_mouse_move(event) {
        const rect = canvas.getBoundingClientRect();
        const scale = width / rect.width;
        mouse_x = (event.clientX - rect.left) * scale;
    }

    function reset_round(rebuild_bricks) {
        paddle.y = height - 28;
        paddle.x = (width - paddle.w) / 2;
        park_ball();
        if (rebuild_bricks) {
            bricks = build_bricks();
        }
    }

    function park_ball() {
        ball.x = paddle.x + paddle.w / 2;
        ball.y = paddle.y - ball.r - 1;
        ball.vx = 0;
        ball.vy = 0;
        waiting_serve = true;
    }

    function serve_ball() {
        const dir = Math.random() < 0.5 ? -1 : 1;
        const angle = (-Math.PI / 2) + dir * (0.35 + Math.random() * 0.25);
        ball.vx = Math.cos(angle) * ball.speed;
        ball.vy = Math.sin(angle) * ball.speed;
        waiting_serve = false;
    }

    function build_bricks() {
        const rows = 5;
        const cols = 10;
        const top = 48;
        const gap = 4;
        const side = 24;
        const brick_w = (width - side * 2 - gap * (cols - 1)) / cols;
        const brick_h = 18;
        const list = [];
        for (let row = 0; row < rows; row += 1) {
            for (let col = 0; col < cols; col += 1) {
                list.push({
                    x: side + col * (brick_w + gap),
                    y: top + row * (brick_h + gap),
                    w: brick_w,
                    h: brick_h,
                    color: theme.bricks[row] || theme.bricks[0],
                    points: brick_points[row],
                    alive: true,
                });
            }
        }
        return list;
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
        move_paddle(dt);
        if (waiting_serve) {
            park_ball();
            report_hud();
            return;
        }
        elapsed_s += dt;

        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;

        if (ball.x - ball.r < 0) {
            ball.x = ball.r;
            ball.vx *= -1;
        }
        if (ball.x + ball.r > width) {
            ball.x = width - ball.r;
            ball.vx *= -1;
        }
        if (ball.y - ball.r < 0) {
            ball.y = ball.r;
            ball.vy *= -1;
        }

        bounce_paddle();
        bounce_bricks();

        if (ball.y - ball.r > height) {
            combo = 0;
            ball.speed = Math.max(difficulty.start_speed, ball.speed * 0.93);
            if (!Number.isFinite(lives)) {
                park_ball();
                report_hud();
                return;
            }
            lives -= 1;
            report_hud();
            if (lives <= 0) {
                finish(false);
                return;
            }
            waiting_serve = true;
            park_ball();
        }

        if (!bricks.some((brick) => brick.alive)) {
            level += 1;
            apply_speed_gain(24, difficulty.level_speed_cap);
            reset_round(true);
            report_hud();
        }
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
        paddle.x = Math.max(0, Math.min(width - paddle.w, paddle.x));
    }

    function bounce_paddle() {
        if (ball.vy < 0) {
            return;
        }
        const within_x = ball.x + ball.r > paddle.x && ball.x - ball.r < paddle.x + paddle.w;
        const hitting_top = ball.y + ball.r >= paddle.y && ball.y + ball.r <= paddle.y + paddle.h;
        if (!within_x || !hitting_top) {
            return;
        }
        const hit = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
        const clamped = Math.max(-0.85, Math.min(0.85, hit));
        const angle = -Math.PI / 2 + clamped * 1.05;
        combo = 0;
        apply_speed_gain(8, difficulty.hit_speed_cap);
        const speed = ball.speed;
        ball.vx = Math.cos(angle) * speed;
        ball.vy = Math.sin(angle) * speed;
        ball.y = paddle.y - ball.r - 0.5;
        report_hud();
    }

    function bounce_bricks() {
        for (const brick of bricks) {
            if (!brick.alive || !circle_hits_rect(ball, brick)) {
                continue;
            }
            brick.alive = false;
            add_brick_score(brick.points);
            const closest_x = clamp(ball.x, brick.x, brick.x + brick.w);
            const closest_y = clamp(ball.y, brick.y, brick.y + brick.h);
            if (Math.abs(ball.x - closest_x) > Math.abs(ball.y - closest_y)) {
                ball.vx *= -1;
            } else {
                ball.vy *= -1;
            }
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

    function apply_speed_gain(gain, soft_cap) {
        const hard_cap = difficulty.hard_speed_cap;
        if (ball.speed >= hard_cap) {
            return;
        }
        if (ball.speed < soft_cap) {
            const room = soft_cap - ball.speed;
            if (gain <= room) {
                ball.speed += gain;
                return;
            }
            ball.speed = soft_cap;
            gain -= room;
        }
        if (gain <= 0) {
            return;
        }
        ball.speed = Math.min(hard_cap, ball.speed + Math.max(0.35, gain * 0.12));
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
            });
        }
    }

    function draw() {
        if (!ctx) {
            return;
        }
        ctx.fillStyle = theme.bg;
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = theme.wall;
        ctx.strokeRect(0.5, 0.5, width - 1, height - 1);

        for (const brick of bricks) {
            if (!brick.alive) {
                continue;
            }
            ctx.fillStyle = brick.color;
            round_rect(brick.x, brick.y, brick.w, brick.h, 3);
            ctx.fill();
        }

        ctx.fillStyle = theme.paddle;
        round_rect(paddle.x, paddle.y, paddle.w, paddle.h, 6);
        ctx.fill();
        ctx.fillStyle = theme.paddle_stripe;
        ctx.fillRect(paddle.x + 8, paddle.y + 3, paddle.w - 16, 3);

        ctx.beginPath();
        ctx.fillStyle = theme.ball;
        ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
        ctx.fill();
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
    };
})();
