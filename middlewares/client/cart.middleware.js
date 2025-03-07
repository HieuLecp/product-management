const Cart= require("../../models/carts.model");
const User= require("../../models/users.model");

module.exports.cartId= async (req, res, next) => {
    // console.log(req.cookies.cartId);

    const user= await User.findOne({
        tokenUser: req.cookies.tokenUser
    });

    if(user){
        const cart = await Cart.findOne({
            userId: user.id
        })
        if(!cart){
            const cart = await new Cart({
                userId: user.id
            });
            await cart.save();
        } 
        else{
            if(cart.products.length > 0){
                cart.totalQuantity = cart.products.reduce((sum, item) => sum + item.quantity, 0);
                // console.log(cart.totalQuantity);
        
                res.locals.miniCart= cart.totalQuantity;
            }
        }
        res.locals.user= user;
    }
    
    // if(!req.cookies.cartId){
    //     const cart = await new Cart();
    //     await cart.save();

    //     const expiresTime= 1000 * 60 * 60 * 24 * 365;

    //     res.cookie("cartId", cart.id, {
    //         expires: new Date(Date.now() + expiresTime)
    //     });
    // }else{
    //     const cart = await Cart.findOne({
    //         _id: req.cookies.cartId
    //     })
        
    //     if(cart.products.length > 0){
    //         cart.totalQuantity = cart.products.reduce((sum, item) => sum + item.quantity, 0);

    //         res.locals.miniCart= cart.totalQuantity;
    //     }
    // }

    next();
};

