#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${DB_NAME:-warekcargo_db}"

echo "Checking PostgreSQL database: ${DB_NAME}"
sudo -u postgres psql -d "${DB_NAME}" -c "\dt"
