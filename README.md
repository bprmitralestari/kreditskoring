# Kredit Skoring — Frontend (v5)

Aplikasi web penilaian kredit skoring 5C untuk BPR. Frontend berupa HTML/CSS/JavaScript murni
yang berkomunikasi dengan backend Google Apps Script (Web App) di folder `backend/`.

## Struktur
- `index.html`     — titik masuk (harus berada di root repository)
- `css/tokens.css` — token desain
- `css/style.css`  — gaya aplikasi
- `js/config.js`   — **satu-satunya file yang perlu diubah**: isi `GAS_URL`
- `js/api.js`      — sesi dan pemanggilan backend
- `js/util.js`     — format dan utilitas umum
- `js/pages.js`    — halaman non-form (login, dashboard, daftar, admin, dll.)
- `js/form.js`     — formulir permohonan 4 langkah dan pratinjau memo langsung
- `js/app.js`      — router, kerangka halaman, dan inisialisasi
- `backend/Code.gs` — kode backend (salin ke Apps Script)

Panduan pemasangan dan pembaruan ada di `PANDUAN-V5.md`.
