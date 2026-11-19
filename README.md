# Kredit Skoring — Frontend

Aplikasi web penilaian kredit skoring 5C untuk BPR. Frontend ini berupa HTML/CSS/JavaScript murni
yang berkomunikasi dengan backend Google Apps Script (Web App).

## Struktur
- `index.html`   — titik masuk (harus berada di root repository)
- `css/tokens.css` — token desain (warna, font, radius, bayangan)
- `css/style.css`  — gaya aplikasi
- `js/config.js`   — **satu-satunya file yang perlu diubah**: isi `GAS_URL`
- `js/api.js`      — sesi dan pemanggilan backend
- `js/util.js`     — format dan utilitas umum
- `js/pages.js`    — seluruh halaman
- `js/app.js`      — router, kerangka halaman, dan inisialisasi

Panduan lengkap (backend, deployment GitHub Pages, dan pengujian) ada di `PANDUAN-INSTALASI.md`.
