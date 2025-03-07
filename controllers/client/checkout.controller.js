const Product= require("../../models/product.model");
const Cart= require("../../models/carts.model");
const Order= require("../../models/orders.model");
const User= require("../../models/users.model");

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
        console.log(newStock);
        await Product.updateOne({
            _id: item.product_id
        },{
            stock: newStock
        });

        objectProduct.price= productInfo.price;
        objectProduct.discountPercentage= productInfo.discountPercentage;

        products.push(objectProduct);
    }

    // console.log(products);

    const objectOrder= {
        cart_id: cart.id,
        user_id: user.id,
        userInfo: userInfo,
        products: products
    };

    const order= new Order(objectOrder);
    await order.save();

    await Cart.updateOne({
        userId: user.id  
    }, {
        products: []
    });

    // res.send("ok");
    res.redirect(`/checkout/success/${order.id}`);
};

// [GET] /checkout/success
module.exports.success= async (req, res) => {
    // console.log(req.params.id);

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
            console.log(product.priceNew);
    
            product.totalPrice= product.priceNew * product.quantity;
        }
    
        order.totalPrice= order.products.reduce((sum, item) => sum + item.totalPrice, 0);
    
        console.log(order);
    
        res.render("client/pages/checkout/success", {
            pageTitle: "Đặt hàng",
            order: order
        })
    }

};