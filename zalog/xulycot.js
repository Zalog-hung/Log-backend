// 📁 xulycot.js
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
    if (!month) return;

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
    if (val === '') return;

    const parts = val.split('+').map(p => p.trim());

    const isValid = parts.every(part => {
      if (!part) return false;

      // Nếu là số hợp lệ
      if (!isNaN(part)) return true;

      // Nếu kết thúc bằng T/t và phía trước là số
      if (/^\d+(\.\d+)?[Tt]$/.test(part)) return true;

      return false;
    });

    if (!isValid) {
      alert('⚠️ Số lượng không hợp lệ. Chỉ cho phép số hoặc định dạng như 5T, 10T!');
      input.focus();
    }
  });

  input.addEventListener('input', () => {
    input.dataset.touched = 'true';
  });
}

export function index4(input) {
  const OPTIONS = ['ngày', 'đêm'];
  let suggestionBox = null;

  const createBox = () => {
    document.querySelectorAll('.suggestions-container').forEach(el => el.remove());
    const box = document.createElement('div');
    box.className = 'suggestions-container';
    box.style.cssText = `
      position: absolute;
      z-index: 9999;
      border: 1px solid #ccc;
      background: #fff;
      font-size: 14px;
    `;
    document.body.appendChild(box);
    return box;
  };

  const showSuggestions = () => {
    if (!suggestionBox || !document.body.contains(suggestionBox)) {
      suggestionBox = createBox();
    }

    const rect = input.getBoundingClientRect();
    suggestionBox.style.left = `${rect.left + window.scrollX}px`;
    suggestionBox.style.top = `${rect.bottom + window.scrollY}px`;
    suggestionBox.style.width = `${rect.width}px`;
    suggestionBox.innerHTML = '';

    OPTIONS.forEach(ca => {
      const item = document.createElement('div');
      item.textContent = ca;
      item.style.cssText = 'padding: 4px 8px; cursor: pointer;';
      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
        input.value = ca;
        suggestionBox.style.display = 'none';
        input.focus();
      });
      suggestionBox.appendChild(item);
    });

    suggestionBox.style.display = 'block';
  };

  input.addEventListener('input', showSuggestions);

  input.addEventListener('blur', () => {
    setTimeout(() => {
      if (suggestionBox) suggestionBox.style.display = 'none';
    }, 150);

    const ca = input.value.trim().toLowerCase();
    if (ca && !['ngày', 'đêm'].includes(ca)) {
      alert('⚠️ Ca không hợp lệ. Nhập: ngày hoặc đêm.');
      input.focus();
    }
  });
}

export function index5(input) {
  // Cột "Ghi chú" không ràng buộc gì, có thể để trống hoặc ghi tự do
  input.addEventListener('blur', () => {
    input.value = input.value.trim();
  });
}
