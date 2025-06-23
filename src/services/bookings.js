const { API_VERSION } = require('../config');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config()

const proxyToBookingService = createProxyMiddleware({
  target: process.env.MS_3_URL,
  changeOrigin: true,
  pathRewrite: {
    [`^/api/${API_VERSION}/bookings`]: '/booking',
  },
});

module.exports = proxyToBookingService;
