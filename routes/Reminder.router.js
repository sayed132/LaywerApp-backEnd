const express = require("express");
const verifyToken = require("../middlewares/verifyToken");
const { getRemindersForNext14DaysController, getUpcomingRemindersController } = require("../controllers/Reminder.controller");


const router = express.Router();

//get all case
router.get("/my-reminder", verifyToken, getRemindersForNext14DaysController)

//get upcoming reminder only not missing include
router.get("/upcoming", verifyToken, getUpcomingRemindersController)


module.exports = router;