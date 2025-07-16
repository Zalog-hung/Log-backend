function deleteRow(button) {
    const actionCell = button.closest('.excel-cell');
    const rowStartIndex = Array.from(gridElement.children).indexOf(actionCell) - formConfig.FORM_COLUMN_COUNT;

    if (rowStartIndex >= 0) {
        for (let i = 0; i < formConfig.TOTAL_COLUMN_COUNT; i++) {
            gridElement.children[rowStartIndex].remove();
        }
    }
}
