#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${DB_NAME:-warekcargo_db}"
DB_USER="${DB_USER:-warekcargo_app}"
SCHEMA_FILE="${SCHEMA_FILE:-/home/achmadhbib/.openclaw/workspace/warekcargo_schema_v3.sql}"

if [[ ! -f "${SCHEMA_FILE}" ]]; then
  echo "Schema file tidak ditemukan: ${SCHEMA_FILE}"
  exit 1
fi

sudo -u postgres psql -d "${DB_NAME}" -f "${SCHEMA_FILE}"

echo "Schema v3 berhasil diterapkan ke database ${DB_NAME}."
