const Product= require("../../models/product.model");
const Cart= require("../../models/carts.model");
const Order= require("../../models/orders.model");
const User= require("../../models/users.model");

const {default: axios} = require("axios");

const { getDashboardStatistic } = require("../../socket/admin/dashboard.socket");

const crypto = require('crypto');
const CryptoJS = require('crypto-js'); // npm install crypto-js
const moment = require('moment');

const productHepler  = require("../../helpers/product");

// [GET] /checkout
module.exports.index= async (req, res) => {
    const { productIds } = req.query;

    const listProductIds = productIds.split(",");

    const user= await User.findOne({
        tokenUser: req.cookies.tokenUser
    });
    
    const cart= await Cart.findOne({userId: user.id});
    
    cart.products = cart.products.filter(item => listProductIds.includes(item.id));

    if (cart.products.length === 0) {
        return res.redirect("/cart");
    }

    if(cart.products.length > 0){
        for(const item of cart.products){
            const productId= item.product_id;
            const productInfo= await Product.findOne({_id: productId});

            productHepler.priceNewProduct(productInfo);

            item.productInfo= productInfo;
            item.productInfo.priceNewFormat= Number(item.productInfo.priceNew).toLocaleString("vi-VN");

            item.totalPrice= item.quantity * productInfo.priceNew;
            item.totalPriceFormat= item.totalPrice.toLocaleString("vi-VN");
        }
    }

    cart.totalPrice= cart.products.reduce((sum, item) => sum + item.totalPrice , 0);
    cart.totalPriceFormat= cart.totalPrice.toLocaleString("vi-VN");

    res.render("client/pages/checkout/index", {
        pageTitle: "Đặt hàng",
        cartDetail: cart,
        listProductId: listProductIds
    })

    // res.send("checkout");
};

// [POST] /checkout/order
module.exports.order = async (req, res) => {
    const { productIds, paymentType, ...userInfo } = req.body;
    const listProductIds = productIds.split(",");

    const user = await User.findOne({
        tokenUser: req.cookies.tokenUser
    });

    if (!user) {
        return res.status(401).json({ message: "User not found" });
    }

    const cart = await Cart.findOne({
        userId: user.id
    });

    if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
    }

    // Lọc các sản phẩm được chọn để đặt hàng
    const selectedProducts = cart.products.filter(item => listProductIds.includes(item.id));
    let products = [];

    // Tính toán thông tin sản phẩm và tổng giá
    for (const item of selectedProducts) {
        const productInfo = await Product.findOne({
            _id: item.product_id
        });

        if (!productInfo) {
            return res.status(404).json({ message: `Product ${item.product_id} not found` });
        }

        productHepler.priceNewProduct(productInfo);

        const objectProduct = {
            product_id: item.product_id,
            title: productInfo.title, // Thêm tiêu đề sản phẩm để hiển thị
            price: productInfo.price,
            quantity: item.quantity,
            thumbnail: productInfo.thumbnail,
            priceNew: productInfo.priceNew // Tính giá sau giảm giá
        };

        products.push(objectProduct);
    }

    // Tính tổng giá
    const totalPrice = products.reduce((total, item) => total + (item.priceNew * item.quantity), 0);

    // Render trang xác nhận với thông tin đơn hàng
    res.render('client/pages/checkout/confirm', {
        userInfo,
        products,
        totalPrice,
        paymentType,
        productIds, // Chuyển lại thành chuỗi để gửi qua form
        userId: user.id,
        cartId: cart.id
    });
};

// [POST] /checkout/confirm-order
module.exports.confirmOrder = async (req, res) => {
    const { productIds, paymentType, userId, cartId, ...userInfo } = req.body;
    const listProductIds = productIds.split(",");

    const user = await User.findOne({ _id: userId });
    if (!user) {
        return res.status(401).json({ message: "User not found" });
    }

    const cart = await Cart.findOne({ _id: cartId });
    if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
    }

    // Lọc các sản phẩm được chọn
    cart.products = cart.products.filter(item => listProductIds.includes(item.id));
    let products = [];

    // Cập nhật thông tin sản phẩm và tồn kho
    for (const item of cart.products) {
        const productInfo = await Product.findOne({
            _id: item.product_id
        });

        if (!productInfo) {
            return res.status(404).json({ message: `Product ${item.product_id} not found` });
        }

        const objectProduct = {
            product_id: item.product_id,
            price: productInfo.price,
            discountPercentage: productInfo.discountPercentage,
            quantity: item.quantity
        };

        const newStock = productInfo.stock - objectProduct.quantity;
        const newSold = (productInfo.sold || 0) + objectProduct.quantity;

        await Product.updateOne(
            { _id: item.product_id },
            { stock: newStock, sold: newSold }
        );

        productHepler.priceNewProduct(objectProduct); // Tính giá sau giảm giá
        products.push(objectProduct);
    }

    // Tính tổng giá
    const totalPrice = products.reduce((total, item) => total + (item.priceNew * item.quantity), 0);

    // Tạo đơn hàng
    const objectOrder = {
        cart_id: cart.id,
        user_id: user.id,
        userInfo,
        products,
        totalPrice,
        status: "pending",
        paymentType,
        paymentStatus: "pending"
    };

    const order = new Order(objectOrder);
    await order.save();

    // Xóa sản phẩm khỏi giỏ hàng
    await Cart.updateOne(
        { userId: user.id },
        { $pull: { products: { _id: { $in: listProductIds } } } }
    );

    // Cập nhật thống kê
    const updatedStatistic = await getDashboardStatistic();
    global._io.emit('updateDashboard', updatedStatistic);

    // Xử lý thanh toán
    if (paymentType === "momo") {
        const accessKey = 'F8BBA842ECF85';
        const secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
        const orderInfo = 'pay with MoMo';
        const partnerCode = 'MOMO';
        const redirectUrl = `http://localhost:3000/checkout/success/${order.id}`;
        const ipnUrl = 'http://localhost:3000/checkout/payment/api/momo-ipn';
        const requestType = "payWithMethod";
        const amount = order.totalPrice;
        const orderId = order.id;
        const requestId = orderId;
        const extraData = '';
        const paymentCode = 'T8Qii53fAXyUftPV3m9ysyRhEanUs9KlOPfHgpMR0ON50U10Bh+vZdpJU7VY4z+Z2y77fJHkoDc69scwwzLuW5MzeUKTwPo3ZMaB29imm6YulqnWfTkgzqRaion+EuD7FN9wZ4aXE1+mRt0gHsU193y+yxtRgpmY7SDMU9hCKoQtYyHsfFR5FUAOAKMdw2fzQqpToei3rnaYvZuYaxolprm9+/+WIETnPUDlxCYOiw7vPeaaYQQH0BF0TxyU3zu36ODx980rJvPAgtJzH1gUrlxcSS1HQeQ9ZaVM1eOK/jl8KJm6ijOwErHGbgf/hVymUQG65rHU2MWz9U8QUjvDWA==';
        const orderGroupId = '';
        const autoCapture = true;
        const lang = 'vi';

        const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
        const signature = crypto.createHmac('sha256', secretKey)
            .update(rawSignature)
            .digest('hex');

        const requestBody = JSON.stringify({
            partnerCode,
            partnerName: "Test",
            storeId: "MomoTestStore",
            requestId,
            amount,
            orderId,
            orderInfo,
            redirectUrl,
            ipnUrl,
            lang,
            requestType,
            autoCapture,
            extraData,
            orderGroupId,
            signature
        });

        const options = {
            method: "POST",
            url: "https://test-payment.momo.vn/v2/gateway/api/create",
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody)
            },
            data: requestBody
        };

        try {
            const result = await axios(options);
            return res.redirect(result.data.payUrl);
        } catch (error) {
            return res.status(500).json({ statusCode: 500, message: error.message });
        }
    } else if (paymentType === "zalopay") {
        const config = {
            app_id: "2553",
            key1: "PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL",
            key2: "kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz",
            endpoint: "https://sb-openapi.zalopay.vn/v2/create"
        };

        const embed_data = {
            redirecturl: `http://localhost:3000/checkout/success/${order.id}`
        };

        const items = [{}];
        const transID = Math.floor(Math.random() * 1000000);
        const orders = {
            app_id: config.app_id,
            app_trans_id: `${moment().format('YYMMDD')}_${transID}`,
            app_user: "user123",
            app_time: Date.now(),
            item: JSON.stringify(items),
            embed_data: JSON.stringify(embed_data),
            amount: order.totalPrice,
            description: `Laptop14`,
            bank_code: "zalopayapp"
        };

        const data = config.app_id + "|" + orders.app_trans_id + "|" + orders.app_user + "|" + orders.amount + "|" + orders.app_time + "|" + orders.embed_data + "|" + orders.item;
        orders.mac = CryptoJS.HmacSHA256(data, config.key1).toString();

        try {
            const result = await axios.post(config.endpoint, null, { params: orders });
            return res.redirect(result.data.order_url);
        } catch (error) {
            return res.status(500).json({ statusCode: 500, message: error.message });
        }
    } else {
        return res.redirect(`/checkout/success/${order.id}`);
    }
};

// [GET] /checkout/success/:id
module.exports.success= async (req, res) => {
    const order= await Order.findOne({
        _id: req.params.id
    })

    let paymentStatus = "pending";
    let paymentMessage = "Đang chờ thanh toán.";

    // Kiểm tra trạng thái thanh toán nếu paymentType là momo
    if (order.paymentType === "momo") {
        const accessKey = 'F8BBA842ECF85';
        const secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
        const partnerCode = 'MOMO';
        const orderId = order.id;
        const requestId = orderId; // requestId trùng với orderId khi tạo giao dịch
        const lang = 'vi';

        // Tạo chữ ký bảo mật cho API Query
        const rawSignature = `accessKey=${accessKey}&orderId=${orderId}&partnerCode=${partnerCode}&requestId=${requestId}`;
        const signature = crypto.createHmac('sha256', secretKey)
            .update(rawSignature)
            .digest('hex');

        const requestBody = JSON.stringify({
            partnerCode,
            requestId,
            orderId,
            lang,
            signature
        });

        const options = {
            method: "POST",
            url: "https://test-payment.momo.vn/v2/gateway/api/query",
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody)
            },
            data: requestBody
        };

        try {
            const result = await axios(options);
            const { resultCode, message } = result.data;

            if (resultCode === 0) {
                paymentStatus = "success";
                paymentMessage = "Thanh toán thành công qua MoMo.";
                // Cập nhật trạng thái đơn hàng nếu cần
                await Order.updateOne({ _id: order.id }, { paymentStatus: "completed" });
            } else {
                paymentStatus = "failed";
                await Order.updateOne({ _id: order.id }, { paymentStatus: "failed" });
                paymentMessage = `Thanh toán thất bại: ${message}`;
            }
        } catch (error) {
            paymentStatus = "error";
            paymentMessage = "Không thể kiểm tra trạng thái thanh toán. Vui lòng thử lại sau.";
        }
    } else if (order.paymentType === "zalopay") {
        // Thêm logic kiểm tra trạng thái cho ZaloPay nếu cần
        paymentMessage = "Thanh toán qua ZaloPay. Vui lòng kiểm tra trạng thái giao dịch.";
    } else {
        paymentStatus = "success"; // COD không cần kiểm tra trạng thái
        paymentMessage = "Đơn hàng đã được đặt thành công (Thanh toán khi nhận hàng).";
    }

    for(const product of order.products){
        const productInfo= await Product.findOne({_id: product.product_id})
        product.productInfo= productInfo;
        console.log(product)

        product.productInfo= productInfo;
    
        productHepler.priceNewProduct(product);
        product.priceFormat= Number(product.priceNew).toLocaleString("vi-VN");
        // console.log(product.priceNew);

        product.totalPrice= product.priceNew * product.quantity;
        product.totalPriceFormat= product.totalPrice.toLocaleString("vi-VN");
    }

    order.totalPriceFormat= order.totalPrice.toLocaleString("vi-VN");
    // console.log(order.totalPrice);

    return res.render('client/pages/checkout/success', {
        pageTitle: 'Thanh toán thành công',
        order: order,
        paymentMessage,
        paymentStatus
    });
};