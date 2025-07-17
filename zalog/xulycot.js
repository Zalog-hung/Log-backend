
//✅ Cột 0: ID chuyến
export function index0(input) {
  console.log("✅ index0 được gắn cho:", input);
  input.addEventListener('blur', () => {
    input.value = input.value.trim();
  });
}
//✅ Cột 1: Ngày
export function index1(input) {
  console.log('🔍 Gọi index1 cho ô:', input);

  input.addEventListener('blur', () => {
    let val = input.value.trim();
    console.log('📅 Xử lý ngày:', val);
    if (!val) return;

    let [day, month, year] = val.split('/');
    if (!month) return;

    const now = new Date();
    year = year || now.getFullYear();
    if (year.length === 2) {
      year = +year >= 50 ? '19' + year : '20' + year;
    }

    input.value = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  });
}
// ✅ Cột 2: Khách hàng - lấy từ danhsachkhachhang.js
export const index2 = goiykh;

// ✅ Cột 3: Số lượng
export function index3(input) {
  // TODO: kiểm tra số lượng là số hợp lệ
}

// ✅ Cột 4: Ca
export function index4(input) {
  // TODO: kiểm tra ca sáng/chiều hoặc gợi ý
}

// ✅ Cột 5: Tài xế
export function index5(input) {
  // TODO: kiểm tra họ tên tài xế
}

// ✅ Cột 6: Hành động – thường không có input, nhưng giữ hàm để tránh lỗi
// ✅ Cột 6: GẮN CHỨC NĂNG NHẬP LIỆU
export function ganSuKienTheoCot() {
  document.querySelectorAll('input[data-col]').forEach(input => {
    const col = +input.dataset.col;
    try {
      if (col === 0) index0(input);
      if (col === 1) index1(input);
      if (col === 2) index2(input);
      if (col === 3) index3(input); // Có thể chưa viết
      if (col === 4) index4(input); // Có thể lỗi
      if (col === 5) index5(input);
      if (col === 6) index6(input);
    } catch (err) {
      console.warn(`⚠️ Lỗi khi gắn xử lý cho cột ${col}:`, err);
    }
  });
}
