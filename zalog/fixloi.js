// ✅ fixloi.js – Gọi module và gắn sự kiện an toàn (không sập hệ thống)

let indexHandlers = {}; // ánh xạ các hàm theo cột

export async function khoiDongHeThong() {
  try {
    // --- 1. Import các module động ---
    let themDongMoi, xoaDong, tachChuyen;
    let index0, index1, index3, index4, index5;
    let goiykh, loadKhachHangList;

    try {
      const bang = await import('./bangexcel.js');
      themDongMoi = bang.themDongMoi;
      xoaDong = bang.xoaDong;
      tachChuyen = bang.tachChuyen;
    } catch (err) {
      console.warn("⚠️ Không thể load bangexcel.js:", err);
    }

    try {
      const xuly = await import('./xulycot.js');
      index0 = xuly.index0;
      index1 = xuly.index1;
      index3 = xuly.index3;
      index4 = xuly.index4;
      index5 = xuly.index5;
    } catch (err) {
      console.warn("⚠️ Không thể load xulycot.js:", err);
    }

    try {
      const dskh = await import('./danhsachkhachhang.js');
      goiykh = dskh.goiykh;
      loadKhachHangList = dskh.loadKhachHangList;
    } catch (err) {
      console.warn("⚠️ Không thể load danhsachkhachhang.js:", err);
    }

    // --- 2. Tải danh sách khách hàng ---
    if (typeof loadKhachHangList === 'function') {
      await loadKhachHangList();
      console.log('✅ Danh sách khách hàng đã sẵn sàng.');
    }

    // --- 3. Thiết lập ánh xạ xử lý theo cột ---
    indexHandlers = {
      0: index0,
      1: index1,
      2: goiykh, // Từ danhsachkhachhang.js
      3: index3,
      4: index4,
      5: index5,
    };

    // --- 4. Gắn xử lý cho input ban đầu ---
    ganChoTatCaInput();

    // --- 5. Gắn các hàm onclick cho HTML ---
    if (typeof themDongMoi === 'function') {
      window.addNewRow = () => {
        const inputs = themDongMoi(); // Thêm dòng
        if (Array.isArray(inputs)) ganCho1Dong(inputs); // Gắn indexN
      };
    }

    if (typeof xoaDong === 'function') window.deleteRow = xoaDong;
    if (typeof tachChuyen === 'function') window.splitRow = tachChuyen;

    console.log("✅ Hệ thống đã khởi động hoàn tất.");
  } catch (error) {
    console.error("❌ Lỗi tổng khi khởi động hệ thống:", error);
  }
}

// ✅ Gắn xử lý indexN an toàn cho 1 input
function ganCho1Input(input) {
  const col = +input.dataset.col;
  try {
    const handler = indexHandlers[col];
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
