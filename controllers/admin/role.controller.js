const Roles= require("../../models/roles.model");

const systemConfig = require("../../config/system");


// [GET] /admin/roles
module.exports.index = async (req, res) => {

    let find={
        deleted: false
    }

    const records= await Roles.find(find);

    res.render("admin/pages/roles/index", {
        pageTitle: "Nhóm quyền",
        records: records
    });
};

// [GET] /admin/roles/create
module.exports.create = async (req, res) => {

    res.render("admin/pages/roles/create", {
        pageTitle: "Tạo nhóm quyền",
    });
};

// [POST] /admin/roles/create
module.exports.createRole = async (req, res) => {
    console.log(req.body);

    const record = new Roles(req.body);
    await record.save();

    res.redirect(`${systemConfig.prefixAdmin}/roles`);
}