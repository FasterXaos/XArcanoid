#!/usr/bin/env bash
# Run on the Ubuntu VM from the project tree:
#   bash deploy/install.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
USER_NAME="$(id -un)"
GROUP_NAME="$(id -gn)"

if [ ! -f "$ROOT/run.py" ]; then
  echo "Project not found at $ROOT"
  exit 1
fi

render() {
  sed -e "s|__APP_USER__|${USER_NAME}|g" \
      -e "s|__APP_GROUP__|${GROUP_NAME}|g" \
      -e "s|__APP_ROOT__|${ROOT}|g" \
      "$1"
}

sudo apt-get update
sudo apt-get install -y python3-venv python3-pip nginx

python3 -m venv "$ROOT/.venv"
"$ROOT/.venv/bin/pip" install --upgrade pip
"$ROOT/.venv/bin/pip" install -r "$ROOT/requirements.txt"

if [ ! -f "$ROOT/deploy/xarcanoid.env" ]; then
  cp "$ROOT/deploy/xarcanoid.env.example" "$ROOT/deploy/xarcanoid.env"
  echo "Created $ROOT/deploy/xarcanoid.env — set XARCANOID_SECRET before going public."
fi

render "$ROOT/deploy/xarcanoid.service" | sudo tee /etc/systemd/system/xarcanoid.service >/dev/null
sudo systemctl daemon-reload
sudo systemctl enable --now xarcanoid.service

render "$ROOT/deploy/nginx.conf" | sudo tee /etc/nginx/sites-available/xarcanoid >/dev/null
sudo ln -sfn /etc/nginx/sites-available/xarcanoid /etc/nginx/sites-enabled/xarcanoid
if [ -e /etc/nginx/sites-enabled/default ]; then
  sudo rm /etc/nginx/sites-enabled/default
fi
sudo nginx -t
sudo systemctl reload nginx

echo "XArcanoid should be at http://<public-ip>/"
echo "Installed for user ${USER_NAME} from ${ROOT}"
echo "Service status: sudo systemctl status xarcanoid --no-pager"
