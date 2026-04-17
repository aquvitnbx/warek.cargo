#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="${BASE_DIR:-/var/lib/warekcargo}"
APP_USER="${APP_USER:-achmadhbib}"
APP_GROUP="${APP_GROUP:-achmadhbib}"

sudo mkdir -p "${BASE_DIR}/uploads/packages"
sudo mkdir -p "${BASE_DIR}/uploads/payments"
sudo mkdir -p "${BASE_DIR}/logs"
sudo mkdir -p "${BASE_DIR}/backups"

sudo chown -R "${APP_USER}:${APP_GROUP}" "${BASE_DIR}"
sudo chmod -R 755 "${BASE_DIR}"

printf 'Storage WarekCargo siap di: %s\n' "${BASE_DIR}"
printf 'Packages : %s\n' "${BASE_DIR}/uploads/packages"
printf 'Payments : %s\n' "${BASE_DIR}/uploads/payments"
printf 'Logs     : %s\n' "${BASE_DIR}/logs"
printf 'Backups  : %s\n' "${BASE_DIR}/backups"
