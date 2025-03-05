const express = require("express");
const router = express.Router();

const controller = require("../../controllers/client/cart.controller")

router.get('/', controller.index);

router.post('/add/:productId', controller.addCart);

router.get('/delete/:productId', controller.delete);

module.exports = router;