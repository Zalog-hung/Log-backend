// 📁 fixloi.js - ENHANCED INTEGRATION (Dual Mode Compatible)
// Version: 3.0 - Compatible với cả Event Delegation và Legacy Handlers

// ✅ Import required functions
import { ngayTru1, idchuyen, duCacheLog, duCacheForm, mergeCache } from './cache.js';
import { chiaChuyenTheoQuyTac } from './chiachuyen.js';

// 🔧 DETECT SYSTEM MODE
function getSystemMode() {
  return {
    eventDelegation: window._eventDelegationActive || false,
    oldHandlers: window._oldHandlersActive || false,
    formConfig: window.formConfig || null,
    zacache: window.zacache || null
  };
}

// ✅ Hàm khởi động hệ thống chính - ENHANCED
export async function khoiDongHeThong() {
  try {
    const mode = getSystemMode();
    console.log("🚀 Bắt đầu khởi động hệ thống enhanced…");
    console.log("📊 System mode:", mode);

    // ✅ Kiểm tra các biến global từ cauhinh.js
    if (!mode.formConfig || !mode.zacache) {
      throw new Error("❌ cauhinh.js chưa load - thiếu formConfig hoặc zacache");
    }

    // ✅ DUAL MODE: Initialize handlers based on active system
    if (mode.eventDelegation) {
      console.log("📡 Event delegation mode - skipping individual handler assignment");
      // Event delegation tự động handle tất cả inputs
    } else if (mode.oldHandlers) {
      console.log("🔄 Legacy mode - assigning handlers to existing inputs");
      ganChoTatCaInput();
    } else {
      console.warn("⚠️ No handler system detected - may cause issues");
    }

    // ✅ Enhanced window functions
    setupEnhancedWindowFunctions();

    // ✅ Load ShowLog nếu có sẵn
    if (typeof window.ShowLog === 'function') {
      try {
        await window.ShowLog();
        console.log('📋 ShowLog() đã load thành công');
      } catch (e) {
        console.warn('⚠️ ShowLog() có lỗi:', e.message);
      }
    }

    console.log("✅ Hệ thống enhanced đã khởi động thành công!");

  } catch (error) {
    console.error("❌ Lỗi khởi động hệ thống enhanced:", error);
    throw error;
  }
}

// ✅ Gán event handlers cho tất cả input - LEGACY MODE ONLY
export function ganChoTatCaInput() {
  const mode = getSystemMode();

  if (mode.eventDelegation) {
    console.log("📡 Event delegation active - skipping individual handlers");
    return;
  }

  console.log("🔄 Gán handlers legacy cho tất cả input hiện có…");
  document.querySelectorAll('input[data-col]').forEach(ganCho1Input);
}

// ✅ Gán event handler cho 1 input - LEGACY MODE
function ganCho1Input(input) {
  const mode = getSystemMode();

  if (mode.eventDelegation) {
    return; // Skip trong event delegation mode
  }

  const col = parseInt(input.dataset.col);
  try {
    const handler = mode.zacache?.handlers?.[col];
    if (typeof handler === 'function') {
      handler(input);
      console.log(`✅ Gán handler legacy cho cột ${col}`);
    } else {
      console.warn(`⚠️ Không có handler cho cột ${col}`);
    }
  } catch (err) {
    console.warn(`⚠️ Lỗi xử lý cột ${col}:`, err);
  }
}

// ✅ Gán event handlers cho 1 dòng - DUAL MODE COMPATIBLE
export function ganCho1Dong(inputArray) {
  const mode = getSystemMode();

  if (mode.eventDelegation) {
    console.log("📡 Event delegation mode - new row auto-handled");
    return;
  }

  if (Array.isArray(inputArray)) {
    console.log(`🔄 Gán handlers legacy cho ${inputArray.length} inputs`);
    inputArray.forEach(ganCho1Input);
  }
}

// ✅ Enhanced window functions setup
function setupEnhancedWindowFunctions() {
  console.log("🔧 Setting up enhanced window functions…");

  // ✅ ENHANCED SPLIT ROW - Tích hợp với cả 2 mode
  window.splitRow = function(button) {
    console.log("⚙️ Enhanced split row function");
    
    try {
      const mode = getSystemMode();
      
      // Tìm dòng chứa nút split
      const actionCell = button.closest('.excel-cell') || button.closest('.action-cell');
      if (!actionCell) {
        throw new Error("Không tìm thấy action cell");
      }

      const gridElement = document.querySelector('.excel-grid');
      if (!gridElement) {
        throw new Error("Không tìm thấy excel grid");
      }

      const allCells = Array.from(gridElement.children);
      const actionIndex = allCells.indexOf(actionCell);
      
      // Tính vị trí bắt đầu của dòng (7 cells per row)
      const rowStartIndex = Math.floor(actionIndex / 7) * 7;
      const rowCells = allCells.slice(rowStartIndex, rowStartIndex + 6);
      const inputs = rowCells.map(cell => cell.querySelector('input')).filter(Boolean);
      
      if (inputs.length < 6) {
        throw new Error("Dòng không đầy đủ 6 input fields");
      }

      // Thu thập dữ liệu từ dòng
      const rowData = {
        idChuyen: inputs[0].value.trim(),
        ngay: inputs[1].value.trim(),
        khachHang: inputs[2].value.trim(),
        soLuong: inputs[3].value.trim(),
        ca: inputs[4].value.trim(),
        taiXe: inputs[5].value.trim()
      };

      // Validation cơ bản
      if (!rowData.khachHang || !rowData.soLuong) {
        alert("⚠️ Cần có ít nhất thông tin Khách hàng và Số lượng để chia chuyến!");
        return;
      }

      // Gọi function chia chuyến
      const ketQua = chiaChuyenTheoQuyTac(rowData);
      
      if (ketQua && ketQua.length > 1) {
        // Xóa dòng hiện tại
        if (typeof window.deleteRow === 'function') {
          window.deleteRow(button);
        }
        
        // Thêm các dòng mới
        ketQua.forEach(dongMoi => {
          if (typeof window.addNewRow === 'function') {
            const newInputs = window.addNewRow();
            if (newInputs && newInputs.length >= 6) {
              newInputs[0].value = dongMoi.idChuyen || '';
              newInputs[1].value = dongMoi.ngay || '';
              newInputs[2].value = dongMoi.khachHang || '';
              newInputs[3].value = dongMoi.soLuong || '';
              newInputs[4].value = dongMoi.ca || '';
              newInputs[5].value = dongMoi.taiXe || '';
            }
          }
        });
        
        alert(`✅ Đã chia thành ${ketQua.length} chuyến!`);
        console.log("🎯 Split row completed:", ketQua);
      } else {
        alert("ℹ️ Dòng này không cần chia hoặc không đủ điều kiện chia!");
      }

    } catch (error) {
      console.error("❌ Lỗi khi chia chuyến:", error);
      alert(`⚠️ Có lỗi khi chia chuyến: ${error.message}`);
    }
  };

  // ✅ ENHANCED ADD NEW ROW
  window.addNewRow = function() {
    console.log("➕ Enhanced add new row function");
    
    try {
      const gridElement = document.querySelector('.excel-grid');
      if (!gridElement) {
        throw new Error("Không tìm thấy excel grid");
      }

      // Tạo 6 input cells + 1 action cell
      const newInputs = [];
      
      for (let col = 0; col < 6; col++) {
        const cell = document.createElement('div');
        cell.className = 'excel-cell';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.dataset.col = col;
        
        // Set placeholder cho cột ngày
        if (col === 1) {
          input.placeholder = 'dd/mm/yyyy';
        }
        
        cell.appendChild(input);
        gridElement.appendChild(cell);
        newInputs.push(input);
      }

      // Tạo action cell
      const actionCell = document.createElement('div');
      actionCell.className = 'excel-cell action-cell';
      actionCell.innerHTML = `
        <button onclick="editRow(this)" title="Sửa dòng này">✏️</button>
        <button onclick="deleteRow(this)" title="Xóa dòng này">🗑️</button>
        <button onclick="splitRow(this)" title="Chia chuyến theo quy tắc">⚙️</button>
      `;
      gridElement.appendChild(actionCell);

      // Gán handlers cho dòng mới (chỉ trong legacy mode)
      ganCho1Dong(newInputs);

      console.log("✅ Đã thêm dòng mới thành công");
      return newInputs;

    } catch (error) {
      console.error("❌ Lỗi khi thêm dòng mới:", error);
      alert(`⚠️ Có lỗi khi thêm dòng: ${error.message}`);
      return null;
    }
  };

  // ✅ ENHANCED DELETE ROW
  window.deleteRow = function(button) {
    console.log("🗑️ Enhanced delete row function");
    
    try {
      const actionCell = button.closest('.excel-cell') || button.closest('.action-cell');
      if (!actionCell) {
        throw new Error("Không tìm thấy action cell");
      }

      const gridElement = document.querySelector('.excel-grid');
      if (!gridElement) {
        throw new Error("Không tìm thấy excel grid");
      }

      const allCells = Array.from(gridElement.children);
      const actionIndex = allCells.indexOf(actionCell);
      
      // Tính vị trí bắt đầu của dòng (7 cells per row)
      const rowStartIndex = Math.floor(actionIndex / 7) * 7;
      
      // Xác nhận xóa
      if (!confirm("🗑️ Bạn có chắc chắn muốn xóa dòng này?")) {
        return;
      }
      
      // Xóa 7 cells (6 input + 1 action)
      for (let i = 0; i < 7; i++) {
        const cellToRemove = allCells[rowStartIndex + i];
        if (cellToRemove) {
          cellToRemove.remove();
        }
      }

      console.log("✅ Đã xóa dòng thành công");

    } catch (error) {
      console.error("❌ Lỗi khi xóa dòng:", error);
      alert(`⚠️ Có lỗi khi xóa dòng: ${error.message}`);
    }
  };

  console.log("✅ Enhanced window functions setup completed");
}

// ✅ Cleanup function
export function cleanupEnhancedSystem() {
  console.log("🧹 Cleaning up enhanced system…");
  
  // Reset window functions to placeholder
  ['splitRow', 'addNewRow', 'deleteRow'].forEach(funcName => {
    if (window[funcName]) {
      window[funcName] = function() {
        console.warn(`⚠️ ${funcName} has been cleaned up`);
        alert('Chức năng này đã được reset. Vui lòng reload trang!');
      };
    }
  });
  
  console.log("✅ Enhanced system cleanup completed");
}

// ✅ Export cho window để debug
window.khoiDongHeThong = khoiDongHeThong;
window.ganChoTatCaInput = ganChoTatCaInput;
window.cleanupEnhancedSystem = cleanupEnhancedSystem;