// ============================================================
// ROUTER, SHELL, DAN INISIALISASI APLIKASI
// Routing berbasis hash: #/dashboard, #/permohonan/ID/edit/1, dst.
// ============================================================
const MENU = {
  AO: [
    ['dashboard', 'Dashboard', '#/dashboard', 'dashboard'],
    ['daftar', 'Daftar Permohonan', '#/permohonan', 'daftar'],
    ['baru', 'Permohonan Baru', '#/permohonan/baru', 'baru'],
    ['akun', 'Akun Saya', '#/akun', 'akun'],
  ],
  APPROVER: [
    ['dashboard', 'Dashboard', '#/dashboard', 'dashboard'],
    ['daftar', 'Daftar Permohonan', '#/permohonan', 'daftar'],
    ['persetujuan', 'Persetujuan', '#/persetujuan', 'persetujuan'],
    ['akun', 'Akun Saya', '#/akun', 'akun'],
  ],
  ADMIN: [
    ['users', 'Pengguna', '#/admin/users', 'users'],
    ['par', 'Parameter', '#/admin/parameter', 'par'],
    ['kop', 'Kop Surat', '#/admin/kop', 'kop'],
    ['tampilan', 'Tampilan Login', '#/admin/tampilan', 'login'],
    ['sektor', 'Sektor Ekonomi', '#/admin/sektor', 'sektor'],
    ['log', 'Log Akses', '#/admin/log', 'log'],
    ['akun', 'Akun Saya', '#/akun', 'akun'],
  ],
};

const ICON = {
  dashboard: '<path d="M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z"/>',
  daftar: '<path d="M4 4h16v16H4zM8 9h8M8 13h8M8 17h5"/>',
  baru: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  persetujuan: '<path d="M5 12l5 5L20 7"/>',
  akun: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  users: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5M15 20c0-2 2-3 4-3"/>',
  par: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M18 18h2"/>',
  kop: '<path d="M4 20V8l8-5 8 5v12M9 20v-6h6v6"/>',
  sektor: '<path d="M4 5h16M4 12h16M4 19h10"/>',
  log: '<path d="M6 3h9l4 4v14H6zM9 12h7M9 16h7"/>',
  login: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 15l5-4 4 3 3-2 6 5"/>',
};

const App = {
  brand: 'BPR Mitra Lestari',
  cache: {},
  tampilan: {},
  bg: '',

  // Inisialisasi: ambil nama bank untuk halaman login, lalu jalankan router
  async init() {
    try {
      const b = await Api.call('loginbg');
      if (b && b.ok) {
        App.brand = b.brand || App.brand;
        App.tampilan = b.tampilan || {};
        App.bg = b.bg || '';
      }
    } catch (e) { /* tetap pakai nama bawaan */ }
    window.addEventListener('hashchange', () => App.route());
    if (!location.hash) location.hash = '#/login';
    App.route();
  },

  menuFor(role) {
    if (role === 'ADMIN') return MENU.ADMIN;
    if (role === 'AO') return MENU.AO;
    return MENU.APPROVER;
  },

  // Kerangka halaman: sidebar + topbar + area konten
  shell(key, title) {
    const u = Session.get().user;
    const items = App.menuFor(u.role).map(([k, label, href, ic]) => `
      <a class="nav-item ${k === key ? 'is-active' : ''}" href="${href}">
        ${svg(ICON[ic])}<span class="label">${esc(label)}</span>
        ${k === 'persetujuan' ? '<em class="nav-badge" data-pend hidden></em>' : ''}
      </a>`).join('');

    $('#app').innerHTML = `
      <div class="shell">
        <aside class="sidebar">
          <div class="brand">
            <div class="brand-mark">K</div>
            <div><b>${esc(App.brand)}</b><small>${esc(APP_NAME)}</small></div>
          </div>
          <nav class="nav">${items}</nav>
          <div class="side-foot">
            <div class="who"><b>${esc(u.nama)}</b><small>${esc(u.jabatan)} · ${esc(u.kantor)}</small></div>
            <button class="btn-ghost-dark" id="btnLogout">Keluar</button>
          </div>
        </aside>
        <div class="content">
          <header class="topbar"><h1>${esc(title)}</h1></header>
          <main id="main" class="main"><div class="skeleton"></div></main>
        </div>
      </div>`;
    $('#btnLogout').onclick = () => App.logout();
    App.refreshPending();
  },

  // Halaman dengan kerangka; error ditangkap agar aplikasi tidak macet
  async page(key, title, fn) {
    App.shell(key, title);
    try { await fn(); }
    catch (e) { console.error(e); App.error('Terjadi kesalahan saat memuat halaman. Coba muat ulang.'); }
  },

  error(msg) {
    const m = $('#main');
    if (m) m.innerHTML = `<div class="card"><h3>Tidak dapat menampilkan halaman</h3><p class="muted">${esc(msg)}</p><a class="link" href="#/dashboard">Kembali ke Dashboard</a></div>`;
  },

  // Badge jumlah permohonan yang menunggu keputusan pengguna saat ini
  async refreshPending() {
    const s = Session.get();
    if (!s || !['MANAJER_OPS', 'PIMPINAN_CABANG', 'DIREKTUR_UTAMA'].includes(s.user.role)) return;
    const want = s.user.role === 'DIREKTUR_UTAMA' ? 'DIREKTUR' : 'TAHAP1';
    const r = await Api.call('list', {});
    if (!r.ok) return;
    const n = (r.rows || []).filter(x => x.status === want).length;
    const el = $('[data-pend]');
    if (el) { el.textContent = n; el.hidden = !n; }
  },

  async logout() {
    await Api.call('logout');
    Session.clear();
    location.hash = '#/login';
  },

  // Router utama
  async route() {
    const parts = (location.hash || '#/login').slice(2).split('/').map(decodeURIComponent);
    const [page = 'login', a, b, c] = parts;
    const s = Session.get();

    if (!s) {
      if (page === 'login') return Pages.login();
      location.hash = '#/login';
      return;
    }
    if (s.user.mustChange) {
      if (page === 'ganti') return Pages.ganti();
      location.hash = '#/ganti';
      return;
    }
    if (page === 'ganti' || page === 'login') { location.hash = '#/dashboard'; return; }

    const isAdmin = s.user.role === 'ADMIN';
    if (isAdmin && ['dashboard', 'permohonan', 'persetujuan', 'memo'].includes(page)) {
      location.hash = '#/admin/users'; return;
    }
    if (!isAdmin && page === 'admin') { location.hash = '#/dashboard'; return; }

    switch (page) {
      case 'dashboard':
        return App.page('dashboard', 'Dashboard', Pages.dashboard);
      case 'permohonan':
        if (!a) return App.page('daftar', 'Daftar Permohonan', Pages.daftar);
        if (a === 'baru') return App.page('baru', 'Permohonan Baru', () => Pages.form(null, 1));
        if (b === 'edit') return App.page('daftar', 'Ubah Permohonan', () => Pages.form(a, Number(c) || 1));
        return App.page('daftar', 'Detail Permohonan', () => Pages.detail(a));
      case 'persetujuan':
        if (a) return App.page('persetujuan', 'Persetujuan Kredit', () => Pages.approve(a));
        return App.page('persetujuan', 'Persetujuan', Pages.persetujuan);
      case 'memo':
        return App.page('daftar', 'Pratinjau Memo', () => Pages.memo(a));
      case 'akun':
        return App.page('akun', 'Akun Saya', () => Pages.akun());
      case 'admin': {
        const map = {
          users: ['users', 'Pengguna', Pages.adminUsers],
          parameter: ['par', 'Parameter Penilaian', Pages.adminPar],
          kop: ['kop', 'Kop Surat', Pages.adminKop],
          sektor: ['sektor', 'Sektor Ekonomi', Pages.adminSektor],
          log: ['log', 'Log Akses', Pages.adminLog],
          tampilan: ['tampilan', 'Tampilan Login', Pages.adminTampilan],
        };
        const m = map[a] || map.users;
        return App.page(m[0], m[1], m[2]);
      }
      default:
        location.hash = '#/dashboard';
    }
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
