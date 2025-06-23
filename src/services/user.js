const { API_VERSION } = require('../config');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config()

const proxyToUserProducerService = createProxyMiddleware({
  target: process.env.MS_1_URL,
  changeOrigin: true,
  pathRewrite: {
    [`^/api/${API_VERSION}/producer`]: '/users/producer',
  },
});

const proxyToUserConsumerService = createProxyMiddleware({
  target: process.env.MS_1_URL,
  changeOrigin: true,
  pathRewrite: {
    [`^/api/${API_VERSION}/consumer`]: '/users/consumer',
  },
});

module.exports = {proxyToUserProducerService, proxyToUserConsumerService };
