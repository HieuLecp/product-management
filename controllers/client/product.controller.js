const ProductCategory= require("../../models/product-category.model");
const Product = require('../../models/product.model');
const User = require('../../models/users.model');

const productHepler  = require("../../helpers/product");
const productCategoryHepler  = require("../../helpers/product-category");

const paginationHelper = require("../../helpers/pagination");

// [GET] /product
module.exports.index = async (req, res) => {
    try{
        // console.log(req.query);
        let find = {
            deleted: false,
            status: "active"
        }

        if(req.query.priceMin || req.query.priceMax){
            find.price= {};

            if(req.query.priceMin){
                find.price.$gte = req.query.priceMin;
            }
            if(req.query.priceMax){
                find.price.$lte = req.query.priceMax;
            }
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
        .skip(objectPagination.skip);
    
        const newproducts= productHepler.priceNewProducts(products);    
        // console.log(newproducts);

        const listProductMax= Product.find().sort({ price: -1 }).limit(5).select("slug");
        const listProductMin= Product.find().sort({ price: 1 }).limit(5).select("slug");
        const listProductFeatured= Product.find({
            featured: true
        }).limit(3)
    
        res.render('client/pages/products/index',  {
            pageTitle: "Danh sách sản phẩm",
            products: newproducts,
            pagination: objectPagination
        });
    }catch{

    }
}

// [GET] /product/detail/:slugProduct
module.exports.detail = async (req, res) => {
    // console.log(req.params.slugProduct);

    try{
        const find= {
            deleted: false,
            slug: req.params.slugProduct
        };

        const products = await Product
            .findOne(find)
            .populate('reviews.comments.user_id', 'username') // Populate username cho comments
            .populate('reviews.comments.replies.user_id', 'username'); // Populate cho replies

        // console.log(products);
        if(products.product_category_id){
            const category= await ProductCategory.findOne({
                _id: products.product_category_id,
                status: "active",
                deleted: false  
            });

            products.category= category;

            productHepler.priceNewProduct(products);
            products.priceFormat= products.price.toLocaleString("vi-VN");
            
            products.priceNewFormat= Number(products.priceNew).toLocaleString("vi-VN");
            // console.log(products.priceNewFormat);
        }
        // console.log(products.priceNew);
        // console.log(products.category.slug);
    
        res.render("client/pages/products/detail", {
            pageTitle : products.title,
            product: products,
        });
    } catch(error) {
        res.redirect(`/product}`);
    }
};

// [GET] /product/:slugCategory
module.exports.category = async (req, res) => {
    try{
        let findCategory = {
            slug: req.params.slugCategory,
            deleted: false,
            status: "active"
        }

        const category= await ProductCategory.findOne(findCategory);

        if(category){

            const listSubCategory= await productCategoryHepler.getSubCategory(category.id);
        
            const listSubCategoryId= listSubCategory.map(item => item.id);

            let findProduct = {
                product_category_id: {$in: [category.id, ...listSubCategoryId]},
                deleted: false,
                status: "active"
            }

            // pagination
            const countProducts = await Product.countDocuments(findProduct);

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

            const products= await Product.find(findProduct)
            .sort(sort)
            .limit(objectPagination.limitItems)
            .skip(objectPagination.skip);;

            const newproducts= productHepler.priceNewProducts(products);

            res.render('client/pages/products/index',  {
                pageTitle: category.title,
                products: newproducts,
                pagination: objectPagination
            });
        }
        
        

    }catch{

    }
    
    
    
}

// [POST] /product/detail/:slugProduct/comment
module.exports.addComment = async (req, res) => {
    const { content, rating } = req.body;
    const slugProduct = req.params.slugProduct;
    const user= await User.findOne({
        tokenUser: req.cookies.tokenUser
    });
    try {
        // const { content, rating } = req.body;
        // const slugProduct = req.params.slugProduct;

        // console.log("content:" + content);
        // console.log("slug:" + slugProduct);

        // Validate
        if (!content && !rating) {
            req.flash('error', 'Phải cung cấp ít nhất nhận xét hoặc đánh giá');
            return res.redirect(`/products/detail/${slugProduct}`);
        }
        if (rating && (rating < 1 || rating > 5)) {
            req.flash('error', 'Đánh giá phải từ 1 đến 5');
            return res.redirect(`/products/detail/${slugProduct}`);
        }

        const product = await Product.findOne({ slug: slugProduct, deleted: false });
        if (!product) {
            return res.redirect('/product');
        }

        product.reviews.comments.push({
            user_id: user.id,
            userName: user.fullName,
            content: content || '',
            rating: rating ? parseInt(rating) : undefined,
            createdAt: new Date()
        });

        // Tính averageRating và totalRatings
        const ratings = product.reviews.comments.filter(c => c.rating).map(c => c.rating);
        product.reviews.totalRatings = ratings.length;
        product.reviews.averageRating = ratings.length > 0 
            ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length 
            : 0;

        await product.save();
        req.flash('success', 'Thêm nhận xét thành công!');
        res.redirect(`/product/detail/${slugProduct}`);
    } catch (error) {
        req.flash('error', 'Thêm nhận xét thất bại');
        console.log("lỗi:" + error);
        res.redirect(`/product/detail/${slugProduct}`);
    }
};