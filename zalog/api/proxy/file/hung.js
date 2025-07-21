// api/proxy/file/sheet.js - Get Specific Sheet Data
// Version: 1.0 - Individual endpoint for sheet access

// ✅ IMPORT CONFIG
import { API_URLS } from '../../../public/config.js';

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
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

function parseGoogleSheetsResponse(rawData) {
  try {
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

// ✅ LOAD FULL FILE (shared function)
async function loadFullFile(config = {}) {
  const {
    khachHangUrl = API_URLS.KHACH_HANG_API_URL,
    logUrl = API_URLS.LOG_API_URL,
    fileId = config.fileId || extractFileIdFromUrl(khachHangUrl) || API_URLS.GOOGLE_SHEETS_FILE_ID
  } = config;

  console.log('📁 Loading full file:', { fileId });

  const fullFileData = {
    fileId: fileId,
    loadTime: new Date().toISOString(),
    sheets: {},
    apis: {
      khachHang: khachHangUrl,
      log: logUrl
    }
  };

  // ✅ Try to detect sheet names
  let sheetNames = ['Khách Hàng', 'Log', 'Data', 'Sheet1'];
  
  try {
    const metadataUrl = `https://docs.google.com/spreadsheets/d/${fileId}/edit#gid=0`;
    const metadataResponse = await fetch(metadataUrl, {
      headers: { 'User-Agent': 'ZaLog-Proxy/5.0' },
      signal: AbortSignal.timeout(10000)
    });
    
    if (metadataResponse.ok) {
      const html = await metadataResponse.text();
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

  // ✅ Load each sheet
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

  const sheetResults = await Promise.allSettled(loadPromises);
  
  let successCount = 0;
  sheetResults.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.success) {
      fullFileData.sheets[result.value.name] = result.value.data;
      successCount++;
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
  return fullFileData;
}

export default async function handler(req, res) {
  const startTime = Date.now();

  // ✅ CORS SETUP
  const allowedOrigins = [
    'https://zalog.vercel.app',
    'https://zalog-fdzpsa7o5-hung-za.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8080',
    'https://localhost',
    /^https:\/\/zalog-.+\.vercel\.app$/
  ];
  
  const origin = req.headers.origin;
  let isAllowedOrigin = false;
  
  if (allowedOrigins.includes(origin)) {
    isAllowedOrigin = true;
  } else {
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

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      message: 'Only GET and POST requests are supported'
    });
  }

  try {
    const { sheetName } = req.method === 'POST' ? req.body : req.query;
    
    if (!sheetName) {
      return res.status(400).json({
        success: false,
        error: 'Missing sheetName parameter',
        message: 'Please provide sheetName in request body or query'
      });
    }

    console.log(`📊 Getting sheet: ${sheetName}`);

    let fullData = serverCache.get(CACHE_KEYS.FULL_FILE_DATA);
    
    if (!fullData || !fullData.sheets[sheetName]) {
      console.log('🔄 Cache miss or sheet not found, loading full file...');
      
      try {
        // Get config from request for loadFullFile
        const config = req.method === 'POST' ? req.body : {};
        fullData = await loadFullFile(config);
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to load full file',
          message: error.message,
          duration: Date.now() - startTime
        });
      }
      
      if (!fullData.sheets[sheetName]) {
        return res.status(404).json({
          success: false,
          error: 'Sheet not found',
          message: `Sheet "${sheetName}" not found in file`,
          availableSheets: Object.keys(fullData.sheets),
          duration: Date.now() - startTime
        });
      }
    }

    const sheetData = fullData.sheets[sheetName];

    console.log(`✅ Sheet ${sheetName} retrieved successfully`);

    return res.status(200).json({
      success: true,
      data: sheetData,
      meta: {
        sheetName: sheetName,
        rowCount: sheetData.table?.rows?.length || 0,
        colCount: sheetData.table?.cols?.length || 0,
        lastModified: serverCache.get(CACHE_KEYS.LAST_MODIFIED),
        fromCache: !!serverCache.get(CACHE_KEYS.FULL_FILE_DATA)
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

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '2mb',
    },
  },
  maxDuration: 30,
};