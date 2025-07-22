// 📁 read-log.js
import { logProcessor } from '../data/column-log.js';

export class ReadLog {
  constructor() {
    this.logData = [];
    this.filteredData = [];
    this.currentFilter = null;
    this.sortColumn = null;
    this.sortDirection = 'asc';
    this.init();
  }

  init() {
    this.setupLogControls();
    this.loadLogData();
    if (window.ZaLogSystem) window.ZaLogSystem.readLog = this;
  }

  setupLogControls() {
    const refreshBtn = document.getElementById('refreshLogBtn');
    const filterBtn = document.getElementById('filterLogBtn');
    
    if (refreshBtn) refreshBtn.onclick = () => this.refreshLog();
    if (filterBtn) filterBtn.onclick = () => this.showFilterDialog();

    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    
    if (startDate && endDate) {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      startDate.value = weekAgo;
      endDate.value = today;
    }
  }

  async loadLogData() {
    try {
      this.showLogStatus('⏳ Đang tải log từ server...');
      
      const data = await logProcessor.getCachedOrLoad();
      this.logData = data || [];
      this.filteredData = [...this.logData];
      
      this.renderLogTable();
      this.updateLogStatus();
      
    } catch (error) {
      console.error('❌ Error loading log data:', error);
      this.showLogStatus('❌ Lỗi tải log: ' + error.message);
    }
  }

  async refreshLog() {
    logProcessor.clearCache();
    await this.loadLogData();
    this.showNotification('✅ Đã refresh log');
  }

  filterByDate() {
    const startDate = document.getElementById('startDate')?.value;
    const endDate = document.getElementById('endDate')?.value;
    
    if (!startDate || !endDate) {
      this.showNotification('⚠️ Vui lòng chọn khoảng ngày', 'warning');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59);

    this.filteredData = this.logData.filter(row => {
      const dateValue = row.data['Ngày'] || row.data['name2'] || '';
      const logDate = this.parseDate(dateValue);
      return logDate >= start && logDate <= end;
    });

    this.renderLogTable();
    this.showNotification(`✅ Lọc ${this.filteredData.length} dòng từ ${startDate} đến ${endDate}`);
  }

  parseDate(dateString) {
    if (!dateString) return new Date(0);
    
    const ddmmyyyy = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyy) {
      const [, day, month, year] = ddmmyyyy;
      return new Date(year, month - 1, day);
    }
    
    return new Date(dateString);
  }

  renderLogTable() {
    const container = document.getElementById('logTableContainer');
    if (!container) return;

    if (this.filteredData.length === 0) {
      container.innerHTML = '<div class="log-status">📭 Không có dữ liệu log</div>';
      return;
    }

    const columns = this.getLogColumns();
    const table = document.createElement('table');
    table.className = 'log-table';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    columns.forEach(col => {
      const th = document.createElement('th');
      th.textContent = col.title;
      th.style.cursor = 'pointer';
      th.onclick = () => this.sortByColumn(col.key);
      
      if (this.sortColumn === col.key) {
        th.textContent += this.sortDirection === 'asc' ? ' ↑' : ' ↓';
        th.style.background = '#e1dfdd';
      }
      
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    this.filteredData.forEach((row, index) => {
      const tr = document.createElement('tr');
      
      columns.forEach(col => {
        const td = document.createElement('td');
        const value = row.data[col.key] || '';
        td.textContent = value;
        td.title = value;
        tr.appendChild(td);
      });
      
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    container.innerHTML = '';
    container.appendChild(table);
  }

  getLogColumns() {
    return [
      { key: 'ID TRIP', title: 'ID Chuyến', width: '80px' },
      { key: 'Ngày', title: 'Ngày', width: '100px' },
      { key: 'Tên KH', title: 'Khách Hàng', width: '200px' },
      { key: 'sl', title: 'Số Lượng', width: '80px' },
      { key: 'Ca', title: 'Ca', width: '60px' },
      { key: 'Số Xe', title: 'Số Xe', width: '100px' },
      { key: 'giờ lên hàng', title: 'Giờ Lên', width: '80px' },
      { key: 'giờ giao hàng', title: 'Giờ Giao', width: '80px' },
      { key: 'Giờ về', title: 'Giờ Về', width: '80px' },
      { key: 'TÀI XẾ', title: 'Tài Xế', width: '150px' },
      { key: 'Phụ XE', title: 'Phụ Xe', width: '120px' },
      { key: 'Ghi chú', title: 'Ghi Chú', width: '200px' }
    ];
  }

  sortByColumn(columnKey) {
    if (this.sortColumn === columnKey) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = columnKey;
      this.sortDirection = 'asc';
    }

    this.filteredData.sort((a, b) => {
      const aVal = a.data[columnKey] || '';
      const bVal = b.data[columnKey] || '';

      let result = 0;
      if (columnKey === 'Ngày') {
        result = this.parseDate(aVal) - this.parseDate(bVal);
      } else if (columnKey === 'sl') {
        result = parseFloat(aVal) - parseFloat(bVal);
      } else {
        result = aVal.localeCompare(bVal);
      }

      return this.sortDirection === 'asc' ? result : -result;
    });

    this.renderLogTable();
  }

  showFilterDialog() {
    const customers = this.getUniqueValues('Tên KH');
    const drivers = this.getUniqueValues('TÀI XẾ');
    const vehicles = this.getUniqueValues('Số Xe');

    const dialog = document.createElement('div');
    dialog.className = 'filter-dialog';
    dialog.innerHTML = `
      <div class="filter-header">Lọc Log</div>
      <div class="filter-content">
        <div class="filter-section">
          <label>Khách hàng:</label>
          <select id="filterCustomer">
            <option value="">Tất cả</option>
            ${customers.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
        <div class="filter-section">
          <label>Tài xế:</label>
          <select id="filterDriver">
            <option value="">Tất cả</option>
            ${drivers.map(d => `<option value="${d}">${d}</option>`).join('')}
          </select>
        </div>
        <div class="filter-section">
          <label>Số xe:</label>
          <select id="filterVehicle">
            <option value="">Tất cả</option>
            ${vehicles.map(v => `<option value="${v}">${v}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="filter-actions">
        <button class="btn" id="applyFilter">Áp dụng</button>
        <button class="btn" id="clearFilter">Xóa lọc</button>
        <button class="btn" id="cancelFilter">Hủy</button>
      </div>
    `;

    document.body.appendChild(dialog);

    document.getElementById('applyFilter').onclick = () => {
      const customer = document.getElementById('filterCustomer').value;
      const driver = document.getElementById('filterDriver').value;
      const vehicle = document.getElementById('filterVehicle').value;
      
      this.applyFilter({ customer, driver, vehicle });
      document.body.removeChild(dialog);
    };

    document.getElementById('clearFilter').onclick = () => {
      this.clearFilter();
      document.body.removeChild(dialog);
    };

    document.getElementById('cancelFilter').onclick = () => {
      document.body.removeChild(dialog);
    };
  }

  getUniqueValues(columnKey) {
    const values = new Set();
    this.logData.forEach(row => {
      const value = row.data[columnKey];
      if (value && value.trim()) {
        values.add(value.trim());
      }
    });
    return Array.from(values).sort();
  }

  applyFilter(filters) {
    this.currentFilter = filters;
    
    this.filteredData = this.logData.filter(row => {
      if (filters.customer && row.data['Tên KH'] !== filters.customer) return false;
      if (filters.driver && row.data['TÀI XẾ'] !== filters.driver) return false;
      if (filters.vehicle && row.data['Số Xe'] !== filters.vehicle) return false;
      return true;
    });

    this.renderLogTable();
    
    const activeFilters = Object.entries(filters).filter(([k, v]) => v).length;
    this.showNotification(`✅ Áp dụng ${activeFilters} bộ lọc - ${this.filteredData.length} kết quả`);
  }

  clearFilter() {
    this.currentFilter = null;
    this.filteredData = [...this.logData];
    this.renderLogTable();
    this.showNotification('✅ Đã xóa bộ lọc');
  }

  showLogStatus(message) {
    const logReady = document.getElementById('logReady');
    const logLoading = document.getElementById('logLoading');
    const logFound = document.getElementById('logFound');

    if (logReady) logReady.style.display = 'none';
    if (logLoading) logLoading.style.display = 'none';
    if (logFound) logFound.style.display = 'none';

    if (message.includes('⏳')) {
      if (logLoading) {
        logLoading.textContent = message;
        logLoading.style.display = 'block';
      }
    } else if (message.includes('❌')) {
      if (logReady) {
        logReady.textContent = message;
        logReady.style.display = 'block';
      }
    }
  }

  updateLogStatus() {
    const logReady = document.getElementById('logReady');
    const logLoading = document.getElementById('logLoading');
    const logFound = document.getElementById('logFound');
    const logCount = document.getElementById('logCount');

    if (logReady) logReady.style.display = 'none';
    if (logLoading) logLoading.style.display = 'none';
    
    if (logFound && logCount) {
      logCount.textContent = this.filteredData.length;
      logFound.style.display = 'block';
    }
  }

  searchLog(searchTerm) {
    if (!searchTerm) {
      this.filteredData = [...this.logData];
    } else {
      const term = searchTerm.toLowerCase();
      this.filteredData = this.logData.filter(row => {
        return Object.values(row.data).some(value => 
          String(value).toLowerCase().includes(term)
        );
      });
    }
    
    this.renderLogTable();
    this.showNotification(`🔍 Tìm thấy ${this.filteredData.length} kết quả`);
  }

  exportLog() {
    if (this.filteredData.length === 0) {
      this.showNotification('❌ Không có dữ liệu để xuất', 'error');
      return;
    }

    const columns = this.getLogColumns();
    const csv = [
      columns.map(col => col.title).join(','),
      ...this.filteredData.map(row => 
        columns.map(col => `"${row.data[col.key] || ''}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `log_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    this.showNotification('✅ Đã xuất file CSV');
  }

  getLogSummary() {
    if (this.filteredData.length === 0) return null;

    const summary = {
      totalTrips: this.filteredData.length,
      customers: new Set(),
      drivers: new Set(),
      vehicles: new Set(),
      totalQuantity: 0
    };

    this.filteredData.forEach(row => {
      const customer = row.data['Tên KH'];
      const driver = row.data['TÀI XẾ'];
      const vehicle = row.data['Số Xe'];
      const quantity = parseFloat(row.data['sl']) || 0;

      if (customer) summary.customers.add(customer);
      if (driver) summary.drivers.add(driver);
      if (vehicle) summary.vehicles.add(vehicle);
      summary.totalQuantity += quantity;
    });

    return {
      totalTrips: summary.totalTrips,
      uniqueCustomers: summary.customers.size,
      uniqueDrivers: summary.drivers.size,
      uniqueVehicles: summary.vehicles.size,
      totalQuantity: summary.totalQuantity.toFixed(1)
    };
  }

  showNotification(message, type = 'info') {
    if (window.showNotification) {
      window.showNotification(message, type);
    }
  }
}

export const readLog = new ReadLog();

window.refreshLog = () => readLog.refreshLog();
window.filterLog = () => readLog.showFilterDialog();
window.filterByDate = () => readLog.filterByDate();
window.ShowLog = () => readLog.loadLogData();

export default readLog;
