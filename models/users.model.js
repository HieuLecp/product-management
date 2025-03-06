const mongoose= require('mongoose')

const generate= require("../helpers/generate");

const usersSchema = new mongoose.Schema(
    {
        userName: String,
        fullName : String,
        password: String,
        email: String,
        tokenUser: {
            type: String,
            default: generate.generateRandomString(20)
        },
        phone: String,
        avatar: String,
        status: {
            type: String,
            default: "active"
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

const User = mongoose.model('User', usersSchema, "users");

module.exports = User;

