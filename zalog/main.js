// =================================================================
// === KHAI BÁO BIẾN VÀ HẰNG SỐ ===
// =================================================================

// ✅ Tinh gọn: Dùng hằng số để dễ quản lý và thay đổi URL
const KHACH_HANG_API_URL = "https://script.google.com/macros/s/AKfycbw6DcLseuze9340EK396D1JE9Of1qk0eyzQGd1Te19p0gnn-dwwioq1zS_1Iwe1WNY/exec";
const LOG_API_URL = "https://script.google.com/macros/s/AKfycbwhGc1NHndpO2IYfEhFDFAiLHyTi1LqlWFSnfqtSxWPEQ5bCw7r4idZ23qvb83PitB0Dw/exec";
const GHI_LOG_PROXY_URL = 'https://za-log-proxy-4pkb9hu3p-hung-za.vercel.app/api/proxy';
const FORM_COLUMN_COUNT = 6; // Số cột trong grid nhập liệu
const LOG_COLUMN_COUNT = 26; // Số cột trong bảng log

let khachHangList = []; // Biến toàn cục lưu danh sách khách hàng

// =================================================================
// === CÁC HÀM TIỆN ÍCH (HELPER FUNCTIONS) ===
// =================================================================

/**
 * ✅ Tinh gọn: Hàm tiện ích để tạo phần tử HTML một cách ngắn gọn.
 * @param {string} tag - Tên thẻ HTML (ví dụ: 'div', 'table').
 * @param {object} options - Các thuộc tính cho thẻ (className, textContent, ...).
 * @returns {HTMLElement} - Phần tử HTML đã được tạo.
 */
function createElement(tag, options = {}) {
    const el = document.createElement(tag);
    // Gán các thuộc tính cho phần tử
    Object.entries(options).forEach(([key, value]) => {
        if (key === 'className') el.className = value;
        else if (key === 'textContent') el.textContent = value;
        else if (key === 'dataset') Object.assign(el.dataset, value);
        else el.setAttribute(key, value);
    });
    return el;
}

// =================================================================
// === CÁC HÀM TẢI DỮ LIỆU (DATA FETCHING) ===
// =================================================================

async function loadKhachHangList() {
    try {
        const res = await fetch(KHACH_HANG_API_URL);
        khachHangList = await res.json();
        console.log("✅ Tải danh sách khách hàng thành công:", khachHangList.length, "khách hàng");
    } catch (err) {
        console.error("❌ Lỗi không tải được danh sách khách hàng:", err);
    }
}

async function fetchAndShowLog() {
    const logArea = document.getElementById('logArea');
    if (!logArea) return;
    logArea.innerHTML = '[LOG] Hệ thống sẵn sàng.<br>⏳ Đang tải log...';

    try {
        const response = await fetch(LOG_API_URL);
        const data = await response.json();

        if (!data || data.length <= 1) {
            logArea.innerHTML += '<br>⚠️ Không có dữ liệu log.';
            return;
        }

        logArea.innerHTML = `[LOG] Hệ thống sẵn sàng.<br>📋 Tìm thấy ${data.length - 1} dòng log:`;

        // ✅ Tinh gọn: Dùng hàm createElement và class CSS, không style trực tiếp
        const table = createElement('table', { className: 'log-table' });
        
        // --- Tạo Header ---
        const trHead = createElement('tr');
        const headers = (Array.isArray(data[0]) ? data[0] : Object.values(data[0])).slice(0, LOG_COLUMN_COUNT);
        for (let i = 0; i < LOG_COLUMN_COUNT; i++) {
            trHead.appendChild(createElement('th', { textContent: headers[i] || '' }));
        }
        table.appendChild(trHead);

        // --- Tạo Body ---
        data.slice(1).forEach((rawRowData, rowIndex) => {
            if (!rawRowData || rawRowData.slice(0, LOG_COLUMN_COUNT).every(cell => cell === '')) return; // Bỏ qua dòng trống
            
            const tr = createElement('tr');
            for (let col = 0; col < LOG_COLUMN_COUNT; col++) {
                const td = createElement('td', {
                    textContent: rawRowData[col] || '',
                    contentEditable: true,
                    dataset: { row: rowIndex + 1, col } // +1 để khớp với số dòng trong sheet
                });
                td.addEventListener('blur', () => {
                    console.log(`📝 Sửa log: dòng ${rowIndex + 2}, cột ${String.fromCharCode(65 + col)} → "${td.textContent.trim()}"`);
                    // TODO: Gửi dữ liệu đã sửa lên server
                });
                tr.appendChild(td);
            }
            table.appendChild(tr);
        });
        
        const wrapper = createElement('div', { className: 'log-table-wrapper' });
        wrapper.appendChild(table);
        logArea.appendChild(wrapper);

    } catch (err) {
        logArea.innerHTML += '<br>❌ Lỗi khi tải log.';
        console.error(err);
    }
}

// =================================================================
// === CÁC HÀM GIAO DIỆN VÀ SỰ KIỆN (UI & EVENTS) ===
// =================================================================

function makeGridResizable() { /* Logic giữ nguyên như cũ */ }

function addNewRow() {
    const grid = document.querySelector('.excel-grid');
    const allInputs = Array.from(grid.querySelectorAll('input'));
    const lastRowInputs = allInputs.slice(-FORM_COLUMN_COUNT);
    const newRowInputs = [];

    // Tạo các ô input cho dòng mới
    for (let i = 0; i < FORM_COLUMN_COUNT; i++) {
        const input = createElement('input', { type: 'text' });
        if (i === 4) input.setAttribute('list', 'ca-list'); // Gán datalist cho ô "Ca"
        
        // Sao chép giá trị từ dòng trước cho ô "Ngày" (1) và "Ca" (4)
        if ((i === 1 || i === 4) && lastRowInputs[i]?.value) {
            input.value = lastRowInputs[i].value;
        }

        const cell = createElement('div', { className: 'excel-cell' });
        cell.appendChild(input);
        grid.appendChild(cell);
        newRowInputs.push(input);
    }

    // Tạo ô hành động
    const actionCell = createElement('div', { className: 'excel-cell action-cell' });
    actionCell.innerHTML = `<button onclick="editRow(this)">✏️</button><button onclick="deleteRow(this)">🗑️</button>`;
    grid.appendChild(actionCell);

    makeGridResizable(); // Cập nhật lại tay cầm resize
    return newRowInputs; // Trả về các input của dòng mới để gắn sự kiện
}

function handleKhachHang(input) {
    let suggestionBox = document.querySelector('.suggestions-container');
    if (!suggestionBox) {
        // ✅ Tinh gọn: Dùng hàm createElement, style đã có trong CSS
        suggestionBox = createElement('div', { className: 'suggestions-container' });
        document.body.appendChild(suggestionBox);
    }

    const showSuggestions = (filtered) => {
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
            const item = createElement('div', { className: 'suggestion-item', textContent: name });
            item.addEventListener('mousedown', (e) => {
                e.preventDefault();
                const lastPlusIndex = input.value.lastIndexOf('+');
                const base = lastPlusIndex === -1 ? '' : input.value.slice(0, lastPlusIndex + 1).trim() + ' ';
                input.value = base + name;
                suggestionBox.style.display = 'none';
                input.focus();
                setTimeout(() => input.selectionStart = input.selectionEnd = input.value.length, 0);
            });
            suggestionBox.appendChild(item);
        });
        suggestionBox.style.display = 'block';
    };

    const updateSuggestions = () => {
        const lastPlusIndex = input.value.lastIndexOf('+');
        const searchText = (lastPlusIndex === -1 ? input.value : input.value.slice(lastPlusIndex + 1)).trim().toLowerCase();
        
        if (!searchText) {
            if (suggestionBox) suggestionBox.style.display = 'none';
            return;
        }
        showSuggestions(khachHangList.filter(kh => kh.toLowerCase().includes(searchText)));
    };
    
    input.addEventListener('input', updateSuggestions);
    input.addEventListener('blur', () => setTimeout(() => { if (suggestionBox) suggestionBox.style.display = 'none'; }, 150));
}

function handleSoLuong(input) { /* Logic giữ nguyên như cũ */ }
function handleNgay(input) { /* Logic giữ nguyên như cũ */ }

function handleInputByIndex(index, input) { /* Logic giữ nguyên như cũ */ }

function attachEnterNavigation(inputs) { /* Logic giữ nguyên như cũ */ }

function ghiLogData() {
    const grid = document.querySelector('.excel-grid');
    const rows = [];
    const inputs = Array.from(grid.querySelectorAll('input'));

    for (let i = 0; i < inputs.length; i += FORM_COLUMN_COUNT) {
        const rowData = inputs.slice(i, i + FORM_COLUMN_COUNT).map(input => input.value.trim());
        if (!rowData.every(val => val === '')) {
            rows.push(rowData);
        }
    }

    if (rows.length === 0) {
        alert('⚠️ Không có dòng dữ liệu để ghi log.');
        return;
    }

    // ✅ Tinh gọn: Fetch logic
    fetch(GHI_LOG_PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows })
    })
    .then(res => res.ok ? res.json() : Promise.reject(new Error(`Server responded with status ${res.status}`)))
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

    // 2. Gắn sự kiện cho các nút
    document.getElementById('addRowBtn')?.addEventListener('click', () => {
        const newInputs = addNewRow();
        attachEnterNavigation(newInputs);
        newInputs[0].focus();
    });
    
    // ✅ Sửa lỗi: Đưa event listener của nút Ghi Log vào trong DOMContentLoaded
    document.getElementById('logBtn')?.addEventListener('click', ghiLogData);

    // 3. Gắn sự kiện cho các dòng đã có sẵn
    const existingInputs = Array.from(grid.querySelectorAll('input'));
    for (let i = 0; i < existingInputs.length; i += FORM_COLUMN_COUNT) {
        attachEnterNavigation(existingInputs.slice(i, i + FORM_COLUMN_COUNT));
    }

    // 4. Khởi chạy chức năng thay đổi kích thước grid
    makeGridResizable();
});
