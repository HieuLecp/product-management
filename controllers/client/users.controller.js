const User= require("../../models/users.model");

const usersSocket= require("../../socket/client/users.socket");

const { use } = require("../../routes/client/user.route");

// [GET] /users/not-friend
module.exports.notFriend =  async (req, res) => {
    // socket
    usersSocket(res);
    // end socket

    const myUserId= res.locals.user.id;

    const myUser= await User.findOne({_id: myUserId});

    const requestFriend = myUser.requestFriend;
    const acceptFriend = myUser.acceptFriend;
    const friendList= myUser.friendList;

    const friendListId= friendList.map(item => item.user_id);
    // console.log(requestFriend);

    const users= await User.find({
        $and: [
            { _id: {$ne: myUserId}  },
            {  _id: { $nin: requestFriend} },
            {  _id: { $nin: acceptFriend} },
            {  _id: { $nin: friendListId} },
        ],
        status: "active",
        deleted: false
    }).select("avatar fullName");
    // console.log(users);

    res.render("client/pages/users/not-friend.pug", {
        pageTitle: "Danh sách người dùng", 
        users: users
    });
};

// [GET] /users/request
module.exports.userRequest =  async (req, res) => {

    // socket
    usersSocket(res);
    // end socket

    const myUserId= res.locals.user.id;

    const myUser= await User.findOne({
        _id: myUserId
    });

    const requestFrient= myUser.requestFriend;

    const users= await User.find({
        _id: {$in: requestFrient},
        status: "active",
        deleted: false
    }).select("id fullName avatar");

    // console.log(users);

    res.render("client/pages/users/user-request.pug", {
        pageTitle: "Lời mời đã gửi",
        users: users
    });
};

// [GET] /users/accept
module.exports.userAccept =  async (req, res) => {

    // socket
    usersSocket(res);
    // end socket

    const myUserId= res.locals.user.id;

    const myUser= await User.findOne({
        _id: myUserId
    });

    const acceptFriend= myUser.acceptFriend;

    const users= await User.find({
        _id: {$in: acceptFriend},
        status: "active",
        deleted: false
    }).select("id fullName avatar");

    res.render("client/pages/users/user-accept.pug", {
        pageTitle: "Lời mời kết bạn",
        users: users
    });
};

// [GET] /users/friends
module.exports.friends =  async (req, res) => {
    // socket
    usersSocket(res);
    // end socket

    const myUserId= res.locals.user.id;

    const myUser= await User.findOne({_id: myUserId});

    const friendList= myUser.friendList;

    const friendListId= friendList.map(item => item.user_id);

    const users= await User.find({
        _id: {$in: friendListId},
        status: "active",
        deleted: false
    }).select("id avatar fullName statusOnline");
    
    users.forEach(user => {
        const infoUser= friendList.find(item => item.user_id == user.id);
        user.roomChatId= infoUser.room_chat_id
    })

    res.render("client/pages/users/friends.pug", {
        pageTitle: "Danh sách người dùng", 
        users: users
    });
};