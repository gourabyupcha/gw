const { API_VERSION } = require('../config');
const { createProxyMiddleware } = require('http-proxy-middleware');

const proxyToServicesService = createProxyMiddleware({
  target: process.env.SERVICES_SERVICE_URL, // e.g. http://localhost:3001
  changeOrigin: true,
  pathRewrite: (path, req) => {
    // Replace /api/v1/services with /api/services
    return path.replace(`/api/${API_VERSION}/services`, '');
  }
});

module.exports = proxyToServicesService;
