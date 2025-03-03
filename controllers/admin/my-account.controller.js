const md5 = require('md5'); 
const Accounts= require("../../models/accounts.model");

// [GET] /admin/my-account
module.exports.index = async (req, res) => {

    res.render("admin/pages/my-account/index", {
        pageTitle: "Danh sách tài khoản",
    });
};

// [GET] /admin/my-account/edit
module.exports.edit = async (req, res) => {

    res.render("admin/pages/my-account/edit", {
        pageTitle: "Chỉnh sửa tài khoản",
    });
};

// [PATCH] /admin/my-account/edit
module.exports.editPatch = async (req, res) => {
    const id= res.locals.user.id;
    
    if(req.body.password){
        req.body.password= md5(req.body.password);
    }else{
        delete(req.body.password);
    }
    const emailExitst= await Accounts.findOne({
        _id: {$ne: id},
        email: req.body.email,
        deleted: false
    })
    const phoneExitst= await Accounts.findOne({
        _id: {$ne: id},
        phone: req.body.phone,
        deleted: false
    })
    if(emailExitst){
        req.flash("error", `Email ${req.body.email} đã tồn tại`);
        res.redirect("back");
    }
    else if(phoneExitst){
        req.flash("error", "Số điện thoại này đã tồn tại");
        res.redirect("back");
    }
    else{
        await Accounts.updateOne({_id: id}, req.body);

        req.flash("success", "Cập nhập thông tin cá nhân thành công!");
            
        res.redirect("back");
    }
};