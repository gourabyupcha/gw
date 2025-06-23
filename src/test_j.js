const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const API_VERSION = 'v1';

// Add middleware to check what's happening
app.use((req, res, next) => {
  console.log(`[DEBUG] ${req.method} ${req.originalUrl}`);
  console.log(`[DEBUG] Path: ${req.path}`);
  console.log(`[DEBUG] Base URL: ${req.baseUrl}`);
  next();
});

// Create a simple test route first
app.get('/api/v1/services', (req, res, next) => {
  console.log('[TEST] Hit the test route before proxy');
  // Don't send a response, just call next() to pass to proxy
  next();
});

const proxyToServicesService = createProxyMiddleware({
  target: 'https://ms-2-services-production.up.railway.app',
  changeOrigin: true,
  pathRewrite: {
    '^/api/v1/services': '/services',
  },
  secure: true,
  logLevel: 'debug',

  onProxyReq: (proxyReq, req, res) => {
    console.log(`[PROXY] 🚀 FINALLY PROXYING: ${req.method} ${req.originalUrl}`);
    console.log(`[PROXY] Target URL: ${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`);
  },

  onError: (err, req, res) => {
    console.error(`[PROXY] ❌ Error: ${err.message}`);
    res.status(500).send('Proxy Error');
  }
});

app.use('/api/v1/services', proxyToServicesService);

app.listen(3000, () => {
  console.log('API Gateway running at http://localhost:3000');
});