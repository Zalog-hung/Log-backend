/* template-renderer.js — STRICT renderer (no gutter, sticky header & STT column)
 * API:
 *   - TemplateRenderer.createTable(headers, rows)
 *   - TemplateRenderer.createTableWrapper(tableNode)
 */
;(function (g) {
  'use strict';

  if (g.TemplateRenderer && g.TemplateRenderer.__READY__) return;

  function toStr(v){ return (v == null ? '' : String(v)); }
  function isNode(x){ return x && typeof x === 'object' && typeof x.nodeType === 'number'; }
  function isSttHeader(h){
    const norm = String(h || '').trim().toLowerCase().replace(/\s+/g,'');
    return norm === 'stt' || norm === 'sothutu' || norm === '#';
  }

  function createTable(headers, rows){
    if (!Array.isArray(headers)) throw new Error('[TemplateRenderer] headers must be an array');
    if (!Array.isArray(rows))    throw new Error('[TemplateRenderer] rows must be an array');

    const table = document.createElement('table');

    // THEAD
    const thead = document.createElement('thead');
    const trh   = document.createElement('tr');

    // Tìm vị trí cột STT trong headers (nếu có)
    let sttIdx = -1;
    for (let i = 0; i < headers.length; i++){
      if (isSttHeader(headers[i])) { sttIdx = i; break; }
    }

    headers.forEach((h, i) => {
      const th = document.createElement('th');
      const name = toStr(h).trim();
      th.textContent = name;
      th.dataset.header = name;
      if (i === sttIdx) th.classList.add('row-number'); // sticky cột STT theo CSS
      trh.appendChild(th);
    });
    thead.appendChild(trh);
    table.appendChild(thead);

    // TBODY
    const tbody = document.createElement('tbody');
    for (let r = 0; r < rows.length; r++){
      const tr  = document.createElement('tr');
      tr.dataset.row = String(r);

      const row = Array.isArray(rows[r]) ? rows[r] : [];
      for (let c = 0; c < headers.length; c++){
        const td = document.createElement('td');
        td.className = 'cell';
        td.dataset.row = String(r);
        td.dataset.header = toStr(headers[c]).trim();

        let v = row[c] ?? '';
        // Nếu là cột STT & ô đang trống → tự điền r+1
        if (c === sttIdx) {
          td.classList.add('row-number'); // sticky theo CSS
          if (v === '' || v == null) v = String(r + 1);
        }

        const sv = toStr(v);
        td.dataset.value = sv;
        td.textContent   = sv;
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);

    return table;
  }

  function createTableWrapper(tableNode){
    if (!isNode(tableNode) || tableNode.tagName !== 'TABLE') {
      throw new Error('[TemplateRenderer] createTableWrapper requires a <table> node');
    }
    // Không còn gutter; chỉ bọc table để scroll
    const host = document.createElement('div');
    host.className = 'table-wrapper';

    // Scroller chứa table
    const scroller = document.createElement('div');
    scroller.className = 'table-scroller';
    scroller.style.cssText = 'overflow:auto;';
    scroller.appendChild(tableNode);

    host.appendChild(scroller);
    return host;
  }

  const api = Object.freeze({
    __READY__: true,
    createTable,
    createTableWrapper,
    // alias để tương thích nếu nơi khác có gọi
    createTableV2: createTable,
    createTableWrapperV2: createTableWrapper
  });

  g.TemplateRenderer = api;
  try { console.info('[template-renderer] ready (no gutter, sticky STT)'); } catch {}
})(window);
