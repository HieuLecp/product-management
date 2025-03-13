const express = require("express");
const router = express.Router();
const paymentController = require("../../controllers/client/payment.controller");

// Route tạo link thanh toán
router.get("/create_payment_url", paymentController.createPayment);

// Route nhận kết quả từ VNPay
router.get("/vnpay_return", paymentController.paymentReturn);

module.exports = router;
