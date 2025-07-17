// 📁 bangexcel
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

    if (formConfig.FIELDS_TO_KEEP_VALUE.includes(i) && lastRow[i]) {
      input.value = lastRow[i].value;
    }

    try {
      const handler = zacache.colEvents?.[i];
      if (typeof handler === 'function') {
        handler(input);
      }
    } catch (err) {
      console.warn(`⚠️ Lỗi khi gán sự kiện cột ${i}:`, err);
    }

    ganSuKienEnter(input);

    const cell = document.createElement('div');
    cell.className = 'excel-cell data-cell';
    cell.appendChild(input);
    gridElement.appendChild(cell);
    newInputs.push(input);
  }

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

function ganSuKienEnter(input) {
  input.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;

    input.value = input.value.trim(); // ✅ ghi lại giá trị

    const col = +input.dataset.col;
    const allInputs = Array.from(document.querySelectorAll('input[data-col]'));
    const index = allInputs.indexOf(input);
    if (index === -1) return;

    if (col < 5) {
      const next = allInputs[index + 1];
      if (next) next.focus();
    } else {
      const newInputs = themDongMoi();
      if (Array.isArray(newInputs) && newInputs.length > 0) {
        newInputs[0].focus();
      }
    }
  });
}

export function xoaDong(button) {
  const gridElement = document.querySelector('.excel-grid');
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
