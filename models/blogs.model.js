const mongoose= require("mongoose");

const slug = require('mongoose-slug-updater');

mongoose.plugin(slug);

const blogSchema= new mongoose.Schema(
    {
        title : String,
        blog_category_id:{
            type: String,
            default: ""
        },
        description: String,
        content: String,
        featured: String,
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

const Blogs= mongoose.model('Blogs', blogSchema, 'blogs');

module.exports=Blogs;