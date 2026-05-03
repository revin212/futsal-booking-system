## Deploy di VPS

Repo ini mendukung 2 cara deploy di VPS:

- **Deploy dengan Docker Compose (rekomendasi)**: lihat [`deploy/vps/README.docker.md`](README.docker.md). Di VPS, Postgres disarankan sebagai **satu container bersama** untuk banyak proyek; aplikasi ini memakai [`deploy/vps/docker-compose.app-only.yml`](docker-compose.app-only.yml) + [`deploy/vps/docker-compose.prod.yml`](docker-compose.prod.yml). Untuk stack Postgres infra ada contoh [`deploy/vps/docker-compose.postgres-infra.example.yml`](docker-compose.postgres-infra.example.yml).
- **Deploy tanpa Docker** (systemd + Postgres native + Nginx): lanjutkan dokumen ini

---

## Deploy tanpa Docker (VPS)

Dokumen ini membantu deploy **FutsalKita** di VPS (tanpa Docker) dengan stack yang sama:

- **Backend**: Spring Boot (jar) sebagai `systemd` service
- **Database**: PostgreSQL
- **Frontend**: static build (Vite) diserve oleh Nginx
- **Single origin**: Nginx proxy `/api` → backend

> Cocok untuk hosting yang tidak mendukung Docker dan untuk menghindari rewrite besar ke NodeJS+MySQL.

### 1) Prasyarat VPS

- Ubuntu 22.04/24.04 (atau distro setara)
- Akses SSH + sudo
- Domain diarahkan ke IP VPS (A record)

Install paket dasar:

```bash
sudo apt update
sudo apt install -y nginx postgresql postgresql-contrib unzip curl
```

### 2) Setup PostgreSQL

Buat DB + user:

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE futsal;
CREATE USER futsal WITH ENCRYPTED PASSWORD 'CHANGE_ME_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE futsal TO futsal;
```

Keluar `psql`:

```sql
\\q
```

### 3) Build & upload backend jar

Di mesin dev (lokal):

```bash
cd backend
./mvnw -DskipTests package
```

Upload ke VPS (contoh path):

- `/opt/futsalkita/backend/app.jar`

### 4) Environment backend

Copy contoh env:

- `deploy/vps/env/backend.env.example` → `/opt/futsalkita/backend/.env`

Lalu isi nilai sesuai kebutuhan (DB creds, JWT secret, Google client id, dll).

### 5) systemd service backend

Copy file service:

- `deploy/vps/systemd/futsalkita-backend.service` → `/etc/systemd/system/futsalkita-backend.service`

Pastikan path jar + env file sesuai.

Reload & start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable futsalkita-backend
sudo systemctl start futsalkita-backend
sudo systemctl status futsalkita-backend --no-pager
```

Log:

```bash
journalctl -u futsalkita-backend -f
```

### 6) Build & upload frontend static

Di mesin dev:

```bash
cd frontend
npm ci
VITE_API_BASE_URL=/api npm run build
```

Upload hasil build (`frontend/dist/`) ke VPS:

- `/var/www/futsalkita/`

### 7) Nginx: serve frontend + proxy /api

Copy config:

- `deploy/vps/nginx/futsalkita.conf` → `/etc/nginx/sites-available/futsalkita.conf`

Enable:

```bash
sudo ln -s /etc/nginx/sites-available/futsalkita.conf /etc/nginx/sites-enabled/futsalkita.conf
sudo nginx -t
sudo systemctl reload nginx
```

### 8) TLS (Let’s Encrypt)

Gunakan certbot (opsional tapi disarankan):

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 9) Backup DB harian (opsional tapi disarankan)

Script:

- `deploy/vps/scripts/backup_postgres.sh`

Jalankan via cron (mis. jam 02:00):

```bash
crontab -e
```

Tambahkan:

```cron
0 2 * * * /opt/futsalkita/scripts/backup_postgres.sh >/dev/null 2>&1
```

