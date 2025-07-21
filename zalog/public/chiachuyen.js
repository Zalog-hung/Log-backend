// 📁 chiachuyen.js - FIXED (Complete Implementation)

// ✅ 📦 CORE: Chia chuyến theo quy tắc - HOÀN CHỈNH
export function chiaChuyenTheoQuyTac({ khachHang, khoiLuong, ngay, ca, nextTripId, duCache = {}, maxPerTrip }) {
  console.log("🚀 Bắt đầu chia chuyến với params:", { khachHang, khoiLuong, ngay, ca, maxPerTrip });

  // ✅ Validate input
  if (typeof khachHang !== 'string' || typeof khoiLuong !== 'string') {
    console.warn('❌ Đầu vào không hợp lệ:', { khachHang, khoiLuong });
    return [];
  }

  if (!ngay || !ca || typeof maxPerTrip !== 'number' || maxPerTrip <= 0) {
    console.warn('❌ Thông tin chia chuyến không đầy đủ');
    return [];
  }

  // ✅ Parse khách hàng và số lượng
  const khArr = khachHang.split('+').map(s => s.trim()).filter(Boolean);
  const slRawArr = khoiLuong.split('+').map(s => s.trim()).filter(Boolean);

  if (khArr.length !== slRawArr.length) {
    alert(`❌ Số khách hàng (${khArr.length}) không khớp số lượng (${slRawArr.length})`);
    return [];
  }

  console.log("📋 Parsed data:", { khArr, slRawArr });

  // ✅ Xử lý từng cặp KH-SL
  const khSlPairs = [];

  for (let i = 0; i < khArr.length; i++) {
    const kh = khArr[i];
    const slRaw = slRawArr[i] || '';
    const isT = /t$/i.test(slRaw);
    let sl = parseFloat(slRaw.replace(/t/gi, ''));

    console.log(`🔍 Xử lý KH ${kh} - SL gốc: "${slRaw}" ➜ ${sl} (T=${isT})`);

    if (!kh || isNaN(sl) || sl <= 0) {
      alert(`❌ Dữ liệu không hợp lệ tại vị trí ${i + 1}:\nKH="${kh}", SL="${slRaw}"`);
      return [];
    }

    // ✅ Kiểm tra cache số dư
    const cache = duCache[kh];
    if (cache && cache.ngay === ngay && cache.total > 0) {
      const du = parseFloat(cache.total);
      console.log(`📦 Tìm thấy số dư cho ${kh}:`, du, 'từ:', cache.from);

      if (!isNaN(du) && du > 0) {
        if (cache.approved === true) {
          // Đã approve trước đó
          sl += du;
          cache._gopDu = du;
          console.log(`✅ Đã gộp sẵn: ${du} ➜ SL mới: ${sl}`);
        } else {
          // Hỏi user có muốn gộp không
          const label = cache.from === 'form' ? 'dòng khác' : 'log cũ';
          const dongY = confirm(`${kh} có số dư ${du} từ ${label}\nBạn có muốn gộp vào không?`);
          console.log(`❓ User chọn gộp dư ${du} ➜`, dongY);

          if (dongY) {
            sl += du;
            cache.approved = true;
            cache._gopDu = du;
            console.log(`✅ Đã gộp: ${du} ➜ SL mới: ${sl}`);
          }
        }
      }
    }

    khSlPairs.push({ kh, sl, isT });
  }

  console.log('📋 Danh sách KH-SL sau xử lý:', khSlPairs);

  // ✅ PHẦN 2: Thực hiện chia chuyến
  const ketQua = [];
  const duArr = [];

  // Tách chuyến T riêng
  for (const pair of khSlPairs) {
    if (pair.isT) {
      const tripId = nextTripId();
      console.log(`🚚 Tạo chuyến T riêng cho ${pair.kh}: SL = ${pair.sl}T ➜ tripId = ${tripId}`);
      ketQua.push({
        tripId,
        ngay,
        kh: pair.kh,
        sl: pair.sl + 'T',
        ca
      });
    } else {
      duArr.push({ kh: pair.kh, sl: pair.sl });
    }
  }

  console.log('📦 Danh sách cần chia theo block:', duArr);

  // Nếu không có chuyến thường, return T-trips
  if (duArr.length === 0) {
    console.log('✅ Chỉ có T-trips, hoàn thành');
    return ketQua;
  }

  // ✅ Xử lý chuyến thường
  if (duArr.length === 1) {
    // Chỉ có 1 KH
    const item = duArr[0];
    console.log(`📍 1 KH duy nhất: ${item.kh} - SL = ${item.sl}`);

    if (item.sl <= maxPerTrip) {
      // Vừa 1 chuyến
      const tripId = nextTripId();
      console.log(`✅ SL nhỏ ➜ 1 chuyến: ${tripId}`);
      ketQua.push({ 
        tripId, 
        ngay, 
        kh: item.kh, 
        sl: item.sl, 
        ca 
      });
    } else {
      // Chia nhiều chuyến
      let remain = item.sl;
      console.log(`↔️ SL lớn ➜ Chia nhỏ, maxPerTrip = ${maxPerTrip}`);
      
      while (remain > 0) {
        const used = Math.min(remain, maxPerTrip);
        const tripId = nextTripId();
        console.log(`➕ Chuyến con: ${item.kh} - SL = ${used} ➜ ${tripId}`);
        ketQua.push({ 
          tripId, 
          ngay, 
          kh: item.kh, 
          sl: used, 
          ca 
        });
        remain -= used;
      }
    }

    return ketQua;
  }

  // ✅ Nhiều KH - Tối ưu hóa gộp chuyến
  const tong = duArr.reduce((s, it) => s + it.sl, 0);
  console.log('📊 Tổng khối lượng:', tong, '- maxPerTrip:', maxPerTrip);

  if (tong <= maxPerTrip) {
    // Gộp tất cả vào 1 chuyến
    const tripId = nextTripId();
    console.log(`✅ Gộp tất cả vào 1 chuyến: ${tripId}`);

    for (const item of duArr) {
      ketQua.push({ 
        tripId, 
        ngay, 
        kh: item.kh, 
        sl: item.sl, 
        ca 
      });
    }

    return ketQua;
  }

  // ✅ Logic tối ưu chia chuyến phức tạp
  let waiting = [...duArr];

  while (waiting.length > 0) {
    // Sắp xếp theo thứ tự giảm dần
    waiting.sort((a, b) => b.sl - a.sl);
    const item = waiting.shift();

    if (item.sl > maxPerTrip) {
      // Item quá lớn, chia ra
      const tripId = nextTripId();
      console.log(`⛔ ${item.kh} vượt max ➜ Chia: ${tripId} với SL = ${maxPerTrip}`);
      
      ketQua.push({ 
        tripId, 
        ngay, 
        kh: item.kh, 
        sl: maxPerTrip, 
        ca 
      });
      
      // Thêm phần còn lại vào waiting
      waiting.push({ 
        kh: item.kh, 
        sl: item.sl - maxPerTrip 
      });
      continue;
    }

    // Tìm combo tốt nhất
    let bestCombo = [item];
    let bestSum = item.sl;

    // Thử tất cả combination
    for (let i = 0; i < (1 << waiting.length); i++) {
      let combo = [item];
      let sum = item.sl;
      
      for (let j = 0; j < waiting.length; j++) {
        if ((i >> j) & 1 && sum + waiting[j].sl <= maxPerTrip) {
          combo.push(waiting[j]);
          sum += waiting[j].sl;
        }
      }
      
      if (sum > bestSum) {
        bestSum = sum;
        bestCombo = combo;
      }
    }

    // Tạo chuyến với combo tốt nhất
    const tripId = nextTripId();
    console.log(`🧩 Combo tốt nhất ➜ ${tripId}, SL = ${bestSum}, KH:`, bestCombo.map(x => x.kh));

    for (const it of bestCombo) {
      ketQua.push({ 
        tripId, 
        ngay, 
        kh: it.kh, 
        sl: it.sl, 
        ca 
      });
    }

    // Loại bỏ items đã dùng
    waiting = waiting.filter(w => !bestCombo.includes(w));
  }

  console.log('✅ Kết quả chia chuyến hoàn thành:', ketQua);
  return ketQua;
}

// ✅ Wrapper function để tương thích với legacy code
export function chiaChuyenTheoQuyTac_Legacy(rowData) {
  try {
    // Extract data from rowData object
    const khachHang = rowData.khachHang || '';
    const soLuong = rowData.soLuong || '';
    const ngay = rowData.ngay || '';
    const ca = rowData.ca || '';
    
    // Default values
    const maxPerTrip = 10; // Default max per trip
    const duCache = {}; // Empty cache for now
    
    // Create nextTripId function
    const nextTripId = () => {
      const now = new Date();
      const dateStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}`;
      const counter = Math.floor(Math.random() * 999) + 1;
      return `${dateStr}.${String(counter).padStart(3, '0')}`;
    };

    // Call main function with proper parameters
    const result = chiaChuyenTheoQuyTac({
      khachHang,
      khoiLuong: soLuong, // Map soLuong to khoiLuong
      ngay,
      ca,
      nextTripId,
      duCache,
      maxPerTrip
    });

    // Transform result to match expected format
    return result.map(item => ({
      idChuyen: item.tripId,
      ngay: item.ngay,
      khachHang: item.kh,
      soLuong: String(item.sl),
      ca: item.ca,
      taiXe: rowData.taiXe || '' // Keep original driver
    }));

  } catch (error) {
    console.error('❌ Lỗi trong chiaChuyenTheoQuyTac_Legacy:', error);
    return [];
  }
}

// ✅ Export both versions for compatibility
export { chiaChuyenTheoQuyTac_Legacy as default };