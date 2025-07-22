// 📁 column-log.js - Xử lý sheet log từ API LOG
// Version: 1.0 - Column mapping cho sheet "Log"

// ✅ IMPORT CONFIG
import { SHEET_NAMES, getSheetName } from './config.js';

// ✅ COLUMN DEFINITIONS - Định nghĩa trước cho dễ thay đổi
export const LOG_COLUMNS = {
  COLUMN1: { index: 0, name: 'name1', description: 'Cột 1' },
  COLUMN2: { index: 1, name: 'name2', description: 'Cột 2' },
  COLUMN3: { index: 2, name: 'Tên', description: 'Tên log entry' },
  COLUMN4: { index: 3, name: 'name4', description: 'Cột 4' },
  COLUMN5: { index: 4, name: 'name5', description: 'Cột 5' },
  COLUMN6: { index: 5, name: 'name6', description: 'Cột 6' },
  COLUMN7: { index: 6, name: 'name7', description: 'Cột 7' },
  COLUMN8: { index: 7, name: 'name8', description: 'Cột 8' },
  COLUMN9: { index: 8, name: 'name9', description: 'Cột 9' },
  COLUMN10: { index: 9, name: 'name10', description: 'Cột 10' },
  COLUMN11: { index: 10, name: 'name11', description: 'Cột 11' },
  COLUMN12: { index: 11, name: 'name12', description: 'Cột 12' },
  COLUMN13: { index: 12, name: 'name13', description: 'Cột 13' },
  COLUMN14: { index: 13, name: 'name14', description: 'Cột 14' },
  COLUMN15: { index: 14, name: 'name15', description: 'Cột 15' },
  COLUMN16: { index: 15, name: 'name16', description: 'Cột 16' },
  COLUMN17: { index: 16, name: 'name17', description: 'Cột 17' },
  COLUMN18: { index: 17, name: 'name18', description: 'Cột 18' },
  COLUMN19: { index: 18, name: 'name19', description: 'Cột 19' },
  COLUMN20: { index: 19, name: 'name20', description: 'Cột 20' }
};

// ✅ LOG DATA PROCESSOR
export class LogProcessor {
  constructor() {
    this.cache = new Map();
    this.sheetName = getSheetName('LOG', 'SHEET_NAME_1'); // 'Log'
    this.apiName = 'log';
  }

  // ✅ LẤY DỮ LIỆU TỪ PROXY
  async loadLogData() {
    try {
      console.log('📊 Loading log data from LOG API...');

      // Gọi proxy với API log
      const response = await fetch('/api/proxy/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'read',
          sheetName: this.sheetName
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to load log data');
      }

      // Process và cache data
      const processedData = this.processSheetData(result.data);
      
      this.cache.set('log_data', {
        data: processedData,
        timestamp: Date.now(),
        rowCount: processedData.length
      });

      console.log(`✅ Loaded ${processedData.length} log rows`);
      return processedData;

    } catch (error) {
      console.error('❌ Error loading log data:', error);
      return this.getFallbackData();
    }
  }

  // ✅ XỬ LÝ DỮ LIỆU SHEET
  processSheetData(rawData) {
    try {
      // Xử lý Google Sheets format
      if (rawData?.table?.rows) {
        return this.processGoogleSheetsFormat(rawData.table.rows);
      }

      // Xử lý array format
      if (Array.isArray(rawData)) {
        return this.processArrayFormat(rawData);
      }

      console.warn('⚠️ Unknown data format, returning empty array');
      return [];

    } catch (error) {
      console.error('❌ Error processing sheet data:', error);
      return [];
    }
  }

  // ✅ XỬ LÝ GOOGLE SHEETS FORMAT
  processGoogleSheetsFormat(rows) {
    const processedRows = [];

    // Skip header row (index 0)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row.c) continue;

      const processedRow = {
        rowIndex: i,
        data: {}
      };

      // Xử lý từng column theo mapping
      Object.values(LOG_COLUMNS).forEach(column => {
        const cell = row.c[column.index];
        const value = cell?.v || '';
        
        processedRow.data[column.name] = this.cleanCellValue(value);
      });

      // Chỉ add row nếu có data
      if (this.hasValidData(processedRow.data)) {
        processedRows.push(processedRow);
      }
    }

    return processedRows;
  }

  // ✅ XỬ LÝ ARRAY FORMAT
  processArrayFormat(rows) {
    const processedRows = [];

    // Skip header row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!Array.isArray(row)) continue;

      const processedRow = {
        rowIndex: i,
        data: {}
      };

      // Map array indices to column names
      Object.values(LOG_COLUMNS).forEach(column => {
        const value = row[column.index] || '';
        processedRow.data[column.name] = this.cleanCellValue(value);
      });

      if (this.hasValidData(processedRow.data)) {
        processedRows.push(processedRow);
      }
    }

    return processedRows;
  }

  // ✅ CLEAN CELL VALUE
  cleanCellValue(value) {
    if (value === null || value === undefined) {
      return '';
    }

    return String(value).trim();
  }

  // ✅ KIỂM TRA DATA HỢP LỆ
  hasValidData(rowData) {
    // Có ít nhất 1 field không rỗng
    return Object.values(rowData).some(value => value && value.length > 0);
  }

  // ✅ LẤY DỮ LIỆU THEO COLUMN
  async getColumnData(columnName) {
    try {
      const logData = await this.getCachedOrLoad();
      
      if (!logData || logData.length === 0) {
        console.warn(`⚠️ No log data available for column: ${columnName}`);
        return [];
      }

      // Extract column values
      const columnValues = logData
        .map(row => row.data[columnName])
        .filter(value => value && value.length > 0)
        .filter((value, index, array) => array.indexOf(value) === index) // Remove duplicates
        .sort(); // Sort alphabetically

      console.log(`📊 Column ${columnName}: ${columnValues.length} unique values`);
      return columnValues;

    } catch (error) {
      console.error(`❌ Error getting column ${columnName}:`, error);
      return [];
    }
  }

  // ✅ LẤY DỮ LIỆU THEO INDEX
  async getColumnByIndex(columnIndex) {
    const column = Object.values(LOG_COLUMNS).find(col => col.index === columnIndex);
    
    if (!column) {
      console.error(`❌ Column index ${columnIndex} not found`);
      return [];
    }

    return await this.getColumnData(column.name);
  }

  // ✅ TÌM KIẾM LOG ENTRIES
  async searchLogs(searchTerm, columnName = 'Tên') {
    try {
      const logData = await this.getCachedOrLoad();
      const searchLower = searchTerm.toLowerCase();

      const results = logData.filter(row => {
        const value = row.data[columnName] || '';
        return value.toLowerCase().includes(searchLower);
      });

      console.log(`🔍 Search "${searchTerm}" in ${columnName}: ${results.length} results`);
      return results;

    } catch (error) {
      console.error('❌ Error searching logs:', error);
      return [];
    }
  }

  // ✅ LẤY LOG THEO KHOẢNG THỜI GIAN
  async getLogsByDateRange(startDate, endDate, dateColumnName = 'name2') {
    try {
      const logData = await this.getCachedOrLoad();
      
      const results = logData.filter(row => {
        const dateValue = row.data[dateColumnName] || '';
        // Assume date format is dd/mm/yyyy
        const logDate = this.parseDate(dateValue);
        
        return logDate >= startDate && logDate <= endDate;
      });

      console.log(`📅 Date range search: ${results.length} results`);
      return results;

    } catch (error) {
      console.error('❌ Error filtering logs by date:', error);
      return [];
    }
  }

  // ✅ PARSE DATE FROM STRING
  parseDate(dateString) {
    try {
      // Try dd/mm/yyyy format
      const ddmmyyyy = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (ddmmyyyy) {
        const [, day, month, year] = ddmmyyyy;
        return new Date(year, month - 1, day);
      }
      
      // Fallback to standard Date parsing
      return new Date(dateString);
    } catch (error) {
      return new Date(0); // Return epoch if parsing fails
    }
  }

  // ✅ LẤY CACHE HOẶC LOAD MỚI
  async getCachedOrLoad() {
    const cached = this.cache.get('log_data');
    
    // Check cache validity (2 minutes for log data - fresher than others)
    if (cached && (Date.now() - cached.timestamp) < 120000) {
      console.log('⚡ Using cached log data');
      return cached.data;
    }

    // Load fresh data
    return await this.loadLogData();
  }

  // ✅ LẤY FALLBACK DATA
  getFallbackData() {
    console.log('📊 Using fallback log data');
    
    return [
      {
        rowIndex: 1,
        data: {
          name1: '', name2: '15/03/2024', Tên: 'System startup',
          name4: '', name5: '', name6: '', name7: '', name8: '', name9: '', name10: '',
          name11: '', name12: '', name13: '', name14: '', name15: '',
          name16: '', name17: '', name18: '', name19: '', name20: ''
        }
      },
      {
        rowIndex: 2,
        data: {
          name1: '', name2: '15/03/2024', Tên: 'User login',
          name4: '', name5: '', name6: '', name7: '', name8: '', name9: '', name10: '',
          name11: '', name12: '', name13: '', name14: '', name15: '',
          name16: '', name17: '', name18: '', name19: '', name20: ''
        }
      },
      {
        rowIndex: 3,
        data: {
          name1: '', name2: '15/03/2024', Tên: 'Data processed',
          name4: '', name5: '', name6: '', name7: '', name8: '', name9: '', name10: '',
          name11: '', name12: '', name13: '', name14: '', name15: '',
          name16: '', name17: '', name18: '', name19: '', name20: ''
        }
      }
    ];
  }

  // ✅ CLEAR CACHE
  clearCache() {
    this.cache.clear();
    console.log('🧹 Log cache cleared');
  }

  // ✅ GET CACHE STATUS
  getCacheStatus() {
    const cached = this.cache.get('log_data');
    return {
      hasCachedData: !!cached,
      rowCount: cached?.rowCount || 0,
      lastUpdated: cached?.timestamp ? new Date(cached.timestamp).toISOString() : null,
      cacheAge: cached ? Date.now() - cached.timestamp : 0
    };
  }
}

// ✅ EXPORT SINGLETON INSTANCE
export const logProcessor = new LogProcessor();

// ✅ UTILITY FUNCTIONS
export function getLogColumnNames() {
  return Object.values(LOG_COLUMNS).map(col => col.name);
}

export function getLogColumnByName(name) {
  return Object.values(LOG_COLUMNS).find(col => col.name === name);
}

export function getLogColumnByIndex(index) {
  return Object.values(LOG_COLUMNS).find(col => col.index === index);
}

// ✅ EXPORT DEFAULT
export default logProcessor;