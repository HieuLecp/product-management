const Chat= require("../../models/chat.model");
const User= require("../../models/users.model");

const chatSocket  = require("../../socket/client/chat.socket");

// [GET] /chat?:roomChatId
module.exports.index= async (req, res) => {
    const roomChatId= req.params.roomChatId;
    // console.log(roomChatId);

    // socketIo
        chatSocket(req, res);
    // end socketIo

    const chats= await Chat.find({
        room_chat_id: roomChatId,
        deleted: false
    })

    for(const chat of chats){
        const infoUser= await User.findOne({
            _id: chat.user_id
        }).select("fullName");
        // console.log(infoUser);

        chat.infoUser= infoUser;
    }

    res.render("client/pages/chat/index", {
        pageTitle: "Chat",
        chats: chats
    })
}