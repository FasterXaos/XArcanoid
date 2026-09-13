**XArcanoid** 0.2.0

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
- Space or a click on the field serves the ball
- Guests can play; only signed-in players are written to the leaderboard

## Layout

- `client/` — HTML/CSS/JS, canvas game
- `server/` — Flask API
- `deploy/` — gunicorn systemd unit, nginx site, install script
- API: `/api/register`, `/api/login`, `/api/logout`, `/api/me`, `/api/score`, `/api/leaderboard`

On Linux, gunicorn binds `127.0.0.1:8000` (not reachable from the internet). nginx on port 80 proxies all requests to gunicorn.
