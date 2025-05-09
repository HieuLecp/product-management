const RoomChat= require("../../models/room-chat.model");
const User= require("../../models/users.model");

// const uploadToCloudinary= require("../../helpers/uploadToCloudinary");


module.exports= async (res) => {

    _io.once('connection', (socket) => {

        // request addFriend
        socket.on("client_add_friend", async (userId) => {
            const myUserId= res.locals.user.id; //Id của người add
            // console.log(userId); //Id của người dc add
            // console.log(myUserId);

            const exitsUserAccept= await User.findOne({ //Xem người nhận có id của ng gửi chưa
                _id: userId,
                acceptFriend: myUserId
            })

            if(!exitsUserAccept){
                await User.updateOne({
                    _id: userId
                }, {
                    $push: {acceptFriend: myUserId}
                })
            }

            const exitsUserRequest= await User.findOne({ //Xem người gửi có id của ng nhận chưa
                _id: myUserId,
                requestFriend: userId
            })

            if(!exitsUserRequest){
                await User.updateOne({
                    _id: myUserId
                }, {
                    $push: {requestFriend: userId}
                })
            }

            // Lấy độ dài acceptFriend của ng nhận và trả về cho ng nhận
            const infoUserAccept= await User.findOne({
                _id: userId
            });

            const lengthAcceptFriend= infoUserAccept.acceptFriend.length;

            socket.broadcast.emit("sever_return_lengthAcceptFriend", {
                userId,
                lengthAcceptFriend: lengthAcceptFriend
            });

            // Lấy thông tin của ng gửi và trả về cho ng nhận
            const infoUserRequest= await User.findOne({
                _id: myUserId
            }).select("id avatar fullName");

            socket.broadcast.emit("sever_return_inforAcceptFriend", {
                userId: userId,
                infoUserRequest: infoUserRequest
            })
        });
        // end request addFriend

        // cancel addFriend
        socket.on("client_cancel_friend", async (userId) => {
            const myUserId= res.locals.user.id; //Id của người add
            // console.log(userId); //Id của người dc add
            // console.log(myUserId);

            const exitsUserAccept= await User.findOne({ //Xem người nhận có id của ng gửi chưa
                _id: userId,
                acceptFriend: myUserId
            })

            if(exitsUserAccept){
                await User.updateOne({
                    _id: userId
                }, {
                    $pull: {acceptFriend: myUserId}
                })
            }

            const exitsUserRequest= await User.findOne({ //Xem người gửi có id của ng nhận chưa
                _id: myUserId,
                requestFriend: userId
            })

            if(exitsUserRequest){
                await User.updateOne({
                    _id: myUserId
                }, {
                    $pull: {requestFriend: userId}
                })
            }

            // Lấy độ dài acceptFriend của ng nhận và trả về cho ng nhận
            const infoUserAccept= await User.findOne({
                _id: userId
            });

            const lengthAcceptFriend= infoUserAccept.acceptFriend.length;

            socket.broadcast.emit("sever_return_lengthAcceptFriend", {
                userId: userId,
                lengthAcceptFriend: lengthAcceptFriend
            });

            socket.broadcast.emit("sever_return_cancelAddFriend", {
                userId: userId,
                requestUserId: myUserId
            });
        });
        // end cancel addFriend

        // refuse addFriend
        socket.on("client_refuse_friend", async (userId) => {
            const myUserId= res.locals.user.id; //Id của người từ chối
            // console.log(userId); //Id của người add
            // console.log(myUserId);

            const exitsUserRequest= await User.findOne({ //Xem người add có id của ng từ chối chưa
                _id: userId,
                requestFriend: myUserId
            })

            if(exitsUserRequest){
                await User.updateOne({
                    _id: userId
                }, {
                    $pull: {requestFriend: myUserId}
                })
            }

            const exitsUserAccept= await User.findOne({ //Xem người từ chối có id của ng add chưa
                _id: myUserId,
                acceptFriend: userId
            })

            if(exitsUserAccept){
                await User.updateOne({
                    _id: myUserId
                }, {
                    $pull: {acceptFriend: userId}
                })
            }
        });
        // end refuse addFriend

        // accept addFriend
        socket.on("client_accept_friend", async (userId) => {
            const myUserId= res.locals.user.id; //Id của người chấp nhận
            // console.log(userId); //Id của người add
            // console.log(myUserId);

            const exitsUserRequest= await User.findOne({ //Xem người add có id của ng chấp nhận chưa
                _id: userId,
                requestFriend: myUserId
            })

            const exitsUserAccept= await User.findOne({ //Xem người chấp nhận có id của ng add chưa
                _id: myUserId,
                acceptFriend: userId
            })

            // tạo phòng chat
            let roomChat;
            if(exitsUserRequest && exitsUserAccept){
                roomChat= new RoomChat({
                    typeRoom: "friend",
                    users: [
                        {
                            user_id: myUserId,
                            role: "superAdmin"
                        },
                        {
                            user_id: userId,
                            role: "superAdmin"
                        }
                    ]
                });
                await roomChat.save();
            }

            // end tạo phòng chat

            if(exitsUserRequest){
                await User.updateOne({
                    _id: userId
                }, {
                    $push: {
                        friendList: {
                            user_id: myUserId,
                            room_chat_id: roomChat.id
                        }
                    },
                    $pull: {requestFriend: myUserId}
                })
            }

            if(exitsUserAccept){
                await User.updateOne({
                    _id: myUserId
                }, {
                    $push: {
                        friendList: {
                            user_id: userId,
                            room_chat_id: roomChat.id
                        }
                    },
                    $pull: {acceptFriend: userId}
                })
            }
        });
        // end accept addFriend

      });
}


