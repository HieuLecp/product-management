const Product= require("../../models/product.model");
const ProductCategory= require("../../models/product-category.model");

const systemConfig = require("../../config/system");

const filterStatusHelper = require("../../helpers/filterStatus");
const searchHepler = require("../../helpers/search");
const paginationHelper = require("../../helpers/pagination");
const createTree = require("../../helpers/createTree");


// [GET] /admin/products
module.exports.index = async (req, res) => {
    // console.log(req.query.status); 

    const filterStatus = filterStatusHelper(req.query);

    let find = {
        deleted: false
    }

    if(req.query.status){
        find.status = req.query.status;
    }

    const objectSearch = searchHepler(req.query);
    // console.log(objectSearch);

    if(objectSearch.regex){
        find.title = objectSearch.regex;
    }

    // pagination
    const countProducts = await Product.countDocuments(find);

    let objectPagination = paginationHelper(
        {
            currentPage: 1,
            limitItems : 4
        },
        req.query,
        countProducts
    )
    // end pagination

    // sort 
    let sort = {};

    if(req.query.sortKey && req.query.sortValue){
        sort[req.query.sortKey] = req.query.sortValue;
    }   
    else{
        sort.position = "desc";
    }
    // end sort

    const products= await Product.find(find)
    .sort(sort)   // desc: giảm dần, asc: tăng dần
    .limit(objectPagination.limitItems)
    .skip(objectPagination.skip);
    // console.log(products);

    res.render("admin/pages/products/index", {
        pageTitle : "Danh sách sản phẩm",
        products: products,
        filterStatus: filterStatus,
        keyword: objectSearch.keyword,
        pagination: objectPagination
    })
};

// [PATCH] /admin/products/change-status/:status/:id
module.exports.changeStatus = async (req, res) => {
    // console.log(req.params);
    const status = req.params.status;
    const id = req.params.id;

    await Product.updateOne({_id: id}, { status: status});

    req.flash("success", "Cập nhập trạng thái thành công!");

    res.redirect("back");
};

// [PATCH] /admin/products/change-multi
module.exports.changeMulti = async (req, res) => {
    // console.log(req.body);
    const type = req.body.type;
    const ids = req.body.ids.split(",");

    switch (type){
        case "active":
            await Product.updateMany({_id: { $in: ids} }, { status: "active" } );
            req.flash("success", `Cập nhập trạng thái ${ids.length} sản phầm thành công!`);
            break;
        case "inactive":
            await Product.updateMany({_id: { $in: ids} }, { status: "inactive" } );
            req.flash("success", `Cập nhập trạng thái ${ids.length} sản phầm thành công!`);
            break;
        case "delete-all":
            console.log(ids.length);
            await Product.updateMany(
                {_id: { $in: ids} }, 
                {  deleted: true,
                   deletedAt: new Date() 
                } 
            );
            req.flash("success", `Xoá thành công ${ids.length} sản phẩm!`);
            break;
        case "change-position":
            for(const item of ids){
                let [id, position] = item.split("-");
                position = parseInt(position);

                // console.log(ids.length);
                console.log(position);

                await Product.updateOne({_id: id}, { position: position});
            }
            req.flash("success", `Cập nhập vị trí thành công!`);
            break;
        default:
            break;
    }
    // console.log(type);
    // console.log(ids);
    res.redirect("back");
};

// [DELETE] /admin/products/delete/:id
module.exports.deleteItem = async (req, res) => {
    // console.log(req);
    const id = req.params.id;
    // console.log(id);

    await Product.updateOne({_id: id}, {
        deleted: true,
        deletedAt: new Date()
    });
    req.flash("success", "Xoá thành công sản phẩm!");

    res.redirect("back");
};

// [GET] /admin/products/create
module.exports.create = async (req, res) => {

    let find= {
        deleted : false
    };

    const category= await ProductCategory.find(find);

    const newCategory= createTree.tree(category);
    // console.log(newCategory);

    res.render("admin/pages/products/create", {
        pageTitle : "Thêm mới sản phẩm",
        category: newCategory
    })
};

// [POST] /admin/products/create
module.exports.createItem = async (req, res) => {
    req.body.price = parseInt(req.body.price);
    req.body.discountPercentage = parseInt(req.body.discountPercentage);
    req.body.stock = parseInt(req.body.stock);

    if(req.body.position == ""){
        const countProducts = await Product.countDocuments();
        req.body.position = countProducts +1 ;
    }else{
        req.body.position = parseInt(req.body.position);
    }

    const product = new Product(req.body);
    await product.save();

    // console.log(req.body);

    res.redirect(`${systemConfig.prefixAdmin}/products`);
};

// [GET] /admin/products/edit/:id
module.exports.edit = async (req, res) => {
    // console.log(req.params.id);

    try{
        const find= {
            deleted: false,
            _id: req.params.id
        };
        
        const category= await ProductCategory.find({deleted: false});
        const newCategory= createTree.tree(category);
        const product = await Product.findOne(find);
        // console.log(product);
    
        res.render("admin/pages/products/edit", {
            pageTitle : "Chỉnh sửa sản phẩm",
            product: product,
            category: newCategory
        });
    } catch(error) {
        res.redirect(`${systemConfig.prefixAdmin/products}`);
    }

};

// [PATCH] /admin/products/edit/:id
module.exports.editItem = async (req, res) => {
    const id = req.params.id;
    // console.log(req.body);
    
    req.body.price = parseInt(req.body.price);
    req.body.discountPercentage = parseInt(req.body.discountPercentage);
    req.body.stock = parseInt(req.body.stock);
    req.body.position = parseInt(req.body.position);    
    

    if(req.file){
        req.body.thumbnail = `/uploads/${req.file.filename}`;
    }

    try{
        await Product.updateOne({_id : id}, req.body);
        req.flash("success", `Cập nhập thành công!`);
    } catch (error){
        req.flash("error", `Cập nhập thất bại!`);
    }

    // console.log(req.body);

    res.redirect("back");

};

// [GET] /admin/products/edit/:id
module.exports.detail = async (req, res) => {
    console.log(req.params.id);
    try{
        const find= {
            deleted: false,
            _id: req.params.id,
            status: "active"
        };
    
        const product = await Product.findOne(find);
        console.log(product);
    
        res.render("admin/pages/products/detail", {
            pageTitle : product.title,
            product: product
        });
    } catch(error) {
        res.redirect(`${systemConfig.prefixAdmin}/products`);
    }

};

// B30