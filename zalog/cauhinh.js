// ✅ KHAI BÁO HẰNG SỐ CẤU HÌNH
export const KHACH_HANG_API_URL = "https://script.google.com/macros/s/AKfycbw6DcLseuze9340EK396D1JE9Of1qk0eyzQGd1Te19p0gnn-dwwioq1zS_1Iwe1WNY/exec";
export const LOG_API_URL = "https://script.google.com/macros/s/AKfycbwhGc1NHndpO2IYfEhFDFAiLHyTi1LqlWFSnfqtSxWPEQ5bCw7r4idZ23qvb83PitB0Dw/exec";
export const GHI_LOG_PROXY_URL = 'https://za-log-proxy-4pkb9hu3p-hung-za.vercel.app/api/proxy';

export const formConfig = {
  TOTAL_COLUMN_COUNT: 7,
  FORM_COLUMN_COUNT: 6,
  FIELDS_TO_KEEP_VALUE: [1, 4], // giữ "Ngày" và "Ca"
};

// ✅ BỘ NHỚ TẠM TOÀN CỤC ZA – CÓ THỂ MỞ RỘNG
export const zacache = {
  khachHangList: [],      // 🔄 Danh sách khách hàng tải về từ Google Sheet
  colEvents: {},          // 🔧 Ánh xạ cột -> hàm xử lý nhập liệu
  otherConfigs: {},       // 📦 Không bắt buộc – để dùng cho các config khác nếu cần
};
