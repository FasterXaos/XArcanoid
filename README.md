**XArcanoid** 0.8.0

Browser Arkanoid with registration, sessions, and a leaderboard.

- **Windows (dev):** Flask on http://127.0.0.1:8000/
- **Linux VM (public):** gunicorn behind nginx on `http://<public-ip>/`

The API and the client are the same in both cases. nginx only replaces Flask as the public HTTP front door.

## Run on Windows

Python 3.12+ is required. Run these from the project directory.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python run.py
```

Open http://127.0.0.1:8000/

Stop the server with Ctrl+C in the terminal. That process lives only as long as the terminal does.

SQLite creates `data/xarcanoid.db` on first run (not tracked by git).

## Run on a Linux VM

Ubuntu is assumed. `deploy/install.sh` detects the current user and the project path; you do not need to hardcode them.

Inbound TCP 80 and 22 must already be open in the cloud security group.

### 1. Clone from GitHub

On the VM:

```bash
git clone https://github.com/FasterXaos/XArcanoid.git ~/xarcanoid
cd ~/xarcanoid
```

### 2. Install and start

```bash
cd ~/xarcanoid
bash deploy/install.sh
```

The script installs `nginx` and `python3-venv`, creates `.venv`, installs dependencies (including gunicorn), writes a systemd unit and nginx site for this user and path, and points nginx at port 80 (all traffic is proxied to gunicorn).

Then set a real secret:

```bash
nano ~/xarcanoid/deploy/xarcanoid.env
sudo systemctl restart xarcanoid
```

Open `http://<public-ip>/`.

### 3. Useful commands

```bash
sudo systemctl status xarcanoid
sudo systemctl restart xarcanoid
sudo journalctl -u xarcanoid -e
sudo nginx -t && sudo systemctl reload nginx
```

Closing the SSH session does **not** stop the game. systemd keeps gunicorn running in the background, nginx keeps listening on port 80, and neither process has an idle timeout that shuts the site down.

To stop it on purpose:

```bash
sudo systemctl stop xarcanoid
sudo systemctl stop nginx
```

## Controls

- Paddle: arrow keys or A/D, or the mouse over the field
- Space or a click serves the ball from the paddle
- P pauses anytime; Space pauses only while the ball is already flying
- After pause, a 1.5s countdown runs before play continues
- Switching away from the page pauses automatically
- End run stops the current game on any difficulty
- Practice: infinite lives, score is a joke glyph and is not saved
- Standard: current default rules
- Overdrive: 1.5× points, faster ball, one life
- Campaign (ten stages + Core), Survival (endless, boss every 11th), or Sketch (paint your own field)
- Ten named stages on a larger court; after 10 a random layout from the set is picked
- Broken bricks can drop power-ups (W/N/S/F/+/C/$); chance and mix depend on difficulty
- Score uses difficulty, time, stage, remaining lives (fewer lives pay more), and combo; always floored to an integer
- Best combo is stored and shown on the leaderboard
- Timer counts only while the ball is in play
- After a miss the ball loses a little speed; after the usual cap it still creeps up slowly
- Guests can play; only signed-in players are written to the leaderboard
- Language: RU / EN toggle to the left of the field
- Note and speaker buttons toggle a looping chiptune and hit sounds (Web Audio, no files)
- i opens the bilingual guide; the gear opens volume sliders, theme selection, and leaderboard visibility
- Ticker lines live in `client/js/ticker.js` (`xarcanoid_ticker_lines`)
- Themes: Night Arcade (default) and several others in the left panel

## Layout

- `client/` — HTML/CSS/JS, canvas game
- `server/` — Flask API
- `deploy/` — gunicorn systemd unit, nginx site, install script
- API: `/api/register`, `/api/login`, `/api/logout`, `/api/me`, `/api/score`, `/api/leaderboard`

On Linux, gunicorn binds `127.0.0.1:8000` (not reachable from the internet). nginx on port 80 proxies all requests to gunicorn.
