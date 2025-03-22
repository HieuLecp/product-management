const Product= require("../../models/product.model");
const Cart= require("../../models/carts.model");
const Order= require("../../models/orders.model");
const User= require("../../models/users.model");

const {default: axios} = require("axios");

const crypto = require('crypto');

const productHepler  = require("../../helpers/product");

// [GET] /checkout
module.exports.index= async (req, res) => {
    const user= await User.findOne({
        tokenUser: req.cookies.tokenUser
    });
    
    const cart= await Cart.findOne({userId: user.id});
    // console.log(cart);

    if(cart.products.length > 0){
        for(const item of cart.products){
            const productId= item.product_id;
            const productInfo= await Product.findOne({_id: productId});

            productHepler.priceNewProduct(productInfo);

            item.productInfo= productInfo;

            item.totalPrice= item.quantity * productInfo.priceNew;
            
        }
    }

    cart.totalPrice= cart.products.reduce((sum, item) => sum + item.totalPrice , 0);

    res.render("client/pages/checkout/index", {
        pageTitle: "Đặt hàng",
        cartDetail: cart
    })
};

// [POST] /checkout/order
module.exports.order= async (req, res) => {
    const user= await User.findOne({
        tokenUser: req.cookies.tokenUser
    });
    const userInfo= req.body;

    const cart= await Cart.findOne({
        userId: user.id   
    });

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

        const newStock= productInfo.stock - objectProduct.quantity;
        if(productInfo.sold){
            const newSold= productInfo.sold + objectProduct.quantity;
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

    // console.log(products);
    // console.log(totalPrice);

    const objectOrder= {
        cart_id: cart.id,
        user_id: user.id,
        userInfo: userInfo,
        products: products,
        totalPrice: totalPrice,
        status: "pending",
        paymentType: "cash"
    };

    const order= new Order(objectOrder);
    await order.save();

    await Cart.updateOne({
        userId: user.id  
    }, {
        products: []
    });

    // res.send("ok");
    res.redirect(`/checkout/payment/${order.id}`);
};

// [GET] /checkout/payment/:id
module.exports.payment= async (req, res) => {
    const orderId= req.params.id;

    const order= await Order.findOne({
        _id: req.params.id
    })
    if(order){
        for(const product of order.products){
            const productInfo= await Product.findOne({
                _id: product.product_id
            }).select("title thumbnail");
    
            product.productInfo= productInfo;
    
            productHepler.priceNewProduct(product);
            // console.log(product.priceNew);
    
            product.totalPrice= product.priceNew * product.quantity;
        }
    
        order.totalPrice= order.products.reduce((sum, item) => sum + item.totalPrice, 0);
    
        // console.log(order);
    
        res.render("client/pages/checkout/payment", {
            pageTitle: "Thanh toán",
            order: order,
            orderId: orderId
        })
    }
};

// [POST] /checkout/payment/:id
module.exports.paymentPost= async (req, res) => {
    const order= await Order.findOne({
        _id: req.params.id
    })
    if(order){
        //https://developers.momo.vn/#/docs/en/aiov2/?id=payment-method
        //parameters
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
            // console.log(result.data)
            // res.send("payment");
            res.redirect(payUrl);
        }catch{
            return res.status(500).json({
                statusCode: 500
            })
        }
    }

}

// [GET] /checkout/success/:id
module.exports.success= async (req, res) => {
    var accessKey = 'F8BBA842ECF85';
    var secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
    var partnerCode = 'MOMO';

    const orderId= req.params.id;
    const requestId = orderId;
    const lang = "vi";

    const rawSignature = `accessKey=${accessKey}&orderId=${orderId}&partnerCode=${partnerCode}&requestId=${requestId}`;
    const signature = crypto.createHmac("sha256", secretKey).update(rawSignature).digest("hex");

    const requestBody = {
        partnerCode,
        requestId,
        orderId,
        lang,
        signature,
    };

    try {
        const response = await axios.post("https://test-payment.momo.vn/v2/gateway/api/query", requestBody, {
            headers: { "Content-Type": "application/json" },
        });

        const data= response.data;
        // console.log(data)

        if (data.resultCode === 0) {
            await Order.updateOne({
                _id: req.params.id
            }, {
                status: "paid",
                paymentType: "banking"
            });
            
            const order= await Order.findOne({
                _id: req.params.id
            })
            if(order){
                for(const product of order.products){
                    const productInfo= await Product.findOne({
                        _id: product.product_id
                    }).select("title thumbnail");
            
                    product.productInfo= productInfo;
            
                    productHepler.priceNewProduct(product);
                    // console.log(product.priceNew);
            
                    product.totalPrice= product.priceNew * product.quantity;
                }
            
                order.totalPrice= order.products.reduce((sum, item) => sum + item.totalPrice, 0);
            
                // console.log(order);
            
                res.render("client/pages/checkout/success", {
                    pageTitle: "Thanh toán thành công",
                    order: order
                })
            }

        } else {
            await Order.updateOne({
                _id: req.params.id
            }, {
                status: "failed"
            });
            
            req.flash("error", "Thanh toán thất bại! Vui lòng thực hiện lại.");
            res.redirect("/user/info/list-order")
        }
    } catch (error) {
        console.error("Lỗi kiểm tra thanh toán:", error.response ? error.response.data : error.message);
        return null;
    }
};