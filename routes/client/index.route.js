const categoryMiddleWare= require("../../middlewares/client/category.middleware");
const cartMiddleware= require("../../middlewares/client/cart.middleware");

const productRouter = require("./product.route");
const homeRouter = require("./home.route")
const searchRouter = require("./search.route")
const cartRouter = require("./cart.route")

module.exports = (app) => {

    app.use(categoryMiddleWare.category);

    app.use(cartMiddleware.cartId);

    app.use('/',homeRouter);
    
    app.use('/product',productRouter);

    app.use('/search',searchRouter);

    app.use('/cart',cartRouter);

}