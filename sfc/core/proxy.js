// 📁 proxy.js - API Trung gian tránh CORS
// Version: 1.0 - Đặt tên link theo logic Google Sheets config

// ✅ IMPORT CONFIG
import { GOOGLE_SHEETS_APIS, API_CONFIG, CORS_CONFIG } from './config.js';

// ✅ CACHE STORAGE
let apiCache = new Map();

export default async function handler(req, res) {
  const startTime = Date.now();

  // ✅ CORS SETUP
  const origin = req.headers.origin;
  const isAllowed = CORS_CONFIG.ALLOWED_ORIGINS.some(allowed => {
    if (typeof allowed === 'string') {
      return allowed === origin || allowed === '*';
    }
    return allowed instanceof RegExp && allowed.test(origin);
  });

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', CORS_CONFIG.ALLOWED_METHODS.join(','));
  res.setHeader('Access-Control-Allow-Headers', CORS_CONFIG.ALLOWED_HEADERS.join(','));
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // ✅ ROUTE THEO LOGIC GOOGLE SHEETS
    const { pathname } = new URL(req.url, `http://${req.headers.host}`);
    
    // Route: /api/proxy/final, /api/proxy/log, /api/proxy/bangluong, etc.
    if (pathname.startsWith('/api/proxy/')) {
      const apiName = pathname.replace('/api/proxy/', '').split('/')[0];
      return await handleGoogleSheetsAPI(req, res, apiName, startTime);
    }

    // Fallback general proxy
    return await handleGeneralProxy(req, res, startTime);

  } catch (error) {
    console.error('❌ Proxy error:', error);
    return res.status(200).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    });
  }
}

// ✅ XỬ LÝ GOOGLE SHEETS API THEO TÊN
async function handleGoogleSheetsAPI(req, res, apiName, startTime) {
  try {
    console.log(`📊 Handling Google Sheets API: ${apiName}`);

    // Tìm API config theo tên
    const apiConfig = Object.values(GOOGLE_SHEETS_APIS).find(
      api => api.name === apiName.toLowerCase()
    );

    if (!apiConfig) {
      return res.status(200).json({
        success: false,
        error: 'API not found',
        message: `API "${apiName}" không tồn tại`,
        availableAPIs: Object.values(GOOGLE_SHEETS_APIS).map(api => api.name),
        duration: Date.now() - startTime
      });
    }

    // Check cache trước
    const cacheKey = `${apiName}_${JSON.stringify(req.body || {})}`;
    const cached = apiCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < API_CONFIG.CACHE_TTL) {
      console.log(`⚡ Cache hit for ${apiName}`);
      return res.status(200).json({
        success: true,
        data: cached.data,
        fromCache: true,
        timestamp: cached.timestamp,
        duration: Date.now() - startTime
      });
    }

    // Gọi Google Apps Script
    const response = await fetchWithRetry(apiConfig.url, {
      method: req.method || 'GET',
      headers: API_CONFIG.HEADERS,
      body: req.body ? JSON.stringify(req.body) : undefined,
      signal: AbortSignal.timeout(API_CONFIG.TIMEOUT)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Cache kết quả
    apiCache.set(cacheKey, {
      data: data,
      timestamp: Date.now()
    });

    console.log(`✅ ${apiName} API success`);

    return res.status(200).json({
      success: true,
      data: data,
      api: apiConfig.name,
      sheetName: apiConfig.sheetName,
      fromCache: false,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    });

  } catch (error) {
    console.error(`❌ ${apiName} API error:`, error.message);
    
    return res.status(200).json({
      success: false,
      error: error.message,
      api: apiName,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    });
  }
}

// ✅ XỬ LÝ GENERAL PROXY (FALLBACK)
async function handleGeneralProxy(req, res, startTime) {
  try {
    if (req.method !== 'POST') {
      return res.status(200).json({
        success: false,
        error: 'Method not allowed',
        message: 'General proxy requires POST method'
      });
    }

    const { url, method = 'GET', data } = req.body;

    if (!url) {
      return res.status(200).json({
        success: false,
        error: 'Missing URL',
        message: 'URL parameter is required'
      });
    }

    // Validate URL
    try {
      new URL(url);
    } catch (e) {
      return res.status(200).json({
        success: false,
        error: 'Invalid URL format'
      });
    }

    console.log(`🔗 General proxy: ${method} ${url}`);

    const response = await fetchWithRetry(url, {
      method: method.toUpperCase(),
      headers: API_CONFIG.HEADERS,
      body: data ? JSON.stringify(data) : undefined,
      signal: AbortSignal.timeout(API_CONFIG.TIMEOUT)
    });

    const responseData = await response.json();

    return res.status(200).json({
      success: response.ok,
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      duration: Date.now() - startTime
    });

  } catch (error) {
    return res.status(200).json({
      success: false,
      error: error.message,
      duration: Date.now() - startTime
    });
  }
}

// ✅ FETCH WITH RETRY
async function fetchWithRetry(url, options, retries = API_CONFIG.RETRY_COUNT) {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
      
      if (i === retries) {
        return response; // Return last response even if not ok
      }
      
    } catch (error) {
      if (i === retries) {
        throw error;
      }
      
      console.warn(`⚠️ Retry ${i + 1}/${retries} for ${url}:`, error.message);
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY));
    }
  }
}

// ✅ CLEAR CACHE FUNCTION
export function clearCache() {
  apiCache.clear();
  console.log('🧹 API cache cleared');
}

// ✅ GET CACHE STATUS
export function getCacheStatus() {
  return {
    size: apiCache.size,
    keys: Array.from(apiCache.keys()),
    totalSize: JSON.stringify(Array.from(apiCache.values())).length
  };
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
  maxDuration: 30,
};