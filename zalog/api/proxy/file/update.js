// api/proxy/file/check.js - Check Data Changes
// Version: 1.0 - Individual endpoint for checking data changes

// ✅ IMPORT CONFIG
import { API_URLS } from '../../../public/config.js';

// ✅ SERVER-SIDE CACHE STORAGE (shared)
let serverCache = new Map();
const CACHE_KEYS = {
  FULL_FILE_DATA: 'full_file_data',
  SHEET_LIST: 'sheet_list',
  LAST_MODIFIED: 'last_modified',
  DATA_HASH: 'data_hash'
};

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
    const { clientHash, forceCheck = false } = req.method === 'POST' ? req.body : req.query;
    
    console.log('🔍 Checking data changes:', { clientHash, forceCheck });

    // ✅ Get server-side data hash
    const serverHash = serverCache.get(CACHE_KEYS.DATA_HASH);
    const lastModified = serverCache.get(CACHE_KEYS.LAST_MODIFIED);
    const sheetList = serverCache.get(CACHE_KEYS.SHEET_LIST) || [];
    const fullData = serverCache.get(CACHE_KEYS.FULL_FILE_DATA);

    // ✅ Check if cache exists
    if (!serverHash || !lastModified || !fullData) {
      return res.status(200).json({
        success: true,
        data: {
          hasChanges: true,
          serverHash: null,
          clientHash: clientHash,
          lastModified: null,
          availableSheets: [],
          cacheStatus: 'empty',
          recommendation: 'Load full file data first'
        },
        duration: Date.now() - startTime
      });
    }

    // ✅ Compare hashes
    const hasChanges = clientHash !== serverHash;
    
    // ✅ Calculate cache age
    const cacheAge = Date.now() - new Date(lastModified).getTime();
    const cacheMaxAge = 5 * 60 * 1000; // 5 minutes
    const isCacheStale = cacheAge > cacheMaxAge;

    // ✅ Enhanced change detection
    let changeDetails = {
      hashChanged: hasChanges,
      cacheStale: isCacheStale,
      cacheAge: cacheAge,
      shouldReload: hasChanges || isCacheStale || forceCheck
    };

    // ✅ If force check, try to detect specific changes
    if (forceCheck && fullData) {
      changeDetails.sheetCount = Object.keys(fullData.sheets).length;
      changeDetails.sheetNames = Object.keys(fullData.sheets);
      
      // Calculate row counts for each sheet
      changeDetails.sheetSummary = {};
      Object.entries(fullData.sheets).forEach(([sheetName, sheetData]) => {
        changeDetails.sheetSummary[sheetName] = {
          rows: sheetData.table?.rows?.length || 0,
          cols: sheetData.table?.cols?.length || 0
        };
      });
    }

    console.log(`🔍 Change check result:`, {
      clientHash,
      serverHash,
      hasChanges,
      isCacheStale,
      shouldReload: changeDetails.shouldReload
    });

    return res.status(200).json({
      success: true,
      data: {
        hasChanges: hasChanges,
        serverHash: serverHash,
        clientHash: clientHash,
        lastModified: lastModified,
        availableSheets: sheetList,
        cacheStatus: isCacheStale ? 'stale' : 'fresh',
        changeDetails: changeDetails,
        meta: {
          cacheAge: cacheAge,
          cacheMaxAge: cacheMaxAge,
          recommendation: changeDetails.shouldReload ? 'reload_data' : 'use_cache'
        }
      },
      duration: Date.now() - startTime
    });

  } catch (error) {
    console.error('❌ Change check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Change check failed',
      message: error.message,
      data: {
        hasChanges: true, // Assume changes on error
        serverHash: null,
        clientHash: req.body?.clientHash || req.query?.clientHash,
        recommendation: 'reload_data_due_to_error'
      },
      duration: Date.now() - startTime
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100kb',
    },
  },
  maxDuration: 5,
};