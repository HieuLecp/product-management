const md5= require("md5");

const User= require("../../models/users.model");
const ForgotPassword= require("../../models/forgot-password.model");
const Carts= require("../../models/carts.model");

const generateHelper= require("../../helpers/generate");
const sendMailHelper= require("../../helpers/sendMail");

const { use } = require("../../routes/client/user.route");

// [GET] /user/register
module.exports.register =  async (req, res) => {

    res.render("client/pages/user/register.pug", {
        pageTitle: "Đăng ký",

    });
};

// [POST] /user/register
module.exports.registerPost =  async (req, res) => {

    const exitsEmail= await User.findOne({
        email: req.body.email,
        deleted: false
    });
    const exitsUsername= await User.findOne({
        userName: req.body.userName,
        deleted: false
    });

    if(exitsEmail){
        req.flash("error", "email này đã tồn tại!");
        res.redirect("back");
        return;
    }
    if(exitsUsername){
        req.flash("error", "tài khoản này đã tồn tại!");
        res.redirect("back");
        return;
    }

    req.body.password= md5(req.body.password);
    req.body.tokenUser = generateHelper.generateRandomString(20); 
    const record = new User(req.body);
    await record.save();
    // console.log(record);

    req.flash("success", "Bạn đã đăng ký tài khoản thành công!");
    res.cookie("tokenUser", record.tokenUser);
    res.redirect("/");
    // res.redirect("back");
};

// [GET] /user/login
module.exports.login =  async (req, res) => {

    res.render("client/pages/user/login.pug", {
        pageTitle: "Đăng nhập",
        captcha: res.recaptcha
    });
};

// [POST] /user/login
module.exports.loginPost =  async (req, res) => {
    // console.log(req.body);

    if(req.recaptcha && req.recaptcha.error === null){
        const user= await User.findOne({
            userName: req.body.userName
        });
    
        if(!user){
            req.flash("error", "Tài khoản không tồn tại!");
            res.redirect("back");
            return;
        }
    
        if(md5(req.body.password) != user.password){
            req.flash("error", "Mật khẩu không chính xác!");
            res.redirect("back");
            return;
        }
    
        if(user.status == "inactive"){
            req.flash("error", "Tài khoản đang bị khoá!");
            res.redirect("back");
            return;
        }
    
        res.cookie("tokenUser", user.tokenUser);
        await User.updateOne({
            _id: user.id
        }, {
            statusOnline: "online"
        })

        _io.once("connection", (socket) => [
            socket.broadcast.emit("server_return_user_online", user.id)
        ])
    
        await Carts.updateOne({
            _id: req.cookies.cartId
        }, {
            userId: user.id
        })
    
        res.redirect("/");
    }
    else{
        req.flash("error", "Vui lòng xác minh captcha!");
        res.redirect("back");
    }
    
};

// [POST] /user/logout
module.exports.logout =  async (req, res) => {

    await User.updateOne({
        _id: res.locals.user.id
    }, {
        statusOnline: "offline"
    })

    _io.once("connection", (socket) => [
        socket.broadcast.emit("server_return_user_offline", res.locals.user.id)
    ])

    res.clearCookie("tokenUser");

    res.redirect("/");
};

// [GET] /user/password/forgot
module.exports.forgotPassword =  async (req, res) => {

    res.render("client/pages/user/forgot-password", {
        pageTitle: "Quên mật khẩu",

    });
};

// [POST] /user/password/forgot
module.exports.forgotPasswordPost =  async (req, res) => {

    const email= req.body.email;

    const user= await User.findOne({
        email: email,
        deleted: false
    });

    if(!user){
        req.flash("error", "Tài khoản không tồn tại!");
        res.redirect("back");
        return;
    }

    // Tạo collection forgot-password
    const otp= generateHelper.generateRandomNumber(8);

    const objectForgotPassword= {
        email: email,
        otp: otp,
        expireAt: Date.now()
    };

    const forgotPassword= new ForgotPassword(objectForgotPassword);
    await forgotPassword.save();

    const subject= "Mã xác minh để lấy lại mật khẩu";
    const html= `
        Mã OTP xác minh lấy lại mật khẩu là <b>${otp}</b>. Thời gian hiệu lực là 2 phút. Lưu ý không được để lộ cho người khác
    `

    sendMailHelper.sendMail(email, subject, html);

    res.redirect(`/user/password/otp?email=${email}`);
};

// [GET] /user/password/otp
module.exports.otpPassword =  async (req, res) => {

    const email= req.query.email;

    res.render("client/pages/user/otp-password", {
        pageTitle: "Nhập mã otp",
        email: email
    });
};

// [POST] /user/password/otp
module.exports.otpPasswordPost =  async (req, res) => {

    const email= req.body.email;
    const otp= req.body.otp;

    const result= await ForgotPassword.findOne({
        email: email,
        otp: otp
    });

    // console.log(result);
    if(!result){
        req.flash("error", "Mã otp không hợp lệ!");
        res.redirect("back");
        return;
    }

    const user= await User.findOne({
        email: email
    });

    res.cookie("tokenUser", user.tokenUser);

    res.redirect("/user/password/reset");
};

// [GET] /user/password/reset
module.exports.resetPassword =  async (req, res) => {

    const email= req.query.email;

    res.render("client/pages/user/reset", {
        pageTitle: "Đặt lại mật khẩu",
        email: email
    });
};

// [POST] /user/password/reset
module.exports.resetPasswordPost =  async (req, res) => {

    const password= req.body.password;
    const tokenUser= req.cookies.tokenUser;

    await User.updateOne({
        tokenUser: tokenUser
    }, {
        password: md5(password)
    })
    req.flash("success", "Đặt lại mật khẩu thành công");
    res.redirect("/");
};

// [GET] /user/info
module.exports.infoUser =  async (req, res) => {

    const user= await User.findOne({
        tokenUser: req.cookies.tokenUser
    });

    // console.log(user);

    res.render("client/pages/user/info", {
        pageTitle: "Thông tin cá nhân",
        user: user
    });
};

// [GET] /user/info/edit
module.exports.edit =  async (req, res) => {

    const user= await User.findOne({
        // _id: res.locals.user.id
        tokenUser: req.cookies.tokenUser
    });

    // console.log(res.locals.user.id);

    res.render("client/pages/user/edit", {
        pageTitle: "Chỉnh sửa thông tin",
        user: user
    });
};

// [PATCH] /user/info/edit
module.exports.editPost =  async (req, res) => {

    const id= res.locals.user.id;
 
    const emailExitst= await User.findOne({
        _id: {$ne: id},
        email: req.body.email,
        deleted: false
    });
    const phoneExitst= await User.findOne({
        _id: {$ne: id},
        phone: req.body.phone,
        deleted: false
    });
    // console.log(phoneExitst);

    if(emailExitst){
        req.flash("error", `Email ${req.body.email} đã tồn tại`);
        res.redirect("back");
    }
    else if(phoneExitst){
        req.flash("error", "Số điện thoại này đã tồn tại");
        res.redirect("back");
    }
    else{
        await User.updateOne({
            _id: res.locals.user.id
        }, req.body);

        req.flash("success", "Thay đổi thông tin thành công");
        res.redirect("back");
    }
};

// [GET] /user/info/editPassword
module.exports.editPassword =  async (req, res) => {

    const user= await User.findOne({
        _id: res.locals.user.id
    });

    // console.log(res.locals.user.id);

    res.render("client/pages/user/editPassword", {
        pageTitle: "Đổi mật khẩu",
        user: user
    });
};

// [POST] /user/password/reset
module.exports.editPasswordPost =  async (req, res) => {

    const user= await User.findOne({
        _id: res.locals.user.id
    })
    // console.log(res.locals.user.id);

    if(md5(req.body.password) != user.password){
        req.flash("error", "Mật khẩu cũ không chính xác!");
        res.redirect("back");
    }else{
        const password= req.body.newPassword;

        await User.updateOne({
            _id: res.locals.user.id
        }, {
            password: md5(password)
        })
        req.flash("success", "Đặt lại mật khẩu thành công");
        res.redirect("back");
    }
};
