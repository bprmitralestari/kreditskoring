// ============================================================
// HALAMAN-HALAMAN APLIKASI
// Setiap Pages.* mengisi #main (atau #app untuk halaman penuh).
// Perhitungan kredit SELALU dilakukan server; frontend hanya menampilkan.
// ============================================================

// ---------- Data referensi penilaian 5C (teks pilihan & label) ----------
// Urutan opsi: indeks 0 = skor 5 ... indeks 4 = skor 1
const KRITERIA = [
  { nama: 'Character (Watak)', items: [
    { k: '0.0', l: 'SLIK (riwayat kredit)', o: ['Lancar tepat waktu', 'Lancar', 'Ada tunggakan tetapi kredit lancar', 'Kredit kurang lancar / diragukan', 'Kredit macet'] },
    { k: '0.1', l: 'Keterbukaan informasi', o: ['Lengkap & debitur lebih banyak menyampaikan informasi', 'Lengkap & debitur menjelaskan sesuai pertanyaan', 'Cukup memberikan informasi', 'Kurang informasi, tidak relevan, ada yang disembunyikan', 'Tidak lengkap, tidak terbuka, banyak disembunyikan'] },
    { k: '0.2', l: 'Lama menjadi nasabah', o: ['> 5 tahun', '> 4 s.d 5 tahun', '> 3 - 4 tahun', '2 - 3 tahun', 'Kurang dari 2 tahun'] },
    { k: '0.3', l: 'Keluarga', o: ['Menikah & memiliki anak', 'Menikah', 'Lajang / Single', 'Janda atau Duda', 'Pasangan lebih dari 1 orang'] },
  ]},
  { nama: 'Capacity (Kemampuan)', items: [
    { k: '1.0', l: 'RPC (repayment capacity)', auto: true },
    { k: '1.1', l: 'Lama bekerja / lama usaha', o: ['> 4 tahun', '3 - 4 tahun', '2 - 3 tahun', '1 - 2 tahun', '< 1 tahun'] },
    { k: '1.2', l: 'Rekening simpanan', o: ['Memiliki saldo, mutasi aktif, jarang penarikan', 'Memiliki saldo dan mutasi aktif', 'Saldo cukup, mutasi cukup aktif', 'Saldo minim', 'Tidak memiliki saldo'] },
  ]},
  { nama: 'Modal', items: [
    { k: '2.0', l: 'Rasio hutang terhadap aset (DAR)', o: ['< 20%', '20 - 30%', '30 - 40%', '40 - 80%', '> 80%'] },
    { k: '2.1', l: 'Status kepemilikan rumah', o: ['Rumah milik sendiri', 'Rumah milik pasangan', 'Rumah milik orang tua / saudara kandung', 'Rumah sewa atas nama sendiri/pasangan', 'Rumah sewa / milik atas nama orang lain'] },
  ]},
  { nama: 'Condition of Economic', items: [
    { k: '3.0', l: 'Stabilitas perusahaan / instansi', o: ['Sangat Baik', 'Baik', 'Cukup Baik', 'Kurang Baik', 'Tidak Baik'] },
  ]},
  { nama: 'Collateral (Jaminan)', items: [
    { k: '4.0', l: 'Kepemilikan agunan', o: ['Atas nama calon debitur', 'Proses balik nama / BPKB hanya kuitansi jual beli', 'Orang tua', 'Saudara', 'Orang lain, rekan usaha'] },
    { k: '4.1', l: 'Peruntukan', o: ['Ruko untuk pribadi', 'Ruko untuk disewakan', 'Tempat tinggal / bersama / transportasi', 'Kosong / digunakan rekan usaha', 'Sawah / digunakan orang lain'] },
    { k: '4.2', l: 'Lebar jalan', o: ['Akses mobil jalan provinsi', 'Akses mobil jalan kabupaten / kota', 'Akses mobil jalan desa', 'Akses hanya sepeda motor', 'Akses hanya pejalan kaki'] },
    { k: '4.3', l: 'Nilai agunan (coverage)', o: ['> 140%', '> 130 - 140%', '> 120 - 130%', '> 110 - 120%', '< 110%'] },
    { k: '4.4', l: 'Marketable', o: ['Sangat marketable', 'Marketable', 'Cukup marketable', 'Kurang marketable', 'Tidak marketable'] },
  ]},
];

const BEBAN = [
  ['hpp', 'HPP / pembelian bahan baku'], ['tenaga', 'Beban tenaga kerja'], ['sewa', 'Beban sewa'],
  ['transport', 'Transportasi'], ['listrik', 'Listrik & air'], ['telekom', 'Telekomunikasi'],
  ['lainU', 'Beban usaha lainnya'], ['hidup', 'Biaya hidup keluarga'], ['pendidikan', 'Biaya pendidikan anak'],
  ['lainRT', 'Beban rumah tangga lainnya'],
];
const JENIS_AGUNAN = ['Tanah / Bangunan', 'Kendaraan', 'Alat Berat', 'Bilyet Deposito', 'Tanpa Jaminan (khusus karyawan)'];
const SEL_RELASI = ['Istri / Suami', 'Orang Tua', 'Anak', 'Saudara', 'Badan Usaha', 'Lainnya'];
const SEL_NIKAH = ['Belum Menikah', 'Menikah', 'Janda', 'Duda'];
const SEL_JK = ['Laki-laki', 'Perempuan'];
const SEL_DIDIK = ['Tidak Sekolah', 'SD', 'SMP', 'SMA', 'S1', 'S2', 'S3'];

const blankForm = () => ({
  jenis_permohonan: '', skema: '', jenis_debitur: '', nama: '', nik: '', pekerjaan: '',
  tempat_lahir: '', tgl_lahir: '', jk: '', nikah: '', pendidikan: '', telp: '', email: '',
  alamat: '', desa: '', kecamatan: '', kota: '', sektor: '', tujuan: '', profil_usaha: '',
  plafon: 0, tenor: 0, bunga: 0, jenis_angsuran: '',
  arus: { gaji: 0, usaha: 0, lain: 0, angsuran_hutang: 0, beban: {} },
  skor: {}, relasi: [], agunan: [],
});

const kpiIcon = d => `<span class="kpi-ic">${svg(d)}</span>`;
const ICO_FOLDER = '<path d="M3 7h6l2 2h10v10H3z"/>';
const ICO_CLOCK = '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>';
const ICO_CHECK = '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>';
const ICO_X = '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>';
const ICO_WALLET = '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M16 12h2"/>';

// ---------- Input form (dengan data-k sebagai jalur nilai di draft) ----------
const parseVal = el => {
  if (el.dataset.n === 'm') return Number(el.value.replace(/\D/g, '')) || 0;
  if (el.dataset.n === 'f') return Number(el.value) || 0;
  return el.value;
};
const fmtMoney = v => (num(v) ? num(v).toLocaleString('id-ID') : '');

const fld = (label, inner, o = {}) => `<label class="fld${o.wide ? ' wide' : ''}">
  <span>${esc(label)}${o.req ? ' <b class="req">*</b>' : ''}</span>${inner}
  ${o.hint ? `<small class="hint">${esc(o.hint)}</small>` : ''}</label>`;
const tIn = (d, k, label, o = {}) => fld(label,
  `<input class="input" data-k="${k}" value="${esc(getPath(d, k) ?? '')}" type="${o.type || 'text'}"
     ${o.maxlen ? `maxlength="${o.maxlen}"` : ''} ${o.ph ? `placeholder="${esc(o.ph)}"` : ''}>`, o);
const mIn = (d, k, label, o = {}) => fld(label,
  `<div class="money"><span>Rp</span><input class="input" inputmode="numeric" data-k="${k}" data-n="m"
     value="${fmtMoney(getPath(d, k))}" placeholder="0"></div>`, o);
const nIn = (d, k, label, o = {}) => fld(label,
  `<input class="input" type="number" step="any" data-k="${k}" data-n="f" value="${num(getPath(d, k)) || ''}">`, o);
const sIn = (d, k, label, list, o = {}) => {
  const cur = getPath(d, k) ?? '';
  return fld(label, `<select class="input" data-k="${k}"><option value="">- pilih -</option>
    ${list.map(x => `<option value="${esc(x)}" ${x === cur ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>`, o);
};
const aIn = (d, k, label, o = {}) => fld(label,
  `<textarea class="input" rows="3" data-k="${k}">${esc(getPath(d, k) ?? '')}</textarea>`, Object.assign({ wide: true }, o));

// Grid berkas per bagian (foto/dokumen). Thumbnail diisi setelah render (loadThumbs)
function berkasGrid(ctx, bagian, readonly = false) {
  const list = (ctx.berkas || []).filter(b => b.bagian === bagian);
  const items = list.map(b => `
    <div class="thumb">
      ${b.mime === 'application/pdf'
        ? '<div class="pdf-tile">PDF</div>'
        : `<img alt="" data-berkas="${esc(b.id_berkas)}" loading="lazy">`}
      <small title="${esc(b.nama_file)}">${esc(b.nama_file)}</small>
      ${readonly ? '' : `<button class="thumb-del" data-act="delBerkas" data-id="${esc(b.id_berkas)}" title="Hapus berkas">×</button>`}
    </div>`).join('');
  return `<div class="thumbs">${items || '<span class="muted">Belum ada berkas.</span>'}</div>
    ${readonly ? '' : `<label class="upload"><input type="file" data-upload="${esc(bagian)}" accept="image/jpeg,image/png,application/pdf" multiple hidden>+ Unggah berkas (JPG, PNG, PDF)</label>`}`;
}

// Isi thumbnail gambar dari server (dipanggil setelah render)
async function loadThumbs(root = document) {
  const imgs = $$('img[data-berkas]', root);
  for (const img of imgs) {
    const r = await Api.call('img', { id_berkas: img.dataset.berkas });
    if (r.ok) img.src = r.data;
    else img.alt = 'Gagal memuat';
  }
}

// ============================================================
// AUTENTIKASI
// ============================================================
const Pages = {};

Pages.login = () => {
  const T = App.tampilan || {};
  const ov = Math.min(95, Math.max(0, Number(T.overlay_persen ?? 85))) / 100;
  const latar = App.bg
    ? `background-image:linear-gradient(rgba(11,27,63,${ov}),rgba(11,27,63,${ov})),url('${App.bg}');` +
      'background-size:cover;background-position:center;'
    : '';
  const judul = esc(T.judul_utama || '').replace(/\n/g, '<br>');
  const fitur = (T.fitur || []).map(x => `<li>${esc(x)}</li>`).join('');

  $('#app').innerHTML = `
  <div class="auth-split">
    <section class="auth-brand" style="${latar}">
      <div class="brand-row"><div class="brand-mark">K</div><b>${esc(App.brand)}</b></div>
      <h1>${judul}</h1>
      <h3>${esc(T.judul_produk || APP_NAME)}</h3>
      <p>${esc(T.deskripsi || '')}</p>
      <ul class="feat">${fitur}</ul>
    </section>
    <section class="auth-card-wrap">
      <form class="auth-card" id="fLogin" novalidate>
        <h2>${esc(T.judul_kartu || 'Selamat Datang!')}</h2>
        <p class="muted">${esc(T.subjudul_kartu || '')}</p>
        <label class="fld"><span>Username</span><input class="input" name="u" autocomplete="username" required></label>
        <label class="fld"><span>Password</span><input class="input" name="p" type="password" autocomplete="current-password" required></label>
        <div id="loginErr" class="alert" hidden></div>
        <button class="btn-primary btn-block" id="btnLogin" type="submit">Masuk →</button>
      </form>
    </section>
  </div>`;

  $('#fLogin').onsubmit = async e => {
    e.preventDefault();
    const f = e.target;
    const err = $('#loginErr');
    err.hidden = true;
    const u = f.querySelector('[name=u]').value.trim();
    const p = f.querySelector('[name=p]').value;
    if (!u || !p) { err.textContent = 'Username dan password wajib diisi.'; err.hidden = false; return; }
    const btn = $('#btnLogin');
    btn.disabled = true; btn.textContent = 'Memproses…';
    const r = await Api.call('login', { u, p });
    btn.disabled = false; btn.textContent = 'Masuk →';
    if (!r.ok) { err.textContent = r.msg || 'Login gagal.'; err.hidden = false; f.querySelector('[name=p]').value = ''; return; }
    Session.set({ token: r.token, user: r.user });
    location.hash = r.user.mustChange ? '#/ganti' : '#/dashboard';
  };
};

// Form ganti password (dipakai halaman wajib-ganti dan Akun Saya)
function pwForm(form, onOk) {
  form.onsubmit = async e => {
    e.preventDefault();
    const o = form.querySelector('[name=o]').value;
    const n = form.querySelector('[name=n]').value;
    const c = form.querySelector('[name=c]').value;
    if (!o || !n || !c) return Toast.show('Semua kolom password wajib diisi.', 'error');
    if (n.length < 6) return Toast.show('Password baru minimal 6 karakter.', 'error');
    if (n !== c) return Toast.show('Ulangi password baru tidak sama.', 'error');
    if (n === o) return Toast.show('Password baru harus berbeda.', 'error');
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    const r = await Api.call('mypass', { oldp: o, newp: n });
    btn.disabled = false;
    if (!r.ok) return Toast.show(r.msg || 'Gagal mengganti password.', 'error');
    Toast.show('Password berhasil diganti.', 'ok');
    form.reset();
    onOk();
  };
}

Pages.ganti = () => {
  $('#app').innerHTML = `
  <div class="auth-card-wrap auth-full">
    <form class="auth-card" id="fGanti">
      <h2>Ganti Password</h2>
      <p class="muted">Anda wajib mengganti password sebelum melanjutkan. Langkah ini tidak dapat dibatalkan.</p>
      <label class="fld"><span>Password saat ini</span><input class="input" type="password" name="o" required></label>
      <label class="fld"><span>Password baru <small class="hint">minimal 6 karakter</small></span><input class="input" type="password" name="n" required></label>
      <label class="fld"><span>Ulangi password baru</span><input class="input" type="password" name="c" required></label>
      <button class="btn-primary btn-block" type="submit">Simpan Password</button>
    </form>
  </div>`;
  pwForm($('#fGanti'), () => {
    const s = Session.get();
    s.user.mustChange = false;
    Session.set(s);
    location.hash = '#/dashboard';
  });
};

// ============================================================
// DASHBOARD
// ============================================================
Pages.dashboard = async () => {
  const [r, list] = await Promise.all([Api.call('dashboard'), Api.call('list', {})]);
  if (!r.ok) return App.error(r.msg);
  const u = Session.get().user;
  const k = r.ringkas, st = r.status || {};

  // Donat status: warna sesuai desain
  const SLICE = [['DRAFT', '#94A3B8', 'Draft'], ['TAHAP1', '#2F6BFF', 'Tahap 1'], ['DIREKTUR', '#7C3AED', 'Direktur Utama'],
                 ['DISETUJUI', '#16A34A', 'Disetujui'], ['DITOLAK', '#EF4444', 'Ditolak']];
  const totalSlice = SLICE.reduce((s, x) => s + (st[x[0]] || 0), 0);
  let acc = 0;
  const stops = totalSlice
    ? SLICE.map(([c, col]) => { const from = acc; acc += (st[c] || 0) / totalSlice * 360; return `${col} ${from}deg ${acc}deg`; }).join(',')
    : '#E5E7EB 0deg 360deg';
  const legend = SLICE.map(([c, col, l]) => `<div><i style="background:${col}"></i>${esc(l)}<b>${st[c] || 0}</b></div>`).join('');

  const maxN = Math.max(1, ...r.bulan.map(b => b.n));
  const bars = r.bulan.map(b => {
    const m = MON[Number(b.key.slice(5)) - 1];
    return `<div class="bar-col"><div class="bar" style="height:${(b.n / maxN) * 160}px"><span>${b.n}</span></div><small>${m}</small></div>`;
  }).join('');

  // Antrean: approver melihat yang menunggu keputusannya; AO melihat drafts-nya
  const rows = list.ok ? list.rows : [];
  const antrean = u.role === 'AO' ? rows.filter(x => x.status === 'DRAFT')
    : u.role === 'DIREKTUR_UTAMA' ? rows.filter(x => x.status === 'DIREKTUR')
    : rows.filter(x => x.status === 'TAHAP1');
  const judulAntrean = u.role === 'AO' ? 'Draft Saya' : 'Menunggu Keputusan Anda';

  $('#main').innerHTML = `
    <div class="page-head"><div>
      <h2>Dashboard</h2>
      <p class="muted">Ringkasan permohonan dan sebaran penilaian 5C</p></div>
      ${u.role === 'AO' ? '<a class="btn-primary" href="#/permohonan/baru">+ Permohonan Baru</a>' : ''}</div>

    <div class="kpis">
      <div class="card kpi-card blue">${kpiIcon(ICO_FOLDER)}<div class="kpi-lbl">Total Permohonan</div><div class="kpi-num">${k.total}</div><div class="kpi-sub">Sesuai lingkup Anda</div></div>
      <div class="card kpi-card violet">${kpiIcon(ICO_CLOCK)}<div class="kpi-lbl">Dalam Proses</div><div class="kpi-num">${k.proses}</div><div class="kpi-sub">Tahap 1 &amp; Direktur</div></div>
      <div class="card kpi-card green">${kpiIcon(ICO_CHECK)}<div class="kpi-lbl">Disetujui</div><div class="kpi-num">${k.disetujui}</div><div class="kpi-sub">Permohonan final</div></div>
      <div class="card kpi-card orange">${kpiIcon(ICO_X)}<div class="kpi-lbl">Ditolak</div><div class="kpi-num">${k.ditolak}</div><div class="kpi-sub">Perlu revisi</div></div>
      <div class="card kpi-card teal">${kpiIcon(ICO_WALLET)}<div class="kpi-lbl">Total Plafon</div><div class="kpi-num" style="font-size:22px">${rp(k.plafon)}</div><div class="kpi-sub">Rata-rata nilai ${Number(k.rata_nilai).toFixed(2)}</div></div>
    </div>

    <div class="dash-grid">
      <section class="card">
        <h3>Ringkasan Status</h3>
        <div class="donut-row">
          <div class="donut" style="background:conic-gradient(${stops})"><div class="donut-hole"><b>${totalSlice}</b><small>Permohonan</small></div></div>
          <div class="legend">${legend}</div>
        </div>
      </section>
      <section class="card">
        <h3>Permohonan 6 Bulan Terakhir</h3>
        <div class="bars">${bars}</div>
      </section>
      <section class="card wide">
        <h3>${esc(judulAntrean)}</h3>
        ${antrean.length ? antrean.slice(0, 6).map(x => `
          <div class="list-item">
            <div class="grow"><a href="#/permohonan/${esc(x.id)}"><b>${esc(x.nama_debitur)}</b></a>
              <small>${esc(x.sppk || 'Draft')} · ${esc(x.kantor)} · ${rp(x.plafon)}</small></div>
            ${chipPred(x.predikat)} ${badge(x.status)}
          </div>`).join('') : '<p class="muted">Tidak ada item yang menunggu.</p>'}
      </section>
    </div>`;

};

// ============================================================
// DAFTAR PERMOHONAN
// ============================================================
Pages.daftar = async () => {
  const state = { q: '', status: '' };
  const TABS = [['', 'Semua'], ['DRAFT', 'Draft'], ['TAHAP1', 'Menunggu Tahap 1'], ['DIREKTUR', 'Menunggu Direktur'],
                ['DISETUJUI', 'Disetujui'], ['DITOLAK', 'Ditolak']];

  $('#main').innerHTML = `
    <div class="page-head"><div><h2>Daftar Permohonan Kredit</h2><p class="muted">Tampilan menyesuaikan lingkup peran Anda.</p></div>
      <div class="actions">
        <button class="btn-secondary" id="btnXlsx">Ekspor Excel (.xlsx)</button>
        <a class="btn-primary" href="#/permohonan/baru">+ Permohonan Baru</a>
      </div></div>
    <div class="card filter">
      <input class="input" id="fQ" placeholder="Cari nomor SPPK, nama debitur, atau NIK…">
      <div class="tabs" id="tabStatus">${TABS.map(([v, l]) => `<button data-st="${v}" class="${v === '' ? 'on' : ''}">${esc(l)}</button>`).join('')}</div>
    </div>
    <div class="card table-wrap" id="tbl"><div class="skeleton"></div></div>`;

  const load = async () => {
    const r = await Api.call('list', state);
    if (!r.ok) return $('#tbl').innerHTML = `<p class="muted" style="padding:16px">${esc(r.msg)}</p>`;
    $('#tbl').innerHTML = `
      <table class="table">
        <thead><tr><th>No. SPPK</th><th>Nama Debitur</th><th>NIK</th><th>Skema &amp; Tenor</th>
          <th class="num">Plafon</th><th>Predikat</th><th>Status</th><th>Tgl Dibuat</th></tr></thead>
        <tbody>${r.rows.length ? r.rows.map(x => `
          <tr>
            <td><a href="#/permohonan/${esc(x.id)}">${esc(x.sppk || 'DRAFT')}</a><br><small class="muted">${esc(x.jenis_permohonan)}</small></td>
            <td>${esc(x.nama_debitur)}</td>
            <td class="muted">${esc(x.nik_mask)}</td>
            <td>${esc(x.jenis_angsuran)} · ${x.tenor_bulan} bln</td>
            <td class="num">${rp(x.plafon)}</td>
            <td>${chipPred(x.predikat)}</td>
            <td>${badge(x.status)}</td>
            <td>${tgl(x.dibuat)}</td>
          </tr>`).join('') : '<tr><td colspan="8" class="muted">Tidak ada permohonan yang cocok.</td></tr>'}
        </tbody></table>`;
  };

  $('#fQ').oninput = debounce(e => { state.q = e.target.value.trim(); load(); }, 300);
  $('#tabStatus').onclick = e => {
    const b = e.target.closest('[data-st]');
    if (!b) return;
    state.status = b.dataset.st;
    $$('#tabStatus button').forEach(x => x.classList.toggle('on', x === b));
    load();
  };
  $('#btnXlsx').onclick = async () => {
    const r = await Api.call('xlsx', state);
    if (!r.ok) return Toast.show(r.msg, 'error');
    unduh(r.data, r.name, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  };
  load();
};

// ============================================================
// PERSETUJUAN (antrean approver)
// ============================================================
Pages.persetujuan = async () => {
  const u = Session.get().user;
  const want = u.role === 'DIREKTUR_UTAMA' ? 'DIREKTUR' : 'TAHAP1';
  const r = await Api.call('list', {});
  if (!r.ok) return App.error(r.msg);
  const rows = r.rows.filter(x => x.status === want);
  $('#main').innerHTML = `
    <div class="page-head"><div><h2>Antrean Persetujuan</h2>
      <p class="muted">${u.role === 'DIREKTUR_UTAMA'
        ? 'Permohonan yang menunggu keputusan akhir Direktur Utama. Semua plafon wajib melalui Direktur Utama.'
        : 'Permohonan kantor Anda yang menunggu keputusan tahap 1.'}</p></div></div>
    <div class="card table-wrap">
      <table class="table"><thead><tr><th>No. SPPK</th><th>Nama Debitur</th><th>Kantor</th><th class="num">Plafon</th><th>Predikat</th><th>Diajukan</th><th></th></tr></thead>
      <tbody>${rows.length ? rows.map(x => `
        <tr><td>${esc(x.sppk)}</td><td>${esc(x.nama_debitur)}</td><td>${esc(x.kantor)}</td>
          <td class="num">${rp(x.plafon)}</td><td>${chipPred(x.predikat)}</td><td>${jam(x.diajukan)}</td>
          <td><a class="btn-primary sm" href="#/persetujuan/${esc(x.id)}">Review</a></td></tr>`).join('')
        : '<tr><td colspan="7" class="muted">Tidak ada permohonan yang menunggu keputusan Anda.</td></tr>'}
      </tbody></table></div>`;
};

// ============================================================
// DETAIL PERMOHONAN
// ============================================================
const kpiMini = (l, v) => `<div class="kpi-mini"><small>${esc(l)}</small><b>${v}</b></div>`;

Pages.detail = async id => {
  const r = await Api.call('get', { id });
  if (!r.ok) return App.error(r.msg);
  const x = r.rec, f = r.form || {};
  const ctx = { berkas: r.berkas || [] };

  const act = [];
  if (r.bisaUbah) act.push(`<a class="btn-secondary" href="#/permohonan/${esc(id)}/edit/1">Ubah</a>`,
                           '<button class="btn-primary" data-act="ajukan">Ajukan ke Penyetuju</button>');
  if (r.bisaRevisi) act.push('<button class="btn-secondary" data-act="revisi">Revisi Permohonan</button>');
  if (r.bisaPutus) act.push(`<a class="btn-primary" href="#/persetujuan/${esc(id)}">Review &amp; Putuskan</a>`);
  act.push(`<a class="btn-secondary" href="#/memo/${esc(id)}">Lihat Memo</a>`);
  if (x.status === 'DISETUJUI') act.push('<button class="btn-primary" data-act="pdf">Unduh PDF</button>');

  $('#main').innerHTML = `
    <div class="page-head"><div>
      <a class="link" href="#/permohonan">← Daftar Permohonan</a>
      <h2>${esc(x.nama_debitur)}</h2>
      <p class="muted">${esc(x.sppk || 'Belum diajukan (draft)')} · ${esc(x.kantor)} · Versi ${x.versi}</p></div>
      <div class="actions">${badge(x.status)}</div></div>
    <div class="card"><div class="kpis-inline">
      ${kpiMini('Plafon', rp(x.plafon))}${kpiMini('Tenor', x.tenor_bulan + ' bulan')}
      ${kpiMini('Jenis angsuran', esc(x.jenis_angsuran || '-'))}${kpiMini('Rencana angsuran', rp(x.rencana_angsuran))}
      ${kpiMini('Total nilai', x.total_nilai !== '' ? Number(x.total_nilai).toFixed(2) : '-')}${kpiMini('Predikat', esc(x.predikat || '-'))}
    </div></div>
    <div class="actions">${act.join('')}</div>
    <div class="tabs" id="tabs">
      <button class="on" data-tab="data">Data</button><button data-tab="5c">Penilaian 5C</button>
      <button data-tab="berkas">Berkas</button><button data-tab="riwayat">Riwayat</button></div>
    <div class="card" id="tabBody"></div>
    ${r.bisaUbah || r.bisaRevisi ? '<p class="muted">Data hanya dapat diubah oleh AO pemilik saat status Draft atau Ditolak.</p>' : ''}`;

  const tampil = tab => {
    $$('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    const body = $('#tabBody');
    if (tab === 'data') {
      body.innerHTML = `<div class="grid-3">
        ${[['Nama lengkap', f.nama], ['NIK', f.nik], ['Pekerjaan', f.pekerjaan], ['Tempat, tgl lahir', [f.tempat_lahir, tgl(f.tgl_lahir)].filter(Boolean).join(', ')],
           ['Status pernikahan', f.nikah], ['Telepon', f.telp], ['Alamat', [f.alamat, f.desa, f.kecamatan, f.kota].filter(Boolean).join(', ')],
           ['Sektor (KBLI)', f.sektor], ['Tujuan pinjaman', f.tujuan], ['Jenis permohonan', x.jenis_permohonan],
           ['Suku bunga flat', (f.bunga || 0) + '% p.a.'], ['Jenis angsuran', f.jenis_angsuran]]
          .map(([l, v]) => `<div><small class="muted">${esc(l)}</small><div><b>${esc(v || '-')}</b></div></div>`).join('')}
      </div>
      <h4>Agunan</h4>
      ${(f.agunan || []).length ? `<table class="table"><thead><tr><th>Jenis</th><th>Nama</th><th>Bukti</th><th class="num">Taksasi</th><th class="num">Likuidasi</th></tr></thead><tbody>
        ${f.agunan.map(a => `<tr><td>${esc(a.jenis)}</td><td>${esc(a.nama)}</td><td>${esc(a.bukti)}</td><td class="num">${rp(a.taksasi)}</td><td class="num">${rp(a.likuidasi)}</td></tr>`).join('')}
        </tbody></table>` : '<p class="muted">Tidak ada agunan.</p>'}`;
    } else if (tab === '5c') {
      body.innerHTML = KRITERIA.map((p, pi) => `
        <div class="pillar"><div class="pillar-head"><span class="pn">${pi + 1}</span><b>${esc(p.nama)}</b></div>
        <table class="table"><tbody>${p.items.map(it => `
          <tr><td>${esc(it.l)}</td><td class="num"><b>${it.auto ? 'Otomatis' : ((f.skor || {})[it.k] || '-')}</b></td></tr>`).join('')}
        </tbody></table></div>`).join('') +
        `<div class="kpis-inline" style="margin-top:14px">${kpiMini('Total nilai', x.total_nilai !== '' ? Number(x.total_nilai).toFixed(2) : '-')}${kpiMini('Predikat', esc(x.predikat || '-'))}</div>`;
    } else if (tab === 'berkas') {
      body.innerHTML = `<div class="berkas-block"><b>Foto identitas debitur</b>${berkasGrid(ctx, 'fotoDebitur', true)}</div>
        ${(f.relasi || []).map((_, i) => `<div class="berkas-block"><b>Relasi ${i + 1}</b>${berkasGrid(ctx, `relasi.${i}.foto`, true)}</div>`).join('')}
        ${(f.agunan || []).map((_, i) => `<div class="berkas-block"><b>Agunan ${i + 1}</b>${berkasGrid(ctx, `agunan.${i}.dok`, true)}</div>`).join('')}`;
      loadThumbs(body);
    } else {
      body.innerHTML = r.riwayat.length ? `<table class="table"><thead><tr><th>Waktu</th><th>Pelaku</th><th>Jabatan</th><th>Aksi</th><th>Status</th><th>Catatan</th></tr></thead><tbody>
        ${r.riwayat.map(h => `<tr><td>${jam(h.waktu)}</td><td>${esc(h.username)}</td><td>${esc(h.jabatan)}</td>
          <td>${esc(h.aksi)}</td><td>${esc(h.status_sebelum)} → ${esc(h.status_sesudah)}</td><td>${esc(h.catatan)}</td></tr>`).join('')}
        </tbody></table>` : '<p class="muted">Belum ada riwayat.</p>';
    }
  };
  $('#tabs').onclick = e => { const b = e.target.closest('[data-tab]'); if (b) tampil(b.dataset.tab); };
  tampil('data');

  $('#main').onclick = async e => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    if (b.dataset.act === 'ajukan') {
      if (!confirm('Ajukan permohonan ini ke penyetuju tahap 1? Setelah diajukan, data tidak dapat diubah sampai dikembalikan.')) return;
      const s = await Api.call('submit', { id });
      if (!s.ok) return Toast.show(s.msg, 'error');
      Toast.show('Permohonan diajukan. SPPK: ' + s.sppk, 'ok');
      App.route();
    } else if (b.dataset.act === 'revisi') {
      const s = await Api.call('revise', { id });
      if (!s.ok) return Toast.show(s.msg, 'error');
      Toast.show('Revisi dibuat sebagai draft baru.', 'ok');
      location.hash = `#/permohonan/${s.id}/edit/1`;
    } else if (b.dataset.act === 'pdf') {
      await downloadPdf(id);
    }
  };
};

async function downloadPdf(id) {
  const r = await Api.call('pdf', { id });
  if (!r.ok) return Toast.show(r.msg, 'error');
  unduh(r.data, r.name, 'application/pdf');
}

// ============================================================
// FORM PERMOHONAN (3 langkah)
// ============================================================
async function loadSektor() {
  if (!App.cache.sektor) {
    const r = await Api.call('sektor');
    App.cache.sektor = r.ok ? r.rows : [];
  }
  return App.cache.sektor;
}

Pages.form = async (id, step = 1) => {
  step = Math.min(3, Math.max(1, Number(step) || 1));
  const ctx = { id: id || null, step, draft: blankForm(), berkas: [], rec: null, last: null };
  if (id) {
    const r = await Api.call('get', { id });
    if (!r.ok) return App.error(r.msg);
    if (!r.bisaUbah) return App.error('Permohonan ini tidak dapat diubah pada status saat ini.');
    ctx.rec = r.rec;
    ctx.berkas = r.berkas || [];
    ctx.draft = Object.assign(blankForm(), r.form);
  }
  ctx.sektor = await loadSektor();
  renderForm(ctx);
};

const STEP_TITLES = ['Data Debitur & Agunan', 'Arus Kas & Neraca', 'Penilaian Kertas Kerja 5C'];
const STEP_FN = [stepDebitur, stepArus, stepPenilaian];

function renderForm(ctx) {
  if (!ctx.hitung) attachHitung(ctx);
  $('#main').innerHTML = `
    <div class="page-head"><div>
      <a class="link" href="${ctx.id ? '#/permohonan/' + esc(ctx.id) : '#/permohonan'}">← ${ctx.id ? 'Detail permohonan' : 'Daftar permohonan'}</a>
      <h2>${ctx.id ? 'Ubah Permohonan' : 'Permohonan Kredit Baru'}</h2>
      <p class="muted">${ctx.rec ? esc(ctx.rec.sppk || 'Draft') : 'Draft belum tersimpan'}</p></div>
      <div class="actions"><span class="saved" id="saveState"></span>
        <button class="btn-secondary" data-act="save">Simpan Draft</button></div></div>
    <nav class="stepper">${STEP_TITLES.map((t, i) => `
      <button class="step ${i + 1 === ctx.step ? 'is-active' : ''} ${i + 1 < ctx.step ? 'is-done' : ''}" data-go="${i + 1}">
        ${i + 1}. ${esc(t)}</button>`).join('')}</nav>
    <div class="form-layout">
      <section class="card form-main" id="stepBody"></section>
      <aside class="card preview" id="preview"></aside>
    </div>
    <div class="bottombar">
      ${ctx.step > 1 ? `<button class="btn-secondary" data-go="${ctx.step - 1}">← Sebelumnya</button>` : '<span></span>'}
      ${ctx.step < 3
        ? `<button class="btn-primary" data-go="${ctx.step + 1}">Lanjut →</button>`
        : '<button class="btn-primary" data-act="submit">Ajukan ke Penyetuju</button>'}
    </div>`;

  const main = $('#main');
  main.onclick = e => formClick(e, ctx);
  main.oninput = e => formInput(e, ctx);
  main.onchange = e => formChange(e, ctx);

  renderBody(ctx);
}

function renderBody(ctx) {
  $('#stepBody').innerHTML = STEP_FN[ctx.step - 1](ctx);
  loadThumbs($('#stepBody'));
  ctx.hitung();
}

// Pratinjau perhitungan (debounce) — hanya tampilan, server tetap sumber kebenaran
function attachHitung(ctx) {
  ctx.hitung = debounce(async () => {
    const r = await Api.call('hitung', { form: ctx.draft });
    if (!r.ok) return;
    ctx.last = r;
    renderPreview(ctx, r);
  }, 350);
}

function stepDebitur(ctx) {
  const d = ctx.draft;
  const sek = ctx.sektor.map(x => `<option value="${esc(x.kode)}" ${x.kode === d.sektor ? 'selected' : ''}>${esc(x.kode)} — ${esc(x.nama)}</option>`).join('');
  return `
  <h3>A.1 Informasi Permohonan</h3>
  <div class="grid-3">
    ${sIn(d, 'jenis_permohonan', 'Jenis permohonan', ['Kredit Modal Kerja', 'Kredit Investasi', 'Kredit Konsumtif'], { req: true })}
    ${sIn(d, 'skema', 'Skema pembayaran', ['Modal Kerja', 'Investasi', 'Konsumtif'], { req: true })}
    ${sIn(d, 'jenis_debitur', 'Jenis calon debitur', ['Perorangan', 'Badan Usaha'], { req: true })}
  </div>
  <h3>A.2 Identitas Calon Debitur</h3>
  <div class="grid-3">
    ${tIn(d, 'nama', 'Nama lengkap (sesuai KTP)', { req: true })}
    ${tIn(d, 'nik', 'NIK (16 digit)', { req: true, maxlen: 16 })}
    ${tIn(d, 'tempat_lahir', 'Tempat lahir')}
    ${tIn(d, 'tgl_lahir', 'Tanggal lahir', { type: 'date' })}
    ${sIn(d, 'jk', 'Jenis kelamin', SEL_JK)}
    ${sIn(d, 'nikah', 'Status pernikahan', SEL_NIKAH)}
    ${sIn(d, 'pendidikan', 'Pendidikan terakhir', SEL_DIDIK)}
    ${tIn(d, 'pekerjaan', 'Pekerjaan / jabatan')}
    ${tIn(d, 'telp', 'No. WA / telepon')}
    ${tIn(d, 'email', 'Email', { type: 'email' })}
    ${tIn(d, 'desa', 'Desa / kelurahan')}
    ${tIn(d, 'kecamatan', 'Kecamatan')}
    ${tIn(d, 'kota', 'Kab / kota')}
    ${aIn(d, 'alamat', 'Alamat sesuai KTP')}
  </div>
  <div class="berkas-block"><b>Foto identitas debitur</b>${berkasGrid(ctx, 'fotoDebitur')}</div>

  <h3>A.3 Tujuan Pinjaman & Profil Usaha</h3>
  <div class="grid-2">
    <label class="fld"><span>Sektor ekonomi (KBLI) <b class="req">*</b></span>
      <select class="input" data-k="sektor"><option value="">- pilih -</option>${sek}</select></label>
    ${tIn(d, 'tujuan', 'Tujuan penggunaan pinjaman')}
    ${aIn(d, 'profil_usaha', 'Ringkasan profil usaha / pekerjaan')}
  </div>

  <h3>A.4 Pasangan, Keluarga & Relasi</h3>
  ${d.relasi.map((_, i) => `
    <div class="sub-card"><div class="sub-head"><b>Relasi ${i + 1}</b>
      <button class="btn-ghost-dark sm" style="width:auto;margin:0;color:var(--text)" data-act="delRelasi" data-i="${i}">Hapus</button></div>
      <div class="grid-3">
        ${sIn(d, `relasi.${i}.relasi`, 'Hubungan', SEL_RELASI)}
        ${tIn(d, `relasi.${i}.nama`, 'Nama lengkap')}
        ${tIn(d, `relasi.${i}.nik`, 'NIK')}
        ${tIn(d, `relasi.${i}.telp`, 'Telepon')}
      </div>
      <div class="berkas-block">${berkasGrid(ctx, `relasi.${i}.foto`)}</div>
    </div>`).join('')}
  <button class="btn-secondary" data-act="addRelasi">+ Tambah relasi</button>

  <h3>A.5 Data Agunan / Jaminan</h3>
  ${d.agunan.map((a, i) => `
    <div class="sub-card"><div class="sub-head"><b>Agunan ${i + 1}</b>
      <button class="btn-ghost-dark sm" style="width:auto;margin:0;color:var(--text)" data-act="delAgunan" data-i="${i}">Hapus</button></div>
      <div class="grid-3">
        ${sIn(d, `agunan.${i}.jenis`, 'Jenis agunan', JENIS_AGUNAN)}
        ${tIn(d, `agunan.${i}.nama`, 'Nama / uraian agunan')}
        ${sIn(d, `agunan.${i}.bukti`, 'Bukti kepemilikan', ['SHM', 'SHGB', 'AJB', 'BPKB', 'Bilyet', 'Lainnya'])}
        ${tIn(d, `agunan.${i}.noSert`, 'No. sertifikat / BPKB / rekening')}
        ${aIn(d, `agunan.${i}.alamat`, 'Alamat agunan')}
        ${a.jenis === 'Bilyet Deposito'
          ? mIn(d, `agunan.${i}.nominalD`, 'Nominal deposito')
          : mIn(d, `agunan.${i}.taksasi`, 'Nilai taksasi pasar')}
      </div>
      <div class="berkas-block">${berkasGrid(ctx, `agunan.${i}.dok`)}</div>
    </div>`).join('')}
  <button class="btn-secondary" data-act="addAgunan">+ Tambah agunan</button>`;
}

function stepArus(ctx) {
  const d = ctx.draft;
  return `
  <h3>B.0 Pinjaman yang Diusulkan</h3>
  <div class="grid-3">
    ${mIn(d, 'plafon', 'Usulan plafon (Rp)', { req: true })}
    ${nIn(d, 'tenor', 'Jangka waktu (bulan)', { req: true })}
    ${nIn(d, 'bunga', 'Suku bunga flat (% p.a.)', { req: true })}
  </div>
  <div class="grid-2">
    ${sIn(d, 'jenis_angsuran', 'Jenis angsuran', ['KAB', 'KB', 'PRK', 'PROMES'], { req: true, hint: 'KAB = anuitas. Bunga efektif dihitung otomatis.' })}
  </div>

  <h3>B.1 Laba Rugi Usaha / Penghasilan Bulanan</h3>
  <div class="grid-3">
    ${mIn(d, 'arus.gaji', 'Gaji / penghasilan tetap')}
    ${mIn(d, 'arus.usaha', 'Pendapatan usaha (omset)')}
    ${mIn(d, 'arus.lain', 'Pendapatan lain')}
  </div>
  <h4>Beban usaha & rumah tangga per bulan</h4>
  <div class="grid-3">${BEBAN.map(([k, l]) => mIn(d, 'arus.beban.' + k, l)).join('')}</div>

  <h3>B.2 Kewajiban kepada Pihak Lain</h3>
  <div class="grid-2">
    ${mIn(d, 'arus.angsuran_hutang', 'Angsuran hutang lain / bulan')}
  </div>`;
}

function stepPenilaian(ctx) {
  const d = ctx.draft;
  const bob = ctx.last ? ctx.last.bobot : null;
  const pilarW = bob ? Object.values(bob.pilar) : [];
  const indW = bob ? bob.indikator : {};
  const pct = v => (v == null ? '-' : Math.round(v * 100) + '%');
  return `
  <h3>C. Kertas Kerja Penilaian 5C</h3>
  <p class="muted">Pilih kondisi yang paling sesuai. Skor 5 = paling baik. RPC dihitung otomatis dari arus kas.</p>
  ${KRITERIA.map((p, pi) => `
    <div class="pillar">
      <div class="pillar-head"><span class="pn">${pi + 1}</span><b>${esc(p.nama)}</b>
        <span class="badge badge-draft">Bobot ${pct(pilarW[pi])}</span></div>
      <table class="table"><thead><tr><th>Indikator</th><th>Bobot</th><th>Pilihan</th><th class="num">Skor</th></tr></thead><tbody>
      ${p.items.map(it => {
        if (it.auto) {
          const s = ctx.last ? ctx.last.skor_rpc : '-';
          const rpcTxt = ctx.last ? (ctx.last.hasil.rpc * 100).toFixed(2) + '%' : '-';
          return `<tr><td>${esc(it.l)}</td><td>${pct(indW[it.k])}</td>
            <td class="muted">Otomatis dari arus kas · RPC ${rpcTxt}</td><td class="num"><b id="rpcCell">${s}</b></td></tr>`;
        }
        const cur = Number((d.skor || {})[it.k]) || 0;
        return `<tr><td>${esc(it.l)}</td><td>${pct(indW[it.k])}</td>
          <td><select class="input" data-skor="${it.k}"><option value="">- pilih -</option>
            ${[5, 4, 3, 2, 1].map((s, j) => `<option value="${s}" ${cur === s ? 'selected' : ''}>${s} — ${esc(it.o[j])}</option>`).join('')}
          </select></td>
          <td class="num"><b>${cur || '-'}</b></td></tr>`;
      }).join('')}
      </tbody></table>
    </div>`).join('')}`;
}

// Panel kanan: ringkasan sesuai langkah
function renderPreview(ctx, r) {
  const el = $('#preview');
  if (!el) return;
  const h = r.hasil;
  if (ctx.step === 1) {
    const rows = (r.agunan || []).map(a => `<tr><td>${esc(a.jenis)}</td><td class="num">${rp(a.likuidasi)}</td></tr>`).join('');
    const cov = h && ctx.draft.plafon ? ((r.agunan || []).reduce((s, a) => s + num(a.likuidasi), 0) / num(ctx.draft.plafon) * 100) : 0;
    el.innerHTML = `<h4>Agunan & Likuidasi</h4>
      ${rows ? `<table class="table"><tbody>${rows}</tbody></table>
        <p class="hint">Coverage likuidasi terhadap plafon: <b>${cov.toFixed(1)}%</b></p>`
        : '<p class="muted">Belum ada agunan.</p>'}
      <p class="hint">Nilai likuidasi dihitung server sesuai persentase di Parameter.</p>`;
  } else if (ctx.step === 2) {
    el.innerHTML = `<h4>Kapasitas Bayar</h4>
      <dl class="kv">
        <dt>Angsuran pokok</dt><dd>${rp(h.angPokok)}</dd>
        <dt>Angsuran bunga</dt><dd>${rp(h.angBunga)}</dd>
        <dt>Rencana angsuran</dt><dd><b>${rp(h.renc)}</b></dd>
        <dt>Total pendapatan</dt><dd>${rp(h.pend)}</dd>
        <dt>Total beban</dt><dd>${rp(h.beban)}</dd>
        <dt>Laba bersih</dt><dd>${rp(h.laba)}</dd>
        <dt>Sisa penghasilan</dt><dd>${rp(h.sisa)}</dd>
      </dl>
      ${h.sisa > 0
        ? `<div class="rpc ${h.rpc > 0.8 ? 'rpc-bad' : ''}"><small>RPC</small><b>${(h.rpc * 100).toFixed(2)}%</b>
             ${h.rpc > 0.8 ? '<span>Di atas 80%: perlu tinjauan struktur kredit.</span>' : ''}</div>`
        : '<div class="rpc rpc-bad"><small>RPC</small><b>Tidak dapat dihitung</b><span>Sisa penghasilan tidak positif.</span></div>'}
      ${h.efektif != null ? `<p class="hint">Bunga efektif KAB: ${h.efektif}% p.a.</p>` : ''}`;
    const rpcCell = $('#rpcCell');
    if (rpcCell) rpcCell.textContent = r.skor_rpc;
  } else {
    el.innerHTML = `<h4>Hasil Penilaian</h4>
      <div class="score">${Number(h.total).toFixed(2)}<small>dari 5.00</small></div>
      <p>${chipPred(h.predikat)}</p>
      <ul class="checklist">
        <li class="${Object.keys(ctx.draft.skor || {}).length >= 14 ? 'ok' : ''}">Indikator 5C dinilai</li>
        <li class="${(ctx.draft.agunan || []).length ? 'ok' : ''}">Agunan dicantumkan</li>
        <li class="${(ctx.berkas || []).some(b => b.bagian === 'fotoDebitur') ? 'ok' : ''}">Foto identitas diunggah</li>
      </ul>
      <p class="hint">Nilai akhir dihitung ulang di server saat diajukan.</p>`;
    const rpcCell = $('#rpcCell');
    if (rpcCell) rpcCell.textContent = r.skor_rpc;
  }
}

// ---------- Penanganan event form (delegasi) ----------
function formInput(e, ctx) {
  const el = e.target;
  if (el.dataset.k && el.tagName !== 'SELECT') {
    setPath(ctx.draft, el.dataset.k, parseVal(el));
    ctx.hitung();
  }
}

async function formChange(e, ctx) {
  const el = e.target;
  if (el.dataset.k && el.tagName === 'SELECT') {
    setPath(ctx.draft, el.dataset.k, el.value);
    if (/^agunan\.\d+\.jenis$/.test(el.dataset.k)) return renderBody(ctx);
    ctx.hitung();
  }
  if (el.dataset.skor) {
    ctx.draft.skor[el.dataset.skor] = Number(el.value) || 0;
    const row = el.closest('tr');
    if (row) row.querySelector('td.num b').textContent = el.value || '-';
    ctx.hitung();
  }
  if (el.dataset.k && (el.dataset.n === 'm')) el.value = fmtMoney(getPath(ctx.draft, el.dataset.k));
  if (el.dataset.upload) return uploadFiles(ctx, el);
}

async function formClick(e, ctx) {
  const t = e.target.closest('[data-go],[data-act]');
  if (!t) return;
  if (t.dataset.go) return goStep(ctx, Number(t.dataset.go));
  switch (t.dataset.act) {
    case 'save': return saveDraft(ctx, true);
    case 'submit': return submitForm(ctx);
    case 'addRelasi': ctx.draft.relasi.push({ relasi: 'Istri / Suami' }); return renderBody(ctx);
    case 'delRelasi': ctx.draft.relasi.splice(Number(t.dataset.i), 1); return renderBody(ctx);
    case 'addAgunan': ctx.draft.agunan.push({ jenis: JENIS_AGUNAN[0] }); return renderBody(ctx);
    case 'delAgunan': ctx.draft.agunan.splice(Number(t.dataset.i), 1); return renderBody(ctx);
    case 'delBerkas': return deleteBerkas(ctx, t.dataset.id);
  }
}

// Simpan draft ke server; setelah itu URL memuat id agar refresh tidak kehilangan data
async function saveDraft(ctx, notify = false) {
  const r = await Api.call('save', { id: ctx.id, form: ctx.draft });
  if (!r.ok) { Toast.show(r.msg || 'Gagal menyimpan.', 'error'); return false; }
  ctx.id = r.id;
  const st = $('#saveState');
  if (st) st.textContent = 'Tersimpan ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  if (notify) Toast.show('Draft tersimpan.', 'ok');
  return true;
}

async function goStep(ctx, n) {
  if (!(await saveDraft(ctx))) return;
  ctx.step = n;
  history.replaceState(null, '', `#/permohonan/${ctx.id}/edit/${n}`);
  renderForm(ctx);
}

async function submitForm(ctx) {
  if (!(await saveDraft(ctx))) return;
  const r = await Api.call('submit', { id: ctx.id });
  if (!r.ok) return Toast.show(r.msg, 'error');
  Toast.show('Permohonan diajukan. SPPK: ' + r.sppk, 'ok');
  location.hash = '#/permohonan/' + ctx.id;
}

async function uploadFiles(ctx, input) {
  const bagian = input.dataset.upload;
  const files = Array.from(input.files || []);
  input.value = '';
  if (!files.length) return;
  if (!ctx.id) {
    if (!(await saveDraft(ctx))) return;
  }
  for (const f of files) {
    try {
      const p = await fileToPayload(f);
      const r = await Api.call('upload', Object.assign({ id: ctx.id, bagian }, p));
      if (!r.ok) Toast.show(r.msg, 'error');
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  }
  const g = await Api.call('get', { id: ctx.id });
  if (g.ok) ctx.berkas = g.berkas || [];
  renderBody(ctx);
}

async function deleteBerkas(ctx, idBerkas) {
  if (!confirm('Hapus berkas ini dari permohonan? Berkas tetap tersimpan di Drive untuk jejak audit.')) return;
  const r = await Api.call('deleteFile', { id_berkas: idBerkas });
  if (!r.ok) return Toast.show(r.msg, 'error');
  const g = await Api.call('get', { id: ctx.id });
  if (g.ok) ctx.berkas = g.berkas || [];
  renderBody(ctx);
}


// ============================================================
// PRATINJAU & MEMO
// ============================================================
Pages.memo = async id => {
  const [m, g] = await Promise.all([Api.call('memo', { id }), Api.call('get', { id })]);
  if (!m.ok) return App.error(m.msg);
  const disetujui = g.ok && g.rec.status === 'DISETUJUI';
  $('#main').innerHTML = `
    <div class="page-head"><div>
      <a class="link" href="#/permohonan/${esc(id)}">← Kembali ke detail</a>
      <h2>Pratinjau Memo Analisis Kredit</h2>
      <p class="muted">${disetujui ? 'Dokumen telah disetujui.' : 'PRATINJAU — belum disetujui.'}</p></div>
      <div class="actions">
        <button class="btn-secondary" id="bPrint">Cetak</button>
        ${disetujui ? '<button class="btn-primary" id="bPdf">Unduh PDF</button>' : ''}
      </div></div>
    <section class="card"><iframe class="memo-frame memo-full" title="Memo analisis kredit" sandbox="allow-same-origin"></iframe></section>`;
  const fr = $('.memo-frame');
  fr.srcdoc = m.html;
  $('#bPrint').onclick = () => fr.contentWindow.print();
  const bp = $('#bPdf');
  if (bp) bp.onclick = () => downloadPdf(id);
};

// ============================================================
// KEPUTUSAN APPROVER (split view)
// ============================================================
Pages.approve = async id => {
  const r = await Api.call('get', { id });
  if (!r.ok) return App.error(r.msg);
  if (!r.bisaPutus) { location.hash = '#/permohonan/' + id; return; }
  const x = r.rec;
  const m = await Api.call('memo', { id });
  const isDir = x.status === 'DIREKTUR';
  const label = isDir ? 'Setujui Permohonan' : 'Setujui & Teruskan ke Direktur Utama';

  $('#main').innerHTML = `
    <div class="page-head"><div>
      <a class="link" href="#/persetujuan">← Antrean persetujuan</a>
      <h2>Persetujuan ${esc(x.sppk)}</h2>
      <p class="muted">${esc(x.nama_debitur)} · ${esc(x.kantor)}</p></div>${badge(x.status)}</div>
    <div class="split">
      <section class="card"><iframe class="memo-frame" title="Pratinjau memo" sandbox="allow-same-origin"></iframe></section>
      <aside class="card decision">
        <h3>Ringkasan</h3>
        <dl class="kv">
          <dt>Usulan plafon</dt><dd>${rp(x.plafon)}</dd>
          <dt>Jangka waktu</dt><dd>${x.tenor_bulan} bulan</dd>
          <dt>Rencana angsuran</dt><dd>${rp(x.rencana_angsuran)}</dd>
          <dt>Total nilai</dt><dd>${Number(x.total_nilai).toFixed(2)}</dd>
          <dt>Predikat</dt><dd>${chipPred(x.predikat)}</dd>
        </dl>
        <h3>Keputusan Anda</h3>
        <div class="actions" style="flex-direction:column;align-items:stretch">
          <button class="btn-primary btn-block" data-d="SETUJUI">${label}</button>
          <button class="btn-danger-outline" data-d="TOLAK">Tolak Permohonan</button>
        </div>
        <p class="hint" style="margin-top:12px">Penolakan wajib disertai catatan dan tercatat di riwayat.</p>
      </aside>
    </div>`;
  $('.memo-frame').srcdoc = m.ok ? m.html : '<p style="font-family:sans-serif">Memo tidak dapat dimuat.</p>';
  $$('[data-d]').forEach(b => b.onclick = () => decideFlow(id, b.dataset.d));
};

async function decideFlow(id, keputusan) {
  let catatan = '';
  if (keputusan === 'TOLAK') {
    const m = modal(`
      <h3>Tolak Permohonan</h3>
      <p class="muted">Catatan penolakan wajib diisi dan akan tercatat di riwayat.</p>
      <textarea class="input" rows="4" id="mCatatan"></textarea>
      <div class="actions end"><button class="btn-secondary" id="mBatal">Batal</button>
        <button class="btn-danger" id="mOk">Tolak Permohonan</button></div>`);
    catatan = await new Promise(res => {
      m.el.querySelector('#mBatal').onclick = () => { m.close(); res(null); };
      m.el.querySelector('#mOk').onclick = () => {
        const v = m.el.querySelector('#mCatatan').value.trim();
        if (!v) return Toast.show('Catatan wajib diisi.', 'error');
        m.close(); res(v);
      };
    });
    if (catatan === null) return;
  } else if (!confirm('Setujui permohonan ini?')) {
    return;
  }
  const r = await Api.call('decide', { id, keputusan, catatan });
  if (!r.ok) return Toast.show(r.msg, 'error');
  Toast.show(keputusan === 'SETUJUI' ? 'Keputusan disimpan.' : 'Permohonan ditolak.', 'ok');
  location.hash = '#/persetujuan';
}

// ============================================================
// AKUN SAYA
// ============================================================
Pages.akun = () => {
  const u = Session.get().user;
  $('#main').innerHTML = `
    <div class="page-head"><div><h2>Akun Saya</h2><p class="muted">Profil dan keamanan akun Anda.</p></div></div>
    <div class="dash-grid">
      <section class="card">
        <h3>Profil</h3>
        <dl class="kv">
          <dt>Username</dt><dd>${esc(u.username)}</dd>
          <dt>Nama</dt><dd>${esc(u.nama)}</dd>
          <dt>Jabatan</dt><dd>${esc(u.jabatan)}</dd>
          <dt>Peran</dt><dd>${esc(ROLE_LABEL[u.role] || u.role)}</dd>
          <dt>Kantor</dt><dd>${esc(u.kantor)}</dd>
        </dl>
        <p class="hint" style="margin-top:12px">Perubahan nama atau peran dilakukan oleh Admin.</p>
      </section>
      <section class="card">
        <h3>Ganti Password</h3>
        <form id="fPw" class="auth-card" style="box-shadow:none;border:0;padding:0">
          <label class="fld"><span>Password saat ini</span><input class="input" type="password" name="o" required></label>
          <label class="fld"><span>Password baru <small class="hint">minimal 6 karakter</small></span><input class="input" type="password" name="n" required></label>
          <label class="fld"><span>Ulangi password baru</span><input class="input" type="password" name="c" required></label>
          <button class="btn-primary" type="submit">Ganti Password</button>
        </form>
      </section>
    </div>`;
  pwForm($('#fPw'), () => {});
};

// ============================================================
// PANEL ADMIN
// ============================================================
Pages.adminUsers = async () => {
  const [ur, kr] = await Promise.all([Api.call('users'), Api.call('kop')]);
  if (!ur.ok) return App.error(ur.msg);
  const rows = ur.rows || [];
  const kantor = (kr.rows || []).map(k => k.kode_kantor);
  $('#main').innerHTML = `
    <div class="page-head"><div><h2>Pengguna</h2><p class="muted">Kelola akun, peran, dan kantor penugasan.</p></div>
      <button class="btn-primary" id="btnAdd">+ Tambah Pengguna</button></div>
    <div class="card table-wrap"><table class="table">
      <thead><tr><th>Username</th><th>Nama</th><th>Jabatan</th><th>Peran</th><th>Kantor</th><th>Aktif</th><th>Login terakhir</th><th></th></tr></thead>
      <tbody>${rows.map(x => `<tr>
        <td>${esc(x.username)}</td><td>${esc(x.nama)}</td><td>${esc(x.jabatan)}</td>
        <td>${esc(ROLE_LABEL[x.role] || x.role)}</td><td>${esc(x.kantor)}</td>
        <td><button class="toggle ${x.aktif ? 'on' : ''}" data-toggle="${esc(x.username)}" title="Aktif / nonaktif"></button></td>
        <td>${jam(x.login_terakhir)}</td>
        <td><button class="btn-secondary sm" data-edit="${esc(x.username)}">Ubah</button></td></tr>`).join('')}
      </tbody></table></div>`;

  const reload = () => Pages.adminUsers();
  $('#btnAdd').onclick = () => userModal(null, kantor, reload);
  $('#main').onclick = async e => {
    const tg = e.target.closest('[data-toggle]');
    const ed = e.target.closest('[data-edit]');
    if (tg) {
      const x = rows.find(r => r.username === tg.dataset.toggle);
      if (!x) return;
      const r = await Api.call('usave', { username: x.username, nama: x.nama, jabatan: x.jabatan, role: x.role, kantor: x.kantor, aktif: !x.aktif });
      if (!r.ok) return Toast.show(r.msg, 'error');
      Toast.show('Status akun diperbarui.', 'ok');
      reload();
    } else if (ed) {
      userModal(rows.find(r => r.username === ed.dataset.edit), kantor, reload);
    }
  };
};

function userModal(row, kantor, done) {
  const edit = !!row;
  const r = row || { username: '', nama: '', jabatan: '', role: 'AO', kantor: kantor[0] || '', aktif: true };
  const m = modal(`
    <h3>${edit ? 'Ubah' : 'Tambah'} Pengguna</h3>
    <label class="fld"><span>Username *</span><input class="input" id="uU" value="${esc(r.username)}" ${edit ? 'readonly' : ''}></label>
    <label class="fld"><span>Nama lengkap *</span><input class="input" id="uN" value="${esc(r.nama)}"></label>
    <label class="fld"><span>Jabatan</span><input class="input" id="uJ" value="${esc(r.jabatan)}"></label>
    <label class="fld"><span>Peran *</span><select class="input" id="uR">
      ${Object.entries(ROLE_LABEL).map(([k, v]) => `<option value="${k}" ${k === r.role ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select></label>
    <label class="fld"><span>Kantor *</span><select class="input" id="uK">
      ${kantor.map(k => `<option ${k === r.kantor ? 'selected' : ''}>${esc(k)}</option>`).join('')}</select></label>
    <label class="fld"><span>${edit ? 'Reset password (kosongkan jika tidak diubah)' : 'Password awal *'}</span>
      <input class="input" id="uP" type="password" autocomplete="new-password"></label>
    <label class="chk"><input type="checkbox" id="uA" ${r.aktif ? 'checked' : ''}> Akun aktif</label>
    <div class="actions end"><button class="btn-secondary" id="uBatal">Batal</button><button class="btn-primary" id="uSimpan">Simpan</button></div>`);
  const q = s => m.el.querySelector(s).value;
  m.el.querySelector('#uBatal').onclick = m.close;
  m.el.querySelector('#uSimpan').onclick = async () => {
    const body = { username: q('#uU').trim().toLowerCase(), nama: q('#uN').trim(), jabatan: q('#uJ').trim(),
      role: q('#uR'), kantor: q('#uK'), aktif: m.el.querySelector('#uA').checked, password: q('#uP') };
    const res = await Api.call('usave', body);
    if (!res.ok) return Toast.show(res.msg, 'error');
    Toast.show('Pengguna tersimpan.', 'ok');
    m.close();
    done();
  };
}

Pages.adminPar = async () => {
  const [pr, kr] = await Promise.all([Api.call('par'), Api.call('kop')]);
  if (!pr.ok) return App.error(pr.msg);
  const P = pr.par;
  const kantor = (kr.rows || []).map(k => k.kode_kantor);
  const labelInd = {};
  KRITERIA.forEach(p => p.items.forEach(it => { labelInd[it.k] = it.l; }));
  const pct = v => Math.round(num(v) * 10000) / 100;

  const sec = (kunci, title, hint, inner) => `
    <section class="card" data-kunci="${kunci}" style="margin-bottom:16px">
      <h3>${esc(title)}</h3><p class="hint" style="margin-bottom:10px">${esc(hint)}</p>
      <div class="grid-3">${inner}</div>
      <div class="actions end"><button class="btn-primary" data-save="${kunci}">Simpan bagian ini</button></div>
    </section>`;

  const inPct = (k, v, label, t) => fld(label, `<div class="money"><input class="input" type="number" step="0.1" data-k="${esc(k)}" data-t="pct" value="${pct(v)}"><span>%</span></div>`);
  const inNum = (k, v, label) => fld(label, `<input class="input" type="number" step="0.1" data-k="${esc(k)}" data-t="num" value="${num(v)}">`);
  const inTxt = (k, v, label) => fld(label, `<input class="input" data-k="${esc(k)}" data-t="str" value="${esc(v || '')}">`);

  $('#main').innerHTML = `
    <div class="page-head"><div><h2>Parameter Penilaian</h2><p class="muted">Perubahan berlaku untuk penilaian berikutnya. Setiap bagian disimpan terpisah.</p></div></div>
    ${sec('bobot_pilar', 'Bobot pilar 5C', 'Total lima pilar harus 100%.',
        Object.keys(P.bobot_pilar).map(k => inPct(k, P.bobot_pilar[k], k)).join(''))}
    ${sec('bobot_indikator', 'Bobot indikator', 'Total indikator per pilar harus 100%.',
        Object.keys(P.bobot_indikator).map(k => inPct(k, P.bobot_indikator[k], labelInd[k] || k)).join(''))}
    ${sec('likuidasi', 'Persentase likuidasi agunan', 'Nilai likuidasi = taksasi × persentase.',
        Object.keys(P.likuidasi).map(k => inNum(k, P.likuidasi[k], k + ' (%)')).join(''))}
    <section class="card" data-kunci="penyetuju_tahap1" style="margin-bottom:16px">
      <h3>Penyetuju tahap 1 per kantor</h3>
      <p class="hint" style="margin-bottom:10px">Semua plafon tetap wajib disetujui Direktur Utama.</p>
      <div class="grid-3">${kantor.map(k => `
        <label class="fld"><span>${esc(k)}</span>
          <select class="input" data-k="${esc(k)}" data-t="str">
            <option value="MANAJER_OPS" ${(P.penyetuju_tahap1 || {})[k] === 'MANAJER_OPS' ? 'selected' : ''}>Manajer Operasional</option>
            <option value="PIMPINAN_CABANG" ${(P.penyetuju_tahap1 || {})[k] === 'PIMPINAN_CABANG' ? 'selected' : ''}>Pimpinan Cabang</option>
          </select></label>`).join('')}</div>
      <div class="actions end"><button class="btn-primary" data-save="penyetuju_tahap1">Simpan bagian ini</button></div>
    </section>
    ${sec('label_status', 'Label status di layar', 'Teks yang tampil untuk setiap status.',
        Object.keys(P.label_status).map(k => inTxt(k, P.label_status[k], k)).join(''))}`;

  $('#main').onclick = async e => {
    const b = e.target.closest('[data-save]');
    if (!b) return;
    const card = b.closest('[data-kunci]');
    const kunci = card.dataset.kunci;
    const nilai = {};
    $$('[data-k]', card).forEach(el => {
      const t = el.dataset.t;
      nilai[el.dataset.k] = t === 'pct' ? Math.round(num(el.value) * 100) / 10000
                          : t === 'num' ? num(el.value) : el.value;
    });
    const r = await Api.call('spar', { kunci, nilai });
    if (!r.ok) return Toast.show(r.msg, 'error');
    Toast.show('Parameter ' + kunci + ' tersimpan.', 'ok');
  };
};

Pages.adminKop = async () => {
  const r = await Api.call('kop');
  if (!r.ok) return App.error(r.msg);
  const rows = r.rows || [];
  let cur = rows[0] ? rows[0].kode_kantor : null;

  const draw = () => {
    const k = rows.find(x => x.kode_kantor === cur) || {};
    $('#main').innerHTML = `
      <div class="page-head"><div><h2>Kop Surat</h2><p class="muted">Kop dipakai pada memo analisis kredit sesuai kantor permohonan.</p></div></div>
      <div class="split-aside">
        <aside class="card"><h3>Kantor</h3>
          ${rows.map(x => `<button class="office-btn ${x.kode_kantor === cur ? 'on' : ''}" data-kop="${esc(x.kode_kantor)}">
            <b>${esc(x.nama_kantor)}</b><small>${esc(x.kode_kantor)}</small></button>`).join('')}
          <button class="btn-secondary" id="kAdd" style="width:100%">+ Tambah kantor</button>
        </aside>
        <section class="card">
          <div class="letterhead"><b>${esc(k.nama_kantor || '-')}</b>
            <p>${esc(k.alamat || '')}${k.telp ? ' · Telp. ' + esc(k.telp) : ''}${k.email ? ' · ' + esc(k.email) : ''}</p></div>
          <div class="grid-2">
            ${fld('Nama kantor', `<input class="input" id="kNama" value="${esc(k.nama_kantor || '')}">`)}
            ${fld('Warna aksen', `<div class="money"><input class="input" type="color" id="kAksenC" value="${esc(k.aksen_hex || '#14566A')}" style="height:38px;padding:4px"><input class="input" id="kAksen" value="${esc(k.aksen_hex || '#14566A')}"></div>`)}
            ${fld('Alamat', `<textarea class="input" rows="2" id="kAlamat">${esc(k.alamat || '')}</textarea>`, { wide: true })}
            ${fld('Telepon', `<input class="input" id="kTelp" value="${esc(k.telp || '')}">`)}
            ${fld('Email', `<input class="input" id="kEmail" value="${esc(k.email || '')}">`)}
            ${fld('Website', `<input class="input" id="kWeb" value="${esc(k.web || '')}">`)}
            ${fld('Logo (PNG / JPG)', `<input class="input" type="file" id="kLogo" accept="image/png,image/jpeg">
               <small class="hint">${k.punya_logo ? 'Logo kustom tersimpan.' : 'Belum ada logo; memo memakai tampilan teks.'}</small>`)}
            <label class="chk"><input type="checkbox" id="kHapus"> Hapus logo saat ini</label>
          </div>
          <div class="actions end"><button class="btn-primary" id="kSimpan">Simpan Kop Surat</button></div>
        </section>
      </div>`;

    const c = $('#kAksenC'), t = $('#kAksen');
    c.oninput = () => { t.value = c.value.toUpperCase(); };
    t.oninput = () => { if (/^#[0-9A-Fa-f]{6}$/.test(t.value)) c.value = t.value; };
  };

  draw();
  $('#main').onclick = async e => {
    const ko = e.target.closest('[data-kop]');
    if (ko) { cur = ko.dataset.kop; return draw(); }
    if (e.target.id === 'kAdd') return kopBaru();
    if (e.target.id === 'kSimpan') return simpan();
  };

  async function simpan() {
    const body = {
      kode_kantor: cur, nama_kantor: $('#kNama').value, alamat: $('#kAlamat').value, telp: $('#kTelp').value,
      email: $('#kEmail').value, web: $('#kWeb').value, aksen_hex: $('#kAksen').value, hapus_logo: $('#kHapus').checked,
    };
    const f = $('#kLogo').files[0];
    if (f) {
      if (f.size > 2 * 1024 * 1024) return Toast.show('Ukuran logo maksimal 2 MB.', 'error');
      const b64 = await fileBase64(f);
      body.logo_base64 = b64.data; body.logo_mime = b64.mime;
    }
    const res = await Api.call('skop', body);
    if (!res.ok) return Toast.show(res.msg, 'error');
    Toast.show('Kop surat tersimpan.', 'ok');
    Pages.adminKop();
  }

  function kopBaru() {
    const m = modal(`
      <h3>Tambah Kantor</h3>
      <label class="fld"><span>Kode kantor (1–6 huruf kapital) *</span><input class="input" id="nKode" maxlength="6"></label>
      <label class="fld"><span>Nama kantor *</span><input class="input" id="nNama"></label>
      <div class="actions end"><button class="btn-secondary" id="nBatal">Batal</button><button class="btn-primary" id="nOk">Tambah</button></div>`);
    m.el.querySelector('#nBatal').onclick = m.close;
    m.el.querySelector('#nOk').onclick = async () => {
      const kode = m.el.querySelector('#nKode').value.trim().toUpperCase();
      const nama = m.el.querySelector('#nNama').value.trim();
      const res = await Api.call('skop', { kode_kantor: kode, nama_kantor: nama });
      if (!res.ok) return Toast.show(res.msg, 'error');
      m.close();
      Toast.show('Kantor ditambahkan. Atur penyetuju di menu Parameter.', 'ok');
      Pages.adminKop();
    };
  }
};

Pages.adminSektor = async () => {
  const r = await Api.call('sektorAll');
  if (!r.ok) return App.error(r.msg);
  let rows = r.rows || [];
  const state = { q: '', st: '' };

  const draw = () => {
    const f = rows.filter(x => (!state.q || (x.kode + ' ' + x.nama).toLowerCase().includes(state.q))
      && (!state.st || (state.st === 'on') === x.aktif));
    $('#main').innerHTML = `
      <div class="page-head"><div><h2>Sektor Ekonomi</h2><p class="muted">Daftar sektor untuk klasifikasi KBLI pada permohonan.</p></div>
        <button class="btn-primary" id="sAdd">+ Tambah Sektor</button></div>
      <div class="card filter">
        <div class="actions"><input class="input" id="sQ" placeholder="Cari kode atau nama sektor…" value="${esc(state.q)}" style="max-width:360px">
          <select class="input" id="sSt" style="max-width:200px"><option value="">Semua status</option>
            <option value="on" ${state.st === 'on' ? 'selected' : ''}>Aktif</option>
            <option value="off" ${state.st === 'off' ? 'selected' : ''}>Nonaktif</option></select></div>
      </div>
      <div class="card table-wrap"><table class="table">
        <thead><tr><th>Kode</th><th>Nama sektor</th><th>Aktif</th><th></th></tr></thead>
        <tbody>${f.slice(0, 200).map(x => `<tr>
          <td><span class="chip chip-l">${esc(x.kode)}</span></td><td>${esc(x.nama)}</td>
          <td><button class="toggle ${x.aktif ? 'on' : ''}" data-toggle="${esc(x.kode)}"></button></td>
          <td><button class="btn-secondary sm" data-edit="${esc(x.kode)}">Ubah</button></td></tr>`).join('')}
        </tbody></table>
        <p class="muted" style="padding:12px">Menampilkan ${Math.min(200, f.length)} dari ${rows.length} sektor.</p></div>`;
    $('#sQ').oninput = debounce(e => { state.q = e.target.value.toLowerCase(); draw(); }, 250);
    $('#sSt').onchange = e => { state.st = e.target.value; draw(); };
    $('#sAdd').onclick = () => sektorModal(null);
    $('#main').onclick = async e => {
      const tg = e.target.closest('[data-toggle]');
      const ed = e.target.closest('[data-edit]');
      if (tg) {
        const x = rows.find(y => y.kode === tg.dataset.toggle);
        const res = await Api.call('ssektor', { kode: x.kode, nama: x.nama, aktif: !x.aktif });
        if (!res.ok) return Toast.show(res.msg, 'error');
        x.aktif = !x.aktif; App.cache.sektor = null; draw();
      } else if (ed) {
        sektorModal(rows.find(y => y.kode === ed.dataset.edit));
      }
    };
  };

  function sektorModal(row) {
    const edit = !!row;
    const x = row || { kode: '', nama: '', aktif: true };
    const m = modal(`
      <h3>${edit ? 'Ubah' : 'Tambah'} Sektor</h3>
      <label class="fld"><span>Kode (6 digit) *</span><input class="input" id="kd" value="${esc(x.kode)}" ${edit ? 'readonly' : ''} maxlength="6"></label>
      <label class="fld"><span>Nama *</span><textarea class="input" rows="3" id="nm">${esc(x.nama)}</textarea></label>
      <label class="chk"><input type="checkbox" id="ak" ${x.aktif ? 'checked' : ''}> Aktif</label>
      <div class="actions end"><button class="btn-secondary" id="bBatal">Batal</button><button class="btn-primary" id="bOk">Simpan</button></div>`);
    m.el.querySelector('#bBatal').onclick = m.close;
    m.el.querySelector('#bOk').onclick = async () => {
      const res = await Api.call('ssektor', { kode: m.el.querySelector('#kd').value.trim(), nama: m.el.querySelector('#nm').value.trim(), aktif: m.el.querySelector('#ak').checked });
      if (!res.ok) return Toast.show(res.msg, 'error');
      App.cache.sektor = null;
      m.close();
      Toast.show('Sektor tersimpan.', 'ok');
      Pages.adminSektor();
    };
  }

  draw();
};

Pages.adminTampilan = async () => {
  const r = await Api.call('tampilan');
  if (!r.ok) return App.error(r.msg);
  const T = r.tampilan || {};
  const fitur = (T.fitur || '').split('|');
  let bgBaru = null, hapusBg = false;

  $('#main').innerHTML = `
    <div class="page-head"><div>
      <h2>Tampilan Login</h2>
      <p class="muted">Gambar dan teks pada halaman depan login. Perubahan berlaku setelah disimpan dan halaman login dimuat ulang.</p>
    </div></div>
    <div class="dash-grid">
      <section class="card">
        <h3>Teks</h3>
        <form id="fTeks" class="grid-2">
          ${fld('Judul utama (Enter untuk baris baru)',
            `<textarea class="input" rows="2" name="judul_utama">${esc(T.judul_utama || '')}</textarea>`, { wide: true })}
          ${fld('Nama produk', `<input class="input" name="judul_produk" value="${esc(T.judul_produk || '')}">`)}
          ${fld('Judul kartu login', `<input class="input" name="judul_kartu" value="${esc(T.judul_kartu || '')}">`)}
          ${fld('Subjudul kartu login', `<input class="input" name="subjudul_kartu" value="${esc(T.subjudul_kartu || '')}">`, { wide: true })}
          ${fld('Deskripsi', `<textarea class="input" rows="3" name="deskripsi">${esc(T.deskripsi || '')}</textarea>`, { wide: true })}
          ${[0, 1, 2].map(i => fld('Poin fitur ' + (i + 1),
            `<input class="input" data-fitur="${i}" value="${esc(fitur[i] || '')}">`)).join('')}
          ${fld('Transparansi lapisan gelap (0–95%)',
            `<input class="input" type="number" min="0" max="95" name="overlay_persen" value="${esc(T.overlay_persen || 85)}">`)}
          <div class="actions end" style="grid-column:1/-1"><button class="btn-primary" type="submit">Simpan Teks</button></div>
        </form>
      </section>
      <section class="card">
        <h3>Gambar Latar</h3>
        <p class="hint">JPG, PNG, atau WEBP, maks. 2 MB. Disarankan lebar minimal 1600 px.</p>
        <div class="login-preview" id="bgPrev">${r.bg
          ? `<img src="${r.bg}" alt="Pratinjau latar login">`
          : '<span class="muted">Belum ada gambar (memakai warna navy)</span>'}</div>
        <div class="actions" style="margin-top:12px">
          <label class="btn-secondary upload"><input type="file" id="bgFile" accept="image/jpeg,image/png,image/webp" hidden>Pilih gambar</label>
          <button class="btn-secondary" id="bgHapus">Hapus gambar</button>
        </div>
        <div class="actions end"><button class="btn-primary" id="bgSimpan">Simpan Gambar</button></div>
      </section>
    </div>`;

  const kirim = async body => {
    const x = await Api.call('stampilan', body);
    if (!x.ok) return Toast.show(x.msg, 'error');
    Toast.show('Tampilan login tersimpan.', 'ok');
  };

  $('#fTeks').onsubmit = e => {
    e.preventDefault();
    const f = e.target;
    const nilai = {};
    ['judul_utama', 'judul_produk', 'judul_kartu', 'subjudul_kartu', 'deskripsi', 'overlay_persen']
      .forEach(k => { nilai[k] = f.querySelector(`[name=${k}]`).value.trim(); });
    nilai.fitur = $$('[data-fitur]', f).map(x => x.value.trim()).filter(Boolean).join('|');
    kirim({ nilai });
  };

  $('#bgFile').onchange = async e => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) return Toast.show('Ukuran gambar maksimal 2 MB.', 'error');
    bgBaru = await fileBase64(f);
    hapusBg = false;
    $('#bgPrev').innerHTML = `<img src="data:${bgBaru.mime};base64,${bgBaru.data}" alt="Pratinjau latar login">`;
  };

  $('#bgHapus').onclick = () => {
    hapusBg = true; bgBaru = null;
    $('#bgPrev').innerHTML = '<span class="muted">Gambar akan dihapus saat disimpan</span>';
  };

  $('#bgSimpan').onclick = () => {
    if (!bgBaru && !hapusBg) return Toast.show('Pilih gambar atau tekan Hapus gambar.', 'error');
    kirim(hapusBg ? { hapus_bg: true } : { bg_base64: bgBaru.data, bg_mime: bgBaru.mime });
  };
};

Pages.adminLog = async () => {
  const r = await Api.call('logList');
  if (!r.ok) return App.error(r.msg);
  $('#main').innerHTML = `
    <div class="page-head"><div><h2>Log Akses</h2><p class="muted">Catatan login dan aksi tulis. Hanya-baca. Password dan NIK lengkap tidak dicatat.</p></div></div>
    <div class="card table-wrap"><table class="table">
      <thead><tr><th>Waktu</th><th>Username</th><th>Aksi</th><th>Target</th><th>Keterangan</th></tr></thead>
      <tbody>${r.rows.map(x => `<tr>
        <td>${jam(x.waktu)}</td><td>${esc(x.username)}</td>
        <td><span class="chip ${/GAGAL/.test(x.aksi) ? 'chip-tl' : 'chip-l'}">${esc(x.aksi)}</span></td>
        <td class="muted">${esc(x.target)}</td><td>${esc(x.detail)}</td></tr>`).join('')}
      </tbody></table></div>
    <p class="muted">Menampilkan ${r.rows.length} catatan terbaru.</p>`;
};
