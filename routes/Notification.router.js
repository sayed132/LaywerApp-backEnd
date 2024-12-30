const express = require("express");
const verifyToken = require("../middlewares/verifyToken");
const { getFollowNotifications, getSavedNotifications, saveNotificationFromSocket, deleteNotificationsOnClick, softDeleteNotification, markAsReadNotification } = require("../controllers/Notification.controller");
const router = express.Router();

router.get("/", verifyToken, getFollowNotifications);
router.get("/save-notification",verifyToken, getSavedNotifications);
router.post("/save-notification", saveNotificationFromSocket);
router.post("/mark-read-and-delete",verifyToken, deleteNotificationsOnClick);
router.delete("/delete/:id",verifyToken, softDeleteNotification);
router.put("/read/:id", verifyToken, markAsReadNotification)

module.exports = router;