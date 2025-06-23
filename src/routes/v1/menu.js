const express = require('express');
const proxyToMenuService = require('../../services/menu');

const router = express.Router();

// Forward all user-related requests
router.get('/:id', proxyToMenuService);
router.post('/', proxyToMenuService)

module.exports = router;
