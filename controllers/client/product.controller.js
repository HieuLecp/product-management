const ProductCategory= require("../../models/product-category.model");
const Product = require('../../models/product.model');

const productHepler  = require("../../helpers/product");
const productCategoryHepler  = require("../../helpers/product-category");

const paginationHelper = require("../../helpers/pagination");


// [GET] /products
module.exports.index = async (req, res) => {
    try{

        let find = {
            deleted: false,
            status: "active"
        }

        // pagination
        const countProducts = await Product.countDocuments(find);

        let objectPagination = paginationHelper(
            {
                currentPage: 1,
                limitItems : 8
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

        const products = await Product.find(find)
        .sort(sort)
        .limit(objectPagination.limitItems)
        .skip(objectPagination.skip);;
    
        const newproducts= productHepler.priceNewProducts(products);
    
        // console.log(newproducts);
    
        res.render('client/pages/products/index',  {
            pageTitle: "Danh sách sản phẩm",
            products: newproducts,
            pagination: objectPagination
        });
    }catch{

    }
}

// [GET] /products/detail/:slugProduct
module.exports.detail = async (req, res) => {
    // console.log(req.params.slugProduct);

    try{
        const find= {
            deleted: false,
            slug: req.params.slugProduct
        };

        const products= await Product.findOne(find);

        // console.log(products);
        if(products.product_category_id){
            const category= await ProductCategory.findOne({
                _id: products.product_category_id,
                status: "active",
                deleted: false  
            });

            products.category= category;

            productHepler.priceNewProduct(products);
        }
        // console.log(products.priceNew);
        // console.log(products.category.slug);
    
        res.render("client/pages/products/detail", {
            pageTitle : products.title,
            products: products,
        });
    } catch(error) {
        res.redirect(`/product}`);
    }
};

// [GET] /products/:slugCategory
module.exports.category = async (req, res) => {
    
    const category= await ProductCategory.findOne({
        slug: req.params.slugCategory,
        status: "active",
        deleted: false
    });
    // console.log(category);
    // if(category){
    //     const listSubCategory= await productCategoryHepler.getSubCategory(category.id);
    
    //     const listSubCategoryId= listSubCategory.map(item => item.id);

    //     const products= await Product.find({
    //         product_category_id: {$in: [category.id, ...listSubCategoryId]},
    //         deleted: false
    //     }).sort({position: "desc"})

    //     const newproducts= productHepler.priceNewProducts(products);

    //     res.render('client/pages/products/index',  {
    //         pageTitle: category.title,
    //         products: newproducts,
    //     });
    // }
    // else{
    //     // res.redirect("back");
    // }
    const listSubCategory= await productCategoryHepler.getSubCategory(category.id);
    
        const listSubCategoryId= listSubCategory.map(item => item.id);

        const products= await Product.find({
            product_category_id: {$in: [category.id, ...listSubCategoryId]},
            deleted: false
        }).sort({position: "desc"})

        const newproducts= productHepler.priceNewProducts(products);

        res.render('client/pages/products/index',  {
            pageTitle: category.title,
            products: newproducts,
        });
    
}