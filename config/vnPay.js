require("dotenv").config();

module.exports = {
    vnp_TmnCode: process.env.VNP_TMNCODE,
    vnp_HashSecret: process.env.VNP_HASHSECRET,
    vnp_Url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    returnUrl: "http://localhost:3000/vnpay_return",
};
