// dom-manager.js — Single render entry: renderBlock({key, headers, data}) via TemplateRenderer
;(function (g){
  'use strict';

  if (!g.TemplateRenderer?.createTable || !g.TemplateRenderer?.createTableWrapper) {
    throw new Error('[DOMManager] TemplateRenderer.{createTable,createTableWrapper} required');
  }

  const WRAPPER_SELECTOR = '#tableWrapper';
  const INFO_SELECTOR    = '#sheetInfo';

  function $(sel){ return document.querySelector(sel); }
  function clear(el){ if (!el) return; while (el.firstChild) el.removeChild(el.firstChild); }

  function updateSheetInfo(key, headers, data){
    const el = $(INFO_SELECTOR);
    if (!el) return;
    const rows = Array.isArray(data) ? data.length : 0;
    const cols = Array.isArray(headers) ? headers.length : 0;
    el.textContent = `${key}: ${rows} bản ghi, ${cols} cột`;
  }

  function renderBlock({ key, headers, data }){
    const host = $(WRAPPER_SELECTOR);
    if (!host) throw new Error('[DOMManager] host #tableWrapper not found');

    clear(host);

    // Dựng table & wrapper bằng TemplateRenderer (đã xử lý cột STT cố định)
    const table   = g.TemplateRenderer.createTable(headers || [], Array.isArray(data) ? data : []);
    const wrapper = g.TemplateRenderer.createTableWrapper(table);

    host.appendChild(wrapper);
    updateSheetInfo(String(key || ''), headers || [], data || []);
  }

  g.DOMManager = { renderBlock };
})(window);
