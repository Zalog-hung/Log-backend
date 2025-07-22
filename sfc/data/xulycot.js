// 📁 xulycot.js
export class XuLyCot {
  constructor() {
    this.activeColumn = null;
    this.columnWidths = new Map();
    this.isResizing = false;
    this.init();
  }

  init() {
    this.setupColumnEvents();
    this.setupResizeHandlers();
    this.setupSelectionHandlers();
    if (window.ZaLogSystem) window.ZaLogSystem.xuLyCot = this;
  }

  setupColumnEvents() {
    const grid = document.getElementById('gridElement');
    if (!grid) return;

    grid.addEventListener('click', this.handleColumnClick.bind(this));
    grid.addEventListener('dblclick', this.handleColumnDoubleClick.bind(this));
    grid.addEventListener('contextmenu', this.handleColumnContext.bind(this));
    grid.addEventListener('mousedown', this.handleColumnMouseDown.bind(this));
    grid.addEventListener('mousemove', this.handleColumnMouseMove.bind(this));
    grid.addEventListener('mouseup', this.handleColumnMouseUp.bind(this));
  }

  setupResizeHandlers() {
    document.addEventListener('mousemove', this.handleGlobalMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleGlobalMouseUp.bind(this));
    document.addEventListener('selectstart', e => this.isResizing && e.preventDefault());
  }

  setupSelectionHandlers() {
    document.addEventListener('keydown', this.handleColumnKeyboard.bind(this));
  }

  handleColumnClick(e) {
    const cell = e.target.closest('.excel-cell');
    if (!cell) return;

    const colIndex = this.getColumnIndex(cell);
    if (colIndex !== null) {
      if (e.ctrlKey) {
        this.selectColumn(colIndex, true);
      } else {
        this.selectColumn(colIndex);
      }
    }
  }

  handleColumnDoubleClick(e) {
    const cell = e.target.closest('.excel-cell');
    if (!cell || !cell.classList.contains('header-cell')) return;
    
    const colIndex = this.getColumnIndex(cell);
    if (colIndex !== null) {
      this.autoSizeColumn(colIndex);
    }
  }

  handleColumnContext(e) {
    e.preventDefault();
    const cell = e.target.closest('.excel-cell');
    if (!cell) return;

    const colIndex = this.getColumnIndex(cell);
    if (colIndex !== null) {
      this.showColumnMenu(e.clientX, e.clientY, colIndex);
    }
  }

  handleColumnMouseDown(e) {
    const cell = e.target.closest('.excel-cell');
    if (!cell || !cell.classList.contains('header-cell')) return;

    const rect = cell.getBoundingClientRect();
    if (Math.abs(e.clientX - rect.right) <= 5) {
      this.isResizing = true;
      this.resizeColumn = this.getColumnIndex(cell);
      this.startX = e.clientX;
      this.startWidth = rect.width;
      document.body.style.cursor = 'col-resize';
      e.preventDefault();
    }
  }

  handleColumnMouseMove(e) {
    const cell = e.target.closest('.excel-cell');
    if (!cell || !cell.classList.contains('header-cell')) return;

    const rect = cell.getBoundingClientRect();
    if (Math.abs(e.clientX - rect.right) <= 5) {
      document.body.style.cursor = 'col-resize';
    } else {
      document.body.style.cursor = 'default';
    }
  }

  handleColumnMouseUp(e) {
    if (this.isResizing) {
      this.isResizing = false;
      document.body.style.cursor = 'default';
    }
  }

  handleGlobalMouseMove(e) {
    if (!this.isResizing) return;

    const deltaX = e.clientX - this.startX;
    const newWidth = Math.max(50, this.startWidth + deltaX);
    this.setColumnWidth(this.resizeColumn, newWidth);
  }

  handleGlobalMouseUp(e) {
    if (this.isResizing) {
      this.isResizing = false;
      document.body.style.cursor = 'default';
    }
  }

  handleColumnKeyboard(e) {
    if (!this.activeColumn) return;

    switch (e.key) {
      case 'ArrowLeft':
        if (e.ctrlKey) {
          e.preventDefault();
          this.selectColumn(Math.max(0, this.activeColumn - 1));
        }
        break;
      case 'ArrowRight':
        if (e.ctrlKey) {
          e.preventDefault();
          this.selectColumn(Math.min(6, this.activeColumn + 1));
        }
        break;
      case 'Home':
        if (e.ctrlKey) {
          e.preventDefault();
          this.selectColumn(0);
        }
        break;
      case 'End':
        if (e.ctrlKey) {
          e.preventDefault();
          this.selectColumn(6);
        }
        break;
    }
  }

  getColumnIndex(cell) {
    const cellData = cell.dataset.cell;
    if (!cellData) return null;

    if (cellData.startsWith('header-')) {
      return parseInt(cellData.replace('header-', ''));
    }

    const parts = cellData.split('-');
    return parts.length === 2 ? parseInt(parts[1]) : null;
  }

  selectColumn(colIndex, addToSelection = false) {
    if (!addToSelection) {
      this.clearColumnSelection();
    }

    this.activeColumn = colIndex;
    const cells = document.querySelectorAll(`[data-cell$="-${colIndex}"], [data-col="header-${colIndex}"]`);
    
    cells.forEach(cell => {
      cell.classList.add('column-selected');
    });

    this.highlightColumnHeader(colIndex);
  }

  clearColumnSelection() {
    document.querySelectorAll('.column-selected').forEach(cell => {
      cell.classList.remove('column-selected');
    });
    document.querySelectorAll('.column-header-selected').forEach(header => {
      header.classList.remove('column-header-selected');
    });
  }

  highlightColumnHeader(colIndex) {
    const header = document.querySelector(`[data-col="header-${colIndex}"]`);
    if (header) {
      header.classList.add('column-header-selected');
    }
  }

  setColumnWidth(colIndex, width) {
    this.columnWidths.set(colIndex, width);
    const grid = document.getElementById('gridElement');
    if (!grid) return;

    const gridColumns = grid.style.gridTemplateColumns.split(' ');
    if (gridColumns[colIndex]) {
      gridColumns[colIndex] = `${width}px`;
      grid.style.gridTemplateColumns = gridColumns.join(' ');
    }
  }

  autoSizeColumn(colIndex) {
    const cells = document.querySelectorAll(`[data-cell$="-${colIndex}"] input`);
    let maxWidth = 80;

    cells.forEach(input => {
      if (input.value) {
        const textWidth = this.getTextWidth(input.value, input);
        maxWidth = Math.max(maxWidth, textWidth + 20);
      }
    });

    this.setColumnWidth(colIndex, Math.min(maxWidth, 300));
  }

  getTextWidth(text, element) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const style = window.getComputedStyle(element);
    context.font = `${style.fontSize} ${style.fontFamily}`;
    return context.measureText(text).width;
  }

  showColumnMenu(x, y, colIndex) {
    this.hideColumnMenu();

    const menu = document.createElement('div');
    menu.className = 'column-context-menu';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.innerHTML = `
      <div class="menu-item" data-action="sort-asc">Sắp xếp A→Z</div>
      <div class="menu-item" data-action="sort-desc">Sắp xếp Z→A</div>
      <div class="menu-separator"></div>
      <div class="menu-item" data-action="filter">Lọc dữ liệu</div>
      <div class="menu-item" data-action="clear">Xóa cột</div>
      <div class="menu-separator"></div>
      <div class="menu-item" data-action="autosize">Tự động rộng</div>
    `;

    menu.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action) {
        this.executeColumnAction(action, colIndex);
        this.hideColumnMenu();
      }
    });

    document.body.appendChild(menu);
    this.currentMenu = menu;

    setTimeout(() => {
      document.addEventListener('click', this.hideColumnMenu.bind(this), { once: true });
    }, 0);
  }

  hideColumnMenu() {
    if (this.currentMenu) {
      document.body.removeChild(this.currentMenu);
      this.currentMenu = null;
    }
  }

  executeColumnAction(action, colIndex) {
    switch (action) {
      case 'sort-asc':
        this.sortColumn(colIndex, true);
        break;
      case 'sort-desc':
        this.sortColumn(colIndex, false);
        break;
      case 'filter':
        this.filterColumn(colIndex);
        break;
      case 'clear':
        this.clearColumn(colIndex);
        break;
      case 'autosize':
        this.autoSizeColumn(colIndex);
        break;
    }
  }

  sortColumn(colIndex, ascending = true) {
    const rows = this.getDataRows();
    const columnType = this.getColumnType(colIndex);
    
    rows.sort((a, b) => {
      const aVal = this.getCellValue(a, colIndex);
      const bVal = this.getCellValue(b, colIndex);
      
      let result = 0;
      if (columnType === 'number') {
        result = parseFloat(aVal || 0) - parseFloat(bVal || 0);
      } else if (columnType === 'date') {
        result = new Date(aVal || 0) - new Date(bVal || 0);
      } else {
        result = (aVal || '').localeCompare(bVal || '');
      }
      
      return ascending ? result : -result;
    });

    this.reorderRows(rows);
    this.showNotification(`✅ Đã sắp xếp cột ${this.getColumnName(colIndex)}`);
  }

  filterColumn(colIndex) {
    const uniqueValues = this.getUniqueColumnValues(colIndex);
    this.showFilterDialog(colIndex, uniqueValues);
  }

  clearColumn(colIndex) {
    const inputs = document.querySelectorAll(`[data-cell$="-${colIndex}"] input`);
    inputs.forEach(input => {
      input.value = '';
    });
    this.showNotification(`✅ Đã xóa cột ${this.getColumnName(colIndex)}`);
  }

  getDataRows() {
    const rows = [];
    const inputs = document.querySelectorAll('.excel-cell input');
    const rowMap = new Map();

    inputs.forEach(input => {
      const cell = input.closest('.excel-cell');
      const cellData = cell.dataset.cell;
      if (!cellData) return;

      const [row, col] = cellData.split('-').map(Number);
      if (!rowMap.has(row)) {
        rowMap.set(row, { row, cells: [] });
      }
      rowMap.get(row).cells[col] = input;
    });

    return Array.from(rowMap.values()).sort((a, b) => a.row - b.row);
  }

  getCellValue(rowData, colIndex) {
    const cell = rowData.cells[colIndex];
    return cell ? cell.value : '';
  }

  getColumnType(colIndex) {
    const types = ['id', 'date', 'customer', 'quantity', 'shift', 'employee', 'actions'];
    const typeMap = {
      0: 'text', 1: 'date', 2: 'text', 
      3: 'number', 4: 'text', 5: 'text', 6: 'actions'
    };
    return typeMap[colIndex] || 'text';
  }

  getColumnName(colIndex) {
    const names = ['ID Chuyến', 'Ngày', 'Khách Hàng', 'Số Lượng', 'Ca', 'Tài Xế', 'Hành Động'];
    return names[colIndex] || `Cột ${colIndex}`;
  }

  getUniqueColumnValues(colIndex) {
    const values = new Set();
    const inputs = document.querySelectorAll(`[data-cell$="-${colIndex}"] input`);
    inputs.forEach(input => {
      if (input.value.trim()) {
        values.add(input.value.trim());
      }
    });
    return Array.from(values).sort();
  }

  reorderRows(sortedRows) {
    const grid = document.getElementById('gridElement');
    if (!grid) return;

    sortedRows.forEach((rowData, index) => {
      rowData.cells.forEach((cell, colIndex) => {
        if (cell) {
          const newCell = cell.closest('.excel-cell');
          newCell.dataset.cell = `${index}-${colIndex}`;
        }
      });
    });
  }

  showFilterDialog(colIndex, values) {
    const dialog = document.createElement('div');
    dialog.className = 'filter-dialog';
    dialog.innerHTML = `
      <div class="filter-header">Lọc cột ${this.getColumnName(colIndex)}</div>
      <div class="filter-content">
        <div class="filter-search">
          <input type="text" placeholder="Tìm kiếm..." />
        </div>
        <div class="filter-values">
          ${values.map(value => `
            <label>
              <input type="checkbox" value="${value}" checked />
              ${value}
            </label>
          `).join('')}
        </div>
      </div>
      <div class="filter-actions">
        <button class="btn-apply">Áp dụng</button>
        <button class="btn-cancel">Hủy</button>
      </div>
    `;

    document.body.appendChild(dialog);
    
    dialog.querySelector('.btn-apply').onclick = () => {
      const selected = Array.from(dialog.querySelectorAll('input[type="checkbox"]:checked'))
        .map(cb => cb.value);
      this.applyColumnFilter(colIndex, selected);
      document.body.removeChild(dialog);
    };

    dialog.querySelector('.btn-cancel').onclick = () => {
      document.body.removeChild(dialog);
    };
  }

  applyColumnFilter(colIndex, allowedValues) {
    const rows = document.querySelectorAll('.excel-cell[data-cell^="0-"], .excel-cell[data-cell^="1-"], .excel-cell[data-cell^="2-"]');
    const rowGroups = new Map();

    rows.forEach(cell => {
      const cellData = cell.dataset.cell;
      const [row] = cellData.split('-');
      if (!rowGroups.has(row)) {
        rowGroups.set(row, []);
      }
      rowGroups.get(row).push(cell);
    });

    rowGroups.forEach((cells, row) => {
      const targetCell = cells.find(cell => {
        const [, col] = cell.dataset.cell.split('-');
        return parseInt(col) === colIndex;
      });

      const input = targetCell?.querySelector('input');
      const shouldShow = allowedValues.includes(input?.value || '');

      cells.forEach(cell => {
        cell.style.display = shouldShow ? 'flex' : 'none';
      });
    });

    this.showNotification(`✅ Đã lọc cột ${this.getColumnName(colIndex)}`);
  }

  showNotification(message, type = 'info') {
    if (window.showNotification) {
      window.showNotification(message, type);
    }
  }
}

export const xuLyCot = new XuLyCot();
export default xuLyCot;
