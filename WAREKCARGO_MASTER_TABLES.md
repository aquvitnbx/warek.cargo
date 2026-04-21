# Desain Master Tables WarekCargo

Dokumen ini menjelaskan master tables atau reference tables yang direkomendasikan untuk WarekCargo sebagai fondasi arsitektur master-data driven.

## 1. Tujuan Master Tables

Master tables berfungsi sebagai kamus resmi sistem WarekCargo.

Dengan master tables:
- semua status dan tipe inti menjadi baku
- data operasional lebih konsisten
- automation lebih mudah dibuat
- analitik lebih mudah dibangun
- sistem lebih siap scale ke ERP yang lebih besar

## 2. Prinsip Desain Master Tables

Prinsip yang dipakai:
- setiap master table menyimpan kode baku
- kode bersifat stabil dan tidak mudah berubah
- label dapat lebih fleksibel untuk tampilan
- setiap master table dapat memiliki `is_active` untuk aktivasi/nonaktif
- setiap master table dapat memiliki `sort_order` untuk urutan tampilan
- setiap master table dapat memiliki `description` untuk penjelasan bisnis

Struktur umum yang direkomendasikan:
- `code` → kode sistem, huruf besar, stabil
- `name` → nama tampilan resmi
- `description` → penjelasan singkat
- `is_active` → status aktif
- `sort_order` → urutan tampilan
- `created_at`
- `updated_at`

## 3. Master Tables Utama

### 3.1. `ref_service_types`

Fungsi:
- daftar resmi jenis layanan WarekCargo

Data awal yang direkomendasikan:
- `HEMAT`
- `CEPAT`
- `EXPRESS`

Kegunaan:
- dipakai di `shipping_batches`
- dipakai di `customer_batch_interests`
- dipakai di `customer_shipments`

### 3.2. `ref_transport_modes`

Fungsi:
- daftar resmi moda pengiriman

Data awal yang direkomendasikan:
- `KAPAL_KARGO`
- `KAPAL_PENUMPANG`
- `PESAWAT`

Kegunaan:
- dipakai di `shipping_batches`

### 3.3. `ref_package_statuses`

Fungsi:
- daftar resmi status paket per resi

Data awal yang direkomendasikan:
- `REGISTERED`
- `IN_TRANSIT_TO_HUB`
- `RECEIVED_AT_HUB`
- `DAMAGED`
- `UNIDENTIFIED`
- `REPACKING`
- `READY_FOR_BATCH`
- `SHIPPED`
- `ARRIVED_DESTINATION`
- `DELIVERED`
- `CANCELLED`

Kegunaan:
- dipakai di `inbound_packages`
- dipakai di `inbound_package_status_history`

### 3.4. `ref_batch_statuses`

Fungsi:
- daftar resmi status batch pengiriman

Data awal yang direkomendasikan:
- `PLANNED`
- `OPEN`
- `CLOSED`
- `DEPARTED`
- `ARRIVED`
- `COMPLETED`
- `CANCELLED`

Kegunaan:
- dipakai di `shipping_batches`

### 3.5. `ref_shipment_statuses`

Fungsi:
- daftar resmi status shipment final

Data awal yang direkomendasikan:
- `DRAFT`
- `AWAITING_PACKAGES`
- `READY_FOR_DISPATCH`
- `DISPATCHED`
- `ARRIVED_DESTINATION`
- `READY_FOR_PICKUP`
- `OUT_FOR_DELIVERY`
- `COMPLETED`
- `CANCELLED`

Kegunaan:
- dipakai di `customer_shipments`
- dipakai di `shipment_status_history`

### 3.6. `ref_payment_statuses`

Fungsi:
- daftar resmi status pembayaran

Data awal yang direkomendasikan:
- `PENDING`
- `PARTIAL`
- `PAID`
- `CANCELLED`

Kegunaan:
- dipakai di `customer_shipments`

### 3.7. `ref_payment_methods`

Fungsi:
- daftar resmi metode pembayaran

Data awal yang direkomendasikan:
- `PAY_ON_PICKUP`
- `BANK_TRANSFER`
- `CASH`
- `OTHER`

Kegunaan:
- dipakai di `customer_shipments`
- dipakai di `shipment_payments`

### 3.8. `ref_pickup_delivery_statuses`

Fungsi:
- daftar resmi status pickup atau delivery akhir

Data awal yang direkomendasikan:
- `NOT_READY`
- `READY_FOR_PICKUP`
- `PICKED_UP`
- `OUT_FOR_DELIVERY`
- `DELIVERED`

Kegunaan:
- dipakai di `customer_shipments`

### 3.9. `ref_issue_scopes`

Fungsi:
- menentukan cakupan issue operasional

Data awal yang direkomendasikan:
- `PACKAGE`
- `SHIPMENT`
- `BATCH`
- `PAYMENT`
- `CUSTOMER`

Kegunaan:
- dipakai di `operational_issues`

### 3.10. `ref_issue_statuses`

Fungsi:
- menentukan status penyelesaian issue

Data awal yang direkomendasikan:
- `OPEN`
- `INVESTIGATING`
- `RESOLVED`
- `CANCELLED`

Kegunaan:
- dipakai di `operational_issues`

### 3.11. `ref_issue_types`

Fungsi:
- kategori masalah operasional yang lebih detail

Data awal yang direkomendasikan:
- `DELAY`
- `DAMAGE`
- `MISSING_LABEL`
- `PAYMENT_PROBLEM`
- `CUSTOMER_COMPLAINT`
- `WRONG_HUB`
- `UNIDENTIFIED_PACKAGE`

Kegunaan:
- dipakai di `operational_issues`

### 3.12. `ref_photo_types`

Fungsi:
- jenis file foto

Data awal yang direkomendasikan:
- `PACKAGE`
- `LABEL`
- `DAMAGE`
- `OTHER`
- `PAYMENT_PROOF`

Kegunaan:
- dipakai di `package_photos`
- bisa dipakai di file attachment lain di masa depan

### 3.13. `ref_notification_channels`

Fungsi:
- channel komunikasi resmi yang digunakan sistem

Data awal yang direkomendasikan:
- `WHATSAPP`
- `TELEGRAM`
- `INSTAGRAM`
- `MANUAL`

Kegunaan:
- dipakai di `notifications_log`

## 4. Master Tables Tambahan yang Layak Dipertimbangkan

### 4.1. `ref_marketplaces`

Fungsi:
- daftar marketplace sumber pembelian customer

Data awal yang mungkin:
- `SHOPEE`
- `TOKOPEDIA`
- `TIKTOK_SHOP`
- `BLIBLI`
- `OTHER`

Kegunaan:
- dipakai di `inbound_packages`

### 4.2. `ref_provinces`

Fungsi:
- provinsi resmi untuk alamat dan lokasi

Kegunaan:
- dipakai jika sistem ingin lebih formal dalam alamat customer dan hub

### 4.3. `ref_cities`

Fungsi:
- kota resmi untuk tujuan dan operasional

Kegunaan:
- berguna jika nanti ekspansi ke banyak kota Papua

### 4.4. `ref_ports`

Fungsi:
- daftar pelabuhan resmi

Data awal yang mungkin:
- `TANJUNG_PRIOK`
- `TANJUNG_PERAK`
- `NABIRE_PORT`
- `SORONG_PORT`
- `MANOKWARI_PORT`

Kegunaan:
- dipakai di `shipping_batches`
- mengurangi penulisan port sebagai text bebas

### 4.5. `ref_user_roles`

Fungsi:
- role sistem untuk aktor internal

Data awal yang mungkin:
- `OWNER`
- `NALA`
- `ADMIN_HUB`
- `ADMIN_NABIRE`
- `FINANCE`

Kegunaan:
- dipakai saat sistem user management formal dibangun

## 5. Prioritas Implementasi Master Tables

### Prioritas wajib untuk versi berikutnya
Master tables yang sangat disarankan dibuat dulu:
- `ref_service_types`
- `ref_transport_modes`
- `ref_package_statuses`
- `ref_batch_statuses`
- `ref_shipment_statuses`
- `ref_payment_statuses`
- `ref_payment_methods`
- `ref_pickup_delivery_statuses`
- `ref_issue_scopes`
- `ref_issue_statuses`
- `ref_issue_types`
- `ref_photo_types`
- `ref_notification_channels`

### Prioritas tahap berikutnya
- `ref_marketplaces`
- `ref_ports`
- `ref_user_roles`
- `ref_cities`
- `ref_provinces`

## 6. Dampak ke Schema Operasional

Setelah master tables dibuat, tabel operasional akan berubah seperti ini:

### `shipping_batches`
- `service_type` → `service_type_code`
- `transport_mode` → `transport_mode_code`
- `status` → `batch_status_code`
- `origin_port` dan `destination_port` kelak bisa menjadi foreign key ke `ref_ports`

### `customer_batch_interests`
- `selected_service_type` → `service_type_code`

### `inbound_packages`
- `package_status` → `package_status_code`
- `marketplace_name` kelak bisa menjadi `marketplace_code`

### `package_photos`
- `photo_type` → `photo_type_code`

### `customer_shipments`
- `final_service_type` → `service_type_code`
- `payment_method` → `payment_method_code`
- `payment_status` → `payment_status_code`
- `shipment_status` → `shipment_status_code`
- `pickup_or_delivery_status` → `pickup_delivery_status_code`

### `shipment_payments`
- `payment_method` → `payment_method_code`

### `operational_issues`
- `issue_scope` → `issue_scope_code`
- `issue_status` → `issue_status_code`
- `issue_type` → `issue_type_code`

### `notifications_log`
- `channel` → `notification_channel_code`

## 7. Rekomendasi Struktur SQL Master Tables

Setiap master table idealnya minimal memiliki kolom:
- `code` text primary key
- `name` text not null
- `description` text
- `is_active` boolean not null default true
- `sort_order` integer not null default 0
- `created_at` timestamptz not null default now()
- `updated_at` timestamptz not null default now()

Contoh pola umum:

```sql
create table ref_service_types (
    code text primary key,
    name text not null,
    description text,
    is_active boolean not null default true,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
```

## 8. Kesimpulan

Master tables adalah fondasi resmi untuk membuat WarekCargo menjadi sistem yang benar-benar konsisten dan siap scale.

Kalau schema `v2.1` adalah fondasi operasional yang kuat, maka master tables adalah fondasi tata bahasa sistemnya.

Rekomendasi tegas:
- bangun master tables wajib terlebih dahulu
- setelah itu susun schema operasional baru yang mengacu ke master data
- jadikan itu sebagai baseline arsitektur jangka panjang WarekCargo
