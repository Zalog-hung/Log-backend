// 📁 cache.js - COMPLETE (All Cache Functions)

// ✅ Tính ngày trừ đi 1 ngày
export function ngayTru1(ngay) {
  try {
    if (!ngay || typeof ngay !== 'string') {
      console.warn("⚠️ ngayTru1: Ngày không hợp lệ:", ngay);
      return '';
    }

    // Validate format dd/mm/yyyy
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(ngay)) {
      console.warn("⚠️ ngayTru1: Format ngày không đúng (cần dd/mm/yyyy):", ngay);
      return ngay; // Return original nếu format sai
    }

    const [d, m, y] = ngay.split('/').map(Number);

    // Validate values
    if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1900 || y > 2100) {
      console.warn("⚠️ ngayTru1: Giá trị ngày không hợp lệ:", { d, m, y });
      return ngay;
    }

    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() - 1);

    const result = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;

    console.log(`📅 ${ngay} trừ 1 ngày = ${result}`);
    return result;

  } catch (error) {
    console.error("❌ Lỗi trong ngayTru1:", error);
    return ngay; // Return original nếu có lỗi
  }
}

// ✅ Sinh ID chuyến theo format dd.mm.xxx
export function idchuyen(ngay) {
  try {
    // Validate input
    if (!ngay || typeof ngay !== 'string' || !/^\d{2}\/\d{2}\/\d{4}$/.test(ngay)) {
      console.warn("⚠️ idchuyen: Ngày không hợp lệ:", ngay);
      return () => `ERROR.${Date.now().toString().slice(-3)}`;
    }

    const [dd, mm] = ngay.split('/');
    const prefix = `${dd}.${mm}`;
    let counter = 0;

    console.log(`🔢 Tạo ID chuyến cho ngày ${ngay}, prefix: ${prefix}`);

    // ✅ Kiểm tra trong cache log
    const zacache = window.zacache;
    const rows = Array.isArray(zacache?.cacherlog) ? zacache.cacherlog : [];

    for (let i = 1; i < rows.length; i++) {
      const trip = String(rows[i]?.[0] ?? '').trim();
      const ngayRow = String(rows[i]?.[1] ?? '').trim();
      
      if (ngayRow === ngay && trip.startsWith(prefix)) {
        const parts = trip.split('.');
        if (parts.length === 3) {
          const so = parseInt(parts[2]);
          if (!isNaN(so)) {
            counter = Math.max(counter, so);
          }
        }
      }
    }

    // ✅ Kiểm tra trong form hiện tại
    const tripInputs = document.querySelectorAll('input[data-col="0"]');
    const dateInputs = document.querySelectorAll('input[data-col="1"]');

    for (let i = 0; i < tripInputs.length; i++) {
      const trip = tripInputs[i]?.value?.trim() ?? '';
      const date = dateInputs[i]?.value?.trim() ?? '';
      
      if (date === ngay && trip.startsWith(prefix)) {
        const parts = trip.split('.');
        if (parts.length === 3) {
          const so = parseInt(parts[2]);
          if (!isNaN(so)) {
            counter = Math.max(counter, so);
          }
        }
      }
    }

    console.log(`📊 Counter hiện tại cho ${prefix}: ${counter}`);

    // ✅ Return function để tạo ID tiếp theo
    return function nextTripId() {
      counter++;
      const tripId = `${prefix}.${String(counter).padStart(3, '0')}`;
      console.log(`🆔 Tạo trip ID mới: ${tripId}`);
      return tripId;
    };

  } catch (error) {
    console.error("❌ Lỗi trong idchuyen:", error);
    return () => `ERROR.${Date.now().toString().slice(-3)}`;
  }
}

// ✅ Lấy cache số dư từ log
export function duCacheLog(ngayNhap, maxPerTrip) {
  try {
    console.log(`📦 Tìm cache log cho ngày: ${ngayNhap}, maxPerTrip: ${maxPerTrip}`);

    const ducache = {};

    if (!ngayNhap || typeof maxPerTrip !== 'number' || maxPerTrip <= 0) {
      console.warn("⚠️ duCacheLog: Tham số không hợp lệ");
      return ducache;
    }

    const ngayHomQua = ngayTru1(ngayNhap);
    const zacache = window.zacache;

    if (!Array.isArray(zacache?.cacherlog)) {
      console.log("📝 Không có cache log, trả về rỗng");
      return ducache;
    }

    let foundCount = 0;

    for (let i = 1; i < zacache.cacherlog.length; i++) {
      const row = zacache.cacherlog[i];
      if (!Array.isArray(row)) continue;

      const kh = String(row[2] || '').trim();
      const ngay = String(row[1] || '').trim();
      const ca = String(row[4] || '').trim();
      const slRaw = String(row[3] || '').trim();

      // Skip invalid data
      if (!kh || !slRaw || /t$/i.test(slRaw)) continue;
      if (![ngayNhap, ngayHomQua].includes(ngay)) continue;

      const sl = parseFloat(slRaw);
      if (isNaN(sl) || sl <= 0 || sl >= maxPerTrip) continue;

      // ✅ Chỉ giữ lại dòng đầu tiên hợp lệ của mỗi KH
      if (!ducache[kh]) {
        ducache[kh] = {
          from: 'log',
          total: sl,
          ngay,
          ca,
          approved: false,
          rowIndex: i
        };
        foundCount++;
        console.log(`📋 Cache log: ${kh} = ${sl} (${ngay}, ${ca})`);
      }
    }

    console.log(`✅ Tìm thấy ${foundCount} cache từ log`);
    return ducache;

  } catch (error) {
    console.error("❌ Lỗi trong duCacheLog:", error);
    return {};
  }
}

// ✅ Lấy cache số dư từ form hiện tại
export function duCacheForm(result, maxPerTrip) {
  try {
    console.log(`📝 Tạo cache form với ${Array.isArray(result) ? result.length : 0} dòng`);

    const ducache = {};

    if (!Array.isArray(result) || typeof maxPerTrip !== 'number' || maxPerTrip <= 0) {
      console.warn("⚠️ duCacheForm: Tham số không hợp lệ");
      return ducache;
    }

    let foundCount = 0;

    for (const row of result) {
      if (!row || typeof row !== 'object') continue;

      const kh = String(row.kh || '').trim();
      const slRaw = String(row.sl || '').trim();
      const ca = String(row.ca || '').trim();
      const ngay = String(row.ngay || '').trim();

      // Skip invalid data
      if (!kh || !slRaw || /t$/i.test(slRaw)) continue;

      const sl = parseFloat(slRaw);
      if (isNaN(sl) || sl >= maxPerTrip || sl <= 0) continue;

      // ✅ Lấy dòng cuối cùng cho mỗi KH (override previous)
      ducache[kh] = {
        from: 'form',
        total: sl,
        ngay,
        ca,
        approved: false
      };
      foundCount++;
    }

    console.log(`✅ Tạo cache form: ${foundCount} khách hàng`);
    return ducache;

  } catch (error) {
    console.error("❌ Lỗi trong duCacheForm:", error);
    return {};
  }
}

// ✅ Helper function để debug cache
export function debugCache(duCache) {
  if (!duCache || typeof duCache !== 'object') {
    console.log("🔍 Cache rỗng hoặc không hợp lệ");
    return;
  }

  console.log("🔍 Debug Cache:");
  Object.entries(duCache).forEach(([kh, data]) => {
    console.log(`  ${kh}: ${data.total} (${data.from}) - ${data.ngay} ${data.ca} [approved: ${data.approved}]`);
  });
}

// ✅ Function gộp cache từ nhiều nguồn
export function mergeCache(...caches) {
  try {
    const merged = {};

    for (const cache of caches) {
      if (!cache || typeof cache !== 'object') continue;
      
      Object.entries(cache).forEach(([kh, data]) => {
        if (!merged[kh]) {
          merged[kh] = { ...data };
        } else {
          // Ưu tiên cache từ form (mới hơn)
          if (data.from === 'form' || merged[kh].from === 'log') {
            merged[kh] = { ...data };
          }
        }
      });
    }

    console.log(`🔗 Đã merge cache: ${Object.keys(merged).length} khách hàng`);
    return merged;

  } catch (error) {
    console.error("❌ Lỗi trong mergeCache:", error);
    return {};
  }
}

// ✅ Enhanced utility functions
export function clearExpiredCache(duCache, expireHours = 24) {
  try {
    if (!duCache || typeof duCache !== 'object') return {};

    const now = new Date();
    const expireMs = expireHours * 60 * 60 * 1000;
    const cleaned = {};

    Object.entries(duCache).forEach(([kh, data]) => {
      if (data.timestamp) {
        const dataTime = new Date(data.timestamp);
        if (now - dataTime < expireMs) {
          cleaned[kh] = data;
        } else {
          console.log(`🗑️ Expired cache removed: ${kh}`);
        }
      } else {
        // Keep data without timestamp (backward compatibility)
        cleaned[kh] = data;
      }
    });

    return cleaned;
  } catch (error) {
    console.error("❌ Lỗi trong clearExpiredCache:", error);
    return duCache;
  }
}

// ✅ Function to get cache statistics
export function getCacheStats(duCache) {
  if (!duCache || typeof duCache !== 'object') {
    return { total: 0, fromLog: 0, fromForm: 0, approved: 0 };
  }

  const stats = {
    total: 0,
    fromLog: 0,
    fromForm: 0,
    approved: 0,
    totalAmount: 0
  };

  Object.values(duCache).forEach(data => {
    stats.total++;
    stats.totalAmount += data.total || 0;
    
    if (data.from === 'log') stats.fromLog++;
    if (data.from === 'form') stats.fromForm++;
    if (data.approved) stats.approved++;
  });

  return stats;
}

// ✅ Export to window để các file khác sử dụng
window.ngayTru1 = ngayTru1;
window.idchuyen = idchuyen;
window.duCacheLog = duCacheLog;
window.duCacheForm = duCacheForm;
window.debugCache = debugCache;
window.mergeCache = mergeCache;
window.clearExpiredCache = clearExpiredCache;
window.getCacheStats = getCacheStats;