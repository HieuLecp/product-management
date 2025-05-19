const ProductCategory= require("../../models/product-category.model");
const Product= require("../../models/product.model");
const Banner= require("../../models/banner.model");


const createTree = require("../../helpers/createTree");

const productHepler  = require("../../helpers/product");

// // GET /
// module.exports.index =  async (req, res) => {

//     // SP Nổi bật
//     const productFeatured= await Product.find({
//         featured: "1",
//         deleted: false,
//         status: "active"
//     }).limit(6);

//     productHepler.priceNewProducts(productFeatured);
//     // end SP nổi bật

//     // SP mới nhất
//     const productNew= await Product.find({
//         deleted: false,
//         status: "active",
//     }).sort({position: "desc"}).limit(5);

//     productHepler.priceNewProducts(productNew);
//     // end SP mới nhất

//     // SP bán chạy
//     const productSolds= await Product.find().sort({sold : -1}).limit().select("thumbnail title sold");
//     // console.log(productSolds)
//     // end sp bán chạy

//     // console.log(productFeatured);

//     res.render("client/pages/home/index.pug", {
//         pageTitle: "Trang chủ",
//         productFeatured: productFeatured,
//         productNew: productNew,
//         productSolds: productSolds,
//         // revenue: revenue
//     });
// };



//  [GET] /
module.exports.index = async (req, res) => {
    try {
        // Sản phẩm nổi bật
        const productFeatured = await Product.find({
            featured: '1',
            deleted: false,
            status: 'active'
        }).limit(6);
        productHepler.priceNewProducts(productFeatured);

        // Sản phẩm mới nhất
        const productNew = await Product.find({
            deleted: false,
            status: 'active'
        }).sort({ position: 'desc' }).limit(5);
        productHepler.priceNewProducts(productNew);

        // Sản phẩm bán chạy
        const productSolds = await Product.find({
            deleted: false,
            status: 'active'
        }).sort({ sold: -1 }).limit(5).select('thumbnail title sold');

        // Lấy banner từ database
        const banners = await Banner.find({ status: 'active' }).sort({ createdAt: -1 });

        // Tách banner theo loại
        const popupBanner = banners.find(b => b.type === 'popup') || null;
        const adLeftBanner = banners.find(b => b.type === 'ad-left') || null;
        const adRightBanner = banners.find(b => b.type === 'ad-right') || null;
        const slideBanners = banners.filter(b => b.type === 'slide-left' || b.type === 'slide-right');

        res.render('client/pages/home/index', {
            pageTitle: 'Trang chủ',
            productFeatured,
            productNew,
            productSolds,
            popupBanner,
            adLeftBanner,
            adRightBanner,
            slideBanners
        });
    } catch (error) {
        console.error('Error in home index:', error);
        req.flash('error', 'Lỗi khi tải trang chủ');
        res.redirect('/');
    }
};
