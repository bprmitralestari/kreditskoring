// ============================================================
// UTILITAS UMUM (format, escape, komponen kecil)
// ============================================================
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

// Escape untuk mencegah injeksi HTML dari data pengguna
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

const num = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const rp = v => 'Rp ' + Math.round(num(v)).toLocaleString('id-ID');
const tgl = v => /^\d{4}-\d{2}-\d{2}/.test(String(v || ''))
  ? `${String(v).slice(8, 10)}/${String(v).slice(5, 7)}/${String(v).slice(0, 4)}` : String(v || '');
const jam = v => String(v || '').replace('T', ' ').slice(0, 16);
const pctTampil = v => (num(v) * 100).toFixed(2) + '%';

const ROLE_LABEL = {
  AO: 'Account Officer', MANAJER_OPS: 'Manajer Operasional', PIMPINAN_CABANG: 'Pimpinan Cabang',
  DIREKTUR_UTAMA: 'Direktur Utama', ADMIN: 'Administrator',
};

// Status permohonan: [label, kelas badge]
const STATUS = {
  DRAFT: ['Draft', 'draft'],
  TAHAP1: ['Menunggu Penyetuju Tahap 1', 'waiting'],
  DIREKTUR: ['Menunggu Direktur Utama', 'direktur'],
  DISETUJUI: ['Disetujui', 'success'],
  DITOLAK: ['Ditolak', 'danger'],
};
const badge = st => {
  const s = STATUS[st] || [st, 'draft'];
  return `<span class="badge badge-${s[1]}">${esc(s[0])}</span>`;
};

// Predikat 5C -> kelas warna
const PRED_CLS = { 'Sangat Layak': 'sl', 'Layak': 'l', 'Cukup Layak': 'cl', 'Kurang Layak': 'kl', 'Tidak Layak': 'tl' };
const chipPred = p => p
  ? `<span class="chip chip-${PRED_CLS[p] || 'cl'}">${esc(p)}</span>` : '<span class="muted">-</span>';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

// Unduh berkas dari base64
function unduh(base64, nama, mime) {
  const bin = atob(base64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([arr], { type: mime }));
  const a = document.createElement('a');
  a.href = url; a.download = nama;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Ubah berkas pilihan pengguna menjadi payload base64 (gambar dikecilkan di klien)
function fileToPayload(file) {
  return new Promise((resolve, reject) => {
    if (file.type === 'application/pdf') {
      if (file.size > 1.5 * 1024 * 1024) return reject(new Error(file.name + ': PDF maksimal 1,5 MB.'));
      const r = new FileReader();
      r.onload = () => resolve({ nama: file.name, mime: 'application/pdf', data: String(r.result).split(',')[1] });
      r.onerror = () => reject(new Error('Berkas tidak dapat dibaca.'));
      return r.readAsDataURL(file);
    }
    if (!/^image\/(jpeg|png)$/.test(file.type)) {
      return reject(new Error(file.name + ': format harus JPG, PNG, atau PDF.'));
    }
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 1000 / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.width * k));
      c.height = Math.max(1, Math.round(img.height * k));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      resolve({
        nama: file.name.replace(/\.\w+$/, '') + '.jpg',
        mime: 'image/jpeg',
        data: c.toDataURL('image/jpeg', 0.8).split(',')[1],
      });
    };
    img.onerror = () => reject(new Error(file.name + ': gambar tidak dapat dibaca.'));
    const r = new FileReader();
    r.onload = () => { img.src = r.result; };
    r.readAsDataURL(file);
  });
}

// Baca file sebagai base64 mentah (untuk logo kop)
function fileBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve({ data: String(r.result).split(',')[1], mime: file.type });
    r.onerror = () => reject(new Error('Berkas tidak dapat dibaca.'));
    r.readAsDataURL(file);
  });
}

const Toast = {
  show(msg, type = 'info') {
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = msg;
    $('#toasts').appendChild(el);
    setTimeout(() => el.remove(), 4000);
  },
};

// Dialog sederhana. Mengembalikan { el, close }
function modal(html) {
  const wrap = document.createElement('div');
  wrap.className = 'overlay';
  wrap.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
  wrap.addEventListener('click', e => { if (e.target === wrap) wrap.remove(); });
  document.body.appendChild(wrap);
  return { el: wrap.querySelector('.modal'), close: () => wrap.remove() };
}

// Ambil nilai dari path bertitik, mis. "arus.beban.hpp" atau "relasi.0.nama"
function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
function setPath(obj, path, val) {
  const ks = path.split('.');
  let o = obj;
  ks.slice(0, -1).forEach((k, i) => {
    if (o[k] === undefined || o[k] === null) o[k] = /^\d+$/.test(ks[i + 1]) ? [] : {};
    o = o[k];
  });
  o[ks[ks.length - 1]] = val;
}

function debounce(fn, ms = 350) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

// Lencana status tidak berubah; ikon SVG kecil untuk sidebar
const svg = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
