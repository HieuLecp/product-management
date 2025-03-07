const BlogCategory= require("../../models/blog-category.model");
const Blogs= require("../../models/blogs.model");

const systemConfig = require("../../config/system");

const createTree = require("../../helpers/createTree");
const filterStatusHelper = require("../../helpers/filterStatus");

// [GET] admin/blogs
module.exports.index= async (req, res) => {

    let find={
        deleted: false
    }

    const records= await Blogs.find(find);

    res.render("admin/pages/blogs/index", {
        pageTitle : "Danh sách sản phẩm",
        records: records
    });
};

// [GET] admin/blogs/create
module.exports.create= async (req, res) => {
    
    let find={
        deleted: false
    }

    const records= await BlogCategory.find(find);
    const newRecords= createTree.tree(records);
    console.log(newRecords);

    res.render("admin/pages/blogs/create", {
        pageTitle : "Tạo danh mục sản phẩm",
        records: newRecords
    });
};

// [POST] /admin/blogs/create
module.exports.createPost = async (req, res) => {
    // console.log(req.body);

    const permissions= res.locals.role.permissions;
    // console.log(permissions);

    if(permissions.includes("blogs_create")){
        if(req.body.position == ""){
            const count = await Blogs.countDocuments();
            req.body.position = count +1 ;
        }else{
            req.body.position = parseInt(req.body.position);
        }
    
        const record= new Blogs(req.body);
        await record.save();
    
        res.redirect(`${systemConfig.prefixAdmin}/blogs`);
    }else{
        
    }
};

// [GET] /admin/blogs/edit/:id
module.exports.edit = async (req, res) => {
    try{
        const id = req.params.id;

        const data= await Blogs.findOne(
            {_id: id},
            {deleted: false}
        );
        const records = await BlogCategory.find(
            {deleted: false}
        );
        const newRecords= createTree.tree(records);

        // console.log(newRecords);
        
        res.render("admin/pages/blogs/edit", {
            pageTitle: "Chỉnh sửa bài viết",
            data: data,
            records: newRecords
        });
    } catch{
        res.redirect(`${systemConfig.prefixAdmin}/blogs`);
    }

    
};

// [PATCH] /admin/blogs/edit/:id
module.exports.editPost = async (req, res) => {

    const permissions= res.locals.role.permissions;

    if(permissions.includes("blogs_edit")){
        const id = req.params.id;
        // req.body.position = parseInt(req.body.position);

        await Blogs.updateOne({_id: id}, req.body);

        res.redirect("back");
    }else{
        
    }
    
};