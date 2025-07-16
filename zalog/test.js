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
        }
    });
}

// ✅ Gắn sự kiện cho các input đã có trên giao diện
document.querySelectorAll(".excel-grid input").forEach(enter);
