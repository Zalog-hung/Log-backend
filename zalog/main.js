// =================================================================
// === KHAI BÁO BIẾN VÀ HẰNG SỐ TOÀN CỤC ===
// =================================================================
// ✅ CẢI TIẾN: Gom tất cả các hằng số lên đầu để dễ quản lý.
const KHACH_HANG_API_URL = "https://script.google.com/macros/s/AKfycbw6DcLseuze9340EK396D1JE9Of1qk0eyzQGd1Te19p0gnn-dwwioq1zS_1Iwe1WNY/exec";
const LOG_API_URL = "https://script.google.com/macros/s/AKfycbwhGc1NHndpO2IYfEhFDFAiLHyTi1LqlWFSnfqtSxWPEQ5bCw7r4idZ23qvb83PitB0Dw/exec";
const GHI_LOG_PROXY_URL = 'https://za-log-proxy-4pkb9hu3p-hung-za.vercel.app/api/proxy';
const FORM_COLUMN_COUNT = 6;
const LOG_COLUMN_COUNT = 26;

let khachHangList = [];
let suggestionBox = null;

// =================================================================
// === CÁC HÀM TIỆN ÍCH (HELPERS) ===
// =================================================================
// ✅ CẢI TIẾN: Hàm tiện ích để tạo element, giúp code sạch hơn.
function createElement(tag, options = {}) {
    const el = document.createElement(tag);
    Object.entries(options).forEach(([key, value]) => {
        if (key === 'className') el.className = value;
        else if (key === 'textContent') el.textContent = value;
        else if (key === 'dataset') Object.assign(el.dataset, value);
        else el.setAttribute(key, value);
    });
    return el;
}

// =================================================================
// === CÁC HÀM CHÍNH (CORE FUNCTIONS) ===
// =================================================================

/**
 * Tải danh sách khách hàng từ Google Sheet.
 */
async function loadKhachHangList() {
    try {
        const res = await fetch(KHACH_HANG_API_URL);
        if (!res.ok) throw new Error(`Lỗi mạng: ${res.status}`);
        khachHangList = await res.json();
        console.log("✅ Tải danh sách khách hàng thành công:", khachHangList.length, "khách hàng");
    } catch (err) {
        console.error("❌ Lỗi không tải được danh sách khách hàng:", err);
        alert("Lỗi: Không tải được danh sách khách hàng. Chức năng gợi ý sẽ không hoạt động.");
    }
}

/**
 * Tải và hiển thị dữ liệu log trong một bảng.
 */
async function fetchAndShowLog() {
    const logArea = document.getElementById('logArea');
    if (!logArea) return;
    logArea.innerHTML = '[LOG] Hệ thống sẵn sàng.<br>⏳ Đang tải log...';

    try {
        const response = await fetch(LOG_API_URL);
        if (!response.ok) throw new Error(`Lỗi mạng: ${response.status}`);
        const data = await response.json();

        if (!data || data.length <= 1) {
            logArea.innerHTML += '<br>⚠️ Không có dữ liệu log.';
            return;
        }

        logArea.innerHTML = `[LOG] Hệ thống sẵn sàng.<br>📋 Tìm thấy ${data.length - 1} dòng log:`;
        
        // ✅ CẢI TIẾN: Logic tạo bảng được tách ra, không còn style trực tiếp trong JS.
        const table = createElement('table', { className: 'log-table' });
        
        // Tạo Header
        const trHead = createElement('tr');
        const headers = (Array.isArray(data[0]) ? data[0] : Object.values(data[0])).slice(0, LOG_COLUMN_COUNT);
        for (let i = 0; i < LOG_COLUMN_COUNT; i++) {
            trHead.appendChild(createElement('th', { textContent: headers[i] || `Cột ${i + 1}` }));
        }
        table.appendChild(trHead);

        // Tạo Body
        data.slice(1).forEach((rowData, rowIndex) => {
            if (!rowData || rowData.slice(0, LOG_COLUMN_COUNT).every(cell => cell === '')) return;
            const tr = createElement('tr');
            for (let col = 0; col < LOG_COLUMN_COUNT; col++) {
                const td = createElement('td', {
                    textContent: rowData[col] || '',
                    contentEditable: true,
                    dataset: { row: rowIndex + 1, col }
                });
                td.addEventListener('blur', () => {
                    console.log(`📝 Sửa log: dòng ${rowIndex + 2}, cột ${String.fromCharCode(65 + col)} → "${td.textContent.trim()}"`);
                });
                tr.appendChild(td);
            }
            table.appendChild(tr);
        });
        
        const wrapper = createElement('div', { className: 'log-table-wrapper' });
        wrapper.appendChild(table);
        logArea.appendChild(wrapper);

    } catch (err) {
        logArea.innerHTML += `<br>❌ Lỗi khi tải log: ${err.message}`;
        console.error(err);
    }
}

/**
 * Xử lý gợi ý khách hàng.
 * @param {HTMLInputElement} input - Ô input đang được gõ.
 */
function handleKhachHang(input) {
    const showSuggestions = (filtered) => {
        if (!suggestionBox) return;
        const rect = input.getBoundingClientRect();
        Object.assign(suggestionBox.style, {
            left: `${rect.left + window.scrollX}px`,
            top: `${rect.bottom + window.scrollY}px`,
            width: `${rect.width}px`,
            display: 'block'
        });
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
            });
            suggestionBox.appendChild(item);
        });
    };

    const onInput = () => {
        if (!khachHangList.length) return;
        const lastPlusIndex = input.value.lastIndexOf('+');
        const searchText = (lastPlusIndex === -1 ? input.value : input.value.slice(lastPlusIndex + 1)).trim().toLowerCase();
        if (!searchText) {
            if (suggestionBox) suggestionBox.style.display = 'none';
            return;
        }
        const filtered = khachHangList.filter(kh => kh.toLowerCase().includes(searchText));
        showSuggestions(filtered);
    };

    input.addEventListener('input', onInput);
    input.addEventListener('blur', () => { setTimeout(() => { if (suggestionBox) suggestionBox.style.display = 'none'; }, 150); });
}

// ... Các hàm khác như handleNgay, handleSoLuong, addNewRow, ghiLogData ...
// (Phần logic bên trong các hàm này được giữ nguyên như bản gốc của bạn)
function handleNgay(input) {
    const val = input.value.trim();
    if (!val) return;
    const dmPattern = /^(\d{1,2})[\/-](\d{1,2})$/;
    if (dmPattern.test(val)) {
        const [, d, m] = val.match(dmPattern);
        input.value = `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${new Date().getFullYear()}`;
    }
}
function handleSoLuong(input) {
    let parts = input.value.split('+').map(part => part.trim());
    const formatPart = (part) => {
        let hasT = part.toUpperCase().endsWith('T');
        if (hasT) part = part.slice(0, -1).trim();
        if (part === '' || isNaN(part)) return hasT ? `${part}T` : part;
        return parseFloat(part).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + (hasT ? 'T' : '');
    };
    input.value = parts.map(formatPart).filter(Boolean).join(' + ');
}
function addNewRow() {
    const grid = document.querySelector('.excel-grid');
    const allInputs = Array.from(grid.querySelectorAll('input'));
    const lastRowInputs = allInputs.slice(-FORM_COLUMN_COUNT);
    const newRowInputs = [];

    for (let i = 0; i < FORM_COLUMN_COUNT; i++) {
        const input = createElement('input', { type: 'text' });
        if (i === 4) input.setAttribute('list', 'ca-list');
        if ((i === 1 || i === 4) && lastRowInputs[i]?.value) {
            input.value = lastRowInputs[i].value;
        }
        const cell = createElement('div', { className: 'excel-cell' });
        cell.appendChild(input);
        grid.appendChild(cell);
        newRowInputs.push(input);
    }
    const actionCell = createElement('div', { className: 'excel-cell action-cell' });
    actionCell.innerHTML = `<button onclick="editRow(this)">✏️</button><button onclick="deleteRow(this)">🗑️</button><button onclick="splitRow(this)">⚙️</button>`;
    grid.appendChild(actionCell);
    return newRowInputs;
}

/**
 * Gắn các sự kiện cần thiết cho MỘT dòng input.
 */
function attachEventListenersToRow(inputs) {
    inputs.forEach((input, index) => {
        if (index === 2) handleKhachHang(input);
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const headers = Array.from(document.querySelectorAll('.header-cell'));
                const headerText = headers[index]?.textContent?.trim().toLowerCase();
                if (headerText === 'ngày') handleNgay(input);
                if (headerText === 'số lượng') handleSoLuong(input);

                const nextInput = inputs[index + 1];
                if (nextInput) {
                    nextInput.focus();
                } else {
                    const newInputs = addNewRow();
                    attachEventListenersToRow(newInputs);
                    newInputs[0].focus();
                }
            }
        });
    });
}


// =================================================================
// === KHỐI LỆNH CHÍNH (MAIN EXECUTION) ===
// =================================================================

/**
 * Hàm khởi tạo chính, chạy khi trang đã tải xong.
 */
async function initApp() {
    console.log("🚀 Ứng dụng đang khởi chạy...");
    
    // 1. Chuẩn bị các thành phần giao diện nền
    suggestionBox = createElement('div', { className: 'suggestions-container' });
    suggestionBox.style.display = 'none';
    document.body.appendChild(suggestionBox);

    // 2. Tải dữ liệu (chờ khách hàng, chạy song song log)
    fetchAndShowLog();
    await loadKhachHangList();
    
    // 3. Gắn sự kiện cho các thành phần đã có sẵn
    const grid = document.querySelector(".excel-grid");
    if (!grid) return console.error("Lỗi: Không tìm thấy .excel-grid!");

    document.getElementById('addRowBtn')?.addEventListener('click', () => {
        const newInputs = addNewRow();
        attachEventListenersToRow(newInputs);
        newInputs[0].focus();
    });
    
    // Gắn sự kiện cho các dòng đã có trong HTML
    const allExistingInputs = Array.from(grid.querySelectorAll('input'));
    for (let i = 0; i < allExistingInputs.length; i += FORM_COLUMN_COUNT) {
        attachEventListenersToRow(allExistingInputs.slice(i, i + FORM_COLUMN_COUNT));
    }
    document.getElementById('logBtn')?.addEventListener('click', ghiLogData); // gắn nút ghi log
    
    console.log("✅ Ứng dụng đã sẵn sàng!");
}

// Chạy hàm khởi tạo chính
document.addEventListener('DOMContentLoaded', initApp);
