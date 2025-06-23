const express = require('express');
const proxy = require('../../services/services');

const router = express.Router();

// All routes under /api/v1/services are proxied
router.use('/', proxy.servicesProxy);

module.exports = router;
