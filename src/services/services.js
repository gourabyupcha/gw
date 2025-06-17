const { API_VERSION } = require('../config');
const { createProxyMiddleware } = require('http-proxy-middleware');

const proxyToServicesService = createProxyMiddleware({
  target: process.env.USER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    [`^/api/${API_VERSION}/services`]: '/api/services',
  },
});

module.exports = proxyToServicesService;
