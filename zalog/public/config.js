// api/config.js - Backend Configuration (Centralized)
// Version: 1.0 - Single source of truth for backend APIs

// ✅ GOOGLE SHEETS & APP SCRIPT CONFIGURATION
export const API_URLS = {
  // Google App Script URLs
  KHACH_HANG_API_URL: "https://script.google.com/macros/s/AKfycbzh6AIpZErbF_yWTzgF6lo6EZ2-JlObiks5Ab-Hz5QUZGhKdxI1WtPGrWaa0HbKorQ9Pg/exec",
  LOG_API_URL: "https://script.google.com/macros/s/AKfycbyZpKUxJ9QTtBzdovOoSp6OhkDGuKQLyVZY6zYc6sPV5tX_ayoQ8ZSL_li5apKXi1mvyw/exec",
  
  // Google Sheets File ID (extracted from URLs above)
  GOOGLE_SHEETS_FILE_ID: "18Nm-8koiDr7hTTIsvuNP9UbSGVrtRPtzt_uI_sPNZEw"
};

// ✅ PROXY CONFIGURATION
export const PROXY_CONFIG = {
  // CORS allowed origins
  ALLOWED_ORIGINS: [
    'https://zalog.vercel.app',
    'https://zalog-fdzpsa7o5-hung-za.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8080',
    'https://localhost',
    /^https:\/\/zalog-.+\.vercel\.app$/ // Pattern for Vercel preview domains
  ],
  
  // Security whitelist for general proxy
  ALLOWED_HOSTS: [
    'script.google.com',
    'docs.google.com',
    'sheets.googleapis.com',
    'httpbin.org' // For testing
  ],
  
  // Timeouts (ms)
  API_TIMEOUT: 15000,           // 15 seconds for App Script calls
  METADATA_TIMEOUT: 10000,      // 10 seconds for sheet metadata
  
  // Cache settings
  CACHE_TTL: 300000,            // 5 minutes
  MAX_CACHE_SIZE: 100           // Max number of cached items
};

// ✅ GOOGLE SHEETS CONFIGURATION
export const SHEETS_CONFIG = {
  // Default sheet names to attempt loading
  DEFAULT_SHEET_NAMES: ['Khách Hàng', 'Log', 'Data', 'Sheet1'],
  
  // Column mappings
  CUSTOMER_COLUMN_INDEX: 2,     // Column C (0-based index)
  MAX_COLUMNS_TO_EXTRACT: 26,   // A-Z columns
  
  // Sheet-specific settings
  CUSTOMER_SHEET_NAME: 'Khách Hàng',
  LOG_SHEET_NAME: 'Log',
  
  // Row limits
  MAX_ROWS_TO_PROCESS: 10000,   // Prevent memory issues
  HEADER_ROW_INDEX: 0           // First row is header
};

// ✅ ERROR MESSAGES
export const ERROR_MESSAGES = {
  MISSING_SHEET_NAME: 'Missing sheetName parameter',
  SHEET_NOT_FOUND: 'Sheet not found in file',
  INVALID_ROW_COL: 'Invalid row or column values',
  MISSING_UPDATE_PARAMS: 'Missing required parameters: row, col, value',
  API_TIMEOUT: 'Request timeout - Google Script took too long to respond',
  NETWORK_ERROR: 'Network error - Could not reach Google Script',
  INVALID_FILE_ID: 'Invalid Google Sheets file ID',
  CORS_BLOCKED: 'Request blocked by CORS policy',
  CACHE_ERROR: 'Cache operation failed',
  PARSE_ERROR: 'Failed to parse Google Sheets response'
};

// ✅ UTILITY FUNCTIONS
export function extractFileIdFromUrl(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }
  
  // Extract file ID from various Google Sheets URL formats
  const patterns = [
    /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
    /\/macros\/s\/([a-zA-Z0-9-_]+)/,
    /key=([a-zA-Z0-9-_]+)/,
    /id=([a-zA-Z0-9-_]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

export function validateSheetName(sheetName) {
  if (!sheetName || typeof sheetName !== 'string') {
    return false;
  }
  
  // Basic validation - no empty strings, reasonable length
  return sheetName.trim().length > 0 && sheetName.length <= 100;
}

export function validateRowCol(row, col) {
  const rowNum = parseInt(row);
  const colNum = parseInt(col);
  
  return {
    isValid: !isNaN(rowNum) && !isNaN(colNum) && rowNum >= 0 && colNum >= 0,
    row: rowNum,
    col: colNum
  };
}

export function isAllowedOrigin(origin, allowedOrigins = PROXY_CONFIG.ALLOWED_ORIGINS) {
  if (!origin) return false;
  
  // Check exact match
  if (allowedOrigins.includes(origin)) {
    return true;
  }
  
  // Check regex patterns
  for (const pattern of allowedOrigins) {
    if (pattern instanceof RegExp && pattern.test(origin)) {
      return true;
    }
  }
  
  return false;
}

export function isAllowedHost(hostname, allowedHosts = PROXY_CONFIG.ALLOWED_HOSTS) {
  return allowedHosts.includes(hostname);
}

// ✅ CORS HEADERS SETUP
export function setCorsHeaders(res, origin) {
  const isAllowed = isAllowedOrigin(origin);
  
  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV === 'development') {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  return isAllowed;
}

// ✅ GENERATE DATA HASH (for cache invalidation)
export function generateDataHash(data) {
  const str = JSON.stringify(data);
  let hash = 0;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return hash.toString(16);
}

// ✅ PARSE GOOGLE SHEETS RESPONSE
export function parseGoogleSheetsResponse(rawData) {
  try {
    // Handle JSONP response from Google Sheets
    const jsonStart = rawData.indexOf('{');
    const jsonEnd = rawData.lastIndexOf('}') + 1;
    
    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error(ERROR_MESSAGES.PARSE_ERROR + ': No JSON found');
    }
    
    const jsonString = rawData.substring(jsonStart, jsonEnd);
    const parsed = JSON.parse(jsonString);
    
    // Validate parsed data structure
    if (!parsed.table || !parsed.table.rows) {
      throw new Error(ERROR_MESSAGES.PARSE_ERROR + ': Invalid table structure');
    }
    
    return parsed;
  } catch (error) {
    throw new Error(ERROR_MESSAGES.PARSE_ERROR + ': ' + error.message);
  }
}

// ✅ EXTRACT COLUMN DATA
export function extractColumnData(sheetsData, columnIndex = SHEETS_CONFIG.CUSTOMER_COLUMN_INDEX) {
  try {
    if (!sheetsData?.table?.rows) {
      return [];
    }
    
    const columnData = [];
    const maxRows = Math.min(sheetsData.table.rows.length, SHEETS_CONFIG.MAX_ROWS_TO_PROCESS);
    
    // Skip header row (index 0)
    for (let i = 1; i < maxRows; i++) {
      const row = sheetsData.table.rows[i];
      
      if (row.c && row.c.length > columnIndex) {
        const cell = row.c[columnIndex];
        const value = cell?.v?.toString()?.trim();
        
        if (value && value.length > 0) {
          columnData.push(value);
        }
      }
    }
    
    // Remove duplicates and sort
    return [...new Set(columnData)].sort();
  } catch (error) {
    console.error('❌ Error extracting column data:', error);
    return [];
  }
}

// ✅ BUILD GOOGLE SHEETS URL
export function buildGoogleSheetsUrl(fileId, sheetName = null) {
  if (!fileId) {
    throw new Error(ERROR_MESSAGES.INVALID_FILE_ID);
  }
  
  let url = `https://docs.google.com/spreadsheets/d/${fileId}/gviz/tq?tqx=out:json`;
  
  if (sheetName) {
    const encodedSheetName = encodeURIComponent(sheetName);
    url += `&sheet=${encodedSheetName}`;
  }
  
  return url;
}

// ✅ CREATE ERROR RESPONSE
export function createErrorResponse(error, startTime, statusCode = 500) {
  return {
    success: false,
    error: error.message || error,
    message: typeof error === 'string' ? error : error.message,
    timestamp: new Date().toISOString(),
    duration: Date.now() - startTime,
    statusCode
  };
}

// ✅ CREATE SUCCESS RESPONSE
export function createSuccessResponse(data, meta = {}, startTime) {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      ...meta
    }
  };
}

// ✅ ENVIRONMENT CHECK
export function getEnvironment() {
  return {
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    nodeEnv: process.env.NODE_ENV || 'development'
  };
}

// ✅ DEBUG INFORMATION
export function getDebugInfo() {
  return {
    config: {
      apiUrls: API_URLS,
      environment: getEnvironment(),
      allowedOrigins: PROXY_CONFIG.ALLOWED_ORIGINS.filter(o => typeof o === 'string'), // Exclude regex
      allowedHosts: PROXY_CONFIG.ALLOWED_HOSTS
    },
    sheets: SHEETS_CONFIG,
    version: '1.0'
  };
}

// ✅ DEFAULT EXPORT for convenience
export default {
  API_URLS,
  PROXY_CONFIG,
  SHEETS_CONFIG,
  ERROR_MESSAGES,
  // Utility functions
  extractFileIdFromUrl,
  validateSheetName,
  validateRowCol,
  isAllowedOrigin,
  isAllowedHost,
  setCorsHeaders,
  generateDataHash,
  parseGoogleSheetsResponse,
  extractColumnData,
  buildGoogleSheetsUrl,
  createErrorResponse,
  createSuccessResponse,
  getEnvironment,
  getDebugInfo
};