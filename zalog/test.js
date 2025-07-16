function addNewRow() {
    const allCells = Array.from(gridElement.querySelectorAll('.excel-cell'));
    const lastRowCells = allCells.slice(-formConfig.TOTAL_COLUMN_COUNT);
    const newInputs = [];

    for (let i = 0; i < formConfig.FORM_COLUMN_COUNT; i++) {
        const lastInput = lastRowCells[i]?.querySelector('input, select');
        const newInput = lastInput ? lastInput.cloneNode(true) : document.createElement('input');

        // Giữ lại giá trị nếu cột là "Khách Hàng" (2) hoặc "Ca" (4)
        if (formConfig.FIELDS_TO_KEEP_VALUE.includes(i) && lastInput) {
            newInput.value = lastInput.value.trim();
        } else {
            newInput.value = '';
        }

        const newCell = document.createElement('div');
        newCell.className = 'excel-cell data-cell';
        newCell.appendChild(newInput);
        gridElement.appendChild(newCell);
        newInputs.push(newInput);
    }

    // Thêm ô hành động (nút sửa, xóa, tách)
    const lastActionCell = lastRowCells[formConfig.FORM_COLUMN_COUNT];
    const newActionCell = document.createElement('div');
    newActionCell.className = 'excel-cell action-cell';

    if (lastActionCell) {
        lastActionCell.childNodes.forEach(child => {
            newActionCell.appendChild(child.cloneNode(true));
        });
    }

    gridElement.appendChild(newActionCell);
    return newInputs;
}
