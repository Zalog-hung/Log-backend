// 📁 fixloi.js
import { formConfig, zacache } from './cauhinh.js';

export async function khoiDongHeThong() {
  try {
    const bang = await import('./bangexcel.js');
    const xuly = await import('./xulycot.js');
    const dskh = await import('./danhsachkhachhang.js');

    const { themDongMoi, xoaDong, tachChuyen } = bang;
    const { index0, index1, index3, index4, index5 } = xuly;
    const { goiykh, loadKhachHangList } = dskh;

    if (typeof loadKhachHangList === 'function') {
      await loadKhachHangList();
    }

    zacache.handlers = {
      0: index0,
      1: index1,
      2: goiykh,
      3: index3,
      4: index4,
      5: index5,
    };

    ganChoTatCaInput();

    window.addNewRow = () => {
      try {
        const inputs = themDongMoi();
        if (Array.isArray(inputs)) ganCho1Dong(inputs);
      } catch (err) {
        console.error("❌ Lỗi khi thêm dòng:", err);
      }
    };

    window.deleteRow = xoaDong;
    window.splitRow = tachChuyen;
  } catch (error) {
    console.error("❌ Lỗi tổng khi khởi động hệ thống:", error);
  }
}

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

export function ganChoTatCaInput() {
  document.querySelectorAll('input[data-col]').forEach(ganCho1Input);
}

export function ganCho1Dong(inputArray) {
  inputArray.forEach(ganCho1Input);
}
