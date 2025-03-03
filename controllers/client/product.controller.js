const ProductCategory= require("../../models/product-category.model");
const Product = require('../../models/product.model');

// [GET] /products
module.exports.index = async (req, res) => {
    const products = await Product.find({
        status: "active",
        deleted : false
    })
    .sort({position: "desc"});

    const newproducts = products.map(item => {
        item.priceNew = (item.price * (100-item.discountPercentage)/100).toFixed(0);
        return item
    })

    // console.log(newproducts);

    res.render('client/pages/products/index',  {
        pageTitle: "Danh sách sản phẩm",
        products: newproducts
    });
}

// [GET] /products/:slug
module.exports.detail = async (req, res) => {
    // console.log(req.params);

    try{
        const find= {
            deleted: false,
            slug: req.params.slug
        };

        const products= await Product.findOne(find);

        const priceNew= (products.price * (100-products.discountPercentage)/100).toFixed(0);

        console.log(products);
    
        res.render("client/pages/products/detail", {
            pageTitle : products.title,
            products: products,
            priceNew: priceNew
        });
    } catch(error) {
        res.redirect(`/products}`);
    }

}