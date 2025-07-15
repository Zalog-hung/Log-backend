// =================================================================
// === KHAI BÁO BIẾN VÀ HẰNG SỐ ===
// =================================================================
const KHACH_HANG_API_URL = "https://script.google.com/macros/s/AKfycbw6DcLseuze9340EK396D1JE9Of1qk0eyzQGd1Te19p0gnn-dwwioq1zS_1Iwe1WNY/exec";
const LOG_API_URL = "https://script.google.com/macros/s/AKfycbwhGc1NHndpO2IYfEhFDFAiLHyTi1LqlWFSnfqtSxWPEQ5bCw7r4idZ23qvb83PitB0Dw/exec";
const GHI_LOG_PROXY_URL = 'https://za-log-proxy-4pkb9hu3p-hung-za.vercel.app/api/proxy';
const FORM_COLUMN_COUNT = 6;

let khachHangList = [];
let suggestionBox = null; // ✅ SỬA LỖI: Chỉ dùng một hộp gợi ý duy nhất cho toàn bộ ứng dụng

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

// Hàm fetchAndShowLog giữ nguyên, không thay đổi

// =================================================================
// === CÁC HÀM GIAO DIỆN VÀ SỰ KIỆN (UI & EVENTS) ===
// =================================================================
function makeGridResizable() { /* Logic giữ nguyên */ }
function addNewRow() { /* Logic giữ nguyên */ }

/**
 * ✅ SỬA LỖI: Tái cấu trúc lại toàn bộ hàm xử lý gợi ý
 * @param {HTMLInputElement} input - Ô input đang được gõ.
 */
function handleKhachHang(input) {
    // Hiện hộp gợi ý với danh sách đã lọc
    const showSuggestions = (filtered) => {
        if (!suggestionBox) return; // Nếu hộp chưa được tạo thì thoát

        const rect = input.getBoundingClientRect();
        suggestionBox.style.left = `${rect.left + window.scrollX}px`;
        suggestionBox.style.top = `${rect.bottom + window.scrollY}px`;
        suggestionBox.style.width = `${rect.width}px`;
        suggestionBox.innerHTML = ''; // Xóa các gợi ý cũ
        
        if (!filtered.length) {
            suggestionBox.style.display = 'none';
            return;
        }

        filtered.forEach(name => {
            const item = createElement('div', { className: 'suggestion-item', textContent: name });
            item.addEventListener('mousedown', (e) => { // Dùng mousedown để sự kiện blur không kịp chạy trước
                e.preventDefault();
                const lastPlusIndex = input.value.lastIndexOf('+');
                const base = lastPlusIndex === -1 ? '' : input.value.slice(0, lastPlusIndex + 1).trim() + ' ';
                input.value = base + name;
                suggestionBox.style.display = 'none';
                input.focus();
            });
            suggestionBox.appendChild(item);
        });
        suggestionBox.style.display = 'block';
    };
    
    // Cập nhật danh sách gợi ý mỗi khi người dùng gõ
    const onInput = () => {
        if (!khachHangList.length) return; // Nếu danh sách khách hàng rỗng thì không làm gì
        const lastPlusIndex = input.value.lastIndexOf('+');
        const searchText = (lastPlusIndex === -1 ? input.value : input.value.slice(lastPlusIndex + 1)).trim().toLowerCase();
        
        if (!searchText) {
            if (suggestionBox) suggestionBox.style.display = 'none';
            return;
        }
        const filtered = khachHangList.filter(kh => kh.toLowerCase().includes(searchText));
        showSuggestions(filtered);
    };
    
    // Ẩn hộp gợi ý khi người dùng click ra ngoài
    const onBlur = () => {
        setTimeout(() => {
            if (suggestionBox) suggestionBox.style.display = 'none';
        }, 150); // Delay một chút để sự kiện click vào gợi ý kịp chạy
    };

    // Gắn sự kiện
    input.addEventListener('input', onInput);
    input.addEventListener('blur', onBlur);
}

// Các hàm handleSoLuong, handleNgay, handleInputByIndex, ghiLogData giữ nguyên
function handleSoLuong(input) { /* Logic giữ nguyên */ }
function handleNgay(input) { /* Logic giữ nguyên */ }
function handleInputByIndex(index, input) { /* Logic giữ nguyên */ }
function ghiLogData() { /* Logic giữ nguyên */ }

/**
 * Gắn các sự kiện cần thiết cho một dòng input.
 * @param {HTMLInputElement[]} inputs - Mảng các ô input của một dòng.
 */
function attachEventListenersToRow(inputs) {
    if (!inputs || inputs.length === 0) return;

    inputs.forEach((input, index) => {
        // Chỉ gắn xử lý gợi ý cho ô khách hàng (cột thứ 3, index = 2)
        if (index === 2) {
            handleKhachHang(input);
        }

        // Điều hướng bằng phím Enter
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleInputByIndex(index, input); // Xử lý dữ liệu khi Enter

                const nextIndex = index + 1;
                if (nextIndex < inputs.length) {
                    inputs[nextIndex].focus(); // Chuyển sang ô kế tiếp
                } else {
                    const newInputs = addNewRow(); // Hết dòng thì thêm dòng mới
                    attachEventListenersToRow(newInputs); // Gắn sự kiện cho dòng mới đó
                    newInputs[0].focus(); // Focus vào ô đầu tiên của dòng mới
                }
            }
        });
    });
}


// =================================================================
// === KHỐI LỆNH CHÍNH (MAIN EXECUTION BLOCK) ===
// =================================================================

/**
 * ✅ SỬA LỖI: Tạo một hàm `init` bất đồng bộ để đảm bảo thứ tự thực thi
 */
async function initApp() {
    console.log("🚀 Ứng dụng đang khởi chạy...");
    
    // Bước 1: Tạo các thành phần giao diện chung
    suggestionBox = createElement('div', { className: 'suggestions-container' });
    document.body.appendChild(suggestionBox); // Tạo hộp gợi ý và ẩn nó đi
    suggestionBox.style.display = 'none';

    // Bước 2: Tải các dữ liệu nền. Dùng `await` để chờ tải xong danh sách khách hàng.
    await loadKhachHangList();
    // fetchAndShowLog(); // Có thể chạy song song không cần await nếu muốn

    // Bước 3: Sau khi đã có dữ liệu, bắt đầu gắn các sự kiện
    const grid = document.querySelector(".excel-grid");
    if (!grid) {
        console.error("Không tìm thấy .excel-grid!");
        return;
    }

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

    makeGridResizable();
    
    console.log("✅ Ứng dụng đã sẵn sàng!");
}


// Chạy hàm khởi tạo chính khi trang đã tải xong
document.addEventListener('DOMContentLoaded', initApp);
