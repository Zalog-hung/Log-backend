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

