**XArcanoid** 0.1.0

Browser Arkanoid with registration, sessions, and a leaderboard. This release runs locally on Flask. The same app is meant to move to a Linux VM later, behind nginx.

## Run on Windows

Python 3.12+ is required.

```powershell
cd C:\go\Projects\XArcanoid
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python run.py
```

Open http://127.0.0.1:8000/

Stop the server with Ctrl+C in the terminal.

SQLite creates `data/xarcanoid.db` on first run (not tracked by git).

## Controls

- Paddle: arrow keys or A/D, or the mouse over the field
- Space or a click on the field serves the ball
- Guests can play; only signed-in players are written to the leaderboard

## Layout

- `client/` — HTML/CSS/JS, canvas game
- `server/` — Flask API and static file serving
- API: `/api/register`, `/api/login`, `/api/logout`, `/api/me`, `/api/score`, `/api/leaderboard`

On Linux later, Flask stays on `127.0.0.1:8000` and nginx listens on port 80. The `/api/...` routes do not change.
