const Product= require("../../models/product.model");

const filterStatusHelper = require("../../helpers/filterStatus")
const searchHepler = require("../../helpers/search")
const paginationHelper = require("../../helpers/pagination")


// [GET] /admin/bin
module.exports.index = async (req, res) => {

    const filterStatus = filterStatusHelper(req.query);

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

    const binProducts= await Product.find(find)
    .sort({position: "desc"})   // desc: giảm dần, asc: tăng dần
    .limit(objectPagination.limitItems)
    .skip(objectPagination.skip);

    res.render("admin/pages/bin/index", {
        pageTitle : "Sản phẩm đã xoá",
        binProducts: binProducts,
        filterStatus: filterStatus,
        keyword: objectSearch.keyword,
        pagination: objectPagination
    })
}


// [PATCH] /admin/bin/restore/:id
module.exports.restoreItem = async (req, res) => {
    // console.log(req.params.id)
    const id = req.params.id;
    console.log(id);

    await Product.updateOne({_id: id}, {deleted: false});
    req.flash("success", `Khôi phục thành công!`);

    res.redirect("back");
}

// [PATCH] /admin/products/change-status/:status/:id
module.exports.changeStatus = async (req, res) => {
    // console.log(req.params);
    const status = req.params.status;
    const id = req.params.id;

    await Product.updateOne({_id: id}, { status: status});

    req.flash("success", "Cập nhập trạng thái thành công!");

    res.redirect("back");
}


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
}