//✅ Cột 0: ID chuyến
export function index0(input) {
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
// ✅ Cột 2: Khách hàng
export function index2(input) {
  // TODO: xử lý gợi ý khách hàng
}

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
export function index6(input) {
  // TODO: thường không cần vì là cột nút, nhưng khai báo để tránh lỗi
}

export function ganSuKienTheoCot() {
  document.querySelectorAll('input[data-col]').forEach(input => {
    const col = +input.dataset.col;
    if (col === 0) index0(input);
    if (col === 1) index1(input);
    if (col === 2) index2(input);
    if (col === 3) index3(input);
    if (col === 4) index4(input);
    if (col === 5) index5(input);
    if (col === 6) index6(input);

  });
}
