const Product= require("../../models/product.model");
const Cart= require("../../models/carts.model");

const productHepler  = require("../../helpers/product");

// [GET]/cart
module.exports.index =  async (req, res) => {
    const cartId= req.cookies.cartId;
    
    const cart= await Cart.findOne({_id: cartId});
    console.log(cart);

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
    const cartId= req.cookies.cartId;
    const productId= req.params.productId;
    const quantity= parseInt(req.body.quantity);

    const cart= await Cart.findOne(
        {_id: cartId}
    );
    console.log(cart.products);

    const exitsProductCart= cart.products.find(item => item.product_id == productId);
    
    if(exitsProductCart){
        const newQuantity= quantity + exitsProductCart.quantity;
        console.log(newQuantity);

        await Cart.updateOne(
            {
                _id: cartId,
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
                _id: cartId
            },
            {
                $push: {products: objectCart}
            }
        )
    }

    req.flash("success", "Đã thêm sản phẩm vào giỏ hàng");
    res.redirect("back")
};