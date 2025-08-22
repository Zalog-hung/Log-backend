// cacheone.js — RAM store + Schema validation (no events here)
;(function (g) {
  'use strict';

  const store = Object.create(null); // key -> { headers:[], data:[][] }

  const Schema = {
    normalizeKey(k) { return String(k||'').trim().toLowerCase().replace(/_/g,''); },
    assertBlock(key, block) {
      if (!block || typeof block !== 'object') {
        throw new Error(`[Schema] '${key}': block must be an object`);
      }
      const { headers, data } = block;
      if (!Array.isArray(headers) || headers.length === 0) {
        throw new Error(`[Schema] '${key}': headers must be a non-empty array`);
      }
      if (!Array.isArray(data)) {
        throw new Error(`[Schema] '${key}': data must be an array of rows`);
      }
      const cols = headers.length;
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (!Array.isArray(row)) {
          throw new Error(`[Schema] '${key}': row ${i} is not an array`);
        }
        if (row.length !== cols) {
          throw new Error(`[Schema] '${key}': row ${i} length=${row.length} != headers length=${cols}`);
        }
      }
    },
    clone(block) {
      return {
        headers: block.headers.slice(0),
        data: block.data.map(r => r.slice(0))
      };
    }
  };

  function setBlock(key, block) {
    const k = Schema.normalizeKey(key);
    if (!k) throw new Error('[CacheOne] setBlock: missing key');
    Schema.assertBlock(k, block);
    store[k] = Schema.clone(block);
    return true;
  }

  function getBlock(key) {
    const k = Schema.normalizeKey(key);
    return store[k] || null;
  }

  // optional: 2D view
  function get(key) {
    const b = getBlock(key);
    return b ? [b.headers].concat(b.data) : undefined;
  }

  g.CacheOne = { setBlock, getBlock, get, Schema };
})(window);
