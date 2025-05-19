const express = require("express");
const router = express.Router();



const controller = require("../../controllers/admin/banner.controller")

const uploadMiddwares = require('../../middlewares/admin/uploadCloud.middlewares');

router.get('/', controller.index);

router.get('/create', controller.create);

router.post('/create',
    uploadMiddwares.uploadFields,
    uploadMiddwares.uploads, 
    controller.createPost
);

router.get('/edit/:id', controller.edit);

router.post('/edit/:id', 
    uploadMiddwares.uploadFields,
    uploadMiddwares.uploads, 
    controller.editPost
);

router.delete("/delete/:id", controller.delete);


module.exports = router;