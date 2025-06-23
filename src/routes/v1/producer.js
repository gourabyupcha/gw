const express = require('express');
const { proxyToUserProducerService } = require('../../services/user');

const router = express.Router();


// Forward all user-related requests
// router.get('/', proxyToUserService); //all -> internal analytics
router.get('/:id', proxyToUserProducerService);
router.post('/:id', proxyToUserProducerService);

module.exports = router;
