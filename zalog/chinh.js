console.log("🟢 chinh.js đã được load!") 

import { themDongMoi, xoaDong, tachChuyen } from './bangexcel.js';
import { ganSuKienTheoCot } from './xulycot.js';

window.addEventListener('DOMContentLoaded', () => {
  console.log("✅ DOM sẵn sàng, gắn hàm vào window");

  // Gắn các hàm để HTML dùng onclick="..."
  window.addNewRow = themDongMoi;
  window.deleteRow = xoaDong;
  window.splitRow = tachChuyen;

  // Gắn xử lý theo cột
  ganSuKienTheoCot();
});
