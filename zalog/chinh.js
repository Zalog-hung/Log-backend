// ✅ Gọi cấu hình cột
import { formConfig, zacache } from './cauhinh.js'; // ✅ chỉ giữ 1 dòng import duy nhất

console.log("🟢 chinh.js đã được load!");

import * as fixloi from './fixloi.js';

console.log("🔍 Kiểm tra fixloi:", fixloi);

// ✅ Kiểm tra tồn tại hàm khởi động
if (!fixloi.khoiDongHeThong) {
  console.warn("❌ Không tìm thấy hàm khoiDongHeThong trong fixloi.js");
} else {
  console.log("✅ Hàm khoiDongHeThong đã sẵn sàng.");
}

window.addEventListener('DOMContentLoaded', async () => {
  console.log("✅ DOM sẵn sàng, bắt đầu khởi tạo...");

  try {
    await fixloi.khoiDongHeThong();
    console.log("🟢 Gọi khoiDongHeThong() thành công.");
  } catch (err) {
    console.error("❌ Lỗi khi gọi khoiDongHeThong():", err);
  }

  // --- Kiểm tra từng hàm sau khi khởi động ---
  if (typeof window.addNewRow === 'function') {
    console.log("✅ window.addNewRow đã được gán thành công.");
  } else {
    console.warn("⚠️ window.addNewRow chưa gán trong fixloi (bangexcel.js có thể bị lỗi).");
  }

  if (typeof window.deleteRow === 'function') {
    console.log("✅ window.deleteRow đã được gán thành công.");
  } else {
    console.warn("⚠️ window.deleteRow chưa gán trong fixloi.");
  }

  if (typeof window.splitRow === 'function') {
    console.log("✅ window.splitRow đã được gán thành công.");
  } else {
    console.warn("⚠️ window.splitRow chưa được gán trong fixloi.");
  }
});
