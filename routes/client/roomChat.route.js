const express = require("express");
const router = express.Router();

const controller = require("../../controllers/client/room-chat.controller")

const chatMiddleware= require("../../middlewares/client/chat.middleware");

router.get('/', 
    // chatMiddleware.checkRoomChat,
    controller.index
);

router.get('/create', 
    // chatMiddleware.checkRoomChat,
    controller.create
);

router.post('/create', 
    // chatMiddleware.checkRoomChat,
    controller.createPost
);

module.exports = router;