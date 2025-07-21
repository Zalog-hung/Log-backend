// server.js
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Parse JSON body (phải đặt trước các route sử dụng req.body)
app.use(express.json());

// ✅ CORS middleware - cho phép truy cập từ mọi origin
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// ✅ Cache control middleware - chặn cache cho js, css, html
app.use((req, res, next) => {
  if (req.url.match(/\.(js|css|html)$/)) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

// ✅ API proxy endpoint
app.post('/api/proxy', async (req, res) => {
  try {
    const { url, method = 'POST', data } = req.body;

    // Validate input
    if (!url) {
      return res.status(400).json({ 
        error: 'Missing required parameter: url' 
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (urlError) {
      return res.status(400).json({ 
        error: 'Invalid URL format',
        detail: urlError.message 
      });
    }

    console.log(`📡 Proxy request: ${method} ${url}`);

    // Make the proxied request
    const response = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'ZA-LOG-Proxy/1.0'
      },
      body: data ? JSON.stringify(data) : undefined,
      timeout: 30000 // 30 second timeout
    });

    // Get response text
    const responseText = await response.text();
    
    // Log response for debugging
    console.log(`✅ Proxy response: ${response.status} - ${responseText.length} chars`);

    // Set appropriate content type based on response
    const contentType = response.headers.get('content-type') || 'application/json';
    res.setHeader('Content-Type', contentType);

    // Return response with original status code
    res.status(response.status).send(responseText);

  } catch (error) {
    console.error('❌ Proxy error:', error);
    
    // Handle different types of errors
    if (error.name === 'AbortError') {
      res.status(408).json({ 
        error: 'Request timeout',
        detail: 'The request took too long to complete'
      });
    } else if (error.code === 'ENOTFOUND') {
      res.status(502).json({ 
        error: 'Host not found',
        detail: 'Unable to resolve the target host'
      });
    } else {
      res.status(500).json({ 
        error: 'Proxy request failed',
        detail: error.message 
      });
    }
  }
});

// ✅ Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// ✅ Static file serving (phải đặt sau các API routes)
app.use(express.static(__dirname, {
  setHeaders: (res, path) => {
    // Additional cache control for static files
    if (path.endsWith('.js') || path.endsWith('.css') || path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    }
  }
}));

// ✅ Default route - serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ✅ 404 handler for undefined routes
app.use('*', (req, res) => {
  console.log(`⚠️ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// ✅ Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    detail: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// ✅ Graceful shutdown handler
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ ZA-LOG Server running on port ${PORT}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
  console.log(`📡 Proxy API: http://localhost:${PORT}/api/proxy`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
});