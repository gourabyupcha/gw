const express = require('express');
const proxyToServicesService = require('../../services/services');

const router = express.Router();

// Forward all user-related requests
router.get('/', proxyToServicesService);
// router.get('/:id', proxyToServicesService);
// router.post('/', proxyToServicesService);
// router.put('/:id', proxyToServicesService);
// router.delete('/:id', proxyToServicesService);

module.exports = router;
