const qs = require("qs");
const crypto = require("crypto");
const vnpayConfig = require("../../config/vnPay");

exports.createPayment = (req, res) => {
    const { orderId, amount } = req.query;
    let date = new Date();
    let createDate = date.toISOString().replace(/[-:.T]/g, "").slice(0, 14);

    let vnp_Params = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode: vnpayConfig.vnp_TmnCode,
        vnp_Locale: "vn",
        vnp_CurrCode: "VND",
        vnp_TxnRef: orderId,
        vnp_OrderInfo: `Thanh toán đơn hàng ${orderId}`,
        vnp_OrderType: "billpayment",
        vnp_Amount: amount * 100,
        vnp_ReturnUrl: vnpayConfig.returnUrl,
        vnp_IpAddr: req.ip,
        vnp_CreateDate: createDate,
    };

    // Ký dữ liệu đúng chuẩn VNPay
    vnp_Params["vnp_SecureHash"] = createVNPayHash(vnp_Params, vnpayConfig.vnp_HashSecret);

    const paymentUrl = `${vnpayConfig.vnp_Url}?${qs.stringify(vnp_Params, { encode: false })}`;
    res.redirect(paymentUrl);
};

// Xử lý callback từ VNPay
exports.paymentReturn = (req, res) => {
    let vnp_Params = req.query;
    let secureHash = vnp_Params["vnp_SecureHash"];

    // Tạo chữ ký mới và so sánh
    if (secureHash === createVNPayHash(vnp_Params, vnpayConfig.vnp_HashSecret)) {
        res.render("payment_result", { status: "success", data: vnp_Params });
    } else {
        res.render("payment_result", { status: "error", data: vnp_Params });
    }
};

// Hàm ký dữ liệu chuẩn VNPay
function createVNPayHash(params, secretKey) {
    delete params["vnp_SecureHash"];
    delete params["vnp_SecureHashType"];

    params = sortObject(params);

    const signData = Object.keys(params)
        .map(key => `${key}=${params[key]}`)
        .join("&");

    return crypto.createHmac("sha512", secretKey)
        .update(Buffer.from(signData, "utf-8"))
        .digest("hex");
}

// Hàm sắp xếp object theo thứ tự alphabet
function sortObject(obj) {
    let sorted = {};
    let keys = Object.keys(obj).sort();
    keys.forEach((key) => {
        sorted[key] = obj[key];
    });
    return sorted;
}
