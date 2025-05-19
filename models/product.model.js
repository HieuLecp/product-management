const mongoose= require('mongoose')
const commentSchema = require('./comments.model');

const slug = require('mongoose-slug-updater');

mongoose.plugin(slug);

const productSchema = new mongoose.Schema(
    {
        title : String,
        product_category_id:{
            type: String,
            default: ""
        },
        description: String,
        price : Number,
        discountPercentage : Number,
        stock : Number,
        thumbnail : String,
        status : String,
        featured: String,
        position : Number,
        sold: Number,
        brand: String,
        reviews: {
            comments: [commentSchema],
            averageRating: {
                type: Number,
                default: 0
            },
            totalRatings: {
                type: Number,
                default: 0
            }
        },
        slug : {
            type: String,
            slug: "title",
            unique: true
        },
        createdBy: {
            account_id: String,
            createdAt: {
                type: Date,
                default: Date.now
            }
        },
        deleted : {
            type: Boolean,
            default: false,
        },
        // "deletedAt": Date
        deletedBy: {
            account_id: String,
            deletedAt: Date
        },
        updatedBy: [
            {
                account_id: String,
                updatedAt: Date
            }
        ],
    }, 
    {
        timestamps : true
    }
);

productSchema.index({ 'reviews.comments.createdAt': -1 });

const Product = mongoose.model('Product', productSchema, "products");

module.exports = Product;