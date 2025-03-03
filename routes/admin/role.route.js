const express = require("express");
const router = express.Router();

const controller = require("../../controllers/admin/role.controller")

router.get('/', controller.index);

router.get('/create', controller.create);

router.post('/create', controller.createRole);

router.get('/edit/:id', controller.edit);

router.patch('/edit/:id', controller.editRole);

router.get('/permissions', controller.permissions);

router.patch('/permissions', controller.permissionsPatch);

router.delete("/delete/:id", controller.deleteItem);

router.get("/bin", controller.bin);

router.patch("/bin/restore/:id", controller.restoreItem);

router.delete("/bin/delete/:id", controller.deleteItemBin);

module.exports = router;