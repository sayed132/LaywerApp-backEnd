const mongoose = require("mongoose");

const notificationModelSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    // required: true
  },
  sendBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  notificationType: {
    type: String,
    // enum: [
    //   "follow",
    //   "post",
    //   "comment",
    //   "sharePost",
    //   "reply",
    //   "like",
    //   "mention_post",
    // ],
    // required: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const NotificationModel = mongoose.model(
  "NotificationModel",
  notificationModelSchema
);

module.exports = NotificationModel;