const User= require("../../models/users.model");
const { use } = require("../../routes/client/user.route");

module.exports.infoUser= async (req, res, next) => {

    if(req.cookies.tokenUser){
        const user= await User.findOne({
            tokenUser: req.cookies.tokenUser,
            deleted: false
        }).select("-password");

        if(user){
            res.locals.user= user;
        }
    }

    next();
};

