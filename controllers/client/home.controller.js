const ProductCategory= require("../../models/product-category.model");
const Product= require("../../models/product.model");
const Order= require("../../models/orders.model");

const createTree = require("../../helpers/createTree");

const productHepler  = require("../../helpers/product");

// GET /
module.exports.index =  async (req, res) => {

    // SP Nổi bật
    const productFeatured= await Product.find({
        featured: "1",
        deleted: false,
        status: "active"
    }).limit(6);

    productHepler.priceNewProducts(productFeatured);
    // end SP nổi bật

    // SP mới nhất
    const productNew= await Product.find({
        deleted: false,
        status: "active",
    }).sort({position: "desc"}).limit(5);

    productHepler.priceNewProducts(productNew);
    // end SP mới nhất

    // SP bán chạy
    const productSolds= await Product.find().sort({sold : -1}).limit().select("thumbnail title sold");
    // console.log(productSolds)
    // end sp bán chạy

    // doanh thu trong ngày
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0); // Đầu ngày

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999); // Cuối ngày

    const record = await Order.aggregate([
    {
        $match: {
        createdAt: { $gte: startOfDay, $lte: endOfDay } // Lọc đơn hàng trong ngày hôm nay
        }
    },
    {
        $group: {
        _id: null,
        totalRevenue: { $sum: "$totalPrice" } // Tính tổng totalPrice
        }
    }
    ]);
    if(record.length > 0){
        const revenue= record[0].totalRevenue;
    }
    // console.log(revenue);
    // end doanh thu trong ngày

    // console.log(productFeatured);

    res.render("client/pages/home/index.pug", {
        pageTitle: "Trang chủ",
        productFeatured: productFeatured,
        productNew: productNew,
        productSolds: productSolds,
        // revenue: revenue
    });
};
