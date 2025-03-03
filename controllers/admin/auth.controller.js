const md5 = require('md5'); 
const Accounts= require("../../models/accounts.model");
const Roles= require("../../models/roles.model");

const systemConfig = require("../../config/system");


// [GET] /admin/auth/login
module.exports.login = async (req, res) => {
    // console.log(req.cookies.token);

    if(req.cookies.token){
        res.redirect(`${systemConfig.prefixAdmin}/dashboard`);
    }else{
        res.render("admin/pages/auth/login", {
            pageTitle: "Đăng nhập tài khoản",
        });
    }
};

// [POST] /admin/auth/login
// module.exports.loginPost = async (req, res) => {
//     console.log(req.body);
//     const email= req.body.email;
//     const password= req.body.password;

//     const user= await Accounts.findOne({
//         email: email,
//         deleted: false
//     });

//     if(!user){
//         req.flash("error", "Email không tồn tại!");
//         res.redirect("back");
//         return;
//     }

//     if(md5(password) != user.password){
//         req.flash("error", "Mật khẩu không chính xác!");
//         res.redirect("back");
//         return;
//     }

//     if(user.status == "Inactive"){
//         req.flash("error", "Tài khoản đã bị khoá!");
//         res.redirect("back");
//         return;
//     }
//     res.cookie("token", user.token);
//     res.redirect(`${systemConfig.prefixAdmin}/dashboard`);
// };


// [POST] /admin/auth/login
module.exports.loginPost = async (req, res) => {
    console.log(req.body);
    const userName= req.body.userName;
    const password= req.body.password;

    const user= await Accounts.findOne({
        userName: userName,
        deleted: false
    });

    if(!user){
        req.flash("error", "Tên đăng nhập không tồn tại!");
        res.redirect("back");
        return;
    }

    if(md5(password) != user.password){
        req.flash("error", "Mật khẩu không chính xác!");
        res.redirect("back");
        return;
    }

    if(user.status == "Inactive"){
        req.flash("error", "Tài khoản đã bị khoá!");
        res.redirect("back");
        return;
    }
    res.cookie("token", user.token);
    res.redirect(`${systemConfig.prefixAdmin}/dashboard`);
};


// [GET] /admin/auth/logout
module.exports.logout = async (req, res) => {
    res.clearCookie("token");

    res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
};