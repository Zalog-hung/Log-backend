console.log("🟢 chinh.js đã được load!");

import { khoiDongHeThong } from './fixloi.js';

window.addEventListener('DOMContentLoaded', async () => {
  console.log("✅ DOM sẵn sàng, bắt đầu khởi tạo...");

  try {
    await khoiDongHeThong();
  } catch (err) {
    console.error("❌ Lỗi khi gọi khoiDongHeThong:", err);
  }

  // 🧪 Kiểm tra nếu addNewRow chưa gán vào window
  if (typeof window.addNewRow !== 'function') {
    console.warn("⚠️ window.addNewRow chưa được gán. Nút HTML sẽ không hoạt động!");
    // ✅ Bạn có thể thử tự gán tạm thời tại đây (không khuyến nghị nếu đã gán bên fixloi.js)
    // window.addNewRow = () => { alert("Tạm thời gán addNewRow test"); };
  } else {
    console.log("✅ window.addNewRow đã sẵn sàng.");
  }
});
