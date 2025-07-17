// ✅ Import goiykh từ module khách hàng
import { goiykh } from './danhsachkhachhang.js';

// ✅ Cột 0: ID chuyến
export function index0(input) {
  console.log("✅ index0 được gắn cho:", input);
  input.addEventListener('blur', () => {
    input.value = input.value.trim();
  });
}

// ✅ Cột 1: Ngày
export function index1(input) {
  console.log('🔍 Gọi index1 cho ô:', input);

  input.addEventListener('blur', () => {
    let val = input.value.trim();
    console.log('📅 Xử lý ngày:', val);
    if (!val) return;

    let [day, month, year] = val.split('/');
    if (!month) return;

    const now = new Date();
    year = year || now.getFullYear();
    if (year.length === 2) {
      year = +year >= 50 ? '19' + year : '20' + year;
    }

    input.value = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  });
}

// ✅ Cột 2: Khách hàng - dùng hàm gợi ý
export const index2 = goiykh;

// ✅ Cột 3: Số lượng
export function index3(input) {
  input.addEventListener('blur', () => {
    const val = input.value.trim();
    if (val && isNaN(val)) {
      alert('⚠️ Số lượng phải là số!');
      input.focus();
    }
  });
}

// ✅ Cột 4: Ca
export function index4(input) {
  input.addEventListener('blur', () => {
    const ca = input.value.trim().toLowerCase();
    if (ca && !['sáng', 'chiều', 'tối'].includes(ca)) {
      alert('⚠️ Ca không hợp lệ. Nhập: sáng, chiều hoặc tối.');
      input.focus();
    }
  });
}

// ✅ Cột 5: Tài xế
export function index5(input) {
  input.addEventListener('blur', () => {
    const val = input.value.trim();
    if (!val) {
      alert('⚠️ Vui lòng nhập tên tài xế.');
      input.focus();
    }
  });
}

// ✅ Cột 6 (phòng tránh lỗi nếu có)
function index6(input) {
  console.log('ℹ️ Cột 6 không có xử lý cụ thể.');
}

// ✅ Gắn sự kiện theo cột
export function ganSuKienTheoCot() {
  document.querySelectorAll('input[data-col]').forEach(input => {
    const col = +input.dataset.col;
    try {
      if (col === 0) index0(input);
      if (col === 1) index1(input);
      if (col === 2) index2(input);
      if (col === 3) index3(input);
      if (col === 4) index4(input);
      if (col === 5) index5(input);
      if (col === 6) index6(input); // đề phòng có input cột 6
    } catch (err) {
      console.warn(`⚠️ Lỗi khi gắn xử lý cho cột ${col}:`, err);
    }
  });
}
