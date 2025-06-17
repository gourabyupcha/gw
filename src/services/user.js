const { API_VERSION } = require('../config');
const { createProxyMiddleware } = require('http-proxy-middleware');

const proxyToUserService = createProxyMiddleware({
  target: process.env.USER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    [`^/api/${API_VERSION}/users`]: '',
  },
});

module.exports = proxyToUserService;
