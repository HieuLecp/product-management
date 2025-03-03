const express = require("express");
const router = express.Router();
const multer  = require('multer');

const upload = multer();


const controller = require("../../controllers/admin/account.controller");
const validate= require("../../validates/admin/account-validate")
const uploadCloud = require("../../middlewares/admin/uploadCloud.middlewares");

router.get('/', controller.index);

router.get('/create', controller.create);

router.post('/create',
    upload.single('avatar'),
    uploadCloud.upload,
    validate.createPost,
    controller.createAccount);

router.get('/edit/:id', controller.edit);

router.patch('/edit/:id',
    upload.single('avatar'),
    uploadCloud.upload,
    validate.createPatch,
    controller.editAccount
);

router.delete("/delete/:id", controller.deleteItem);

router.get("/bin", controller.bin);

router.patch("/bin/restore/:id", controller.restoreItem);

router.delete("/bin/delete/:id", controller.deleteItemBin);

module.exports = router;