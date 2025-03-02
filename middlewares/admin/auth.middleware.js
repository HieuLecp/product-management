const systemConfig = require("../../config/system");
const Accounts= require("../../models/accounts.model");
const { use } = require("../../routes/admin/auth.route");


module.exports.requireAuth= async (req, res, next) => {

    // console.log(req.cookies.token);

    if(!req.cookies.token){
        res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }else{
        const user= await Accounts.findOne({
            token: req.cookies.token
        })
        if(!user){
            res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
        }else{

            // console.log(user);
            next();
        }
        
    }
    
}