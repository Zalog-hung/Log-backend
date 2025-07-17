window.addEventListener('DOMContentLoaded', async () => {
  console.log("✅ DOM sẵn sàng, bắt đầu khởi tạo...");
  await khoiDongHeThong();

  // 🔁 Nếu vẫn chưa gán, cảnh báo rõ ràng
  if (typeof window.addNewRow !== 'function') {
    console.warn("⚠️ addNewRow chưa được gán vào window. HTML onclick sẽ bị lỗi.");
  }
});
