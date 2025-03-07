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

module.exports.loginPost= (req, res, next) => {
    if(!req.body.userName){
        req.flash("error", "Vui lòng nhập tên đăng nhập!");
        res.redirect("back");
        return;
    }
    if(!req.body.password){
        req.flash("error", "Vui lòng nhập Mật khẩu!");
        res.redirect("back");
        return;
    }
    
    next();
};

module.exports.forgotPasswordPost= (req, res, next) => {
    if(!req.body.email){
        req.flash("error", "Vui lòng nhập Email!");
        res.redirect("back");
        return;
    }
    
    next();
};

module.exports.resetPasswordPost= (req, res, next) => {
    if(!req.body.password){
        req.flash("error", "Vui lòng nhập mật khẩu");
        res.redirect("back");
        return;
    }
    if(!req.body.confirmPassword){
        req.flash("error", "Vui lòng xác nhận mật khẩu");
        res.redirect("back");
        return;
    }
    if(req.body.password != req.body.confirmPassword){
        req.flash("error", "Mật khẩu không trùng khớp");
        res.redirect("back");
        return;
    }
    
    next();
};

module.exports.editPasswordPost= async (req, res, next) => {
    if(!req.body.password){
        req.flash("error", "Vui lòng nhập mật khẩu cũ");
        res.redirect("back");
        return;
    }
    if(!req.body.newPassword){
        req.flash("error", "Vui lòng nhập mật khẩu mới");
        res.redirect("back");
        return;
    }
    if(!req.body.confirmPassword){
        req.flash("error", "Vui lòng xác nhận mật khẩu");
        res.redirect("back");
        return;
    }
    if(req.body.newPassword != req.body.confirmPassword){
        req.flash("error", "Mật khẩu không trùng khớp");
        res.redirect("back");
        return;
    }
    
    next();
};