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
//............................GÁN SỰ KIỆN; HÀM VÀO NÚT.....................................................
document.getElementById('addnewrow').addEventListener('click', addNewRow);//.................GẮN HÀM THÊM DÒNG VÀO NÚT THÊM DÒNG
document.querySelectorAll('.action-cell button').forEach(button => {
    if (button.textContent.includes('🗑️')) {
        button.addEventListener('click', function () {
            deleteRow(this);
        }); } });// ..........................................................................GÁN HÀM XÓA DÒNG VÀO NÚT XÓA

 //..............................................HÀM THÊM DÒNG........................................................
function addNewRow() {
    const allCells = Array.from(gridElement.querySelectorAll('.excel-cell'));
    const lastRowCells = allCells.slice(-formConfig.TOTAL_COLUMN_COUNT);
    const newInputs = [];

    for (let i = 0; i < formConfig.FORM_COLUMN_COUNT; i++) {
        const lastInput = lastRowCells[i]?.querySelector('input, select');
        const newInput = lastInput ? lastInput.cloneNode(true) : document.createElement('input');

        // Giữ lại giá trị nếu cột là "Khách Hàng" (2) hoặc "Ca" (4)
        if (formConfig.FIELDS_TO_KEEP_VALUE.includes(i) && lastInput) {
            newInput.value = lastInput.value.trim();
        } else {
            newInput.value = '';
        }
        const newCell = document.createElement('div');
        newCell.className = 'excel-cell data-cell';
        newCell.appendChild(newInput);
        gridElement.appendChild(newCell);
        newInputs.push(newInput);
    }

    // Thêm ô hành động (nút sửa, xóa, tách)
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
//............................HÀM XÓA DÒNG.......................
function deleteRow(button) {
    const actionCell = button.closest('.excel-cell');
    const rowStartIndex = Array.from(gridElement.children).indexOf(actionCell) - formConfig.FORM_COLUMN_COUNT;

    if (rowStartIndex >= 0) {
        for (let i = formConfig.TOTAL_COLUMN_COUNT - 1; i >= 0; i--) {
            gridElement.children[rowStartIndex + i].remove();}}}
//................................................................
// ....................CỘT 1 (INDEX0) ID CHUYẾN.........
if (index === 0) {
    newInput.addEventListener('blur', () => {
        newInput.value = newInput.value.trim();});}
//...........CỘT 2 (INDEX1) NGÀY..............
function index1(input) {
    input.addEventListener('blur', () => {
        let value = input.value.trim();
        if (!value) return;

        const parts = value.split('/');
        let day = parts[0] || '';
        let month = parts[1] || '';
        let year = parts[2] || new Date().getFullYear();

        if (day.length === 1) day = '0' + day;
        if (month.length === 1) month = '0' + month;
        if (year.length === 2) year = '20' + year;

        input.value = `${day}/${month}/${year}`;
    });
}

// Gọi ngay sau khi định nghĩa
document.querySelectorAll('.excel-cell input[type="text"]').forEach((input) => {
    const cell = input.closest('.excel-cell');
    const cells = Array.from(cell.parentElement.children);
    const cellIndex = cells.indexOf(cell);
    if (cellIndex % 7 === 1) {
        index1(input);
    }
});
//

