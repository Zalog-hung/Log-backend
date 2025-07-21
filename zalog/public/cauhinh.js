// 📁 cauhinh.js - ENHANCED (Better Error Handling & Validation)
// Version: 3.1 - Import from config.js as single source of truth

// ✅ IMPORT CONFIG - Single source of truth
import { API_URLS, PROXY_CONFIG, SHEETS_CONFIG, ERROR_MESSAGES } from '/config.js';

// ✅ Cấu hình form Excel
const formConfig = {
  TOTAL_COLUMN_COUNT: 7,        // Tổng số cột bao gồm cột hành động
  FORM_COLUMN_COUNT: 6,         // Số cột input (không tính cột hành động)
  FIELDS_TO_KEEP_VALUE: [1, 4], // Cột 1 (ngày) và cột 4 (ca) giữ giá trị khi thêm dòng mới
  MAX_ROWS: 100,                // Giới hạn số dòng tối đa
  AUTO_SAVE_INTERVAL: 30000,    // Auto save mỗi 30 giây (ms)
  DEBOUNCE_DELAY: 300          // Delay cho autocomplete (ms)
};

// ✅ Cache hệ thống với metadata
const zacache = {
  handlers: {},              // Chứa các handler xử lý từng cột
  khachHangList: [],        // Danh sách khách hàng cho autocomplete
  cacherlog: [],            // Cache dữ liệu log từ server
  lastUpdated: null,        // Timestamp của lần cập nhật cuối
  version: "3.1",           // Version của cache format
  metadata: {
    totalRows: 0,
    lastSyncTime: null,
    isDirty: false          // Có thay đổi chưa save không
  }
};

// ✅ API Configuration - Mapped from config.js
const API_CONFIG = {
  KHACH_HANG_API_URL: API_URLS.KHACH_HANG_API_URL,
  LOG_API_URL: API_URLS.LOG_API_URL,
  GOOGLE_SHEETS_FILE_ID: API_URLS.GOOGLE_SHEETS_FILE_ID,
  GHI_LOG_PROXY_URL: '/api/proxy', // Use local proxy for all operations
  
  // Additional proxy configurations
  PROXY: {
    ALLOWED_ORIGINS: PROXY_CONFIG.ALLOWED_ORIGINS,
    API_TIMEOUT: PROXY_CONFIG.API_TIMEOUT,
    CACHE_TTL: PROXY_CONFIG.CACHE_TTL
  },
  
  // Sheets configurations
  SHEETS: {
    DEFAULT_SHEET_NAMES: SHEETS_CONFIG.DEFAULT_SHEET_NAMES,
    CUSTOMER_SHEET_NAME: SHEETS_CONFIG.CUSTOMER_SHEET_NAME,
    LOG_SHEET_NAME: SHEETS_CONFIG.LOG_SHEET_NAME,
    CUSTOMER_COLUMN_INDEX: SHEETS_CONFIG.CUSTOMER_COLUMN_INDEX
  },
  
  // Error messages
  ERRORS: ERROR_MESSAGES
};

// ✅ Validation cho API URLs
function validateAPIUrls() {
  const urlKeys = ['KHACH_HANG_API_URL', 'LOG_API_URL'];
  
  for (const key of urlKeys) {
    const url = API_CONFIG[key];
    if (!url) {
      console.error(`❌ Missing ${key} in API configuration`);
      return false;
    }
    
    try {
      new URL(url); // Validate URL format
      console.log(`✅ ${key} is valid:`, url);
    } catch (error) {
      console.error(`❌ Invalid ${key}:`, url, error.message);
      return false;
    }
  }
  
  return true;
}

// ✅ System info cho debugging
const SYSTEM_INFO = {
  name: "ZA-LOG System",
  version: "3.1.0",
  buildDate: new Date().toISOString(),
  configSource: "config.js",
  features: {
    eventDelegation: true,
    legacySupport: true,
    autoComplete: true,
    apiIntegration: true,
    caching: true,
    localProxy: true
  },
  browser: {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform
  },
  apis: {
    fileId: API_CONFIG.GOOGLE_SHEETS_FILE_ID,
    customerAPI: !!API_CONFIG.KHACH_HANG_API_URL,
    logAPI: !!API_CONFIG.LOG_API_URL,
    proxyURL: API_CONFIG.GHI_LOG_PROXY_URL
  }
};

// ✅ Khởi tạo và export các biến toàn cục
function initializeGlobalVariables() {
  try {
    // Validate APIs trước khi export
    if (!validateAPIUrls()) {
      console.warn("⚠️ Some API URLs are invalid, system may not work properly");
    }

    // Export form config
    window.formConfig = Object.freeze({ ...formConfig }); // Prevent modification
    
    // Export cache (không freeze để có thể modify)
    window.zacache = zacache;
    
    // Export API URLs riêng biệt để backward compatibility
    window.KHACH_HANG_API_URL = API_CONFIG.KHACH_HANG_API_URL;
    window.LOG_API_URL = API_CONFIG.LOG_API_URL;
    window.GHI_LOG_PROXY_URL = API_CONFIG.GHI_LOG_PROXY_URL;
    
    // Export full API config
    window.API_CONFIG = Object.freeze({ ...API_CONFIG });
    
    // Export system info
    window.SYSTEM_INFO = Object.freeze({ ...SYSTEM_INFO });

    // Set initial timestamp
    zacache.lastUpdated = new Date().toISOString();

    console.log("✅ cauhinh.js initialized successfully from config.js");
    console.log("📊 System Info:", SYSTEM_INFO);
    console.log("🔧 Form Config:", formConfig);
    console.log("🔗 API Config (from config.js):", {
      fileId: API_CONFIG.GOOGLE_SHEETS_FILE_ID,
      hasCustomerAPI: !!API_CONFIG.KHACH_HANG_API_URL,
      hasLogAPI: !!API_CONFIG.LOG_API_URL,
      proxyURL: API_CONFIG.GHI_LOG_PROXY_URL
    });

    return true;

  } catch (error) {
    console.error("❌ Failed to initialize global variables:", error);
    return false;
  }
}

// ✅ Utility functions
window.zalogUtils = {
  // Kiểm tra hệ thống sẵn sàng
  isSystemReady() {
    return !!(window.formConfig && window.zacache && window.API_CONFIG);
  },

  // Get system status
  getSystemStatus() {
    return {
      ready: this.isSystemReady(),
      cacheSize: window.zacache?.cacherlog?.length || 0,
      lastUpdated: window.zacache?.lastUpdated,
      isDirty: window.zacache?.metadata?.isDirty || false,
      configSource: "config.js",
      apiUrls: {
        khachHang: !!window.KHACH_HANG_API_URL,
        log: !!window.LOG_API_URL,
        proxy: !!window.GHI_LOG_PROXY_URL,
        fileId: window.API_CONFIG?.GOOGLE_SHEETS_FILE_ID
      }
    };
  },

  // Reset cache
  resetCache() {
    if (window.zacache) {
      window.zacache.cacherlog = [];
      window.zacache.khachHangList = [];
      window.zacache.metadata.totalRows = 0;
      window.zacache.metadata.isDirty = false;
      window.zacache.lastUpdated = new Date().toISOString();
      console.log("🔄 Cache has been reset");
    }
  },

  // Validate form data
  validateFormData(data) {
    if (!Array.isArray(data)) return false;
    
    return data.every(row => {
      return Array.isArray(row) && row.length >= formConfig.FORM_COLUMN_COUNT;
    });
  },

  // Test API connectivity via local proxy
  async testAPIConnectivity() {
    try {
      console.log("🧪 Testing API connectivity via local proxy...");
      
      // Test customer API
      const customerTest = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: window.KHACH_HANG_API_URL,
          method: 'GET'
        })
      });
      
      console.log("📋 Customer API test:", {
        ok: customerTest.ok,
        status: customerTest.status
      });
      
      // Test log API
      const logTest = await fetch('/api/proxy/file/sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetName: 'Log'
        })
      });
      
      console.log("📊 Log API test:", {
        ok: logTest.ok,
        status: logTest.status
      });
      
      return {
        customerAPI: customerTest.ok,
        logAPI: logTest.ok,
        overall: customerTest.ok && logTest.ok
      };
      
    } catch (error) {
      console.error("❌ API connectivity test failed:", error);
      return {
        customerAPI: false,
        logAPI: false,
        overall: false,
        error: error.message
      };
    }
  }
};

// ✅ Initialize khi load
const initSuccess = initializeGlobalVariables();

if (!initSuccess) {
  console.error("❌ cauhinh.js initialization failed!");
  // Có thể show user notification here
} else {
  // Mark configuration as loaded
  window._configLoaded = true;
  
  // Dispatch custom event để notify các module khác
  if (typeof window.CustomEvent !== 'undefined') {
    window.dispatchEvent(new CustomEvent('zalog:config-ready', {
      detail: { 
        success: true, 
        timestamp: new Date().toISOString(),
        systemInfo: SYSTEM_INFO,
        configSource: "config.js"
      }
    }));
  }
}

// ✅ Export for ES6 modules (optional)
export { formConfig, zacache, API_CONFIG, SYSTEM_INFO };