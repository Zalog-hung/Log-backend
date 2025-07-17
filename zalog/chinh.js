console.log("🟢 chinh.js đã được load!");

// ✅ Kiểm tra import từ fixloi.js
import * as fixloi from './fixloi.js';

console.log("🔍 Kiểm tra fixloi:", fixloi);
if (!fixloi.khoiDongHeThong) {
  console.warn("❌ Không tìm thấy hàm khoiDongHeThong trong fixloi.js");
} else {
  console.log("✅ Hàm khoiDongHeThong đã sẵn sàng.");
}

window.addEventListener('DOMContentLoaded', async () => {
  console.log("✅ DOM sẵn sàng, bắt đầu khởi tạo...");

  try {
    await fixloi.khoiDongHeThong();
  } catch (err) {
    console.error("❌ Lỗi khi gọi khoiDongHeThong():", err);
  }

  if (typeof window.addNewRow !== 'function') {
    console.warn("⚠️ addNewRow chưa được gán vào window.");
  }
});
