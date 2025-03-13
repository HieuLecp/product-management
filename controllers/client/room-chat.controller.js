const RoomChat= require("../../models/room-chat.model");
const User= require("../../models/users.model");

const chatSocket  = require("../../socket/client/chat.socket");

// [GET] /rooms-chat
module.exports.index= async (req, res) => {
   

    res.render("client/pages/rooms-chat/index", {
        pageTitle: "Chat",
    })
}

// [GET] /rooms-chat/create
module.exports.create= async (req, res) => {

    const friendList= res.locals.user.friendList;
    console.log(friendList);

    for(const friend of friendList){
        const infoFriend= await User.findOne({
            _id: friend.user_id
        }).select("avatar fullName")

        friend.infoFriend= infoFriend;
    }

    res.render("client/pages/rooms-chat/create", {
        pageTitle: "Chat",
        friendList: friendList
    })
}

// [POST] /roomChat/create
module.exports.createPost= async (req, res) => {
    const title= req.body.title;
    const usersId= req.body.usersId
    const myUserId= res.locals.user.id;

    const dataChat= {
        title: title,
        typeRoom: "group",
        users: []
    }

    usersId.forEach(userId => {
        dataChat.users.push({
            user_id: userId,
            role: "user"
        });
    });

    dataChat.users.push({
        user_id: myUserId,
        role: "superAdmin"
    });

    console.log(dataChat);
    const room= new RoomChat(dataChat);
    await room.save();

    res.redirect(`/chat/${room.id}`);
}