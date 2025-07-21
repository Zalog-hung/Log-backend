// 📁 xulycot.js - EVENT DELEGATION PATTERN (Excel-like Column Formatting)
// Version: 3.0 - Excel Column Model

// ✅ MÔ HÌNH: 1 listener cho toàn bộ grid, xử lý theo column type
// ✅ KHÔNG gán handlers cho từng input riêng
// ✅ Column-based logic giống Excel formatting
// ✅ Auto inheritance cho tất cả rows

// 🔧 GLOBAL STATE MANAGEMENT
const xulycolState = {
  isInitialized: false,
  delegationHandlers: new Map(),
  suggestionBoxes: new Set(),
  validationCache: new Map()
};

// 🚀 MAIN INITIALIZATION - Chỉ gọi 1 lần duy nhất
export function initEventDelegation() {
  if (xulycolState.isInitialized) {
    console.warn('⚠️ Event delegation already initialized');
    return;
  }

  const grid = document.querySelector('.excel-grid');
  if (!grid) {
    console.error('❌ .excel-grid not found');
    return;
  }

  console.log('🚀 Initializing Excel-like event delegation…');

  // 🎯 4 LISTENERS DUY NHẤT cho toàn bộ grid
  const handleFocus = (e) => {
    if (!e.target.matches('input[data-col]')) return;
    const col = parseInt(e.target.dataset.col);
    routeEvent(e.target, col, 'focus');
  };

  const handleBlur = (e) => {
    if (!e.target.matches('input[data-col]')) return;
    const col = parseInt(e.target.dataset.col);
    routeEvent(e.target, col, 'blur');
  };

  const handleInput = (e) => {
    if (!e.target.matches('input[data-col]')) return;
    const col = parseInt(e.target.dataset.col);
    routeEvent(e.target, col, 'input');
  };

  const handleKeydown = (e) => {
    if (!e.target.matches('input[data-col]')) return;
    const col = parseInt(e.target.dataset.col);
    routeEvent(e.target, col, 'keydown', e);
  };

  // Gán listeners với capture = true để handle tất cả rows
  grid.addEventListener('focus', handleFocus, true);
  grid.addEventListener('blur', handleBlur, true);
  grid.addEventListener('input', handleInput, true);
  grid.addEventListener('keydown', handleKeydown, true);

  // Lưu references để cleanup sau
  xulycolState.delegationHandlers.set('focus', handleFocus);
  xulycolState.delegationHandlers.set('blur', handleBlur);
  xulycolState.delegationHandlers.set('input', handleInput);
  xulycolState.delegationHandlers.set('keydown', handleKeydown);

  xulycolState.isInitialized = true;
  console.log('✅ Event delegation initialized - Excel column model active');
}

// 🎯 EVENT ROUTER - Phân phối sự kiện theo column type
function routeEvent(input, col, eventType, originalEvent = null) {
  try {
    switch (col) {
      case 0: handleIDColumn(input, eventType); break;
      case 1: handleDateColumn(input, eventType); break;
      case 2: handleCustomerColumn(input, eventType); break;
      case 3: handleQuantityColumn(input, eventType); break;
      case 4: handleShiftColumn(input, eventType, originalEvent); break;
      case 5: handleDriverColumn(input, eventType); break;
      default:
        console.warn(`⚠️ Unknown column: ${col}`);
    }
  } catch (err) {
    console.error(`❌ Error handling column ${col} ${eventType}:`, err);
  }
}

// 🛡️ HELPER: Tìm input cùng dòng (any row)
function findSameRowInput(currentInput, targetCol) {
  try {
    const allInputs = Array.from(document.querySelectorAll('input[data-col]'));
    const currentIndex = allInputs.indexOf(currentInput);
    if (currentIndex === -1) return null;

    // Tính row position (6 inputs per row)
    const rowStartIndex = Math.floor(currentIndex / 6) * 6;
    const targetIndex = rowStartIndex + targetCol;

    return allInputs[targetIndex] || null;
  } catch (err) {
    console.warn('⚠️ findSameRowInput error:', err);
    return null;
  }
}

// 🛡️ HELPER: Safe error handling
function showError(input, message) {
  console.error(`❌ ${message}`);
  alert(message);
  setTimeout(() => {
    try {
      input.focus();
      input.select();
    } catch (e) {
      console.warn('Focus error:', e);
    }
  }, 100);
}

// ✅ COLUMN 0: ID CHUYẾN - Excel Column Format
export function handleIDColumn(input, eventType) {
  switch (eventType) {
    case 'focus':
      handleIDFocus(input);
      break;
    case 'blur':
      handleIDBlur(input);
      break;
  }
}

function handleIDFocus(input) {
  if (input.value.trim()) return;

  // Tìm ngày cùng dòng để auto-gen
  const ngayInput = findSameRowInput(input, 1);
  const ngay = ngayInput?.value?.trim();

  if (!ngay || !/^\d{2}\/\d{2}\/\d{4}$/.test(ngay)) return;

  try {
    if (typeof window.idchuyen !== 'function') return;

    const nextTripId = window.idchuyen(ngay);
    if (typeof nextTripId === 'function') {
      const generatedId = nextTripId();
      input.value = generatedId;
      console.log(`🆔 Auto-generated ID: ${generatedId}`);
    }
  } catch (err) {
    console.error('❌ ID generation error:', err);
  }
}

function handleIDBlur(input) {
  const val = input.value.trim();
  if (!val) return;

  if (!/^\d{2}\.\d{2}\.\d{3}$/.test(val)) {
    showError(input, '❌ ID chuyến phải có format: dd.mm.xxx (VD: 15.03.001)');
    return;
  }

  input.value = val;
}

// ✅ COLUMN 1: NGÀY - Excel Column Format
export function handleDateColumn(input, eventType) {
  if (eventType === 'blur') {
    handleDateBlur(input);
  }
}

function handleDateBlur(input) {
  let val = input.value.trim();
  if (!val) return;

  try {
    let [day, month, year] = val.split('/').map(s => s.trim());

    if (!day || !month) {
      showError(input, '❌ Format ngày: dd/mm/yyyy');
      return;
    }

    const now = new Date();
    if (!year) {
      year = now.getFullYear();
    } else if (year.length === 2) {
      const y = parseInt(year);
      year = y >= 50 ? 1900 + y : 2000 + y;
    }

    const d = parseInt(day);
    const m = parseInt(month);
    const y = parseInt(year);

    if (isNaN(d) || isNaN(m) || isNaN(y) ||
        d < 1 || d > 31 || m < 1 || m > 12 || y < 1900 || y > 2100) {
      showError(input, '❌ Ngày không hợp lệ!');
      return;
    }

    // Validate real date
    const testDate = new Date(y, m - 1, d);
    if (testDate.getDate() !== d || testDate.getMonth() !== m - 1 || testDate.getFullYear() !== y) {
      showError(input, '❌ Ngày không tồn tại (VD: 30/02, 31/04)!');
      return;
    }

    const formatted = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
    input.value = formatted;

    // Trigger ID auto-generation
    const idInput = findSameRowInput(input, 0);
    if (idInput && !idInput.value.trim()) {
      setTimeout(() => {
        const focusEvent = new Event('focus', { bubbles: true });
        idInput.dispatchEvent(focusEvent);
      }, 50);
    }
  } catch (error) {
    showError(input, '❌ Lỗi xử lý ngày!');
  }
}

// ✅ COLUMN 2: KHÁCH HÀNG - Excel Column Format
export function handleCustomerColumn(input, eventType) {
  if (eventType === 'blur') {
    input.value = input.value.trim();
  }

  // Integrate với goiykh nếu available (chỉ gọi 1 lần)
  if (eventType === 'focus' && !input._goiykh_attached) {
    if (typeof window.goiykh === 'function') {
      try {
        window.goiykh(input);
        input._goiykh_attached = true;
        console.log('✅ Customer autocomplete attached');
      } catch (err) {
        console.warn('⚠️ goiykh attachment error:', err);
      }
    }
  }
}

// ✅ COLUMN 3: SỐ LƯỢNG - Excel Column Format
export function handleQuantityColumn(input, eventType) {
  if (eventType === 'blur') {
    handleQuantityBlur(input);
  } else if (eventType === 'input') {
    input.dataset.touched = 'true';
  }
}

function handleQuantityBlur(input) {
  const val = input.value.trim();
  if (!val) return;

  // Prevent re-validation if already validating
  if (input._validating) return;
  input._validating = true;

  try {
    const parts = val.split('+').map(p => p.trim()).filter(Boolean);

    if (parts.length === 0) {
      showError(input, '❌ Số lượng không được rỗng!');
      return;
    }

    // Validate each part
    for (const part of parts) {
      if (!/^\d+(\.\d+)?[Tt]?$/.test(part)) {
        showError(input, `❌ "${part}" không hợp lệ! Format: 5, 5.5, 10T, 5+3T`);
        return;
      }
      
      const num = parseFloat(part.replace(/[Tt]/gi, ''));
      if (isNaN(num) || num <= 0) {
        showError(input, `❌ "${part}" phải là số dương!`);
        return;
      }
    }

    // Cross-validation với customer column
    const customerInput = findSameRowInput(input, 2);
    const customerValue = customerInput?.value?.trim();

    if (customerValue) {
      const customerCount = customerValue.split('+').filter(c => c.trim()).length;
      const quantityCount = parts.length;
      
      if (customerCount !== quantityCount) {
        const warning = `⚠️ Số khách hàng (${customerCount}) không khớp số lượng (${quantityCount})\nBạn có chắc chắn?`;
        if (!confirm(warning)) {
          showError(input, '❌ Vui lòng kiểm tra lại khách hàng và số lượng!');
          return;
        }
      }
    }

    input.value = parts.join(' + ');
    console.log(`✅ Quantity validated: ${input.value}`);
  } finally {
    input._validating = false;
  }
}

// ✅ COLUMN 4: CA LÀM VIỆC - Excel Column Format
export function handleShiftColumn(input, eventType, originalEvent) {
  switch (eventType) {
    case 'focus':
      showShiftOptions(input);
      break;
    case 'input':
      showShiftOptions(input);
      break;
    case 'blur':
      handleShiftBlur(input);
      break;
    case 'keydown':
      if (originalEvent && originalEvent.key === 'Escape') {
        hideShiftOptions(input);
      }
      break;
  }
}

function showShiftOptions(input) {
  // Prevent multiple suggestion boxes for same input
  if (input._suggestionShowing) return;
  input._suggestionShowing = true;

  const OPTIONS = ['ngày', 'đêm'];

  // Remove existing suggestions for this input
  document.querySelectorAll(`.ca-suggestions-${input.dataset.inputId || 'default'}`).forEach(el => el.remove());

  const suggestionBox = document.createElement('div');
  const inputId = input.dataset.inputId || Date.now();
  input.dataset.inputId = inputId;

  suggestionBox.className = `suggestions-container ca-suggestions-${inputId}`;
  suggestionBox.style.cssText = `position: absolute; z-index: 9999; border: 1px solid #ccc; background: #fff; max-height: 100px; overflow-y: auto; font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);`;

  OPTIONS.forEach(option => {
    const item = document.createElement('div');
    item.textContent = option;
    item.style.cssText = 'padding: 6px 8px; cursor: pointer; border-bottom: 1px solid #eee;';

    item.addEventListener('mouseenter', () => item.style.backgroundColor = '#f0f8ff');
    item.addEventListener('mouseleave', () => item.style.backgroundColor = '');
    item.addEventListener('mousedown', (e) => {
      e.preventDefault();
      input.value = option;
      hideShiftOptions(input);
      input.focus();
    });

    suggestionBox.appendChild(item);
  });

  const rect = input.getBoundingClientRect();
  suggestionBox.style.left = `${rect.left + window.scrollX}px`;
  suggestionBox.style.top = `${rect.bottom + window.scrollY}px`;
  suggestionBox.style.width = `${Math.max(rect.width, 80)}px`;

  document.body.appendChild(suggestionBox);
  xulycolState.suggestionBoxes.add(suggestionBox);
}

function hideShiftOptions(input) {
  const inputId = input.dataset.inputId;
  if (inputId) {
    document.querySelectorAll(`.ca-suggestions-${inputId}`).forEach(el => {
      el.remove();
      xulycolState.suggestionBoxes.delete(el);
    });
  }
  input._suggestionShowing = false;
}

function handleShiftBlur(input) {
  setTimeout(() => hideShiftOptions(input), 200);

  const val = input.value.trim().toLowerCase();
  if (val && !['ngày', 'đêm'].includes(val)) {
    showError(input, '❌ Ca không hợp lệ! Chỉ nhập: ngày hoặc đêm');
    return;
  }
  input.value = val;
}

// ✅ COLUMN 5: TÀI XẾ - Excel Column Format
export function handleDriverColumn(input, eventType) {
  if (eventType === 'blur') {
    input.value = input.value.trim();
  }
}

// 🧹 CLEANUP FUNCTION
export function cleanupEventDelegation() {
  console.log('🧹 Cleaning up event delegation…');

  const grid = document.querySelector('.excel-grid');
  if (grid) {
    xulycolState.delegationHandlers.forEach((handler, eventType) => {
      grid.removeEventListener(eventType, handler, true);
    });
  }

  // Remove all suggestion boxes
  xulycolState.suggestionBoxes.forEach(box => {
    if (document.body.contains(box)) {
      document.body.removeChild(box);
    }
  });

  // Clear state
  xulycolState.delegationHandlers.clear();
  xulycolState.suggestionBoxes.clear();
  xulycolState.validationCache.clear();
  xulycolState.isInitialized = false;

  console.log('✅ Event delegation cleanup completed');
}

// 📊 DEBUG FUNCTION
export function debugEventDelegation() {
  console.log('🔍 Event Delegation Debug:', {
    initialized: xulycolState.isInitialized,
    handlersCount: xulycolState.delegationHandlers.size,
    suggestionBoxesCount: xulycolState.suggestionBoxes.size,
    validationCacheSize: xulycolState.validationCache.size
  });
}

// Export cleanup to window
window.cleanupEventDelegation = cleanupEventDelegation;
window.debugEventDelegation = debugEventDelegation;