import { formConfig } from './cauhinh.js';
import { index0, index1 } from './xulycot.js';

const gridElement = document.querySelector('.excel-grid');

export function themDongMoi() {
  const allCells = Array.from(gridElement.querySelectorAll('.excel-cell'));
  const lastRowCells = allCells.slice(-formConfig.TOTAL_COLUMN_COUNT);
  const newInputs = [];

  for (let i = 0; i < formConfig.FORM_COLUMN_COUNT; i++) {
    const lastInput = lastRowCells[i]?.querySelector('input, select');
    const newInput = lastInput ? lastInput.cloneNode(true) : document.createElement('input');
    newInput.setAttribute('data-col', i);

    switch (i) {
      case 0: index0(newInput); break;
      case 1: index1(newInput); break;
    }

    if (formConfig.FIELDS_TO_KEEP_VALUE.includes(i) && lastInput) {
      newInput.value = lastInput.value.trim();
    } else {
      newInput.value = '';
    }

    const newCell = document.createElement('div');
    newCell.className = 'excel-cell data-cell';
    newCell.appendChild(newInput);
    gridElement.appendChild(newCell);
    newInputs.push(newInput);
  }

  const lastActionCell = lastRowCells[formConfig.FORM_COLUMN_COUNT];
  const newActionCell = document.createElement('div');
  newActionCell.className = 'excel-cell action-cell';

  if (lastActionCell) {
    lastActionCell.childNodes.forEach(child => {
      const newBtn = child.cloneNode(true);
      newBtn.addEventListener('click', () => xoaDong(newBtn));
      newActionCell.appendChild(newBtn);
    });
  }

  gridElement.appendChild(newActionCell);
  return newInputs;
}

export function xoaDong(button) {
  const actionCell = button.closest('.excel-cell');
  const rowStartIndex = Array.from(gridElement.children).indexOf(actionCell) - formConfig.FORM_COLUMN_COUNT;

  if (rowStartIndex >= 0) {
    for (let i = formConfig.TOTAL_COLUMN_COUNT - 1; i >= 0; i--) {
      gridElement.children[rowStartIndex + i].remove();
    }
  }
}
