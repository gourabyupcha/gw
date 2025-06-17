const express = require('express');
const proxyToUserService = require('../../services/user');

const router = express.Router();


// Forward all user-related requests
// router.get('/', proxyToUserService); //all -> internal analytics
router.get('/:id', proxyToUserService);
router.post('/:id', proxyToUserService);

// router.put('/:id', proxyToUserService);
// router.delete('/:id', proxyToUserService);

module.exports = router;
