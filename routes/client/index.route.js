const categoryMiddleWare= require("../../middlewares/client/category.middleware");
const cartMiddleware= require("../../middlewares/client/cart.middleware");
const userMiddleware= require("../../middlewares/client/user.middleware");
const settingMiddleware= require("../../middlewares/client/setting.middleware");
const authMiddleware= require("../../middlewares/client/auth.middleware");

const productRouter = require("./product.route");
const homeRouter = require("./home.route");
const searchRouter = require("./search.route");
const cartRouter = require("./cart.route");
const checkoutRouter = require("./checkout.route");
const userRouter = require("./user.route");
const usersRouter = require("./users.route");
const chatRouter = require("./chat.route");
const roomChatRouter = require("./roomChat.route");
const chatbotRouter = require("./chatbot.route");

module.exports = (app) => {

    app.use(categoryMiddleWare.category);

    app.use(cartMiddleware.cartId);

    app.use(userMiddleware.infoUser);

    app.use(settingMiddleware.settingGeneral);

    app.use('/',homeRouter);
    
    app.use('/product',productRouter);

    app.use('/search',searchRouter);

    app.use('/cart',cartRouter);

    app.use('/checkout',checkoutRouter);

    app.use('/user',userRouter);

    app.use('/chat',
        authMiddleware.requireAuth,
        chatRouter
    );

    app.use('/users',
        authMiddleware.requireAuth,
        usersRouter
    );

    app.use('/rooms-chat',
        authMiddleware.requireAuth,
        roomChatRouter
    );

    app.use('/chatbot',
        chatbotRouter
    );
    
}