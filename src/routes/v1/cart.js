const express = require('express');
const proxyToMenuService = require('../../services/menu');
const proxyToCartService = require('../../services/cart');

const router = express.Router();

// Forward all user-related requests
router.get('/:id', proxyToCartService);
router.post('/', proxyToCartService)

module.exports = router;
