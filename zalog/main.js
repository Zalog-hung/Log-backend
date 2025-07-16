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
const ExcelGrid = {
    // --- KHAI BÁO & CẤU HÌNH ---
    gridElement: null,
    _inputCache: [],
    FORM_COLUMN_COUNT: 6,
    TOTAL_COLUMN_COUNT: 7,
    FIELDS_TO_KEEP_VALUE: [1, 5],

    // --- CÁC HÀM TIỆN ÍCH & "PRIVATE" ---

    /**
     * Hàm tiện ích để tạo phần tử HTML.
     */
    createElement: function(tag, options = {}) {
        const el = document.createElement(tag);
        Object.entries(options).forEach(([key, value]) => {
            if (key === 'className') el.className = value;
            else if (key === 'textContent') el.textContent = value;
            else if (key === 'dataset') Object.assign(el.dataset, value);
            else el.setAttribute(key, value);
        });
        return el;
    },

    /**
     * ✅ CẢI TIẾN 3: Đảm bảo cache chỉ chứa các input trong vùng dữ liệu.
     * Bằng cách query các phần tử trong cell có class '.data-cell'.
     */
    _updateInputCache: function() {
        this._inputCache = Array.from(this.gridElement.querySelectorAll(".data-cell input, .data-cell select"));
    },

    /**
     * ✅ CẢI TIẾN 4: Tách logic clone ô dữ liệu thành hàm riêng.
     * Hàm này chịu trách nhiệm tạo ra một ô nhập liệu mới dựa trên ô cũ.
     * @param {HTMLElement} lastInput - Phần tử input/select của dòng trước.
     * @returns {HTMLElement} - Thẻ input/select mới.
     */
    _cloneInputElement: function(lastInput) {
        let newInput;
        
        /**
         * ✅ CẢI TIẾN 1: Clone đúng loại phần tử (input hoặc select).
         * Kiểm tra tagName để quyết định tạo 'select' hay 'input'.
         */
        if (lastInput?.tagName === 'SELECT') {
            newInput = this.createElement('select');
            // Sao chép tất cả các <option> bên trong.
            newInput.innerHTML = lastInput.innerHTML; 
        } else {
            // Lấy đúng 'type' của input cũ (text, number, date...) hoặc mặc định là 'text'.
            const inputType = lastInput?.type || 'text';
            newInput = this.createElement('input', { type: inputType });
        }
        
        // Sao chép các thuộc tính cần thiết, bỏ qua value và id.
        if (lastInput) {
            for (const attr of lastInput.attributes) {
                if (attr.name !== 'value' && attr.name !== 'id') {
                    newInput.setAttribute(attr.name, attr.value);
                }
            }
        }
        return newInput;
    },

    // --- CÁC HÀM CHÍNH ---

    /**
     * ✅ CẢI TIẾN 4: Hàm thêm dòng mới được cấu trúc lại cho dễ đọc.
     * Sử dụng các hàm helper để thực hiện các tác vụ con.
     */
    addNewRow: function() {
        const lastCells = Array.from(this.gridElement.querySelectorAll('.excel-cell')).slice(-this.TOTAL_COLUMN_COUNT);
        const newInputs = [];

        // 1. Tạo các ô nhập liệu mới.
        for (let i = 0; i < this.FORM_COLUMN_COUNT; i++) {
            const lastInput = lastCells[i]?.querySelector('input, select');
            const newInput = this._cloneInputElement(lastInput);

            // Giữ lại giá trị nếu cột được cấu hình.
            if (lastInput && this.FIELDS_TO_KEEP_VALUE.includes(i) && lastInput.value.trim() !== '') {
                newInput.value = lastInput.value;
            }
            
            // ✅ CẢI TIẾN 3: Thêm class 'data-cell' để phân biệt với 'action-cell'.
            const newCell = this.createElement('div', { className: 'excel-cell data-cell' });
            newCell.appendChild(newInput);
            this.gridElement.appendChild(newCell);
            newInputs.push(newInput);
        }

        // 2. Tạo ô hành động mới.
        const lastActionCell = lastCells[this.FORM_COLUMN_COUNT];
        const newActionCell = this.createElement('div', { className: 'excel-cell action-cell' });
        if (lastActionCell) {
            Array.from(lastActionCell.childNodes).forEach(childNode => {
                newActionCell.appendChild(childNode.cloneNode(true));
            });
        }
        this.gridElement.appendChild(newActionCell);

        this._updateInputCache();
        return newInputs;
    },

    /**
     * Hàm xử lý sự kiện nhấn phím Enter.
     */
    handleKeyDown: function(e) {
        if (e.key !== "Enter" || !e.target.closest('.data-cell')) return;
        
        e.preventDefault();
        const allInputs = this._inputCache; 
        const currentIndex = allInputs.indexOf(e.target);
        
        if (currentIndex === -1) return;

        const isLastInRow = (currentIndex + 1) % this.FORM_COLUMN_COUNT === 0;

        if (isLastInRow) {
            const newInputs = this.addNewRow();
            
            // ✅ CẢI TIẾN 2: Tinh giản logic focus, không cần tìm kiếm lại.
            newInputs[0]?.focus();
        } else {
            allInputs[currentIndex + 1]?.focus();
        }
    },
    
    /**
     * Hàm khởi tạo module.
     */
    init: function() {
        this.gridElement = document.querySelector('.excel-grid');
        if (!this.gridElement) {
            console.error("Không tìm thấy phần tử .excel-grid để khởi tạo.");
            return;
        }

        this.gridElement.addEventListener('keydown', this.handleKeyDown.bind(this));

        if (this.gridElement.querySelectorAll(".data-cell input, .data-cell select").length === 0) {
            this.addNewRow();
        } else {
            this._updateInputCache();
        }
    }
};

// Chạy hàm khởi tạo.
document.addEventListener('DOMContentLoaded', () => {
    ExcelGrid.init();
});
