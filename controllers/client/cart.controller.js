const Product= require("../../models/product.model");
const Cart= require("../../models/carts.model");
const User= require("../../models/users.model");

const productHepler  = require("../../helpers/product");

// [GET]/cart
module.exports.index =  async (req, res) => {
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

    res.render("client/pages/cart/index", {
        pageTitle : "Giỏ hàng",
        cartDetail: cart
    });
};

// [POST]/cart/add/:productId
module.exports.addCart =  async (req, res) => {
    const user= await User.findOne({
        tokenUser: req.cookies.tokenUser
    });
    // const cartId= req.cookies.cartId;
    const productId= req.params.productId;
    const quantity= parseInt(req.body.quantity);

    const cart= await Cart.findOne(
        {
            userId: user.id
        }
    );
    
    // console.log(cart);
    // console.log(productId);
    // console.log(quantity);

    const exitsProductCart= cart.products.find(item => item.product_id == productId);
    
    if(exitsProductCart){
        const newQuantity= quantity + exitsProductCart.quantity;
        // console.log(newQuantity);

        await Cart.updateOne(
            {
                userId: user.id,
                'products.product_id': productId
            },
            {
                'products.$.quantity': newQuantity
            }
        );
    }else{
        const objectCart= {
            product_id: productId,
            quantity:  quantity
        }
    
        await Cart.updateOne(
            {
                userId: user.id,
            },
            {
                $push: {products: objectCart}
            }
        )
    }

    req.flash("success", "Đã thêm sản phẩm vào giỏ hàng");
    res.redirect("back")
    // res.send("ok");
};

// [GET]/cart/delete/:id
module.exports.delete =  async (req, res) => {
    const user= await User.findOne({
        tokenUser: req.cookies.tokenUser
    });

    const productId= req.params.productId;
    // const cartId= req.cookies.cartId;

    await Cart.updateOne(
        {
            userId: user.id,
        },
        {
            "$pull": {products : { "product_id": productId}}
        }
    )

    req.flash("success", "Đã xoá khỏi giỏ hàng");
    res.redirect("back");
};

// [GET]/cart/update/:id/:quantity
module.exports.update =  async (req, res) => {
    const user= await User.findOne({
        tokenUser: req.cookies.tokenUser
    });

    // const cartId= req.cookies.cartId;
    const productId= req.params.productId;
    const quantity= req.params.quantity;

    await Cart.updateOne(
        {
            userId: user.id,
            'products.product_id': productId
        },
        {
            'products.$.quantity': quantity
        }
    );

    req.flash("success", "Đã cập nhập");
    res.redirect("back");
};