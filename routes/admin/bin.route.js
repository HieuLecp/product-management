const express = require("express");
const router = express.Router();

const controller = require("../../controllers/admin/bin.controller");

router.get("/", controller.index);

router.patch("/restore/:id", controller.restoreItem);

router.patch("/change-status/:status/:id", controller.changeStatus);

router.patch("/change-multi", controller.changeMulti);

module.exports = router;