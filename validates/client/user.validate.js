module.exports.registerPost= (req, res, next) => {
    if(!req.body.userName){
        req.flash("error", "Vui lòng nhập tên đăng nhập!");
        res.redirect("back");
        return;
    }
    if(!req.body.email){
        req.flash("error", "Vui lòng nhập Email!");
        res.redirect("back");
        return;
    }
    if(!req.body.password){
        req.flash("error", "Vui lòng nhập Mật khẩu!");
        res.redirect("back");
        return;
    }
    
    next();
}

module.exports.RegisterPatch = (req, res, next) => {
    if(!req.body.userName){
        req.flash("error", "Vui lòng nhập tên đăng nhập!");
        res.redirect("back");
        return;
    }
    if(!req.body.email){
        req.flash("error", "Vui lòng nhập Email!");
        res.redirect("back");
        return;
    }
    
    next();
};