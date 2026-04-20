# Blueprint ERP WarekCargo

## 1. Tujuan Blueprint

Dokumen ini menjadi peta besar pembangunan sistem WarekCargo dari fase awal sampai siap menjadi perusahaan logistik dan jasa titip regional yang tertata, terukur, dan scalable.

Fungsi blueprint ini:
- menyatukan visi bisnis, operasional, dan sistem
- memastikan pembangunan sistem dilakukan bertahap
- menghindari fondasi data yang berantakan
- membuat Nala, admin hub, dan owner bekerja pada sumber data yang sama
- menyiapkan WarekCargo agar siap berkembang ke ERP operasional dan finance yang lebih lengkap

## 2. Ringkasan Model Bisnis WarekCargo

WarekCargo adalah jasa titip dan konsolidasi logistik untuk pelanggan Papua, terutama Nabire, yang membeli barang dari e-commerce atau seller di kota-kota besar Indonesia.

Alur utama:
1. Customer konfirmasi ke WarekCargo sebelum belanja atau sebelum seller kirim.
2. Customer mengirim data resi seller ke Nala.
3. Seller mengirim barang ke hub WarekCargo di Jakarta, Surabaya, atau Makassar.
4. Admin hub menerima, memfoto, dan mendata barang masuk.
5. Barang milik satu customer dikonsolidasikan dan direpacking.
6. Barang dikirim berdasarkan batch pengiriman via kapal kargo, kapal penumpang, atau pesawat.
7. Barang tiba di Nabire.
8. Customer mengambil sendiri atau meminta antar ke rumah.
9. Pembayaran dilakukan sebelum pengiriman final atau saat pengambilan, sesuai kesepakatan.

## 3. Prinsip Desain Sistem

Prinsip pembangunan ERP WarekCargo:
- satu paket, satu tiket, satu riwayat dari awal sampai diterima customer
- satu sumber data utama di PostgreSQL
- file foto disimpan di VPS storage, bukan di database binary
- Nala menjadi otak CS, notifikasi, dan koordinasi informasi
- admin lapangan hanya menginput data minimum yang penting
- otomasi dilakukan setelah SOP dan data dasar stabil
- sistem harus siap berkembang ke finance dan accounting tanpa bongkar total

## 4. Sasaran Sistem

ERP WarekCargo harus mampu:
- mencatat customer, paket, shipment, batch, dan pembayaran
- melacak barang dari resi awal sampai barang diterima customer
- mengelola batch pengiriman dan closing schedule
- mengirim notifikasi otomatis melalui WhatsApp
- mencatat bukti foto barang dan bukti transfer
- membuat rekap harian operasional
- mendukung laporan margin, biaya, dan cashflow di fase berikutnya

## 5. Peran Pengguna Utama

### 5.1 Owner
Habib sebagai owner:
- melihat ringkasan operasional harian
- memantau batch aktif
- memantau paket bermasalah
- memantau shipment belum dibayar
- memantau pertumbuhan bisnis

### 5.2 Nala
Peran Nala:
- customer service WhatsApp WarekCargo
- menerima pendaftaran resi dari customer
- menjelaskan batch, ETD, ETA, dan closing
- mengirim blast batch
- memberi tahu customer saat barang tiba di hub
- membantu admin dan owner dengan rekap dan notifikasi
- membantu update status pembayaran

### 5.3 Admin Hub
Peran admin hub:
- menerima paket non-COD
- memfoto paket dan label
- input data minimum paket masuk
- menyimpan paket sesuai customer
- membantu repacking dan readiness untuk batch

### 5.4 Admin Nabire atau Admin Tujuan
Peran admin tujuan:
- menerima shipment tiba
- sortir akhir
- menyiapkan pickup atau delivery
- mengonfirmasi barang sudah diambil atau diantar
- membantu pencatatan pembayaran jika dibayar saat pengambilan

## 6. Modul ERP WarekCargo

### 6.1 Modul Customer Management
Mencakup:
- data customer
- nomor WhatsApp
- kota tujuan
- alamat pengantaran
- catatan customer
- status aktif

Output utama:
- basis pelanggan aktif
- identitas customer untuk semua paket dan shipment

### 6.2 Modul Hub Management
Mencakup:
- data hub Jakarta, Surabaya, Makassar
- PIC hub
- alamat hub
- status aktif hub

Output utama:
- paket dan batch selalu terhubung ke hub yang benar

### 6.3 Modul Package Intake
Mencakup:
- registrasi resi seller dari customer
- status paket dari awal sampai delivered
- foto paket
- foto label
- catatan kondisi barang
- flags untuk COD, rusak, atau unidentified

Prinsip inti:
- satu resi seller = satu tiket paket

### 6.4 Modul Batch & Schedule Management
Mencakup:
- data batch pengiriman
- service type: hemat, cepat, express
- transport mode: kapal kargo, kapal penumpang, pesawat
- ETD, ETA, closing
- nama kapal
- status batch
- minat customer terhadap batch

Output utama:
- kalender pengiriman yang jelas
- dasar untuk blast dan follow-up oleh Nala

### 6.5 Modul Shipment Consolidation
Mencakup:
- penggabungan beberapa paket customer menjadi satu shipment final
- berat final dan volume final
- nomor kontainer
- nama kapal
- voyage number
- status shipment
- hubungan shipment ke beberapa paket

Output utama:
- satu shipment final yang bisa ditagih dan dilacak

### 6.6 Modul Payment Management
Mencakup:
- total tagihan final
- jumlah yang sudah dibayar
- metode pembayaran
- status pembayaran
- jatuh tempo pembayaran
- waktu pembayaran
- bukti transfer di storage VPS

Skenario utama:
- customer bayar penuh sebelum pengiriman final
- customer bayar sebagian
- customer bayar saat pengambilan

### 6.7 Modul Notification & Communication
Mencakup:
- notifikasi barang masuk hub
- notifikasi batch baru
- reminder closing
- notifikasi ongkir final
- notifikasi pembayaran
- log notifikasi

Channel utama:
- WhatsApp via Wablas

### 6.8 Modul Reporting Operasional
Mencakup:
- rekap barang masuk per hari
- daftar barang bermasalah
- paket belum lengkap
- batch yang akan closing
- shipment belum dibayar
- shipment siap pickup

Output utama:
- ringkasan harian untuk Habib
- ringkasan untuk admin hub

### 6.9 Modul Finance & Accounting Future Layer
Fase ini belum diprioritaskan untuk implementasi pertama, tetapi arsitekturnya harus siap.

Kelak akan mencakup:
- invoice
- kas masuk dan kas keluar
- biaya per batch
- biaya hub
- margin per shipment
- margin per batch
- jurnal otomatis
- buku besar
- laba rugi
- neraca
- arus kas

## 7. Status Operasional Utama

### 7.1 Status Paket (`inbound_packages.package_status`)
- `registered`
- `in_transit_to_hub`
- `received_at_hub`
- `damaged`
- `unidentified`
- `repacking`
- `ready_for_batch`
- `shipped`
- `arrived_destination`
- `delivered`
- `cancelled`

### 7.2 Status Batch (`shipping_batches.status`)
- `planned`
- `open`
- `closed`
- `departed`
- `arrived`
- `completed`
- `cancelled`

### 7.3 Status Shipment (`customer_shipments.shipment_status`)
- `draft`
- `awaiting_packages`
- `ready_for_dispatch`
- `dispatched`
- `arrived_nabire`
- `ready_for_pickup`
- `out_for_delivery`
- `completed`
- `cancelled`

### 7.4 Status Pembayaran (`customer_shipments.payment_status`)
- `pending`
- `partial`
- `paid`
- `cancelled`

## 8. Arsitektur Data Inti

Tabel inti saat ini:
- `customers`
- `hubs`
- `shipping_batches`
- `customer_batch_interests`
- `inbound_packages`
- `package_photos`
- `customer_shipments`
- `shipment_packages`
- `shipment_payment_proofs`
- `notifications_log`

Prinsip relasi:
- satu customer dapat memiliki banyak paket
- satu paket tercatat sebagai satu tiket utama
- banyak paket dapat digabung menjadi satu shipment
- satu shipment masuk ke satu batch
- satu shipment dapat memiliki bukti pembayaran

## 9. Arsitektur File Storage

File disimpan di VPS storage.

Jenis file yang perlu ditangani:
- foto paket
- foto label resi
- foto kerusakan
- bukti transfer pembayaran

Struktur direktori yang disarankan:
- `/var/lib/warekcargo/uploads/packages/YYYY/MM/DD/`
- `/var/lib/warekcargo/uploads/payments/YYYY/MM/DD/`

Database hanya menyimpan:
- file path
- file name
- mime type
- relasi ke entitas terkait

## 10. Integrasi Sistem

### 10.1 PostgreSQL
Peran:
- sumber data utama
- menyimpan semua transaksi inti

### 10.2 VPS Storage
Peran:
- menyimpan semua file foto dan bukti transfer

### 10.3 Wablas
Peran:
- gateway WhatsApp Business
- menerima dan mengirim pesan customer

### 10.4 n8n
Peran:
- otomasi workflow
- validasi dan transformasi data
- kirim notifikasi otomatis
- rekap harian
- sinkronisasi file dan database

### 10.5 Nala
Peran:
- antarmuka cerdas untuk customer dan admin
- membantu interpretasi data, bukan menjadi satu-satunya tempat data tersimpan

## 11. Roadmap Implementasi

### Fase 1: Core Operations Foundation
Target:
- SOP berjalan
- database inti stabil
- tracking barang berjalan
- pembayaran shipment tercatat
- Nala memahami flow bisnis

Deliverables:
- schema PostgreSQL v1
- flow admin hub
- flow customer input resi
- flow payment proof
- flow batch dan shipment

### Fase 2: Automation Layer
Target:
- notifikasi dan rekap menjadi otomatis
- integrasi WA mulai aktif
- admin tidak terlalu banyak kerja manual

Deliverables:
- integrasi Wablas
- workflow n8n untuk barang masuk
- workflow n8n untuk batch blast
- workflow n8n untuk rekap harian
- workflow n8n untuk payment confirmation

### Fase 3: ERP Lite Management
Target:
- owner punya dashboard
- margin operasional mulai terlihat
- shipment dan pembayaran bisa diaudit

Deliverables:
- dashboard owner
- laporan shipment aktif
- laporan payment status
- laporan batch performance
- laporan customer repeat order

### Fase 4: Finance & Accounting Layer
Target:
- sistem siap menjadi perusahaan skala lebih besar
- data operasional terhubung ke data keuangan

Deliverables:
- invoice engine
- cashflow module
- expense tracking
- profit report
- general ledger base

## 12. KPI Awal yang Perlu Dipantau

KPI operasional awal:
- jumlah paket masuk per hari
- jumlah shipment per minggu
- persentase shipment dibayar tepat waktu
- jumlah paket bermasalah
- waktu rata-rata dari hub received ke ready_for_batch
- waktu rata-rata dari dispatch ke pickup
- jumlah customer aktif per batch

## 13. Risiko yang Harus Dicegah dari Awal

- data ganda per resi
- paket tanpa identitas customer
- paket COD diterima admin hub
- shipment belum dibayar tapi sudah dianggap selesai
- foto bukti tidak terhubung ke data yang benar
- status barang tidak diupdate tepat waktu
- batch closing tidak dikomunikasikan jelas

## 14. Keputusan Arsitektur yang Sudah Disepakati

- PostgreSQL menjadi database utama WarekCargo
- file foto disimpan di VPS storage, bukan binary database
- satu resi seller dicatat sebagai satu tiket paket dari awal sampai selesai
- admin hub menginput data minimum agar operasional tetap ringan
- customer shipment menyimpan status pembayaran
- bukti transfer disimpan di VPS storage dan dicatat di database
- nomor kontainer, nama kapal, dan voyage number disimpan di shipment
- ERP penuh dibangun bertahap, dimulai dari core operations

## 15. Prioritas Kerja Berikutnya

Urutan kerja yang direkomendasikan:
1. Finalisasi field dan status semua tabel inti
2. Validasi ulang schema PostgreSQL v1
3. Rancang flow input customer ke Nala
4. Rancang flow admin hub ke sistem
5. Rancang flow payment proof
6. Rancang flow batch blast dan follow-up closing
7. Siapkan instalasi PostgreSQL di VPS
8. Siapkan workflow n8n tahap pertama

## 16. Kesimpulan

WarekCargo sebaiknya dibangun bukan sebagai sekadar chat-based jastip, tetapi sebagai sistem logistik dan konsolidasi yang data-driven.

Blueprint ini menempatkan WarekCargo pada jalur yang sehat:
- operasional dulu rapi
- data dulu benar
- otomasi masuk setelah fondasi stabil
- finance dan accounting dibangun di atas data operasional yang kuat

Dengan pendekatan ini, WarekCargo dapat bertumbuh dari bisnis baru menjadi perusahaan yang punya sistem, kontrol, dan kemampuan scale yang serius.
