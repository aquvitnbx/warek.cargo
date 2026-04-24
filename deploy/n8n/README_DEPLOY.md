# Deploy n8n untuk WarekCargo

## Status Runtime Saat Ini
Arah runtime terbaru WarekCargo **bukan lagi Nala-centric**.

Gunakan acuan berikut untuk integrasi baru:
- endpoint app internal: `/api/v1/internal/*`
- header auth internal: `x-internal-api-key`
- secret app internal: `INTERNAL_AUTOMATION_SECRET`
- webhook notifikasi outbound generic: `notifications-outbound`
- workflow canonical baru:
  - `warekcargo_inbound_canonical_v1.json`
  - `warekcargo_notifications_outbound_v1.json`
  - `WAREKCARGO_CANONICAL_WORKFLOWS.md`
  - `WAREKCARGO_E2E_SMOKE_TEST.md`
- workflow canonical terbaru sudah membawa guardrail timeout, fallback aman, dan jalur `SKIPPED` untuk outbound invalid
- untuk smoke test lokal, arahkan `WA_GATEWAY_SEND_URL` ke `deploy/n8n/mock_wa_gateway.mjs`

Hindari menjadikan artefak lama berbasis:
- `/api/v1/nala/*`
- `x-nala-api-key`
- `NALA_API_SECRET`
- `nala-outbound`

Artefak lama boleh dipakai hanya sebagai bahan baca historis, **bukan** blueprint deploy baru.

## 1. Install Docker dan Docker Compose plugin
Di VPS Ubuntu:

```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-v2
sudo systemctl enable docker
sudo systemctl start docker
```

## 2. Siapkan file environment
Masuk ke folder deploy:

```bash
cd /home/achmadhbib/.openclaw/workspace/deploy/n8n
cp .env.example .env
nano .env
```

Ganti minimal:
- `N8N_ENCRYPTION_KEY`
- `N8N_BASIC_AUTH_PASSWORD`
- `DB_POSTGRESDB_PASSWORD`

## 3. Penting untuk PostgreSQL host dari Docker
Secara default, `.env.example` memakai:
- `DB_POSTGRESDB_HOST=host.docker.internal`

Di Linux, jika ini tidak jalan, ubah ke salah satu opsi:
- IP host internal Docker bridge
- IP VPS lokal
- atau jalankan PostgreSQL dan n8n di network yang sama dengan penyesuaian tambahan

Untuk awal, paling praktis biasanya pakai IP host server.

## 4. Jalankan n8n

```bash
docker compose up -d
```

## 5. Cek status

```bash
docker compose ps
docker compose logs -f
```

## 6. Akses n8n
Buka:

```text
http://103.129.148.83:5678
```

Jika nanti pakai domain dan reverse proxy, update:
- `N8N_HOST`
- `N8N_PROTOCOL`
- `WEBHOOK_URL`

## 7. Catatan keamanan
Untuk tahap awal masih bisa pakai HTTP internal/terbatas.
Kalau mau dibuka publik, sebaiknya pasang:
- Nginx
- SSL/HTTPS
- firewall yang benar
