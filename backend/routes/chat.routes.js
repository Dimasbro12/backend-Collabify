const express = require("express");
const { authUserMiddleware } = require("../middlewares/auth.middleware");
const { accessChat, getChats, createGroupChat, renameGroup, addToGroup, removeFromGroup, joinGroup, exitGroup } = require("../controller/chat.controller");

const router = express.Router();

router.route("/").post(authUserMiddleware, accessChat);
router.route("/").get(authUserMiddleware, getChats);
router.route("/group").post(authUserMiddleware, createGroupChat);
router.route("/rename").put(authUserMiddleware, renameGroup);
router.route("/group/user/add").put(authUserMiddleware, addToGroup);
router.route("/group/user/remove").put(authUserMiddleware, removeFromGroup);
router.route("/group/user/join").put(authUserMiddleware, joinGroup);
router.route("/group/user/exit").put(authUserMiddleware, exitGroup);

module.exports = router;
