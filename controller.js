// controller.js — Controller: UI -> DAL, cập nhật Model
;(function (g){
  'use strict';
  const Bus = g.EventBus;

  if (!Bus?.on || !Bus?.emit) throw new Error('[Controller] EventBus required');
  if (!g.Model?.setActiveTab) throw new Error('[Controller] Model.setActiveTab required');

  function setActiveTab(key){
    g.Model.setActiveTab(key);
    try { g.DataAccessLayer?.notifyChanged?.(key); } catch {}
  }

  function onCellEditCommit(d){
    const { key, rowIndex, colIndex, value } = d || {};
    if (!g.DataAccessLayer?.setCellValue) throw new Error('[Controller] DAL.setCellValue required');
    return g.DataAccessLayer.setCellValue(key, rowIndex, colIndex, value);
  }

  // UI events (handler nhận thẳng detail)
  Bus.on('ui:setActiveTab', ({ key }) => { if (key) setActiveTab(key); });
  Bus.on('ui:cellEditCommit', onCellEditCommit);

  g.Controller = { setActiveTab, onCellEditCommit };
})(window);
