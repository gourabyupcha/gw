const { API_VERSION } = require('../config');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config()


const proxyToPaymentsService = createProxyMiddleware({
  target: process.env.MS_4_URL,
  changeOrigin: true,
  pathRewrite: {
    [`^/api/${API_VERSION}/payments`]: '/payment',
  },
});

module.exports = proxyToPaymentsService;
