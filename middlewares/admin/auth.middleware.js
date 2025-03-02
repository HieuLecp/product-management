const systemConfig = require("../../config/system");
const Accounts= require("../../models/accounts.model");
const Roles= require("../../models/roles.model");
const { use } = require("../../routes/admin/auth.route");


module.exports.requireAuth= async (req, res, next) => {

    // console.log(req.cookies.token);

    if(!req.cookies.token){
        res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }else{
        const user= await Accounts.findOne({
            token: req.cookies.token
        }).select("-password");
        if(!user){
            res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
        }else{
            const role= await Roles.findOne({
                _id: user.role_id
            }).select("title permissions");

            res.locals.user= user;
            res.locals.role= role;

            // console.log(user);
            next();
        };
        
    };
    
}