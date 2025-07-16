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
    FIELDS_TO_KEEP_VALUE: [1, 5], // Giữ giá trị ở cột Loại (index 1) và Đơn vị (index 5)

    // --- CÁC HÀM CHÍNH ---

    /**
     * Hàm thêm một dòng mới vào bảng tính.
     * Toàn bộ logic được đặt trong hàm này để dễ theo dõi tuần tự.
     */
    addNewRow: function() {
        // Lấy các ô của dòng cuối cùng làm mẫu.
        const lastCells = Array.from(this.gridElement.querySelectorAll('.excel-cell')).slice(-this.TOTAL_COLUMN_COUNT);
        const newInputs = [];

        // ----- Vòng lặp tạo các ô nhập liệu mới -----
        for (let i = 0; i < this.FORM_COLUMN_COUNT; i++) {
            const lastInput = lastCells[i]?.querySelector('input, select');
            let newInput;

            // 1. TẠO Ô NHẬP LIỆU MỚI
            // Logic xác định và tạo đúng loại phần tử (input/select) được đặt ngay tại đây.
            if (lastInput?.tagName === 'SELECT') {
                newInput = document.createElement('select');
                newInput.innerHTML = lastInput.innerHTML; // Sao chép các <option>.
            } else {
                const inputType = lastInput?.type || 'text';
                newInput = document.createElement('input');
                newInput.type = inputType;
            }

            // Sao chép các thuộc tính từ ô mẫu (class, placeholder, etc.), trừ value và id.
            if (lastInput) {
                for (const attr of lastInput.attributes) {
                    if (attr.name !== 'value' && attr.name !== 'id') {
                        newInput.setAttribute(attr.name, attr.value);
                    }
                }
            }

            // Giữ lại giá trị ở các cột đã được cấu hình trong FIELDS_TO_KEEP_VALUE.
            if (lastInput && this.FIELDS_TO_KEEP_VALUE.includes(i) && lastInput.value.trim() !== '') {
                newInput.value = lastInput.value;
            }

            // Tạo ô chứa (cell) và thêm class 'data-cell' để phân biệt với ô hành động.
            const newCell = document.createElement('div');
            newCell.className = 'excel-cell data-cell';
            newCell.appendChild(newInput);
            this.gridElement.appendChild(newCell);
            newInputs.push(newInput);
        }

        // ----- 2. TẠO Ô HÀNH ĐỘNG MỚI -----
        const lastActionCell = lastCells[this.FORM_COLUMN_COUNT];
        const newActionCell = document.createElement('div');
        newActionCell.className = 'excel-cell action-cell';

        // Dùng cloneNode(true) để sao chép các nút một cách an toàn, giữ event listener.
        if (lastActionCell) {
            Array.from(lastActionCell.childNodes).forEach(childNode => {
                newActionCell.appendChild(childNode.cloneNode(true));
            });
        }
        this.gridElement.appendChild(newActionCell);

        // ----- 3. CẬP NHẬT CACHE VÀ TRẢ VỀ KẾT QUẢ -----
        this._updateInputCache();
        return newInputs;
    },

    /**
     * Hàm xử lý sự kiện nhấn phím Enter để điều hướng hoặc thêm dòng mới.
     */
    handleKeyDown: function(e) {
        // Chỉ hoạt động khi nhấn Enter bên trong một ô dữ liệu.
        if (e.key !== "Enter" || !e.target.closest('.data-cell')) return;
        
        e.preventDefault();
        const allInputs = this._inputCache; 
        const currentIndex = allInputs.indexOf(e.target);
        
        if (currentIndex === -1) return;

        const isLastInRow = (currentIndex + 1) % this.FORM_COLUMN_COUNT === 0;

        if (isLastInRow) {
            const newInputs = this.addNewRow();
            newInputs[0]?.focus(); // Focus vào ô đầu tiên của dòng mới.
        } else {
            allInputs[currentIndex + 1]?.focus();
        }
    },
    
    /**
     * Hàm tiện ích cập nhật cache chứa danh sách các input.
     * Tối ưu hiệu suất bằng cách tránh query DOM nhiều lần.
     */
    _updateInputCache: function() {
        this._inputCache = Array.from(this.gridElement.querySelectorAll(".data-cell input, .data-cell select"));
    },

    /**
     * Hàm khởi tạo module: tìm phần tử và gắn sự kiện.
     */
    init: function() {
        this.gridElement = document.querySelector('.excel-grid');
        if (!this.gridElement) {
            console.error("Không tìm thấy phần tử .excel-grid để khởi tạo.");
            return;
        }

        // Thêm một dòng đầu tiên để người dùng nhập liệu
        this.addNewRow();

        // Gắn một listener duy nhất cho toàn bộ bảng.
        this.gridElement.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Cấu hình mẫu cho một số ô
        const firstRowInputs = this.gridElement.querySelectorAll('.data-cell > *');
        if (firstRowInputs.length >= this.FORM_COLUMN_COUNT) {
            // Thay thế ô thứ 2 (index 1) bằng thẻ select
            const selectCell = firstRowInputs[1].parentElement;
            selectCell.innerHTML = `
                <select>
                    <option value="A">Loại A</option>
                    <option value="B">Loại B</option>
                    <option value="C">Loại C</option>
                </select>
            `;
            // Ô số lượng (index 3) là kiểu number
            firstRowInputs[3].type = 'number';
            firstRowInputs[3].placeholder = '0';
             // Ô đơn vị (index 5) là thẻ select
            const unitCell = firstRowInputs[5].parentElement;
            unitCell.innerHTML = `
                <select>
                    <option value="Cái">Cái</option>
                    <option value="Hộp">Hộp</option>
                    <option value="Thùng">Thùng</option>
                </select>
            `;
            // Cập nhật lại cache sau khi thay đổi cấu trúc
            this._updateInputCache();
        }
    }
};

// Chạy hàm khởi tạo sau khi trang đã tải xong.
document.addEventListener('DOMContentLoaded', () => {
    ExcelGrid.init();
});
