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

