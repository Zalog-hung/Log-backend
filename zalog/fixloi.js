import { formConfig, zacache } from './cauhinh.js';

export async function khoiDongHeThong() {
  try {
    let themDongMoi, xoaDong, tachChuyen;
    let index0, index1, index2, index3, index4, index5;
    let goiykh, loadKhachHangList;

    const bang = await import('./bangexcel.js');
    themDongMoi = bang.themDongMoi;
    xoaDong = bang.xoaDong;
    tachChuyen = bang.tachChuyen;

    const xuly = await import('./xulycot.js');
    index0 = xuly.index0;
    index1 = xuly.index1;
    index2 = xuly.index2;
    index3 = xuly.index3;
    index4 = xuly.index4;
    index5 = xuly.index5;

    const dskh = await import('./danhsachkhachhang.js');
    goiykh = dskh.goiykh;
    loadKhachHangList = dskh.loadKhachHangList;

    await loadKhachHangList();

    zacache.handlers = {
      0: index0,
      1: index1,
      2: index2,
      3: index3,
      4: index4,
      5: index5,
    };

    // Gán vào window
    if (typeof themDongMoi === 'function') {
      window.addNewRow = () => {
        const inputs = themDongMoi();
        if (Array.isArray(inputs)) {
          inputs.forEach(input => {
            const col = +input.dataset.col;
            const handler = zacache.handlers[col];
            if (typeof handler === 'function') handler(input);
          });
        }
      };
    }

    if (typeof xoaDong === 'function') window.deleteRow = xoaDong;
    if (typeof tachChuyen === 'function') window.splitRow = tachChuyen;

    console.log("✅ Hệ thống đã khởi động hoàn tất.");
  } catch (err) {
    console.error("❌ Lỗi khi khởi động hệ thống:", err);
  }
}
