const Product= require("../../models/product.model");
const ProductCategory= require("../../models/product-category.model");
const Accounts= require("../../models/accounts.model");

const systemConfig = require("../../config/system");

const filterStatusHelper = require("../../helpers/filterStatus");
const searchHepler = require("../../helpers/search");
const paginationHelper = require("../../helpers/pagination");
const createTree = require("../../helpers/createTree");

const productCategoryHepler  = require("../../helpers/product-category");

// [GET] /admin/products
module.exports.index = async (req, res) => {
    // console.log(req.query.status);

    try{
        const filterStatus = filterStatusHelper.products(req.query);
        // console.log(filterStatus);

        let find = {
            deleted: false
        }

        if(req.query.status){
            find.status = req.query.status;
        }
        // console.log(find);

        // search
        const objectSearch = searchHepler(req.query);
        // console.log(objectSearch);

        if(objectSearch.regex){
            find.title = objectSearch.regex;
        }
        // end search 

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
        // console.log(sort);

        const products= await Product.find(find)
        .sort(sort)   // desc: giảm dần, asc: tăng dần
        .limit(objectPagination.limitItems)
        .skip(objectPagination.skip);
        // console.log(products);

        for(const item of products){
            // TT người tạo
            const user= await Accounts.findOne({_id: item.createdBy.account_id});
            if(user){
                item.accountFullName= user.fullName;
            }

            // TT người chỉnh sửa gần nhất
            // console.log(item.updatedBy.slice(-1)[0]);
            const updatedBy = item.updatedBy.slice(-1)[0]
            if(updatedBy){
                const userUpdated= await Accounts.findOne({_id: updatedBy.account_id});

                updatedBy.accountFullName = userUpdated.fullName;
            }
            
            item.priceFormat= item.price.toLocaleString("vi-VN");
            // console.log(item.priceFormat);
            
        }

        res.render("admin/pages/products/index", {
            pageTitle : "Danh sách sản phẩm",
            products: products,
            filterStatus: filterStatus,
            keyword: objectSearch.keyword,
            pagination: objectPagination
        })
    } catch (error){

    }
};

// [PATCH] /admin/products/change-status/:status/:id
module.exports.changeStatus = async (req, res) => {
    // console.log(req.params);
    const status = req.params.status;
    const id = req.params.id;

    const updatedBy= {
        account_id: res.locals.user.id,
        updatedAt: new Date()
    }

    await Product.updateOne({_id: id}, {
        status: status,
        $push: {updatedBy: updatedBy}
    });

    req.flash("success", "Cập nhập trạng thái thành công!");

    res.redirect("back");
};

// [PATCH] /admin/products/change-multi
module.exports.changeMulti = async (req, res) => {
    // console.log(req.body.type);
    const type = req.body.type;
    const ids = req.body.ids.split(",");

    const updatedBy= {
        account_id: res.locals.user.id,
        updatedAt: new Date()
    }

    switch (type){
        case "active":
            await Product.updateMany({_id: { $in: ids} }, { 
                status: "active" ,
                $push: {updatedBy: updatedBy}
            } );
            req.flash("success", `Cập nhập trạng thái ${ids.length} sản phầm thành công!`);
            break;
        case "inactive":
            await Product.updateMany({_id: { $in: ids} }, { 
                status: "inactive" ,
                $push: {updatedBy: updatedBy}
            } );
            req.flash("success", `Cập nhập trạng thái ${ids.length} sản phầm thành công!`);
            break;
        case "delete-all":
            // console.log(ids.length);
            await Product.updateMany(
                {_id: { $in: ids} }, 
                {  deleted: true,
                    deletedBy: {
                        account_id: res.locals.user.id,
                        deletedAt: new Date()
                    }
                } 
            );
            req.flash("success", `Xoá thành công ${ids.length} sản phẩm!`);
            break;
        case "change-position":
            for(const item of ids){
                let [id, position] = item.split("-");
                position = parseInt(position);

                // console.log(ids.length);
                // console.log(position);

                await Product.updateOne({_id: id}, { 
                    position: position,
                    $push: {updatedBy: updatedBy}
                });
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

    const permissions= res.locals.role.permissions;

    if(permissions.includes("products_create")){
        req.body.price = parseInt(req.body.price);
        req.body.discountPercentage = parseInt(req.body.discountPercentage);
        req.body.stock = parseInt(req.body.stock);

        if(req.body.position == ""){
            const countProducts = await Product.countDocuments();
            req.body.position = countProducts +1 ;
        }else{
            req.body.position = parseInt(req.body.position);
        }

        req.body.createdBy= {
            account_id: res.locals.user.id
        }

        const product = new Product(req.body);
        await product.save();

        // console.log(req.body);

        res.redirect(`${systemConfig.prefixAdmin}/products`);
    }else{
        
    }
    
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

    const permissions= res.locals.role.permissions;

    if(permissions.includes("products_edit")){
        const id = req.params.id;
        // console.log(req.body);
        
        req.body.price = parseInt(req.body.price);
        req.body.discountPercentage = parseInt(req.body.discountPercentage);
        req.body.stock = parseInt(req.body.stock);
        req.body.position = parseInt(req.body.position);    
        
        if(req.file){
            req.body.thumbnail = `${req.body.thumbnail}`;
            // console.log(req.body.thumbnail);
        }
        try{
            const updatedBy= {
                account_id: res.locals.user.id,
                updatedAt: new Date()
            };

            await Product.updateOne({_id : id},{
                ...req.body,
                $push: {updatedBy: updatedBy}
            });

            req.flash("success", `Cập nhập thành công!`);
        } catch (error){
            req.flash("error", `Cập nhập thất bại!`);
        }

        res.redirect("back");
    }else{
        
    }
};

// [GET] /admin/products/detail/:id
module.exports.detail = async (req, res) => {
    // console.log(req.params.id);
    try{
        const find= {
            deleted: false,
            _id: req.params.id,
            status: "active"
        };
    
        const product = await Product.findOne(find);
        // console.log(product.product_category_id);

        if(product.product_category_id){
            const category= await ProductCategory.findOne({
                _id: product.product_category_id,
                status: "active",
                deleted: false  
            });
            // console.log(category);
            product.category= category;
        }

        // TT người tạo
        const user= await Accounts.findOne({_id: product.createdBy.account_id});
        if(user){
            product.accountFullName= user.fullName;
        }
        // TT người chỉnh sửa gần nhất
        // console.log(item.updatedBy.slice(-1)[0]);
        const updatedBy = product.updatedBy.slice(-1)[0]
        if(updatedBy){
            const userUpdated= await Accounts.findOne({_id: updatedBy.account_id});

            updatedBy.accountFullName = userUpdated.fullName;
        }

        product.priceFormat= product.price.toLocaleString("vi-VN");
    
        res.render("admin/pages/products/detail", {
            pageTitle : product.title,
            product: product
        });
    } catch(error) {
        res.redirect(`${systemConfig.prefixAdmin}/products`);
    }

};

// [DELETE] /admin/products/delete/:id
module.exports.deleteItem = async (req, res) => {

    const permissions= res.locals.role.permissions;

    if(permissions.includes("products_delete")){
        const id = req.params.id;

        try{
            await Product.updateOne({_id: id}, {
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

// [GET] /admin/products/bin
module.exports.bin = async (req, res) => {

    const filterStatus = filterStatusHelper.products(req.query);

    let find = {
        deleted: true
    }
    if(req.query.status){
        find.status = req.query.status;
    }

    const objectSearch = searchHepler(req.query);
    // console.log(objectSearch);

    if(objectSearch.regex){
        
        find.title = objectSearch.regex;
    }

    // phân trang
    const countProducts = await Product.countDocuments(find);

    let objectPagination = paginationHelper(
        {
            currentPage: 1,
            limitItems : 4
        },
        req.query,
        countProducts
    )

    const records= await Product.find(find)
    .sort({position: "desc"})   // desc: giảm dần, asc: tăng dần
    .limit(objectPagination.limitItems)
    .skip(objectPagination.skip);

    res.render("admin/pages/products/bin", {
        pageTitle : "Sản phẩm đã xoá",
        records: records,
        filterStatus: filterStatus,
        keyword: objectSearch.keyword,
        pagination: objectPagination
    })
}

// [PATCH] /admin/products/bin/restore/:id
module.exports.restoreItem = async (req, res) => {

    const permissions= res.locals.role.permissions;

    if(permissions.includes("products_restore")){
        const id = req.params.id;
        // console.log(id);

        await Product.updateOne({_id: id}, {deleted: false});
        req.flash("success", `Khôi phục thành công!`);

        res.redirect("back");
    }else{
        
    }
};

// [PATCH] /admin/products/bin/delete/:id
module.exports.deleteItemBin = async (req, res) => {
    // console.log(req.params.id)
    const permissions= res.locals.role.permissions;

    if(permissions.includes("products-bin_delete")){
        await Product.deleteOne({_id: req.params.id});

        req.flash("success", "Xoá hẳn thành công");

        res.redirect("back");
    }else{
        
    }
}

