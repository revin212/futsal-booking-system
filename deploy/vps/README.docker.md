## Deploy di VPS (Docker Compose) — rekomendasi

Panduan ini untuk deploy **FutsalKita** di VPS dengan **Docker Compose**, dengan **satu instance PostgreSQL** (container Docker) yang dipakai bersama **banyak proyek** di VPS yang sama. Aplikasi FutsalKita hanya menjalankan **backend + frontend**; database terhubung lewat jaringan Docker bersama.

- **Postgres**: stack infra terpisah (satu container, satu volume, biasanya `shared-postgres` di network `shared-db-net`)
- **FutsalKita**: `deploy/vps/docker-compose.app-only.yml` + override produksi
- Reverse proxy + TLS (Let’s Encrypt) pakai **Nginx di host**
- Trafik publik ke **satu origin** (domain), `/api` diproxy internal (Nginx di container frontend)

> Target OS: Ubuntu 22.04/24.04. Perintah di bawah diasumsikan dijalankan di VPS.

Lokal (laptop) tetap bisa memakai [`docker-compose.yml`](../../docker-compose.yml) penuh (Postgres + backend + frontend) tanpa setup infra terpisah.

### 0) Prasyarat

- Domain sudah mengarah ke IP VPS (A record)
- Port **80** dan **443** terbuka (security group / firewall)

Install paket dasar:

```bash
sudo apt update
sudo apt install -y ca-certificates curl git nginx
```

### 1) Install Docker Engine + Compose

Ikuti dokumentasi resmi Docker (Ubuntu), lalu verifikasi:

```bash
docker --version
docker compose version
```

(Opsional) agar tidak perlu `sudo`:

```bash
sudo usermod -aG docker $USER
newgrp docker
```

### 2) Postgres bersama (sekali per VPS, dipakai banyak proyek)

**2a) Network Docker**

Jika belum ada (opsional bila memakai compose infra di bawah yang membuat network sekaligus):

```bash
docker network create shared-db-net
```

**2b) Stack Postgres**

Contoh file compose disediakan di repo: [`deploy/vps/docker-compose.postgres-infra.example.yml`](docker-compose.postgres-infra.example.yml). Salin ke misalnya `/opt/docker-infra/postgres/docker-compose.yml`, buat `.env` di folder yang sama (terpisah dari `.env` aplikasi), misalnya:

```bash
POSTGRES_INFRA_PASSWORD=CHANGE_ME_STRONG_SUPERUSER_PASSWORD
# opsional:
# POSTGRES_INFRA_USER=postgres
# POSTGRES_CONTAINER_NAME=shared-postgres
# SHARED_DB_NETWORK=shared-db-net
```

Lalu:

```bash
cd /opt/docker-infra/postgres
docker compose up -d
```

Pastikan container berjalan (nama default `shared-postgres` sesuai variabel `POSTGRES_CONTAINER_NAME` jika di-set).

**Jangan** publish port `5432` ke `0.0.0.0`. Biarkan akses hanya dari jaringan Docker; jika perlu admin dari host, uncomment `127.0.0.1:5432:5432` di file compose infra.

**2c) Database dan user untuk FutsalKita**

Buat database + role khusus aplikasi (isolasi dari proyek lain di Postgres yang sama). Ganti `postgres` dengan nilai `POSTGRES_INFRA_USER` Anda jika berbeda:

```bash
docker exec -it shared-postgres psql -U postgres
```

```sql
CREATE USER futsal WITH ENCRYPTED PASSWORD 'CHANGE_ME_STRONG_DB_PASSWORD';
CREATE DATABASE futsal OWNER futsal;
GRANT ALL PRIVILEGES ON DATABASE futsal TO futsal;
\c futsal
GRANT ALL ON SCHEMA public TO futsal;
```

Keluar: `\q`

Simpan password aplikasi ini untuk `.env` FutsalKita (`DB_PASSWORD`), bukan hanya password superuser infra.

### 3) Clone repo FutsalKita ke VPS

```bash
sudo mkdir -p /opt/futsalkita
sudo chown -R $USER:$USER /opt/futsalkita
cd /opt/futsalkita
git clone <URL_REPO_KAMU> .
```

### 4) File environment produksi (aplikasi)

Di **root repo** FutsalKita, buat `.env`:

```bash
cd /opt/futsalkita
nano .env
```

Contoh isi (wajib ganti yang `CHANGE_ME`):

```bash
# Koneksi ke Postgres bersama (hostname = nama container, network Docker sama)
DB_HOST=shared-postgres
DB_PORT=5432
DB_NAME=futsal
DB_USERNAME=futsal
DB_PASSWORD=CHANGE_ME_STRONG_DB_PASSWORD

# Auth / JWT
GOOGLE_CLIENT_ID=CHANGE_ME_GOOGLE_CLIENT_ID.apps.googleusercontent.com
JWT_SECRET=CHANGE_ME_SUPER_SECRET_MIN_32_BYTES_0123456789abcdef
JWT_ISSUER=futsalkita
JWT_ACCESS_TTL_MINUTES=120

# Optional (dibake ke build frontend)
ADMIN_WA_NUMBER=+6281234567890
```

Catatan:

- `DB_HOST` harus sama dengan nama container Postgres (`shared-postgres` secara default) dan backend harus berada di network yang sama (`shared-db-net`).
- `GOOGLE_CLIENT_ID` harus sama dengan Google Cloud OAuth Client (web).
- `JWT_SECRET` sebaiknya random panjang (≥ 32 karakter).

Variabel `POSTGRES_*` **tidak** dipakai oleh stack aplikasi ini di VPS; itu untuk compose infra Postgres.

### 5) Jalankan container aplikasi (mode produksi)

```bash
cd /opt/futsalkita
docker compose -f deploy/vps/docker-compose.app-only.yml -f deploy/vps/docker-compose.prod.yml up -d --build
```

Cek status:

```bash
docker compose -f deploy/vps/docker-compose.app-only.yml -f deploy/vps/docker-compose.prod.yml ps
docker compose -f deploy/vps/docker-compose.app-only.yml -f deploy/vps/docker-compose.prod.yml logs -f --tail=200
```

Tes di VPS:

```bash
curl -i http://127.0.0.1:8080/
curl -i http://127.0.0.1:8080/api/health
```

### 6) Nginx host: reverse proxy + TLS

#### 6a) Konfigurasi Nginx (HTTP)

```bash
sudo cp /opt/futsalkita/deploy/vps/nginx/futsalkita-docker.conf /etc/nginx/sites-available/futsalkita.conf
sudo ln -sf /etc/nginx/sites-available/futsalkita.conf /etc/nginx/sites-enabled/futsalkita.conf
sudo nginx -t
sudo systemctl reload nginx
```

Pastikan domain sudah bisa diakses HTTP:

```bash
curl -i http://YOUR_DOMAIN/
```

#### 6b) TLS Let’s Encrypt (Certbot)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d YOUR_DOMAIN
```

Auto-renew:

```bash
sudo systemctl status certbot.timer --no-pager
sudo certbot renew --dry-run
```

### 7) Auto-start saat VPS reboot

```bash
sudo systemctl enable --now docker
```

Layanan compose memakai `restart: unless-stopped` di override produksi.

### 8) Backup Postgres (disarankan)

Script: [`deploy/vps/scripts/backup_postgres_docker.sh`](scripts/backup_postgres_docker.sh)

Contoh pemasangan:

```bash
sudo mkdir -p /opt/futsalkita/backups
sudo chmod +x /opt/futsalkita/deploy/vps/scripts/backup_postgres_docker.sh
```

Variabel yang dipakai (bisa di-export atau diset di crontab):

- `POSTGRES_CONTAINER` (default: `shared-postgres`)
- `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`
- `BACKUP_DIR` (default: `/opt/futsalkita/backups`)

Contoh manual:

```bash
cd /opt/futsalkita
set -a && source .env && set +a
POSTGRES_CONTAINER=shared-postgres \
  ./deploy/vps/scripts/backup_postgres_docker.sh
```

Cron (jam 02:00) — sumberkan `.env` agar password tersedia:

```cron
0 2 * * * cd /opt/futsalkita && set -a && . ./.env && set +a && /opt/futsalkita/deploy/vps/scripts/backup_postgres_docker.sh >/dev/null 2>&1
```

Untuk **beberapa database** di Postgres yang sama, jalankan script per database (override `DB_NAME` / kredensial) atau buat entri cron terpisah.

### 9) Operasional multi-proyek

- Satu upgrade Postgres mempengaruhi semua database di instance itu; backup semua DB sebelum upgrade major.
- Pantau RAM, disk, dan `max_connections`.
- Gunakan nama database dan user yang unik per proyek agar tidak bentrok.

### Troubleshooting singkat

- **Log**: `docker compose -f deploy/vps/docker-compose.app-only.yml -f deploy/vps/docker-compose.prod.yml logs -f --tail=200`
- **Backend**: `curl -i http://127.0.0.1:8080/api/health`
- **Port 80/443 bentrok**: frontend produksi bind ke `127.0.0.1:8080` (lihat `deploy/vps/docker-compose.prod.yml`); Nginx host yang mengekspos 80/443.
- **Backend tidak konek DB**: pastikan container backend ada di network `shared-db-net`, `DB_HOST` sama nama container Postgres, dan firewall internal tidak memblok antar-container.
- **Google login**: pastikan `GOOGLE_CLIENT_ID` dan authorized domain di konsol Google sesuai domain produksi.

### Semua-in-satu (Postgres di compose yang sama dengan app)

Untuk lingkungan tunggal tanpa Postgres bersama, tetap bisa memakai:

```bash
docker compose -f docker-compose.yml -f deploy/vps/docker-compose.prod.yml up -d --build
```

File [`docker-compose.yml`](../../docker-compose.yml) masih menyertakan layanan `postgres` untuk kemudahan lokal / deployment sederhana.
