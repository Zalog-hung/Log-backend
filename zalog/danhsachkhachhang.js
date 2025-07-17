let khachHangList = [];

export async function loadKhachHangList() {
  try {
    const res = await fetch("https://script.google.com/macros/s/AKfycbw6DcLseuze9340EK396D1JE9Of1qk0eyzQGd1Te19p0gnn-dwwioq1zS_1Iwe1WNY/exec");
    khachHangList = await res.json();

    if (!Array.isArray(khachHangList)) {
      throw new Error("Dữ liệu không phải mảng");
    }

    console.log("✅ Tải danh sách khách hàng thành công:", khachHangList.length, "khách hàng");
  } catch (err) {
    console.error("❌ Lỗi không tải được danh sách khách hàng:", err);
    khachHangList = []; // reset lại để tránh lỗi undefined
  }
}

export function index2(input) {
  let suggestionBox = null;
  let debounceTimer = null;

  const createSuggestionBox = () => {
    // Xóa box cũ nếu có
    document.querySelectorAll('.suggestions-container').forEach(el => el.remove());

    const box = document.createElement('div');
    box.className = 'suggestions-container';
    box.style.cssText = `
      position: absolute;
      z-index: 9999;
      border: 1px solid #ccc;
      background: #fff;
      max-height: 150px;
      overflow-y: auto;
      font-size: 14px;
    `;
    document.body.appendChild(box);
    return box;
  };

  const showSuggestionBox = (filtered) => {
    if (!suggestionBox || !document.body.contains(suggestionBox)) {
      suggestionBox = createSuggestionBox();
    }

    const rect = input.getBoundingClientRect();
    suggestionBox.style.left = `${rect.left + window.scrollX}px`;
    suggestionBox.style.top = `${rect.bottom + window.scrollY}px`;
    suggestionBox.style.width = `${rect.width}px`;
    suggestionBox.innerHTML = '';

    if (!filtered.length) {
      suggestionBox.style.display = 'none';
      return;
    }

    filtered.forEach(name => {
      const item = document.createElement('div');
      item.textContent = name;
      item.style.cssText = 'padding: 4px 8px; cursor: pointer;';
      item.addEventListener('mousedown', (e) => {
        e.preventDefault();

        const currentVal = input.value;
        const lastPlusIndex = currentVal.lastIndexOf('+');

        if (lastPlusIndex === -1) {
          input.value = name;
        } else {
          const beforePlus = currentVal.slice(0, lastPlusIndex + 1);
          input.value = beforePlus + ' ' + name;
        }

        suggestionBox.style.display = 'none';
        input.focus();

        setTimeout(() => {
          input.selectionStart = input.selectionEnd = input.value.length;
        }, 0);
      });

      suggestionBox.appendChild(item);
    });

    suggestionBox.style.display = 'block';
  };

  const updateSuggestions = () => {
    if (!Array.isArray(khachHangList) || khachHangList.length === 0) return;

    const val = input.value;
    const lastPlusIndex = val.lastIndexOf('+');
    const searchText = lastPlusIndex === -1
      ? val.trim().toLowerCase()
      : val.slice(lastPlusIndex + 1).trim().toLowerCase();

    if (!searchText) {
      if (suggestionBox) suggestionBox.style.display = 'none';
      return;
    }

    const filtered = khachHangList.filter(kh =>
      kh.toLowerCase().includes(searchText)
    );

    showSuggestionBox(filtered);
  };

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updateSuggestions, 100);
  });

  input.addEventListener('blur', () => {
    setTimeout(() => {
      if (suggestionBox) suggestionBox.style.display = 'none';
    }, 150);
  });
}
