# WAREKCARGO_N8N_ARTIFACT_AUDIT.md

Dokumen ini mencatat artefak workflow/patch lama yang masih tersisa di repo setelah cleanup fondasi teknis.

## Tujuan
- membedakan artefak historis vs artefak yang masih layak dipakai
- mencegah deploy/patch baru memakai pola Nala lama
- memberi urutan cleanup berikutnya untuk fase n8n

---

## 1. Prinsip Umum
Untuk runtime baru, acuan yang dipakai adalah:
- endpoint: `/api/v1/internal/*`
- auth header: `x-internal-api-key`
- secret: `INTERNAL_AUTOMATION_SECRET`
- outbound notification webhook generic
- parser deterministik / API eksternal opsional, bukan AI resident di ERP Hub

Artefak yang masih mengacu ke:
- `/api/v1/nala/*`
- `x-nala-api-key`
- `NALA_API_SECRET`
- `nala_chat_sessions`
- `nala-outbound`

dianggap **legacy** dan **tidak boleh dijadikan baseline baru**.

---

## 2. Kategori Artefak Legacy yang Ditemukan

### 2.1 Clone workflow n8n lama
Contoh file:
- `n8n_v3_clone.json`
- `n8n_v4_clone.json`
- `n8n_v5_clone.json`
- `v7_nodes.json`
- `v7_nodes_patched.json`
- `backup_nodes.json`

Masalah utama:
- masih mengarah ke `/api/v1/nala/*`
- masih memakai `x-nala-api-key`
- sebagian masih mengasumsikan session internal Nala
- sebagian masih memanggil parser AI lama
- sebagian masih memakai webhook `nala-outbound`

Status:
- **historical reference only**
- **jangan deploy ulang apa adanya**
- batch cleanup terbaru: file-file ini sudah dipindahkan ke `legacy/n8n/`

### 2.2 SQL / patch workflow lama
Contoh file:
- `update.sql`
- `update_phase1.sql`
- `update_phase2.sql`
- `update_phase3.sql`
- `update_stage3.sql`
- `patch_phase1.py`
- `patch_phase2.py`
- `patch_phase3.py`
- `patch_phase7.py`
- `patch_phase8.py`
- `patch_stage3.py`

Masalah utama:
- menulis workflow lama yang masih Nala-centric
- ada coupling ke route app lama
- tidak selaras dengan runtime internal generic saat ini

Status:
- **legacy patch set**
- **tidak layak dipakai sebagai jalur deploy baru**
- batch cleanup terbaru: file-file ini sudah dipindahkan ke `legacy/patches/` dan `legacy/sql/`

### 2.3 Artefak database/session lama
Contoh file:
- `migration_nala_sessions.sql`

Masalah utama:
- membangun objek `nala_chat_sessions`
- bertentangan dengan schema v4 yang sudah tidak membawa session runtime Nala

Status:
- **obsolete untuk arsitektur final**
- batch cleanup terbaru: file dipindahkan ke `legacy/sql/`

### 2.4 Dokumen blueprint lama
Contoh file:
- `WAREKCARGO_NALA_CENTRIC_INTELLIGENCE_RUNTIME_BLUEPRINT.md`

Masalah utama:
- merepresentasikan arsitektur lama yang sudah tidak menjadi target akhir

Status:
- **dokumen historis**
- jangan dipakai sebagai pegangan implementasi baru

---

## 3. Artefak yang Menjadi Acuan Baru

### 3.1 Dokumen fondasi
- `WAREKCARGO_MASTER_TECHNICAL_ROADMAP.md`
- `WAREKCARGO_PHASE1_FOUNDATION_FREEZE.md`
- `WAREKCARGO_SCHEMA_V4_ALIGNMENT.md`
- `migration_to_schema_v4.sql`
- `warekcargo_schema_v4.sql`

### 3.2 Runtime app internal
- `warekcargo-erp-hub/src/app/api/v1/internal/intake/route.ts`
- `warekcargo-erp-hub/src/app/api/v1/internal/tracking/route.ts`
- `warekcargo-erp-hub/src/app/api/v1/internal/interpret/route.ts`
- `warekcargo-erp-hub/src/app/api/v1/internal/session/route.ts`
- `warekcargo-erp-hub/src/app/api/v1/internal/notifications/callback/route.ts`
- `warekcargo-erp-hub/src/lib/internal-api.ts`
- `warekcargo-erp-hub/src/lib/message-intent.ts`

### 3.3 Draft workflow canonical baru
- `deploy/n8n/warekcargo_inbound_canonical_v1.json`
- `deploy/n8n/warekcargo_notifications_outbound_v1.json`
- `deploy/n8n/WAREKCARGO_CANONICAL_WORKFLOWS.md`

---

## 4. Rekomendasi Batch Lanjutan

### Batch A — freeze artefak legacy
- tandai file clone/patch lama sebagai legacy di dokumentasi
- jangan gunakan untuk deploy baru
- **status:** selesai awal; artefak utama sudah dipindahkan ke folder `legacy/`

### Batch B — buat workflow canonical baru
Bangun satu workflow n8n canonical yang:
- memanggil endpoint `/api/v1/internal/*`
- memakai `x-internal-api-key`
- tidak bergantung pada `nala_chat_sessions`
- tidak mengasumsikan AI resident di ERP Hub
- hanya memakai parser eksternal jika memang dibutuhkan

### Batch C — pensiunkan artefak lama
Setelah workflow canonical baru siap:
- pindahkan artefak lama ke folder arsip / legacy
- atau tandai jelas sebagai obsolete
- hindari kebingungan antara blueprint baru vs sampah historis

---

## 5. Kesimpulan
Masalah terbesar yang tersisa saat ini bukan lagi runtime app, melainkan tumpukan artefak n8n/patch lama yang masih membawa asumsi Nala.

Karena itu, fase berikut yang paling masuk akal adalah:
1. berhenti memakai clone/patch lama sebagai referensi aktif
2. susun satu workflow n8n canonical baru
3. baru kemudian pensiunkan artefak lama secara tegas

## 6. Lokasi arsip baru
- `legacy/README.md`
- `legacy/n8n/`
- `legacy/sql/`
- `legacy/patches/`
- `legacy/scripts/`
- `legacy/erp-hub/`
