import sqlite3
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"
DB_PATH = DATA_DIR / "xarcanoid.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,
    max_combo INTEGER NOT NULL DEFAULT 0,
    difficulty TEXT NOT NULL DEFAULT 'standard',
    mode TEXT NOT NULL DEFAULT 'survival',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC);

CREATE TABLE IF NOT EXISTS achievement_unlocks (
    user_id INTEGER NOT NULL,
    achievement_id TEXT NOT NULL,
    unlocked_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, achievement_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS user_progress (
    user_id INTEGER PRIMARY KEY,
    campaign_loss_streak INTEGER NOT NULL DEFAULT 0,
    powerups TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (user_id) REFERENCES users(id)
);
"""


def get_connection():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def init_db():
    with get_connection() as connection:
        connection.executescript(SCHEMA)
        columns = [row[1] for row in connection.execute("PRAGMA table_info(scores)")]
        if "max_combo" not in columns:
            connection.execute(
                "ALTER TABLE scores ADD COLUMN max_combo INTEGER NOT NULL DEFAULT 0"
            )
        if "difficulty" not in columns:
            connection.execute(
                "ALTER TABLE scores ADD COLUMN difficulty TEXT NOT NULL DEFAULT 'standard'"
            )
        if "mode" not in columns:
            connection.execute(
                "ALTER TABLE scores ADD COLUMN mode TEXT NOT NULL DEFAULT 'survival'"
            )


def create_user(username, password_hash):
    with get_connection() as connection:
        cursor = connection.execute(
            "INSERT INTO users (username, password_hash) VALUES (?, ?)",
            (username, password_hash),
        )
        return cursor.lastrowid


def find_user_by_username(username):
    with get_connection() as connection:
        row = connection.execute(
            "SELECT id, username, password_hash FROM users WHERE username = ?",
            (username,),
        ).fetchone()
        return dict(row) if row else None


def find_user_by_id(user_id):
    with get_connection() as connection:
        row = connection.execute(
            "SELECT id, username FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
        return dict(row) if row else None


def insert_score(user_id, score, level, max_combo, difficulty, mode):
    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO scores (user_id, score, level, max_combo, difficulty, mode)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (user_id, score, level, max_combo, difficulty, mode),
        )


def list_leaderboard(limit=10, mode="survival"):
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT
                u.username AS username,
                s.score AS score,
                s.level AS level,
                s.max_combo AS max_combo,
                s.difficulty AS difficulty
            FROM scores AS s
            JOIN users AS u ON u.id = s.user_id
            WHERE s.mode = ?
              AND s.id = (
                SELECT s2.id
                FROM scores AS s2
                WHERE s2.user_id = s.user_id
                  AND s2.mode = s.mode
                ORDER BY s2.score DESC, s2.id DESC
                LIMIT 1
            )
            ORDER BY s.score DESC, s.level DESC, u.username ASC
            LIMIT ?
            """,
            (mode, limit),
        ).fetchall()
        return [dict(row) for row in rows]


def count_users():
    with get_connection() as connection:
        row = connection.execute("SELECT COUNT(*) AS n FROM users").fetchone()
        return int(row["n"] if row else 0)


def list_unlocks(user_id):
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT achievement_id, unlocked_at FROM achievement_unlocks WHERE user_id = ?",
            (user_id,),
        ).fetchall()
        return {row["achievement_id"]: row["unlocked_at"] for row in rows}


def unlock_counts():
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT achievement_id, COUNT(*) AS n
            FROM achievement_unlocks
            GROUP BY achievement_id
            """
        ).fetchall()
        return {row["achievement_id"]: int(row["n"]) for row in rows}


def unlock_achievement(user_id, achievement_id):
    with get_connection() as connection:
        connection.execute(
            """
            INSERT OR IGNORE INTO achievement_unlocks (user_id, achievement_id)
            VALUES (?, ?)
            """,
            (user_id, achievement_id),
        )


def get_progress(user_id):
    with get_connection() as connection:
        connection.execute(
            "INSERT OR IGNORE INTO user_progress (user_id) VALUES (?)",
            (user_id,),
        )
        row = connection.execute(
            """
            SELECT campaign_loss_streak, powerups
            FROM user_progress
            WHERE user_id = ?
            """,
            (user_id,),
        ).fetchone()
        if not row:
            return {"campaign_loss_streak": 0, "powerups": ""}
        return dict(row)


def set_progress(user_id, campaign_loss_streak, powerups):
    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO user_progress (user_id, campaign_loss_streak, powerups)
            VALUES (?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                campaign_loss_streak = excluded.campaign_loss_streak,
                powerups = excluded.powerups
            """,
            (user_id, campaign_loss_streak, powerups),
        )
