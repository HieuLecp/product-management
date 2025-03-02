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
    
    console.log(records);

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