//Gắn Hàm DataCol Để Định Nghĩa Index tương ứng gọi trong HTLM

function attachHandlersByDataCol() {
  document.querySelectorAll('.excel-cell input[data-col]').forEach(input => {
    const col = parseInt(input.dataset.col);

    switch (col) {
      case 0: index0(input); break;
      case 1: index1(input); break;
      // các cột khác sẽ thêm sau: index2(input), ...
    }
  });
}

attachHandlersByDataCol();

function index1(input) {
  input.addEventListener('blur', () => {
    let value = input.value.trim();
    if (!value) return;

    let [day, month, year] = value.split('/');
    const currentYear = new Date().getFullYear();

    if (day?.length === 1) day = '0' + day;
    if (month?.length === 1) month = '0' + month;

    if (!year) year = currentYear;
    else if (year.length === 2) year = '20' + year;

    input.value = `${day}/${month}/${year}`;
  });
}
