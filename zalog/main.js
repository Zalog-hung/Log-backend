// =================================================================
// === KHAI BÁO BIẾN VÀ HẰNG SỐ ===
// =================================================================
const KHACH_HANG_API_URL = "https://script.google.com/macros/s/AKfycbw6DcLseuze9340EK396D1JE9Of1qk0eyzQGd1Te19p0gnn-dwwioq1zS_1Iwe1WNY/exec";
const LOG_API_URL = "https://script.google.com/macros/s/AKfycbwhGc1NHndpO2IYfEhFDFAiLHyTi1LqlWFSnfqtSxWPEQ5bCw7r4idZ23qvb83PitB0Dw/exec";
const GHI_LOG_PROXY_URL = 'https://za-log-proxy-4pkb9hu3p-hung-za.vercel.app/api/proxy';
const FORM_COLUMN_COUNT = 6;

let khachHangList = [];
let suggestionBox = null; // ✅ Chỉ dùng một hộp gợi ý duy nhất cho toàn bộ ứng dụng

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

// =================================================================
// === CÁC HÀM GIAO DIỆN VÀ SỰ KIỆN (UI & EVENTS) ===
// =================================================================
/**
 * ✅ Đầy đủ logic để thêm dòng mới
 */
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
    // makeGridResizable(); // Sẽ được gọi sau khi gắn sự kiện
    return newRowInputs;
}

/**
 * ✅ Đầy đủ logic để xử lý gợi ý khách hàng
 * @param {HTMLInputElement} input
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
    const onBlur = () => {
        setTimeout(() => {
            if (suggestionBox) suggestionBox.style.display = 'none';
        }, 150);
    };
    input.addEventListener('input', onInput);
    input.addEventListener('blur', onBlur);
}

/**
 * ✅ Đầy đủ logic để định dạng ô Số Lượng
 */
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

/**
 * ✅ Đầy đủ logic để định dạng ô Ngày
 */
function handleNgay(input) {
    const val = input.value.trim();
    const dmPattern = /^(\d{1,2})[\/-](\d{1,2})$/;
    if (dmPattern.test(val)) {
        const [, d, m] = val.match(dmPattern);
        input.value = `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${new Date().getFullYear()}`;
    }
}

/**
 * ✅ Đầy đủ logic để điều hướng xử lý
 */
function handleInputByIndex(index, input) {
    const header = document.querySelectorAll('.header-cell')[index]?.textContent?.trim().toLowerCase();
    switch (header) {
        case 'ngày': handleNgay(input); break;
        case 'số lượng': handleSoLuong(input); break;
    }
}

/**
 * Gắn các sự kiện cần thiết cho một dòng input.
 * @param {HTMLInputElement[]} inputs - Mảng các ô input của một dòng.
 */
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


// =================================================================
// === KHỐI LỆNH CHÍNH (MAIN EXECUTION BLOCK) ===
// =================================================================

/**
 * Hàm khởi tạo chính, đảm bảo mọi thứ chạy đúng thứ tự.
 */
async function initApp() {
    console.log("🚀 Ứng dụng đang khởi chạy...");
    
    // 1. Tạo các thành phần giao diện chung
    suggestionBox = createElement('div', { className: 'suggestions-container' });
    document.body.appendChild(suggestionBox);
    suggestionBox.style.display = 'none';

    // 2. Tải dữ liệu nền (CHỜ cho xong)
    await loadKhachHangList();
    
    // 3. Gắn các sự kiện sau khi đã có dữ liệu
    const grid = document.querySelector(".excel-grid");
    if (!grid) return console.error("Không tìm thấy .excel-grid!");

    document.getElementById('addRowBtn')?.addEventListener('click', () => {
        const newInputs = addNewRow();
        attachEventListenersToRow(newInputs);
        newInputs[0].focus();
    });
    
    const existingInputs = Array.from(grid.querySelectorAll('input'));
    for (let i = 0; i < existingInputs.length; i += FORM_COLUMN_COUNT) {
        attachEventListenersToRow(existingInputs.slice(i, i + FORM_COLUMN_COUNT));
    }

    console.log("✅ Ứng dụng đã sẵn sàng!");
}

// Chạy hàm khởi tạo chính khi trang đã tải xong
document.addEventListener('DOMContentLoaded', initApp);
