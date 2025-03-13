const express = require("express");
const router = express.Router();

const controller = require("../../controllers/client/users.controller")

router.get('/not-friend', controller.notFriend);

router.get('/request', controller.userRequest);

router.get('/accept', controller.userAccept);

router.get('/friends', controller.friends);

module.exports = router;