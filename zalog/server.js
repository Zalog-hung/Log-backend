// server.js
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Chặn cache cho js, css, html
app.use((req, res, next) => {
  if (req.url.match(/\.(js|css|html)$/)) {
    res.setHeader('Cache-Control', 'no-store');
  }
  next();
});

// Phục vụ file tĩnh như index.html, style.css, js...
app.use(express.static(__dirname));

// Khi truy cập "/", trả về file index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server đang chạy tại cổng ${PORT}`);
});
