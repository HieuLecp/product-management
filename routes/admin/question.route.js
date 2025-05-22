const express = require("express");
const router = express.Router();

const controller = require("../../controllers/admin/question.controller")

router.get('/', controller.index);

router.post('/answer/:id', controller.answer);

module.exports = router;