addNewRow() {
    const allCells = Array.from(this.gridElement.querySelectorAll('.excel-cell'));
    const lastRowCells = allCells.slice(-this.TOTAL_COLUMN_COUNT);
    const newInputs = [];

    for (let i = 0; i < this.FORM_COLUMN_COUNT; i++) {
        const lastInput = lastRowCells[i]?.querySelector('input, select');
        const newInput = lastInput ? lastInput.cloneNode(true) : document.createElement('input');

        // Giữ lại giá trị nếu index là 2 (Khách Hàng) hoặc 4 (Ca)
        if ([2, 4].includes(i) && lastInput) {
            newInput.value = lastInput.value.trim();
        } else {
            newInput.value = '';
        }

        const newCell = document.createElement('div');
        newCell.className = 'excel-cell data-cell';
        newCell.appendChild(newInput);
        this.gridElement.appendChild(newCell);
        newInputs.push(newInput);
    }

    // Thêm ô hành động (clone từ dòng cuối)
    const lastActionCell = lastRowCells[this.FORM_COLUMN_COUNT];
    const newActionCell = document.createElement('div');
    newActionCell.className = 'excel-cell action-cell';

    if (lastActionCell) {
        lastActionCell.childNodes.forEach(child => {
            newActionCell.appendChild(child.cloneNode(true));
        });
    }

    this.gridElement.appendChild(newActionCell);

    this._updateInputCache?.(); // nếu có hàm này để quản lý cache nội bộ
    return newInputs;
}

