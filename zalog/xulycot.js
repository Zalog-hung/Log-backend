export function index0(input) {
  input.addEventListener('blur', () => {
    input.value = input.value.trim();
  });
}

export function index1(input) {
  input.addEventListener('blur', () => {
    let val = input.value.trim();
    if (!val) return;

    let [day, month, year] = val.split('/');
    if (!month) return;

    const now = new Date();
    year = year || now.getFullYear();
    if (year.length === 2) {
      year = +year >= 50 ? '19' + year : '20' + year;
    }

    input.value = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  });
}

export function ganSuKienTheoCot() {
  document.querySelectorAll('input[data-col]').forEach(input => {
    const col = +input.dataset.col;
    if (col === 0) index0(input);
    if (col === 1) index1(input);
  });
}
