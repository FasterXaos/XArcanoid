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
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC);
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


def insert_score(user_id, score, level, max_combo):
    with get_connection() as connection:
        connection.execute(
            "INSERT INTO scores (user_id, score, level, max_combo) VALUES (?, ?, ?, ?)",
            (user_id, score, level, max_combo),
        )


def list_leaderboard(limit=10):
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT
                u.username AS username,
                best.score AS score,
                MAX(s.level) AS level,
                MAX(s.max_combo) AS max_combo
            FROM scores AS s
            JOIN users AS u ON u.id = s.user_id
            JOIN (
                SELECT user_id, MAX(score) AS score
                FROM scores
                GROUP BY user_id
            ) AS best ON best.user_id = s.user_id AND best.score = s.score
            GROUP BY u.id, u.username, best.score
            ORDER BY best.score DESC, level DESC, u.username ASC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
        return [dict(row) for row in rows]
