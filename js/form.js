// ============================================================
// FORM PERMOHONAN (v5)
// Urutan wajib: langkah berikutnya hanya terbuka jika langkah sebelumnya lengkap.
// Perhitungan kredit dan memo SELALU dilakukan server; frontend hanya menampilkan.
// ============================================================
const FLAT_IND = KRITERIA.flatMap(p => p.items);
const STEP_TITLES = ['Data Debitur & Agunan', 'Arus Kas & Neraca', 'Penilaian Kertas Kerja 5C', 'Pratinjau & Ajukan'];
const BEBAN_USAHA = [['hpp', 'HPP / pembelian bahan baku'], ['tenaga', 'Beban tenaga kerja'], ['sewa', 'Beban sewa'],
  ['transport', 'Transportasi'], ['listrik', 'Listrik & air'], ['telekom', 'Telekomunikasi'], ['lainU', 'Beban usaha lainnya']];
const BEBAN_RT = [['hidup', 'Biaya hidup keluarga'], ['pendidikan', 'Biaya pendidikan anak'], ['lainRT', 'Beban rumah tangga lainnya']];
const HARTA = [['kas', 'Kas & saldo bank'], ['piutang', 'Piutang usaha'], ['persediaan', 'Persediaan barang'],
  ['tanah', 'Tanah & bangunan'], ['kendaraan', 'Kendaraan'], ['mesin', 'Mesin & peralatan'], ['lainAset', 'Aset lainnya']];
const KEWAJIBAN = [['hutangUsaha', 'Hutang usaha / supplier'], ['hutangBank', 'Hutang bank lain'], ['hutangLain', 'Hutang lainnya (non-bank)']];
const SKOR_KET = { 5: 'Sangat baik', 4: 'Baik', 3: 'Cukup baik', 2: 'Kurang baik', 1: 'Tidak baik' };
const HUB_STATUS = ['Nasabah baru', 'Nasabah lama'];
const SLIK_STATUS = ['Tidak ada pinjaman', 'Ada histori pinjaman'];
const SLIK_KUALITAS = [['1', '1 — Lancar'], ['2', '2 — DPK'], ['3', '3 — Kurang lancar'], ['4', '4 — Diragukan'], ['5', '5 — Macet']];
const BUKTI_TANAH = ['SHM', 'SHGB', 'AJB', 'Lainnya'];

// Field per jenis agunan. Format: [kunci, label, tipe, opsi]
// t teks · a area · m rupiah · n angka · d tanggal · s pilihan · x otomatis
// HARUS sama dengan AGUNAN_WAJIB di Code.gs
const FIELD_KENDARAAN = [['nama', 'Nama agunan', 't'], ['no_bpkb', 'No. BPKB', 't'], ['no_pol', 'No. polisi', 't'],
  ['pemilik', 'Nama pemilik', 't'], ['tahun', 'Tahun pembuatan', 'n'], ['no_mesin', 'No. mesin', 't'],
  ['no_rangka', 'No. rangka', 't'], ['merek', 'Merek', 't'], ['jenis_unit', 'Jenis', 't'], ['taksasi', 'Nilai taksasi (harga pasar)', 'm']];
const AGUNAN_FIELDS = {
  'Tanah': [['nama', 'Nama agunan', 't'], ['luas_tanah', 'Luas tanah (m²)', 'n'], ['alamat', 'Alamat', 'a'],
    ['catatan', 'Catatan / spesifikasi', 'a'], ['bukti', 'Bukti kepemilikan', 's', BUKTI_TANAH],
    ['tgl_sert', 'Tanggal sertifikat', 'd'], ['pemilik', 'Nama pemilik', 't'], ['no_sert', 'No. sertifikat', 't'],
    ['taksasi', 'Nilai taksasi (harga pasar)', 'm']],
  'Bangunan': [['nama', 'Nama agunan', 't'], ['luas_tanah', 'Luas tanah (m²)', 'n'], ['luas_bangunan', 'Luas bangunan (m²)', 'n'],
    ['alamat', 'Alamat', 'a'], ['catatan', 'Catatan / spesifikasi', 'a'], ['bukti', 'Bukti kepemilikan', 's', BUKTI_TANAH],
    ['tgl_sert', 'Tanggal sertifikat', 'd'], ['pemilik', 'Nama pemilik', 't'], ['no_sert', 'No. sertifikat', 't'],
    ['taksasi', 'Nilai taksasi (harga pasar)', 'm']],
  'Kendaraan': FIELD_KENDARAAN,
  'Alat Berat': FIELD_KENDARAAN,
  'Bilyet Deposito': [['no_rek', 'No. rekening deposito', 't'], ['pemilik', 'Nama pemilik deposito', 't'],
    ['taksasi', 'Nominal deposito', 'm'], ['tgl_jatuh_tempo', 'Tanggal jatuh tempo', 'd'], ['tenor_auto', 'Tenor (bulan, otomatis)', 'x']],
  'Tanpa Jaminan (khusus karyawan)': [['gaji', 'Gaji terakhir', 'm'], ['tgl_masuk', 'Tanggal masuk kerja', 'd'],
    ['lama_auto', 'Lama kerja (otomatis)', 'x']],
};

// Tanda blok yang memicu render ulang (bukan sekadar pratinjau)
const RE_RENDER = /^(jenis_debitur|nikah|hubungan\.status|slik\.status|relasi\.\d+\.relasi|relasi\.\d+\.slik\.status|agunan\.\d+\.jenis)$/;

const blank = v => v === undefined || v === null || String(v).trim() === '';
const pctTxt = v => (v == null ? '-' : (Math.round(v * 1000) / 10) + '%');
const adaBerkas = (ctx, bagian) => (ctx.berkas || []).some(b => b.bagian === bagian);
const sumK = (o, keys) => keys.reduce((t, k) => t + num(o && o[k]), 0);
const sumKeys = (list, obj) => sumK(obj, list.map(x => x[0]));
const sektorLabel = (ctx, kode) => {
  const s = (ctx.sektor || []).find(x => x.kode === kode);
  return s ? `${s.kode} — ${s.nama}` : '';
};
const sektorNama = (ctx, kode) => {
  const s = (ctx.sektor || []).find(x => x.kode === kode);
  return s ? s.kode + ' — ' + s.nama : (kode || '-');
};
const bulanSelisih = (dari, ke) => Math.max(0, (ke.getFullYear() - dari.getFullYear()) * 12 + (ke.getMonth() - dari.getMonth()));
const lamaTxt = n => `${Math.floor(n / 12)} tahun ${n % 12} bulan`;

// ---------- Identitas berkas: relasi & agunan memakai uid tetap ----------
const uid_ = () => 'x' + Math.random().toString(36).slice(2, 9);
function ensureUids(d) {
  (d.relasi || []).forEach((r, i) => { if (r.uid == null) r.uid = String(i); });
  (d.agunan || []).forEach((a, i) => { if (a.uid == null) a.uid = String(i); });
}
const bagianRelasi = r => `relasi.${r.uid}.foto`;
const bagianAgunan = a => `agunan.${a.uid}.dok`;

const fotoGroups = ctx => {
  const d = ctx.draft;
  const list = [{ bagian: 'fotoDebitur', label: 'Foto identitas debitur' }];
  (d.relasi || []).forEach((r, i) => list.push({ bagian: bagianRelasi(r), label: `Relasi ${i + 1}${r.nama ? ' · ' + r.nama : ''}` }));
  (d.agunan || []).forEach((a, i) => list.push({ bagian: bagianAgunan(a), label: `Dokumen agunan ${i + 1}${a.nama ? ' · ' + a.nama : ''}` }));
  return list.map(g => ({ ...g, count: (ctx.berkas || []).filter(b => b.bagian === g.bagian).length }));
};

async function loadSektor() {
  if (!App.cache.sektor) {
    const r = await Api.call('sektor');
    App.cache.sektor = r.ok ? r.rows : [];
  }
  return App.cache.sektor;
}

const roField = (label, value) => `<label class="fld"><span>${esc(label)}</span>
  <input class="input" value="${esc(value || '-')}" readonly></label>`;

// Pilihan dengan nilai dan label berbeda (mis. kualitas kredit "1" → "1 — Lancar")
const sOpt = (d, k, label, opts, o = {}) => {
  const cur = String(getPath(d, k) ?? '');
  return fld(label, `<select class="input" data-k="${k}"><option value="">- pilih -</option>
    ${opts.map(([v, l]) => `<option value="${esc(v)}" ${v === cur ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`, o);
};

// Tanggal lahir: tiga pilihan, dibuat lebih lebar (2 kolom)
function tglIn(d, o = {}) {
  const [y = '', m = '', dd = ''] = String(d.tgl_lahir || '').split('-');
  const hari = Array.from({ length: 31 }, (_, i) => i + 1)
    .map(n => `<option value="${n}" ${Number(dd) === n ? 'selected' : ''}>${n}</option>`).join('');
  const bulan = BULAN_ID.map((b, i) => `<option value="${i + 1}" ${Number(m) === i + 1 ? 'selected' : ''}>${b}</option>`).join('');
  const thnNow = new Date().getFullYear();
  const tahun = Array.from({ length: 100 }, (_, i) => thnNow - i)
    .map(n => `<option value="${n}" ${Number(y) === n ? 'selected' : ''}>${n}</option>`).join('');
  return `<label class="fld" style="grid-column:span 2"><span>Tanggal lahir${o.req ? ' <b class="req">*</b>' : ''}</span>
    <div class="tgl3">
      <select class="input" data-tgl="d"><option value="">Tanggal</option>${hari}</select>
      <select class="input" data-tgl="m"><option value="">Bulan</option>${bulan}</select>
      <select class="input" data-tgl="y"><option value="">Tahun</option>${tahun}</select>
    </div></label>`;
}
function composeTgl(ctx, el) {
  const wrap = el.closest('.tgl3');
  const g = k => wrap.querySelector(`[data-tgl="${k}"]`).value;
  const d = g('d'), m = g('m'), y = g('y');
  ctx.draft.tgl_lahir = d && m && y ? `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` : '';
}

// Blok Hubungan dengan Bank (debitur)
function blokHubungan(d) {
  const lama = (d.hubungan || {}).status === 'Nasabah lama';
  return `<div class="slik-box"><b>Hubungan dengan Bank</b>
    <div class="grid-3">
      ${sIn(d, 'hubungan.status', 'Status nasabah', HUB_STATUS, { req: true })}
      ${lama ? `
        ${sOpt(d, 'hubungan.kualitas', 'Kualitas kredit', SLIK_KUALITAS, { req: true })}
        ${mIn(d, 'hubungan.baki', 'Baki debet', { req: true })}
        ${mIn(d, 'hubungan.tunggakan', 'Tunggakan', { req: true })}` : ''}
    </div></div>`;
}

// Blok Ringkasan Fasilitas Menurut SLIK. p = jalur data, mis. "slik" atau "relasi.0.slik"
function blokSlik(d, p, req = false) {
  const histori = (getPath(d, p) || {}).status === 'Ada histori pinjaman';
  return `<div class="slik-box"><b>Ringkasan Fasilitas Menurut SLIK</b>
    <div class="grid-3">
      ${sIn(d, p + '.status', 'Status SLIK', SLIK_STATUS, { req })}
      ${histori ? `
        ${mIn(d, p + '.plafon', 'Plafon efektif', { req })}
        ${mIn(d, p + '.baki', 'Baki debet', { req })}
        ${sOpt(d, p + '.kualitas', 'Kualitas kredit', SLIK_KUALITAS, { req })}
        ${tIn(d, p + '.bulan', 'Bulan data', { type: 'month', req })}
        ${tIn(d, p + '.posisi', 'Posisi data', { type: 'date', req })}` : ''}
    </div></div>`;
}

// ---------- Pemuatan form ----------
Pages.form = async (id, step = 1) => {
  step = Math.min(4, Math.max(1, Number(step) || 1));
  const ctx = {
    id: id || null, step, draft: blankForm(), berkas: [], rec: null, sektor: [],
    last: null, penyetuju: '', invalid: new Set(), saveQ: Promise.resolve(), timer: null, lastHtml: '',
  };
  const [r, sek] = await Promise.all([id ? Api.call('get', { id }) : Promise.resolve(null), loadSektor()]);
  if (id) {
    if (!r.ok) return App.error(r.msg);
    if (!r.bisaUbah) return App.error('Permohonan ini tidak dapat diubah pada status saat ini.');
    ctx.rec = r.rec;
    ctx.berkas = r.berkas || [];
    ctx.draft = Object.assign(blankForm(), r.form);
  }
  ensureUids(ctx.draft);
  ctx.sektor = sek;

  for (let s = 1; s < step; s++) {
    if (cekStep(ctx, s).some(e => e.sev === 'error')) {
      ctx.step = s;
      Toast.show(`Lengkapi Langkah ${s} terlebih dahulu.`, 'error');
      break;
    }
  }
  renderForm(ctx);
};

const STEP_FN = [stepDebitur, stepArus, stepPenilaian, stepPratinjau];

// ---------- Validasi ----------
// sev: 'error' = wajib (menghalangi langkah berikutnya), 'warn' = catatan saja
function cekSlik(s, p, label) {
  const st = s || {};
  if (blank(st.status)) return [{ k: p + '.status', msg: `${label}: status ringkasan SLIK belum dipilih` }];
  const out = [];
  if (st.status === 'Ada histori pinjaman') {
    [['plafon', 'Plafon efektif'], ['baki', 'Baki debet'], ['kualitas', 'Kualitas kredit'],
      ['bulan', 'Bulan data'], ['posisi', 'Posisi data']]
      .forEach(([k, l]) => { if (blank(st[k])) out.push({ k: p + '.' + k, msg: `${label}: ${l} (SLIK) belum diisi` }); });
  }
  return out;
}

function cekAgunan(a, i) {
  const no = `Agunan ${i + 1}`;
  if (!a.jenis) return [{ k: `agunan.${i}.jenis`, msg: `${no}: jenis agunan belum dipilih` }];
  const out = [];
  (AGUNAN_FIELDS[a.jenis] || []).forEach(([key, label, tipe]) => {
    if (tipe === 'x') return;
    const ok = (tipe === 'n' || tipe === 'm') ? num(a[key]) > 0 : !blank(a[key]);
    if (!ok) out.push({ k: `agunan.${i}.${key}`, msg: `${no}: ${label} belum diisi` });
  });
  return out;
}

function cekStep(ctx, n) {
  const d = ctx.draft, out = [];
  const add = (k, msg, sev = 'error') => out.push({ step: n, k, msg, sev });
  const addList = list => list.forEach(x => add(x.k, x.msg));

  if (n === 1) {
    if (blank(d.nomor_sppk)) add('nomor_sppk', 'Nomor SPPK belum diisi');
    if (!d.jenis_permohonan) add('jenis_permohonan', 'Jenis permohonan belum dipilih');
    if (!d.skema) add('skema', 'Skema pembayaran belum dipilih');
    if (!d.jenis_debitur) add('jenis_debitur', 'Jenis calon debitur belum dipilih');
    [['nama', 'Nama lengkap debitur'], ['tempat_lahir', 'Tempat lahir'], ['jk', 'Jenis kelamin'],
      ['nikah', 'Status pernikahan'], ['pendidikan', 'Pendidikan terakhir'], ['pekerjaan', 'Pekerjaan / jabatan'],
      ['telp', 'No. WA / telepon'], ['desa', 'Desa / kelurahan'], ['kecamatan', 'Kecamatan'], ['kota', 'Kab / kota'],
      ['alamat', 'Alamat sesuai KTP'], ['tujuan', 'Tujuan penggunaan pinjaman'], ['profil_usaha', 'Ringkasan profil usaha']]
      .forEach(([k, l]) => { if (blank(getPath(d, k))) add(k, `${l} belum diisi`); });
    if (!/^\d{16}$/.test(String(d.nik || ''))) add('nik', d.nik ? 'NIK harus 16 digit angka' : 'NIK belum diisi');
    if (blank(d.tgl_lahir)) add('tgl_lahir', 'Tanggal lahir belum diisi');
    if (!d.sektor) add('sektor', 'Sektor ekonomi belum dipilih');

    const h = d.hubungan || {};
    if (blank(h.status)) add('hubungan.status', 'Hubungan dengan bank belum dipilih');
    if (h.status === 'Nasabah lama') {
      [['kualitas', 'Kualitas kredit'], ['baki', 'Baki debet'], ['tunggakan', 'Tunggakan']]
        .forEach(([k, l]) => { if (blank(h[k])) add('hubungan.' + k, `Nasabah lama: ${l} belum diisi`); });
    }
    addList(cekSlik(d.slik, 'slik', 'Debitur'));

    if (d.nikah === 'Menikah') {
      const idx = (d.relasi || []).findIndex(r => r.relasi === 'Istri / Suami');
      if (idx < 0) add(null, 'Data istri / suami wajib diisi karena status Menikah');
      else {
        const it = d.relasi[idx];
        if (blank(it.nama)) add(`relasi.${idx}.nama`, 'Nama istri / suami belum diisi');
        if (!/^\d{16}$/.test(String(it.nik || ''))) add(`relasi.${idx}.nik`, 'NIK istri / suami harus 16 digit');
        addList(cekSlik(it.slik, `relasi.${idx}.slik`, 'Istri / suami'));
      }
    }
    (d.agunan || []).forEach((a, i) => addList(cekAgunan(a, i)));
    if (!adaBerkas(ctx, 'fotoDebitur')) add(null, 'Foto identitas debitur belum diunggah', 'warn');
  }

  if (n === 2) {
    if (!(num(d.plafon) > 0)) add('plafon', 'Usulan plafon belum diisi');
    if (!(num(d.tenor) > 0)) add('tenor', 'Jangka waktu (bulan) belum diisi');
    if (!(num(d.bunga) > 0)) add('bunga', 'Suku bunga flat belum diisi');
    if (!d.jenis_angsuran) add('jenis_angsuran', 'Jenis angsuran belum dipilih');
    const a = d.arus || {};
    if (!(num(a.gaji) + num(a.usaha) + num(a.lain) > 0)) {
      add('arus.gaji', 'Pendapatan belum diisi (gaji, omset, atau pendapatan lain)', 'warn');
    }
    if (d.jenis_debitur !== 'Perorangan' && !(sumKeys(HARTA, d.neraca) > 0)) {
      add(null, 'Daftar harta belum diisi', 'warn');
    }
  }

  if (n === 3) {
    FLAT_IND.forEach(it => {
      if (it.auto) return;
      const v = num((d.skor || {})[it.k]);
      if (!(v >= 1 && v <= 5)) add('skor:' + it.k, `Penilaian 5C "${it.l}" belum dipilih`);
    });
  }
  return out;
}
const cekSemua = ctx => [1, 2, 3].flatMap(n => cekStep(ctx, n));

// ---------- Kerangka form ----------
function renderForm(ctx) {
  if (!ctx.hitung) attachHitung(ctx);
  const akhir = ctx.step === 4;
  $('#main').innerHTML = `
    <div class="page-head"><div>
      <a class="link" href="${ctx.id ? '#/permohonan/' + esc(ctx.id) : '#/permohonan'}">← ${ctx.id ? 'Detail permohonan' : 'Daftar permohonan'}</a>
      <h2>${ctx.id ? 'Ubah Permohonan' : 'Permohonan Kredit Baru'}</h2>
      <p class="muted">${ctx.rec ? esc(ctx.rec.sppk || 'Draft') : 'Draft belum tersimpan'}</p></div>
      <div class="actions"><span class="saved" id="saveState"></span>
        <button class="btn-secondary" data-act="save">Simpan Draft</button></div></div>
    <nav class="stepper">${STEP_TITLES.map((t, i) => `
      <button class="step ${i + 1 === ctx.step ? 'is-active' : ''} ${i + 1 < ctx.step ? 'is-done' : ''}" data-go="${i + 1}">${i + 1}. ${esc(t)}</button>`).join('')}</nav>
    <div class="form-layout ${akhir ? 'one' : ''}">
      <section class="card form-main" id="stepBody"></section>
      ${akhir ? '' : `<aside class="card preview" id="preview">
        <h4>Pratinjau Memo (langsung)</h4>
        <iframe class="preview-frame" id="prevFrame" title="Pratinjau memo" sandbox="allow-same-origin"></iframe>
      </aside>`}
    </div>
    <div class="bottombar" id="bottombar"></div>`;

  const main = $('#main');
  main.onclick = e => formClick(e, ctx);
  main.oninput = e => formInput(e, ctx);
  main.onchange = e => formChange(e, ctx);
  main.onmousedown = e => { if (e.target.closest('.combo-list')) e.preventDefault(); };
  main.onfocusin = e => {
    const inp = e.target;
    if (inp.dataset && inp.dataset.combo) { inp.select(); comboRender(ctx, inp, ''); }
  };
  main.onfocusout = e => {
    const inp = e.target;
    if (inp.dataset && inp.dataset.combo) setTimeout(() => comboClose(ctx, inp), 150);
  };
  main.onkeydown = e => {
    const inp = e.target;
    if (!inp.dataset || !inp.dataset.combo) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      const first = inp.parentElement.querySelector('[data-pick]');
      if (first) pilihSektor(ctx, first.dataset.pick);
    } else if (e.key === 'Escape') comboClose(ctx, inp);
  };
  updateBottom(ctx);
  renderBody(ctx);
}

function updateBottom(ctx) {
  const bar = $('#bottombar');
  if (!bar) return;
  const prev = ctx.step > 1
    ? `<button class="btn-secondary btn-lg" data-go="${ctx.step - 1}">← Sebelumnya</button>` : '<span></span>';
  const next = ctx.step < 4
    ? `<button class="btn-primary btn-lg" data-act="next">${ctx.step === 3 ? 'Lanjut ke Pratinjau →' : 'Lanjut →'}</button>`
    : `<button class="btn-primary btn-lg" data-act="submit">Ajukan ke ${esc(ctx.penyetuju || 'Penyetuju Tahap 1')}</button>`;
  bar.innerHTML = prev + next;
}

function renderBody(ctx) {
  if (ctx.step === 1) ensureIstri(ctx.draft);
  const body = $('#stepBody');
  body.innerHTML = STEP_FN[ctx.step - 1](ctx);
  applyInvalid(ctx);
  loadThumbs(body);
  if (ctx.step === 2) updateSums(ctx);
  ctx.hitung();
}

// Istri/suami otomatis ditambahkan (baris pertama) saat status Menikah
function ensureIstri(d) {
  if (d.nikah !== 'Menikah') return;
  if (!(d.relasi || []).some(r => r.relasi === 'Istri / Suami')) {
    d.relasi.unshift({ uid: uid_(), relasi: 'Istri / Suami', slik: { status: '' } });
  }
}

function applyInvalid(ctx) {
  let first = null;
  ctx.invalid.forEach(k => {
    let el;
    if (k.startsWith('skor:')) el = $(`#stepBody [data-skor="${k.slice(5)}"]`);
    else if (k === 'sektor') el = $('#sektorInput');
    else if (k === 'tgl_lahir') el = $('#stepBody .tgl3');
    else el = $(`#stepBody [data-k="${k}"]`);
    if (el) { el.classList.add('is-invalid'); first = first || el; }
  });
  return first;
}

function markInvalid(ctx, errs) {
  errs.forEach(e => { if (e.k) ctx.invalid.add(e.k); });
  const el = applyInvalid(ctx);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function markOk(ctx, el) {
  el.classList.remove('is-invalid');
  ctx.invalid.delete(el.dataset.k || (el.dataset.skor ? 'skor:' + el.dataset.skor : ''));
}

// Pratinjau memo langsung dari server (debounce). Server tetap sumber kebenaran.
function attachHitung(ctx) {
  ctx.hitung = debounce(async () => {
    const r = await Api.call('preview', { form: ctx.draft });
    if (!r.ok) return;
    ctx.last = r;
    if (r.penyetuju) ctx.penyetuju = r.penyetuju;
    if (ctx.step === 4) {
      const body = $('#stepBody');
      if (body) { body.innerHTML = stepPratinjau(ctx); loadThumbs(body); }
      updateBottom(ctx);
      return;
    }
    const fr = $('#prevFrame');
    if (fr && r.html !== ctx.lastHtml) { fr.srcdoc = r.html; ctx.lastHtml = r.html; }
    if (ctx.step === 1) {
      $$('[data-lik]').forEach(el => {
        const a = r.agunan[Number(el.dataset.lik)];
        el.value = a ? rp(a.likuidasi) : '-';
      });
    }
    if (ctx.step === 3) {
      const rc = $('#rpcCell');
      if (rc) rc.textContent = r.skor_rpc;
    }
  }, 500);
}

function updateSums(ctx) {
  const d = ctx.draft, a = d.arus || {}, n = d.neraca || {};
  const set = (k, v) => document.querySelectorAll(`#stepBody [data-sumfor="${k}"]`).forEach(el => { el.textContent = rp(v); });
  const usaha = sumKeys(BEBAN_USAHA, a.beban), rt = sumKeys(BEBAN_RT, a.beban);
  const aset = sumKeys(HARTA, n), kewajiban = sumKeys(KEWAJIBAN, n);
  set('pendapatan', num(a.gaji) + num(a.usaha) + num(a.lain));
  set('usaha', usaha); set('rt', rt);
  set('aset', aset); set('aset2', aset); set('kewajiban', kewajiban); set('modal', aset - kewajiban);
  const dar = aset > 0 ? kewajiban / aset : null;
  document.querySelectorAll('#stepBody [data-sumfor="dar"]').forEach(el => {
    el.textContent = dar == null ? '-' : (dar * 100).toFixed(2) + '%';
  });
}

// ---------- Langkah 1: Data debitur, hubungan, SLIK, relasi, dan agunan ----------
function stepDebitur(ctx) {
  const d = ctx.draft;
  const me = Session.get().user;
  const menikah = d.nikah === 'Menikah';

  const relasiHtml = (d.relasi || []).map((r, i) => {
    const istri = r.relasi === 'Istri / Suami';
    const wajib = istri && menikah;
    return `
    <div class="sub-card"><div class="sub-head"><b>${istri ? 'Istri / Suami' : 'Relasi ' + (i + 1)}${wajib ? ' <b class="req">*</b>' : ''}</b>
      ${wajib ? '' : `<button class="btn-ghost-dark sm" style="width:auto;margin:0;color:var(--text)" data-act="delRelasi" data-i="${i}">Hapus</button>`}</div>
      <div class="with-photo"><div>
        <div class="grid-3">
          ${sIn(d, `relasi.${i}.relasi`, 'Hubungan', SEL_RELASI)}
          ${tIn(d, `relasi.${i}.nama`, 'Nama lengkap', { req: wajib })}
          ${tIn(d, `relasi.${i}.nik`, 'NIK (16 digit)', { req: wajib, maxlen: 16 })}
          ${tIn(d, `relasi.${i}.telp`, 'Telepon')}
        </div>
        ${blokSlik(d, `relasi.${i}.slik`, wajib)}
      </div>
      <aside class="photo-side"><b>Foto ${istri ? 'istri / suami' : 'relasi ' + (i + 1)}</b>${berkasGrid(ctx, bagianRelasi(r))}</aside>
      </div>
    </div>`;
  }).join('');

  const agunanHtml = (d.agunan || []).map((a, i) => {
    const fields = AGUNAN_FIELDS[a.jenis] || [];
    const body = fields.map(([key, label, tipe, opt]) => {
      const k = `agunan.${i}.${key}`;
      if (tipe === 'x') {
        const v = key === 'tenor_auto'
          ? (a.tgl_jatuh_tempo ? lamaTxt(bulanSelisih(new Date(), new Date(a.tgl_jatuh_tempo))) : '-')
          : (a.tgl_masuk ? lamaTxt(bulanSelisih(new Date(a.tgl_masuk), new Date())) : '-');
        return roField(label, v);
      }
      if (tipe === 'm') return mIn(d, k, label, { req: true });
      if (tipe === 'n') return nIn(d, k, label, { req: true });
      if (tipe === 'd') return tIn(d, k, label, { type: 'date', req: true });
      if (tipe === 's') return sIn(d, k, label, opt, { req: true });
      if (tipe === 'a') return aIn(d, k, label, { req: true });
      return tIn(d, k, label, { req: true });
    }).join('');
    const lik = ctx.last && ctx.last.agunan[i] ? rp(ctx.last.agunan[i].likuidasi) : '-';
    const adaLikuidasi = fields.some(f => f[0] === 'taksasi') || a.jenis === 'Tanpa Jaminan (khusus karyawan)';
    return `
    <div class="sub-card"><div class="sub-head"><b>Agunan ${i + 1}</b>
      <button class="btn-ghost-dark sm" style="width:auto;margin:0;color:var(--text)" data-act="delAgunan" data-i="${i}">Hapus</button></div>
      <div class="with-photo"><div>
        <div class="grid-3">
          ${sIn(d, `agunan.${i}.jenis`, 'Jenis agunan', JENIS_AGUNAN, { req: true })}
          ${body}
          ${adaLikuidasi ? `
          <label class="fld"><span>Nilai likuidasi (otomatis dari % × taksasi)</span>
            <input class="input" readonly data-lik="${i}" value="${lik}"></label>` : ''}
        </div>
      </div>
      <aside class="photo-side"><b>Dokumen agunan ${i + 1}</b>${berkasGrid(ctx, bagianAgunan(a))}</aside>
      </div>
    </div>`;
  }).join('');

  return `
  <h3>A.0 Data Account Officer</h3>
  <div class="grid-3">
    ${roField('Nama AO', me.nama)}
    ${roField('Kantor', me.kantorNama || me.kantor)}
    ${roField('Username', me.username)}
  </div>

  <h3>A.1 Informasi Permohonan</h3>
  <div class="grid-3">
    ${tIn(d, 'nomor_sppk', 'Nomor SPPK (isi manual)', { req: true, maxlen: 60, ph: 'Contoh: KRD/KC/202611/0001' })}
    ${sIn(d, 'jenis_permohonan', 'Jenis permohonan', ['Kredit Modal Kerja', 'Kredit Investasi', 'Kredit Konsumtif'], { req: true })}
    ${sIn(d, 'skema', 'Skema pembayaran', ['Modal Kerja', 'Investasi', 'Konsumtif'], { req: true })}
    ${sIn(d, 'jenis_debitur', 'Jenis calon debitur', ['Perorangan', 'Badan Usaha'], { req: true })}
  </div>
  <small class="hint">Nomor SPPK harus unik. Nomor ini dipakai saat permohonan diajukan.</small>

  <h3>A.2 Identitas Calon Debitur</h3>
  <div class="with-photo"><div>
    <div class="grid-3">
      ${tIn(d, 'nama', 'Nama lengkap (sesuai KTP)', { req: true })}
      ${tIn(d, 'nik', 'NIK (16 digit)', { req: true, maxlen: 16 })}
      ${tIn(d, 'tempat_lahir', 'Tempat lahir', { req: true })}
      ${tglIn(d, { req: true })}
      ${sIn(d, 'jk', 'Jenis kelamin', SEL_JK, { req: true })}
      ${sIn(d, 'nikah', 'Status pernikahan', SEL_NIKAH, { req: true })}
      ${sIn(d, 'pendidikan', 'Pendidikan terakhir', SEL_DIDIK, { req: true })}
      ${tIn(d, 'pekerjaan', 'Pekerjaan / jabatan', { req: true })}
      ${tIn(d, 'telp', 'No. WA / telepon', { req: true })}
      ${tIn(d, 'desa', 'Desa / kelurahan', { req: true })}
      ${tIn(d, 'kecamatan', 'Kecamatan', { req: true })}
      ${tIn(d, 'kota', 'Kab / kota', { req: true })}
      ${aIn(d, 'alamat', 'Alamat sesuai KTP', { req: true })}
    </div>
    ${blokHubungan(d)}
    ${blokSlik(d, 'slik', true)}
  </div>
  <aside class="photo-side"><b>Foto identitas debitur</b>${berkasGrid(ctx, 'fotoDebitur')}</aside></div>

  <h3>A.3 Tujuan Pinjaman & Profil Usaha</h3>
  <div class="grid-2">
    <div class="fld"><span>Sektor ekonomi (KBLI) <b class="req">*</b></span>
      <div class="combo">
        <input class="input" id="sektorInput" data-combo="sektor" autocomplete="off"
          placeholder="Ketik kode atau nama sektor…" value="${esc(sektorLabel(ctx, d.sektor))}">
        <div class="combo-list" hidden></div>
      </div>
      <small class="hint">Ketik kode atau sebagian nama sektor, lalu pilih dari daftar.</small>
    </div>
    ${tIn(d, 'tujuan', 'Tujuan penggunaan pinjaman', { req: true })}
    ${aIn(d, 'profil_usaha', 'Ringkasan profil usaha / pekerjaan', { req: true })}
  </div>

  <h3>A.4 Pasangan, Keluarga & Relasi</h3>
  <p class="hint">Jika status pernikahan Menikah, data istri / suami wajib diisi.</p>
  ${relasiHtml}
  <button class="btn-secondary" data-act="addRelasi">+ Tambah relasi</button>

  <h3>A.5 Data Agunan / Jaminan</h3>
  ${agunanHtml}
  <button class="btn-secondary" data-act="addAgunan">+ Tambah agunan</button>`;
}

// ---------- Langkah 2: Arus kas, daftar harta, dan neraca ----------
function stepArus(ctx) {
  const d = ctx.draft;
  const perorangan = d.jenis_debitur === 'Perorangan';
  const list = (rows, prefix) => rows.map(([k, l]) => mIn(d, prefix + k, l)).join('');
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

  <h3>B.1 Penghasilan Bulanan</h3>
  <div class="grid-3">
    ${mIn(d, 'arus.gaji', 'Gaji / penghasilan tetap')}
    ${mIn(d, 'arus.usaha', 'Pendapatan usaha (omset)')}
    ${mIn(d, 'arus.lain', 'Pendapatan lain')}
  </div>
  <div class="sum-row"><span>Total pendapatan</span><b data-sumfor="pendapatan">-</b></div>

  <h3>B.2 Beban Usaha (per bulan)</h3>
  <div class="grid-3">${list(BEBAN_USAHA, 'arus.beban.')}</div>
  <div class="sum-row"><span>Total beban usaha</span><b data-sumfor="usaha">-</b></div>

  <h3>B.3 Beban Rumah Tangga (per bulan)</h3>
  <div class="grid-3">${list(BEBAN_RT, 'arus.beban.')}</div>
  <div class="sum-row"><span>Total beban rumah tangga</span><b data-sumfor="rt">-</b></div>

  <h3>B.4 Kewajiban kepada Pihak Lain</h3>
  <div class="grid-2">${mIn(d, 'arus.angsuran_hutang', 'Angsuran hutang lain / bulan')}</div>

  ${perorangan ? '' : `
  <h3>B.5 Daftar Harta</h3>
  <div class="grid-3">${list(HARTA, 'neraca.')}</div>
  <div class="sum-row"><span>Total harta (aset)</span><b data-sumfor="aset">-</b></div>

  <h3>B.6 Neraca</h3>
  <div class="neraca">
    <div class="sub-card"><b>Aktiva</b>
      <div class="sum-row"><span>Total aktiva (sama dengan total harta)</span><b data-sumfor="aset2">-</b></div>
    </div>
    <div class="sub-card"><b>Pasiva</b>
      ${list(KEWAJIBAN, 'neraca.')}
      <div class="sum-row"><span>Total kewajiban</span><b data-sumfor="kewajiban">-</b></div>
      <div class="sum-row"><span>Modal sendiri (aktiva − kewajiban)</span><b data-sumfor="modal">-</b></div>
      <div class="sum-row"><span>DAR (kewajiban ÷ aktiva)</span><b data-sumfor="dar">-</b></div>
    </div>
  </div>`}`;
}

// ---------- Langkah 3: Penilaian 5C dengan keterangan skor ----------
function stepPenilaian(ctx) {
  const d = ctx.draft;
  const bob = ctx.last ? ctx.last.bobot : null;
  const kurang = bob ? FLAT_IND.filter(i => bob.indikator[i.k] === undefined).map(i => i.k) : [];
  const banner = kurang.length
    ? `<div class="pv-alert pv-err"><b>Bobot indikator belum lengkap di Parameter (${kurang.join(', ')}).</b>
       Minta Admin melengkapi menu Parameter sebelum penilaian dilakukan.</div>` : '';
  const legenda = [5, 4, 3, 2, 1].map(s => `<b>${s}</b> ${SKOR_KET[s]}`).join(' · ');

  return `
  <h3>C. Kertas Kerja Penilaian 5C</h3>
  <p class="muted">Pilih kondisi yang paling sesuai. Skor 5 = paling baik. RPC dihitung otomatis dari arus kas.</p>
  ${banner}
  ${KRITERIA.map((p, pi) => `
    <div class="pillar">
      <div class="pillar-head"><span class="pn">${pi + 1}</span><b>${esc(p.nama)}</b>
        <span class="badge badge-draft">Bobot pilar ${pctTxt(bob ? bob.pilar[p.nama] : undefined)}</span></div>
      <div class="skor-legend">Keterangan skor: ${legenda}</div>
      <table class="table"><thead><tr><th>Indikator</th><th class="c">Bobot</th><th>Pilihan</th><th class="c">Skor</th><th>Keterangan</th></tr></thead><tbody>
      ${p.items.map(it => {
        const wInd = bob ? bob.indikator[it.k] : undefined;
        if (it.auto) {
          const rpcTxt = ctx.last ? (ctx.last.hasil.rpc * 100).toFixed(2) + '%' : '-';
          return `<tr><td>${esc(it.l)}</td><td class="c">${pctTxt(wInd)}</td>
            <td class="muted">Otomatis dari arus kas · RPC ${rpcTxt}</td>
            <td class="c"><b id="rpcCell">${ctx.last ? ctx.last.skor_rpc : '-'}</b></td>
            <td class="ket">Dihitung otomatis</td></tr>`;
        }
        const cur = Number((d.skor || {})[it.k]) || 0;
        return `<tr><td>${esc(it.l)}</td><td class="c">${pctTxt(wInd)}</td>
          <td><select class="input" data-skor="${it.k}"><option value="">- pilih -</option>
            ${[5, 4, 3, 2, 1].map((s, j) => `<option value="${s}" ${cur === s ? 'selected' : ''}>${s} — ${esc(it.o[j])}</option>`).join('')}
          </select></td>
          <td class="c"><b data-skorval>${cur || '-'}</b></td>
          <td class="ket" data-ket>${cur ? esc(SKOR_KET[cur]) : '-'}</td></tr>`;
      }).join('')}
      </tbody></table>
    </div>`).join('')}`;
}

// ---------- Langkah 4: Pratinjau lengkap sebelum diajukan ----------
function stepPratinjau(ctx) {
  if (!ctx.last) return '<div class="skeleton"></div>';
  const d = ctx.draft, h = ctx.last.hasil, bob = ctx.last.bobot;
  const errs = cekSemua(ctx);
  const hard = errs.filter(e => e.sev === 'error');
  const warn = errs.filter(e => e.sev === 'warn');
  const langkah = [...new Set(hard.map(e => e.step))];
  const kv = (l, v) => `<div class="pv-kv"><small>${esc(l)}</small><b>${v}</b></div>`;
  const alamat = [d.alamat, d.desa, d.kecamatan, d.kota].filter(Boolean).join(', ') || '-';
  const sesi = Session.get().user;

  const agunanRows = (d.agunan || []).map((a, i) => {
    const hs = ctx.last.agunan[i] || {};
    return `<tr><td>${esc(a.jenis || '-')}</td><td>${esc(a.nama || '-')}</td><td>${esc(a.bukti || '-')}</td>
      <td class="num">${rp(hs.taksasi)}</td><td class="num">${rp(hs.likuidasi)}</td></tr>`;
  }).join('');

  let idx = 0;
  const rows5 = KRITERIA.map((p, pi) => `
    <tr class="grup"><td colspan="5">${pi + 1}. ${esc(p.nama)} · bobot pilar ${pctTxt(bob.pilar[p.nama])}</td></tr>` +
    p.items.map(it => {
      const det = ctx.last.detail[idx++];
      const pilihan = it.auto
        ? `Otomatis dari arus kas (RPC ${(h.rpc * 100).toFixed(2)}%)`
        : (det.skor ? `${it.o[5 - det.skor]} (${SKOR_KET[det.skor]})` : 'Belum dipilih');
      return `<tr><td>${esc(it.l)}</td><td class="c">${pctTxt(det.bobotInd)}</td><td>${esc(pilihan)}</td>
        <td class="c"><b>${det.skor || '-'}</b></td><td class="c">${det.kontrib.toFixed(4)}</td></tr>`;
    }).join('')).join('');

  return `
  ${hard.length
    ? `<div class="pv-alert pv-err">
        <b>Belum dapat diajukan: ${hard.length} data belum lengkap</b>
        <ul>${hard.map(e => `<li><span class="pv-step">Langkah ${e.step}</span>${esc(e.msg)}</li>`).join('')}</ul>
        <div class="pv-jump">${langkah.map(s => `<button class="btn-primary" data-go="${s}">Perbaiki Langkah ${s}</button>`).join('')}</div>
       </div>`
    : `<div class="pv-alert pv-ok"><b>✓ Semua data wajib sudah lengkap.</b>
        Periksa sekali lagi, lalu ajukan ke ${esc(ctx.penyetuju || 'penyetuju tahap 1')}.</div>`}
  ${warn.length ? `<div class="pv-alert pv-warn"><b>Catatan</b><ul>${warn.map(e => `<li>${esc(e.msg)}</li>`).join('')}</ul></div>` : ''}

  <section class="pv-sec"><h4>A. Data Debitur</h4><div class="pv-grid">
    ${kv('Nomor SPPK', esc(d.nomor_sppk || '-'))}${kv('Account Officer', esc(sesi.nama))}
    ${kv('Nama lengkap', esc(d.nama || '-'))}${kv('NIK', esc(d.nik || '-'))}
    ${kv('Tanggal lahir', esc(tglPanjang(d.tgl_lahir) || '-'))}${kv('Pekerjaan', esc(d.pekerjaan || '-'))}
    ${kv('Jenis permohonan', esc(d.jenis_permohonan || '-'))}${kv('Skema pembayaran', esc(d.skema || '-'))}
    ${kv('Sektor ekonomi (KBLI)', esc(sektorNama(ctx, d.sektor)))}${kv('Telepon', esc(d.telp || '-'))}
    ${kv('Hubungan dengan bank', esc((d.hubungan || {}).status || '-'))}${kv('Status SLIK', esc((d.slik || {}).status || '-'))}
    ${kv('Alamat', esc(alamat))}${kv('Tujuan pinjaman', esc(d.tujuan || '-'))}
  </div></section>

  <section class="pv-sec"><h4>B. Usulan Pinjaman & Kapasitas Bayar</h4><div class="pv-grid">
    ${kv('Usulan plafon', rp(d.plafon))}${kv('Jangka waktu', (d.tenor || 0) + ' bulan')}
    ${kv('Suku bunga flat', (d.bunga || 0) + '% p.a.')}${kv('Jenis angsuran', esc(d.jenis_angsuran || '-'))}
    ${kv('Angsuran per bulan', rp(h.renc))}${kv('Bunga efektif (KAB)', h.efektif != null ? h.efektif + '% p.a.' : '-')}
    ${kv('Total pendapatan', rp(h.pend))}${kv('Beban usaha', rp(h.bebanUsaha))}
    ${kv('Beban rumah tangga', rp(h.bebanRT))}${kv('Laba bersih', rp(h.laba))}
    ${kv('Angsuran hutang lain', rp(h.angHutang))}${kv('Sisa penghasilan', rp(h.sisa))}
    ${kv('RPC', h.sisa > 0 ? (h.rpc * 100).toFixed(2) + '%' : 'Tidak dapat dihitung')}
  </div></section>

  ${d.jenis_debitur === 'Perorangan' ? '' : `<section class="pv-sec"><h4>C. Neraca</h4><div class="pv-grid">
    ${kv('Total harta (aset)', rp(h.aset))}${kv('Total kewajiban', rp(h.kewajiban))}
    ${kv('Modal sendiri', rp(h.modal))}${kv('DAR', h.dar != null ? (h.dar * 100).toFixed(2) + '%' : '-')}
  </div></section>`}

  <section class="pv-sec"><h4>D. Agunan</h4>
    ${(d.agunan || []).length
      ? `<div class="table-wrap"><table class="table"><thead><tr><th>Jenis</th><th>Nama / uraian</th><th>Bukti</th><th class="num">Taksasi</th><th class="num">Likuidasi</th></tr></thead><tbody>${agunanRows}</tbody></table></div>`
      : '<p class="muted">Tidak ada agunan.</p>'}
  </section>

  <section class="pv-sec"><h4>E. Foto & Dokumen</h4>
    ${fotoGroups(ctx).map(g => `<div class="pv-group"><b>${esc(g.label)}</b>
      ${g.count ? berkasGrid(ctx, g.bagian, true) : '<span class="muted">Belum ada berkas.</span>'}</div>`).join('')}
  </section>

  <section class="pv-sec"><h4>F. Penilaian Kertas Kerja 5C</h4>
    <div class="table-wrap"><table class="table"><thead><tr><th>Indikator</th><th class="c">Bobot</th><th>Pilihan</th><th class="c">Skor</th><th class="c">Kontribusi</th></tr></thead>
    <tbody>${rows5}</tbody></table></div>
  </section>

  <section class="pv-sec pv-hasil">
    <div><small>Nilai total</small><b>${Number(h.total).toFixed(2)}</b><small>dari 5,00</small></div>
    <div>${chipPred(h.predikat)}</div>
  </section>`;
}

// ---------- Penanganan event ----------
// Pratinjau diperbarui di setiap perubahan; render ulang hanya jika bagian form berubah
function edited(ctx) {
  scheduleSave(ctx);
  ctx.hitung();
}

// Pemisah ribuan saat mengetik, dengan posisi kursor dijaga
function reformatMoney(el) {
  const raw = el.value;
  const pos = el.selectionStart ?? raw.length;
  const digitsKanan = raw.slice(pos).replace(/\D/g, '').length;
  const digits = raw.replace(/\D/g, '');
  const formatted = digits ? Number(digits).toLocaleString('id-ID') : '';
  el.value = formatted;
  let i = formatted.length, hitung = 0;
  while (i > 0 && hitung < digitsKanan) { i--; if (/\d/.test(formatted[i])) hitung++; }
  el.setSelectionRange(i, i);
}

function formInput(e, ctx) {
  const el = e.target;
  if (el.dataset.combo) { comboRender(ctx, el, el.value); return; }
  if (el.dataset.k && el.tagName !== 'SELECT') {
    let v;
    if (el.dataset.n === 'm') {
      reformatMoney(el);
      v = el.value.trim() === '' ? '' : parseVal(el);
    } else {
      v = parseVal(el);
    }
    setPath(ctx.draft, el.dataset.k, v);
    markOk(ctx, el);
    if (ctx.step === 2) updateSums(ctx);
    edited(ctx);
  }
}

async function formChange(e, ctx) {
  const el = e.target;
  if (el.dataset.tgl) { composeTgl(ctx, el); return edited(ctx); }
  if (el.dataset.k && el.tagName === 'SELECT') {
    setPath(ctx.draft, el.dataset.k, el.value);
    markOk(ctx, el);
    if (RE_RENDER.test(el.dataset.k)) {
      if (el.dataset.k === 'nikah') ensureIstri(ctx.draft);
      scheduleSave(ctx);
      return renderBody(ctx);
    }
    return edited(ctx);
  }
  if (el.dataset.skor) {
    ctx.draft.skor[el.dataset.skor] = Number(el.value) || 0;
    markOk(ctx, el);
    const row = el.closest('tr');
    if (row) {
      const v = Number(el.value) || 0;
      row.querySelector('[data-skorval]').textContent = v || '-';
      row.querySelector('[data-ket]').textContent = SKOR_KET[v] || '-';
    }
    return edited(ctx);
  }
  if (el.dataset.k && el.dataset.n === 'm') {
    el.value = fmtMoney(getPath(ctx.draft, el.dataset.k));
    scheduleSave(ctx);
  }
  if (el.dataset.upload) return uploadFiles(ctx, el);
}

async function formClick(e, ctx) {
  const t = e.target.closest('[data-go],[data-act],[data-pick]');
  if (!t) return;
  if (t.dataset.pick) return pilihSektor(ctx, t.dataset.pick);
  if (t.dataset.go) return goStep(ctx, Number(t.dataset.go));
  switch (t.dataset.act) {
    case 'save': return saveDraft(ctx, true);
    case 'next': return nextStep(ctx);
    case 'submit': return submitForm(ctx);
    case 'addRelasi':
      ctx.draft.relasi.push({ uid: uid_(), relasi: 'Lainnya', slik: { status: '' } });
      scheduleSave(ctx); return renderBody(ctx);
    case 'delRelasi': {
      const r = ctx.draft.relasi[Number(t.dataset.i)];
      if (r && r.relasi === 'Istri / Suami' && ctx.draft.nikah === 'Menikah') return;
      ctx.draft.relasi.splice(Number(t.dataset.i), 1);
      scheduleSave(ctx); return renderBody(ctx);
    }
    case 'addAgunan':
      ctx.draft.agunan.push({ uid: uid_(), jenis: JENIS_AGUNAN[0] });
      scheduleSave(ctx); return renderBody(ctx);
    case 'delAgunan':
      ctx.draft.agunan.splice(Number(t.dataset.i), 1);
      scheduleSave(ctx); return renderBody(ctx);
    case 'delBerkas': return deleteBerkas(ctx, t.dataset.id);
  }
}

// ---------- Simpan (autosave + manual, berurutan) ----------
async function saveDraft(ctx, notify = false) {
  const st = $('#saveState');
  if (st) st.textContent = 'Menyimpan…';
  let r;
  try { r = await Api.call('save', { id: ctx.id, form: ctx.draft }); }
  catch (e) { r = { ok: false, msg: 'Gagal menyimpan.' }; }
  if (!r.ok) {
    if (st) st.textContent = 'Belum tersimpan';
    Toast.show(r.msg || 'Gagal menyimpan.', 'error');
    return false;
  }
  ctx.id = r.id;
  const st2 = $('#saveState');
  if (st2) st2.textContent = 'Tersimpan ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  if (notify) Toast.show('Draft tersimpan.', 'ok');
  return true;
}

function queueSave(ctx, notify = false) {
  ctx.saveQ = ctx.saveQ.then(() => saveDraft(ctx, notify));
  return ctx.saveQ;
}

function scheduleSave(ctx) {
  clearTimeout(ctx.timer);
  ctx.timer = setTimeout(() => queueSave(ctx, false), 1000);
}

// Pindah langkah. Maju hanya jika semua langkah sebelumnya sudah lengkap (urutan wajib).
async function goStep(ctx, n) {
  if (n > ctx.step) {
    for (let s = 1; s < n; s++) {
      const h = cekStep(ctx, s).filter(e => e.sev === 'error');
      if (h.length) {
        ctx.invalid = new Set(h.map(e => e.k).filter(Boolean));
        await Dialog.show({
          tone: 'error',
          title: `Urutan belum sesuai: lengkapi Langkah ${s} dahulu`,
          items: [`Langkah ${s} belum lengkap (${h.length} data).`, ...h.slice(0, 6).map(e => e.msg)],
          actions: [{ label: `Buka Langkah ${s}`, key: 'go', cls: 'btn-primary' }],
        });
        return goStep(ctx, s);
      }
    }
  }
  if (!ctx.id && !(await queueSave(ctx, false))) return;
  if (ctx.id) { clearTimeout(ctx.timer); queueSave(ctx, false); }
  ctx.step = n;
  history.replaceState(null, '', `#/permohonan/${ctx.id || 'baru'}/edit/${n}`);
  renderForm(ctx);
}

async function nextStep(ctx) {
  const errs = cekStep(ctx, ctx.step);
  const hard = errs.filter(e => e.sev === 'error');
  const warn = errs.filter(e => e.sev === 'warn');

  if (hard.length) {
    ctx.invalid = new Set();
    markInvalid(ctx, hard);
    return Dialog.show({
      tone: 'error',
      title: `Lengkapi ${hard.length} data pada langkah ini`,
      items: hard.map(e => e.msg),
      actions: [{ label: 'Lengkapi dulu', key: 'close', cls: 'btn-primary' }],
    });
  }
  if (warn.length) Toast.show('Catatan: ' + warn[0].msg + '.', 'info');
  return goStep(ctx, ctx.step + 1);
}

async function submitForm(ctx) {
  const errs = cekSemua(ctx);
  const hard = errs.filter(e => e.sev === 'error');
  const warn = errs.filter(e => e.sev === 'warn');

  if (hard.length) {
    const langkah = [...new Set(hard.map(e => e.step))];
    const pilih = await Dialog.show({
      tone: 'error',
      title: `Ada ${hard.length} data yang belum lengkap`,
      items: hard.map(e => `Langkah ${e.step}: ${e.msg}`),
      actions: [
        { label: 'Tutup', key: 'close', cls: 'btn-secondary' },
        ...langkah.map(s => ({ label: `Buka Langkah ${s}`, key: 's' + s, cls: 'btn-primary' })),
      ],
    });
    if (pilih && pilih.startsWith('s')) {
      const s = Number(pilih.slice(1));
      ctx.invalid = new Set(hard.filter(e => e.step === s).map(e => e.k).filter(Boolean));
      return goStep(ctx, s);
    }
    return;
  }

  const pilih = await Dialog.show({
    tone: warn.length ? 'warn' : 'ok',
    title: `Ajukan permohonan ke ${ctx.penyetuju || 'penyetuju tahap 1'}?`,
    items: warn.length
      ? ['Catatan (tidak menghalangi pengajuan):', ...warn.map(w => w.msg)]
      : ['Setelah diajukan, data tidak dapat diubah sampai dikembalikan.'],
    actions: [
      { label: 'Batal', key: 'close', cls: 'btn-secondary' },
      { label: 'Ya, ajukan', key: 'ok', cls: 'btn-primary' },
    ],
  });
  if (pilih !== 'ok') return;

  clearTimeout(ctx.timer);
  if (!(await queueSave(ctx, false))) return;
  const r = await Api.call('submit', { id: ctx.id });
  if (!r.ok) {
    return Dialog.show({ tone: 'error', title: 'Pengajuan belum dapat diproses', items: [r.msg],
      actions: [{ label: 'Mengerti', key: 'close', cls: 'btn-primary' }] });
  }
  Toast.show('Permohonan diajukan. SPPK: ' + r.sppk, 'ok');
  location.hash = '#/permohonan/' + ctx.id;
}

// ---------- Berkas ----------
async function uploadFiles(ctx, input) {
  const bagian = input.dataset.upload;
  const files = Array.from(input.files || []);
  input.value = '';
  if (!files.length) return;
  if (!ctx.id && !(await queueSave(ctx, false))) return;

  const hasil = await Promise.all(files.map(async f => {
    try {
      const p = await fileToPayload(f);
      const r = await Api.call('upload', Object.assign({ id: ctx.id, bagian }, p));
      return r.ok ? null : r.msg;
    } catch (err) {
      return err.message;
    }
  }));
  const gagal = hasil.filter(Boolean);
  if (gagal.length) {
    await Dialog.show({ tone: 'error', title: 'Sebagian berkas belum terunggah', items: gagal,
      actions: [{ label: 'Mengerti', key: 'close', cls: 'btn-primary' }] });
  }
  const g = await Api.call('get', { id: ctx.id });
  if (g.ok) ctx.berkas = g.berkas || [];
  renderBody(ctx);
}

async function deleteBerkas(ctx, idBerkas) {
  if (!confirm('Hapus berkas ini dari permohonan? Berkas tetap tersimpan di Drive untuk jejak audit.')) return;
  const r = await Api.call('deleteFile', { id_berkas: idBerkas });
  if (!r.ok) {
    return Dialog.show({ tone: 'error', title: 'Berkas belum dapat dihapus', items: [r.msg],
      actions: [{ label: 'Mengerti', key: 'close', cls: 'btn-primary' }] });
  }
  const g = await Api.call('get', { id: ctx.id });
  if (g.ok) ctx.berkas = g.berkas || [];
  renderBody(ctx);
}

// ---------- Sektor (combobox) ----------
function sektorCocok(ctx, q) {
  const s = String(q || '').trim().toLowerCase();
  const list = ctx.sektor || [];
  const f = s ? list.filter(x => (x.kode + ' ' + x.nama).toLowerCase().includes(s)) : list;
  return { items: f.slice(0, 50), total: f.length };
}
function comboRender(ctx, inp, q) {
  const box = inp.parentElement.querySelector('.combo-list');
  const { items, total } = sektorCocok(ctx, q);
  box.innerHTML = items.length
    ? items.map(x => `<button type="button" class="combo-item" data-pick="${esc(x.kode)}"><b>${esc(x.kode)}</b> ${esc(x.nama)}</button>`).join('')
      + (total > items.length ? `<div class="combo-more">Menampilkan ${items.length} dari ${total}. Ketik lebih spesifik.</div>` : '')
    : '<div class="combo-more">Tidak ada sektor yang cocok.</div>';
  box.hidden = false;
}
function comboClose(ctx, inp) {
  const box = inp.parentElement.querySelector('.combo-list');
  if (box) box.hidden = true;
  inp.value = sektorLabel(ctx, ctx.draft.sektor);
}
function pilihSektor(ctx, kode) {
  ctx.draft.sektor = kode;
  ctx.invalid.delete('sektor');
  const inp = $('#sektorInput');
  if (inp) { inp.value = sektorLabel(ctx, kode); comboClose(ctx, inp); }
  scheduleSave(ctx);
  ctx.hitung();
}
