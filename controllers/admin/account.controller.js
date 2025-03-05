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

    const permissions= res.locals.role.permissions;

    if(permissions.includes("accounts_create")){
        const userNameExitst= await Accounts.findOne({
            userName: req.body.userName,
            deleted: false
        })
        const emailExitst= await Accounts.findOne({
            email: req.body.email,
            deleted: false
        })
        const phoneExitst= await Accounts.findOne({
            phone: req.body.phone,
            deleted: false
        })
        if(userNameExitst){
            req.flash("error", "Tên tài khoản này này đã tồn tại");
            res.redirect("back");
        }
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
    }else{
        
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

    const permissions= res.locals.role.permissions;

    if(permissions.includes("accounts_edit")){
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
    }else{
        
    } 
};

// [DELETE] /admin/accounts/delete/:id
module.exports.deleteItem = async (req, res) => {

    // console.log(req.params.id);
    const permissions= res.locals.role.permissions;

    if(permissions.includes("accounts_delete")){
        try{
            await Accounts.updateOne({_id: req.params.id}, {
                deleted: true,
                deletedBy: {
                    account_id: res.locals.user.id,
                    deletedAt: new Date()
                }
            });
            req.flash("success", "Xoá sản phẩm thành công!");
            res.redirect("back");
        }catch{
            req.flash("error", "Xoá sản phẩm thất bại!");
            res.redirect("back");
        }
    }else{
        
    }
};

// [GET] /admin/accounts/bin
module.exports.bin = async (req, res) => {

    let find = {
        deleted: true
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

    res.render("admin/pages/accounts/bin", {
        pageTitle : "Sản phẩm đã xoá",
        records: records,
    })
};

// [PATCH] /admin/accounts/bin/restore/:id
module.exports.restoreItem= async (req, res) => {
    // console.log(req.params.id);

    const permissions= res.locals.role.permissions;

    if(permissions.includes("accounts_restore")){
        try{
            await Accounts.updateOne(
                {_id: req.params.id},
                {deleted: false}
            );
        
            req.flash("success", "Khôi phục tài khoản thành công!");
            res.redirect("back");
        }catch{
            req.flash("error", "Khôi phục tài khoản thất bại!");
            res.redirect("back");
        }
    }else{
        
    }
};

// [DELETE] /admin/accounts/bin/delete/:id
module.exports.deleteItemBin= async (req, res) => {
    // console.log(req.params.id);
    const permissions= res.locals.role.permissions;

    if(permissions.includes("accounts-bin_delete")){
        try{
            await Accounts.deleteOne({_id: req.params.id});
    
            req.flash("success", "Xoá hẳn tài khoản thành công!");
            res.redirect("back");
        }catch{
            req.flash("error", "Xoá hẳn tài khoản thất bại!");
            res.redirect("back");
        }
    }else{
        
    }
}