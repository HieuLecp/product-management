const Product= require("../../models/product.model");
const Cart= require("../../models/carts.model");
const Order= require("../../models/orders.model");
const User= require("../../models/users.model");

const {default: axios} = require("axios");

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
module.exports.order= async (req, res) => {
    const { productIds,paymentType, ...userInfo } = req.body;
    const listProductIds = productIds.split(",");
    console.log(paymentType);

    const user= await User.findOne({
        tokenUser: req.cookies.tokenUser
    });

    const cart= await Cart.findOne({
        userId: user.id   
    });

    cart.products = cart.products.filter(item => listProductIds.includes(item.id));
    let products= [];

    for(const item of cart.products){
        const objectProduct= {
            product_id: item.product_id,
            price: 0,
            discountPercentage: 0,
            quantity: item.quantity
        }

        const productInfo= await Product.findOne({
            _id: item.product_id
        });
        let newSold;

        const newStock= productInfo.stock - objectProduct.quantity;
        if(productInfo.sold){
            newSold= productInfo.sold + objectProduct.quantity;
        } else{
            newSold=1;
        }
        // console.log(newStock);
        await Product.updateOne({
            _id: item.product_id
        },{
            stock: newStock,
            sold: newSold
        });

        objectProduct.price= productInfo.price;
        objectProduct.discountPercentage= productInfo.discountPercentage;

        products.push(objectProduct);
    }

    let totalPrice= 0;
    for(const item of products){
        productHepler.priceNewProduct(item);
        totalPrice = totalPrice + (item.priceNew * item.quantity);
    }

    const objectOrder= {
        cart_id: cart.id,
        user_id: user.id,
        userInfo: userInfo,
        products: products,
        totalPrice: totalPrice,
        status: "pending",
        paymentType: paymentType
    };

    const order= new Order(objectOrder);
    await order.save();

    await Cart.updateOne(
        { userId: user.id },
        {
            $pull: { products: { _id: { $in: listProductIds } } }
        }
    );

    if(paymentType === "momo"){
        var accessKey = 'F8BBA842ECF85';
        var secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
        var orderInfo = 'pay with MoMo';
        var partnerCode = 'MOMO';
        var redirectUrl = `http://localhost:3000/checkout/success/${order.id}`;
        var ipnUrl = 'http://localhost:3000/checkout/payment/api/momo-ipn';
        var requestType = "payWithMethod";
        var amount = order.totalPrice;
        var orderId = order.id ;
        var requestId = orderId;
        var extraData ='';
        var paymentCode = 'T8Qii53fAXyUftPV3m9ysyRhEanUs9KlOPfHgpMR0ON50U10Bh+vZdpJU7VY4z+Z2y77fJHkoDc69scwwzLuW5MzeUKTwPo3ZMaB29imm6YulqnWfTkgzqRaion+EuD7FN9wZ4aXE1+mRt0gHsU193y+yxtRgpmY7SDMU9hCKoQtYyHsfFR5FUAOAKMdw2fzQqpToei3rnaYvZuYaxolprm9+/+WIETnPUDlxCYOiw7vPeaaYQQH0BF0TxyU3zu36ODx980rJvPAgtJzH1gUrlxcSS1HQeQ9ZaVM1eOK/jl8KJm6ijOwErHGbgf/hVymUQG65rHU2MWz9U8QUjvDWA==';
        var orderGroupId ='';
        var autoCapture =true;
        var lang = 'vi';

        //before sign HMAC SHA256 with format
        //accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType
        var rawSignature = "accessKey=" + accessKey + "&amount=" + amount + "&extraData=" + extraData + "&ipnUrl=" + ipnUrl + "&orderId=" + orderId + "&orderInfo=" + orderInfo + "&partnerCode=" + partnerCode + "&redirectUrl=" + redirectUrl + "&requestId=" + requestId + "&requestType=" + requestType;
        //puts raw signature
        //signature
        var signature = crypto.createHmac('sha256', secretKey)
            .update(rawSignature)
            .digest('hex');

        //json object send to MoMo endpoint
        const requestBody = JSON.stringify({
            partnerCode : partnerCode,
            partnerName : "Test",
            storeId : "MomoTestStore",
            requestId : requestId,
            amount : amount,
            orderId : orderId,
            orderInfo : orderInfo,
            redirectUrl : redirectUrl,
            ipnUrl : ipnUrl,
            lang : lang,
            requestType: requestType,
            autoCapture: autoCapture,
            extraData : extraData,
            orderGroupId: orderGroupId,
            signature : signature
        });
        
        // option axios
        const options= {
            method: "POST",
            url: "https://test-payment.momo.vn/v2/gateway/api/create",
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody)
            },
            data: requestBody
        };
        let result;

        try{
            result= await axios(options);

            const payUrl = result.data.payUrl;
            console.log(payUrl)
            // res.send("payment");
            return res.redirect(payUrl);
        }catch{
            return res.status(500).json({
                statusCode: 500
            })
        }
    }
    else if(paymentType === "zalopay"){
        const config = {
            app_id: "2553",
            key1: "PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL",
            key2: "kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz",
            endpoint: "https://sb-openapi.zalopay.vn/v2/create"
        };
        const embed_data = {
            redirecturl : `http://localhost:3000/checkout/success/${order.id}`
        };

        const items = [{}];
        const transID = Math.floor(Math.random() * 1000000);
        const orders = {
            app_id: config.app_id,
            app_trans_id: `${moment().format('YYMMDD')}_${transID}`, // translation missing: vi.docs.shared.sample_code.comments.app_trans_id
            app_user: "user123",
            app_time: Date.now(), // miliseconds
            item: JSON.stringify(items),
            embed_data: JSON.stringify(embed_data),
            amount: order.totalPrice,
            description: `Laptop14`,
            bank_code: "zalopayapp",
        };

        // appid|app_trans_id|appuser|amount|apptime|embeddata|item
        const data = config.app_id + "|" + orders.app_trans_id + "|" + orders.app_user + "|" + orders.amount + "|" + orders.app_time + "|" + orders.embed_data + "|" + orders.item;
        orders.mac = CryptoJS.HmacSHA256(data, config.key1).toString();

        try {
            const result= await axios.post(config.endpoint, null, { params: orders });
            // console.log(result)

            const payUrl = result.data.order_url;
            return res.redirect(payUrl);
        } catch (error) {
            console.log(error.message);
        }
    }
    else{
        return res.redirect(`/checkout/success/${order.id}`);
    }
    // res.send("ok");
};

// // [GET] /checkout/success/:id
// module.exports.success = async (req, res) => {
//     const accessKey = 'F8BBA842ECF85';
//     const secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
//     const partnerCode = 'MOMO';

//     const orderId = req.params.id;
//     const requestId = orderId;
//     const lang = 'vi';

//     const rawSignature = `accessKey=${accessKey}&orderId=${orderId}&partnerCode=${partnerCode}&requestId=${requestId}`;
//     const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

//     const requestBody = {
//         partnerCode,
//         requestId,
//         orderId,
//         lang,
//         signature,
//     };

//     try {
//         const response = await axios.post('https://test-payment.momo.vn/v2/gateway/api/query', requestBody, {
//             headers: { 'Content-Type': 'application/json' },
//         });

//         const data = response.data;
//         console.log(data);

//         const order = await Order.findOne({ _id: req.params.id });
//         if (!order) {
//             return res.status(404).send('Không tìm thấy đơn hàng');
//         }

//         if (data.resultCode === 0) {
//             await Order.updateOne({ _id: req.params.id }, { status: 'paid', paymentType: 'banking' });

//             for (const product of order.products) {
//                 const productInfo = await Product.findOne({ _id: product.product_id }).select('title thumbnail');
//                 product.productInfo = productInfo;
//                 productHepler.priceNewProduct(product);
//                 product.totalPrice = product.priceNew * product.quantity;
//             }

//             order.totalPrice = order.products.reduce((sum, item) => sum + item.totalPrice, 0);

//             return res.render('client/pages/checkout/success', {
//                 pageTitle: 'Thanh toán thành công',
//                 order: order,
//             });
//         } else {
//             if (order.paymentType === 'momo') {
//                 await Order.updateOne({ _id: req.params.id }, { status: 'failed' });
//                 // req.flash("error", "Thanh toán thất bại! Vui lòng thực hiện lại."); // Bỏ nếu không dùng flash
//                 return res.redirect('/user/info/list-order');
//             } else {
//                 for (const product of order.products) {
//                     const productInfo = await Product.findOne({ _id: product.product_id }).select('title thumbnail');
//                     product.productInfo = productInfo;
//                     productHepler.priceNewProduct(product);
//                     product.totalPrice = product.priceNew * product.quantity;
//                 }

//                 order.totalPrice = order.products.reduce((sum, item) => sum + item.totalPrice, 0);

//                 return res.render('client/pages/checkout/success', {
//                     pageTitle: 'Thanh toán thành công',
//                     order: order,
//                 });
//             }
//         }
//     } catch (error) {
//         console.error('Lỗi kiểm tra thanh toán:', error.response ? error.response.data : error.message);
//         return res.status(500).send('Lỗi kiểm tra thanh toán');
//     }
// };

// [GET] /checkout/success/:id
module.exports.success= async (req, res) => {
    const order= await Order.findOne({
        _id: req.params.id
    })

    return res.render('client/pages/checkout/success', {
        pageTitle: 'Thanh toán thành công',
        order: order,
    });
};