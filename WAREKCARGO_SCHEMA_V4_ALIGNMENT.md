# WAREKCARGO_SCHEMA_V4_ALIGNMENT.md

Dokumen ini menjelaskan perubahan utama pada schema canonical v4 dan file aplikasi yang harus diselaraskan di fase berikutnya.

---

## 1. Perubahan Canonical yang Sudah Masuk ke `warekcargo_schema_v4.sql`

### 1.1 Boundary baru
- schema v4 **tidak** lagi memasukkan objek runtime Nala
- `nala_chat_sessions` tidak dibawa ke schema canonical baru
- schema difokuskan untuk operasi inti WarekCargo di VPS

### 1.2 Status package canonical
Disahkan:
- `REGISTERED`
- `IN_TRANSIT_TO_HUB`
- `AWAITING_HUB_RECEIPT`
- `RECEIVED_AT_HUB`
- `REPACKING`
- `READY_FOR_BATCH`
- `ARRIVED_DESTINATION`
- `DELIVERED`
- `DAMAGED`
- `UNIDENTIFIED`
- `CANCELLED`

### 1.3 Status shipment canonical
Disahkan:
- `DRAFT`
- `AWAITING_PACKAGES`
- `READY_FOR_DISPATCH`
- `MANIFESTED`
- `DISPATCHED`
- `ARRIVED_DESTINATION`
- `READY_FOR_PICKUP`
- `OUT_FOR_DELIVERY`
- `COMPLETED`
- `CANCELLED`

### 1.4 Status payment canonical
Disahkan:
- `PENDING`
- `PARTIAL`
- `PAID`
- `REFUND_PENDING`
- `VOIDED`
- `CANCELLED`

### 1.5 Status delivery notification canonical
Disahkan untuk `notifications_log.delivery_status_code`:
- `QUEUED`
- `SENT`
- `FAILED`
- `SKIPPED`
- `CANCELLED`

### 1.6 Tabel/kolom operasional baru yang dijadikan canonical
- `employees`
- `batch_containers`
- `customer_shipments.batch_container_id`
- `inbound_packages.created_by_employee_id`
- `inbound_package_status_history.changed_by_employee_id`

### 1.7 Constraint customer diperlonggar
- `customers.whatsapp_number` tidak lagi `NOT NULL`
- alasan: flow walk-in/manual customer memang mungkin belum punya nomor WA

---

## 2. Dampak Langsung ke Aplikasi

### 2.1 File manifest & repacking
**File terdampak:**
- `warekcargo-erp-hub/src/app/manifests/actions.ts`
- `warekcargo-erp-hub/src/app/manifests/[id]/page.tsx`
- `warekcargo-erp-hub/src/app/manifests/[id]/container/[container_id]/page.tsx`
- `warekcargo-erp-hub/src/app/repacking/actions.ts`
- `warekcargo-erp-hub/src/app/repacking/[id]/page.tsx`
- `warekcargo-erp-hub/src/app/repacking/page.tsx`

**Alignment yang diperlukan:**
- pakai `MANIFESTED` sebagai status shipment resmi
- pakai `batch_containers` dan `batch_container_id` sebagai struktur canonical
- hapus asumsi status legacy non-canonical seperti `ARRIVED`

---

### 2.2 File finance
**File terdampak:**
- `warekcargo-erp-hub/src/app/finance/actions.ts`
- `warekcargo-erp-hub/src/app/finance/page.tsx`
- `warekcargo-erp-hub/src/app/finance/[id]/page.tsx`
- `warekcargo-erp-hub/src/components/CashierForm.tsx`

**Alignment yang diperlukan:**
- `REFUND_PENDING` dan `VOIDED` sekarang resmi
- semua filter, badge, sorting, dan validasi payment harus mengikuti canonical ini

---

### 2.3 File notifikasi
**File terdampak:**
- `warekcargo-erp-hub/src/lib/notifications.ts`
- `warekcargo-erp-hub/src/app/delivery/actions.ts`
- `warekcargo-erp-hub/src/app/batches/actions.ts`
- `warekcargo-erp-hub/src/app/arrival/actions.ts`

**Alignment yang diperlukan:**
- `SKIPPED` sekarang legal di schema
- logging notifikasi boleh tetap memakai `SKIPPED` saat nomor WA tidak valid
- tetapi layer callback dan webhook Nala tetap masuk removal scope fase 3

---

### 2.4 File tracking & status visual
**File terdampak:**
- `warekcargo-erp-hub/src/app/tracking/page.tsx`
- `warekcargo-erp-hub/src/app/api/v1/nala/tracking/route.ts` *(akan dihapus di fase 3)*
- `warekcargo-erp-hub/src/app/page.tsx`

**Alignment yang diperlukan:**
- hapus/migrasikan penggunaan status legacy:
  - `ARRIVED`
  - `RECEIVED`
  - `INTRA_TRANSIT`
- gunakan status shipment canonical:
  - `DISPATCHED`
  - `ARRIVED_DESTINATION`
  - `READY_FOR_PICKUP`
  - `OUT_FOR_DELIVERY`
  - `COMPLETED`

---

### 2.5 File intake/customer resolution
**File terdampak:**
- `warekcargo-erp-hub/src/app/intake/actions.ts`
- `warekcargo-erp-hub/src/app/intake/page.tsx`
- `warekcargo-erp-hub/src/app/api/v1/nala/intake/route.ts` *(akan dihapus/diganti di fase 3)*

**Alignment yang diperlukan:**
- `AWAITING_HUB_RECEIPT` sekarang resmi
- branch yang membuat customer tanpa WA sekarang tidak bentrok dengan schema canonical
- relasi employee attribution sekarang punya landasan schema resmi

---

## 3. File / Komponen yang Masuk Removal Scope Fase 3
Walau tidak dibawa ke schema v4, komponen ini masih ada di codebase dan harus dibersihkan:

- `warekcargo-erp-hub/src/app/api/v1/nala/interpret/route.ts`
- `warekcargo-erp-hub/src/app/api/v1/nala/intake/route.ts`
- `warekcargo-erp-hub/src/app/api/v1/nala/session/route.ts`
- `warekcargo-erp-hub/src/app/api/v1/nala/tracking/route.ts`
- route callback/outbound Nala yang masih tersisa
- env `NALA_API_SECRET`
- header `x-nala-api-key`
- webhook name `nala-outbound`
- dependency app: `@ai-sdk/openai`, `ai` (jika memang tidak lagi dipakai oleh ERP Hub)

---

## 4. Catatan Migrasi Data
Draft upgrade path SQL sudah disiapkan di file `migration_to_schema_v4.sql`.

Untuk validasi aman ke staging/snapshot, jalur bantu yang sudah disiapkan adalah:
- `warekcargo-erp-hub/scripts/validate-migration-v4.mjs`
- `WAREKCARGO_MIGRATION_V4_VALIDATION.md`

Jika schema v4 diterapkan ke DB yang sudah berjalan, data migration minimal perlu menangani:

1. **Tambah status baru bila belum ada**
   - `AWAITING_HUB_RECEIPT`
   - `MANIFESTED`
   - `REFUND_PENDING`
   - `VOIDED`
   - `SKIPPED` untuk constraint notification

2. **Tambah struktur baru bila belum ada**
   - `employees`
   - `batch_containers`
   - `batch_container_id`
   - `created_by_employee_id`
   - `changed_by_employee_id`

3. **Longgarkan customer WA**
   - drop `NOT NULL` pada `customers.whatsapp_number`

4. **Backfill container relation bila perlu**
   - mapping `customer_shipments.container_number` lama ke `batch_containers`

5. **Evaluasi log lama bertanda `NALA_BOT`**
   - data historis tidak harus dihapus
   - tetapi source baru ke depan tidak boleh lagi mengandalkan Nala runtime

---

## 5. Exit Condition Fase 2
Fase 2 dianggap cukup matang untuk lanjut ke fase 3 jika:
- schema canonical v4 sudah tersedia
- perubahan schema utama sudah terdokumentasi
- file aplikasi yang wajib diselaraskan sudah terpetakan
- removal scope Nala sudah tidak rancu
