const mongoose = require("mongoose");

const ReminderSchema = new mongoose.Schema({
  reminderBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  deadline: {
    type: Date,
  },
  status: {
    type: String,
    default: "pending"
},
  reminderTitle: {
    type: String,
    default: "",
  },
  message: {
    type: String,
    default: "",
  },
  reminderType: {
    type: String,
    required: true,
  },
  target: {
    type: mongoose.Types.ObjectId,
  },
  targetModel: {
    type: String,
  },
  additionalData: {
    type: String,
    default: "",
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

const Reminder = mongoose.model("Reminder", ReminderSchema);
module.exports = Reminder;