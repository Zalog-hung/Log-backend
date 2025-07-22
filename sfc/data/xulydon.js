// 📁 xulydon.js
import { chiaChuyenTheoQuyTac } from './chiachuyen.js';

export class XuLyDon {
  constructor() {
    this.nextRowIndex = 1;
    this.maxRows = 50;
    this.init();
  }

  init() {
    this.setupRowEvents();
    this.setupActionButtons();
    if (window.ZaLogSystem) window.ZaLogSystem.xuLyDon = this;
  }

  setupRowEvents() {
    const grid = document.getElementById('gridElement');
    if (!grid) return;

    grid.addEventListener('click', this.handleActionClick.bind(this));
    grid.addEventListener('keydown', this.handleRowKeyboard.bind(this));
  }

  setupActionButtons() {
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-action]')) {
        const action = e.target.dataset.action;
        const cell = e.target.closest('.excel-cell');
        if (cell) {
          const rowIndex = this.getRowIndex(cell);
          this.executeAction(action, rowIndex);
        }
      }
    });
  }

  handleActionClick(e) {
    if (!e.target.matches('[data-action]')) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const action = e.target.dataset.action;
    const cell = e.target.closest('.excel-cell');
    const rowIndex = this.getRowIndex(cell);
    
    this.executeAction(action, rowIndex);
  }

  handleRowKeyboard(e) {
    if (e.ctrlKey) {
      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          this.addNewRow();
          break;
        case 'Delete':
          e.preventDefault();
          const activeRow = this.getActiveRowIndex();
          if (activeRow !== null) this.deleteRow(activeRow);
          break;
      }
    }
  }

  executeAction(action, rowIndex) {
    switch (action) {
      case 'edit':
        this.editRow(rowIndex);
        break;
      case 'delete':
        this.deleteRow(rowIndex);
        break;
      case 'split':
        this.splitRow(rowIndex);
        break;
      case 'duplicate':
        this.duplicateRow(rowIndex);
        break;
    }
  }

  addNewRow() {
    if (this.getTotalRows() >= this.maxRows) {
      this.showNotification(`❌ Tối đa ${this.maxRows} dòng`, 'error');
      return;
    }

    const grid = document.getElementById('gridElement');
    if (!grid) return;

    const rowIndex = this.nextRowIndex++;
    const columnConfigs = [
      { type: 'id', format: 'dd.mm.xxx', placeholder: '01.01.001' },
      { type: 'date', format: 'dd/mm/yyyy', placeholder: 'dd/mm/yyyy' },
      { type: 'customer', autocomplete: 'customer', placeholder: 'Tên khách hàng...' },
      { type: 'quantity', format: 'number+T', placeholder: '5 hoặc 5+3T' },
      { type: 'shift', options: 'ngày,đêm', placeholder: 'ngày/đêm' },
      { type: 'employee', autocomplete: 'employee', placeholder: 'Tên tài xế...' }
    ];

    columnConfigs.forEach((config, colIndex) => {
      const cell = document.createElement('div');
      cell.className = 'excel-cell';
      cell.dataset.cell = `${rowIndex}-${colIndex}`;

      const input = document.createElement('input');
      input.type = 'text';
      input.dataset.col = colIndex;
      input.dataset.type = config.type;
      input.placeholder = config.placeholder;
      
      if (config.autocomplete) {
        input.dataset.autocomplete = config.autocomplete;
        input.dataset.source = `column-${config.autocomplete}`;
      }
      if (config.format) input.dataset.format = config.format;
      if (config.options) input.dataset.options = config.options;

      cell.appendChild(input);
      grid.appendChild(cell);
    });

    const actionCell = document.createElement('div');
    actionCell.className = 'excel-cell action-cell';
    actionCell.dataset.cell = `${rowIndex}-actions`;
    actionCell.innerHTML = `
      <button class="action-btn edit-btn" data-action="edit" title="Sửa">✏️</button>
      <button class="action-btn delete-btn" data-action="delete" title="Xóa">🗑️</button>
      <button class="action-btn split-btn" data-action="split" title="Chia chuyến">⚙️</button>
    `;
    grid.appendChild(actionCell);

    this.updateFormStatus();
    this.showNotification(`✅ Đã thêm dòng ${rowIndex}`);

    const firstInput = grid.querySelector(`[data-cell="${rowIndex}-0"] input`);
    if (firstInput) firstInput.focus();
  }

  deleteRow(rowIndex) {
    if (!confirm(`Xóa dòng ${rowIndex}?`)) return;

    const cells = document.querySelectorAll(`[data-cell^="${rowIndex}-"]`);
    cells.forEach(cell => cell.remove());

    this.updateFormStatus();
    this.showNotification(`✅ Đã xóa dòng ${rowIndex}`);
  }

  editRow(rowIndex) {
    const firstInput = document.querySelector(`[data-cell="${rowIndex}-0"] input`);
    if (firstInput) {
      firstInput.focus();
      firstInput.select();
      this.showNotification(`📝 Chỉnh sửa dòng ${rowIndex}`);
    }
  }

  duplicateRow(rowIndex) {
    const rowData = this.getRowData(rowIndex);
    if (!rowData) return;

    this.addNewRow();
    const newRowIndex = this.nextRowIndex - 1;

    Object.entries(rowData).forEach(([colType, value]) => {
      if (colType !== 'id') {
        const input = document.querySelector(`[data-cell="${newRowIndex}-${this.getColIndexByType(colType)}"] input`);
        if (input) input.value = value;
      }
    });

    this.showNotification(`✅ Đã sao chép dòng ${rowIndex}`);
  }

  splitRow(rowIndex) {
    const rowData = this.getRowData(rowIndex);
    if (!rowData) {
      this.showNotification('❌ Không có dữ liệu để chia', 'error');
      return;
    }

    if (!rowData.customer || !rowData.quantity) {
      this.showNotification('❌ Cần có khách hàng và số lượng', 'error');
      return;
    }

    try {
      const results = chiaChuyenTheoQuyTac({
        khachHang: rowData.customer,
        khoiLuong: rowData.quantity,
        ngay: rowData.date || this.getCurrentDate(),
        ca: rowData.shift || 'ngày',
        nextTripId: this.generateTripId.bind(this),
        duCache: {},
        maxPerTrip: 10
      });

      if (results.length === 0) {
        this.showNotification('❌ Không thể chia chuyến', 'error');
        return;
      }

      this.deleteRow(rowIndex);

      results.forEach((trip, index) => {
        this.addNewRow();
        const newRowIndex = this.nextRowIndex - 1;
        this.populateRowWithTrip(newRowIndex, trip, rowData);
      });

      this.showNotification(`✅ Đã chia thành ${results.length} chuyến`);

    } catch (error) {
      this.showNotification('❌ Lỗi chia chuyến: ' + error.message, 'error');
    }
  }

  populateRowWithTrip(rowIndex, tripData, originalData) {
    const mapping = {
      'id': tripData.tripId,
      'date': tripData.ngay,
      'customer': tripData.kh,
      'quantity': String(tripData.sl),
      'shift': tripData.ca,
      'employee': originalData.employee || ''
    };

    Object.entries(mapping).forEach(([type, value]) => {
      const colIndex = this.getColIndexByType(type);
      if (colIndex !== -1) {
        const input = document.querySelector(`[data-cell="${rowIndex}-${colIndex}"] input`);
        if (input && value) input.value = value;
      }
    });
  }

  getRowData(rowIndex) {
    const rowData = {};
    const inputs = document.querySelectorAll(`[data-cell^="${rowIndex}-"] input`);
    
    inputs.forEach(input => {
      const type = input.dataset.type;
      if (type && type !== 'actions') {
        rowData[type] = input.value.trim();
      }
    });

    return Object.keys(rowData).length > 0 ? rowData : null;
  }

  getRowIndex(cell) {
    const cellData = cell.dataset.cell;
    if (!cellData) return null;
    return parseInt(cellData.split('-')[0]);
  }

  getActiveRowIndex() {
    const activeCell = document.querySelector('.active-cell');
    return activeCell ? this.getRowIndex(activeCell) : null;
  }

  getColIndexByType(type) {
    const typeMap = {
      'id': 0, 'date': 1, 'customer': 2,
      'quantity': 3, 'shift': 4, 'employee': 5
    };
    return typeMap[type] ?? -1;
  }

  getTotalRows() {
    const rows = new Set();
    document.querySelectorAll('[data-cell]').forEach(cell => {
      const cellData = cell.dataset.cell;
      if (cellData && !cellData.includes('header')) {
        rows.add(cellData.split('-')[0]);
      }
    });
    return rows.size;
  }

  getFilledRows() {
    const filledRows = new Set();
    document.querySelectorAll('[data-cell] input').forEach(input => {
      if (input.value.trim()) {
        const cell = input.closest('[data-cell]');
        if (cell) {
          const rowIndex = cell.dataset.cell.split('-')[0];
          filledRows.add(rowIndex);
        }
      }
    });
    return filledRows.size;
  }

  updateFormStatus() {
    const totalRows = this.getTotalRows();
    const filledRows = this.getFilledRows();
    
    const elements = {
      totalRows: document.getElementById('totalRows'),
      filledRows: document.getElementById('filledRows'),
      formStatus: document.getElementById('formStatus')
    };

    if (elements.totalRows) elements.totalRows.textContent = totalRows;
    if (elements.filledRows) elements.filledRows.textContent = filledRows;
    if (elements.formStatus) {
      elements.formStatus.textContent = filledRows > 0 ? 'Có dữ liệu' : 'Sẵn sàng';
    }
  }

  clearAllRows() {
    if (!confirm('Xóa tất cả dữ liệu?')) return;

    const dataCells = document.querySelectorAll('[data-cell]:not([data-col^="header"])');
    dataCells.forEach(cell => {
      if (!cell.classList.contains('header-cell')) {
        cell.remove();
      }
    });

    this.nextRowIndex = 1;
    this.updateFormStatus();
    this.showNotification('✅ Đã xóa tất cả dữ liệu');
  }

  selectRow(rowIndex) {
    document.querySelectorAll('.row-selected').forEach(cell => {
      cell.classList.remove('row-selected');
    });

    const rowCells = document.querySelectorAll(`[data-cell^="${rowIndex}-"]`);
    rowCells.forEach(cell => cell.classList.add('row-selected'));
  }

  moveRowUp(rowIndex) {
    if (rowIndex <= 1) return;
    this.swapRows(rowIndex, rowIndex - 1);
  }

  moveRowDown(rowIndex) {
    const maxRow = this.getTotalRows();
    if (rowIndex >= maxRow) return;
    this.swapRows(rowIndex, rowIndex + 1);
  }

  swapRows(row1, row2) {
    const data1 = this.getRowData(row1);
    const data2 = this.getRowData(row2);

    if (!data1 || !data2) return;

    this.setRowData(row1, data2);
    this.setRowData(row2, data1);

    this.showNotification(`✅ Đã hoán đổi dòng ${row1} và ${row2}`);
  }

  setRowData(rowIndex, data) {
    Object.entries(data).forEach(([type, value]) => {
      const colIndex = this.getColIndexByType(type);
      if (colIndex !== -1) {
        const input = document.querySelector(`[data-cell="${rowIndex}-${colIndex}"] input`);
        if (input) input.value = value;
      }
    });
  }

  generateTripId() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    const existingIds = this.getAllTripIds();
    const todayPrefix = `${day}.${month}.`;
    const todayIds = existingIds.filter(id => id.startsWith(todayPrefix));
    
    let maxCounter = 0;
    todayIds.forEach(id => {
      const parts = id.split('.');
      if (parts.length === 3) {
        const counter = parseInt(parts[2]);
        if (counter > maxCounter) maxCounter = counter;
      }
    });
    
    return `${day}.${month}.${String(maxCounter + 1).padStart(3, '0')}`;
  }

  getAllTripIds() {
    const ids = [];
    document.querySelectorAll('input[data-type="id"]').forEach(input => {
      if (input.value) ids.push(input.value);
    });
    return ids;
  }

  getCurrentDate() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
  }

  exportRows() {
    const rows = [];
    const totalRows = this.getTotalRows();
    
    for (let i = 1; i <= totalRows; i++) {
      const rowData = this.getRowData(i);
      if (rowData && Object.values(rowData).some(v => v)) {
        rows.push(rowData);
      }
    }
    
    return rows;
  }

  importRows(data) {
    if (!Array.isArray(data)) return;
    
    this.clearAllRows();
    
    data.forEach(rowData => {
      this.addNewRow();
      const rowIndex = this.nextRowIndex - 1;
      this.setRowData(rowIndex, rowData);
    });
    
    this.showNotification(`✅ Đã nhập ${data.length} dòng`);
  }

  showNotification(message, type = 'info') {
    if (window.showNotification) {
      window.showNotification(message, type);
    }
  }
}

export const xuLyDon = new XuLyDon();

window.addNewRow = () => xuLyDon.addNewRow();
window.deleteRow = (index) => xuLyDon.deleteRow(index);
window.splitRow = (index) => xuLyDon.splitRow(index);

export default xuLyDon;
