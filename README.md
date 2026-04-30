# FutsalKita (Fase 1)

Monorepo website booking & reservasi lapangan futsal (UMKM) — **Frontend (Vite+React)** + **Backend (Spring Boot)** + **PostgreSQL** via **Docker Compose**.

## Prasyarat
- Docker Desktop (Compose v2)

## Menjalankan (Fase 1)
Di root repo:

```bash
docker compose up --build
```

Lalu buka:
- Frontend: `http://localhost`
- Backend (via proxy): `http://localhost/api/health`

## Environment variables (penting untuk login Google)
Login Google memakai Google Identity Services (GIS): frontend dapat `id_token` → kirim ke backend → backend verifikasi → backend issue JWT aplikasi.

Set env ini (paling mudah buat file `.env` di root):

```bash
GOOGLE_CLIENT_ID=YOUR_GOOGLE_OAUTH_WEB_CLIENT_ID.apps.googleusercontent.com
JWT_SECRET=CHANGE_ME_TO_A_LONG_RANDOM_SECRET
```

Catatan:
- Kalau `GOOGLE_CLIENT_ID` masih `CHANGE_ME...` maka tombol login Google di `/masuk` akan disable, dan backend akan menolak token.

## Admin dashboard login (mock, non-Google)
Untuk **akses admin dashboard** gunakan login email+password (bukan Google OAuth).

- **Route**: `http://localhost/admin/login`
- **Credentials (default seed)**:
  - Email: `admin@futsal.com`
  - Password: `admin12345`

Catatan:
- Akun yang dibuat dari **Google OAuth selalu role `USER`**.
- Jika email tersebut adalah akun `ADMIN`, endpoint Google login akan menolak dan meminta pakai Admin Login.
- Akun admin dibuat manual di database (seed/default via Flyway `V1` + password via Flyway `V9`).

## Phase 6: Mock Payment Gateway
Alur pembayaran sekarang memakai **payment intent** + halaman gateway mock.

- Buat booking (status `MENUNGGU_PEMBAYARAN`)
- Buka detail booking: `http://localhost/booking/:id`
- Klik **“Bayar via Gateway (Mock)”** → diarahkan ke:
  - `http://localhost/payment-gateway/:intentId`
- Klik **Pay Success** → backend set booking jadi `LUNAS` + trigger notifikasi.

### Invoice
Jika booking sudah **LUNAS/SELESAI**, invoice bisa dilihat di:
- `http://localhost/invoice/:bookingId`

Backend endpoints:
- `POST /api/payment-intent` `{ "bookingId": <id> }` (auth)
- `GET /api/payment-intent/{intentId}` (auth)
- `POST /api/mock-gateway/{intentId}/pay` (auth)
- `POST /api/mock-gateway/{intentId}/fail` (auth)
- `GET /api/invoice/{bookingId}` (auth)

## Phase 7: WhatsApp Notification Provider (CallMeBot optional)
Default notifikasi tetap **WA mock** (log + simpan ke DB `notification_log`).

Kalau mau kirim WA gratis via **CallMeBot** (personal use), set:
- `pengaturan_sistem.WaProvider = CALLMEBOT`
- `pengaturan_sistem.CallMeBotApiKey = <apikey>`
- Pastikan user punya `no_hp` yang valid (format `+62...`) agar notifikasi user bisa terkirim.

Catatan:
- CallMeBot adalah layanan pihak ketiga, bukan WhatsApp resmi.
- Jika konfigurasi belum lengkap, sistem akan **SKIP** pengiriman dan tetap menyimpan log.

## Cara membuat Google OAuth Client ID (Web)
1. Buka Google Cloud Console → pilih/buat Project.
2. **OAuth consent screen**: set ke *External* (untuk testing), isi data minimum.
3. **Credentials** → **Create credentials** → **OAuth client ID**.
4. Application type: **Web application**.
5. Isi:
   - **Authorized JavaScript origins**: `http://localhost`
6. Copy **Client ID**, lalu set ke `GOOGLE_CLIENT_ID`.

## Manual test (Fase 1)
- Jalankan `docker compose up --build`
- Buka `http://localhost/masuk`
  - Jika `GOOGLE_CLIENT_ID` sudah benar: klik “Masuk dengan Google” → selesai login → dapat toast success.
  - Jika belum: akan muncul panel info dan tombol disabled.

## Struktur direktori
- `docker-compose.yml`: postgres + backend + frontend (Nginx serve + proxy `/api`)
- `backend/`: Spring Boot 3.x + Flyway + Security + Auth Google→JWT
- `frontend/`: Vite React TS + Tailwind + shadcn/ui + TanStack Query + React Router

## Deploy ke VPS

- **Docker Compose (rekomendasi)**: baca `deploy/vps/README.docker.md`
- **Tanpa Docker (systemd + Nginx + Postgres)**: baca `deploy/vps/README.md`

