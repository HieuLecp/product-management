const express = require("express");
const router = express.Router();
const multer  = require('multer');

const upload = multer();

const Recaptcha = require('express-recaptcha').RecaptchaV2

const controller = require("../../controllers/client/user.controller");
const validate= require("../../validates/client/user.validate");
const authMiddleware= require("../../middlewares/client/auth.middleware");
const uploadCloud = require("../../middlewares/client/uploadCloud.middlewares");

const site_key = process.env.SITE_KEY;
const secret_key = process.env.SECRET_KEY;

const recaptcha = new Recaptcha(site_key, secret_key, { callback: 'cb' });

router.get('/register',
    // authMiddleware.checkUser,
    controller.register
);

router.post('/register', 
    validate.registerPost,
    controller.registerPost
);

router.get('/login', 
    authMiddleware.checkUser,
    recaptcha.middleware.render,
    controller.login
);

router.post('/login', 
    validate.loginPost,
    recaptcha.middleware.verify,
    controller.loginPost
);

router.get('/logout', controller.logout);

router.get('/password/forgot', controller.forgotPassword);

router.post('/password/forgot',
    validate.forgotPasswordPost, 
    controller.forgotPasswordPost
);

router.get('/password/otp', controller.otpPassword);

router.post('/password/otp', controller.otpPasswordPost);

router.get('/password/reset', controller.resetPassword);

router.post('/password/reset',
    validate.resetPasswordPost, 
    controller.resetPasswordPost
);

router.get('/info',
    authMiddleware.requireAuth,
    controller.infoUser
);

router.get('/info/edit',
    // authMiddleware.requireAuth,
    controller.edit
);

router.post('/info/edit',
    authMiddleware.requireAuth,
    upload.single('avatar'),
    uploadCloud.upload,
    controller.editPost
);

router.get('/info/editPassword',
    authMiddleware.requireAuth,
    controller.editPassword
);

router.post('/info/editPassword',
    authMiddleware.requireAuth,
    validate.editPasswordPost,
    controller.editPasswordPost
);

module.exports = router;