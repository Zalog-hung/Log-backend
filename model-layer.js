// model-layer.js — Model thuần: giữ render-spec & map header->data cho View
// Vai trò:
// 1) Quản lý tab active
// 2) Giữ SPEC render cố định cho từng tab (keys + labels)
// 3) Lấy block thô qua DAL -> map theo SPEC -> trả cho View/DOM

;(function (g) {
  'use strict';

  // ========= State (tab) =========
  function normalizeTabKey(k){
    return String(k || '').trim().toLowerCase().replace(/[\s]+/g,'').replace(/_/g,'');
  }
  let _activeTab = '';
  function setActiveTab(k){ _activeTab = normalizeTabKey(k); }
  function getActiveTab(){ return _activeTab; }

  // ========= Render SPEC (nguồn chuẩn trong Model) =========
  function toKey(s){ return String(s||'').trim().toLowerCase().replace(/\s+/g,'_'); }

  const SPEC = {
    logchuyen: (function(){
      const labels = [
        "Stt","ID chuyến","Ngày","Khách hàng","Số lượng","Ca",
        "Số xe","Tài xế","Phụ xe","Ghi chú","#1","#2","#3","#4"
      ];
      return { labels, keys: labels.map(toKey) };
    })(),
    chamcong: (function(){
      const labels = [
        "Ngày","Tên nhân viên","Số xe","Chức vụ","Ca",
        "Giờ vào","Giờ ra","Vị trí","Ghi chú"
      ];
      return { labels, keys: labels.map(toKey) };
    })(),
    congno: (function(){
      const labels = [
        "Ngày","Khách hàng","Miêu tả","Thu","Chi","Ghi chú"
      ];
      return { labels, keys: labels.map(toKey) };
    })()
  };

  // Cho phép override nếu thật sự cần (giữ tối giản)
  const _custom = Object.create(null);
  function setCustomRenderHeaders(tab, spec){
    const t = normalizeTabKey(tab);
    if (!spec || !Array.isArray(spec.labels) || !Array.isArray(spec.keys) || spec.keys.length !== spec.labels.length) {
      throw new Error('[Model] setCustomRenderHeaders: spec must have {keys[], labels[]} of equal length');
    }
    _custom[t] = { keys: spec.keys.slice(0), labels: spec.labels.slice(0) };
  }

  function getSpec(tab){
    const t = normalizeTabKey(tab);
    return _custom[t] || SPEC[t] || null;
  }

  // ========= Helpers map từ nguồn thô -> render =========
  function _normalizeSourceHeader(rawHeaders){
    // Nguồn DAL trả headers = mảng label → convert sang keys để so khớp
    const labels = Array.isArray(rawHeaders) ? rawHeaders.map(x=>String(x||'')) : [];
    return { labels, keys: labels.map(toKey) };
  }

  function _buildColIndexMap(sourceKeys, renderKeys){
    const srcIndex = new Map();
    sourceKeys.forEach((k,i)=>srcIndex.set(String(k), i));
    return renderKeys.map(rk => {
      const at = srcIndex.get(String(rk));
      return Number.isInteger(at) ? at : -1;
    });
  }

  function _mapRows(data, colIndexMap){
    const out = new Array(data.length);
    for (let r = 0; r < data.length; r++){
      const row = Array.isArray(data[r]) ? data[r] : [];
      const mapped = new Array(colIndexMap.length);
      for (let c = 0; c < colIndexMap.length; c++){
        const srcIdx = colIndexMap[c];
        mapped[c] = (srcIdx >= 0 ? (row[srcIdx] ?? '') : '');
      }
      out[r] = mapped;
    }
    return out;
  }

  // ========= API cho View =========
  function getBlockForRender(tab){
    if (!g.DataAccessLayer?.getBlock) throw new Error('[Model] DAL.getBlock required');

    const t = normalizeTabKey(tab || getActiveTab());
    const spec = getSpec(t);
    if (!spec) throw new Error(`[Model] render spec not defined for tab '${t}'`);

    const raw = g.DataAccessLayer.getBlock(t);
    if (!raw) return null;

    const src = _normalizeSourceHeader(raw.headers);
    const colIndexMap = _buildColIndexMap(src.keys, spec.keys);

    return {
      headers: spec.labels.slice(0),
      data: _mapRows(Array.isArray(raw.data) ? raw.data : [], colIndexMap)
    };
  }

  function hasRenderSpec(tab){ return !!getSpec(tab); }

  // ========= Export =========
  g.Model = {
    normalizeTabKey,
    setActiveTab,
    getActiveTab,
    setCustomRenderHeaders,
    hasRenderSpec,
    getBlockForRender
  };
})(window);
