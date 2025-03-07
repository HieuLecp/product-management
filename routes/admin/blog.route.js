const express = require("express");
const router = express.Router();
const multer  = require('multer');

const upload = multer();

const controller = require("../../controllers/admin/blog.controller");
const uploadCloud = require("../../middlewares/admin/uploadCloud.middlewares");

router.get('/', controller.index);

router.get("/create", controller.create);

router.post(
    "/create", 
    upload.single('thumbnail'),
    uploadCloud.upload,
    controller.createPost
);

router.get("/edit/:id", controller.edit);

router.patch(
    "/edit/:id",
    upload.single('thumbnail'),
    uploadCloud.upload,
    controller.editPost
);

module.exports = router;