const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');

const app = express();

const API_VERSION = 'v1';
const TARGET_SERVICE_URL = 'https://ms-2-services-production.up.railway.app';
const PORT = 3000;

const HOP_BY_HOP_HEADERS = new Set([
  'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
  'te', 'trailer', 'transfer-encoding', 'upgrade'
]);

// CORS
app.use(cors());

// Logging
app.use(morgan('[GATEWAY] :method :url :status - :response-time ms'));

// Proxy middleware
const servicesProxy = createProxyMiddleware({
  target: TARGET_SERVICE_URL,
  changeOrigin: true,
  preserveHeaderKeyCase: true,
  selfHandleResponse: false,
  pathRewrite: (path, req) => {
    const subPath = path.replace(`/api/${API_VERSION}/services`, '');
    return `/services${subPath}`;
  },
  onProxyReq: (proxyReq, req, res) => {
    // Pass through all non-hop-by-hop headers (including caching headers)
    for (const [header, value] of Object.entries(req.headers)) {
      const lower = header.toLowerCase();
      if (!HOP_BY_HOP_HEADERS.has(lower)) {
        proxyReq.setHeader(header, value);
      }
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    const cacheStatus = proxyRes.statusCode === 304 ? '✅ Used cache' : '🟢 Fetched fresh';
    console.log(`[PROXY] ${req.method} ${req.url} → ${proxyRes.statusCode} (${cacheStatus})`);
  },
  onError(err, req, res) {
    console.error('[PROXY ERROR]', err.message);
    res.status(502).json({ error: 'Bad Gateway', detail: err.message });
  },
  logLevel: 'info'
});

app.use(`/api/${API_VERSION}/services`, servicesProxy);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Node.js Proxy Gateway is running',
    version: '1.0.0',
    proxy_routes: [`/api/${API_VERSION}/services/*`],
    target: TARGET_SERVICE_URL,
    approach: 'Streaming proxy with caching support'
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  process.exit();
});

http.createServer(app).listen(PORT, () => {
  console.log(`🚀 Proxy Gateway running at http://localhost:${PORT}`);
  console.log(`📍 Proxy route: /api/${API_VERSION}/services/*`);
  console.log(`🎯 Target service: ${TARGET_SERVICE_URL}`);
});
