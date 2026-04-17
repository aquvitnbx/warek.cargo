#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${DB_NAME:-warekcargo_db}"
DB_USER="${DB_USER:-warekcargo_app}"
DB_PASSWORD="${DB_PASSWORD:-change_me_secure_password}"

sudo -u postgres psql <<SQL
DO
\$\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
      CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASSWORD}';
   END IF;
END
\$\$;
SQL

if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
  sudo -u postgres createdb "${DB_NAME}"
fi

sudo -u postgres psql <<SQL
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
SQL

sudo -u postgres psql -d "${DB_NAME}" <<SQL
GRANT USAGE, CREATE ON SCHEMA public TO ${DB_USER};
ALTER SCHEMA public OWNER TO ${DB_USER};
SQL

echo "Database ${DB_NAME} dan user ${DB_USER} siap digunakan."
