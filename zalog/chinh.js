console.log("🟢 chinh.js đã được load!");

import { themDongMoi, xoaDong, tachChuyen } from './bangexcel.js';
import { khoiDongHeThong } from './fixloi.js';

window.addEventListener('DOMContentLoaded', async () => {
  console.log("✅ DOM sẵn sàng, bắt đầu khởi tạo...");

  // Gắn các hàm để HTML dùng onclick="...”
  window.addNewRow = themDongMoi;
  window.deleteRow = xoaDong;
  window.splitRow = tachChuyen;

  // 🧠 Gọi trung gian để tải danh sách + gắn index an toàn
  await khoiDongHeThong();
});
