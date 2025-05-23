const mongoose= require("mongoose");

const slug = require('mongoose-slug-updater');

mongoose.plugin(slug);

const blogCategorySchema= new mongoose.Schema(
    {
        title : String,
        parent_id: {
            type: String,
            default: ""
        },
        description: String,
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

const BlogCategory= mongoose.model('BlogCategory', blogCategorySchema, 'blogs-category');

module.exports=BlogCategory;