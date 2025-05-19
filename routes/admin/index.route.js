const systemConfig = require("../../config/system");
const Recaptcha = require('express-recaptcha').RecaptchaV2

const authMiddleware= require("../../middlewares/admin/auth.middleware");

const Authcontroller = require("../../controllers/admin/auth.controller")

const dashboardRouter = require("./dashboard.route");
const productRouter = require("./product.route");
const productCategoryRouter = require("./product-category.route");
const orderRouter = require("./order.route");
const roleRouter = require("./role.route");
const accountRouter = require("./account.route");
const authRouter = require("./auth.route");
const myAccountRouter = require("./my-account.route");
const blogCategoryRouter= require("./blog-category.route");
const blogRouter= require("./blog.route");
const settingRouter = require("./setting.route");
const bannerRouter = require("./banner.route");

const site_key = process.env.SITE_KEY;
const secret_key = process.env.SECRET_KEY;

const recaptcha = new Recaptcha(site_key, secret_key, { callback: 'cb' });


module.exports = (app) => {
    const PATH_ADMIN = systemConfig.prefixAdmin;

    app.get(PATH_ADMIN + '/',
        recaptcha.middleware.render, 
        Authcontroller.login);

    app.use(PATH_ADMIN + '/dashboard', 
        authMiddleware.requireAuth,
        dashboardRouter
    );

    app.use(PATH_ADMIN + '/products', 
        authMiddleware.requireAuth, 
        productRouter
    );

    app.use(PATH_ADMIN + '/products-category', 
        authMiddleware.requireAuth, 
        productCategoryRouter
    );

    app.use(PATH_ADMIN + '/orders',
        authMiddleware.requireAuth,
        orderRouter
    )

    app.use(PATH_ADMIN + '/blogs-category', 
        authMiddleware.requireAuth, 
        blogCategoryRouter
    );

    app.use(PATH_ADMIN + '/blogs', 
        authMiddleware.requireAuth, 
        blogRouter
    );

    app.use(PATH_ADMIN + '/roles', 
        authMiddleware.requireAuth, 
        roleRouter
    );

    app.use(PATH_ADMIN + '/accounts', 
        authMiddleware.requireAuth, 
        accountRouter
    );

    app.use(PATH_ADMIN + '/auth',
        authRouter
    );

    app.use(PATH_ADMIN + '/my-account', 
        authMiddleware.requireAuth, 
        myAccountRouter
    );

    app.use(PATH_ADMIN + '/setting', 
        authMiddleware.requireAuth, 
        settingRouter
    );

    app.use(PATH_ADMIN + '/banner', 
        authMiddleware.requireAuth, 
        bannerRouter
    );
}