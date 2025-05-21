const express = require("express");
const router = express.Router();
const multer  = require('multer');

const upload = multer();


const controller = require("../../controllers/admin/user.controller");
const validate= require("../../validates/admin/account-validate")
const uploadCloud = require("../../middlewares/admin/uploadCloud.middlewares");

router.get('/', controller.index);

router.patch("/change-status/:status/:id", controller.changeStatus);

module.exports = router;