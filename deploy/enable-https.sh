#!/usr/bin/env bash
# Enable HTTPS on the VM.
# Browsers stop warning only with a certificate a public CA trusts.
# That needs a domain name pointed at this host:
#   DOMAIN=example.com bash deploy/enable-https.sh
# Without DOMAIN a self-signed cert is installed (browsers still warn).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CERT_DIR="/etc/ssl/xarcanoid"

if [ -n "${DOMAIN:-}" ]; then
  sudo apt-get update
  sudo apt-get install -y certbot python3-certbot-nginx
  sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "admin@${DOMAIN}" || {
    echo "certbot failed; check that $DOMAIN points at this machine and port 80 is open."
    exit 1
  }
  CERT="$CERT_DIR/cert.pem"
  KEY="$CERT_DIR/key.pem"
  if [ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
    CERT="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
    KEY="/etc/letsencrypt/live/${DOMAIN}/privkey.pem"
  fi
else
  sudo mkdir -p "$CERT_DIR"
  sudo openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
    -keyout "$CERT_DIR/key.pem" \
    -out "$CERT_DIR/cert.pem" \
    -subj "/CN=xarcanoid"
  CERT="$CERT_DIR/cert.pem"
  KEY="$CERT_DIR/key.pem"
  echo "Self-signed certificate written. Browsers will still show a warning until you use a domain + Let's Encrypt."
fi

sed -e "s|__SSL_CERT__|${CERT}|g" -e "s|__SSL_KEY__|${KEY}|g" \
  "$ROOT/deploy/nginx-ssl.conf" | sudo tee /etc/nginx/sites-available/xarcanoid >/dev/null
sudo nginx -t
sudo systemctl reload nginx

if [ -f "$ROOT/deploy/xarcanoid.env" ]; then
  if grep -q '^XARCANOID_SECURE=' "$ROOT/deploy/xarcanoid.env"; then
    sed -i 's/^XARCANOID_SECURE=.*/XARCANOID_SECURE=1/' "$ROOT/deploy/xarcanoid.env"
  else
    echo 'XARCANOID_SECURE=1' >> "$ROOT/deploy/xarcanoid.env"
  fi
  sudo systemctl restart xarcanoid
fi

echo "HTTPS is on. Open port 443 in the cloud security group."
