const express = require("express");
const router = express.Router();
const multer  = require('multer');

const upload = multer();


const controller = require("../../controllers/admin/product-category.controller");
const validate = require("../../validates/admin/product-category.validate");
const uploadCloud = require("../../middlewares/admin/uploadCloud.middlewares");


router.get("/", controller.index);

router.get("/create", controller.create);

router.post(
    "/create", 
    upload.single('thumbnail'),
    uploadCloud.upload,
    validate.createPost,
    controller.createCategory
);

router.get("/edit/:id", controller.edit);

router.patch(
    "/edit/:id",
    upload.single('thumbnail'),
    uploadCloud.upload,
    validate.createPost,
    controller.editItem
);

router.delete("/delete/:id", controller.deleteItem);

router.get("/bin", controller.bin);

router.patch("/bin/restore/:id", controller.restoreItem)

router.delete("/bin/delete/:id", controller.deleteItemBin);

module.exports = router; 