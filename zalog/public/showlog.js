// 📁 showlog.js - FIXED CORS (Use Local Proxy Only)
// Version: 3.1 - All calls via local proxy to avoid CORS

// ✅ FIXED Function cập nhật log - Chỉ dùng local proxy
function updateLog(row, col, value) {
  try {
    console.log(`📝 Cập nhật log [${row},${col}]: "${value}"`);

    // ✅ FIXED: Sử dụng local proxy thay vì external call
    fetch('/api/proxy/file/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update',
        row: row,
        col: col,
        value: value,
        sheetName: 'Log' // Specify log sheet
      })
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        if (data.success) {
          console.log(`✅ Ghi thành công log [${row},${col}]:`, data);
        } else {
          console.warn('⚠️ Update log không thành công:', data);
        }
      })
      .catch(err => {
        console.warn('⚠️ Lỗi gửi log:', err);
        // Không alert để không làm phiền user
      });
  } catch (e) {
    console.warn('⚠️ updateLog() lỗi:', e);
  }
}

// ✅ FIXED Hiển thị log chính - Sử dụng local proxy
export async function ShowLog() {
  const logReady = document.getElementById('logReady');
  const logLoading = document.getElementById('logLoading');
  const logFound = document.getElementById('logFound');
  const logCount = document.getElementById('logCount');
  const logTableContainer = document.getElementById('logTableContainer');
  const logArea = document.getElementById('logArea');

  // Kiểm tra elements tồn tại
  if (!logReady || !logLoading || !logFound || !logCount || !logTableContainer || !logArea) {
    console.error("❌ Không tìm thấy các elements log cần thiết");
    return;
  }

  console.log("🔄 Bắt đầu load log…");

  // Hiển thị trạng thái loading
  logReady.style.display = 'none';
  logFound.style.display = 'none';
  logLoading.style.display = 'block';
  logTableContainer.innerHTML = '';

  try {
    let data;

    // ✅ Ưu tiên dùng cache nếu có
    const zacache = window.zacache;
    if (Array.isArray(zacache?.cacherlog) && zacache.cacherlog.length > 1) {
      console.log('⚡ Sử dụng log từ cache');
      data = zacache.cacherlog;
    } else {
      console.log('🌐 Fetch log từ API...');
      
      // ✅ FIXED: Try multiple strategies via local proxy
      data = await loadLogViaProxy();
    }

    // Validate dữ liệu
    if (!Array.isArray(data)) {
      throw new Error("❌ Dữ liệu trả về không phải mảng! " + JSON.stringify(data));
    }

    if (data.length <= 1) {
      logLoading.style.display = 'none';
      logReady.textContent = '⚠️ Không có dữ liệu log.';
      logReady.style.display = 'block';
      return;
    }

    // Lưu vào cache
    if (zacache) {
      zacache.cacherlog = data.map(row => [...row]);
      console.log('📦 Đã lưu log vào cache:', zacache.cacherlog.length, 'dòng');
    }

    // Ẩn loading, hiện found
    logLoading.style.display = 'none';
    logFound.style.display = 'block';
    logCount.textContent = data.length - 1;

    // ✅ Tạo bảng log với performance tối ưu
    console.time('Tạo bảng log');

    const wrapper = document.createElement('div');
    wrapper.className = 'log-wrapper';

    const table = document.createElement('table');
    table.className = 'log-table';

    // Helper tạo cell
    const createCell = (content, isHeader = false) => {
      const cell = document.createElement(isHeader ? 'th' : 'td');
      cell.className = isHeader ? 'log-cell log-header' : 'log-cell';
      cell.textContent = content || '';
      return cell;
    };

    // Tạo header
    const headerRow = document.createElement('tr');
    const headers = Array.isArray(data[0]) ? data[0] : Object.values(data[0]);

    for (let i = 0; i < Math.min(26, headers.length); i++) {
      headerRow.appendChild(createCell(headers[i], true));
    }
    table.appendChild(headerRow);

    // Tạo data rows
    const fragment = document.createDocumentFragment();

    for (let i = 1; i < data.length; i++) {
      const rawRow = data[i] || [];
      
      // Skip empty rows
      if (rawRow.slice(0, 26).every(cell => !cell || cell === '')) {
        continue;
      }

      const tr = document.createElement('tr');
      
      for (let col = 0; col < 26; col++) {
        const td = createCell(rawRow[col]);
        td.contentEditable = true;
        td.dataset.row = i;
        td.dataset.col = col;
        
        // Thêm event listener cho edit
        td.addEventListener('blur', () => {
          const newValue = td.textContent.trim();
          const oldValue = rawRow[col] || '';
          
          if (newValue !== oldValue && zacache?.cacherlog?.[i]) {
            zacache.cacherlog[i][col] = newValue;
            console.log(`📝 Đã cập nhật cache [${i},${col}]: "${oldValue}" → "${newValue}"`);
          }
        });
        
        tr.appendChild(td);
      }
      
      fragment.appendChild(tr);
    }

    table.appendChild(fragment);
    wrapper.appendChild(table);

    console.timeEnd('Tạo bảng log');

    // Thêm vào DOM
    logTableContainer.appendChild(wrapper);

    // ✅ Tạo nút cập nhật nếu chưa có
    if (!document.querySelector('.log-button-container .log-update-button')) {
      let container = document.querySelector('.log-button-container');
      if (!container) {
        container = document.createElement('div');
        container.className = 'log-button-container';
        logArea.insertBefore(container, logTableContainer);
      }

      const reloadBtn = document.createElement('button');
      reloadBtn.textContent = '[LOG] Cập Nhật';
      reloadBtn.className = 'log-update-button';
      reloadBtn.onclick = () => {
        if (typeof window.capNhatLog === 'function') {
          window.capNhatLog();
        } else {
          capNhatLogFallback();
        }
      };

      container.appendChild(reloadBtn);
    }

    console.log("✅ Hiển thị log hoàn thành");

  } catch (err) {
    console.error("❌ Lỗi khi tải log:", err);
    logLoading.style.display = 'none';
    logReady.textContent = `❌ Lỗi: ${err.message}`;
    logReady.style.display = 'block';
  }
}

// ✅ NEW: Load log via local proxy - Multiple strategies
async function loadLogViaProxy() {
  console.log('🔄 Loading log via local proxy...');

  // ✅ STRATEGY 1: Try full file approach (load specific log sheet)
  try {
    console.log('📁 Strategy 1: Loading log sheet via file proxy...');
    const response = await fetch('/api/proxy/file/sheet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sheetName: 'Log' // Assume log data is in 'Log' sheet
      })
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data?.table?.rows) {
        const rows = result.data.table.rows.map(row => {
          const rowData = [];
          if (row.c) {
            for (let i = 0; i < 26; i++) { // Extract up to 26 columns
              rowData[i] = row.c[i]?.v || '';
            }
          }
          return rowData;
        });
        
        console.log(`✅ Strategy 1 success: ${rows.length} rows from log sheet`);
        return rows;
      }
    }
    console.warn('⚠️ Strategy 1 failed or returned no data');
  } catch (err) {
    console.error('❌ Strategy 1 error:', err.message);
  }

  // ✅ STRATEGY 2: Try legacy general proxy with LOG_API_URL
  try {
    console.log('📡 Strategy 2: Loading via general proxy with LOG_API_URL...');
    
    const LOG_API_URL = window.LOG_API_URL;
    if (!LOG_API_URL) {
      throw new Error('Missing LOG_API_URL from cauhinh.js');
    }

    const response = await fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: LOG_API_URL,
        method: 'POST',
        data: { action: 'read' }
      })
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        console.log(`✅ Strategy 2 success: ${result.data.length} rows from LOG_API_URL`);
        return result.data;
      }
    }
    console.warn('⚠️ Strategy 2 failed or returned no data');
  } catch (err) {
    console.error('❌ Strategy 2 error:', err.message);
  }

  // ✅ STRATEGY 3: Try to load full file and extract log data
  try {
    console.log('📊 Strategy 3: Loading full file and extracting log...');
    const response = await fetch('/api/proxy/file/load', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        logUrl: window.LOG_API_URL
      })
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data?.sheets) {
        // Try to find log data in any sheet
        const logSheetNames = ['Log', 'Logs', 'Data', 'Sheet1'];
        
        for (const sheetName of logSheetNames) {
          const sheetData = result.data.sheets[sheetName];
          if (sheetData?.table?.rows && sheetData.table.rows.length > 1) {
            const rows = sheetData.table.rows.map(row => {
              const rowData = [];
              if (row.c) {
                for (let i = 0; i < 26; i++) {
                  rowData[i] = row.c[i]?.v || '';
                }
              }
              return rowData;
            });
            
            console.log(`✅ Strategy 3 success: ${rows.length} rows from ${sheetName} sheet`);
            return rows;
          }
        }
      }
    }
    console.warn('⚠️ Strategy 3 failed or found no log data');
  } catch (err) {
    console.error('❌ Strategy 3 error:', err.message);
  }

  // ✅ All strategies failed
  throw new Error('Tất cả các phương thức load log đều thất bại. Kiểm tra kết nối mạng và cấu hình API.');
}

// ✅ FIXED Function cập nhật log fallback - Enhanced với local proxy
function capNhatLogFallback() {
  console.log('🔄 Cập nhật log fallback…');

  try {
    const cells = document.querySelectorAll('.log-table td[contenteditable="true"]');
    const zacache = window.zacache;

    if (!Array.isArray(zacache?.cacherlog) || zacache.cacherlog.length === 0) {
      alert('⚠️ Chưa có dữ liệu trong cache!');
      return;
    }

    const thayDoi = [];

    cells.forEach(td => {
      const row = parseInt(td.dataset.row);
      const col = parseInt(td.dataset.col);
      const value = td.textContent.trim();

      if (
        Number.isInteger(row) &&
        Number.isInteger(col) &&
        zacache.cacherlog[row] &&
        typeof zacache.cacherlog[row][col] !== 'undefined'
      ) {
        const oldVal = String(zacache.cacherlog[row][col]).trim();
        if (value !== oldVal) {
          thayDoi.push({ row, col, oldVal, newVal: value });
        }
      }
    });

    if (thayDoi.length === 0) {
      alert('✅ Không có ô nào thay đổi.');
      return;
    }

    const xacNhan = confirm(`📤 Có ${thayDoi.length} ô bị thay đổi. Bạn có chắc muốn cập nhật?`);
    if (!xacNhan) {
      console.log('⛔ Hủy cập nhật log bởi người dùng.');
      return;
    }

    // ✅ FIXED: Batch update via local proxy
    const updatePromises = thayDoi.map(({ row, col, oldVal, newVal }) => {
      return new Promise((resolve) => {
        updateLog(row, col, newVal);
        zacache.cacherlog[row][col] = newVal;
        console.log(`📝 Cập nhật: [${row},${col}] "${oldVal}" → "${newVal}"`);
        resolve();
      });
    });

    Promise.allSettled(updatePromises).then(() => {
      alert(`📥 Đã gửi ${thayDoi.length} cập nhật log.`);
    });

  } catch (error) {
    console.error('❌ Lỗi khi cập nhật log:', error);
    alert('⚠️ Có lỗi khi cập nhật log!');
  }
}

// ✅ FIXED Hàm cập nhật log chính
window.capNhatLog = function(event) {
  console.log('🔄 Cập nhật log…');

  try {
    const button = event?.target;
    if (button) {
      const originalText = button.textContent;
      button.textContent = '⏳ Đang cập nhật…';
      button.disabled = true;

      setTimeout(() => {
        capNhatLogFallback();
        button.textContent = originalText;
        button.disabled = false;
      }, 100);
    } else {
      capNhatLogFallback();
    }
  } catch (error) {
    console.error('❌ Lỗi trong capNhatLog:', error);
    alert('⚠️ Có lỗi khi cập nhật log!');
    
    // Reset button nếu có lỗi
    const button = event?.target;
    if (button) {
      button.textContent = '[LOG] Cập Nhật';
      button.disabled = false;
    }
  }
};

// ✅ NEW: Force reload log function
window.forceReloadLog = async function() {
  try {
    console.log('🔄 Force reloading log...');
    
    // Clear cache
    if (window.zacache) {
      window.zacache.cacherlog = [];
    }
    
    // Clear server cache
    try {
      await fetch('/api/proxy/file/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('✅ Server cache cleared');
    } catch (e) {
      console.warn('⚠️ Could not clear server cache:', e.message);
    }
    
    // Reload log
    await ShowLog();
    console.log('✅ Force reload log completed');
    
  } catch (error) {
    console.error('❌ Force reload log failed:', error);
    alert('⚠️ Có lỗi khi reload log!');
  }
};

// ✅ NEW: Test log API connectivity
window.testLogAPI = async function() {
  try {
    console.log('🧪 Testing log API connectivity...');
    
    // Test Strategy 1: File sheet approach
    try {
      const response1 = await fetch('/api/proxy/file/sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetName: 'Log' })
      });
      
      console.log('📁 File sheet test:', {
        ok: response1.ok,
        status: response1.status,
        statusText: response1.statusText
      });
      
      if (response1.ok) {
        const result = await response1.json();
        console.log('✅ File sheet result:', {
          success: result.success,
          hasData: !!result.data,
          rowCount: result.data?.table?.rows?.length || 0
        });
      }
    } catch (e) {
      console.error('❌ File sheet test failed:', e.message);
    }
    
    // Test Strategy 2: General proxy approach
    try {
      const response2 = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: window.LOG_API_URL,
          method: 'POST',
          data: { action: 'read' }
        })
      });
      
      console.log('📡 General proxy test:', {
        ok: response2.ok,
        status: response2.status,
        statusText: response2.statusText
      });
      
      if (response2.ok) {
        const result = await response2.json();
        console.log('✅ General proxy result:', {
          success: result.success,
          dataType: typeof result.data,
          dataLength: Array.isArray(result.data) ? result.data.length : 'N/A'
        });
      }
    } catch (e) {
      console.error('❌ General proxy test failed:', e.message);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Log API test failed:', error);
    return false;
  }
};

// ✅ Export để sử dụng
window.ShowLog = ShowLog;
window.updateLog = updateLog;