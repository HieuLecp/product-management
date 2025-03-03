const categoryMiddleWare= require("../../middlewares/client/category.middleware");

const productRouter = require("./product.route");
const homeRouter = require("./home.route")


module.exports = (app) => {

    app.use(categoryMiddleWare.category);

    app.use('/',homeRouter);
    
    app.use('/product',productRouter);

}