const express = require('express');
const proxyToBookingService = require('../../services/bookings');

const router = express.Router();

// Forward all user-related requests
// router.get('/', proxyToUserService); //all -> internal analytics
router.get('/:id', proxyToBookingService);
router.post('/', proxyToBookingService)

module.exports = router;
