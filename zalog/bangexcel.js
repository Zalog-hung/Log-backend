// ✅ Gọi xulycot.js
import { formConfig } from './cauhinh.js';

const gridElement = document.getElementById('gridElement');
// ✅ THÊM DÒNG
export function themDongMoi() {
  const totalCells = gridElement.querySelectorAll('.excel-cell').length;

  // 🛡️ Check tổng số ô hiện tại có chia hết cho số cột không
  if (totalCells % formConfig.TOTAL_COLUMN_COUNT !== 0) {
    console.warn('⚠️ Dữ liệu bảng bị lệch! Dòng hiện tại không đủ 7 ô.');
    return;
  }

  const newInputs = [];

  for (let i = 0; i < formConfig.FORM_COLUMN_COUNT; i++) {
    const input = document.createElement('input');
    input.type = 'text';
    input.setAttribute('data-col', i);
    input.value = '';

    // Giữ lại giá trị nếu nằm trong danh sách cần giữ
    if (formConfig.FIELDS_TO_KEEP_VALUE.includes(i)) {
      const lastRowCells = Array.from(gridElement.querySelectorAll('.excel-cell'));
      const lastRowInput = lastRowCells[lastRowCells.length - formConfig.TOTAL_COLUMN_COUNT + i]?.querySelector('input');
      if (lastRowInput) input.value = lastRowInput.value.trim();
    }

    // Gắn xử lý theo cột
    if (i === 0) index0(input);
    if (i === 1) index1(input);
    if (i === 2) index2(input);
    if (i === 3) index3(input);
    if (i === 4) index4(input);
    if (i === 5) index5(input);

    const cell = document.createElement('div');
    cell.className = 'excel-cell data-cell';
    cell.appendChild(input);
    gridElement.appendChild(cell);
    newInputs.push(input);
  }

  // 🟨 Cột 6: Hành động
  const actionCell = document.createElement('div');
  actionCell.className = 'excel-cell action-cell';
  actionCell.innerHTML = `
    <button onclick="editRow(this)">✏️</button>
    <button onclick="deleteRow(this)">🗑️</button>
    <button onclick="splitRow(this)">⚙️</button>
  `;
  gridElement.appendChild(actionCell);
// 🟨 KIỂM TRA
  const newTotalCells = gridElement.querySelectorAll('.excel-cell').length;
  if (newTotalCells % formConfig.TOTAL_COLUMN_COUNT !== 0) {
    console.error('❌ LỖI: Sau khi thêm dòng bị lệch! Tổng ô:', newTotalCells);
  }
}

// ✅ Hàm xóa dòng
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

export function tachChuyen(button) {
  alert("⚙️ Tính năng chia chuyến đang phát triển...");
}
