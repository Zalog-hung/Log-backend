// =================================================================
// === KHAI BÁO BIẾN VÀ HẰNG SỐ TOÀN CỤC ===
// =================================================================
// ✅ CẢI TIẾN: Gom tất cả các hằng số lên đầu để dễ quản lý.
const KHACH_HANG_API_URL = "https://script.google.com/macros/s/AKfycbw6DcLseuze9340EK396D1JE9Of1qk0eyzQGd1Te19p0gnn-dwwioq1zS_1Iwe1WNY/exec";
const LOG_API_URL = "https://script.google.com/macros/s/AKfycbwhGc1NHndpO2IYfEhFDFAiLHyTi1LqlWFSnfqtSxWPEQ5bCw7r4idZ23qvb83PitB0Dw/exec";
const GHI_LOG_PROXY_URL = 'https://za-log-proxy-4pkb9hu3p-hung-za.vercel.app/api/proxy';
const FORM_COLUMN_COUNT = 6;
const LOG_COLUMN_COUNT = 26;

let khachHangList = [];
let suggestionBox = null;
// +++ Chức Năng Enter
function enter(input) {
    input.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") return;
        e.preventDefault();

        const all = Array.from(document.querySelectorAll(".excel-grid input"));
        const i = all.indexOf(input);
        const isLast = (i + 1) % FORM_COLUMN_COUNT === 0;

        if (isLast) {
            const newInputs = addNewRow();
            newInputs.forEach(enter); // Gắn sự kiện Enter cho dòng mới
            newInputs[0].focus();     // Focus ô đầu tiên dòng mới
        } else {
            all[i + 1]?.focus(); // Focus ô kế tiếp
             // ✅ Nếu là ô cuối dòng (index 5), thì thêm dòng mới
                    const newInputs = addRow();
                    attachEventListenersToRow(newInputs); // Gắn lại sự kiện
                    newInputs[0].focus();
        }
    });
}

// ✅ Gắn sự kiện cho các input đã có trên giao diện
document.querySelectorAll(".excel-grid input").forEach(enter);
// Hết 

