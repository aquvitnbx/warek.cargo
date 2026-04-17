# Deploy n8n untuk WarekCargo

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
