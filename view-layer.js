// view-layer.js — View: lắng nghe 'data:blockChanged' -> lấy block đã map từ Model -> DOMManager.renderBlock
;(function (g){
  'use strict';

  const Bus = g.EventBus;

  // ======= Assertions (fail fast) =======
  if (!Bus?.on) throw new Error('[ViewLayer] EventBus.on required');
  if (!g.Model?.getActiveTab) throw new Error('[ViewLayer] Model.getActiveTab required');
  if (!g.Model?.getBlockForRender) throw new Error('[ViewLayer] Model.getBlockForRender required');
  if (!g.DOMManager?.renderBlock) throw new Error('[ViewLayer] DOMManager.renderBlock required');

  // ======= Render scheduling =======
  let raf = null;
  let dirty = false;
  let pendingKey = null;

  function flush(){
    raf = null;
    if (!dirty) return;
    dirty = false;

    const active = g.Model.getActiveTab();
    if (!active) return;

    // Chỉ render khi sự kiện đổi đúng block đang active (tránh nhấp nháy khi nạp nhiều tab)
    if (pendingKey && pendingKey !== active) return;

    // LẤY BLOCK ĐÃ MAP QUA MODEL (điểm khác biệt quan trọng so với bản cũ)
    const blk = g.Model.getBlockForRender(active);
    if (!blk || !Array.isArray(blk.headers)) return;

    try {
      g.DOMManager.renderBlock({
        key: active,
        headers: blk.headers,
        data: Array.isArray(blk.data) ? blk.data : []
      });
    } catch (e) {
      console.error('[ViewLayer] render error:', e);
    } finally {
      // reset pending sau khi render
      pendingKey = null;
    }
  }

  function schedule(){
    if (!raf) raf = requestAnimationFrame(flush);
  }

  // ======= Subscriptions =======
  // detail = { key }
  Bus.on('data:blockChanged', (detail) => {
    const key = (detail && detail.key) ? String(detail.key) : '';
    if (!key) return;
    // đánh dấu block thay đổi & render theo frame
    pendingKey = key.toLowerCase();
    dirty = true;
    schedule();
  });

  // Public namespace (nếu cần mở rộng sau này)
  g.ViewLayer = {
    // Cho phép ép render lại tab active hiện tại (khi UI đổi tab nhưng dữ liệu đã có)
    refreshActive(){
      pendingKey = g.Model.getActiveTab() || null;
      dirty = true;
      schedule();
    }
  };
})(window);
