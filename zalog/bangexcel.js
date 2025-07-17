// ✅ Gọi cấu hình cột
import { formConfig } from './cauhinh.js';

const gridElement = document.getElementById('gridElement');

// ✅ THÊM DÒNG
import { formConfig, zacache } from './cauhinh.js';

export function themDongMoi() {
  const gridElement = document.querySelector('.excel-grid');
  const totalCells = gridElement.querySelectorAll('.excel-cell').length;

  if (totalCells % formConfig.TOTAL_COLUMN_COUNT !== 0) {
    console.warn('⚠️ Dữ liệu bảng bị lệch! Dòng hiện tại không đủ 7 ô.');
    return;
  }

  const newInputs = [];
  const lastInputs = Array.from(gridElement.querySelectorAll('input'));
  const lastRowStart = lastInputs.length - formConfig.FORM_COLUMN_COUNT;
  const lastRow = lastInputs.slice(lastRowStart);

  for (let i = 0; i < formConfig.FORM_COLUMN_COUNT; i++) {
    const input = document.createElement('input');
    input.type = 'text';
    input.setAttribute('data-col', i);

    // ✅ Giữ giá trị từ dòng trước nếu cần
    if (formConfig.FIELDS_TO_KEEP_VALUE.includes(i) && lastRow[i]) {
      input.value = lastRow[i].value;
    }

    // ✅ Gọi xử lý nhập liệu từ zacache nếu có
    try {
      const handler = zacache.colEvents?.[i];
      if (typeof handler === 'function') {
        handler(input);
      }
    } catch (err) {
      console.warn(`⚠️ Lỗi khi gán sự kiện cột ${i}:`, err);
    }

    const cell = document.createElement('div');
    cell.className = 'excel-cell data-cell';
    cell.appendChild(input);
    gridElement.appendChild(cell);
    newInputs.push(input);
  }

  // ✅ Cột hành động
  const actionCell = document.createElement('div');
  actionCell.className = 'excel-cell action-cell';
  actionCell.innerHTML = `
    <button onclick="editRow(this)">✏️</button>
    <button onclick="deleteRow(this)">🗑️</button>
    <button onclick="splitRow(this)">⚙️</button>
  `;
  gridElement.appendChild(actionCell);

  return newInputs;
}

// ✅ XOÁ DÒNG
export function xoaDong(button) {
  const actionCell = button.closest('.excel-cell');
  const allCells = Array.from(gridElement.children);
  const index = allCells.indexOf(actionCell);

  if (index >= formConfig.TOTAL_COLUMN_COUNT) {
    for (let i = 0; i < formConfig.TOTAL_COLUMN_COUNT; i++) {
      gridElement.removeChild(gridElement.children[index - formConfig.FORM_COLUMN_COUNT]);
    }
  }
}

// ✅ CHIA CHUYẾN
export function tachChuyen(button) {
  alert("⚙️ Tính năng chia chuyến đang phát triển...");
}
