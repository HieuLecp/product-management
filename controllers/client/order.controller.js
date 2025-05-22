const User= require("../../models/users.model");
const Order= require("../../models/orders.model");
const Product= require("../../models/product.model");


// [GET] /list-order
module.exports.listOrder= async (req, res) => {
    const user= await User.findOne({_id : res.locals.user.id});

    // let find= {
    //     user_id: user.id
    // }

    const filterValue= req.query.value || "all";
    // console.log(filterValue);

    const find = {
        user_id: user.id,
        ...(filterValue !== "all" && { status: filterValue }) // Chỉ thêm status nếu filterValue không phải "all"
    };
    
    // if(filterValue != "all"){
    //     find.status= filterValue;
    // }
    
    const orders= await Order.find(find);

    const orderDetails = [];

    for (const order of orders) {
        const productsInOrder = [];
        for (const item of order.products) {
            const product = await Product.findOne({ _id: item.product_id }).lean();

            if (!product) continue;

            productsInOrder.push({
                thumbnail: product.thumbnail,
                title: product.title,
                price: item.price.toLocaleString("vi-VN"),
                quantity: item.quantity,
                slug: product.slug
            });
        }

        if (productsInOrder.length > 0) {
            orderDetails.push({
                orderId: order._id.toString(),
                createdAt: new Date(order.createdAt).toLocaleString('vi-VN'),
                totalPrice: order.totalPrice.toLocaleString("vi-VN"),
                status: order.status,
                products: productsInOrder,
                paymentType: order.paymentType,
                paymentStatus: order.paymentStatus
            });
        }
    }

    

    // res.send("ok");
    res.render("client/pages/list-order/index", {
        pageTitle: "Lịch sử mua hàng",
        // products: listProduct,
        orderDetails: orderDetails,
        orders: orders
    })
};

// [PATCH] /list-order/cancel/:orderId
module.exports.cancelOrder= async (req, res) => {
    const orderId= req.params.orderId;

    try{
        await Order.updateOne({_id: orderId}, {status: "cancelled"});
    } catch(error){

    }

    return res.redirect("back");
};

// [PATCH] /list-order/completed/orderId
module.exports.deliveredOrder= async (req, res) => {
    const orderId= req.params.orderId;

    try{
        await Order.updateOne({_id: orderId}, {status: "completed"});

    } catch(error){

    }
    return res.redirect("back");
};