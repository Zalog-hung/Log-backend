// api/proxy/file/load.js - Load Full File (All Sheets)
// Version: 1.0 - Individual endpoint for full file loading

// ✅ IMPORT CONFIG
import { API_URLS } from '../../../public/config.js';

// ✅ SERVER-SIDE CACHE STORAGE (shared across file endpoints)
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
    // Get configuration from request or use defaults from config.js
    const config = req.method === 'POST' ? req.body : {};
    const {
      khachHangUrl = API_URLS.KHACH_HANG_API_URL,
      logUrl = API_URLS.LOG_API_URL,
      fileId = config.fileId || extractFileIdFromUrl(khachHangUrl) || API_URLS.GOOGLE_SHEETS_FILE_ID,
      forceReload = false
    } = config;

    console.log('📁 Loading full file:', { fileId, forceReload });

    // ✅ Check cache first
    if (!forceReload) {
      const cachedData = serverCache.get(CACHE_KEYS.FULL_FILE_DATA);
      const lastModified = serverCache.get(CACHE_KEYS.LAST_MODIFIED);
      
      if (cachedData && lastModified) {
        const cacheAge = Date.now() - new Date(lastModified).getTime();
        const cacheMaxAge = 5 * 60 * 1000; // 5 minutes
        
        if (cacheAge < cacheMaxAge) {
          console.log('⚡ Returning cached full file data');
          return res.status(200).json({
            success: true,
            data: cachedData,
            meta: {
              fileId: fileId,
              sheetCount: Object.keys(cachedData.sheets).length,
              loadedSheets: Object.keys(cachedData.sheets),
              dataHash: serverCache.get(CACHE_KEYS.DATA_HASH),
              lastModified: lastModified,
              fromCache: true,
              cacheAge: cacheAge
            },
            duration: Date.now() - startTime
          });
        }
      }
    }

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
            const detectedNames = sheetsData.map(sheet => sheet.properties?.title || 'Unknown').filter(Boolean);
            if (detectedNames.length > 0) {
              sheetNames = detectedNames;
              console.log('📋 Detected sheet names:', sheetNames);
            }
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

    // Wait for all sheets to load
    const sheetResults = await Promise.allSettled(loadPromises);
    
    let successCount = 0;
    const failedSheets = [];
    
    sheetResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        fullFileData.sheets[result.value.name] = result.value.data;
        successCount++;
      } else {
        const sheetName = sheetNames[index];
        const error = result.reason || result.value?.error || 'Unknown error';
        failedSheets.push({ name: sheetName, error });
        console.warn(`❌ Sheet ${sheetName} failed:`, error);
      }
    });

    if (successCount === 0) {
      return res.status(500).json({
        success: false,
        error: 'No sheets could be loaded successfully',
        failedSheets: failedSheets,
        duration: Date.now() - startTime
      });
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
        failedSheets: failedSheets.length > 0 ? failedSheets : undefined,
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
          error: error.message,
          fallbackUsed: true
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

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
  maxDuration: 60,
};