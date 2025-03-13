const Chat= require("../../models/chat.model");
const User= require("../../models/users.model");

const productHepler  = require("../../helpers/product");

// [GET] /chat
module.exports.index= async (req, res) => {
    const userId= res.locals.user.id;
    const fullName= res.locals.user.fullName;

    // socketIo
    _io.once('connection', (socket) => {
        // console.log(`Total connections: ${_io.engine.clientsCount}`);
        socket.on("client_send_message", async (content) => {
            // console.log(content);
            const chat= new Chat({
                user_id: userId,
                content: content
            });
            await chat.save();

            // Trả về client
            _io.emit("server_return_message", {
                userId: userId,
                fullName: fullName,
                content
            });

        });
        
      });
    // end socketIo

    const chats= await Chat.find({
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
};