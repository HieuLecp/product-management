const Product= require("../../models/product.model");

const productHepler  = require("../../helpers/product");

// GET / search
module.exports.index =  async (req, res) => {

    const keyword= req.query.keyword;
    let newProducts= [];
    // console.log(keyword);

    if(keyword){
        const keywordRegex= new RegExp(keyword, "i");

        const products= await Product.find({
            title: keywordRegex,
            status: "active",
            deleted: false 
        })
        // console.log(products);
        newProducts= productHepler.priceNewProducts(products);
    }
    
    res.render("client/pages/search/index.pug", {
        pageTitle: "Trang chủ",
        keyword: keyword,
        products: newProducts
    });
};