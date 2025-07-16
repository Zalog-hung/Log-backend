function deleteRow(button) {
    const actionCell = button.closest('.excel-cell');
    const rowStartIndex = Array.from(gridElement.children).indexOf(actionCell) - formConfig.FORM_COLUMN_COUNT;

    if (rowStartIndex >= 0) {
        for (let i = formConfig.TOTAL_COLUMN_COUNT - 1; i >= 0; i--) {
            gridElement.children[rowStartIndex + i].remove();}}}
 
