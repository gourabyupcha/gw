const express = require('express');
const users = require('./users');
const services = require('./services');
const cacheMiddleware = require('../../middlewares/cache');
const { API_VERSION } = require('../../config');

const router = express.Router();

router.use('/users', users); 
router.use('/services', cacheMiddleware(API_VERSION, 3000), services);

module.exports = router;
