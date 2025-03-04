const ProductCategory= require("../../models/product-category.model");
const Product= require("../../models/product.model");
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

    productHepler.priceNew(productFeatured);
    // end SP nổi bật

    // SP mới nhất
    const productNew= await Product.find({
        deleted: false,
        status: "active",
    }).sort({position: "desc"}).limit(6);

    productHepler.priceNew(productNew);
    // end SP mới nhất
    // console.log(productFeatured);

    res.render("client/pages/home/index.pug", {
        pageTitle: "Trang chủ",
        productFeatured: productFeatured,
        productNew: productNew
    });
};