// main.js – Xử lý giao diện ZA-LOG

// 👉 Chuyển tab
function switchTab(tab) {
  document.getElementById('formContent').style.display = (tab === 'form') ? 'block' : 'none';
  document.getElementById('logContent').style.display = (tab === 'log') ? 'block' : 'none';

  document.querySelectorAll('.tab-item').forEach(el => el.classList.remove('active'));
  document.querySelector(`.tab-item[onclick*="${tab}"]`).classList.add('active');
}

// 👉 Thêm dòng mới
document.getElementById('addRowBtn').addEventListener('click', () => {
  const grid = document.querySelector('.excel-grid');
  const row = document.createDocumentFragment();

  for (let i = 0; i < 6; i++) {
    const cell = document.createElement('div');
    cell.className = 'excel-cell';
    const input = document.createElement('input');
    cell.appendChild(input);
    row.appendChild(cell);
  }

  const actionCell = document.createElement('div');
  actionCell.className = 'excel-cell action-cell';
  actionCell.innerHTML = `
    <button onclick="editRow(this)">✏️</button>
    <button onclick="deleteRow(this)">🗑️</button>
    <button onclick="splitRow(this)">⚙️</button>
  `;
  row.appendChild(actionCell);

  grid.appendChild(row);
});

// 👉 Xoá dòng
function deleteRow(btn) {
  const cell = btn.closest('.excel-cell');
  const rowStart = [...cell.parentNode.children].indexOf(cell);
  const grid = document.querySelector('.excel-grid');
  const colCount = 7;
  const startIndex = Math.floor(rowStart / colCount) * colCount;

  for (let i = 0; i < colCount; i++) {
    grid.removeChild(grid.children[startIndex]);
  }
}

// 👉 Sửa dòng (chưa làm gì nhiều)
function editRow(btn) {
  // Tuỳ chỉnh nếu cần
  alert('Chức năng chỉnh sửa chưa được triển khai');
}

// 👉 Gọi hàm chia chuyến
function splitRow(btn) {
  if (typeof window._splitRowInternal === 'function') {
    window._splitRowInternal(btn);
  } else {
    alert("Hàm chia chuyến chưa được tải.");
  }
}

// 👉 Ghi log
document.getElementById('logBtn').addEventListener('click', async () => {
  const grid = document.querySelector('.excel-grid');
  const inputs = Array.from(grid.querySelectorAll('input'));
  const rows = [];
  const colCount = 6;

  for (let i = 0; i < inputs.length; i += colCount) {
    const row = inputs.slice(i, i + colCount).map(input => input.value.trim());
    if (row.some(cell => cell !== '')) rows.push(row);
  }

  try {
    const res = await fetch('/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: rows })
    });

    const result = await res.json();
    const logArea = document.getElementById('logArea');
    logArea.innerHTML += `<div>[LOG] Gửi thành công: ${result.message || 'Thành công'}</div>`;
  } catch (err) {
    document.getElementById('logArea').innerHTML += `<div style="color:red">[LỖI] Ghi log thất bại</div>`;
  }
});
