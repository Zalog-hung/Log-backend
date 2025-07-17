console.log("🟢 chinh.js đã được load!") 

import { themDongMoi, xoaDong, tachChuyen } from './bangexcel.js';
import { ganSuKienTheoCot } from './xulycot.js';

window.addEventListener('DOMContentLoaded', async () => {
  console.log("✅ DOM sẵn sàng, bắt đầu khởi tạo...");

  await loadKhachHangList(); // 🔄 Tải danh sách khách hàng trước

  // Gắn các hàm để HTML dùng onclick="..."
  window.addNewRow = themDongMoi;
  window.deleteRow = xoaDong;
  window.splitRow = tachChuyen;

  // Gắn xử lý theo cột sau khi đã tải danh sách
  ganSuKienTheoCot();
});
