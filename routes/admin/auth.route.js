const express = require("express");
const Recaptcha = require('express-recaptcha').RecaptchaV2
const router = express.Router();

const controller = require("../../controllers/admin/auth.controller")
const validate= require("../../validates/admin/auth.validate")

const site_key = process.env.SITE_KEY;
const secret_key = process.env.SECRET_KEY;

const recaptcha = new Recaptcha(site_key, secret_key, { callback: 'cb' });

router.get('/login',
    recaptcha.middleware.render, 
    controller.login);

router.post('/login',
    validate.createPost,
    recaptcha.middleware.verify,
    controller.loginPost
);

router.get('/logout', controller.logout);

module.exports = router;