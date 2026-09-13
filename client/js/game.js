const xarcanoid_game = (() => {
    const brick_colors = ["#ff5d6c", "#ff8a3d", "#f5d76e", "#6ee7a8", "#3ec6ff"];
    const brick_points = [50, 40, 30, 20, 10];

    let canvas = null;
    let ctx = null;
    let on_hud = null;
    let on_over = null;

    let width = 720;
    let height = 480;
    let running = false;
    let waiting_serve = true;
    let last_ts = 0;

    let score = 0;
    let lives = 3;
    let level = 1;

    let paddle = { x: 0, y: 0, w: 88, h: 12, speed: 460 };
    let ball = { x: 0, y: 0, r: 6, vx: 0, vy: 0, speed: 260 };
    let bricks = [];
    let keys = { left: false, right: false };
    let mouse_x = null;

    function attach(game_canvas, hud_callback, over_callback) {
        canvas = game_canvas;
        ctx = canvas.getContext("2d");
        width = canvas.width;
        height = canvas.height;
        on_hud = hud_callback;
        on_over = over_callback;

        window.addEventListener("keydown", on_key_down);
        window.addEventListener("keyup", on_key_up);
        canvas.addEventListener("mousemove", on_mouse_move);
        canvas.addEventListener("mouseleave", () => {
            mouse_x = null;
        });
        canvas.addEventListener("click", () => {
            if (running && waiting_serve) {
                serve_ball();
            }
        });

        reset_round(true);
        draw();
        report_hud();
    }

    function start() {
        score = 0;
        lives = 3;
        level = 1;
        ball.speed = 260;
        running = true;
        waiting_serve = true;
        reset_round(true);
        last_ts = 0;
        report_hud();
        requestAnimationFrame(tick);
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
        if (event.code === "Space") {
            event.preventDefault();
            if (running && waiting_serve) {
                serve_ball();
            }
        }
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
                    color: brick_colors[row],
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
            return;
        }

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
            ball.speed = Math.min(420, ball.speed + 24);
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
        const speed = Math.min(ball.speed + 8, 460);
        ball.speed = speed;
        ball.vx = Math.cos(angle) * speed;
        ball.vy = Math.sin(angle) * speed;
        ball.y = paddle.y - ball.r - 0.5;
    }

    function bounce_bricks() {
        for (const brick of bricks) {
            if (!brick.alive || !circle_hits_rect(ball, brick)) {
                continue;
            }
            brick.alive = false;
            score += brick.points;
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

    function finish(won) {
        running = false;
        waiting_serve = true;
        draw();
        if (on_over) {
            on_over({ won, score, level, lives });
        }
    }

    function report_hud() {
        if (on_hud) {
            on_hud({ score, lives, level });
        }
    }

    function draw() {
        if (!ctx) {
            return;
        }
        ctx.fillStyle = "#070b12";
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = "#1c2a3d";
        ctx.strokeRect(0.5, 0.5, width - 1, height - 1);

        for (const brick of bricks) {
            if (!brick.alive) {
                continue;
            }
            ctx.fillStyle = brick.color;
            round_rect(brick.x, brick.y, brick.w, brick.h, 3);
            ctx.fill();
        }

        ctx.fillStyle = "#d9e4f5";
        round_rect(paddle.x, paddle.y, paddle.w, paddle.h, 6);
        ctx.fill();
        ctx.fillStyle = "#ff8a3d";
        ctx.fillRect(paddle.x + 8, paddle.y + 3, paddle.w - 16, 3);

        ctx.beginPath();
        ctx.fillStyle = "#f4fbff";
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

    return { attach, start, is_running };
})();
