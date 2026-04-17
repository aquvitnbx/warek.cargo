#!/usr/bin/env bash
set -euo pipefail

if ! command -v apt-get >/dev/null 2>&1; then
  echo "Script ini saat ini mendukung host berbasis Debian/Ubuntu (apt-get)."
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib

sudo systemctl enable postgresql
sudo systemctl start postgresql

sudo -u postgres psql -c "SELECT version();"

echo "PostgreSQL berhasil diinstall dan dijalankan."
