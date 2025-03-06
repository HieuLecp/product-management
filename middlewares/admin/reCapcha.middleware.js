// const reCaptcha = require('express-recaptcha').RecaptchaV2

const site_key = process.env.SITE_KEY;
const secret_key = process.env.SECRET_KEY;

module.exports.renderCapcha= async (req, res, next) => {
    // console.log(site_key);
    // console.log(secret_key);
    console.log("chạy qua đây");

    console.log(req.body);

    next();
};