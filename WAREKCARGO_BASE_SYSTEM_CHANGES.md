# Perubahan Sistem Dasar WarekCargo

Dokumen ini menjabarkan perubahan sistem dasar yang direkomendasikan berdasarkan hasil desain dan review sampai schema `v2.1`. Tujuannya adalah mengubah fondasi WarekCargo dari schema operasional yang sudah cukup matang menjadi arsitektur yang lebih siap untuk scale, automation, audit, dan analytics.

## 1. Titik Berangkat

Schema `v2.1` saat ini sudah kuat untuk operasional awal karena sudah mencakup:
- customer
- hub
- shipping batch
- inbound package sebagai tiket utama per resi
- shipment final
- payment summary dan payment transactions
- payment proof
- package photo
- notifikasi
- issue operasional
- history status paket dan shipment

Namun agar sistem benar-benar siap menjadi fondasi perusahaan besar, ada perubahan sistem dasar yang perlu dilakukan.

## 2. Tujuan Perubahan Sistem Dasar

Perubahan ini bertujuan untuk:
- membuat bahasa sistem menjadi baku dan konsisten
- memisahkan data referensi dari data transaksi
- memperkuat audit trail
- menyiapkan integrasi automation dan AI
- menyiapkan analytic layer di masa depan
- mengurangi ketergantungan pada field text bebas

## 3. Prinsip Arsitektur Baru

Arsitektur yang direkomendasikan untuk tahap berikutnya:
- **master-data driven** sebagai fondasi pencatatan utama
- **event/history tracking** sebagai jejak proses operasional
- **operational relational model** untuk transaksi harian
- **analytics-ready design** agar nanti mudah dibangun dashboard dan data warehouse

## 4. Perubahan Sistem Dasar yang Direkomendasikan

### 4.1. Ubah status dan tipe inti menjadi master data

Saat ini banyak field masih memakai `text + check constraint`. Ini baik untuk iterasi awal, tetapi untuk jangka panjang sebaiknya diubah menjadi reference/master tables.

#### Yang perlu dijadikan master data:
- service type
- transport mode
- package status
- shipment status
- payment status
- payment method
- pickup or delivery status
- issue scope
- issue status
- photo type
- notification channel

#### Contoh perubahan konsep:
Sebelumnya:
- `payment_status = 'paid'`
- `transport_mode = 'kapal_penumpang'`

Setelah perubahan:
- `payment_status_code = 'PAID'`
- `transport_mode_code = 'KAPAL_PENUMPANG'`

Lalu semua kode itu merujuk ke tabel master.

### 4.2. Tambahkan lapisan master tables resmi

Buat tabel referensi resmi seperti:
- `ref_service_types`
- `ref_transport_modes`
- `ref_package_statuses`
- `ref_shipment_statuses`
- `ref_payment_statuses`
- `ref_payment_methods`
- `ref_pickup_delivery_statuses`
- `ref_issue_scopes`
- `ref_issue_statuses`
- `ref_photo_types`
- `ref_notification_channels`

Fungsi master tables:
- menjadi kamus resmi sistem
- mencegah variasi data tidak konsisten
- memudahkan mapping ke automation
- memudahkan BI dan analitik

### 4.3. Pertahankan dan perkuat history tables

Schema `v2.1` sudah memiliki:
- `inbound_package_status_history`
- `shipment_status_history`

Ini harus dipertahankan dan dijadikan bagian inti sistem.

Perubahan yang direkomendasikan:
- tambahkan status code yang merujuk ke master status
- pertimbangkan tambahan `changed_source` seperti `system`, `nala`, `admin_hub`, `owner`
- pertimbangkan penambahan `change_context` atau `metadata` JSON di masa depan

### 4.4. Pisahkan ringkasan dan transaksi pembayaran dengan tegas

Saat ini sudah ada:
- ringkasan pembayaran di `customer_shipments`
- transaksi detail di `shipment_payments`

Ini adalah desain yang benar.

Perubahan yang direkomendasikan:
- `payment_method` di shipment menjadi referensi default atau metode utama
- status pembayaran di shipment dihitung dari transaksi pembayaran
- bukti transfer dihubungkan ke transaksi pembayaran jika memungkinkan

Tujuannya:
- mendukung DP, cicilan, pelunasan, dan koreksi pembayaran
- membuat akuntansi layer nanti lebih mudah dibangun

### 4.5. Jadikan shipment sebagai pusat fulfillment final

Saat ini shipment sudah memegang banyak fungsi penting. Ini sudah tepat.

Perlu ditegaskan bahwa `customer_shipments` adalah pusat data untuk:
- total charge final
- payment summary
- vessel, voyage, container final
- pickup atau delivery status
- alamat tujuan final
- readiness untuk dispatch dan completion

Artinya:
- `inbound_packages` fokus ke tiket per resi
- `customer_shipments` fokus ke fulfillment final ke customer

### 4.6. Naikkan kualitas issue management

`operational_issues` sudah sangat baik sebagai awal.

Perubahan yang direkomendasikan:
- issue status dan issue scope harus pindah ke master tables
- pertimbangkan kategori issue yang lebih formal, misalnya:
  - `DELAY`
  - `DAMAGE`
  - `MISSING_LABEL`
  - `PAYMENT_PROBLEM`
  - `CUSTOMER_COMPLAINT`
- pertimbangkan tabel issue comments atau issue timeline di fase berikutnya

### 4.7. Siapkan user and actor model untuk masa depan

Saat ini banyak kolom seperti:
- `assigned_admin`
- `changed_by`
- `uploaded_by`
- `reported_by`

masih berupa text.

Untuk awal tidak masalah, tetapi perubahan sistem dasar ke depan harus menyiapkan model aktor resmi:
- `users`
- `roles`
- `user_hub_assignments`

Perubahan ini belum wajib diimplementasikan sekarang, tetapi sistem harus disiapkan agar field text bisa dimigrasikan ke foreign key di masa depan.

### 4.8. Siapkan analytics-ready structure

Agar nanti mudah masuk ke reporting dan BI, sistem operasional harus konsisten dari awal.

Perubahan yang direkomendasikan:
- semua field status dan tipe utama memakai code baku
- history table tetap detail dan bertimestamp
- data transaksi tidak dihapus, hanya diubah statusnya
- semua entitas penting punya `created_at`, `updated_at`, dan timestamp per event

Dengan ini nanti mudah membangun:
- shipment performance dashboard
- batch profitability dashboard
- customer growth dashboard
- SLA and delay analytics

## 5. Dampak Perubahan ke Tabel-Tabel Inti

### 5.1. customers
Tidak perlu perubahan besar.

Tetap sebagai master customer profile.

### 5.2. hubs
Tetap dipertahankan.

Ke depan dapat menjadi bagian master data juga.

### 5.3. shipping_batches
Perubahan utama:
- `service_type` menjadi `service_type_code`
- `transport_mode` menjadi `transport_mode_code`
- status batch dapat dipertimbangkan menjadi `batch_status_code`

Batch harus menjadi entitas yang sangat bersih dan terstandar karena menjadi pusat penjadwalan logistik.

### 5.4. inbound_packages
Perubahan utama:
- `package_status` menjadi `package_status_code`
- tetap menyimpan estimasi dan aktual
- tetap menyimpan relasi ke target batch
- tetap jadi tiket utama per resi

### 5.5. package_photos
Perubahan utama:
- `photo_type` menjadi `photo_type_code`

### 5.6. customer_shipments
Perubahan utama:
- `final_service_type` menjadi `service_type_code`
- `payment_method` menjadi `payment_method_code`
- `payment_status` menjadi `payment_status_code`
- `shipment_status` menjadi `shipment_status_code`
- `pickup_or_delivery_status` menjadi `pickup_delivery_status_code`

### 5.7. shipment_payments
Perubahan utama:
- `payment_method` menjadi `payment_method_code`

### 5.8. operational_issues
Perubahan utama:
- `issue_scope` menjadi `issue_scope_code`
- `issue_status` menjadi `issue_status_code`
- `issue_type` kelak juga bisa dijadikan reference table

### 5.9. notifications_log
Perubahan utama:
- `channel` menjadi `notification_channel_code`

## 6. Struktur Arsitektur Baru yang Direkomendasikan

### Layer 1 - Reference Layer
Berisi semua master tables.

Fungsi:
- kamus resmi bisnis
- sumber kebenaran untuk status dan tipe

### Layer 2 - Operational Transaction Layer
Berisi:
- customers
- hubs
- shipping_batches
- inbound_packages
- customer_shipments
- shipment_payments
- package_photos
- shipment_payment_proofs
- operational_issues
- notifications_log

Fungsi:
- transaksi harian operasional

### Layer 3 - Event and Audit Layer
Berisi:
- inbound_package_status_history
- shipment_status_history
- nanti dapat ditambah payment history dan issue timeline

Fungsi:
- jejak proses
- audit
- analisis SLA

### Layer 4 - Analytics Layer (future)
Belum dibangun sekarang, tetapi desain harus siap.

Fungsi:
- dashboard owner
- KPI batch
- KPI shipment
- laporan payment
- laporan keterlambatan
- pertumbuhan customer

## 7. Urutan Implementasi yang Direkomendasikan

### Tahap 1
- finalisasi daftar master data yang wajib
- desain reference tables
- desain schema operasional yang mengacu ke reference tables

### Tahap 2
- buat schema baru berbasis master-data driven
- migrasikan konsep dari v2.1 ke schema baru
- siapkan sample flow baru

### Tahap 3
- validasi flow customer, admin hub, shipment, payment, issue, notification
- cek apakah semua skenario penting sudah tertangani

### Tahap 4
- implementasi PostgreSQL di VPS
- siapkan workflow n8n berdasarkan schema baru

## 8. Kesimpulan

Schema `v2.1` adalah fondasi operasional yang sangat baik.

Namun perubahan sistem dasar yang direkomendasikan adalah:
- menjadikan sistem **master-data driven**
- mempertahankan **event/history tracking**
- menyiapkan struktur yang **analytics-ready**

Dengan perubahan ini, WarekCargo akan punya fondasi yang:
- rapi
- konsisten
- mudah diaudit
- mudah diotomasi
- siap bertumbuh menjadi sistem ERP operasional dan finance yang lebih besar
