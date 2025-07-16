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
//THÊM DÒNG
function addRow() {
    const grid = document.querySelector('.excel-grid');
    const lastCells = Array.from(grid.querySelectorAll('.excel-cell')).slice(-7); // 7 cột cuối
    const newInputs = [];

    // Tạo lại 6 ô nhập (0–5)
    for (let i = 0; i < 6; i++) {
        const lastInput = lastCells[i]?.querySelector('input');
        const newInput = createElement('input', { type: 'text' });

        // ✅ Copy toàn bộ thuộc tính từ ô cũ
        if (lastInput) {
            for (const attr of lastInput.attributes) {
                if (attr.name !== 'value') newInput.setAttribute(attr.name, attr.value);
            }

            // ✅ Riêng index 1 và 5 → giữ giá trị nếu có
            if ((i === 1 || i === 5) && lastInput.value.trim() !== '') {
                newInput.value = lastInput.value;
            }
        }

        const newCell = createElement('div', { className: 'excel-cell' });
        newCell.appendChild(newInput);
        grid.appendChild(newCell);
        newInputs.push(newInput);
    }

    // ✅ Ô hành động (index 6)
    const lastActionCell = lastCells[6];
    const newActionCell = createElement('div', { className: 'excel-cell action-cell' });
    newActionCell.innerHTML = lastActionCell?.innerHTML || ''; // Copy toàn bộ nút
    grid.appendChild(newActionCell);

    return newInputs;
}
//HẾT
// +++ Chức Năng Enter
function enter(input) {
    input.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") return;
        e.preventDefault();

        const all = Array.from(document.querySelectorAll(".excel-grid input"));
        const i = all.indexOf(input);
        const isLast = (i + 1) % FORM_COLUMN_COUNT === 0;

        if (isLast) {
            // 👉 Nếu là ô cuối cùng của dòng → Thêm dòng mới
            const newInputs = addRow(); // hoặc addNewRow() nếu bạn dùng tên đó
            attachEventListenersToRow(newInputs); // Gắn lại enter + xử lý khác
            newInputs[0].focus();
        } else {
            // 👉 Nếu không phải ô cuối → Focus ô kế tiếp
            all[i + 1]?.focus();
        }
    });
}

// ✅ Gắn sự kiện cho các input đã có trên giao diện
document.querySelectorAll(".excel-grid input").forEach(enter);
// Hết 

