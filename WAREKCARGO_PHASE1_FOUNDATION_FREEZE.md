# WAREKCARGO_PHASE1_FOUNDATION_FREEZE.md

## Tujuan Fase 1
Mengunci keputusan fondasi teknis agar semua perbaikan berikutnya berjalan di atas asumsi yang sama.

## Catatan Status Proyek
WarekCargo saat ini masih berada pada fase **pembangunan / pre-production** dan **belum dipakai untuk operasional usaha real**.

Implikasi praktis:
- refactor struktural boleh dilakukan lebih tegas
- kompatibilitas warisan lama tidak perlu dipertahankan berlebihan
- fokus utama adalah merapikan fondasi sebelum sistem dipakai nyata

Fase ini **belum** membangun workflow n8n baru.
Fase ini fokus pada:
- boundary arsitektur
- taxonomy status canonical
- daftar komponen yang dipertahankan
- daftar komponen yang akan dicabut

---

# A. KEPUTUSAN ARSITEKTUR FINAL

## A1. Boundary Runtime
### Lokal
- OpenClaw / agent / analisis / perencanaan
- tidak menjadi komponen resident di VPS

### VPS
- PostgreSQL
- n8n
- WhatsApp gateway
- ERP Hub Next.js
- akses ke API eksternal bila dibutuhkan oleh otomasi

### Keputusan
**VPS bukan host AI agent lagi.**

Implikasi:
- tidak boleh ada arsitektur yang mengasumsikan agent AI tinggal di VPS
- tidak boleh ada layer Nala sebagai komponen resident produksi
- AI hanya boleh hadir sebagai **API eksternal** yang dipanggil seperlunya oleh otomasi

---

## A2. Posisi ERP Hub
ERP Hub difinalkan sebagai:
- aplikasi operasional internal
- pusat data dan UI operasional
- penyedia server action / endpoint internal generic bila perlu

ERP Hub **bukan** lagi tempat:
- persona chat intelligence
- session AI internal
- runtime agent produksi

---

## A3. Posisi n8n
n8n difinalkan sebagai:
- orkestrator workflow komunikasi dan otomasi
- penghubung WhatsApp gateway, database, ERP internal, dan API eksternal

n8n **bukan** tempat menaruh identitas Nala sebagai sistem.

---

## A4. Prinsip AI Baru
AI boleh dipakai nanti, tetapi dengan aturan:
- dipanggil sebagai **API eksternal**
- bersifat **opsional**
- dipakai hanya untuk parsing/ambiguity/summarization bila perlu
- bukan sumber kebenaran utama
- keputusan final tetap oleh rule, data, dan admin

---

# B. KEPUTUSAN RESMI TENTANG NALA

## B1. Layer Nala dinyatakan obsolete
Komponen bernama atau berperan sebagai Nala di VPS/app dinyatakan akan dihapus.

Catatan progres implementasi:
- route lama `interpret`, `intake`, `tracking`, `session`, dan `outbound/callback` sedang/bertahap dijadikan bridge ke endpoint internal generic
- logic interpret internal di ERP Hub sudah diarahkan ke parser deterministic non-AI
- persistence `nala_chat_sessions` tidak lagi menjadi fondasi runtime dan diganti arah stateless/context-passing

## B2. Komponen yang masuk removal scope
### Route app
- `/api/v1/nala/interpret`
- `/api/v1/nala/intake`
- `/api/v1/nala/session`
- `/api/v1/nala/tracking`
- `/api/v1/nala/outbound/callback`

### Secret / header / webhook naming
- `NALA_API_SECRET`
- `x-nala-api-key`
- `nala-outbound`
- semua log/source/action yang secara aktif masih memakai identitas Nala untuk runtime baru

### Database / session
- `nala_chat_sessions`
- seluruh orchestration state yang hanya ada untuk session AI internal Nala

### App dependencies
- `@ai-sdk/openai`
- `ai`
- dependency AI lain yang ternyata hanya dipakai untuk flow Nala di ERP Hub

### Workflow & artifact
- workflow n8n Nala-centric
- patch/clone/config yang dibuat khusus untuk flow Nala lama
- dokumen runtime yang menjadikan Nala sebagai inti arsitektur produksi VPS

---

# C. KOMPONEN YANG DIPERTAHANKAN

## C1. Infrastruktur inti
- PostgreSQL
- n8n
- WhatsApp gateway
- ERP Hub Next.js

## C2. Fungsi bisnis yang tetap dipertahankan
- intake paket
- tracking resi / shipment
- outbound notification
- validasi customer / hub / resi
- dashboard operasional internal
- history dan audit trail

## C3. Catatan penting
Fungsi bisnis dipertahankan, tetapi:
- implementasi Nala-nya dihapus
- flow AI internalnya dihapus
- alur komunikasi nantinya dibangun ulang secara generic

---

# D. TAXONOMY STATUS CANONICAL (TARGET FREEZE)

Tujuan bagian ini adalah membekukan bahasa status yang akan dipakai schema, query, UI, server actions, dan workflow.

## D1. Package Status Canonical
Status yang disahkan untuk paket inbound:
1. `REGISTERED`
2. `IN_TRANSIT_TO_HUB`
3. `AWAITING_HUB_RECEIPT`
4. `RECEIVED_AT_HUB`
5. `REPACKING`
6. `READY_FOR_BATCH`
7. `ARRIVED_DESTINATION`
8. `DELIVERED`
9. `DAMAGED`
10. `UNIDENTIFIED`
11. `CANCELLED`

### Catatan
- `AWAITING_HUB_RECEIPT` disahkan karena dibutuhkan untuk pre-manifest / deklarasi awal
- `MANIFESTED` **tidak** dijadikan status paket canonical utama untuk saat ini
- status paket harus dijaga lebih sederhana daripada shipment

---

## D2. Shipment Status Canonical
Status yang disahkan untuk shipment/karung:
1. `DRAFT`
2. `AWAITING_PACKAGES`
3. `READY_FOR_DISPATCH`
4. `MANIFESTED`
5. `DISPATCHED`
6. `ARRIVED_DESTINATION`
7. `READY_FOR_PICKUP`
8. `OUT_FOR_DELIVERY`
9. `COMPLETED`
10. `CANCELLED`

### Catatan
- `MANIFESTED` disahkan sebagai status shipment resmi karena sudah menjadi kebutuhan aktual flow kontainer/manifest
- status legacy seperti `ARRIVED`, `RECEIVED`, `INTRA_TRANSIT` dinyatakan **bukan status shipment canonical**

---

## D3. Payment Status Canonical
Status pembayaran yang disahkan:
1. `PENDING`
2. `PARTIAL`
3. `PAID`
4. `REFUND_PENDING`
5. `VOIDED`
6. `CANCELLED`

### Catatan
- `REFUND_PENDING` disahkan karena dipakai oleh logic kelebihan bayar / pembongkaran shipment
- `VOIDED` disahkan karena berbeda makna dengan `CANCELLED`

---

## D4. Notification Delivery Status Canonical
Status notifikasi yang disahkan:
1. `QUEUED`
2. `SENT`
3. `FAILED`
4. `SKIPPED`
5. `CANCELLED`

### Catatan
- `SKIPPED` disahkan karena secara bisnis berbeda dari gagal kirim
- constraint DB lama perlu diubah agar cocok dengan logic aplikasi

---

# E. DRIFT STATUS YANG RESMI DINYATAKAN SALAH / LEGACY
Komponen berikut harus dipindahkan atau dibersihkan dari code/UI/query:
- `ARRIVED` (shipment legacy)
- `RECEIVED` (shipment legacy)
- `INTRA_TRANSIT`
- package/shipment/payment status lain yang tidak ada di canonical freeze

---

# F. OBJEK SCHEMA YANG TETAP DIPERLUKAN
Objek ini masuk kandidat schema canonical baru karena relevan dengan operasi aktual:
- `batch_containers`
- `customer_shipments.batch_container_id`
- `employees`
- `inbound_packages.created_by_employee_id`
- `inbound_package_status_history.changed_by_employee_id`

Catatan:
- objek di atas sebelumnya hidup di patch/migration terpisah dan harus dipindah ke schema canonical

---

# G. OBJEK YANG MASUK REVIEW REMOVE / ARCHIVE
- `nala_chat_sessions`
- route / secret / callback khusus Nala
- dokumen arsitektur yang menjadikan Nala sebagai inti runtime VPS
- workflow n8n yang masih bergantung pada session Nala dan route `/api/v1/nala/*`

---

# H. TUGAS FASE 1 YANG DIMULAI SEKARANG
1. membuat roadmap induk teknis
2. mengunci dokumen keputusan fase 1 ini
3. menjadikan dokumen ini sebagai acuan untuk:
   - schema cleanup
   - app cleanup
   - removal Nala
   - desain n8n baru nanti

---

# I. OUTPUT YANG DIHARAPKAN SETELAH FASE 1 SELESAI
- target arsitektur final sudah jelas
- status canonical tidak berubah-ubah lagi
- removal Nala sudah punya dasar resmi
- fase schema dan app cleanup bisa dimulai tanpa debat arah lagi
