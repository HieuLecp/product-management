const SettingGeneral= require("../../models/setting-general.model");


module.exports.settingGeneral= async (req, res, next) => {

    // console.log(req.cookies.token);

    const settingGeneral= await SettingGeneral.findOne({});

    res.locals.settingGeneral= settingGeneral;

    next();
}