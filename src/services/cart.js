const { API_VERSION } = require('../config');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config()

const proxyToCartService = createProxyMiddleware({
  target: process.env.MS_3_URL,
  changeOrigin: true,
  pathRewrite: {
    [`^/api/${API_VERSION}/cart`]: '/cart',
  },
});

module.exports = proxyToCartService;
