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
        address: String,
        friendList: [
            {
                user_id: String,
                room_chat_id: String
            }
        ],
        acceptFriend: Array, //danh sách người mình dc add
        requestFriend: Array, //danh sách người mình add
        statusOnline: String,
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

