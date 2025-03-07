const ProductCategory= require("../../models/product-category.model");

const systemConfig = require("../../config/system");

const createTree = require("../../helpers/createTree");
const filterStatusHelper = require("../../helpers/filterStatus");

// [GET] /admin/products-category
module.exports.index = async (req, res) => {
    // console.log(req.query.status);

    const filterStatus = filterStatusHelper(req.query);

    let find={
        deleted: false,
    };

    if(req.query.status){
        find.status = req.query.status;
    }

    const records = await ProductCategory.find(find);
    const newRecords= createTree.tree(records);

    res.render("admin/pages/products-category/index", {
        pageTitle : "Danh mục sản phẩm",
        records: newRecords,
        filterStatus: filterStatus,
    })
};

// [GET] /admin/products-category/create
module.exports.create = async (req, res) => {
    let find= {
        deleted : false
    };

    const records= await ProductCategory.find(find);

    const newRecords= createTree.tree(records);

    // console.log(newRecords);

    res.render("admin/pages/products-category/create", {
        pageTitle : "Tạo danh mục sản phẩm",
        records: newRecords
    })
};

// [POST] /admin/products-category/create
module.exports.createCategory = async (req, res) => {
    // console.log(req.body);

    const permissions= res.locals.role.permissions;

    if(permissions.includes("products-category_create")){
        if(req.body.position == ""){
            const count = await ProductCategory.countDocuments();
            req.body.position = count +1 ;
        }else{
            req.body.position = parseInt(req.body.position);
        }
    
        const record= new ProductCategory(req.body);
        await record.save();
    
        res.redirect(`${systemConfig.prefixAdmin}/products-category`);
    }else{
        
    }

};

// [GET] /admin/products-category/edit/:id
module.exports.edit = async (req, res) => {
    try{
        const id = req.params.id;

    const data= await ProductCategory.findOne(
        {_id: id},
        {deleted: false}
    );
    const records = await ProductCategory.find(
        {deleted: false}
    );
    const newRecords= createTree.tree(records);


    // console.log(newRecords);
    
    res.render("admin/pages/products-category/edit", {
        pageTitle: "Chỉnh sửa danh mục sản phẩm",
        data: data,
        records: newRecords
    });
    } catch{
        res.redirect(`${systemConfig.prefixAdmin}/products-category`);
    }

    
};

// [PATCH] /admin/products-category/edit/:id
module.exports.editItem = async (req, res) => {

    const permissions= res.locals.role.permissions;

    if(permissions.includes("products-category_edit")){
        const id = req.params.id;
        req.body.position = parseInt(req.body.position);

        await ProductCategory.updateOne({_id: id}, req.body);

        res.redirect("back");
    }else{
        
    }
    
};

// [DELETE] /admin/products-category/delete/:id
module.exports.deleteItem = async (req, res) => {
    const permissions= res.locals.role.permissions;

    if(permissions.includes("products-category_delete")){
        const id = req.params.id;

        await ProductCategory.updateOne({_id: id}, {
            deleted: true,
            deletedBy: {
                account_id: res.locals.user.id,
                deletedAt: new Date()
            }
        });
        req.flash("success", "Xoá thành công sản phẩm!");

        res.redirect("back");
    }else{
        
    }
    
};

// [GET] /admin/products-category/bin
module.exports.bin = async (req, res) => {

    const filterStatus = filterStatusHelper(req.query);

    let find = {
        deleted: true
    }
    if(req.query.status){
        find.status = req.query.status;
    }

    const records= await ProductCategory.find(find);

    res.render("admin/pages/products-category/bin", {
        pageTitle : "Sản phẩm đã xoá",
        records: records,
        filterStatus: filterStatus,
    })
};

// [PATCH] /admin/products-category/bin/restore/:id
module.exports.restoreItem= async (req, res) => {
    // console.log(req.params.id);

    const permissions= res.locals.role.permissions;

    if(permissions.includes("products-category_restore")){
        try{
            await ProductCategory.updateOne(
                {_id: req.params.id},
                {deleted: false}
            );
        
            req.flash("success", "Khôi phục danh mục thành công!");
            res.redirect("back");
        }catch{
            req.flash("error", "Khôi phục danh mục thất bại!");
            res.redirect("back");
        }
    }else{
        
    }
        
};

// [DELETE] /admin/products-category/bin/delete/:id
module.exports.deleteItemBin= async (req, res) => {
    // console.log(req.params.id);
    const permissions= res.locals.role.permissions;

    if(permissions.includes("products-category-bin_delete")){
        try{
            await ProductCategory.deleteOne({_id: req.params.id});
    
            req.flash("success", "Xoá hẳn danh mục thành công!");
            res.redirect("back");
        }catch{
            req.flash("success", "Xoá hẳn danh mục thất bại!");
            res.redirect("back");
        }
    }else{
        
    }

};