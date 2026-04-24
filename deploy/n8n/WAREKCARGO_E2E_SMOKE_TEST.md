# WAREKCARGO_E2E_SMOKE_TEST.md

Dokumen ini menyiapkan uji integrasi end-to-end tanpa mengirim pesan ke gateway WhatsApp live.

## Tujuan
Menguji rangkaian berikut secara aman:
- ERP Hub internal `/api/v1/internal/*`
- workflow n8n canonical inbound/outbound
- callback status notifikasi
- simulasi gateway WhatsApp via mock lokal

## Prinsip aman
- **jangan** pakai gateway WhatsApp live tanpa izin eksplisit
- arahkan `WA_GATEWAY_SEND_URL` ke mock lokal saat smoke test
- pakai app ERP Hub lokal, bukan DB produksi aktif

## 1. Jalankan ERP Hub lokal
Di folder `warekcargo-erp-hub`:

```bash
npm run build
npm run start -- --hostname 0.0.0.0 --port 3000
```

## 2. Jalankan mock WA gateway
Di root repo:

```bash
node deploy/n8n/mock_wa_gateway.mjs
```

Default listen di `http://127.0.0.1:8787`.

## 3. Set env n8n
Arahkan env n8n ke stack lokal:

- `ERP_INTERNAL_BASE_URL=http://127.0.0.1:3000`
- `WA_GATEWAY_SEND_URL=http://127.0.0.1:8787/send`
- `WA_GATEWAY_AUTH_TOKEN=Bearer local-smoke-test`
- `INTERNAL_AUTOMATION_SECRET=<samakan dengan env ERP lokal>`

## 4. Import workflow canonical terbaru
Import:
- `deploy/n8n/warekcargo_inbound_canonical_v1.json`
- `deploy/n8n/warekcargo_notifications_outbound_v1.json`

## 5. Jalankan smoke test inbound

```bash
N8N_INBOUND_WEBHOOK_URL='http://127.0.0.1:5678/webhook/warekcargo-inbound-canonical' \
node deploy/n8n/run_inbound_smoke_test.mjs
```

Yang dicek:
- onboarding reply
- tracking path
- intake satu pesan lengkap
- fallback otomatis bila interpret/internal API gagal

## 6. Jalankan smoke test outbound notifications

```bash
N8N_NOTIFICATIONS_WEBHOOK_URL='http://127.0.0.1:5678/webhook/notifications-outbound' \
node deploy/n8n/run_notifications_smoke_test.mjs
```

Yang dicek:
- item valid masuk jalur `SENT`
- item invalid masuk jalur `SKIPPED`
- callback ke ERP Hub tetap terkirim

## 7. Checklist verifikasi
- mock WA gateway menerima payload yang benar
- phone sudah tersanitasi ke format `62...`
- pesan kosong / nomor invalid tidak dikirim ke gateway
- ERP callback menerima `SENT` atau `SKIPPED` sesuai kasus
- inbound tetap jatuh ke `REPLY_FALLBACK_ADMIN` saat internal call gagal

## 8. Catatan batasan
Batch ini baru menyiapkan **smoke test harness**.
Belum mencakup:
- retry policy berbasis queue/DLQ
- observability production-grade
- multi-turn persistence di n8n
- replay test berbasis fixture provider nyata
