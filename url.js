/* url.js — THUẦN MODEL
 * Nhiệm vụ: SSOT tháng/năm + build API URLs + cấu hình JSON.
 * ❌ Không EventBus, ❌ Không UI, ❌ Không reload dữ liệu.
 * ✅ Giữ tên hàm/biến: DateManager.*, UrlManager.*, __rebuild, fileName, baseUrl, …
 */
;(function () {
  'use strict';

  /* ===================== Config ===================== */
  const DEFAULT = {
    BASE_URL: '',              // '' => cùng origin
    JSON_PREFIX: '/filejson',  // thư mục chứa JSON
    TOKEN: ''                  // nếu cần auth
  };
  let CFG = Object.assign({}, DEFAULT, (window.JSON_API_CONFIG || {}));

  /* ===================== State (SSOT tháng/năm) ===================== */
  if (typeof window.currentMonth !== 'number') window.currentMonth = new Date().getMonth() + 1;
  if (typeof window.currentYear  !== 'number') window.currentYear  = new Date().getFullYear();

  /* ===================== Utils (thuần dữ liệu) ===================== */
  const pad2   = (n) => String(n).padStart(2, '0');
  const join   = (a, b) => (String(a || '').replace(/\/+$/, '') || '') + '/' + String(b || '').replace(/^\/+/, '');
  const mm_yyyy = (m, y) => `${pad2(m)}_${y}`;

  // Giữ tên hàm fileName như cũ
  function fileName(type, m, y) {
    const t = String(type).toLowerCase();
    const token = mm_yyyy(m, y);
    if (t === 'logchuyen') return `Logchuyen_${token}.json`;
    if (t === 'chamcong')  return `Chamcong_${token}.json`;
    if (t === 'congno')    return `Congno_${token}.json`;
    if (t === 'final')     return `final_data.json`;
    return `final_data.json`;
  }

  // Giữ tên hàm baseUrl như cũ
  function baseUrl() {
    return join(CFG.BASE_URL || '', CFG.JSON_PREFIX || '/filejson');
  }

  function buildAuthHeaders() {
    const h = { 'Content-Type': 'application/json' };
    if (CFG.TOKEN) h['x-api-key'] = CFG.TOKEN;
    return h;
  }

  /* ===================== Builder URLs ===================== */
  function buildUrls(m, y) {
    const b = baseUrl();
    return {
      logchuyen: join(b, fileName('logchuyen', m, y)),
      chamcong:  join(b, fileName('chamcong',  m, y)),
      congno:    join(b, fileName('congno',    m, y)),
      final:     join(b, fileName('final',     m, y))
    };
  }

  function applyUrls(u) {
    window.API_LOGCHUYEN = u.logchuyen;
    window.API_CHAMCONG  = u.chamcong;
    window.API_CONGNO    = u.congno;
    window.API_FINAL     = u.final;
    window.JSON_API_CONFIG = {
      BASE_URL: CFG.BASE_URL,
      JSON_PREFIX: CFG.JSON_PREFIX,
      TOKEN: CFG.TOKEN,
      HEADERS: buildAuthHeaders()
    };
  }

  // __rebuild: dựng lại URLs theo currentMonth/Year hiện tại
  function rebuild() {
    const m = Number(window.currentMonth) || (new Date().getMonth() + 1);
    const y = Number(window.currentYear)  || (new Date().getFullYear());
    const urls = buildUrls(m, y);
    applyUrls(urls);
    return urls;
  }

  /* ===================== DateManager (SSOT tháng/năm) ===================== */
  // Giữ tên hàm như bản gốc; chỉ cập nhật state + __rebuild (không EventBus/UI)
  function setMonth(m) {
    m = +m;
    if (m >= 1 && m <= 12) { window.currentMonth = m; rebuild(); }
    return { month: window.currentMonth, year: window.currentYear };
  }
  function setYear(y) {
    y = +y;
    if (y >= 2000 && y <= 9999) { window.currentYear = y; rebuild(); }
    return { month: window.currentMonth, year: window.currentYear };
  }
  function changeMonth(delta) {
    let m = Number(window.currentMonth) || (new Date().getMonth() + 1);
    let y = Number(window.currentYear)  || (new Date().getFullYear());
    m += Number(delta || 0);
    while (m > 12) { m -= 12; y++; }
    while (m < 1)  { m += 12; y--; }
    window.currentMonth = m; window.currentYear = y;
    rebuild();
    return { month: m, year: y };
  }
  window.DateManager = window.DateManager || { setMonth, setYear, changeMonth };

  /* ===================== UrlManager (API model) ===================== */
  window.UrlManager = window.UrlManager || {
    setJsonConfig(cfg){ CFG = Object.assign({}, CFG, (cfg || {})); rebuild(); },
    getJsonConfig(){ return Object.assign({}, CFG); },
    buildAuthHeaders,
    baseUrl,
    fileName,
    buildUrls,
    __rebuild: rebuild,
    // Giữ hàm tương thích cũ (nếu có nơi dùng):
    getApiUrlForType(type){
      const t = String(type).toLowerCase();
      if (t === 'final') return window.API_FINAL;
      if (t === 'logchuyen') return window.API_LOGCHUYEN;
      if (t === 'chamcong')  return window.API_CHAMCONG;
      if (t === 'congno')    return window.API_CONGNO;
      // fallback build theo current
      const m = window.currentMonth, y = window.currentYear;
      return buildUrls(m, y)[t] || window.API_FINAL;
    }
  };

  /* ===================== Init lần đầu (model-only) ===================== */
  rebuild();
})();
