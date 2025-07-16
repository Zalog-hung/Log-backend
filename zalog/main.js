//✅ LINK FILE/KHAI BÁO
const KHACH_HANG_API_URL = "https://script.google.com/macros/s/AKfycbw6DcLseuze9340EK396D1JE9Of1qk0eyzQGd1Te19p0gnn-dwwioq1zS_1Iwe1WNY/exec";
const LOG_API_URL = "https://script.google.com/macros/s/AKfycbwhGc1NHndpO2IYfEhFDFAiLHyTi1LqlWFSnfqtSxWPEQ5bCw7r4idZ23qvb83PitB0Dw/exec";
const GHI_LOG_PROXY_URL = 'https://za-log-proxy-4pkb9hu3p-hung-za.vercel.app/api/proxy';
const FORM_COLUMN_COUNT = 6;
const LOG_COLUMN_COUNT = 26;
const formConfig = {
  TOTAL_COLUMN_COUNT: 7,
  FORM_COLUMN_COUNT: 6,
  FIELDS_TO_KEEP_VALUE: [1, 4],}; // .....................................................Giữ lại giá trị "Khách Hàng" và "Ca"
const gridElement = document.querySelector('.excel-grid');

let khachHangList = [];
//✅............................GÁN SỰ KIỆN; HÀM VÀO NÚT.....................................................
document.getElementById('addnewrow').addEventListener('click', addNewRow);//.................GẮN HÀM THÊM DÒNG VÀO NÚT THÊM DÒNG
document.querySelectorAll('.action-cell button').forEach(button => {
    if (button.textContent.includes('🗑️')) {
        button.addEventListener('click', function () {
            deleteRow(this);
        }); } });// ..........................................................................GÁN HÀM XÓA DÒNG VÀO NÚT XÓA

 //✅..............................................HÀM THÊM DÒNG........................................................
function addNewRow() {
    const allCells = Array.from(gridElement.querySelectorAll('.excel-cell'));
    const lastRowCells = allCells.slice(-formConfig.TOTAL_COLUMN_COUNT);
    const newInputs = [];

    for (let i = 0; i < formConfig.FORM_COLUMN_COUNT; i++) {
        const lastInput = lastRowCells[i]?.querySelector('input, select');
        const newInput = document.createElement('input');

        // Copy kiểu input nếu cần
        newInput.type = lastInput?.type || 'text';
        newInput.className = lastInput?.className || '';

        // Giữ lại giá trị nếu cột thuộc danh sách giữ
        if (formConfig.FIELDS_TO_KEEP_VALUE.includes(i) && lastInput) {
            newInput.value = lastInput.value.trim();
        } else {
            newInput.value = '';
        }

        //  Gán định dạng tương ứng với từng cột
        if (i === 0) index0(newInput);
        if (i === 1) index1(newInput);
        if (i === 2) index2(newInput);
        if (i === 3) index3(newInput);
        if (i === 4) index4(newInput);
        if (i === 5) index5(newInput);

        const newCell = document.createElement('div');
        newCell.className = 'excel-cell data-cell';
        newCell.appendChild(newInput);
        gridElement.appendChild(newCell);
        newInputs.push(newInput);
    }

    // Thêm ô hành động (sửa, xóa, tách)
    const lastActionCell = lastRowCells[formConfig.FORM_COLUMN_COUNT];
    const newActionCell = document.createElement('div');
    newActionCell.className = 'excel-cell action-cell';

    if (lastActionCell) {
        lastActionCell.childNodes.forEach(child => {
            newActionCell.appendChild(child.cloneNode(true));
        });
    }

    gridElement.appendChild(newActionCell);
    return newInputs;
}

//✅............................HÀM XÓA DÒNG.......................
function deleteRow(button) {
    const actionCell = button.closest('.excel-cell');
    const rowStartIndex = Array.from(gridElement.children).indexOf(actionCell) - formConfig.FORM_COLUMN_COUNT;

    if (rowStartIndex >= 0) {
        for (let i = formConfig.TOTAL_COLUMN_COUNT - 1; i >= 0; i--) {
            gridElement.children[rowStartIndex + i].remove();}}}
//................................................................
// ✅.....................CỘT 0.........
function index0(input) {
    input.addEventListener('blur', () => {
        input.value = input.value.trim();
    });
}

document.querySelectorAll('.excel-cell input').forEach((input) => {
    const cell = input.closest('.excel-cell');
    if (!cell) return;

    const allCells = Array.from(cell.parentNode.children);
    const cellIndex = allCells.indexOf(cell);

    if (cellIndex % formConfig.TOTAL_COLUMN_COUNT === 0) {
        index0(input);
    }
});

//✅...........CỘT 2 (INDEX1) NGÀY..............
function index1(input) {
    input.addEventListener('blur', () => {
        let value = input.value.trim();
        if (!value) return;

        let [day, month, year] = value.split('/');
        const currentYear = new Date().getFullYear();

        // Bổ sung số 0 nếu thiếu
        if (day && day.length === 1) day = '0' + day;
        if (month && month.length === 1) month = '0' + month;

        // Nếu thiếu năm → dùng năm hiện tại
        if (!year) {
            year = currentYear;
        } else if (year.length === 2) {
            year = '20' + year;
        }

        input.value = `${day}/${month}/${year}`;
    });
}

document.querySelectorAll('.excel-cell').forEach((cell, i) => {
    if (i % 7 === 1) { // Cột "Ngày"
        const input = cell.querySelector('input[type="text"]');
        if (input) index1(input);
    }
});
