const mongoose= require('mongoose')

const generate= require("../helpers/generate");

const roomChatSchema = new mongoose.Schema(
    {
       title: String,
       avatar: String,
       typeRoom: String,
       status: String,
       users: [
            {
                user_id: String,
                role: String,
            }
       ],
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

const RoomChat = mongoose.model('RoomChat', roomChatSchema, "rooms-chat");

module.exports = RoomChat;

