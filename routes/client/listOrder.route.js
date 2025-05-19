const express = require("express");
const router = express.Router();

const controller = require("../../controllers/client/order.controller");
const validate= require("../../validates/client/user.validate");
const authMiddleware= require("../../middlewares/client/auth.middleware");


router.get('/',
    authMiddleware.requireAuth,
    controller.listOrder
);

router.patch('/cancel/:orderId',
    authMiddleware.requireAuth,
    controller.cancelOrder
);

router.patch('/completed/:orderId',
    authMiddleware.requireAuth,
    controller.deliveredOrder
);

module.exports = router;