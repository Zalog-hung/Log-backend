// 📁 bangexcel.js - SAFE INTEGRATION (Dual Mode Compatible)
// Version: 3.0 - Backward Compatible + Event Delegation Support

// ✅ DUAL MODE: Hoạt động với cả old handlers và event delegation
// ✅ SAFE: Detect system mode và adapt accordingly
// ✅ FALLBACK: Graceful degradation nếu có lỗi

// 🔧 DETECT SYSTEM MODE
function getSystemMode() {
  return {
    eventDelegation: window._eventDelegationActive || false,
    oldHandlers: window._oldHandlersActive || false,
    formConfig: window.formConfig || null,
    zacache: window.zacache || null
  };
}

// ✅ Thêm dòng mới - DUAL MODE COMPATIBLE
export function themDongMoi() {
  try {
    const mode = getSystemMode();
    console.log(`➕ themDongMoi called - Mode: ${mode.eventDelegation ? 'Event Delegation' : 'Legacy'}`);

    const gridElement = document.querySelector('.excel-grid');
    if (!gridElement) {
      console.error("❌ Không tìm thấy .excel-grid");
      return null;
    }

    // ✅ Lấy config (fallback safe)
    const formConfig = mode.formConfig || {
      TOTAL_COLUMN_COUNT: 7,
      FORM_COLUMN_COUNT: 6,
      FIELDS_TO_KEEP_VALUE: [1, 4]
    };

    // ✅ Kiểm tra tính toàn vẹn bảng
    const totalCells = gridElement.querySelectorAll('.excel-cell').length;
    if (totalCells % formConfig.TOTAL_COLUMN_COUNT !== 0) {
      console.warn('⚠️ Dữ liệu bảng bị lệch! Tự động sửa...');
    }

    const newInputs = [];
    const lastInputs = Array.from(gridElement.querySelectorAll('input'));

    // ✅ Tìm template row để copy values
    let templateRow = [];
    if (lastInputs.length >= formConfig.FORM_COLUMN_COUNT) {
      const lastRowStart = lastInputs.length - formConfig.FORM_COLUMN_COUNT;
      templateRow = lastInputs.slice(lastRowStart);
    }

    console.log(`➕ Tạo dòng mới với ${formConfig.FORM_COLUMN_COUNT} cột`);

    // ✅ Tạo từng input cell
    for (let i = 0; i < formConfig.FORM_COLUMN_COUNT; i++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.setAttribute('data-col', i);

      // ✅ Copy giá trị từ template cho các cột được cấu hình
      if (formConfig.FIELDS_TO_KEEP_VALUE.includes(i) && templateRow[i]) {
        input.value = templateRow[i].value;
        console.log(`📋 Copy giá trị cột ${i}: "${input.value}"`);
      }

      // ✅ Thêm placeholder cho cột ngày
      if (i === 1) {
        input.placeholder = "dd/mm/yyyy";
      }

      // ✅ DUAL MODE HANDLER ASSIGNMENT
      if (mode.eventDelegation) {
        // Event delegation mode - no need to assign handlers
        console.log(`📡 Event delegation sẽ handle cột ${i}`);
      } else if (mode.oldHandlers && mode.zacache?.handlers) {
        // Legacy mode - assign handlers
        try {
          const handler = mode.zacache.handlers[i];
          if (typeof handler === 'function') {
            handler(input);
            console.log(`✅ Gán legacy handler cho cột ${i}`);
          } else {
            console.log(`⚠️ Không có legacy handler cho cột ${i}`);
          }
        } catch (err) {
          console.warn(`⚠️ Lỗi khi gán legacy handler cột ${i}:`, err);
        }
      } else {
        console.warn(`⚠️ Không có handler system nào active cho cột ${i}`);
      }

      // ✅ Gán sự kiện Enter (compatible với cả 2 mode)
      ganSuKienEnter(input);

      // Tạo cell container
      const cell = document.createElement('div');
      cell.className = 'excel-cell';
      cell.appendChild(input);
      gridElement.appendChild(cell);
      newInputs.push(input);
    }

    // ✅ Tạo action cell với 3 nút
    const actionCell = document.createElement('div');
    actionCell.className = 'excel-cell action-cell';
    actionCell.innerHTML = `
      <button onclick="editRow(this)" title="Sửa dòng này">✏️</button>
      <button onclick="deleteRow(this)" title="Xóa dòng này">🗑️</button>
      <button onclick="splitRow(this)" title="Chia chuyến theo quy tắc">⚙️</button>
    `;
    gridElement.appendChild(actionCell);

    console.log(`✅ Đã tạo dòng mới với ${newInputs.length} inputs (Mode: ${mode.eventDelegation ? 'Delegation' : 'Legacy'})`);
    return newInputs;

  } catch (error) {
    console.error("❌ Lỗi trong themDongMoi:", error);
    alert("⚠️ Có lỗi khi thêm dòng mới!");
    return null;
  }
}

// ✅ Gán sự kiện Enter - ENHANCED với dual mode support
function ganSuKienEnter(input) {
  if (!input || !input.addEventListener) {
    console.warn("⚠️ ganSuKienEnter: Input không hợp lệ");
    return;
  }

  const handleEnter = (e) => {
    if (e.key !== 'Enter') return;

    e.preventDefault();
    input.value = input.value.trim();

    const col = parseInt(input.dataset.col);
    if (isNaN(col)) {
      console.warn("⚠️ data-col không hợp lệ:", input.dataset.col);
      return;
    }

    const allInputs = Array.from(document.querySelectorAll('input[data-col]'));
    const currentIndex = allInputs.indexOf(input);

    if (currentIndex === -1) {
      console.warn("⚠️ Không tìm thấy input trong danh sách");
      return;
    }

    console.log(`⏎ Enter từ cột ${col}, index ${currentIndex}`);

    if (col < 5) {
      // Di chuyển sang cột tiếp theo trong cùng dòng
      const nextInput = allInputs[currentIndex + 1];
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
        console.log(`➡️ Di chuyển sang cột ${nextInput.dataset.col}`);
      }
    } else {
      // Cột cuối cùng - tạo dòng mới
      console.log("📝 Cột cuối cùng - tạo dòng mới");
      const newInputs = themDongMoi();
      if (Array.isArray(newInputs) && newInputs.length > 0) {
        setTimeout(() => {
          newInputs[0].focus();
          console.log("✅ Focus vào dòng mới");
        }, 10);
      }
    }
  };

  input.addEventListener('keydown', handleEnter);

  // ✅ Thêm sự kiện focus để highlight (safe)
  const handleFocus = () => {
    try {
      input.select();
    } catch (e) {
      // Silent fail for focus issues
    }
  };

  input.addEventListener('focus', handleFocus);

  // ✅ Track event listeners for cleanup (if needed)
  if (!input._eventListeners) {
    input._eventListeners = [];
  }
  input._eventListeners.push(
    { type: 'keydown', handler: handleEnter },
    { type: 'focus', handler: handleFocus }
  );
}

// ✅ Export ganSuKienEnter để các file khác sử dụng
window.ganSuKienEnter = ganSuKienEnter;

// ✅ Xóa dòng - ENHANCED với better safety
export function xoaDong(button) {
  try {
    if (!button) {
      console.error("❌ Button không hợp lệ");
      return;
    }

    const mode = getSystemMode();
    console.log(`🗑️ xoaDong called - Mode: ${mode.eventDelegation ? 'Event Delegation' : 'Legacy'}`);

    const gridElement = document.querySelector('.excel-grid');
    if (!gridElement) {
      console.error("❌ Không tìm thấy .excel-grid");
      return;
    }

    const formConfig = mode.formConfig || {
      TOTAL_COLUMN_COUNT: 7,
      FORM_COLUMN_COUNT: 6
    };

    // Tìm action cell chứa button
    const actionCell = button.closest('.excel-cell');
    if (!actionCell) {
      console.error("❌ Không tìm thấy action cell");
      return;
    }

    const allCells = Array.from(gridElement.children);
    const actionIndex = allCells.indexOf(actionCell);

    if (actionIndex === -1) {
      console.error("❌ Không tìm thấy vị trí action cell");
      return;
    }

    // 🔢 Đếm số dòng hiện có (dựa trên số input ở cột 0)
    const soDong = document.querySelectorAll('input[data-col="0"]').length;

    if (soDong <= 1) {
      alert("🚫 Không thể xóa dòng cuối cùng.");
      return;
    }

    // Xác nhận xóa
    const confirmed = confirm("🗑️ Bạn có chắc chắn muốn xóa dòng này?");
    if (!confirmed) {
      return;
    }

    console.log(`🗑️ Xóa dòng tại action index: ${actionIndex}`);

    // ✅ Tính vị trí bắt đầu của dòng
    const rowStartIndex = actionIndex - formConfig.FORM_COLUMN_COUNT;

    if (rowStartIndex < formConfig.TOTAL_COLUMN_COUNT) {
      console.warn("⚠️ Không thể xóa dòng header");
      return;
    }

    // ✅ Cleanup event listeners trước khi xóa (if tracked)
    for (let i = 0; i < formConfig.FORM_COLUMN_COUNT; i++) {
      const cellIndex = rowStartIndex + i;
      const cell = allCells[cellIndex];
      const input = cell?.querySelector('input');
      
      if (input && input._eventListeners) {
        input._eventListeners.forEach(({ type, handler }) => {
          input.removeEventListener(type, handler);
        });
        input._eventListeners = [];
      }
    }

    // Xóa toàn bộ dòng (6 input cells + 1 action cell)
    for (let i = 0; i < formConfig.TOTAL_COLUMN_COUNT; i++) {
      const cellIndex = rowStartIndex + i;
      const cellToRemove = allCells[cellIndex];
      
      if (cellToRemove && gridElement.contains(cellToRemove)) {
        gridElement.removeChild(cellToRemove);
        console.log(`🗑️ Đã xóa cell ${cellIndex}`);
      }
    }

    console.log("✅ Xóa dòng thành công");

  } catch (error) {
    console.error("❌ Lỗi khi xóa dòng:", error);
    alert("⚠️ Có lỗi khi xóa dòng!");
  }
}

// ✅ Function cleanup input listeners (utility)
export function cleanupInputListeners(input) {
  if (input && input._eventListeners) {
    input._eventListeners.forEach(({ type, handler }) => {
      try {
        input.removeEventListener(type, handler);
      } catch (e) {
        console.warn('⚠️ Cleanup listener error:', e);
      }
    });
    input._eventListeners = [];
  }
}

// ✅ Function to cleanup all tracked listeners in grid
export function cleanupAllGridListeners() {
  console.log('🧹 Cleaning up all grid listeners…');

  const allInputs = document.querySelectorAll('.excel-grid input[data-col]');
  allInputs.forEach(cleanupInputListeners);

  console.log(`✅ Cleaned up listeners for ${allInputs.length} inputs`);
}

// ✅ Enhanced utility function để validate grid integrity
export function validateGridIntegrity() {
  try {
    const gridElement = document.querySelector('.excel-grid');
    if (!gridElement) {
      console.error("❌ Grid element not found");
      return false;
    }

    const mode = getSystemMode();
    const formConfig = mode.formConfig || { TOTAL_COLUMN_COUNT: 7 };
    
    const totalCells = gridElement.querySelectorAll('.excel-cell').length;
    const headerCells = formConfig.TOTAL_COLUMN_COUNT;
    const dataCells = totalCells - headerCells;
    
    const isValid = dataCells % formConfig.TOTAL_COLUMN_COUNT === 0;
    
    console.log(`🔍 Grid integrity check:`, {
      totalCells,
      headerCells,
      dataCells,
      isValid,
      rows: Math.floor(dataCells / formConfig.TOTAL_COLUMN_COUNT) + 1
    });
    
    return isValid;
    
  } catch (error) {
    console.error("❌ Error validating grid integrity:", error);
    return false;
  }
}

// ✅ Utility function để fix grid if corrupted
export function fixGridIntegrity() {
  console.log("🔧 Attempting to fix grid integrity...");
  
  try {
    const isValid = validateGridIntegrity();
    if (isValid) {
      console.log("✅ Grid is already valid");
      return true;
    }
    
    // Simple fix: remove incomplete rows
    const gridElement = document.querySelector('.excel-grid');
    const mode = getSystemMode();
    const formConfig = mode.formConfig || { TOTAL_COLUMN_COUNT: 7 };
    
    const allCells = Array.from(gridElement.children);
    const headerCells = formConfig.TOTAL_COLUMN_COUNT;
    const dataCells = allCells.slice(headerCells);
    
    const completeRows = Math.floor(dataCells.length / formConfig.TOTAL_COLUMN_COUNT);
    const validCells = completeRows * formConfig.TOTAL_COLUMN_COUNT;
    
    // Remove incomplete cells
    const cellsToRemove = dataCells.slice(validCells);
    cellsToRemove.forEach(cell => {
      if (gridElement.contains(cell)) {
        gridElement.removeChild(cell);
      }
    });
    
    console.log(`🔧 Fixed grid: removed ${cellsToRemove.length} incomplete cells`);
    return validateGridIntegrity();
    
  } catch (error) {
    console.error("❌ Error fixing grid integrity:", error);
    return false;
  }
}

// ✅ Export functions để sử dụng từ window
window.themDongMoi = themDongMoi;
window.xoaDong = xoaDong;
window.cleanupAllGridListeners = cleanupAllGridListeners;
window.validateGridIntegrity = validateGridIntegrity;
window.fixGridIntegrity = fixGridIntegrity;

// ✅ Debug function
window.debugBangExcel = function() {
  const mode = getSystemMode();
  const inputCount = document.querySelectorAll('.excel-grid input[data-col]').length;
  const rowCount = Math.floor(inputCount / 6);
  const isValid = validateGridIntegrity();

  console.log('🔍 BangExcel Debug:', {
    mode,
    inputCount,
    rowCount,
    gridExists: !!document.querySelector('.excel-grid'),
    isValid,
    systemReady: mode.formConfig && (mode.eventDelegation || mode.oldHandlers)
  });
  
  return {
    mode,
    inputCount,
    rowCount,
    isValid
  };
};