const express = require('express');
const proxyToPaymentsService = require('../../services/payments');

const router = express.Router();


// Forward all user-related requests
router.post('/:id', proxyToPaymentsService);

module.exports = router;
