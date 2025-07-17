import { formConfig, zacache } from './cauhinh.js';

export async function khoiDongHeThong() {
  try {
    let themDongMoi, xoaDong, tachChuyen;
    let index0, index1, index3, index4, index5;
    let goiykh, loadKhachHangList;

    // --- 1. Import module bảng ---
    try {
      const bang = await import('./bangexcel.js');
      themDongMoi = bang.themDongMoi;
      xoaDong = bang.xoaDong;
      tachChuyen = bang.tachChuyen;

      console.log("✅ Đã import bangexcel.js:");
      console.log("🔹 themDongMoi =", themDongMoi);
      console.log("🔹 xoaDong =", xoaDong);
      console.log("🔹 tachChuyen =", tachChuyen);
    } catch (err) {
      console.warn("❌ Không thể import bangexcel.js:", err);
    }

    // --- 2. Import module xử lý cột ---
    try {
      const xuly = await import('./xulycot.js');
      index0 = xuly.index0;
      index1 = xuly.index1;
      index3 = xuly.index3;
      index4 = xuly.index4;
      index5 = xuly.index5;

      console.log("✅ Đã import xulycot.js:", { index0, index1, index3, index4, index5 });
    } catch (err) {
      console.warn("❌ Không thể import xulycot.js:", err);
    }

    // --- 3. Import danh sách khách hàng ---
    try {
      const dskh = await import('./danhsachkhachhang.js');
      goiykh = dskh.goiykh;
      loadKhachHangList = dskh.loadKhachHangList;

      console.log("✅ Đã import danhsachkhachhang.js:", { goiykh, loadKhachHangList });
    } catch (err) {
      console.warn("❌ Không thể import danhsachkhachhang.js:", err);
    }

    // --- 4. Tải danh sách khách hàng ---
    if (typeof loadKhachHangList === 'function') {
      try {
        await loadKhachHangList();
        console.log('✅ Danh sách khách hàng đã tải xong.');
      } catch (err) {
        console.error("❌ Lỗi khi tải danh sách khách hàng:", err);
      }
    } else {
      console.warn("⚠️ Không tìm thấy hàm loadKhachHangList");
    }

    // --- 5. Thiết lập ánh xạ xử lý theo cột ---
    zacache.handlers = {
      0: index0,
      1: index1,
      2: goiykh,
      3: index3,
      4: index4,
      5: index5,
    };
    console.log("✅ Đã thiết lập zacache.handlers:", zacache.handlers);

    // --- 6. Gắn xử lý cho input ban đầu ---
    ganChoTatCaInput();

    // --- 7. Gắn các hàm onclick vào window ---
    if (typeof themDongMoi === 'function') {
      window.addNewRow = () => {
        try {
          const inputs = themDongMoi();
          if (Array.isArray(inputs)) ganCho1Dong(inputs);
          console.log("🟢 Đã gọi addNewRow()");
        } catch (err) {
          console.error("❌ Lỗi khi chạy addNewRow:", err);
        }
      };
    } else {
      console.warn("⚠️ themDongMoi không khả dụng. Không gán được window.addNewRow");
    }

    if (typeof xoaDong === 'function') {
      window.deleteRow = xoaDong;
      console.log("🟢 Đã gán deleteRow()");
    } else {
      console.warn("⚠️ xoaDong không khả dụng. Không gán được window.deleteRow");
    }

    if (typeof tachChuyen === 'function') {
      window.splitRow = tachChuyen;
      console.log("🟢 Đã gán splitRow()");
    } else {
      console.warn("⚠️ tachChuyen không khả dụng. Không gán được window.splitRow");
    }

    console.log("✅ Hệ thống đã khởi động hoàn tất.");
  } catch (error) {
    console.error("❌ Lỗi tổng khi khởi động hệ thống:", error);
  }
}

// ✅ Gắn xử lý indexN an toàn cho 1 input
function ganCho1Input(input) {
  const col = +input.dataset.col;
  try {
    const handler = zacache.handlers[col];
    if (typeof handler === 'function') {
      handler(input);
    }
  } catch (err) {
    console.warn(`⚠️ Lỗi xử lý cột ${col}:`, err);
  }
}

// ✅ Gắn cho toàn bộ input ban đầu
export function ganChoTatCaInput() {
  document.querySelectorAll('input[data-col]').forEach(ganCho1Input);
}

// ✅ Gắn cho 1 dòng mới thêm
export function ganCho1Dong(inputArray) {
  inputArray.forEach(ganCho1Input);
}
