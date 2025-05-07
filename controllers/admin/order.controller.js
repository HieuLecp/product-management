const Orders= require("../../models/orders.model");
const Accounts= require("../../models/accounts.model");
const Product= require("../../models/product.model");

const systemConfig = require("../../config/system");

const paginationHelper = require("../../helpers/pagination");
const filterStatusHelper = require("../../helpers/filterStatus");

// [GET] /admin/orders
module.exports.index = async (req, res) => {

    const filterStatus = filterStatusHelper.orders(req.query);

    let find = {}

    if(req.query.status){
        find.status = req.query.status;
    }

    // pagination
    const countProducts = await Orders.countDocuments();

    let objectPagination = paginationHelper(
        {
            currentPage: 1,
            limitItems : 4
        },
        req.query,
        countProducts
    )
    // end pagination

    const orders= await Orders.find(find)
    .limit(objectPagination.limitItems)
    .skip(objectPagination.skip);

    const orderDetails = [];

    for (const order of orders) {
        const productsInOrder = [];
        for (const item of order.products) {
            const product = await Product.findOne({ _id: item.product_id }).lean();
            // console.log(product.slug);
            if (!product) continue;

            productsInOrder.push({
                thumbnail: product.thumbnail,
                title: product.title,
                price: item.price.toLocaleString("vi-VN"),
                quantity: item.quantity,
            });
        }

        if (productsInOrder.length > 0) {
            orderDetails.push({
                orderId: order._id.toString(),
                createdAt: order.createdAt,
                totalPrice: order.totalPrice.toLocaleString("vi-VN"),
                status: order.status,
                products: productsInOrder
            });
        }
    }

    // console.log(orders);

    res.render("admin/pages/order/index", {
        pageTitle: "Quản lí đơn hàng",
        orderDetails: orderDetails,
        orders: orders,
        pagination: objectPagination,
        filterStatus: filterStatus
   })
};

// [PATCH] /admin/orders/change-multi
module.exports.changeMulti = async (req, res) => {
    const type = req.body.type;
    const ids = req.body.ids.split(",");

    const updatedBy= {
        account_id: res.locals.user.id,
        updatedAt: new Date()
    }

    switch (type){
        case "accept-all":
            await Orders.updateMany({_id: { $in: ids} }, { 
                status: "approved" ,
                $push: {updatedBy: updatedBy}
            } );
            req.flash("success", `Cập nhập trạng thái ${ids.length} đơn hàng thành công!`);
            break;
        case "prepare-all":
            await Orders.updateMany({_id: { $in: ids} }, { 
                status: "processing" ,
                $push: {updatedBy: updatedBy}
            } );
            req.flash("success", `Cập nhập trạng thái ${ids.length} đơn hàng thành công!`);
            break;
        case "shipp-all":
            await Orders.updateMany({_id: { $in: ids} }, { 
                status: "shipped" ,
                $push: {updatedBy: updatedBy}
            } );
            req.flash("success", `Cập nhập trạng thái ${ids.length} đơn hàng thành công!`);
            break;
        default:
            break;
    }
    res.redirect("back");
};