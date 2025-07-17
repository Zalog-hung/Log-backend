// xulycot.js
import { goiykh } from './danhsachkhachhang.js';

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
    const now = new Date();
    year = year || now.getFullYear();

    if (year.length === 2) {
      year = +year >= 50 ? '19' + year : '20' + year;
    }

    input.value = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  });
}

export const index2 = goiykh;

export function index3(input) {
  input.addEventListener('blur', () => {
    const val = input.value.trim();
    if (val && isNaN(val)) {
      alert('⚠️ Số lượng phải là số!');
      input.focus();
    }
  });
}

export function index4(input) {
  input.addEventListener('blur', () => {
    const ca = input.value.trim().toLowerCase();
    if (ca && !['sáng', 'chiều', 'tối'].includes(ca)) {
      alert('⚠️ Ca không hợp lệ. Nhập: sáng, chiều hoặc tối.');
      input.focus();
    }
  });
}

export function index5(input) {
  input.addEventListener('blur', () => {
    const val = input.value.trim();
    if (!val) {
      alert('⚠️ Vui lòng nhập tên tài xế.');
      input.focus();
    }
  });
}
