const express = require("express");
const router = express.Router();

const controller = require("../../controllers/client/chatbot.controller")

const chatMiddleware= require("../../middlewares/client/chat.middleware");

router.post('/', 
    // chatMiddleware.checkRoomChat,
    controller.index
);



module.exports = router;