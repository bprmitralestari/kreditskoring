// ============================================================
// SESI & KOMUNIKASI KE BACKEND (Google Apps Script)
// Semua permintaan = POST text/plain (menghindari preflight CORS)
// ============================================================
const Session = {
  get() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch (e) { return null; }
  },
  set(s) { sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)); },
  clear() { sessionStorage.removeItem(SESSION_KEY); },
};

const Api = {
  async call(action, data = {}) {
    const s = Session.get();
    const body = JSON.stringify({ action, token: s ? s.token : '', data });
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
  },
};
