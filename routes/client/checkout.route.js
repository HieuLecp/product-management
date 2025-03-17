const express = require("express");
const router = express.Router();

const controller = require("../../controllers/client/checkout.controller");

router.get('/', controller.index);

router.post('/order', controller.order);

router.get('/payment/:id', controller.payment);

router.post('/payment/:id', controller.paymentPost);

router.get('/success/:id', controller.success);

module.exports = router;