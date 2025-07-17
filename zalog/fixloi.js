// 📁 fixloi.js
// ✅ File trung gian để gọi các indexN và xử lý lỗi cục bộ

import { index0, index1, index3, index4, index5 } from './xulycot.js';
import { goiykh, loadKhachHangList } from './danhsachkhachhang.js';

// ✅ Bản đồ các hàm xử lý theo cột
const indexHandlers = {
  0: index0,
  1: index1,
  2: goiykh, // dùng tên khác để tránh trùng index2
  3: index3,
  4: index4,
  5: index5,
};

// ✅ Gắn sự kiện cho từng input[data-col] an toàn
export function ganSuKienTheoCot() {
  document.querySelectorAll('input[data-col]').forEach(input => {
    const col = +input.dataset.col;
    try {
      const handler = indexHandlers[col];
      if (typeof handler === 'function') {
        handler(input);
      }
    } catch (err) {
      console.warn(`⚠️ Lỗi khi gắn xử lý cho cột ${col}:`, err);
    }
  });
}

// ✅ Khởi động hệ thống an toàn
export async function khoiDongHeThong() {
  try {
    await loadKhachHangList();
    console.log('✅ Danh sách khách hàng đã sẵn sàng.');
    ganSuKienTheoCot();
  } catch (error) {
    console.error('❌ Lỗi khởi động hệ thống:', error);
  }
}
