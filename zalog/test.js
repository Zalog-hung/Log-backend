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
