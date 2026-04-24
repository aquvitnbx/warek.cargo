# legacy/

Folder ini menampung artefak historis yang **bukan** baseline aktif WarekCargo.

## Aturan
- jangan pakai isi folder ini untuk deploy baru
- jangan pakai sebagai referensi canonical runtime sekarang
- simpan hanya untuk audit, diff historis, atau forensik rollback

## Struktur
- `legacy/n8n/` → clone workflow lama
- `legacy/sql/` → migration/update lama yang tidak lagi canonical
- `legacy/patches/` → patch script lama
- `legacy/scripts/` → helper script lama
- `legacy/erp-hub/` → file eksperimen lama dari app root

Acuan aktif sekarang tetap:
- `warekcargo_schema_v4.sql`
- `migration_to_schema_v4.sql`
- `deploy/n8n/warekcargo_inbound_canonical_v1.json`
- `deploy/n8n/warekcargo_notifications_outbound_v1.json`
- endpoint `/api/v1/internal/*`
