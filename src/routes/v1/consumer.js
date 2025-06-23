const express = require('express');
const { proxyToUserConsumerService } = require('../../services/user');

const router = express.Router();


// Forward all user-related requests
// router.get('/', proxyToUserService); //all -> internal analytics
router.get('/:id', proxyToUserConsumerService);
router.post('/:id', proxyToUserConsumerService);

module.exports = router;
