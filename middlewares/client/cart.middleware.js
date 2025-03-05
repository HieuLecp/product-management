const Cart= require("../../models/carts.model");

module.exports.cartId= async (req, res, next) => {
    // console.log(req.cookies.cartId);

    if(!req.cookies.cartId){
        const cart = await new Cart();
        await cart.save();

        const expiresTime= 1000 * 60 * 60 * 24 * 365;

        console.log(cart);
        res.cookie("cartId", cart.id, {
            expires: new Date(Date.now() + expiresTime)
        });
    }else{
        // Khi đã có giỏ hàng
    }

    next();
}