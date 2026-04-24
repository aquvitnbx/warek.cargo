# WAREKCARGO_CANONICAL_WORKFLOWS.md

Dokumen ini adalah acuan workflow n8n canonical baru setelah cleanup fondasi teknis WarekCargo.

## File acuan utama
- `warekcargo_inbound_canonical_v1.json`
- `warekcargo_notifications_outbound_v1.json`

## Prinsip desain
- memakai endpoint app internal: `/api/v1/internal/*`
- memakai header auth: `x-internal-api-key`
- memakai secret: `INTERNAL_AUTOMATION_SECRET`
- tidak memakai `/api/v1/nala/*`
- tidak memakai `x-nala-api-key`
- tidak memakai `NALA_API_SECRET`
- tidak mengasumsikan `nala_chat_sessions`
- parser berjalan deterministic di ERP Hub, bukan AI resident di app

---

## 1. Workflow inbound canonical v1

### Tujuan
Menangani inbound WhatsApp text untuk:
- onboarding
- intake paket
- tracking
- clarification
- fallback admin

### Jalur utama
1. terima webhook dari gateway
2. normalisasi envelope
3. pre-filter pesan non-text / group / fromMe
4. sanitasi phone
5. ambil session context ringan dari endpoint internal
6. kirim pesan ke endpoint interpret internal
7. switch berdasarkan `recommended_action`
8. untuk `PROCEED_TO_INTAKE` → panggil endpoint intake internal
9. untuk `PROCEED_TO_LOOKUP` → panggil endpoint tracking internal
10. kirim balasan ke gateway WhatsApp

### Catatan penting
Workflow ini sengaja **stateless-first**.

Hardening batch ini menambah guardrail berikut:
- normalisasi envelope dibuat lebih toleran terhadap variasi payload gateway
- panggilan `session`, `interpret`, dan reply utama memakai timeout
- kegagalan `session` / `interpret` tidak lagi mematikan flow; jalurnya turun ke fallback aman
- hasil interpret yang kosong/aneh di-unwarp ke `REPLY_FALLBACK_ADMIN`

Artinya:
- n8n tidak menyimpan partial multi-turn session di workflow v1 ini
- endpoint `internal/session` saat ini hanya memberi context customer dikenali + bypass status
- kalau nanti butuh multi-turn intake yang benar-benar persisten, state harus dimiliki oleh n8n sendiri (mis. Data Store / tabel orchestration terpisah)

Jadi workflow v1 ini paling cocok untuk:
- pesan yang relatif lengkap dalam satu kiriman
- lookup resi
- onboarding dan klarifikasi sederhana
- fondasi canonical yang bersih sebelum flow lebih canggih dibuat

---

## 2. Workflow outbound notifications v1

### Tujuan
Menerima trigger notifikasi dari ERP Hub, meneruskan ke gateway WhatsApp, lalu callback ke ERP Hub untuk update status `notifications_log`.

### Jalur utama
1. webhook `notifications-outbound`
2. expand array `messages`
3. kirim satu per satu ke gateway WhatsApp
4. callback ke `/api/v1/internal/notifications/callback`

### Catatan penting
Versi v1 ini masih sengaja kecil, tetapi sekarang lebih keras dari draft awal:
- nomor tujuan dan isi pesan disanitasi lebih dulu
- item outbound invalid tidak dikirim ke gateway dan ditandai `SKIPPED`
- request ke gateway memakai timeout
- callback ke ERP tetap dikirim untuk jalur `SENT`, `FAILED`, maupun `SKIPPED`
- node kirim ke gateway tidak lagi menjadi single point of failure untuk callback status

Yang masih belum ada dan tetap jadi backlog:
- retry policy yang matang
- DLQ / dead-letter
- alerting dan observability terpisah
- batching provider yang lebih efisien

---

## 3. Environment yang dibutuhkan di n8n
Minimal set env berikut:

- `ERP_INTERNAL_BASE_URL`
  - contoh: `http://172.17.0.1:3000`
- `INTERNAL_AUTOMATION_SECRET`
  - harus sama dengan env app ERP Hub
- `WA_GATEWAY_SEND_URL`
  - URL HTTP send-message provider/gateway
- `WA_GATEWAY_AUTH_TOKEN`
  - token auth provider/gateway

Opsional bila nanti ada pengembangan:
- `WAREKCARGO_ADMIN_HANDOFF_URL`
- `WAREKCARGO_FAQ_URL`
- env label/alamat hub per kota

---

## 4. Urutan implementasi yang disarankan
1. import workflow outbound dulu
2. import workflow inbound canonical
3. isi env yang dibutuhkan
4. uji inbound text sederhana
5. uji lookup resi
6. uji intake satu pesan lengkap
7. uji trigger notification outbound dari app
8. jalankan smoke harness aman via `WAREKCARGO_E2E_SMOKE_TEST.md`

---

## 5. Yang sengaja belum dimasukkan
Belum saya masukkan ke workflow canonical v1:
- AI parser eksternal
- penyimpanan partial multi-turn session di n8n
- retry policy provider yang matang
- observability terpisah (alerting, DLQ, dead-letter)
- handoff admin yang kaya konteks

Ini sengaja, supaya baseline awal tetap kecil, bersih, dan tidak kembali ke kompleksitas Nala lama.
