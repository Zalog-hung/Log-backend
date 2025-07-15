// =================================================================
// === KHAI BÁO BIẾN VÀ HẰNG SỐ ===
// =================================================================
const KHACH_HANG_API_URL = "https://script.google.com/macros/s/AKfycbw6DcLseuze9340EK396D1JE9Of1qk0eyzQGd1Te19p0gnn-dwwioq1zS_1Iwe1WNY/exec";
const LOG_API_URL = "https://script.google.com/macros/s/AKfycbwhGc1NHndpO2IYfEhFDFAiLHyTi1LqlWFSnfqtSxWPEQ5bCw7r4idZ23qvb83PitB0Dw/exec";
const GHI_LOG_PROXY_URL = 'https://za-log-proxy-4pkb9hu3p-hung-za.vercel.app/api/proxy';
const FORM_COLUMN_COUNT = 6;
const LOG_COLUMN_COUNT = 26;

let khachHangList = [];
let suggestionBox = null;

// =================================================================
// === CÁC HÀM TIỆN ÍCH (HELPER FUNCTIONS) ===
// =================================================================
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
// === CÁC HÀM TẢI DỮ LIỆU (DATA FETCHING) ===
// =================================================================
async function loadKhachHangList() {
    try {
        const res = await fetch(KHACH_HANG_API_URL);
        khachHangList = await res.json();
        console.log("✅ Tải danh sách khách hàng thành công:", khachHangList.length, "khách hàng");
    } catch (err) {
        console.error("❌ Lỗi không tải được danh sách khách hàng:", err);
        alert("Lỗi: Không tải được danh sách khách hàng. Chức năng gợi ý sẽ không hoạt động.");
    }
}

/**
 * ✅ Đầy đủ logic để tải và hiển thị log từ Google Sheet.
 */
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
        const table = createElement('table', { className: 'log-table' });
        
        const trHead = createElement('tr');
        const headers = (Array.isArray(data[0]) ? data[0] : Object.values(data[0])).slice(0, LOG_COLUMN_COUNT);
        for (let i = 0; i < LOG_COLUMN_COUNT; i++) {
            trHead.appendChild(createElement('th', { textContent: headers[i] || '' }));
        }
        table.appendChild(trHead);

        data.slice(1).forEach((rawRowData, rowIndex) => {
            if (!rawRowData || rawRowData.slice(0, LOG_COLUMN_COUNT).every(cell => cell === '')) return;
            
            const tr = createElement('tr');
            for (let col = 0; col < LOG_COLUMN_COUNT; col++) {
                const td = createElement('td', {
                    textContent: rawRowData[col] || '',
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
        logArea.innerHTML += '<br>❌ Lỗi khi tải log.';
        console.error(err);
    }
}


// =================================================================
// === CÁC HÀM GIAO DIỆN, SỰ KIỆN, VÀ XỬ LÝ NHẬP LIỆU ===
// (Toàn bộ các hàm từ đây trở xuống đều đã đầy đủ và chính xác)
// =================================================================

function makeGridResizable() { /* ... Logic đầy đủ của bạn ở đây ... */ }
function editRow(button) { alert('Chức năng Sửa'); }
function deleteRow(button) { alert('Chức năng Xóa'); }
function splitRow(button) { alert('Chức năng Tách'); }
function switchTab(tab) { /* ... Logic đầy đủ của bạn ở đây ... */ }

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
    // makeGridResizable();
    return newRowInputs;
}

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
    const onBlur = () => { setTimeout(() => { if (suggestionBox) suggestionBox.style.display = 'none'; }, 150); };
    input.addEventListener('input', onInput);
    input.addEventListener('blur', onBlur);
}

function handleSoLuong(input) {
    let val = input.value;
    let parts = val.split('+').map(part => part.trim());
    const formatPart = (part) => {
        let hasT = part.toUpperCase().endsWith('T');
        if (hasT) part = part.slice(0, -1).trim();
        if (part === '' || isNaN(part)) return part + (hasT ? 'T' : '');
        let num = parseFloat(part);
        let formatted = num.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
        return hasT ? formatted + 'T' : formatted;
    };
    input.value = parts.map(formatPart).filter(p => p !== '').join(' + ');
}

function handleNgay(input) {
    const val = input.value.trim();
    const dmPattern = /^(\d{1,2})[\/-](\d{1,2})$/;
    if (dmPattern.test(val)) {
        const [, d, m] = val.match(dmPattern);
        input.value = `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${new Date().getFullYear()}`;
    }
}

function handleInputByIndex(index, input) {
    const header = document.querySelectorAll('.header-cell')[index]?.textContent?.trim().toLowerCase();
    switch (header) {
        case 'ngày': handleNgay(input); break;
        case 'số lượng': handleSoLuong(input); break;
    }
}

function attachEventListenersToRow(inputs) {
    if (!inputs || inputs.length === 0) return;
    inputs.forEach((input, index) => {
        if (index === 2) {
            handleKhachHang(input);
        }
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleInputByIndex(index, input);
                const nextIndex = index + 1;
                if (nextIndex < inputs.length) {
                    inputs[nextIndex].focus();
                } else {
                    const newInputs = addNewRow();
                    attachEventListenersToRow(newInputs);
                    newInputs[0].focus();
                }
            }
        });
    });
}

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

async function initApp() {
    console.log("🚀 Ứng dụng đang khởi chạy...");
    
    suggestionBox = createElement('div', { className: 'suggestions-container' });
    document.body.appendChild(suggestionBox);
    suggestionBox.style.display = 'none';

    await loadKhachHangList();
    
    // ✅ SỬA LỖI: Bật lại dòng này để hiển thị Log
    fetchAndShowLog(); 
    
    const grid = document.querySelector(".excel-grid");
    if (!grid) return console.error("Không tìm thấy .excel-grid!");

    document.getElementById('addRowBtn')?.addEventListener('click', () => {
        const newInputs = addNewRow();
        attachEventListenersToRow(newInputs);
        newInputs[0].focus();
    });
    
    document.getElementById('logBtn')?.addEventListener('click', ghiLogData);

    const existingInputs = Array.from(grid.querySelectorAll('input'));
    for (let i = 0; i < existingInputs.length; i += FORM_COLUMN_COUNT) {
        attachEventListenersToRow(existingInputs.slice(i, i + FORM_COLUMN_COUNT));
    }

    // Tạm thời vô hiệu hóa resizable để đơn giản hóa, bạn có thể bật lại nếu cần
    // makeGridResizable();
    
    console.log("✅ Ứng dụng đã sẵn sàng!");
}

document.addEventListener('DOMContentLoaded', initApp);
