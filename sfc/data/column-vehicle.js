// 📁 column-vehicle.js - Xử lý sheets phương tiện từ API FINAL
// Version: 1.0 - Column mapping cho sheet "Phương Tiện"

// ✅ IMPORT CONFIG
import { SHEET_NAMES, getSheetName } from './config.js';

// ✅ COLUMN DEFINITIONS - Định nghĩa trước cho dễ thay đổi
export const VEHICLE_COLUMNS = {
  COLUMN1: { index: 0, name: 'name1', description: 'Cột 1' },
  COLUMN2: { index: 1, name: 'name2', description: 'Cột 2' },
  COLUMN3: { index: 2, name: 'Tên', description: 'Tên phương tiện' },
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

// ✅ VEHICLE DATA PROCESSOR
export class VehicleProcessor {
  constructor() {
    this.cache = new Map();
    this.sheetName = getSheetName('FINAL', 'SHEET_NAME_3'); // 'Phương Tiện'
    this.apiName = 'final';
  }

  // ✅ LẤY DỮ LIỆU TỪ PROXY
  async loadVehicleData() {
    try {
      console.log('🚛 Loading vehicle data from FINAL API...');

      // Gọi proxy với API final
      const response = await fetch('/api/proxy/final', {
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
        throw new Error(result.error || 'Failed to load vehicle data');
      }

      // Process và cache data
      const processedData = this.processSheetData(result.data);
      
      this.cache.set('vehicle_data', {
        data: processedData,
        timestamp: Date.now(),
        rowCount: processedData.length
      });

      console.log(`✅ Loaded ${processedData.length} vehicle rows`);
      return processedData;

    } catch (error) {
      console.error('❌ Error loading vehicle data:', error);
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
      Object.values(VEHICLE_COLUMNS).forEach(column => {
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
      Object.values(VEHICLE_COLUMNS).forEach(column => {
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
      const vehicleData = await this.getCachedOrLoad();
      
      if (!vehicleData || vehicleData.length === 0) {
        console.warn(`⚠️ No vehicle data available for column: ${columnName}`);
        return [];
      }

      // Extract column values
      const columnValues = vehicleData
        .map(row => row.data[columnName])
        .filter(value => value && value.length > 0)
        .filter((value, index, array) => array.indexOf(value) === index) // Remove duplicates
        .sort(); // Sort alphabetically

      console.log(`🚛 Column ${columnName}: ${columnValues.length} unique values`);
      return columnValues;

    } catch (error) {
      console.error(`❌ Error getting column ${columnName}:`, error);
      return [];
    }
  }

  // ✅ LẤY DỮ LIỆU THEO INDEX
  async getColumnByIndex(columnIndex) {
    const column = Object.values(VEHICLE_COLUMNS).find(col => col.index === columnIndex);
    
    if (!column) {
      console.error(`❌ Column index ${columnIndex} not found`);
      return [];
    }

    return await this.getColumnData(column.name);
  }

  // ✅ TÌM KIẾM PHƯƠNG TIỆN
  async searchVehicles(searchTerm, columnName = 'Tên') {
    try {
      const vehicleData = await this.getCachedOrLoad();
      const searchLower = searchTerm.toLowerCase();

      const results = vehicleData.filter(row => {
        const value = row.data[columnName] || '';
        return value.toLowerCase().includes(searchLower);
      });

      console.log(`🔍 Search "${searchTerm}" in ${columnName}: ${results.length} results`);
      return results;

    } catch (error) {
      console.error('❌ Error searching vehicles:', error);
      return [];
    }
  }

  // ✅ LẤY CACHE HOẶC LOAD MỚI
  async getCachedOrLoad() {
    const cached = this.cache.get('vehicle_data');
    
    // Check cache validity (5 minutes)
    if (cached && (Date.now() - cached.timestamp) < 300000) {
      console.log('⚡ Using cached vehicle data');
      return cached.data;
    }

    // Load fresh data
    return await this.loadVehicleData();
  }

  // ✅ LẤY FALLBACK DATA
  getFallbackData() {
    console.log('🚛 Using fallback vehicle data');
    
    return [
      {
        rowIndex: 1,
        data: {
          name1: '', name2: '', Tên: 'Xe tải 10 tấn - 29A-12345',
          name4: '', name5: '', name6: '', name7: '', name8: '', name9: '', name10: '',
          name11: '', name12: '', name13: '', name14: '', name15: '',
          name16: '', name17: '', name18: '', name19: '', name20: ''
        }
      },
      {
        rowIndex: 2,
        data: {
          name1: '', name2: '', Tên: 'Xe ben 15 tấn - 30B-67890',
          name4: '', name5: '', name6: '', name7: '', name8: '', name9: '', name10: '',
          name11: '', name12: '', name13: '', name14: '', name15: '',
          name16: '', name17: '', name18: '', name19: '', name20: ''
        }
      },
      {
        rowIndex: 3,
        data: {
          name1: '', name2: '', Tên: 'Xe container 20 feet - 51C-11111',
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
    console.log('🧹 Vehicle cache cleared');
  }

  // ✅ GET CACHE STATUS
  getCacheStatus() {
    const cached = this.cache.get('vehicle_data');
    return {
      hasCachedData: !!cached,
      rowCount: cached?.rowCount || 0,
      lastUpdated: cached?.timestamp ? new Date(cached.timestamp).toISOString() : null,
      cacheAge: cached ? Date.now() - cached.timestamp : 0
    };
  }
}

// ✅ EXPORT SINGLETON INSTANCE
export const vehicleProcessor = new VehicleProcessor();

// ✅ UTILITY FUNCTIONS
export function getVehicleColumnNames() {
  return Object.values(VEHICLE_COLUMNS).map(col => col.name);
}

export function getVehicleColumnByName(name) {
  return Object.values(VEHICLE_COLUMNS).find(col => col.name === name);
}

export function getVehicleColumnByIndex(index) {
  return Object.values(VEHICLE_COLUMNS).find(col => col.index === index);
}

// ✅ EXPORT DEFAULT
export default vehicleProcessor;