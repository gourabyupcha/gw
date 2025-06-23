const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config()
const TARGET_SERVICE_URL = process.env.MS_2_URL;

const HOP_BY_HOP_HEADERS = new Set([
  'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
  'te', 'trailer', 'transfer-encoding', 'upgrade'
]);

exports.servicesProxy = createProxyMiddleware({
  target: TARGET_SERVICE_URL,
  changeOrigin: true,
  preserveHeaderKeyCase: true,
  selfHandleResponse: false,
  pathRewrite: (path, req) => {
    const subPath = path.replace('/api/v1/services', '');
    return `/services${subPath}`;
  },
  onProxyReq: (proxyReq, req, res) => {
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

