/* template-renderer.js — PURE renderer (no gutter, no data mutation)
 * API:
 *   TemplateRenderer.createTable(headers, rows)
 *   TemplateRenderer.createTableWrapper(tableNode)
 */
;(function (g) {
  'use strict';
  if (g.TemplateRenderer && g.TemplateRenderer.__READY__) return;

  const toStr = (v) => (v == null ? '' : String(v));
  const isNode = (x) => x && typeof x === 'object' && typeof x.nodeType === 'number';
  const isSttHeader = (h) => String(h || '').trim().toLowerCase().replace(/\s+/g,'') === 'stt';

  function createTable(headers, rows){
    if (!Array.isArray(headers)) throw new Error('[TemplateRenderer] headers must be array');
    if (!Array.isArray(rows))    throw new Error('[TemplateRenderer] rows must be array');

    const table = document.createElement('table');

    // THEAD
    const thead = document.createElement('thead');
    const trh = document.createElement('tr');

    // xác định cột STT (nếu có trong headers)
    let sttIdx = -1;
    for (let i = 0; i < headers.length; i++){
      const name = toStr(headers[i]).trim();
      const th = document.createElement('th');
      th.textContent = name;
      th.dataset.header = name;
      if (isSttHeader(name)) { sttIdx = i; th.classList.add('row-number'); }
      trh.appendChild(th);
    }
    thead.appendChild(trh);
    table.appendChild(thead);

    // TBODY (KHÔNG tự sinh dữ liệu — render đúng rows truyền vào)
    const tbody = document.createElement('tbody');
    for (let r = 0; r < rows.length; r++){
      const tr = document.createElement('tr');
      const row = Array.isArray(rows[r]) ? rows[r] : [];
      for (let c = 0; c < headers.length; c++){
        const td = document.createElement('td');
        td.className = 'cell';
        td.dataset.row = String(r);
        td.dataset.header = toStr(headers[c]).trim();
        if (c === sttIdx) td.classList.add('row-number'); // chỉ thêm class để CSS sticky
        const v = toStr(row[c] ?? '');
        td.dataset.value = v;
        td.textContent = v;
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
    // Không gutter; chỉ bọc để scroll
    const host = document.createElement('div');
    host.className = 'table-wrapper';

    const scroller = document.createElement('div');
    scroller.className = 'table-scroller';
    scroller.style.cssText = 'overflow:auto;';
    scroller.appendChild(tableNode);

    host.appendChild(scroller);
    return host;
  }

  g.TemplateRenderer = Object.freeze({
    __READY__: true,
    createTable,
    createTableWrapper,
    // alias giữ tương thích
    createTableV2: createTable,
    createTableWrapperV2: createTableWrapper
  });
  try { console.info('[template-renderer] ready (pure, no gutter)'); } catch {}
})(window);
