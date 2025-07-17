// ✅ XỬ LÝ RIÊNG TỪNG CỘT

export function index0(input) {
  input.addEventListener('blur', () => {
    input.value = input.value.trim();
  });
}

export function index1(input) {
  input.addEventListener('blur', () => {
    let value = input.value.trim();
    if (!value) return;

    let parts = value.split('/');
    if (parts.length < 2) return;

    let [day, month, year] = parts;
    const currentYear = new Date().getFullYear();

    day = day.padStart(2, '0');
    month = month.padStart(2, '0');

    if (!year) {
      year = currentYear;
    } else if (year.length === 1) {
      year = '200' + year;
    } else if (year.length === 2) {
      year = (+year >= 50 ? '19' : '20') + year;
    }

    input.value = `${day}/${month}/${year}`;
  });
}

export function ganSuKienTheoCot() {
  document.querySelectorAll('.excel-cell input[data-col]').forEach(input => {
    const col = parseInt(input.dataset.col);
    switch (col) {
      case 0: index0(input); break;
      case 1: index1(input); break;
    }
  });
}
