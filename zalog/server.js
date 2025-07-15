// server.js
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Phục vụ tất cả các file tĩnh từ thư mục hiện tại (nơi chứa index.html, style.css,...)
app.use(express.static(__dirname));

// Khi truy cập '/', trả về index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server đang chạy tại cổng ${PORT}`);
});
