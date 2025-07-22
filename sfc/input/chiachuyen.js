// 📁 chiachuyen.js
export function chiaChuyenTheoQuyTac({ khachHang, khoiLuong, ngay, ca, nextTripId, duCache = {}, maxPerTrip = 10 }) {
  if (!khachHang || !khoiLuong || !ngay || !ca || typeof maxPerTrip !== 'number') {
    console.warn('❌ Missing required parameters');
    return [];
  }

  const khArr = khachHang.split('+').map(s => s.trim()).filter(Boolean);
  const slRawArr = khoiLuong.split('+').map(s => s.trim()).filter(Boolean);

  if (khArr.length !== slRawArr.length) {
    alert(`❌ Số khách hàng (${khArr.length}) không khớp số lượng (${slRawArr.length})`);
    return [];
  }

  const khSlPairs = [];

  for (let i = 0; i < khArr.length; i++) {
    const kh = khArr[i];
    const slRaw = slRawArr[i] || '';
    const isT = /t$/i.test(slRaw);
    let sl = parseFloat(slRaw.replace(/t/gi, ''));

    if (!kh || isNaN(sl) || sl <= 0) {
      alert(`❌ Dữ liệu không hợp lệ: KH="${kh}", SL="${slRaw}"`);
      return [];
    }

    const cache = duCache[kh];
    if (cache && cache.ngay === ngay && cache.total > 0) {
      const du = parseFloat(cache.total);
      if (!isNaN(du) && du > 0) {
        if (cache.approved === true) {
          sl += du;
          cache._gopDu = du;
        } else {
          const label = cache.from === 'form' ? 'dòng khác' : 'log cũ';
          const dongY = confirm(`${kh} có số dư ${du} từ ${label}\nGộp vào không?`);
          if (dongY) {
            sl += du;
            cache.approved = true;
            cache._gopDu = du;
          }
        }
      }
    }

    khSlPairs.push({ kh, sl, isT });
  }

  const ketQua = [];
  const duArr = [];

  for (const pair of khSlPairs) {
    if (pair.isT) {
      const tripId = nextTripId();
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

  if (duArr.length === 0) return ketQua;

  if (duArr.length === 1) {
    const item = duArr[0];
    if (item.sl <= maxPerTrip) {
      const tripId = nextTripId();
      ketQua.push({ tripId, ngay, kh: item.kh, sl: item.sl, ca });
    } else {
      let remain = item.sl;
      while (remain > 0) {
        const used = Math.min(remain, maxPerTrip);
        const tripId = nextTripId();
        ketQua.push({ tripId, ngay, kh: item.kh, sl: used, ca });
        remain -= used;
      }
    }
    return ketQua;
  }

  const tong = duArr.reduce((s, it) => s + it.sl, 0);
  if (tong <= maxPerTrip) {
    const tripId = nextTripId();
    for (const item of duArr) {
      ketQua.push({ tripId, ngay, kh: item.kh, sl: item.sl, ca });
    }
    return ketQua;
  }

  let waiting = [...duArr];
  while (waiting.length > 0) {
    waiting.sort((a, b) => b.sl - a.sl);
    const item = waiting.shift();

    if (item.sl > maxPerTrip) {
      const tripId = nextTripId();
      ketQua.push({ tripId, ngay, kh: item.kh, sl: maxPerTrip, ca });
      waiting.push({ kh: item.kh, sl: item.sl - maxPerTrip });
      continue;
    }

    let bestCombo = [item];
    let bestSum = item.sl;

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

    const tripId = nextTripId();
    for (const it of bestCombo) {
      ketQua.push({ tripId, ngay, kh: it.kh, sl: it.sl, ca });
    }

    waiting = waiting.filter(w => !bestCombo.includes(w));
  }

  return ketQua;
}

export function chiaChuyenTheoQuyTac_Legacy(rowData) {
  try {
    const khachHang = rowData.khachHang || '';
    const soLuong = rowData.soLuong || '';
    const ngay = rowData.ngay || '';
    const ca = rowData.ca || '';
    
    const maxPerTrip = 10;
    const duCache = {};
    
    const nextTripId = () => {
      const now = new Date();
      const dateStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}`;
      const counter = Math.floor(Math.random() * 999) + 1;
      return `${dateStr}.${String(counter).padStart(3, '0')}`;
    };

    const result = chiaChuyenTheoQuyTac({
      khachHang,
      khoiLuong: soLuong,
      ngay,
      ca,
      nextTripId,
      duCache,
      maxPerTrip
    });

    return result.map(item => ({
      idChuyen: item.tripId,
      ngay: item.ngay,
      khachHang: item.kh,
      soLuong: String(item.sl),
      ca: item.ca,
      taiXe: rowData.taiXe || ''
    }));

  } catch (error) {
    console.error('❌ Error in chiaChuyenTheoQuyTac_Legacy:', error);
    return [];
  }
}

export { chiaChuyenTheoQuyTac_Legacy as default };
