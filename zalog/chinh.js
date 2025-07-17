console.log("🟢 chinh.js đã được load!");

import { khoiDongHeThong } from './fixloi.js';

window.addEventListener('DOMContentLoaded', async () => {
  console.log("✅ DOM sẵn sàng, bắt đầu khởi tạo...");
  await khoiDongHeThong();
});
