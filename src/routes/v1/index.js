const express = require('express');
const producers=require('./producer')
const consumers=require('./consumer')
const services = require('./services');
const menu = require('./menu');
const cart = require('./cart');
const bookings = require('./bookings');
const payments = require('./payments');
const { API_VERSION } = require('../../config');

const router = express.Router();

router.use('/producers', producers); 
router.use('/consumers', consumers); 
router.use('/services', services);
router.use('/menu', menu);
router.use('/cart', cart);
router.use('/bookings', bookings);
router.use('/payments', payments);


module.exports = router;
