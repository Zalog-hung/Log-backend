window.addEventListener('DOMContentLoaded', fetchAndShowLog);

let fullLogData = [];
let currentRenderIndex = 0;
const PAGE_SIZE = 100;

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

        fullLogData = data;
        currentRenderIndex = 1;

        logTableContainer.innerHTML = `<div>📋 Tìm thấy ${data.length - 1} dòng log có dữ liệu:</div>`;
        const tableWrapper = renderLogTable(data, currentRenderIndex);
        logTableContainer.appendChild(tableWrapper);

        if (data.length - 1 > PAGE_SIZE) {
            const loadMoreBtn = document.createElement('button');
            loadMoreBtn.textContent = '⬇ Tải thêm';
            loadMoreBtn.style.margin = '10px 0';
            loadMoreBtn.addEventListener('click', () => {
                currentRenderIndex += PAGE_SIZE;
                const newTbody = renderLogRows(data, currentRenderIndex - PAGE_SIZE + 1, currentRenderIndex);
                tableWrapper.querySelector('tbody').appendChild(newTbody);
                if (currentRenderIndex >= data.length - 1) {
                    loadMoreBtn.remove();
                }
            });
            logTableContainer.appendChild(loadMoreBtn);
        }

    } catch (err) {
        logTableContainer.innerHTML += '<div>❌ Lỗi khi tải log.</div>';
        console.error(err);
    }
}

function renderLogTable(data, limit) {
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
    const tbody = renderLogRows(data, 1, limit);
    table.appendChild(tbody);
    wrapper.appendChild(table);
    return wrapper;
}

function renderLogRows(data, fromIndex, toIndex) {
    const tbody = document.createElement('tbody');
    for (let i = fromIndex; i <= toIndex && i < data.length; i++) {
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
    return tbody;
}

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

function handleCellEdit(event) {
    const td = event.target;
    const newValue = td.textContent.trim();
    const row = td.dataset.row;
    const col = td.dataset.col;
    const colLabel = String.fromCharCode(65 + parseInt(col));

    console.log(`📝 Sửa log: dòng ${parseInt(row) + 1}, cột ${colLabel} → "${newValue}"`);
    sendLogUpdate({ row, col, value: newValue });
}

async function sendLogUpdate(update) {
    try {
        const response = await fetch('https://your-update-api-url.com/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(update)
        });

        const result = await response.json();
        console.log('✅ Đã gửi cập nhật:', result);
        showToast('✅ Sửa thành công', 'success');
    } catch (err) {
        console.error('❌ Lỗi khi gửi cập nhật:', err);
        showToast('❌ Gửi cập nhật thất bại', 'error');
    }
}

// Thêm toast đơn giản
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.padding = '10px 16px';
    toast.style.background = type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#333';
    toast.style.color = '#fff';
    toast.style.borderRadius = '6px';
    toast.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
    toast.style.zIndex = '9999';
    toast.style.opacity = '0.95';
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}
