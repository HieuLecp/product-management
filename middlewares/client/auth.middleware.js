const User= require("../../models/users.model");


module.exports.requireAuth= async (req, res, next) => {

    // console.log(req.cookies.token);

    if(!req.cookies.tokenUser){
        res.redirect(`/user/login`);
        return;
    }else{
        const user= await User.findOne({
            tokenUser: req.cookies.tokenUser
        }).select("-password");

        if(!user){
            res.redirect(`/user/login`);
            return;
        }
        
    };
    next();
}

module.exports.checkUser= async (req, res, next) => {

    // console.log(req.cookies.token);

    if(req.cookies.tokenUser){
        const user= await User.findOne({
            tokenUser: req.cookies.tokenUser
        }).select("-password");

        if(user){
            res.redirect(`/`);
            return;
        }
    }
    next();
}

// module.exports.genTokenUser= async (req, res, next) => {

//     // console.log(req.cookies.token);

//     if(req.cookies.tokenUser){
//         const user= await User.findOne({
//             tokenUser: req.cookies.tokenUser
//         }).select("-password");

//         if(user){
//             res.redirect(`/`);
//             return;
//         }
//     }
//     next();
// }

