// event-bus.js — Simple pub/sub. Handlers receive 'detail' directly.
;(function (g) {
  'use strict';

  const _map = new Map(); // type -> Set<handler>

  function on(type, handler) {
    if (!type || typeof handler !== 'function') throw new Error('[EventBus] on: bad args');
    let set = _map.get(type);
    if (!set) { set = new Set(); _map.set(type, set); }
    set.add(handler);
    return () => off(type, handler);
  }

  function off(type, handler) {
    const set = _map.get(type);
    if (!set) return false;
    return set.delete(handler);
  }

  function emit(type, detail) {
    const set = _map.get(type);
    if (!set || set.size === 0) return 0;
    for (const fn of Array.from(set)) {
      try { fn(detail); } catch (e) { console.error('[EventBus] handler error', type, e); }
    }
    return set.size;
  }

  g.EventBus = { on, off, emit };
})(window);
