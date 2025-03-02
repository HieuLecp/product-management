const md5 = require('md5'); 
const Accounts= require("../../models/accounts.model");
const Roles= require("../../models/roles.model");

const systemConfig = require("../../config/system");


// [GET] /admin/accounts
module.exports.index = async (req, res) => {

    let find={
        deleted: false
    }

    const records= await Accounts.find(find).select("-password -token");

    for(const record of records){
        const role_id= record.role_id;
        const role= await Roles.findOne({
            _id: role_id,
            deleted: false
        })
        record.role= role;
    }
    
    // console.log(records);

    res.render("admin/pages/accounts/index", {
        pageTitle: "Danh sách tài khoản",
        records: records,
    });
};

// [GET] /admin/accounts/create
module.exports.create = async (req, res) => {

    const roles= await Roles.find({
        deleted: false
    })

    res.render("admin/pages/accounts/create", {
        pageTitle: "Tạo tài khoản",
        roles: roles
    });
};

// [POST] /admin/accounts/create
module.exports.createAccount = async (req, res) => {
    const emailExitst= await Accounts.findOne({
        email: req.body.email,
        deleted: false
    })
    const phoneExitst= await Accounts.findOne({
        phone: req.body.phone,
        deleted: false
    })
    if(emailExitst){
        req.flash("error", "Email này đã tồn tại");
        res.redirect("back");
    }
    else if(phoneExitst){
        req.flash("error", "Số điện thoại này đã tồn tại");
        res.redirect("back");
    }
    else{
        req.body.password= md5(req.body.password);
        // console.log(req.body);

        const record= new Accounts(req.body);
        await record.save();
        
        res.redirect(`${systemConfig.prefixAdmin}/accounts`);
    }
    
};

// [GET] /admin/accounts/edit/:id
module.exports.edit = async (req, res) => {
    let find= {
        _id: req.params.id,
        deleted: false
    }
    try{
        const data= await Accounts.findOne(find)

        const roles= await Roles.find({
            deleted: false
        })

        res.render("admin/pages/accounts/edit", {
            pageTitle: "Chỉnh sửa tài khoản",
            data: data,
            roles: roles
        });
    }catch(error){
        res.redirect(`${systemConfig.prefixAdmin}/accounts`);
    }
    
};

// [PATCH] /admin/accounts/edit/:id
module.exports.editAccount = async (req, res) => {
    const id= req.params.id;
    
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

        req.flash("success", "Cập nhập tài khoản thành công!");
            
        res.redirect("back");
    }
    
    
};