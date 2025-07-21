// 📁 chinh.js - DUAL MODE SUPPORT (Safe Migration)
// Version: 3.0 - Backward Compatible + Event Delegation

// ✅ Load cấu hình trước
import './cauhinh.js';

console.log("🟢 chinh.js đã được load!");

// ✅ Import các modules theo thứ tự đúng
import {
  // Event delegation system only
  initEventDelegation, cleanupEventDelegation
} from './xulycot.js';

import { loadKhachHangList, goiykh } from './danhsachkhachhang.js';
import { themDongMoi, xoaDong } from './bangexcel.js';
import { ShowLog } from './showlog.js';
import { ngayTru1, idchuyen, duCacheLog, duCacheForm } from './cache.js';
import { chiaChuyenTheoQuyTac } from './chiachuyen.js';
import * as fixloi from './fixloi.js';

// 🔧 FEATURE CONFIGURATION
const SYSTEM_CONFIG = {
  USE_EVENT_DELEGATION: true,  // Enable new system
  FALLBACK_TO_OLD: false,      // Disable legacy fallback
  DEBUG_MODE: true             // Enhanced logging
};

console.log("🔍 System Config:", SYSTEM_CONFIG);

// ✅ Khởi động hệ thống khi DOM sẵn sàng
window.addEventListener('DOMContentLoaded', async () => {
  console.log("✅ DOM sẵn sàng, bắt đầu khởi tạo hệ thống…");

  try {
    // 🔧 Event Delegation Mode Only
    console.log("🚀 Initializing Event Delegation Mode…");

    try {
      // Initialize new event delegation system
      initEventDelegation();
      window._eventDelegationActive = true;
      console.log("✅ Event Delegation activated");
      
      // Store cleanup function for later use
      window._cleanupEventDelegation = cleanupEventDelegation;
      
    } catch (err) {
      console.error("❌ Event Delegation failed:", err);
      throw err; // Don't fallback, just throw error
    }

    // ✅ Load customer list
    await loadKhachHangList();

    // ✅ Initialize main system
    await fixloi.khoiDongHeThong();

    console.log("🟢 Hệ thống đã khởi động thành công!");

    // ✅ Verify system status
    verifySystemStatus();

  } catch (err) {
    console.error("❌ Lỗi khi khởi động hệ thống:", err);
    alert("⚠️ Có lỗi khi khởi động hệ thống. Vui lòng refresh trang!");
  }
});

// ✅ ENHANCED WINDOW FUNCTIONS với event delegation support
function setupWindowFunctions() {
  // 🔵 ADD NEW ROW - Event delegation compatible
  window.addNewRow = function() {
    try {
      if (typeof window.themDongMoi === 'function') {
        const newInputs = window.themDongMoi();

        if (Array.isArray(newInputs) && newInputs.length > 0) {
          // Event delegation automatically handles new inputs
          console.log("📡 Event delegation will handle new inputs automatically");
          
          // Focus vào cột đầu tiên
          setTimeout(() => {
            newInputs[0].focus();
          }, 10);
          
          console.log(`✅ Đã thêm dòng mới với ${newInputs.length} input`);
          return newInputs;
        }
      } else {
        console.error("❌ themDongMoi function chưa sẵn sàng");
      }
    } catch (err) {
      console.error("❌ Lỗi addNewRow:", err);
      alert("⚠️ Có lỗi khi thêm dòng mới!");
    }
    return null;
  };

  // 🔴 DELETE ROW - Compatible with both modes
  window.deleteRow = function(button) {
    try {
      if (typeof window.xoaDong === 'function') {
        window.xoaDong(button);
      } else {
        console.error("❌ xoaDong function chưa sẵn sàng");
      }
    } catch (err) {
      console.error("❌ Lỗi deleteRow:", err);
      alert("⚠️ Có lỗi khi xóa dòng!");
    }
  };

  // ⚙️ SPLIT ROW - Enhanced for dual mode
  window.splitRow = function(button) {
    try {
      console.log("⚙️ Bắt đầu chia chuyến…");

      // Call enhanced split logic from fixloi.js
      if (typeof fixloi.enhancedSplitRow === 'function') {
        fixloi.enhancedSplitRow(button);
      } else {
        // Fallback to basic split logic
        console.log("⚠️ Enhanced split row not available, using basic logic");
        
        // Get row data
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
        const rowStartIndex = Math.floor(actionIndex / 7) * 7;
        const rowCells = allCells.slice(rowStartIndex, rowStartIndex + 6);
        const inputs = rowCells.map(cell => cell.querySelector('input')).filter(Boolean);
        
        if (inputs.length < 6) {
          throw new Error("Dòng không đầy đủ input fields");
        }

        const rowData = {
          idChuyen: inputs[0].value.trim(),
          ngay: inputs[1].value.trim(),
          khachHang: inputs[2].value.trim(),
          soLuong: inputs[3].value.trim(),
          ca: inputs[4].value.trim(),
          taiXe: inputs[5].value.trim()
        };

        if (!rowData.khachHang || !rowData.soLuong) {
          alert("⚠️ Cần có ít nhất thông tin Khách hàng và Số lượng để chia chuyến!");
          return;
        }

        // Use split function from chiachuyen.js
        if (typeof chiaChuyenTheoQuyTac === 'function') {
          const ketQua = chiaChuyenTheoQuyTac(rowData);
          
          if (ketQua && ketQua.length > 1) {
            // Delete current row
            window.deleteRow(button);
            
            // Add new rows
            ketQua.forEach(dongMoi => {
              const newInputs = window.addNewRow();
              if (newInputs && newInputs.length >= 6) {
                newInputs[0].value = dongMoi.idChuyen || '';
                newInputs[1].value = dongMoi.ngay || '';
                newInputs[2].value = dongMoi.khachHang || '';
                newInputs[3].value = dongMoi.soLuong || '';
                newInputs[4].value = dongMoi.ca || '';
                newInputs[5].value = dongMoi.taiXe || '';
              }
            });
            
            alert(`✅ Đã chia thành ${ketQua.length} chuyến!`);
          } else {
            alert("ℹ️ Dòng này không cần chia hoặc không đủ điều kiện chia!");
          }
        } else {
          alert("⚙️ Tính năng chia chuyến chưa sẵn sàng…");
        }
      }
      
    } catch (err) {
      console.error("❌ Lỗi splitRow:", err);
      alert("⚠️ Có lỗi khi chia chuyến!");
    }
  };

  // 📊 SYSTEM MODE TOGGLE (Debug function) - Simplified
  window.toggleSystemMode = function() {
    console.log("ℹ️ System is using Event Delegation only - no toggle available");
    console.log("Current status:", window._eventDelegationActive ? "Active" : "Inactive");
  };

  console.log("✅ Window functions setup completed");
}

// ✅ SYSTEM STATUS VERIFICATION - Simplified
function verifySystemStatus() {
  const status = {
    eventDelegation: window._eventDelegationActive || false,
    functions: {
      addNewRow: typeof window.addNewRow === 'function',
      deleteRow: typeof window.deleteRow === 'function',
      splitRow: typeof window.splitRow === 'function'
    },
    modules: {
      formConfig: !!window.formConfig,
      zacache: !!window.zacache,
      idchuyen: typeof window.idchuyen === 'function',
      ShowLog: typeof window.ShowLog === 'function'
    }
  };

  console.log("📊 System Status:", status);

  if (!status.eventDelegation) {
    console.error("❌ Event delegation not active!");
  }

  // Store status globally for debugging
  window._systemStatus = status;

  return status;
}

// 🔧 EMERGENCY RECOVERY FUNCTION - Simplified
window.emergencyRecovery = function() {
  console.log("🆘 Emergency recovery initiated…");

  try {
    // Cleanup and reinitialize event delegation
    if (window._cleanupEventDelegation) {
      window._cleanupEventDelegation();
    }

    // Reinitialize event delegation
    initEventDelegation();
    window._eventDelegationActive = true;

    console.log("✅ Emergency recovery completed");
    alert("🆘 Hệ thống đã được khôi phục với Event Delegation");

  } catch (err) {
    console.error("❌ Emergency recovery failed:", err);
    alert("❌ Khôi phục thất bại. Vui lòng refresh trang!");
  }
};

// Initialize window functions immediately
setupWindowFunctions();

// Export for debugging
window.SYSTEM_CONFIG = SYSTEM_CONFIG;
window.verifySystemStatus = verifySystemStatus;