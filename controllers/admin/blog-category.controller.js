const BlogCategory= require("../../models/blog-category.model");

const systemConfig = require("../../config/system");

const createTree = require("../../helpers/createTree");
const filterStatusHelper = require("../../helpers/filterStatus");

// [GET] admin/blogs
module.exports.index= async (req, res) => {

    let find={
        deleted: false
    }

    const records= await BlogCategory.find(find);
    const newRecords= createTree.tree(records);
    console.log(newRecords);

    res.render("admin/pages/blogs-category/index", {
        pageTitle : "Danh mục sản phẩm",
        records: newRecords
    });
};

// [GET] admin/blogs-category/create
module.exports.create= async (req, res) => {
    
    let find={
        deleted: false
    }

    const records= await BlogCategory.find(find);
    const newRecords= createTree.tree(records);
    console.log(newRecords);

    res.render("admin/pages/blogs-category/create", {
        pageTitle : "Tạo danh mục sản phẩm",
        records: newRecords
    });
};

// [POST] /admin/blogs-category/create
module.exports.createCategory = async (req, res) => {
    // console.log(req.body);

    const permissions= res.locals.role.permissions;
    // console.log(permissions);

    if(permissions.includes("blogs-category_create")){
        if(req.body.position == ""){
            const count = await BlogCategory.countDocuments();
            req.body.position = count +1 ;
        }else{
            req.body.position = parseInt(req.body.position);
        }
    
        const record= new BlogCategory(req.body);
        await record.save();
    
        res.redirect(`${systemConfig.prefixAdmin}/blogs-category`);
    }else{
        
    }
};