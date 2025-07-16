// ======================================================================
// ✅ Hàm thêm dòng mới vào grid nhập liệu
// ======================================================================
function addRow() {
    const grid = document.querySelector('.excel-grid'); // Tìm container grid
    const FORM_COLUMN_COUNT = 6; // Số ô input trong mỗi dòng

    const newInputs = []; // Mảng lưu input mới tạo

    // ✅ Tạo 6 ô input (từ index 0 đến 5)
    for (let i = 0; i < FORM_COLUMN_COUNT; i++) {
        const input = document.createElement('input'); // Tạo thẻ input
        input.type = 'text';

        const cell = document.createElement('div');     // Tạo ô chứa input
        cell.className = 'excel-cell';                  // Gán class để định dạng
        cell.appendChild(input);                        // Gắn input vào ô
        grid.appendChild(cell);                         // Gắn ô vào grid

        newInputs.push(input);                          // Lưu input vào mảng
    }

    // ✅ Tạo ô cuối cùng là ô hành động (index 6)
    const actionCell = document.createElement('div');
    actionCell.className = 'excel-cell action-cell';    // Gán class đặc biệt
    actionCell.innerHTML = `<button onclick="deleteRow(this)">🗑️</button>`; // Nút xoá
    grid.appendChild(actionCell); // Gắn ô hành động vào grid

    return newInputs; // Trả về mảng input mới nếu cần dùng
}

