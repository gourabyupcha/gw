import { Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

export const proxyToUserService = createProxyMiddleware({
  target: process.env.USER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/users': '', // remove /users prefix
  },
});
