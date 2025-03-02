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
};

// [GET] /admin/roles/edit/:id
module.exports.edit = async (req, res) => {

    try{
        const id = req.params.id;
        // console.log(id);
        let find= {
            _id: id,
            deleted: false
        }

        const data = await Roles.findOne(find);
        console.log(data);

        res.render("admin/pages/roles/edit", {
            pageTitle: "Sửa nhóm quyền",
            data: data
        });
    } catch{
        res.redirect(`${systemConfig.prefixAdmin}/roles`);
    }
};

// [PATCH] /admin/roles/edit/:id
module.exports.editRole = async (req, res) => {

    try{
        const id = req.params.id;

        await Roles.updateOne({_id:id}, req.body);

        req.flash("success", "Cập nhập nhóm quyền thành công!");

        res.redirect("back");
    }catch{
        req.flash("error", "Cập nhập nhóm quyền thất bại!");

        res.redirect("back");
    }
    
};

// [GET] /admin/roles/permissions
module.exports.permissions = async (req, res) => {
    let find={
        deleted: false
    } 

    const records = await Roles.find(find);

    res.render("admin/pages/roles/permissions", {
        pageTitle: "Phân quyền",
        records: records
    });
};

// [PATCH] /admin/roles/permission
module.exports.permissionsPatch = async (req, res) => {
    // console.log(req.body.permissions);
    
    try{
        const permissions = JSON.parse(req.body.permissions);
        for(const item of permissions){
            await Roles.updateOne({_id:item.id}, {permissions: item.permissions});
        }
        // console.log(permissions);

        req.flash("success", "Cập nhập thành công");

        res.redirect("back");
    }catch{
        req.flash("error", "Cập nhập thất bại");

        res.redirect("back");
    }
    
};

