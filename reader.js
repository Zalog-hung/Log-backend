/* reader.js — STRICT load (NO fallbacks, NO direct CacheOne)
   - Đọc JSON cho từng tab: logchuyen / chamcong / congno + final_data.json
   - Chuẩn hoá -> { headers, data } và reorder theo header cố định
   - Chỉ seed qua DataAccessLayer.setBlock (nguồn sự kiện duy nhất)
   - Cung cấp "render headers spec" cho Model qua getRenderHeaders/tab
*/
;(function () {
  'use strict';

  /* ===================== Fixed headers (nguồn chuẩn để render) ===================== */
  window.HEADER_LOG_CHUYEN = window.HEADER_LOG_CHUYEN || [
    "Stt","ID chuyến","Ngày","Khách hàng","Số lượng","Ca","Số xe","Tài xế","Phụ xe","Ghi chú","#1","#2","#3","#4"
  ];
  window.HEADER_LOG_CHAMCONG = window.HEADER_LOG_CHAMCONG || [
    "Ngày","Tên nhân viên","Số xe","Chức vụ","Ca","Giờ vào","Giờ ra","Vị trí","Ghi chú"
  ];
  window.HEADER_LOG_CONGNO = window.HEADER_LOG_CONGNO || [
    "Ngày","Khách hàng","Miêu tả","Thu","Chi","Ghi chú"
  ];

  const norm = (tab) => Model.normalizeTabKey(tab);

  function fixedHeaders(tab){
    const k = norm(tab);
    if (k==='logchuyen') return window.HEADER_LOG_CHUYEN.slice();
    if (k==='chamcong')  return window.HEADER_LOG_CHAMCONG.slice();
    if (k==='congno')    return window.HEADER_LOG_CONGNO.slice();
    return [];
  }

  // ===== Render headers spec cho Model (bắt buộc có, không fallback) =====
  function _labelToKey(s){
    return String(s || '').trim().toLowerCase().replace(/\s+/g, '_');
  }

  // Dùng cho Model.getBlockForRender: trả { keys, labels }
  function getRenderHeaders(tab){
    const labels = fixedHeaders(tab);
    if (!labels.length) throw new Error(`[Reader] render headers not defined for tab "${tab}"`);
    const keys = labels.map(_labelToKey);
    return { keys, labels };
  }

  // Tương thích dạng object map nếu nơi khác cần
  function getHeaderMap(tab){
    const labels = fixedHeaders(tab);
    if (!labels.length) throw new Error(`[Reader] header map not defined for tab "${tab}"`);
    const map = {};
    for (const lb of labels) map[_labelToKey(lb)] = lb;
    return map;
  }

  // Nếu muốn truy cập trực tiếp dạng object:
  const renderHeaders = {
    logchuyen: getRenderHeaders('logchuyen'),
    chamcong:  getRenderHeaders('chamcong'),
    congno:    getRenderHeaders('congno')
  };

  /* =================== API URL theo tab =================== */
  function apiUrlFor(tab){
    const k = norm(tab);
    if (k==='logchuyen') return window.API_LOGCHUYEN;
    if (k==='chamcong')  return window.API_CHAMCONG;
    if (k==='congno')    return window.API_CONGNO;
    if (k==='final')     return window.API_FINAL;
    return '';
  }

  /* =================== Chuẩn hoá JSON → {headers, data} =================== */
  function from2D(json){
    if (!Array.isArray(json) || !json.length) return { headers:[], data:[] };
    if (!Array.isArray(json[0])) return { headers:[], data:[] };
    const headers = (json[0]||[]).map(x => x ?? '');
    const data = json.slice(1).map(r => Array.isArray(r) ? r.map(x => x ?? '') : []);
    return { headers, data };
  }
  function fromObject(json){
    if (json && typeof json==='object'){
      if (Array.isArray(json.headers) && Array.isArray(json.data)){
        return { headers: json.headers.map(x=>x??''), data: json.data.map(r => Array.isArray(r) ? r.map(x=>x??'') : []) };
      }
      for (const k of Object.keys(json)){
        const v = json[k];
        if (v && typeof v==='object' && Array.isArray(v.headers) && Array.isArray(v.data)){
          return { headers: v.headers.map(x=>x??''), data: v.data.map(r => Array.isArray(r) ? r.map(x=>x??'') : []) };
        }
      }
    }
    return { headers:[], data:[] };
  }
  const ensureBlock = (j) => Array.isArray(j) ? from2D(j) : fromObject(j);

  // Reorder BLOCK theo fixed headers (giữ labels cố định)
  function reorderToFixed(block, tab){
    const fixed = fixedHeaders(tab);
    if (!fixed.length) return block;
    const inHeaders = (block.headers||[]).map(h => String(h||'').trim());
    const idx = new Map(inHeaders.map((h,i)=>[h,i]));
    const rows = (block.data||[]).map(r => fixed.map(col => (r[idx.get(col)] ?? '')));
    return { headers: fixed, data: rows };
  }

  function isValidBlock(b){
    return !!(b && Array.isArray(b.headers) && b.headers.length && Array.isArray(b.data));
  }
  function isEmptyBlock(b){
    const noHeaders = !(b && Array.isArray(b.headers) && b.headers.length);
    const noData    = !(Array.isArray(b?.data) && b.data.length);
    return noHeaders && noData;
  }

  /* ======================= Đọc 1 khối theo tab (STRICT) ======================= */
  async function fetchBlock(tab){
    const url = apiUrlFor(tab);
    if (!url) throw new Error(`[Reader] No API configured for tab "${tab}"`);
    let headers = { 'Content-Type':'application/json' };
    if (window.JSON_API_CONFIG?.HEADERS) headers = Object.assign(headers, window.JSON_API_CONFIG.HEADERS);

    const res = await fetch(url, { method:'GET', headers, cache: 'no-cache' });
    if (!res.ok) throw new Error(`[Reader] HTTP ${res.status} while GET ${url}`);
    let json;
    try { json = await res.json(); } 
    catch(e){ throw new Error(`[Reader] Cannot parse JSON from ${url}: ${e.message}`); }

    try { window.DataAccessLayer?.Json?.setCurrentJsonContext?.(url, json); } catch {}

    const block = reorderToFixed(ensureBlock(json), tab);
    if (isEmptyBlock(block)) throw new Error(`[Reader] Empty/invalid data for tab "${tab}" — aborting`);
    return block;
  }

  /* =================== Load & seed (STRICT) =================== */
  async function loadAndSeed(keys = ['logchuyen','chamcong','congno']){
    const out = {};
    for (const k of keys){
      const block = await fetchBlock(k);
      if (!window.DataAccessLayer?.setBlock) throw new Error('[Reader] DAL.setBlock unavailable');
      window.DataAccessLayer.setBlock(k, block); // sự kiện chuẩn
      if (k === 'chamcong') {
        try { window.EventBus?.emit?.('chamcong:updated', { source: 'Reader.loadAndSeed' }); } catch {}
      }
      out[k] = block;
    }

    // final_data.json (object chứa nhiều block)
    const finalUrl = window.API_FINAL;
    const hdrs = (window.JSON_API_CONFIG && window.JSON_API_CONFIG.HEADERS) || { 'Content-Type': 'application/json' };
    if (!finalUrl) throw new Error('[Reader] API_FINAL not configured');

    const res = await fetch(finalUrl, { method: 'GET', headers: hdrs, cache: 'no-cache' });
    if (res.status === 404) throw new Error('final_data.json not found (404)');
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const j = await res.json();

    const tryUpdate = (key) => {
      const raw = j?.[key];
      const b = ensureBlock(raw);
      if (isValidBlock(b)) {
        if (!window.DataAccessLayer?.setBlock) throw new Error('[Reader] DAL.setBlock unavailable');
        window.DataAccessLayer.setBlock(key, { headers: b.headers, data: b.data });
      } else {
        throw new Error(`[Reader] final_data: key "${key}" invalid or missing`);
      }
    };

    tryUpdate('khachhang'); tryUpdate('nhanvien'); tryUpdate('phuongtien');

    try { window.EventBus?.emit?.('reader:loaded', { detail: { keys } }); } catch {}
    try { window.dispatchEvent?.(new CustomEvent('reader:loaded', { detail: { keys } })); } catch {}
    return out;
  }

  // ===== Export (KHÔNG fallback tại Model, nên Reader PHẢI cung cấp spec) =====
  window.Reader = Object.assign(window.Reader || {}, {
    fetchBlock,
    loadAndSeed,
    getRenderHeaders,
    getHeaderMap,
    renderHeaders
  });
})();
