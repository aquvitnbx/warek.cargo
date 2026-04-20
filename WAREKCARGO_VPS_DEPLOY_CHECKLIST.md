# Checklist Deploy WarekCargo di VPS

Dokumen ini adalah urutan deploy praktis untuk VPS WarekCargo dengan spesifikasi saat ini:
- 2 vCPU
- 4 GB RAM
- 60 GB Disk
- Ubuntu 24.04

## Urutan Langkah 1-5

### 1. Install PostgreSQL
Jalankan:

```bash
cd /home/achmadhbib/.openclaw/workspace
./scripts/setup_postgresql_warekcargo.sh
```

Tujuan:
- install PostgreSQL
- start service PostgreSQL
- siap dipakai untuk database WarekCargo

---

### 2. Apply schema v3
Sebelumnya buat dulu database dan user:

```bash
DB_PASSWORD='ganti-dengan-password-db-yang-kuat' ./scripts/init_warekcargo_db.sh
```

Lalu apply schema:

```bash
./scripts/apply_warekcargo_schema_v3.sh
```

Tujuan:
- membuat database `warekcargo_db`
- membuat user `warekcargo_app`
- menjalankan schema master-data driven WarekCargo

---

### 3. Siapkan storage folder
Jalankan:

```bash
./scripts/setup_warekcargo_storage.sh
```

Default path:
- `/var/lib/warekcargo/uploads/packages`
- `/var/lib/warekcargo/uploads/payments`
- `/var/lib/warekcargo/logs`
- `/var/lib/warekcargo/backups`

Tujuan:
- menyiapkan folder file upload dan operasional
- menyiapkan lokasi penyimpanan foto paket dan bukti transfer

---

### 4. Install n8n
Rekomendasi awal:
- install n8n setelah PostgreSQL dan storage siap
- gunakan cara install yang stabil dan ringan
- jika ingin sederhana, bisa pakai npm atau Docker
- jika ingin lebih mudah dikelola jangka panjang, pertimbangkan Docker + reverse proxy

Hal minimum yang perlu disiapkan:
- koneksi ke PostgreSQL
- environment untuk URL n8n
- proteksi akses dashboard n8n

Sebelum install n8n, cek:
- disk masih cukup
- PostgreSQL sudah jalan
- schema sudah berhasil diterapkan

---

### 5. Mulai bangun workflow
Workflow awal yang direkomendasikan:
- input resi customer ke database
- input barang masuk dari admin hub
- notifikasi barang masuk ke customer
- notifikasi batch baru
- rekap harian ke Habib
- input pembayaran dan bukti transfer

Tujuan:
- menjadikan n8n sebagai automation layer
- menghubungkan Nala, WhatsApp gateway, dan PostgreSQL

---

## Verifikasi Setelah Langkah 1-3

### Cek PostgreSQL
```bash
sudo -u postgres psql -l
```

### Cek database WarekCargo
```bash
sudo -u postgres psql -d warekcargo_db -c "\dt"
```

### Cek folder storage
```bash
ls -R /var/lib/warekcargo
```

---

## Catatan Penting
- jangan gunakan password VPS sebagai password database
- simpan password database di tempat aman
- jangan kirim credential di chat
- backup database harus disiapkan setelah deploy awal selesai
- monitor disk karena file foto akan terus bertambah

---

## Rekomendasi Setelah Langkah 1-5 Selesai
Setelah tahap dasar selesai, lanjutkan ke:
- install reverse proxy (Nginx)
- pasang SSL jika n8n dibuka ke publik
- setup backup PostgreSQL
- mulai integrasi WhatsApp gateway
- desain workflow AI Nala berbasis database WarekCargo
