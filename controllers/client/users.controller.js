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
    // console.log(requestFriend);

    const users= await User.find({
        $and: [
            { _id: {$ne: myUserId}  },
            {  _id: { $nin: requestFriend} },
            {  _id: { $nin: acceptFriend} },
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