// api/proxy/file/clear.js - Clear Cache
// Version: 1.0 - Individual endpoint for cache clearing

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
    const beforeSize = serverCache.size;
    const beforeKeys = Array.from(serverCache.keys());
    
    // ✅ Clear all cache keys
    serverCache.delete(CACHE_KEYS.FULL_FILE_DATA);
    serverCache.delete(CACHE_KEYS.SHEET_LIST);
    serverCache.delete(CACHE_KEYS.DATA_HASH);
    serverCache.delete(CACHE_KEYS.LAST_MODIFIED);
    
    const afterSize = serverCache.size;
    const clearedCount = beforeSize - afterSize;

    console.log(`🧹 Cache cleared: ${beforeSize} → ${afterSize} items, removed ${clearedCount} items`);

    return res.status(200).json({
      success: true,
      data: {
        cleared: true,
        itemsRemoved: clearedCount,
        beforeSize: beforeSize,
        afterSize: afterSize,
        clearedKeys: Object.values(CACHE_KEYS),
        remainingKeys: Array.from(serverCache.keys())
      },
      meta: {
        operation: 'clear_cache',
        timestamp: new Date().toISOString()
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

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100kb',
    },
  },
  maxDuration: 5,
};