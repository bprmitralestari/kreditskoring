// ============================================================
// SESI & KOMUNIKASI KE BACKEND (Google Apps Script)
// Semua permintaan = POST text/plain (menghindari preflight CORS)
// Cache memori untuk data baca: perpindahan menu terasa instan.
// Setiap aksi tulis otomatis menghapus cache agar data selalu terbaru.
// ============================================================
const Session = {
  get() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch (e) { return null; }
  },
  set(s) { sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)); },
  clear() { sessionStorage.removeItem(SESSION_KEY); Api.clear(); },
};

// Masa berlaku cache (ms) per aksi baca
const READ_TTL = {
  dashboard: 20000, list: 20000, get: 30000, memo: 30000, img: 600000, users: 30000,
  sektor: 300000, sektorAll: 60000, par: 120000, kop: 120000, tampilan: 60000,
  loginbg: 60000, logList: 20000,
};

// Aksi tulis: setelah dipanggil, seluruh cache dihapus
const WRITE = new Set(['login', 'logout', 'mypass', 'save', 'submit', 'revise', 'upload', 'deleteFile',
  'decide', 'usave', 'spar', 'skop', 'ssektor', 'stampilan']);

// Bilah tipis di atas layar saat ada permintaan ke server
const Loader = {
  n: 0,
  el() {
    let b = document.getElementById('gbar');
    if (!b) { b = document.createElement('div'); b.id = 'gbar'; document.body.appendChild(b); }
    return b;
  },
  start() { this.n++; this.el().classList.add('on'); },
  done() { this.n = Math.max(0, this.n - 1); if (!this.n) this.el().classList.remove('on'); },
};

const Api = {
  _cache: new Map(),
  _inflight: new Map(),

  clear() { this._cache.clear(); this._inflight.clear(); },

  async call(action, data = {}) {
    const ttl = READ_TTL[action];
    const key = action + '|' + JSON.stringify(data);
    if (ttl) {
      const hit = this._cache.get(key);
      if (hit && Date.now() - hit.t < ttl) return hit.v;
      if (this._inflight.has(key)) return this._inflight.get(key);
    }
    const p = this._request(action, data).then(r => {
      if (WRITE.has(action)) this._cache.clear();
      if (ttl && r && r.ok) this._cache.set(key, { v: r, t: Date.now() });
      return r;
    }).finally(() => this._inflight.delete(key));
    if (ttl) this._inflight.set(key, p);
    return p;
  },

  async _request(action, data) {
    const s = Session.get();
    const body = JSON.stringify({ action, token: s ? s.token : '', data });
    Loader.start();
    try {
      let res;
      try {
        res = await fetch(GAS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body,
        });
      } catch (e) {
        return { ok: false, msg: 'Tidak dapat terhubung ke server. Periksa koneksi internet.' };
      }
      let json;
      try { json = await res.json(); }
      catch (e) { return { ok: false, msg: 'Respons server tidak valid. Periksa GAS_URL di js/config.js.' }; }
      if (json.expired) {
        Session.clear();
        location.hash = '#/login';
        Toast.show(json.msg || 'Sesi berakhir.', 'error');
      }
      return json;
    } finally {
      Loader.done();
    }
  },
};
