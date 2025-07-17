import { formConfig } from './cauhinh.js';
import { index0, index1, index2, index3, index4, index5 } from './xulycot.js';

const gridElement = document.getElementById('gridElement');

export function themDongMoi() {
  const cells = Array.from(gridElement.querySelectorAll('.excel-cell'));
  const lastRow = cells.slice(-formConfig.TOTAL_COLUMN_COUNT); // lấy dòng cuối
  const newInputs = [];

  for (let i = 0; i < formConfig.FORM_COLUMN_COUNT; i++) {
    const lastInput = lastRow[i]?.querySelector('input');
    const input = lastInput ? lastInput.cloneNode(true) : document.createElement('input');
    input.setAttribute('data-col', i);

    if (formConfig.FIELDS_TO_KEEP_VALUE.includes(i) && lastInput) {
      input.value = lastInput.value.trim();
    } else {
      input.value = '';
    }

    // Gắn xử lý cột
    if (i === 0) index0(input);
    if (i === 1) index1(input);
    if (i === 2) index2(input);
    if (i === 3) index3(input);
    if (i === 4) index4(input);
    if (i === 5) index5(input);

    const cell = document.createElement('div');
    cell.className = 'excel-cell data-cell'; // ✅ Thêm class 'data-cell'
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
}


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
