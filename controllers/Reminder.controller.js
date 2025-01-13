const Reminder = require("../models/Reminder.model");

const getRemindersForNext14DaysController = async (req, res, next) => {
    try {
        const { userId, role } = req.user;

        if (!userId || !role) {
            return res.status(404).json({
                status: "error",
                message: "Your token expired or you are not logged in. Please log in and try again.",
            });
        }

        // Get today's date and date 14 days later
        const today = new Date();
        const fourteenDaysLater = new Date(today);
        fourteenDaysLater.setDate(today.getDate() + 14);

        // Extract the limit parameter from query (if provided). If no limit, set it to null (no limit)
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : null;

        // Define query conditions based on role
        const queryConditions = {
            isDeleted: false,
            deadline: { $exists: true },
            $or: [
                { deadline: { $gte: today, $lte: fourteenDaysLater }, status: { $ne: "complete" } }, // upcoming deadlines
                { deadline: { $lt: today }, status: { $ne: "complete" } }, // missing deadlines
            ],
        };

        // Adjust query based on user role
        if (role === "lawyer") {
            queryConditions.reminderBy = userId;
        } else if (role === "user") {
            queryConditions.targetUser = userId;
        }

        // Query to get reminders
        const remindersDataQuery = Reminder.find(queryConditions).populate({
            path: "reminderBy targetUser",
            select: "firstName lastName _id profilePicture email", // Select only specific fields
        });

        // Apply limit if provided
        if (limit) {
            remindersDataQuery.limit(limit);
        }

        const remindersData = await remindersDataQuery;

        const reminders = {
            reminder: [],
            missingReminder: [],
        };

        // Categorize reminders
        remindersData.forEach((reminderItem) => {
            if (reminderItem.deadline) {
                const deadline = new Date(reminderItem.deadline);

                if (deadline >= today && deadline <= fourteenDaysLater) {
                    // If deadline is within the next 14 days
                    reminders.reminder.push(reminderItem);
                } else if (deadline < today) {
                    // If deadline passed
                    reminders.missingReminder.push(reminderItem);
                }
            }
        });

        // Return reminders in the response with date range
        return res.status(200).json({
            message: `Reminders with deadlines from ${today.toISOString().split('T')[0]} to ${fourteenDaysLater.toISOString().split('T')[0]}`,
            data: reminders,
        });
    } catch (error) {
        next(error);
    }
};


const getUpcomingRemindersController = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        if (!userId) {
            return res.status(404).json({
                status: "error",
                message: "Your token expired or you are not logged in. Please log in and try again.",
            });
        }

        // Get today's date
        const today = new Date();
        const fourteenDaysLater = new Date(today);
        fourteenDaysLater.setDate(today.getDate() + 14); // Get date 14 days later from today

        // Extract the limit parameter from query (if provided). If no limit, set it to null (no limit)
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : null;

        // Query to get upcoming reminders for the logged-in user within the next 14 days
        const upcomingRemindersDataQuery = Reminder.find({
            isDeleted: false,
            targetUser: userId, // Only fetch reminders where the targetUser matches the logged-in user
            deadline: { $gte: today, $lte: fourteenDaysLater }, // Fetch upcoming deadlines
            status: { $ne: "complete" }, // Only fetch incomplete reminders
        })
            .populate({
                path: "reminderBy targetUser",
                select: "firstName lastName _id profilePicture email", // Select only specific fields
            });

        // Apply limit if provided
        if (limit) {
            upcomingRemindersDataQuery.limit(limit);
        }

        const upcomingRemindersData = await upcomingRemindersDataQuery;

        const upcomingReminders = {
            reminder: [],
        };

        upcomingRemindersData.forEach((reminderItem) => {
            if (reminderItem.deadline) {
                const deadline = new Date(reminderItem.deadline);

                if (deadline >= today && deadline <= fourteenDaysLater) {
                    // If deadline is within the next 14 days (upcoming)
                    upcomingReminders.reminder.push(reminderItem);
                }
            }
        });

        // Return upcoming reminders in the response with date range
        return res.status(200).json({
            message: `Upcoming reminders with deadlines from ${today.toISOString().split('T')[0]} to ${fourteenDaysLater.toISOString().split('T')[0]}`,
            data: upcomingReminders,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getRemindersForNext14DaysController, getUpcomingRemindersController
};
