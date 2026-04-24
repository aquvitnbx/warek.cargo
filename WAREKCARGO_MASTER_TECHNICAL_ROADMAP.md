# WAREKCARGO_MASTER_TECHNICAL_ROADMAP.md

## Tujuan Utama
Merapikan fondasi teknis WarekCargo terlebih dahulu, lalu membangun otomasi komunikasi yang lebih bersih di atas fondasi itu.

## Status Proyek Saat Ini
WarekCargo masih berada pada tahap **pembangunan / pre-production** dan belum dipakai pada operasi usaha real.

Konsekuensinya:
- kita boleh lebih tegas melakukan cleanup struktural
- backward compatibility hanya dijaga saat benar-benar mengurangi risiko transisi
- prioritas utama adalah kualitas fondasi, bukan akomodasi warisan sementara

Target akhirnya adalah:
- VPS hanya menjalankan **PostgreSQL + n8n + WhatsApp gateway + ERP Hub Next.js**
- **Tidak ada layer Nala / AI agent resident di VPS**
- Jika AI dipakai, posisinya adalah **API eksternal** yang dipanggil dari otomasi, bukan bagian inti aplikasi ERP
- Semua workflow operasional memakai **schema canonical, taxonomy status canonical, dan endpoint internal yang bersih**

---

## Prinsip Eksekusi
1. **Rapikan dulu, baru otomatisasi**
2. **Replace first, remove second**
3. **Satu schema canonical**
4. **Satu bahasa status** untuk DB, UI, server actions, dan workflow
5. **AI bersifat opsional**, bukan inti sistem
6. **Deterministic flow dulu, AI hanya untuk kasus ambigu**

---

## Arsitektur Final yang Ditargetkan

### Lokal
- OpenClaw / agent / kecerdasan kerja
- analisis, audit, perencanaan, dan kontrol operasional oleh Habib dari komputer lokal

### VPS
- PostgreSQL
- n8n
- WhatsApp gateway
- ERP Hub Next.js
- koneksi ke API eksternal bila memang diperlukan oleh automation flow

### Bukan lagi bagian VPS
- Nala sebagai persona/runtime internal
- endpoint `/api/v1/nala/*`
- session AI internal berbasis `nala_chat_sessions`
- secret `NALA_API_SECRET`
- dependency AI langsung di ERP Hub untuk flow produksi
- fallback runtime `NALA_API_SECRET` / `x-nala-api-key` di code aplikasi

---

# FASE ROADMAP

## FASE 1 — Foundation Freeze
**Tujuan:** mengunci fondasi teknis supaya semua perbaikan berikutnya tidak bergerak di atas asumsi yang berubah-ubah.

### Fokus
- finalkan boundary arsitektur baru
- finalkan taxonomy status canonical
- petakan objek yang tetap dipakai vs yang akan dihapus
- siapkan daftar perubahan schema canonical
- siapkan daftar removal layer Nala

### Deliverable
- dokumen roadmap induk
- dokumen keputusan fondasi fase 1
- daftar status canonical
- daftar komponen Nala yang akan dicabut
- daftar objek schema yang akan dipertahankan

### Exit Criteria
- tidak ada kebingungan lagi soal peran VPS vs lokal
- status canonical sudah dibekukan
- arah removal Nala sudah resmi
- semua fase berikutnya punya acuan tetap

---

## FASE 2 — Schema & Data Model Cleanup
**Tujuan:** membangun satu sumber kebenaran schema yang konsisten dengan kebutuhan operasional aktual.

### Fokus
- gabungkan patch valid ke schema canonical baru
- hilangkan drift antara `warekcargo_schema_v3.sql` dan implementasi aktual
- finalkan tabel/kolom status/constraint yang memang dipakai
- tandai atau buang objek yang hanya relevan untuk Nala

### Pekerjaan Inti
- buat schema canonical baru
- sinkronkan:
  - `AWAITING_HUB_RECEIPT`
  - `MANIFESTED` bila disahkan
  - `batch_containers`
  - `batch_container_id`
  - `employees`
  - kolom attribution employee
  - status notification termasuk `SKIPPED` bila disahkan
- rapikan constraint yang tidak cocok dengan logic aplikasi

### Deliverable
- `warekcargo_schema_v4.sql` atau nama canonical pengganti
- catatan migrasi dari schema lama
- daftar patch lama yang menjadi obsolete

### Exit Criteria
- fresh deploy dari schema canonical menghasilkan struktur yang sesuai kebutuhan app
- tidak ada tabel/kolom/status kritis yang hanya hidup di patch liar

---

## FASE 3 — App Cleanup & Nala Removal
**Tujuan:** membersihkan ERP Hub dari layer Nala dan drift implementasi.

### Fokus
- hapus endpoint `/api/v1/nala/*`
- hapus dependency AI dari app jika tidak lagi diperlukan
- ubah hook/webhook/callback menjadi nama generic
- rapikan query/UI/server action agar sinkron ke schema canonical
- perbaiki bug runtime kritis

### Pekerjaan Inti
- perbaiki `notifications_log` status mismatch (`SKIPPED`)
- rapikan status finance (`REFUND_PENDING`, `VOIDED`)
- rapikan status shipment legacy (`ARRIVED`, `RECEIVED`, `INTRA_TRANSIT`)
- hapus `NALA_API_SECRET`, `x-nala-api-key`, dan route Nala
- rename `nala-outbound` menjadi jalur generic
- rapikan branch intake yang bentrok dengan constraint customer

### Deliverable
- ERP Hub tanpa Nala
- endpoint internal generic yang stabil
- codebase lebih konsisten dengan schema final

### Exit Criteria
- aplikasi internal tidak lagi mengasumsikan AI agent berjalan di VPS
- build/runtime tidak bergantung pada komponen Nala

### Progres yang Sudah Tercapai
- callback notification, intake, tracking, interpret, dan session sudah mulai dipindah ke endpoint internal generic dengan bridge legacy
- parser interpret internal sudah digeser dari AI in-app ke parser deterministic ringan
- persistence session Nala tidak lagi dipakai sebagai fondasi schema/runtime baru
- dependency AI yang khusus dipakai route interpret ERP Hub sudah dicabut dari app
- fallback runtime `NALA_API_SECRET` / `x-nala-api-key` sudah dicabut dari source code ERP Hub
- draft migration upgrade ke schema v4 sudah disiapkan di `migration_to_schema_v4.sql`

---

## FASE 4 — Security & Quality Gates
**Tujuan:** menghentikan kebocoran secret dan build hijau palsu.

### Fokus
- rotate secret yang pernah hardcoded
- pindahkan seluruh secret ke env / credential store
- bersihkan artifact yang menyimpan credential
- aktifkan gate kualitas secara bertahap

### Pekerjaan Inti
- rotate token Wablas / DB / secret lama
- cabut fallback secret default
- bersihkan file patch/workflow/config berisi credential
- rapikan `next.config.ts`
- hidupkan quality gate bertahap:
  - lint file kritis
  - typecheck file kritis
  - build tanpa bypass

### Deliverable
- secret handling lebih aman
- baseline quality gate yang jujur

### Exit Criteria
- tidak ada secret kritis yang tertanam di repo aktif
- build sukses lebih bisa dipercaya

---

## FASE 5 — n8n Rebuild on Clean Foundation
**Tujuan:** membangun ulang struktur n8n di atas fondasi yang sudah benar.

### Fokus
- workflow tracking non-AI
- workflow intake format baku non-AI
- workflow handoff admin
- outbound notification generic
- AI parser eksternal hanya untuk kasus ambigu

### Prinsip Flow
1. rule-based dulu
2. query DB / API internal generic dulu
3. AI parser eksternal hanya bila perlu
4. fallback ke admin bila confidence rendah

### Deliverable
- workflow n8n baru yang lebih sederhana dan modular
- pemakaian token lebih hemat
- tidak ada ketergantungan pada Nala

### Progres Draft yang Sudah Ada
- draft workflow inbound canonical v1 sudah dibuat di `deploy/n8n/warekcargo_inbound_canonical_v1.json`
- draft workflow outbound notifications v1 sudah dibuat di `deploy/n8n/warekcargo_notifications_outbound_v1.json`
- dokumen acuan workflow baru sudah dibuat di `deploy/n8n/WAREKCARGO_CANONICAL_WORKFLOWS.md`
- hardening awal workflow sudah masuk: timeout, fallback aman, dan callback `SKIPPED` untuk outbound invalid
- smoke harness lokal sudah disiapkan:
  - `deploy/n8n/WAREKCARGO_E2E_SMOKE_TEST.md`
  - `deploy/n8n/mock_wa_gateway.mjs`
  - `deploy/n8n/run_inbound_smoke_test.mjs`
  - `deploy/n8n/run_notifications_smoke_test.mjs`
- validator migration staging/snapshot sudah disiapkan di `warekcargo-erp-hub/scripts/validate-migration-v4.mjs`

### Exit Criteria
- otomasi WA berjalan di atas struktur teknis yang sudah bersih
- AI hanya dipakai saat ada nilai tambah nyata

---

## FASE 6 — Cost Optimization & Observability
**Tujuan:** mengontrol biaya, kualitas parsing, dan reliability workflow.

### Fokus
- ukur pemakaian API eksternal
- ukur parse success rate
- ukur admin handoff rate
- tekan token usage dengan filter deterministic

### Strategi Hemat Token
- jangan kirim semua pesan ke model
- gunakan format baku sebanyak mungkin
- pakai prompt pendek
- kirim context minimum
- parsing dan generation dipisah
- template statis untuk jawaban umum
- AI hanya untuk ambiguity / summarization bila perlu

### Deliverable
- dashboard/log biaya dan volume AI
- policy pemanggilan AI yang hemat
- daftar optimasi lanjutan berbasis data

---

# Prioritas Eksekusi Paling Masuk Akal
1. Fase 1 — freeze keputusan
2. Fase 2 — schema canonical
3. Fase 3 — cleanup app + removal Nala
4. Fase 4 — security & quality gates
5. Fase 5 — bangun n8n baru
6. Fase 6 — optimasi biaya token

---

## Catatan Eksekusi
Roadmap ini sengaja menunda desain n8n final sampai:
- schema final sudah jelas
- app tidak lagi kotor oleh Nala
- taxonomy status sudah tetap
- secret handling dan baseline runtime sudah aman

Kalau urutannya dibalik, workflow n8n baru berisiko ikut mewarisi kekacauan teknis lama.
