// ✅ chinh.js – Điểm khởi đầu của toàn bộ hệ thống
console.log("🟢 chinh.js đã được load!");

// ✅ Import tất cả từ fixloi.js để dùng được khoiDongHeThong()
import * as fixloi from './fixloi.js';

// 🔍 Kiểm tra xem fixloi có đúng không
console.log("🔍 Kiểm tra fixloi:", fixloi);
if (!fixloi.khoiDongHeThong) {
  console.warn("❌ Không tìm thấy hàm khoiDongHeThong trong fixloi.js");
} else {
  console.log("✅ Hàm khoiDongHeThong đã sẵn sàng.");
}

// ✅ Khởi tạo khi DOM đã sẵn sàng
window.addEventListener('DOMContentLoaded', async () => {
  console.log("✅ DOM sẵn sàng, bắt đầu khởi tạo...");

  try {
    await fixloi.khoiDongHeThong();
    console.log("✅ Gọi khoiDongHeThong() thành công.");
  } catch (err) {
    console.error("❌ Lỗi khi gọi khoiDongHeThong():", err);
  }

  // 🔍 Kiểm tra lại sau khi khởi tạo
  if (typeof window.addNewRow !== 'function') {
    console.warn("⚠️ window.addNewRow chưa gán trong fixloi");
  } else {
    console.log("🟢 addNewRow đã sẵn sàng.");
  }

  if (typeof window.deleteRow !== 'function') {
    console.warn("⚠️ window.deleteRow chưa gán trong fixloi.");
  } else {
    console.log("🟢 deleteRow đã sẵn sàng trong fixloi.");
  }

  if (typeof window.splitRow !== 'function') {
    console.warn("⚠️ window.splitRow chưa được gán trong fixloi.");
  } else {
    console.log("🟢 splitRow đã sẵn sàng.");
  }
});
