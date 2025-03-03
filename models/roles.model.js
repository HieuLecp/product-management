const mongoose= require('mongoose')

const slug = require('mongoose-slug-updater');

mongoose.plugin(slug);

const rolesSchema = new mongoose.Schema(
    {
        title : String,
        description: String,
        permissions: {
            type: Array,
            default: []
        },
        deleted : {
            type: Boolean,
            default: false,
        },
        deletedBy: {
            account_id: String,
            deletedAt: Date
        }
    }, 
    {
        timestamps : true
    }
);

const Roles = mongoose.model('Roles', rolesSchema, "roles");

module.exports = Roles;