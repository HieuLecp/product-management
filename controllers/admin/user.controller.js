const md5 = require('md5'); 
const User= require("../../models/users.model");
const Roles= require("../../models/roles.model");

const systemConfig = require("../../config/system");

// [GET] /admin/users
module.exports.index = async (req, res) => {

    let find={
        deleted: false
    }

    const records= await User.find(find).select("-password -token");
    
    // console.log(records);

    res.render("admin/pages/users/index", {
        pageTitle: "Danh sách người dùng",
        records: records,
    });
};

// [PATCH] /admin/users/change-status/:status/:id
module.exports.changeStatus = async (req, res) => {
    // console.log(req.params);
    const status = req.params.status;
    const id = req.params.id;

    const updatedBy= {
        account_id: res.locals.user.id,
        updatedAt: new Date()
    }

    await User.updateOne({_id: id}, {
        status: status,
        $push: {updatedBy: updatedBy}
    });

    req.flash("success", "Cập nhập trạng thái thành công!");

    res.redirect("back");
};

// [GET] /admin/detail/:id
module.exports.detail = async (req, res) => {

    const userId= req.params.id;

    const user= await User.findOne({_id: userId}).select("-password -token");
    
    // console.log(records);

    res.render("admin/pages/users/detail", {
        pageTitle: "Danh sách người dùng",
        user: user,
    });
};

