// main.js — Boot: chọn tab & gọi Reader; render sẽ đến từ data:blockChanged
;(function (g){
  'use strict';
  function boot(){
    if (!g.Reader?.loadAndSeed) throw new Error('[main] Reader.loadAndSeed required');
    if (!g.Controller?.setActiveTab) throw new Error('[main] Controller.setActiveTab required');

    g.Controller.setActiveTab('logchuyen');      // C -> M (+notify if have data)
    g.Reader.loadAndSeed().catch(err => console.error('[main] load failed:', err));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
