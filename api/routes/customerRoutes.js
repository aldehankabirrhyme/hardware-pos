// api/routes/customerRoutes.js
const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

router.get('/', customerController.getCustomers);
router.post('/collect', customerController.collectDuePayment);
router.get('/:id', customerController.getCustomerById);

module.exports = router;