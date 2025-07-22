// 📁 write-log.js
export class WriteLog {
  constructor() {
    this.isWriting = false;
    this.writeQueue = [];
    this.retryCount = 3;
    this.retryDelay = 1000;
    this.init();
  }

  init() {
    if (window.ZaLogSystem) window.ZaLogSystem.writeLog = this;
  }

  async saveFormData() {
    if (this.isWriting) {
      this.showNotification('⏳ Đang lưu dữ liệu...', 'info');
      return;
    }

    try {
      this.isWriting = true;
      this.showNotification('💾 Đang xử lý dữ liệu...', 'info');

      const formData = this.getFormData();
      if (formData.length === 0) {
        this.showNotification('❌ Không có dữ liệu để lưu', 'error');
        return;
      }

      const logEntries = this.prepareLogEntries(formData);
      await this.writeToLog(logEntries);

      this.clearForm();
      this.showNotification(`✅ Đã lưu ${logEntries.length} chuyến`, 'success');

    } catch (error) {
      console.error('❌ Save error:', error);
      this.showNotification('❌ Lỗi lưu dữ liệu: ' + error.message, 'error');
    } finally {
      this.isWriting = false;
    }
  }

  getFormData() {
    const formData = [];
    const processedRows = new Set();
    
    document.querySelectorAll('.excel-cell input').forEach(input => {
      const cell = input.closest('.excel-cell');
      const cellData = cell?.dataset.cell;
      if (!cellData) return;

      const [row] = cellData.split('-');
      if (processedRows.has(row)) return;

      const rowData = this.extractRowData(row);
      if (this.isValidRowData(rowData)) {
        formData.push({ row: parseInt(row), ...rowData });
        processedRows.add(row);
      }
    });

    return formData;
  }

  extractRowData(rowIndex) {
    const rowData = {};
    const inputs = document.querySelectorAll(`[data-cell^="${rowIndex}-"] input`);
    
    inputs.forEach(input => {
      const type = input.dataset.type;
      if (type && type !== 'actions') {
        rowData[type] = input.value.trim();
      }
    });

    return rowData;
  }

  isValidRowData(rowData) {
    return rowData.customer && rowData.quantity;
  }

  prepareLogEntries(formData) {
    const entries = [];
    const currentTime = new Date().toISOString();

    formData.forEach(row => {
      const logEntry = {
        'ID TRIP': row.id || this.generateTripId(),
        'Ngày': row.date || this.getCurrentDate(),
        'Tên KH': row.customer || '',
        'sl': row.quantity || '',
        'Ca': row.shift || 'ngày',
        'Số Xe': this.getAssignedVehicle(row),
        'giờ lên hàng': '',
        'giờ giao hàng': '',
        'Giờ về': '',
        'Ghi chú': '',
        'TÀI XẾ': row.employee || '',
        'Phụ XE': '',
        'Phụ XE_2': '',
        '_timestamp': currentTime,
        '_source': 'form'
      };

      entries.push(logEntry);
    });

    return entries;
  }

  async writeToLog(entries) {
    const payload = {
      action: 'write',
      sheetName: 'Log',
      data: entries
    };

    let lastError = null;
    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        const response = await fetch('/api/proxy/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Write operation failed');
        }

        console.log(`✅ Write success: ${entries.length} entries`);
        return result;

      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Write attempt ${attempt}/${this.retryCount} failed:`, error.message);
        
        if (attempt < this.retryCount) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    throw lastError;
  }

  async writeBatchData(batchEntries) {
    const batchSize = 10;
    const batches = [];
    
    for (let i = 0; i < batchEntries.length; i += batchSize) {
      batches.push(batchEntries.slice(i, i + batchSize));
    }

    const results = [];
    for (let i = 0; i < batches.length; i++) {
      try {
        this.showNotification(`💾 Đang lưu batch ${i + 1}/${batches.length}...`, 'info');
        const result = await this.writeToLog(batches[i]);
        results.push(result);
        
        if (i < batches.length - 1) {
          await this.delay(500);
        }
      } catch (error) {
        console.error(`❌ Batch ${i + 1} failed:`, error);
        throw new Error(`Lỗi tại batch ${i + 1}: ${error.message}`);
      }
    }

    return results;
  }

  generateTripId() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    const existingIds = this.getExistingTripIds();
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

  getExistingTripIds() {
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

  getAssignedVehicle(rowData) {
    return '';
  }

  clearForm() {
    const inputs = document.querySelectorAll('.excel-cell input');
    inputs.forEach(input => {
      if (input.dataset.type !== 'date') {
        input.value = '';
      }
    });

    this.updateFormStatus();
  }

  updateFormStatus() {
    if (window.ZaLogSystem?.inputHandler?.updateFormStatus) {
      window.ZaLogSystem.inputHandler.updateFormStatus();
    }
  }

  async saveSpecificRows(rowIndices) {
    if (!Array.isArray(rowIndices) || rowIndices.length === 0) return;

    try {
      this.isWriting = true;
      const entries = [];

      rowIndices.forEach(rowIndex => {
        const rowData = this.extractRowData(rowIndex);
        if (this.isValidRowData(rowData)) {
          const logEntry = this.prepareLogEntries([{ row: rowIndex, ...rowData }])[0];
          entries.push(logEntry);
        }
      });

      if (entries.length === 0) {
        this.showNotification('❌ Không có dữ liệu hợp lệ', 'error');
        return;
      }

      await this.writeToLog(entries);
      this.showNotification(`✅ Đã lưu ${entries.length} dòng`, 'success');

    } catch (error) {
      this.showNotification('❌ Lỗi lưu dữ liệu: ' + error.message, 'error');
    } finally {
      this.isWriting = false;
    }
  }

  async appendToLog(additionalData) {
    if (!additionalData || additionalData.length === 0) return;

    try {
      const entries = additionalData.map(data => ({
        'ID TRIP': data.tripId || this.generateTripId(),
        'Ngày': data.ngay || this.getCurrentDate(),
        'Tên KH': data.kh || '',
        'sl': String(data.sl || ''),
        'Ca': data.ca || 'ngày',
        'Số Xe': '',
        'giờ lên hàng': '',
        'giờ giao hàng': '',
        'Giờ về': '',
        'Ghi chú': data.note || '',
        'TÀI XẾ': data.taiXe || '',
        'Phụ XE': '',
        'Phụ XE_2': '',
        '_timestamp': new Date().toISOString(),
        '_source': 'split'
      }));

      await this.writeToLog(entries);
      return entries.length;

    } catch (error) {
      throw new Error('Append failed: ' + error.message);
    }
  }

  async backupData() {
    try {
      const formData = this.getFormData();
      if (formData.length === 0) {
        this.showNotification('❌ Không có dữ liệu để backup', 'error');
        return;
      }

      const backup = {
        timestamp: new Date().toISOString(),
        data: formData,
        version: '1.0'
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { 
        type: 'application/json' 
      });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();

      this.showNotification('✅ Đã tạo backup', 'success');

    } catch (error) {
      this.showNotification('❌ Lỗi tạo backup: ' + error.message, 'error');
    }
  }

  async restoreData(file) {
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      
      if (!backup.data || !Array.isArray(backup.data)) {
        throw new Error('Invalid backup format');
      }

      this.clearForm();
      
      backup.data.forEach((rowData, index) => {
        if (window.ZaLogSystem?.xuLyDon) {
          window.ZaLogSystem.xuLyDon.addNewRow();
          const rowIndex = index + 1;
          this.populateRow(rowIndex, rowData);
        }
      });

      this.showNotification(`✅ Đã khôi phục ${backup.data.length} dòng`, 'success');

    } catch (error) {
      this.showNotification('❌ Lỗi khôi phục: ' + error.message, 'error');
    }
  }

  populateRow(rowIndex, rowData) {
    const typeMap = {
      'id': 0, 'date': 1, 'customer': 2,
      'quantity': 3, 'shift': 4, 'employee': 5
    };

    Object.entries(rowData).forEach(([type, value]) => {
      if (typeMap.hasOwnProperty(type)) {
        const colIndex = typeMap[type];
        const input = document.querySelector(`[data-cell="${rowIndex}-${colIndex}"] input`);
        if (input && value) input.value = value;
      }
    });
  }

  getWriteStatus() {
    return {
      isWriting: this.isWriting,
      queueLength: this.writeQueue.length,
      lastWrite: this.lastWriteTime || null
    };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  showNotification(message, type = 'info') {
    if (window.showNotification) {
      window.showNotification(message, type);
    }
  }
}

export const writeLog = new WriteLog();

window.saveLog = () => writeLog.saveFormData();
window.backupData = () => writeLog.backupData();

export default writeLog;
