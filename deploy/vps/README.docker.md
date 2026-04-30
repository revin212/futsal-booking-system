## Deploy di VPS (Docker Compose) — rekomendasi

Panduan ini untuk deploy **FutsalKita** di VPS dengan **Docker Compose**, dengan pola yang aman dan mudah:

- App berjalan via `docker compose` (Postgres + Backend + Frontend/Nginx)
- Reverse proxy + TLS (Let’s Encrypt) pakai **Nginx di host**
- Semua trafik publik masuk ke **satu origin** (domain kamu) dan `/api` diproxy internal (oleh Nginx di container frontend)

> Target OS: Ubuntu 22.04/24.04. Perintah di bawah diasumsikan dijalankan di VPS.

### 0) Prasyarat

- Domain sudah mengarah ke IP VPS (A record)
- Port **80** dan **443** terbuka (security group / firewall)

Install paket dasar:

```bash
sudo apt update
sudo apt install -y ca-certificates curl git nginx
```

### 1) Install Docker Engine + Compose

Cara paling aman ikuti dokumentasi resmi Docker (Ubuntu).

Verifikasi:

```bash
docker --version
docker compose version
```

(Opsional) biar tidak perlu `sudo`:

```bash
sudo usermod -aG docker $USER
newgrp docker
```

### 2) Clone repo ke VPS

Contoh:

```bash
sudo mkdir -p /opt/futsalkita
sudo chown -R $USER:$USER /opt/futsalkita
cd /opt/futsalkita
git clone <URL_REPO_KAMU> .
```

### 3) Buat file environment produksi

Di root repo, buat file `.env`:

```bash
cd /opt/futsalkita
nano .env
```

Contoh isi (wajib ganti yang `CHANGE_ME`):

```bash
# Postgres (dipakai oleh postgres container dan backend)
POSTGRES_DB=futsal
POSTGRES_USER=futsal
POSTGRES_PASSWORD=CHANGE_ME_STRONG_DB_PASSWORD

# Auth / JWT
GOOGLE_CLIENT_ID=CHANGE_ME_GOOGLE_CLIENT_ID.apps.googleusercontent.com
JWT_SECRET=CHANGE_ME_SUPER_SECRET_MIN_32_BYTES_0123456789abcdef
JWT_ISSUER=futsalkita
JWT_ACCESS_TTL_MINUTES=120

# Optional (dibake ke build frontend)
ADMIN_WA_NUMBER=+6281234567890
```

Catatan penting:
- `GOOGLE_CLIENT_ID` harus sama dengan yang kamu set di Google Cloud OAuth Client (web).
- `JWT_SECRET` sebaiknya random panjang (≥ 32 bytes).

### 4) Jalankan container (mode produksi)

Di VPS, jalankan dengan file override produksi yang akan kita pakai:

```bash
docker compose -f docker-compose.yml -f deploy/vps/docker-compose.prod.yml up -d --build
```

Cek status:

```bash
docker compose ps
docker compose logs -f --tail=200
```

Tes lokal di VPS:

```bash
curl -i http://127.0.0.1:8080/
curl -i http://127.0.0.1:8080/api/health
```

### 5) Nginx host: reverse proxy + TLS

#### 5a) Konfigurasi Nginx (HTTP)

Copy config:

```bash
sudo cp /opt/futsalkita/deploy/vps/nginx/futsalkita-docker.conf /etc/nginx/sites-available/futsalkita.conf
sudo ln -sf /etc/nginx/sites-available/futsalkita.conf /etc/nginx/sites-enabled/futsalkita.conf
sudo nginx -t
sudo systemctl reload nginx
```

Sebelum lanjut TLS, pastikan domain kamu sudah bisa akses HTTP:

```bash
curl -i http://YOUR_DOMAIN/
```

#### 5b) Pasang TLS Let’s Encrypt (Certbot)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d YOUR_DOMAIN
```

Auto-renew:

```bash
sudo systemctl status certbot.timer --no-pager
sudo certbot renew --dry-run
```

### 6) Auto-start saat VPS reboot

Pastikan Docker aktif:

```bash
sudo systemctl enable --now docker
```

Compose V2 mendukung `restart:` di file compose (sudah diset di override produksi). Setelah itu container akan otomatis start saat daemon Docker start.

### 7) Backup Postgres (opsional tapi disarankan)

Script backup (docker) tersedia:

- `deploy/vps/scripts/backup_postgres_docker.sh`

Contoh pemasangan:

```bash
sudo mkdir -p /opt/futsalkita/backups
sudo chmod +x /opt/futsalkita/deploy/vps/scripts/backup_postgres_docker.sh
```

Jalankan manual:

```bash
cd /opt/futsalkita
POSTGRES_DB=futsal POSTGRES_USER=futsal docker compose exec -T postgres \
  sh -lc 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip -9' \
  > "/opt/futsalkita/backups/pgdump-futsal-$(date -u +%Y%m%dT%H%M%SZ).sql.gz"
```

Atau pakai cron (jam 02:00):

```bash
crontab -e
```

Tambahkan:

```cron
0 2 * * * /opt/futsalkita/deploy/vps/scripts/backup_postgres_docker.sh >/dev/null 2>&1
```

### Troubleshooting singkat

- **Lihat log**:
  - `docker compose logs -f --tail=200`
- **Cek backend up**:
  - `curl -i http://127.0.0.1:8080/api/health`
- **Port 80/443 bentrok**:
  - Pastikan container **tidak** bind ke `:80/:443` publik. Di produksi kita bind ke `127.0.0.1:8080` (lihat `deploy/vps/docker-compose.prod.yml`) dan Nginx host yang expose 80/443.
- **Google login tidak bisa**:
  - Pastikan `GOOGLE_CLIENT_ID` benar dan origin/authorized domain sudah sesuai (production domain).

