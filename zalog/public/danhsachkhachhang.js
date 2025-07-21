// 📁 danhsachkhachhang.js - FIXED CORS (Use Local Proxy Only)
import { API_URLS } from '/config.js';
const API_URL = API_URLS.KHACH_HANG_API;

// Version: 3.1 - All calls via local proxy to avoid CORS
// ✅ PERFORMANCE OPTIMIZATIONS
const PERF_CONFIG = {
  DEBOUNCE_DELAY: 80,        // Reduced from 150ms
  MAX_SUGGESTIONS: 8,        // Reduced from 10
  CACHE_TTL: 300000,         // 5 minutes cache
  API_TIMEOUT: 5000,         // 5 second timeout
  RETRY_COUNT: 2             // Max 2 retries
};

// ✅ SMART CACHING SYSTEM
class CustomerCache {
  constructor() {
    this.data = [];
    this.timestamp = 0;
    this.isLoading = false;
    this.loadPromise = null;
  }

  isValid() {
    return this.data.length > 0 && (Date.now() - this.timestamp) < PERF_CONFIG.CACHE_TTL;
  }

  set(data) {
    this.data = Array.isArray(data) ? data : [];
    this.timestamp = Date.now();
    console.log(`📦 Cache updated: ${this.data.length} customers`);
  }

  get() {
    return this.data;
  }

  clear() {
    this.data = [];
    this.timestamp = 0;
  }
}

// ✅ Global cache instance
const customerCache = new CustomerCache();

// ✅ Fallback data cho offline mode
const FALLBACK_CUSTOMERS = [
  "ABC Company", "DEF Corp", "XYZ Ltd", "Dewberry",
  "Samsung", "LG", "Sony", "Panasonic", "Toshiba",
  "Vinamilk", "Unilever", "P&G", "Nestle", "Coca Cola",
  "Pepsi", "Red Bull", "Saigon Beer", "Heineken", "Tiger Beer"
];

// ✅ FIXED API LOADER - Chỉ dùng local proxy
export async function loadKhachHangList() {
  // Return cache if valid
  if (customerCache.isValid()) {
    console.log('⚡ Using cached customer list');
    return customerCache.get();
  }

  // If already loading, wait for existing promise
  if (customerCache.isLoading && customerCache.loadPromise) {
    console.log('⏳ Waiting for existing load...');
    return await customerCache.loadPromise;
  }

  console.log('🔄 Loading fresh customer list...');
  customerCache.isLoading = true;

  customerCache.loadPromise = (async () => {
    // ✅ STRATEGY 1: Try local proxy first
    try {
      console.log('🌐 Attempting local proxy call...');
      const data = await loadViaLocalProxy();
      if (data && data.length > 0) {
        console.log(`✅ Local proxy success: ${data.length} customers loaded`);
        customerCache.set(data);
        updateGlobalCache(data);
        return data;
      } else {
        console.warn('⚠️ Local proxy returned empty data');
      }
    } catch (err) {
      console.error('❌ Local proxy failed:', {
        message: err.message,
        name: err.name
      });
    }

    // ✅ STRATEGY 2: Try full file load via local proxy
    try {
      console.log('📁 Attempting full file load via local proxy...');
      const data = await loadViaFullFileProxy();
      if (data && data.length > 0) {
        console.log(`✅ Full file proxy success: ${data.length} customers loaded`);
        customerCache.set(data);
        updateGlobalCache(data);
        return data;
      } else {
        console.warn('⚠️ Full file proxy returned empty data');
      }
    } catch (err) {
      console.error('❌ Full file proxy failed:', {
        message: err.message,
        name: err.name
      });
    }

    // ✅ STRATEGY 3: Use fallback data
    console.log('📋 Using fallback customer list (all proxies failed)');
    customerCache.set(FALLBACK_CUSTOMERS);
    updateGlobalCache(FALLBACK_CUSTOMERS);
    return FALLBACK_CUSTOMERS;

  })().finally(() => {
    customerCache.isLoading = false;
    customerCache.loadPromise = null;
  });

  return await customerCache.loadPromise;
}

// ✅ FIXED: Load via local proxy only - NO external calls
async function loadViaLocalProxy() {
  const API_URL = window.KHACH_HANG_API_URL;
  if (!API_URL) {
    throw new Error('Missing KHACH_HANG_API_URL from cauhinh.js');
  }

  console.log('📡 Loading via LOCAL proxy:', API_URL);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PERF_CONFIG.API_TIMEOUT);

  try {
    // ✅ FIXED: Always use local proxy (/api/proxy)
    const response = await fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: API_URL,
        method: 'GET'
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Local proxy HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(`Local proxy error: ${result.error || result.message || 'Unknown error'}`);
    }

    const data = result.data;
    if (!Array.isArray(data)) {
      throw new Error('Invalid data format from local proxy');
    }

    // Filter valid customers
    const validCustomers = data
      .filter(item => typeof item === 'string' && item.trim().length > 0)
      .map(item => item.trim());

    console.log(`✅ Loaded ${validCustomers.length} customers via local proxy`);
    return validCustomers;

  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// ✅ NEW: Load via full file proxy (enhanced approach)
async function loadViaFullFileProxy() {
  console.log('📁 Loading customer list via full file proxy...');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PERF_CONFIG.API_TIMEOUT);

  try {
    // ✅ Try to get specific sheet with customer data
    const response = await fetch('/api/proxy/file/sheet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sheetName: 'Khách Hàng'  // Default sheet name for customers
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Full file proxy HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(`Full file proxy error: ${result.error || result.message || 'Unknown error'}`);
    }

    const sheetData = result.data;
    if (!sheetData?.table?.rows) {
      throw new Error('Invalid sheet data format');
    }

    // Extract customer names from column 2 (index 2)
    const customers = [];
    for (let i = 1; i < sheetData.table.rows.length; i++) { // Skip header
      const row = sheetData.table.rows[i];
      if (row.c && row.c.length > 2) {
        const cell = row.c[2]; // Column 2 for customer names
        const value = cell?.v?.toString()?.trim();
        
        if (value && value.length > 0) {
          customers.push(value);
        }
      }
    }

    // Remove duplicates and sort
    const uniqueCustomers = [...new Set(customers)].sort();

    console.log(`✅ Loaded ${uniqueCustomers.length} customers via full file proxy`);
    return uniqueCustomers;

  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// ✅ Update global cache
function updateGlobalCache(data) {
  if (window.zacache) {
    window.zacache.khachHangList = data;
    window.zacache.lastUpdated = new Date().toISOString();
    console.log('✅ Updated zacache.khachHangList');
  }
}

// ✅ OPTIMIZED SUGGESTION SYSTEM
class SuggestionBox {
  constructor() {
    this.element = null;
    this.currentInput = null;
    this.isVisible = false;
  }

  create() {
    if (this.element) return this.element;

    this.element = document.createElement('div');
    this.element.className = 'suggestions-container optimized';
    this.element.style.cssText = `
      position: absolute;
      z-index: 9999;
      border: 1px solid #ccc;
      background: #fff;
      max-height: 160px;
      overflow-y: auto;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      border-radius: 4px;
      display: none;
    `;
    
    document.body.appendChild(this.element);
    return this.element;
  }

  show(input, suggestions) {
    if (!this.element) this.create();
    
    this.currentInput = input;
    this.element.innerHTML = '';

    if (!suggestions.length) {
      this.hide();
      return;
    }

    // Position calculation
    const rect = input.getBoundingClientRect();
    this.element.style.left = `${rect.left + window.scrollX}px`;
    this.element.style.top = `${rect.bottom + window.scrollY + 2}px`;
    this.element.style.width = `${Math.max(rect.width, 200)}px`;

    // Create suggestion items (reuse for performance)
    const fragment = document.createDocumentFragment();

    suggestions.forEach((customer, index) => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      item.textContent = customer;
      item.style.cssText = `
        padding: 8px 12px;
        cursor: pointer;
        border-bottom: 1px solid #f0f0f0;
        transition: background-color 0.1s ease;
      `;

      // Optimized event listeners
      item.onmouseenter = () => item.style.backgroundColor = '#f0f8ff';
      item.onmouseleave = () => item.style.backgroundColor = '';
      item.onmousedown = (e) => {
        e.preventDefault();
        this.selectCustomer(customer);
      };

      fragment.appendChild(item);
    });

    this.element.appendChild(fragment);
    this.element.style.display = 'block';
    this.isVisible = true;
  }

  hide() {
    if (this.element) {
      this.element.style.display = 'none';
      this.isVisible = false;
    }
  }

  selectCustomer(customer) {
    if (!this.currentInput) return;

    const currentVal = this.currentInput.value;
    const lastPlusIndex = currentVal.lastIndexOf('+');

    if (lastPlusIndex === -1) {
      this.currentInput.value = customer;
    } else {
      const beforePlus = currentVal.slice(0, lastPlusIndex + 1);
      this.currentInput.value = beforePlus + ' ' + customer;
    }

    this.hide();
    this.currentInput.focus();

    // Set cursor to end
    setTimeout(() => {
      if (this.currentInput) {
        this.currentInput.selectionStart = this.currentInput.selectionEnd = this.currentInput.value.length;
      }
    }, 0);
  }

  destroy() {
    if (this.element && document.body.contains(this.element)) {
      document.body.removeChild(this.element);
    }
    this.element = null;
    this.currentInput = null;
    this.isVisible = false;
  }
}

// ✅ Global suggestion box instance
let globalSuggestionBox = null;

// ✅ OPTIMIZED AUTOCOMPLETE với debouncing
export function goiykh(input) {
  if (!input || !input.addEventListener) {
    console.warn("⚠️ goiykh: Invalid input");
    return;
  }

  // Prevent multiple attachments
  if (input._goiykh_attached) {
    return;
  }

  // Create shared suggestion box if needed
  if (!globalSuggestionBox) {
    globalSuggestionBox = new SuggestionBox();
  }

  let debounceTimer = null;

  // ✅ Optimized suggestion update
  const updateSuggestions = async () => {
    try {
      // Get current customer list (cached)
      const customers = customerCache.isValid() 
        ? customerCache.get()
        : await loadKhachHangList();

      if (!customers.length) {
        globalSuggestionBox.hide();
        return;
      }

      const val = input.value;
      const lastPlusIndex = val.lastIndexOf('+');
      const searchText = lastPlusIndex === -1
        ? val.trim().toLowerCase()
        : val.slice(lastPlusIndex + 1).trim().toLowerCase();

      if (!searchText) {
        globalSuggestionBox.hide();
        return;
      }

      // Fast filtering with early termination
      const filtered = [];
      for (const customer of customers) {
        if (customer.toLowerCase().includes(searchText)) {
          filtered.push(customer);
          if (filtered.length >= PERF_CONFIG.MAX_SUGGESTIONS) break;
        }
      }

      globalSuggestionBox.show(input, filtered);

    } catch (err) {
      console.error("❌ Suggestion update error:", err);
      globalSuggestionBox.hide();
    }
  };

  // ✅ Event listeners
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updateSuggestions, PERF_CONFIG.DEBOUNCE_DELAY);
  });

  input.addEventListener('blur', () => {
    // Delay to allow click selection
    setTimeout(() => globalSuggestionBox.hide(), 150);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      globalSuggestionBox.hide();
    }
  });

  // Mark as attached
  input._goiykh_attached = true;

  // Store cleanup function
  input._goiykh_cleanup = () => {
    clearTimeout(debounceTimer);
    if (globalSuggestionBox && globalSuggestionBox.currentInput === input) {
      globalSuggestionBox.hide();
    }
  };
}

// ✅ CLEANUP FUNCTIONS
export function cleanupAllSuggestions() {
  // Cleanup global suggestion box
  if (globalSuggestionBox) {
    globalSuggestionBox.destroy();
    globalSuggestionBox = null;
  }

  // Cleanup individual input listeners
  document.querySelectorAll('input[data-col="2"]').forEach(input => {
    if (typeof input._goiykh_cleanup === 'function') {
      input._goiykh_cleanup();
    }
    input._goiykh_attached = false;
  });

  console.log('🧹 All suggestions cleaned up');
}

// ✅ FORCE RELOAD FUNCTION
export async function forceReloadCustomers() {
  try {
    console.log('🔄 Force reloading customers...');
    customerCache.clear();
    
    // Clear any cache on server side too
    try {
      await fetch('/api/proxy/file/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('✅ Server cache cleared');
    } catch (e) {
      console.warn('⚠️ Could not clear server cache:', e.message);
    }
    
    const data = await loadKhachHangList();
    console.log(`✅ Force reload completed: ${data.length} customers`);
    return data;
  } catch (error) {
    console.error('❌ Force reload failed:', error);
    throw error;
  }
}

// ✅ PRELOAD CUSTOMER LIST khi module load
(async () => {
  try {
    console.log('🚀 Preloading customer list...');
    await loadKhachHangList();
    console.log('✅ Customer list preloaded successfully');
  } catch (err) {
    console.warn('⚠️ Preload failed, will use fallback:', err.message);
  }
})();

// ✅ Export to window
window.loadKhachHangList = loadKhachHangList;
window.goiykh = goiykh;
window.cleanupAllSuggestions = cleanupAllSuggestions;
window.forceReloadCustomers = forceReloadCustomers;

// ✅ Debug functions
window.debugCustomerCache = () => {
  console.log('📊 Customer Cache Debug:', {
    isValid: customerCache.isValid(),
    count: customerCache.get().length,
    age: Date.now() - customerCache.timestamp,
    isLoading: customerCache.isLoading,
    sampleData: customerCache.get().slice(0, 5)
  });
  return customerCache.get();
};

// ✅ Test connectivity
window.testCustomerAPI = async () => {
  try {
    console.log('🧪 Testing customer API connectivity...');
    
    // Test local proxy
    const proxyResponse = await fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: window.KHACH_HANG_API_URL,
        method: 'GET'
      })
    });
    
    console.log('📡 Local proxy test:', {
      ok: proxyResponse.ok,
      status: proxyResponse.status,
      statusText: proxyResponse.statusText
    });
    
    if (proxyResponse.ok) {
      const result = await proxyResponse.json();
      console.log('✅ Local proxy result:', {
        success: result.success,
        dataType: typeof result.data,
        dataLength: Array.isArray(result.data) ? result.data.length : 'N/A'
      });
    }
    
    // Test full file proxy
    const fileResponse = await fetch('/api/proxy/file/sheet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sheetName: 'Khách Hàng'
      })
    });
    
    console.log('📁 Full file proxy test:', {
      ok: fileResponse.ok,
      status: fileResponse.status,
      statusText: fileResponse.statusText
    });
    
    if (fileResponse.ok) {
      const result = await fileResponse.json();
      console.log('✅ Full file proxy result:', {
        success: result.success,
        hasData: !!result.data,
        rowCount: result.data?.table?.rows?.length || 0
      });
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ API test failed:', error);
    return false;
  }
};