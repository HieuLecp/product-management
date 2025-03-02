const mongoose= require('mongoose')

const generate= require("../helpers/generate");

const accountsSchema = new mongoose.Schema(
    {
        fullName : String,
        password: String,
        email: String,
        token: {
            type: String,
            default: generate.generateRandomString(20)
        },
        phone: String,
        avatar: String,
        role_id: String,
        status: String,
        deleted : {
            type: Boolean,
            default: false,
            unique: true
        },
        "deletedAt": Date
    }, 
    {
        timestamps : true
    }
);

const Accounts = mongoose.model('Accounts', accountsSchema, "accounts");

module.exports = Accounts;

