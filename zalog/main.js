//✅ CẢI TIẾN: Gom tất cả các hằng số lên đầu để dễ quản lý.
const KHACH_HANG_API_URL = "https://script.google.com/macros/s/AKfycbw6DcLseuze9340EK396D1JE9Of1qk0eyzQGd1Te19p0gnn-dwwioq1zS_1Iwe1WNY/exec";
const LOG_API_URL = "https://script.google.com/macros/s/AKfycbwhGc1NHndpO2IYfEhFDFAiLHyTi1LqlWFSnfqtSxWPEQ5bCw7r4idZ23qvb83PitB0Dw/exec";
const GHI_LOG_PROXY_URL = 'https://za-log-proxy-4pkb9hu3p-hung-za.vercel.app/api/proxy';
const FORM_COLUMN_COUNT = 6;
const LOG_COLUMN_COUNT = 26;

let khachHangList = [];
let suggestionBox = null;
const ExcelGrid = {
    // --- CẤU HÌNH ---
    gridElement: null,
    _inputCache: [],
    FORM_COLUMN_COUNT: 6,
    TOTAL_COLUMN_COUNT: 7,
    FIELDS_TO_KEEP_VALUE: [1, 5],

    // --- HÀM TIỆN ÍCH ---
    createElement(tag, options = {}) {
        const el = document.createElement(tag);
        for (const [key, value] of Object.entries(options)) {
            if (key === 'className') el.className = value;
            else if (key === 'textContent') el.textContent = value;
            else if (key === 'dataset') Object.assign(el.dataset, value);
            else el.setAttribute(key, value);
        }
        return el;
    },

    // --- HÀM NỘI BỘ ---
    _updateInputCache() {
        this._inputCache = Array.from(
            this.gridElement.querySelectorAll('.data-cell input, .data-cell select')
        );
    },

    _cloneInputElement(lastInput) {
        let newInput;

        if (lastInput?.tagName === 'SELECT') {
            newInput = this.createElement('select');
            newInput.innerHTML = lastInput.innerHTML;
        } else {
            const inputType = lastInput?.type || 'text';
            newInput = this.createElement('input', { type: inputType });
        }

        if (lastInput) {
            for (const attr of lastInput.attributes) {
                if (attr.name !== 'value' && attr.name !== 'id') {
                    newInput.setAttribute(attr.name, attr.value);
                }
            }
        }

        return newInput;
    },

    // --- HÀM CHÍNH ---
    addNewRow() {
        const lastCells = Array.from(
            this.gridElement.querySelectorAll('.excel-cell')
        ).slice(-this.TOTAL_COLUMN_COUNT);
        const newInputs = [];

        // 1. Tạo ô nhập liệu
        for (let i = 0; i < this.FORM_COLUMN_COUNT; i++) {
            const lastInput = lastCells[i]?.querySelector('input, select');
            const newInput = this._cloneInputElement(lastInput);

            if (
                lastInput &&
                this.FIELDS_TO_KEEP_VALUE.includes(i) &&
                lastInput.value.trim() !== ''
            ) {
                newInput.value = lastInput.value;
            }

            const newCell = this.createElement('div', {
                className: 'excel-cell data-cell',
            });
            newCell.appendChild(newInput);
            this.gridElement.appendChild(newCell);
            newInputs.push(newInput);
        }

        // 2. Tạo ô hành động
        const lastActionCell = lastCells[this.FORM_COLUMN_COUNT];
        const newActionCell = this.createElement('div', {
            className: 'excel-cell action-cell',
        });

        if (lastActionCell) {
            lastActionCell.childNodes.forEach((child) => {
                newActionCell.appendChild(child.cloneNode(true));
            });
        }

        this.gridElement.appendChild(newActionCell);

        this._updateInputCache();
        return newInputs;
    },
// Phím Enter
   handleKeyDown(e) {
    if (e.key !== 'Enter' || !e.target.closest('.data-cell')) return;

    e.preventDefault();
// ✅ Ghi lại nội dung người dùng vừa nhập (nếu cần xử lý hoặc làm sạch)
    const inputValue = e.target.value.trim();
    e.target.value = inputValue;  // Ghi lại nếu muốn cắt khoảng trắng

    console.log("📥 Dữ liệu đã nhập:", inputValue);
    const allInputs = this._inputCache;
    const currentIndex = allInputs.indexOf(e.target);

    if (currentIndex === -1) return;

    const isLastInRow = (currentIndex + 1) % this.FORM_COLUMN_COUNT === 0;

    if (isLastInRow) {
        const newInputs = this.addNewRow();
        newInputs[0]?.focus();
    } else {
        allInputs[currentIndex + 1]?.focus();
    }
},
    //Hết đoạn code


    init() {
        this.gridElement = document.querySelector('.excel-grid');
        if (!this.gridElement) {
            console.error("Không tìm thấy phần tử .excel-grid để khởi tạo.");
            return;
        }

        this.gridElement.addEventListener(
            'keydown',
            this.handleKeyDown.bind(this)
        );

        const hasInputs = this.gridElement.querySelectorAll(
            '.data-cell input, .data-cell select'
        ).length > 0;

        if (!hasInputs) {
            this.addNewRow();
        } else {
            this._updateInputCache();
        }
    },
};

// --- KHỞI TẠO SAU KHI DOM SẴN SÀNG ---
document.addEventListener('DOMContentLoaded', () => {
    ExcelGrid.init();
}); 
