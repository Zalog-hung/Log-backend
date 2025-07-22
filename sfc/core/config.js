// 📁 config.js - Configuration for 5 Google Sheets APIs
// Version: 1.0 - Chậm mà chắc từng file 1

// ✅ 5 GOOGLE SHEETS API ENDPOINTS
export const GOOGLE_SHEETS_APIS = {
  // 1. FINAL - Dữ liệu chính cuối cùng
  FINAL: {
    name: "final",
    url: "https://script.google.com/macros/s/YOUR_FINAL_SCRIPT_ID/exec",
    description: "Final data processing",
    sheetName: "Final"
  },

  // 2. LOG - Dữ liệu log hệ thống  
  LOG: {
    name: "log", 
    url: "https://script.google.com/macros/s/YOUR_LOG_SCRIPT_ID/exec",
    description: "System log data",
    sheetName: "Log"
  },

  // 3. BANGLUONG - Dữ liệu bảng lương
  BANGLUONG: {
    name: "bangluong",
    url: "https://script.google.com/macros/s/YOUR_BANGLUONG_SCRIPT_ID/exec", 
    description: "Salary data",
    sheetName: "BangLuong"
  },

  // 4. CONGNO - Dữ liệu công nợ
  CONGNO: {
    name: "congno",
    url: "https://script.google.com/macros/s/YOUR_CONGNO_SCRIPT_ID/exec",
    description: "Debt/Credit data", 
    sheetName: "CongNo"
  },

  // 5. FILE5 - Dữ liệu bổ sung
  FILE5: {
    name: "file5",
    url: "https://script.google.com/macros/s/YOUR_FILE5_SCRIPT_ID/exec",
    description: "Additional data source",
    sheetName: "File5"
  }
};

// ✅ API CONFIGURATION
export const API_CONFIG = {
  // Timeout settings
  TIMEOUT: 15000, // 15 seconds
  
  // Retry settings
  RETRY_COUNT: 3,
  RETRY_DELAY: 1000, // 1 second
  
  // Cache settings
  CACHE_TTL: 300000, // 5 minutes
  
  // Request headers
  HEADERS: {
    'Content-Type': 'application/json',
    'User-Agent': 'ZaLog-System/1.0'
  }
};

// ✅ CORS CONFIGURATION
export const CORS_CONFIG = {
  ALLOWED_ORIGINS: [
    'https://zalog.vercel.app',
    'https://zalog-*.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8080'
  ],
  
  ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  
  ALLOWED_HEADERS: [
    'Content-Type',
    'Authorization', 
    'X-Requested-With'
  ]
};

// ✅ UTILITY FUNCTIONS
export function getAPIByName(name) {
  const apiKey = name.toUpperCase();
  return GOOGLE_SHEETS_APIS[apiKey] || null;
}

export function getAllAPINames() {
  return Object.keys(GOOGLE_SHEETS_APIS).map(key => 
    GOOGLE_SHEETS_APIS[key].name
  );
}

export function validateAPIConfig() {
  const apis = Object.values(GOOGLE_SHEETS_APIS);
  
  for (const api of apis) {
    if (!api.url || !api.name || !api.sheetName) {
      console.error(`❌ Invalid API config for: ${api.name}`);
      return false;
    }
    
    if (api.url.includes('YOUR_') && api.url.includes('_SCRIPT_ID')) {
      console.warn(`⚠️ API ${api.name} still using placeholder URL`);
    }
  }
  
  return true;
}

// ✅ SHEET NAMES CONFIGURATION - Định nghĩa tên sheets cho 5 APIs
export const SHEET_NAMES = {
  // FILE A: FINAL API
  FINAL: {
    SHEET_NAME_1: 'Khách Hàng',
    SHEET_NAME_2: 'Nhân Viên', 
    SHEET_NAME_3: 'Phương Tiện'
  },

  // FILE B: LOG API  
  LOG: {
    SHEET_NAME_1: 'Log',
    SHEET_NAME_2: 'Error Log'
  },

  // FILE C: BANGLUONG API
  BANGLUONG: {
    SHEET_NAME_1: 'Bảng Lương',
    SHEET_NAME_2: 'Phụ Cấp',
    SHEET_NAME_3: 'Thưởng Phạt'
  },

  // FILE D: CONGNO API
  CONGNO: {
    SHEET_NAME_1: 'Công Nợ',
    SHEET_NAME_2: 'Thu Chi',
    SHEET_NAME_3: 'Đối Tác'
  },

  // FILE E: FILE5 API
  FILE5: {
    SHEET_NAME_1: 'Data 1',
    SHEET_NAME_2: 'Data 2',
    SHEET_NAME_3: 'Backup'
  }
};

// ✅ UTILITY FUNCTIONS FOR SHEET NAMES
export function getSheetName(apiName, sheetKey) {
  const api = apiName.toUpperCase();
  return SHEET_NAMES[api]?.[sheetKey] || null;
}

export function getAllSheetNames(apiName) {
  const api = apiName.toUpperCase();
  return SHEET_NAMES[api] ? Object.values(SHEET_NAMES[api]) : [];
}

export function getSheetKeys(apiName) {
  const api = apiName.toUpperCase();
  return SHEET_NAMES[api] ? Object.keys(SHEET_NAMES[api]) : [];
}

// ✅ EXPORT DEFAULT
export default {
  GOOGLE_SHEETS_APIS,
  API_CONFIG,
  CORS_CONFIG,
  SHEET_NAMES,
  getAPIByName,
  getAllAPINames,
  validateAPIConfig,
  getSheetName,
  getAllSheetNames,
  getSheetKeys
};