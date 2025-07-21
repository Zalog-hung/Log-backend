// api/proxy.js (Enhanced with Full File Loading + Write Support)
// Version: 5.0 - Complete File Access + Cache + Write Operations

// ✅ IMPORT CONFIG
import { API_URLS } from '../public/config.js';

// ✅ SERVER-SIDE CACHE STORAGE
let serverCache = new Map();
const CACHE_KEYS = {
  FULL_FILE_DATA: 'full_file_data',
  SHEET_LIST: 'sheet_list',
  LAST_MODIFIED: 'last_modified',
  DATA_HASH: 'data_hash'
};

// ✅ UTILITY FUNCTIONS
function generateDataHash(data) {
  // Simple hash function for data change detection
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(16);
}

function extractFileId(url) {
  // Extract file ID from various Google Sheets URL formats
  const patterns = [
    /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
    /\/macros\/s\/([a-zA-Z0-9-_]+)/,
    /key=([a-zA-Z0-9-_]+)/,
    /id=([a-zA-Z0-9-_]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

function parseGoogleSheetsResponse(rawData) {
  try {
    // Handle JSONP response from Google Sheets
    const jsonStart = rawData.indexOf('{');
    const jsonEnd = rawData.lastIndexOf('}') + 1;
    
    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error('No JSON found in response');
    }
    
    const jsonString = rawData.substring(jsonStart, jsonEnd);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('❌ Error parsing Google Sheets response:', error);
    throw new Error('Invalid Google Sheets response format');
  }
}

function logCacheStatus() {
  console.log('📦 Server Cache Status:', {
    hasFullFile: serverCache.has(CACHE_KEYS.FULL_FILE_DATA),
    hasSheetList: serverCache.has(CACHE_KEYS.SHEET_LIST),
    lastModified: serverCache.get(CACHE_KEYS.LAST_MODIFIED),
    dataHash: serverCache.get(CACHE_KEYS.DATA_HASH),
    cacheSize: serverCache.size
  });
}

export default async function handler(req, res) {
  const startTime = Date.now();

  // ✅ ENHANCED CORS SETUP
  const allowedOrigins = [
    'https://zalog.vercel.app',
    'https://zalog-fdzpsa7o5-hung-za.vercel.app', // ✅ Domain gọi request
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8080',
    'https://localhost',
    // ✅ Thêm các preview domains khác nếu cần
    /^https:\/\/zalog-.+\.vercel\.app$/
  ];
  
  const origin = req.headers.origin;
  let isAllowedOrigin = false;
  
  // Check exact match first
  if (allowedOrigins.includes(origin)) {
    isAllowedOrigin = true;
  } else {
    // Check regex patterns
    for (const pattern of allowedOrigins) {
      if (pattern instanceof RegExp && pattern.test(origin)) {
        isAllowedOrigin = true;
        break;
      }
    }
  }
  
  if (isAllowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV === 'development') {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  // ✅ HANDLE PREFLIGHT
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ✅ METHOD VALIDATION
  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      message: 'Only GET and POST requests are supported'
    });
  }

  try {
    // ✅ ENHANCED ROUTING
    const { pathname } = new URL(req.url, `http://${req.headers.host}`);
    
    // Handle Google Sheets file operations
    if (pathname.startsWith('/api/proxy/file/')) {
      return await handleFullFileRequest(req, res, pathname, startTime);
    }
    
    // Legacy Google Sheets specific routes
    if (pathname.startsWith('/api/proxy/sheets/')) {
      return await handleGoogleSheetsRequest(req, res, pathname, startTime);
    }
    
    // ✅ FALLBACK: General proxy functionality
    return await handleGeneralProxy(req, res, startTime);

  } catch (error) {
    console.error('❌ Proxy error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      duration: Date.now() - startTime
    });
  }
}

// ✅ FULL FILE OPERATIONS HANDLER
async function handleFullFileRequest(req, res, pathname, startTime) {
  const action = pathname.split('/').pop();
  
  console.log(`📁 Full file request: ${action}`);
  logCacheStatus();

  switch (action) {
    case 'load':
      return await loadFullFile(req, res, startTime);
    
    case 'sheets':
      return await getSheetList(req, res, startTime);
    
    case 'sheet':
      return await getSpecificSheet(req, res, startTime);
    
    case 'write':
      return await writeToSheet(req, res, startTime);
    
    case 'update':
      return await updateSheetData(req, res, startTime);
    
    case 'clear':
      return await clearFullFileCache(req, res, startTime);
    
    default:
      return res.status(404).json({
        success: false,
        error: 'Unknown file action',
        availableActions: ['load', 'sheets', 'sheet', 'write', 'update', 'clear']
      });
  }
}

// ✅ LOAD FULL FILE (All Sheets)
async function loadFullFile(req, res, startTime) {
  try {
    // Get configuration from request or use defaults from config.js
    const config = req.method === 'POST' ? req.body : {};
    const {
      khachHangUrl = API_URLS.KHACH_HANG_API_URL,
      logUrl = API_URLS.LOG_API_URL,
      fileId = API_URLS.GOOGLE_SHEETS_FILE_ID
    } = config;

    console.log('📁 Loading full file:', { fileId, khachHangUrl, logUrl });

    const fullFileData = {
      fileId: fileId,
      loadTime: new Date().toISOString(),
      sheets: {},
      apis: {
        khachHang: khachHangUrl,
        log: logUrl
      }
    };

    // ✅ STRATEGY 1: Try to detect sheet names first
    let sheetNames = ['Khách Hàng', 'Log', 'Data', 'Sheet1']; // Default attempts
    
    try {
      // Try to get sheet list from file metadata
      const metadataUrl = `https://docs.google.com/spreadsheets/d/${fileId}/edit#gid=0`;
      const metadataResponse = await fetch(metadataUrl, {
        headers: { 'User-Agent': 'ZaLog-Proxy/5.0' },
        signal: AbortSignal.timeout(10000)
      });
      
      if (metadataResponse.ok) {
        const html = await metadataResponse.text();
        // Extract sheet names from HTML (basic parsing)
        const sheetMatches = html.match(/"sheets":\[.*?\]/);
        if (sheetMatches) {
          try {
            const sheetsData = JSON.parse(sheetMatches[0].replace('"sheets":', ''));
            sheetNames = sheetsData.map(sheet => sheet.properties?.title || 'Unknown').filter(Boolean);
            console.log('📋 Detected sheet names:', sheetNames);
          } catch (e) {
            console.warn('⚠️ Could not parse sheet names from metadata');
          }
        }
      }
    } catch (e) {
      console.warn('⚠️ Could not fetch file metadata, using defaults');
    }

    // ✅ STRATEGY 2: Load each sheet via gviz
    const loadPromises = sheetNames.map(async (sheetName) => {
      try {
        const encodedSheetName = encodeURIComponent(sheetName);
        const sheetUrl = `https://docs.google.com/spreadsheets/d/${fileId}/gviz/tq?tqx=out:json&sheet=${encodedSheetName}`;
        
        console.log(`📊 Loading sheet: ${sheetName}`);
        
        const response = await fetch(sheetUrl, {
          headers: {
            'User-Agent': 'ZaLog-Proxy/5.0',
            'Accept': 'application/json,text/plain,*/*'
          },
          signal: AbortSignal.timeout(15000)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const rawData = await response.text();
        const sheetData = parseGoogleSheetsResponse(rawData);

        if (sheetData.table && sheetData.table.rows && sheetData.table.rows.length > 0) {
          return {
            name: sheetName,
            data: sheetData,
            rowCount: sheetData.table.rows.length,
            colCount: sheetData.table.cols?.length || 0,
            success: true
          };
        } else {
          console.warn(`⚠️ Sheet ${sheetName} is empty or invalid`);
          return {
            name: sheetName,
            data: null,
            success: false,
            error: 'Empty or invalid sheet'
          };
        }
      } catch (error) {
        console.warn(`⚠️ Failed to load sheet ${sheetName}:`, error.message);
        return {
          name: sheetName,
          data: null,
          success: false,
          error: error.message
        };
      }
    });

    // Wait for all sheets to load
    const sheetResults = await Promise.allSettled(loadPromises);
    
    let successCount = 0;
    sheetResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        fullFileData.sheets[result.value.name] = result.value.data;
        successCount++;
      } else {
        console.warn(`❌ Sheet ${sheetNames[index]} failed:`, result.reason || result.value?.error);
      }
    });

    if (successCount === 0) {
      throw new Error('No sheets could be loaded successfully');
    }

    // ✅ UPDATE CACHE
    const dataHash = generateDataHash(fullFileData);
    serverCache.set(CACHE_KEYS.FULL_FILE_DATA, fullFileData);
    serverCache.set(CACHE_KEYS.SHEET_LIST, Object.keys(fullFileData.sheets));
    serverCache.set(CACHE_KEYS.DATA_HASH, dataHash);
    serverCache.set(CACHE_KEYS.LAST_MODIFIED, new Date().toISOString());

    console.log(`✅ Full file loaded: ${successCount}/${sheetNames.length} sheets, hash: ${dataHash}`);

    return res.status(200).json({
      success: true,
      data: fullFileData,
      meta: {
        fileId: fileId,
        sheetCount: successCount,
        totalAttempted: sheetNames.length,
        loadedSheets: Object.keys(fullFileData.sheets),
        dataHash: dataHash,
        lastModified: serverCache.get(CACHE_KEYS.LAST_MODIFIED),
        fromCache: false
      },
      duration: Date.now() - startTime
    });

  } catch (error) {
    console.error('❌ Full file load error:', error);
    
    // ✅ RETURN CACHED DATA IF AVAILABLE
    const cachedData = serverCache.get(CACHE_KEYS.FULL_FILE_DATA);
    if (cachedData) {
      console.log('📦 Returning cached full file data due to error');
      return res.status(200).json({
        success: true,
        data: cachedData,
        meta: {
          fromCache: true,
          cacheAge: Date.now() - new Date(serverCache.get(CACHE_KEYS.LAST_MODIFIED)).getTime(),
          error: error.message
        },
        duration: Date.now() - startTime
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Full file load failed',
      message: error.message,
      duration: Date.now() - startTime
    });
  }
}

// ✅ GET SHEET LIST
async function getSheetList(req, res, startTime) {
  try {
    let sheetList = serverCache.get(CACHE_KEYS.SHEET_LIST);
    
    if (!sheetList) {
      // Try to load full file first
      const fullData = serverCache.get(CACHE_KEYS.FULL_FILE_DATA);
      if (fullData) {
        sheetList = Object.keys(fullData.sheets);
      } else {
        // Force reload
        await loadFullFile(req, res, startTime);
        sheetList = serverCache.get(CACHE_KEYS.SHEET_LIST) || [];
      }
    }

    return res.status(200).json({
      success: true,
      data: sheetList,
      meta: {
        sheetCount: sheetList.length,
        lastModified: serverCache.get(CACHE_KEYS.LAST_MODIFIED)
      },
      duration: Date.now() - startTime
    });

  } catch (error) {
    console.error('❌ Sheet list error:', error);
    return res.status(500).json({
      success: false,
      error: 'Sheet list failed',
      message: error.message,
      duration: Date.now() - startTime
    });
  }
}

// ✅ GET SPECIFIC SHEET
async function getSpecificSheet(req, res, startTime) {
  try {
    const { sheetName } = req.method === 'POST' ? req.body : req.query;
    
    if (!sheetName) {
      return res.status(400).json({
        success: false,
        error: 'Missing sheetName parameter'
      });
    }

    const fullData = serverCache.get(CACHE_KEYS.FULL_FILE_DATA);
    
    if (!fullData || !fullData.sheets[sheetName]) {
      // Try to reload
      await loadFullFile(req, res, startTime);
      const reloadedData = serverCache.get(CACHE_KEYS.FULL_FILE_DATA);
      
      if (!reloadedData || !reloadedData.sheets[sheetName]) {
        return res.status(404).json({
          success: false,
          error: 'Sheet not found',
          availableSheets: Object.keys(reloadedData?.sheets || {})
        });
      }
    }

    const sheetData = fullData.sheets[sheetName];

    return res.status(200).json({
      success: true,
      data: sheetData,
      meta: {
        sheetName: sheetName,
        rowCount: sheetData.table?.rows?.length || 0,
        colCount: sheetData.table?.cols?.length || 0,
        lastModified: serverCache.get(CACHE_KEYS.LAST_MODIFIED)
      },
      duration: Date.now() - startTime
    });

  } catch (error) {
    console.error('❌ Get specific sheet error:', error);
    return res.status(500).json({
      success: false,
      error: 'Get sheet failed',
      message: error.message,
      duration: Date.now() - startTime
    });
  }
}

// ✅ WRITE TO SHEET (via App Script)
async function writeToSheet(req, res, startTime) {
  try {
    const { 
      apiUrl = API_URLS.LOG_API_URL,
      action = 'write',
      data,
      sheetName,
      ...otherParams 
    } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'Missing data parameter'
      });
    }

    console.log(`✍️ Writing to sheet via App Script: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ZaLog-Proxy/5.0'
      },
      body: JSON.stringify({
        action,
        data,
        sheetName,
        ...otherParams
      }),
      signal: AbortSignal.timeout(20000)
    });

    if (!response.ok) {
      throw new Error(`App Script HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    // ✅ INVALIDATE CACHE after write
    if (result.success) {
      console.log('🔄 Invalidating cache after successful write');
      serverCache.delete(CACHE_KEYS.FULL_FILE_DATA);
      serverCache.delete(CACHE_KEYS.SHEET_LIST);
      serverCache.delete(CACHE_KEYS.DATA_HASH);
    }

    return res.status(200).json({
      success: result.success || true,
      data: result,
      meta: {
        operation: 'write',
        cacheInvalidated: result.success
      },
      duration: Date.now() - startTime
    });

  } catch (error) {
    console.error('❌ Write to sheet error:', error);
    return res.status(500).json({
      success: false,
      error: 'Write operation failed',
      message: error.message,
      duration: Date.now() - startTime
    });
  }
}

// ✅ UPDATE SHEET DATA (via App Script)
async function updateSheetData(req, res, startTime) {
  try {
    const { 
      apiUrl = API_URLS.LOG_API_URL,
      action = 'update',
      row,
      col,
      value,
      sheetName,
      ...otherParams 
    } = req.body;

    if (row === undefined || col === undefined || value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing row, col, or value parameters'
      });
    }

    console.log(`📝 Updating sheet cell [${row},${col}] = "${value}"`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ZaLog-Proxy/5.0'
      },
      body: JSON.stringify({
        action,
        row,
        col,
        value,
        sheetName,
        ...otherParams
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      throw new Error(`App Script HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    // ✅ UPDATE LOCAL CACHE if possible
    if (result.success) {
      const fullData = serverCache.get(CACHE_KEYS.FULL_FILE_DATA);
      if (fullData && sheetName && fullData.sheets[sheetName]) {
        try {
          const sheet = fullData.sheets[sheetName];
          if (sheet.table && sheet.table.rows && sheet.table.rows[row] && sheet.table.rows[row].c) {
            if (!sheet.table.rows[row].c[col]) {
              sheet.table.rows[row].c[col] = {};
            }
            sheet.table.rows[row].c[col].v = value;
            console.log('✅ Updated local cache');
          }
        } catch (e) {
          console.warn('⚠️ Could not update local cache:', e.message);
        }
      }
    }

    return res.status(200).json({
      success: result.success || true,
      data: result,
      meta: {
        operation: 'update',
        row,
        col,
        value
      },
      duration: Date.now() - startTime
    });

  } catch (error) {
    console.error('❌ Update sheet error:', error);
    return res.status(500).json({
      success: false,
      error: 'Update operation failed',
      message: error.message,
      duration: Date.now() - startTime
    });
  }
}

// ✅ CLEAR FULL FILE CACHE
async function clearFullFileCache(req, res, startTime) {
  try {
    const beforeSize = serverCache.size;
    
    serverCache.delete(CACHE_KEYS.FULL_FILE_DATA);
    serverCache.delete(CACHE_KEYS.SHEET_LIST);
    serverCache.delete(CACHE_KEYS.DATA_HASH);
    serverCache.delete(CACHE_KEYS.LAST_MODIFIED);
    
    const afterSize = serverCache.size;

    console.log(`🧹 Full file cache cleared: ${beforeSize} → ${afterSize} items`);

    return res.status(200).json({
      success: true,
      data: {
        cleared: true,
        itemsRemoved: beforeSize - afterSize
      },
      duration: Date.now() - startTime
    });

  } catch (error) {
    console.error('❌ Cache clear error:', error);
    return res.status(500).json({
      success: false,
      error: 'Cache clear failed',
      message: error.message,
      duration: Date.now() - startTime
    });
  }
}

// ✅ LEGACY GOOGLE SHEETS HANDLER (backward compatibility)
async function handleGoogleSheetsRequest(req, res, pathname, startTime) {
  const action = pathname.split('/').pop();
  
  console.log(`📊 Legacy Google Sheets request: ${action}`);

  switch (action) {
    case 'load':
      // Redirect to full file load
      return await loadFullFile(req, res, startTime);
    
    case 'column':
      return await getGoogleSheetsColumn(req, res, startTime);
    
    case 'check':
      return await checkGoogleSheetsChanges(req, res, startTime);
    
    case 'clear':
      return await clearFullFileCache(req, res, startTime);
    
    default:
      return res.status(404).json({
        success: false,
        error: 'Unknown Google Sheets action',
        message: 'Use /api/proxy/file/ endpoints instead'
      });
  }
}

// ✅ GET COLUMN (legacy compatibility)
async function getGoogleSheetsColumn(req, res, startTime) {
  try {
    const { columnIndex = 2, sheetName = 'Khách Hàng', forceReload = false } = req.method === 'POST' ? req.body : req.query;
    const colIndex = parseInt(columnIndex);

    if (isNaN(colIndex) || colIndex < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid column index'
      });
    }

    console.log(`📋 Getting column ${colIndex} from sheet ${sheetName}`);

    // Get or load full file data
    let fullData = serverCache.get(CACHE_KEYS.FULL_FILE_DATA);
    
    if (!fullData || forceReload) {
      await loadFullFile(req, res, startTime);
      fullData = serverCache.get(CACHE_KEYS.FULL_FILE_DATA);
    }

    if (!fullData || !fullData.sheets[sheetName]) {
      return res.status(404).json({
        success: false,
        error: 'Sheet not found',
        availableSheets: Object.keys(fullData?.sheets || {})
      });
    }

    // Extract column data
    const sheetData = fullData.sheets[sheetName];
    const columnData = [];
    
    if (sheetData.table && sheetData.table.rows) {
      // Skip header row (index 0)
      for (let i = 1; i < sheetData.table.rows.length; i++) {
        const row = sheetData.table.rows[i];
        
        if (row.c && row.c.length > colIndex) {
          const cell = row.c[colIndex];
          const value = cell?.v?.toString()?.trim();
          
          if (value && value.length > 0) {
            columnData.push(value);
          }
        }
      }
    }

    // Remove duplicates and sort
    const uniqueData = [...new Set(columnData)].sort();

    console.log(`✅ Extracted column ${colIndex}: ${uniqueData.length} unique items`);

    return res.status(200).json({
      success: true,
      data: uniqueData,
      meta: {
        columnIndex: colIndex,
        sheetName: sheetName,
        itemCount: uniqueData.length,
        totalRows: sheetData.table?.rows?.length || 0
      },
      duration: Date.now() - startTime
    });

  } catch (error) {
    console.error('❌ Column extraction error:', error);
    return res.status(500).json({
      success: false,
      error: 'Column extraction failed',
      message: error.message,
      duration: Date.now() - startTime
    });
  }
}

// ✅ CHECK CHANGES (legacy compatibility)
async function checkGoogleSheetsChanges(req, res, startTime) {
  try {
    const { clientHash } = req.method === 'POST' ? req.body : req.query;
    const serverHash = serverCache.get(CACHE_KEYS.DATA_HASH);
    
    const hasChanges = clientHash !== serverHash;
    const lastModified = serverCache.get(CACHE_KEYS.LAST_MODIFIED);

    console.log(`🔍 Change check - Client: ${clientHash}, Server: ${serverHash}, Changed: ${hasChanges}`);

    return res.status(200).json({
      success: true,
      data: {
        hasChanges: hasChanges,
        serverHash: serverHash,
        clientHash: clientHash,
        lastModified: lastModified,
        availableSheets: serverCache.get(CACHE_KEYS.SHEET_LIST) || []
      },
      duration: Date.now() - startTime
    });

  } catch (error) {
    console.error('❌ Change check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Change check failed',
      message: error.message,
      duration: Date.now() - startTime
    });
  }
}

// ✅ GENERAL PROXY FUNCTIONALITY (backward compatibility)
async function handleGeneralProxy(req, res, startTime) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed for general proxy',
      message: 'General proxy requires POST method'
    });
  }

  const { url, method = 'GET', data, headers: customHeaders = {} } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'Missing URL',
      message: 'URL parameter is required'
    });
  }

  // Validate URL
  let targetUrl;
  try {
    targetUrl = new URL(url);
  } catch (e) {
    return res.status(400).json({
      success: false,
      error: 'Invalid URL format'
    });
  }

  // Security whitelist
  const allowedHosts = [
    'script.google.com',
    'docs.google.com',
    'sheets.googleapis.com',
    'httpbin.org'
  ];
  
  if (!allowedHosts.includes(targetUrl.hostname)) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden host',
      message: `Host "${targetUrl.hostname}" is not allowed`
    });
  }

  // Make request
  try {
    const fetchOptions = {
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ZaLog-Proxy/5.0',
        ...customHeaders
      },
      signal: AbortSignal.timeout(15000)
    };

    if (['POST', 'PUT'].includes(method.toUpperCase()) && data) {
      fetchOptions.body = JSON.stringify(data);
    }

    const response = await fetch(url, fetchOptions);
    const contentType = response.headers.get('content-type') || '';
    
    let responseData;
    if (contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const textData = await response.text();
      try {
        responseData = JSON.parse(textData);
      } catch {
        responseData = textData;
      }
    }

    return res.status(200).json({
      success: response.ok,
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      duration: Date.now() - startTime
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Request failed',
      message: error.message,
      duration: Date.now() - startTime
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb', // Increased for full file data
    },
  },
  maxDuration: 60, // Increased for multiple sheet loading
}