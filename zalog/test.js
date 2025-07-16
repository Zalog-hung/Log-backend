// === TỰ ĐỘNG TẢI VÀ HIỂN THỊ LOG, CÓ THỂ SỬA VÀ GỬI LÊN SERVER ===

// GỌI KHI TRANG TẢI XONG
window.addEventListener('DOMContentLoaded', fetchAndShowLog);

// HÀM CHÍNH
async function fetchAndShowLog() {
    const logArea = document.getElementById('logArea');
    const logTableContainer = document.getElementById('logTableContainer');

    if (!logArea || !logTableContainer) return;
    logTableContainer.innerHTML = '<div>⏳ Đang tải log...</div>';

    try {
        const response = await fetch('https://script.google.com/macros/s/AKfycbwhGc1NHndpO2IYfEhFDFAiLHyTi1LqlWFSnfqtSxWPEQ5bCw7r4idZ23qvb83PitB0Dw/exec');
        const data = await response.json();

        if (!data || data.length <= 1) {
            logTableContainer.innerHTML = '<div>[LOG] Không có dữ liệu log.</div>';
            return;
        }

        const logTable = renderLogTable(data);
        logTableContainer.innerHTML = `<div>📋 Tìm thấy ${data.length - 1} dòng log có dữ liệu:</div>`;
        logTableContainer.appendChild(logTable);
    } catch (err) {
        logTableContainer.innerHTML += '<div>❌ Lỗi khi tải log.</div>';
        console.error(err);
    }
}

// TẠO BẢNG LOG
function renderLogTable(data) {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'overflow:auto; max-height:400px; max-width:100%; border:1px solid #ccc; background:#fff; margin-top:10px;';

    const table = document.createElement('table');
    table.style.cssText = 'border-collapse:collapse; font-size:14px; min-width:max-content; width:100%;';

    // Header
    const headers = Array.isArray(data[0]) ? data[0] : Object.values(data[0]);
    const thead = document.createElement('thead');
    const trHead = document.createElement('tr');
    headers.slice(0, 26).forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        styleCell(th, true);
        trHead.appendChild(th);
    });
    thead.appendChild(trHead);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.slice(0, 26).every(cell => cell === '')) continue;

        const tr = document.createElement('tr');
        for (let j = 0; j < 26; j++) {
            const td = document.createElement('td');
            td.textContent = row[j] || '';
            td.contentEditable = true;
            td.dataset.row = i;
            td.dataset.col = j;
            td.addEventListener('blur', handleCellEdit);
            styleCell(td);
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    wrapper.appendChild(table);
    return wrapper;
}

// CÀI ĐẶT KIỂU Ô
function styleCell(cell, isHeader = false) {
    cell.style.border = '1px solid #ccc';
    cell.style.padding = '4px 6px';
    cell.style.minWidth = '100px';
    cell.style.maxWidth = '200px';
    cell.style.whiteSpace = 'nowrap';
    cell.style.overflow = 'hidden';
    if (isHeader) {
        cell.style.background = '#f0f0f0';
        cell.style.fontWeight = 'bold';
        cell.style.position = 'sticky';
        cell.style.top = '0';
        cell.style.zIndex = '1';
        cell.style.textAlign = 'center';
    }
}

// XỬ LÝ SỬA DỮ LIỆU
function handleCellEdit(event) {
    const td = event.target;
    const newValue = td.textContent.trim();
    const row = td.dataset.row;
    const col = td.dataset.col;
    const colLabel = String.fromCharCode(65 + parseInt(col));

    console.log(`📝 Sửa log: dòng ${parseInt(row) + 1}, cột ${colLabel} → "${newValue}"`);

    // Gửi dữ liệu lên server (ví dụ)
    sendLogUpdate({ row, col, value: newValue });
}

// GỬI CẬP NHẬT LÊN SERVER (CHỈ MINH HOẠ)
async function sendLogUpdate(update) {
    try {
        const response = await fetch('https://your-update-api-url.com/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(update)
        });

        const result = await response.json();
        console.log('✅ Đã gửi cập nhật:', result);
    } catch (err) {
        console.error('❌ Lỗi khi gửi cập nhật:', err);
    }
}
