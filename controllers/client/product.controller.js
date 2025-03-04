const ProductCategory= require("../../models/product-category.model");
const Product = require('../../models/product.model');

const productHepler  = require("../../helpers/product");
const productCategoryHepler  = require("../../helpers/product-category");


// [GET] /products
module.exports.index = async (req, res) => {
    const products = await Product.find({
        status: "active",
        deleted : false
    })
    .sort({position: "desc"});

    const newproducts= productHepler.priceNew(products);

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
};

// [GET] /products/:slugCategory
module.exports.category = async (req, res) => {
    
    const category= await ProductCategory.findOne({
        slug: req.params.slugCategory,
        status: "active",
        deleted: false
    })

    const listSubCategory= await productCategoryHepler.getSubCategory(category.id);
    
    const listSubCategoryId= listSubCategory.map(item => item.id);

    const products= await Product.find({
        product_category_id: {$in: [category.id, ...listSubCategoryId]},
        deleted: false
    }).sort({position: "desc"})

    const newproducts= productHepler.priceNew(products);

    res.render('client/pages/products/index',  {
        pageTitle: category.title,
        products: newproducts
    });
}