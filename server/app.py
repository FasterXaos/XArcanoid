import os
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory, session

from server import auth, db

ROOT_DIR = Path(__file__).resolve().parent.parent
CLIENT_DIR = ROOT_DIR / "client"

MAX_SCORE = 999_999
MAX_LEVEL = 9999
DIFFICULTIES = ("practice", "standard", "overdrive")
MODES = ("campaign", "survival")


def create_app():
    app = Flask(__name__, static_folder=None)
    app.secret_key = os.environ.get("XARCANOID_SECRET", "dev-local-not-secret")
    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
    app.config["SESSION_COOKIE_SECURE"] = False

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
