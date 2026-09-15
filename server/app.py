import os
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory, session
from werkzeug.middleware.proxy_fix import ProxyFix

from server import achievements, auth, db

ROOT_DIR = Path(__file__).resolve().parent.parent
CLIENT_DIR = ROOT_DIR / "client"

MAX_SCORE = 999_999
MAX_LEVEL = 9999
DIFFICULTIES = ("practice", "standard", "overdrive")
MODES = ("campaign", "survival")


def create_app():
    app = Flask(__name__, static_folder=None)
    app.secret_key = os.environ.get("XARCANOID_SECRET", "dev-local-not-secret")
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)
    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
    app.config["SESSION_COOKIE_SECURE"] = os.environ.get("XARCANOID_SECURE", "0") == "1"

    db.init_db()

    def current_user():
        user_id = session.get("user_id")
        if not user_id:
            return None
        return db.find_user_by_id(user_id)

    def json_error(message, status=400):
        return jsonify({"ok": False, "error": message}), status

    @app.get("/api/health")
    def health():
        return jsonify({"ok": True})

    @app.get("/api/me")
    def me():
        user = current_user()
        if not user:
            return jsonify({"ok": True, "user": None})
        return jsonify({"ok": True, "user": {"username": user["username"]}})

    @app.post("/api/register")
    def register():
        payload = request.get_json(silent=True) or {}
        username = (payload.get("username") or "").strip()
        password = payload.get("password") or ""

        if not auth.is_valid_username(username):
            return json_error("invalid_username")
        if not auth.is_valid_password(password):
            return json_error("invalid_password")
        if db.find_user_by_username(username):
            return json_error("username_taken", 409)

        user_id = db.create_user(username, auth.hash_password(password))
        session["user_id"] = user_id
        db.unlock_achievement(user_id, "new_player")
        return jsonify({"ok": True, "user": {"username": username}})

    @app.post("/api/login")
    def login():
        payload = request.get_json(silent=True) or {}
        username = (payload.get("username") or "").strip()
        password = payload.get("password") or ""
        user = db.find_user_by_username(username)

        if not user or not auth.password_matches(user["password_hash"], password):
            return json_error("bad_credentials", 401)

        session["user_id"] = user["id"]
        return jsonify({"ok": True, "user": {"username": user["username"]}})

    @app.post("/api/logout")
    def logout():
        session.clear()
        return jsonify({"ok": True})

    @app.post("/api/score")
    def submit_score():
        user = current_user()
        if not user:
            return json_error("login_required", 401)

        payload = request.get_json(silent=True) or {}
        try:
            score = int(payload.get("score"))
            level = int(payload.get("level", 1))
            max_combo = int(payload.get("max_combo", 0))
        except (TypeError, ValueError):
            return json_error("bad_numbers")

        difficulty = (payload.get("difficulty") or "standard").strip()
        if difficulty not in DIFFICULTIES:
            return json_error("bad_numbers")
        mode = (payload.get("mode") or "survival").strip()
        if mode not in MODES:
            return json_error("bad_numbers")

        if score < 0 or score > MAX_SCORE:
            return json_error("bad_score")
        if level < 1 or level > MAX_LEVEL:
            return json_error("bad_level")
        if max_combo < 0 or max_combo > 9999:
            return json_error("bad_numbers")

        db.insert_score(user["id"], score, level, max_combo, difficulty, mode)
        return jsonify({"ok": True})

    @app.get("/api/leaderboard")
    def leaderboard():
        mode = (request.args.get("mode") or "survival").strip()
        if mode not in MODES:
            return json_error("bad_numbers")
        rows = db.list_leaderboard(10, mode)
        return jsonify({"ok": True, "entries": rows})

    @app.get("/")
    def index():
        return send_from_directory(CLIENT_DIR, "index.html")

    @app.get("/css/<path:name>")
    def css_file(name):
        return send_from_directory(CLIENT_DIR / "css", name)

    @app.get("/js/<path:name>")
    def js_file(name):
        return send_from_directory(CLIENT_DIR / "js", name)

    def maybe_platinum(user_id):
        owned = db.list_unlocks(user_id)
        if all(need in owned for need in achievements.PLATINUM_NEEDS):
            db.unlock_achievement(user_id, "platinum")

    def achievement_payload(user_id):
        db.unlock_achievement(user_id, "new_player")
        maybe_platinum(user_id)
        total = max(1, db.count_users())
        owned = db.list_unlocks(user_id)
        counts = db.unlock_counts()
        items = []
        for ach_id in achievements.CATALOG:
            unlocked = ach_id in owned
            items.append({
                "id": ach_id,
                "unlocked": unlocked,
                "unlocked_at": owned.get(ach_id),
                "hidden": ach_id in achievements.HIDDEN and not unlocked,
                "percent": round(100.0 * counts.get(ach_id, 0) / total, 1),
                "holders": counts.get(ach_id, 0),
                "players": db.count_users(),
            })
        return items

    @app.get("/api/achievements")
    def list_achievements():
        user = current_user()
        if not user:
            return json_error("login_required", 401)
        return jsonify({"ok": True, "items": achievement_payload(user["id"])})

    @app.post("/api/achievements/unlock")
    def unlock_achievement():
        user = current_user()
        if not user:
            return json_error("login_required", 401)
        payload = request.get_json(silent=True) or {}
        ach_id = (payload.get("id") or "").strip()
        if ach_id not in achievements.CATALOG or ach_id == "platinum":
            return json_error("bad_numbers")
        db.unlock_achievement(user["id"], ach_id)
        maybe_platinum(user["id"])
        return jsonify({"ok": True, "items": achievement_payload(user["id"])})

    @app.post("/api/achievements/progress")
    def achievement_progress():
        user = current_user()
        if not user:
            return json_error("login_required", 401)
        payload = request.get_json(silent=True) or {}
        event = (payload.get("event") or "").strip()
        progress = db.get_progress(user["id"])
        if event == "campaign_loss":
            streak = int(progress["campaign_loss_streak"]) + 1
            db.set_progress(user["id"], streak, progress["powerups"])
            if streak >= 5:
                db.unlock_achievement(user["id"], "madness")
        elif event == "campaign_win":
            db.set_progress(user["id"], 0, progress["powerups"])
        elif event == "powerup":
            kind = (payload.get("kind") or "").strip()
            if kind in achievements.POWER_KINDS:
                have = [item for item in (progress["powerups"] or "").split(",") if item]
                if kind not in have:
                    have.append(kind)
                db.set_progress(user["id"], int(progress["campaign_loss_streak"]), ",".join(have))
                if all(item in have for item in achievements.POWER_KINDS):
                    db.unlock_achievement(user["id"], "all_drops")
        maybe_platinum(user["id"])
        return jsonify({"ok": True, "items": achievement_payload(user["id"])})

    @app.get("/changelog")
    def changelog():
        return send_from_directory(ROOT_DIR, "CHANGELOG.md", mimetype="text/plain; charset=utf-8")

    return app


app = create_app()


if __name__ == "__main__":
    host = os.environ.get("XARCANOID_HOST", "127.0.0.1")
    port = int(os.environ.get("XARCANOID_PORT", "8000"))
    debug = os.environ.get("XARCANOID_DEBUG", "1") == "1"
    app.run(host=host, port=port, debug=debug)
