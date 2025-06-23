const { API_VERSION } = require('../config');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config()


const proxyToMenuService = createProxyMiddleware({
  target: process.env.MS_2_URL,
  changeOrigin: true,
  pathRewrite: {
    [`^/api/${API_VERSION}/services`]: '/menu',
  },
});

module.exports = proxyToMenuService;
