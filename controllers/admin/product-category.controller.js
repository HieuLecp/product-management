const ProductCategory= require("../../models/product-category.model");

const systemConfig = require("../../config/system");

// [GET] /admin/products-category
module.exports.index = async (req, res) => {
    // console.log(req.query.status); 

    let find={
        deleted: false,
    };

    const records = await ProductCategory.find(find);

    res.render("admin/pages/products-category/index", {
        pageTitle : "Danh mục sản phẩm",
        records: records
    })
};

// [GET] /admin/products-category/create
module.exports.create = async (req, res) => {
    // console.log(req.query.status); 

    res.render("admin/pages/products-category/create", {
        pageTitle : "Tạo danh mục sản phẩm",
    })
};

// [POST] /admin/products-category/create
module.exports.createCategory = async (req, res) => {
    // console.log(req.body);

    if(req.body.position == ""){
        const count = await ProductCategory.countDocuments();
        req.body.position = count +1 ;
    }else{
        req.body.position = parseInt(req.body.position);
    }

    const record= new ProductCategory(req.body);
    await record.save();

    res.redirect(`${systemConfig.prefixAdmin}/products-category`);

};