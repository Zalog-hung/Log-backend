// =================================================================
// === KHAI BÁO BIẾN TOÀN CỤC (GLOBAL VARIABLES) ===
// =================================================================
let khachHangList = [];


// =================================================================
// === CÁC HÀM TẢI DỮ LIỆU (DATA FETCHING FUNCTIONS) ===
// =================================================================

/**
 * Tải danh sách khách hàng từ Google Sheet và lưu vào biến toàn cục.
 */
async function loadKhachHangList() {
    try {
        const res = await fetch("https://script.google.com/macros/s/AKfycbw6DcLseuze9340EK396D1JE9Of1qk0eyzQGd1Te19p0gnn-dwwioq1zS_1Iwe1WNY/exec");
        khachHangList = await res.json();
        console.log("✅ Tải danh sách khách hàng thành công:", khachHangList.length, "khách hàng");
    } catch (err) {
        console.error("❌ Lỗi không tải được danh sách khách hàng:", err);
    }
}

/**
 * Tải dữ liệu log từ Google Sheet và hiển thị trong một bảng có thể chỉnh sửa.
 */
async function fetchAndShowLog() {
    const logArea = document.getElementById('logArea');
    if (!logArea) return;
    logArea.innerHTML = '[LOG] Hệ thống sẵn sàng.<br>⏳ Đang tải log...';

    try {
        const response = await fetch('https://script.google.com/macros/s/AKfycbwhGc1NHndpO2IYfEhFDFAiLHyTi1LqlWFSnfqtSxWPEQ5bCw7r4idZ23qvb83PitB0Dw/exec');
        const data = await response.json();

        if (!data || data.length <= 1) {
            logArea.innerHTML += '<br>⚠️ Không có dữ liệu log.';
            return;
        }

        logArea.innerHTML += `<br>📋 Tìm thấy ${data.length - 1} dòng log có dữ liệu:`;

        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'overflow: auto; max-height: 400px; max-width: 100%; border: 1px solid #ccc; background: #fff;';

        const table = document.createElement('table');
        table.style.cssText = 'border-collapse: collapse; font-size: 14px; min-width: max-content; background: #fff;';

        const styleCell = (cell, isHeader = false) => {
            cell.style.border = '1px solid #ccc';
            cell.style.padding = '4px 6px';
            cell.style.minWidth = '100px';
            cell.style.maxWidth = '200px';
            cell.style.whiteSpace = 'nowrap';
            cell.style.overflow = 'hidden';
            if (isHeader) {
                cell.style.cssText += 'background: #f0f0f0; font-weight: bold; position: sticky; top: 0; z-index: 1; text-align: center;';
            }
        };

        // --- TABLE HEADER ---
        const trHead = document.createElement('tr');
        const headers = (Array.isArray(data[0]) ? data[0] : Object.values(data[0])).slice(0, 26);
        for (let i = 0; i < 26; i++) {
            const th = document.createElement('th');
            th.textContent = headers[i] || '';
            styleCell(th, true);
            trHead.appendChild(th);
        }
        table.appendChild(trHead);

        // --- TABLE BODY ---
        for (let i = 1; i < data.length; i++) {
            const rawRow = data[i] || [];
            if (rawRow.slice(0, 26).every(cell => cell === '')) continue;

            const tr = document.createElement('tr');
            for (let col = 0; col < 26; col++) {
                const td = document.createElement('td');
                td.textContent = rawRow[col] || '';
                td.contentEditable = true;
                td.dataset.row = i;
                td.dataset.col = col;
                td.addEventListener('blur', () => {
                    const newValue = td.textContent.trim();
                    console.log(`📝 Sửa log: dòng ${i + 1}, cột ${String.fromCharCode(65 + col)} → "${newValue}"`);
                    // TODO: Gửi dữ liệu đã sửa lên server
                });
                styleCell(td);
                tr.appendChild(td);
            }
            table.appendChild(tr);
        }

        wrapper.appendChild(table);
        logArea.appendChild(wrapper);
    } catch (err) {
        logArea.innerHTML += '<br>❌ Lỗi khi tải log.';
        console.error(err);
    }
}

// =================================================================
// === CÁC HÀM TƯƠNG TÁC GIAO DIỆN (UI INTERACTION) ===
// =================================================================

/**
 * Thêm các tay cầm để thay đổi kích thước các ô trong grid.
 */
function makeGridResizable() {
    // ... (Toàn bộ logic của hàm makeGridResizable giữ nguyên như cũ)
    const grid = document.querySelector(".excel-grid");
    if (!grid) return;
    const cells = Array.from(grid.children);
    if (cells.length === 0) return;
    const colCount = getComputedStyle(grid).gridTemplateColumns.split(" ").length;
    cells.forEach(cell => {
        if (!cell.querySelector('.resizer-v')) {
            const resizerV = document.createElement("div");
            resizerV.className = "resizer-v";
            cell.appendChild(resizerV);
            resizerV.addEventListener("mousedown", initResizeV);
        }
        if (!cell.querySelector('.resizer-h')) {
            const resizerH = document.createElement("div");
            resizerH.className = "resizer-h";
            cell.appendChild(resizerH);
            resizerH.addEventListener("mousedown", initResizeH);
        }
    });
    let startX, startY, activeCell, colIndex, rowIndex, colWidths, rowHeights;

    function initResizeV(e) {
        activeCell = e.target.parentElement;
        colIndex = Array.from(activeCell.parentElement.children).indexOf(activeCell) % colCount;
        startX = e.clientX;
        colWidths = getComputedStyle(grid).gridTemplateColumns.split(" ").map(w => parseInt(w, 10));
        document.documentElement.addEventListener("mousemove", doResizeV);
        document.documentElement.addEventListener("mouseup", stopResize);
    }

    function doResizeV(e) {
        const diffX = e.clientX - startX;
        const newWidth = colWidths[colIndex] + diffX;
        if (newWidth > 30) {
            grid.style.gridTemplateColumns = colWidths.map((w, i) => i === colIndex ? `${newWidth}px` : `${w}px`).join(" ");
        }
    }

    function initResizeH(e) {
        activeCell = e.target.parentElement;
        const cellIndex = Array.from(grid.children).indexOf(activeCell);
        rowIndex = Math.floor(cellIndex / colCount);
        startY = e.clientY;
        rowHeights = getComputedStyle(grid).gridTemplateRows.split(" ").map(h => parseInt(h, 10));
        document.documentElement.addEventListener("mousemove", doResizeH);
        document.documentElement.addEventListener("mouseup", stopResize);
    }

    function doResizeH(e) {
        const diffY = e.clientY - startY;
        const newHeight = (rowHeights[rowIndex] || 36) + diffY;
        if (newHeight > 30) {
            grid.style.gridTemplateRows = rowHeights.map((h, i) => i === rowIndex ? `${newHeight}px` : `${h}px`).join(" ");
        }
    }

    function stopResize() {
        document.documentElement.removeEventListener("mousemove", doResizeV);
        document.documentElement.removeEventListener("mousemove", doResizeH);
        document.documentElement.removeEventListener("mouseup", stopResize);
    }
}

/**
 * Thêm một dòng mới vào grid nhập liệu.
 */
function addNewRow() {
    const grid = document.querySelector('.excel-grid');
    const inputList = [];

    const existingInputs = Array.from(grid.querySelectorAll('input'));
    const colCount = 6;
    const lastRowStart = existingInputs.length - colCount;
    const lastRow = existingInputs.slice(lastRowStart, lastRowStart + colCount);

    for (let i = 0; i < colCount; i++) {
        const cell = document.createElement('div');
        cell.className = 'excel-cell';

        const input = document.createElement('input');
        input.type = 'text';

        // ✅ Gán datalist cho ô "Ca" (index 4)
        if (i === 4) {
            input.setAttribute('list', 'ca-list');
        }

        // ✅ Nếu là ô "Ngày" hoặc "Ca", sao chép giá trị từ dòng trước nếu có
        if ((i === 1 || i === 4) && lastRow[i] && lastRow[i].value) {
            input.value = lastRow[i].value;
        }

        cell.appendChild(input);
        grid.appendChild(cell);
        inputList.push(input);
    }
    

    // Ô hành động
    const actionCell = document.createElement('div');
    actionCell.className = 'excel-cell action-cell';
    actionCell.innerHTML = `
        <button onclick="editRow(this)">✏️</button>
        <button onclick="deleteRow(this)">🗑️</button>
 
    `;
    grid.appendChild(actionCell);

    makeGridResizable(); // Cập nhật lại resize

    return inputList;
}




// Các hàm cho nút bấm và tab
function switchTab(tab) { /* Giữ nguyên logic */ }
function editRow(button) { alert('Chức năng Sửa'); }
function deleteRow(button) { alert('Chức năng Xóa'); }
//function splitRow(button) { alert('Chức năng Tách'); }


// =================================================================
// === CÁC HÀM XỬ LÝ NHẬP LIỆU (INPUT HANDLING) ===
// =================================================================

/**
 * Xử lý tự động định dạng cho ô "Ngày".
 */
function handleNgay(input) {
    // ... (Toàn bộ logic của hàm handleNgay giữ nguyên như cũ)
    const val = input.value.trim();
    if (!val) {
        // Có thể thêm logic mở popup chọn ngày nếu muốn
        return;
    }
    const dmPattern = /^(\d{1,2})\/(\d{1,2})$/;
    if (dmPattern.test(val)) {
        const [, d, m] = val.match(dmPattern);
        input.value = `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${new Date().getFullYear()}`;
    }
}

/**
 * Xử lý gợi ý và tự động hoàn thành cho ô "Khách hàng".
 */
function handleKhachHang(input) {
    let suggestionBox = null;

    const createSuggestionBox = () => {
        document.querySelectorAll('.suggestions-container').forEach(el => el.remove());
        const box = document.createElement('div');
        box.className = 'suggestions-container';
        box.style.cssText = 'position: absolute; z-index: 9999; border: 1px solid #ccc; background: #fff; max-height: 150px; overflow-y: auto;';
        document.body.appendChild(box);
        return box;
    };

    const showSuggestionBox = (filtered) => {
        if (!suggestionBox || !document.body.contains(suggestionBox)) {
            suggestionBox = createSuggestionBox();
        }

        const rect = input.getBoundingClientRect();
        suggestionBox.style.left = `${rect.left + window.scrollX}px`;
        suggestionBox.style.top = `${rect.bottom + window.scrollY}px`;
        suggestionBox.style.width = `${rect.width}px`;
        suggestionBox.innerHTML = '';

        if (!filtered.length) {
            suggestionBox.style.display = 'none';
            return;
        }

        filtered.forEach(name => {
            const item = document.createElement('div');
            item.textContent = name;
            item.style.cssText = 'padding: 4px 8px; cursor: pointer;';
            item.addEventListener('mousedown', (e) => {
                e.preventDefault();

                let currentVal = input.value;
                const lastPlusIndex = currentVal.lastIndexOf('+');

                if (lastPlusIndex === -1) {
                    // Không có dấu +, thay toàn bộ giá trị
                    input.value = name;
                } else {
                    // Thay phần sau dấu + cuối cùng
                    const beforePlus = currentVal.slice(0, lastPlusIndex + 1);
                    // Giữ khoảng cách sau dấu +, nếu bạn muốn bỏ thì xóa ' ' này
                    input.value = beforePlus + ' ' + name;
                }

                suggestionBox.style.display = 'none';
                input.focus();

                // Đặt con trỏ ở cuối để tiếp tục nhập
                setTimeout(() => {
                    input.selectionStart = input.selectionEnd = input.value.length;
                }, 0);
            });
            suggestionBox.appendChild(item);
        });
        suggestionBox.style.display = 'block';
    };

    const updateSuggestions = () => {
        let val = input.value;
        const lastPlusIndex = val.lastIndexOf('+');
        let searchText = '';

        if (lastPlusIndex === -1) {
            searchText = val.trim().toLowerCase();
        } else {
            searchText = val.slice(lastPlusIndex + 1).trim().toLowerCase();
        }

        if (!searchText) {
            if (suggestionBox) suggestionBox.style.display = 'none';
            return;
        }

        const filtered = khachHangList.filter(kh => kh.toLowerCase().includes(searchText));
        showSuggestionBox(filtered);
    };

    input.addEventListener('input', updateSuggestions);

    input.addEventListener('blur', () => {
        setTimeout(() => {
            if (suggestionBox) suggestionBox.style.display = 'none';
        }, 150);
    });
}

/**
 * Xử lý tự động cho ô "Số lượng".
 */
function handleSoLuong(input) {
    let val = input.value;

    // Tách theo dấu cộng, giữ dấu cách
    let parts = val.split('+').map(part => part.trim());

    const formatPart = (part) => {
        // Kiểm tra xem có đuôi 'T' không
        let hasT = false;
        if (part.toUpperCase().endsWith('T')) {
            hasT = true;
            part = part.slice(0, -1).trim();
        }

        // Kiểm tra xem part có phải là số hợp lệ
        if (part === '') return ''; // phần rỗng thì bỏ
        if (!isNaN(part)) {
            // Nếu là số hợp lệ, format số kiểu VN, giữ 1 hoặc 2 chữ số thập phân nếu có
            let num = parseFloat(part);
            // Bạn có thể tùy chỉnh decimalPlaces ở đây
            const decimalPlaces = 2;
            let formatted = num.toLocaleString('vi-VN', {
                minimumFractionDigits: 0,
                maximumFractionDigits: decimalPlaces,
            });
            return hasT ? formatted + 'T' : formatted;
        }
        // Nếu không hợp lệ thì trả về nguyên gốc (hoặc bạn có thể xóa)
        return part + (hasT ? 'T' : '');
    };

    let formattedParts = parts.map(formatPart).filter(p => p !== '');

    // Nối lại với dấu ' + '
    input.value = formattedParts.join(' + ');
}

/**
 * Điều hướng xử lý dựa trên header của cột.
 */
function handleInputByIndex(index, input) {
    const headerCells = Array.from(document.querySelectorAll('.header-cell'));
    const header = headerCells[index]?.textContent?.trim().toLowerCase();

    switch (header) {
        case 'ngày':
            handleNgay(input);
            break;
        case 'khách hàng':
            // Gợi ý đã được xử lý bằng 'input', đây có thể là nơi xử lý khi Enter
            break;
        case 'số lượng':
            handleSoLuong(input);
            break;
        default:
            break;
    }
}


/**
 * Gắn sự kiện điều hướng bằng phím Enter cho một nhóm các ô input.
 */
function attachEnterNavigation(inputs) {
    if (!inputs || inputs.length === 0) return;

    inputs.forEach((input, index) => {
        // Gắn xử lý gợi ý cho ô khách hàng (ô thứ 3, index = 2)
        if (index === 2) {
            handleKhachHang(input);
        }

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleInputByIndex(index, input);

                if (index < inputs.length - 1) {
                    inputs[index + 1].focus();
                } else {
                    const newInputs = addNewRow();
                    attachEnterNavigation(newInputs);
                    newInputs[0].focus();
                }
            }
        });
    });
}

// =================================================================
// === KHỐI LỆNH CHÍNH (MAIN EXECUTION BLOCK) ===
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 giaodien.js đã sẵn sàng!");

    // 1. Tải các dữ liệu cần thiết
    loadKhachHangList();
    fetchAndShowLog();

    const grid = document.querySelector(".excel-grid");
    if (!grid) {
        console.error("Không tìm thấy phần tử .excel-grid!");
        return;
    }

    // 2. Gắn sự kiện cho nút "Thêm dòng"
    const addRowButton = document.getElementById('addRowBtn');
    if (addRowButton) {
        addRowButton.addEventListener('click', () => {
            const newInputs = addNewRow();
            attachEnterNavigation(newInputs);
            newInputs[0].focus();
        });
    }

    // 3. Gắn sự kiện Enter cho các dòng đã có sẵn trong HTML
    const existingInputs = Array.from(grid.querySelectorAll('input'));
    const colCount = 6;
    for (let i = 0; i < existingInputs.length; i += colCount) {
        attachEnterNavigation(existingInputs.slice(i, i + colCount));
    }

    // 4. Khởi chạy chức năng thay đổi kích thước grid
    makeGridResizable();
});
const logButton = document.getElementById('logBtn');
if (logButton) {
    logButton.addEventListener('click', () => {
        const grid = document.querySelector('.excel-grid');
        const inputs = Array.from(grid.querySelectorAll('input'));
        const rows = [];
        const colCount = 6;

        for (let i = 0; i < inputs.length; i += colCount) {
            const row = inputs.slice(i, i + colCount).map(input => input.value.trim());
            const isEmpty = row.every(val => val === '');
            if (!isEmpty) {
                rows.push(row);
            }
        }

        if (rows.length === 0) {
            alert('⚠️ Không có dòng dữ liệu để ghi log.');
            return;
        }

        fetch('https://za-log-proxy-4pkb9hu3p-hung-za.vercel.app/api/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rows })
})
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                alert(`✅ ${data.message || 'Ghi log thành công!'}`);
                console.log('[Ghi Log]', rows);
            } else {
                throw new Error(data.message || 'Lỗi không xác định từ server.');
            }
        })
        .catch(err => {
            console.error('❌ Lỗi khi ghi log:', err);
            alert('❌ Lỗi khi ghi log:\n' + err.message);
        });
    });
}
