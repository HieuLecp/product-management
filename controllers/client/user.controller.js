const md5= require("md5");

const ProductCategory= require("../../models/product-category.model");
const Product= require("../../models/product.model");
const User= require("../../models/users.model");

const createTree = require("../../helpers/createTree");

const productHepler  = require("../../helpers/product");
const { use } = require("../../routes/client/user.route");

// [GET] /user/register
module.exports.register =  async (req, res) => {

    res.render("client/pages/user/register.pug", {
        pageTitle: "Trang đăng ký",

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
    const user = new User(req.body);
    await user.save();
    console.log(user);

    res.cookie("tokenUser", user.tokenUser);
    res.redirect("/");
};

// [GET] /user/login
module.exports.login =  async (req, res) => {

    res.render("client/pages/user/login.pug", {
        pageTitle: "Trang đăng nhập",

    });
};

// [POST] /user/login
module.exports.loginPost =  async (req, res) => {
    console.log(req.body);

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

    res.redirect("/");
};