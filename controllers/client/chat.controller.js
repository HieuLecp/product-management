const Chat= require("../../models/chat.model");
const User= require("../../models/users.model");

const chatSocket  = require("../../socket/client/chat.socket");



// [GET] /chat
module.exports.index= async (req, res) => {

    // socketIo
        chatSocket(res);
    // end socketIo

    const chats= await Chat.find({
        deleted: false
    })

    for(const chat of chats){
        const infoUser= await User.findOne({
            _id: chat.user_id
        }).select("fullName");

        chat.infoUser= infoUser;
    }

    res.render("client/pages/chat/index", {
        pageTitle: "Chat",
        chats: chats
    })
};