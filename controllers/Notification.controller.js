const Notification = require("../models/Notification.model");
const NotificationModel = require("../models/NotificationRead.model");

const getFollowNotifications = async (req, res, next) => {
  const userId = req.user.userId;
  try {
console.log(userId)
    const notifications = await Notification.find({ user: userId , isDelete: false})
      .populate("sendBy", "email firstName _id profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json({message:"get all my notification fetch successfully", data: notifications });
  } catch (error) {
    next(error);
  }
};

const getSavedNotifications = async (req, res, next) => {
  const userId = req.user.userId;
  // const {userId} = req.body;
  try {
    // Find notifications for the specified user and populate the 'followingUser' field with user data
    const notifications = await NotificationModel.find({ user: userId , isDelete: false})
      .sort({ createdAt: -1 });

    res.status(200).json({ notifications });
  } catch (error) {
    next(error);
  }
};

const saveNotificationFromSocket = async (req, res) => {
  try {
    const notificationData = req.body;

    // Create and save the new notification
    const notification = new NotificationModel(notificationData);
    await notification.save();

    res.status(201).json(notification);
  } catch (error) {
    console.log("Failed to save notification:", error);
    res.status(500).json({ message: "Failed to save notification", error });
  }
};

const deleteNotificationsOnClick = async (req, res) => {
  const  userId  = req.user.userId;;
  // const { userId } = req.body;

  try {
    // Update all unread notifications to read
    await NotificationModel.updateMany(
      { user: userId, read: false },
      { $set: { read: true } }
    );

    await Notification.updateMany(
      { user: userId, read: false },
      { $set: { read: true } }
    );

    // Delete all notifications that are already read
    await NotificationModel.deleteMany({ user: userId, read: true });

    // Fetch updated notifications
    const updatedNotifications = await NotificationModel.find({ user: userId }).sort(
      { createdAt: -1 }
    );

    res.json({ updatedNotifications });
  } catch (error) {
    console.log("Error updating and deleting notifications:", error);
    res
      .status(500)
      .json({ error: "Failed to update and delete notifications" });
  }
};

// Soft Delete Notification
const softDeleteNotification = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId; // Logged-in user's ID

        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "Unauthorized access. Please log in and try again.",
            });
        }

        const notification = await Notification.findOneAndUpdate(
            { _id: id, user: userId, isDelete: false },
            { isDelete: true, isTrash: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ status: "error", message: "Notification not found or access denied" });
        }

        return res.status(200).json({ message: "Notification soft deleted successfully", status: true , deletedCount: 1});
    } catch (error) {
        next(error);
    }
};


// mark as read notification
const markAsReadNotification = async (req, res, next) => {
  try {
      const { id } = req.params;
      const userId = req.user.userId; // Logged-in user's ID

      if (!userId) {
          return res.status(401).json({
              status: "error",
              message: "Unauthorized access. Please log in and try again.",
          });
      }

      const notification = await Notification.findOneAndUpdate(
          { _id: id, user: userId, isDelete: false },
          { markAsRead: true },
          { new: true }
      );

      if (!notification) {
          return res.status(404).json({ status: "error", message: "Notification not found or access denied" });
      }

      return res.status(200).json({ message: "Notification mark as read successfully", status: true ,});
  } catch (error) {
      next(error);
  }
};



module.exports = {
  getFollowNotifications,
  saveNotificationFromSocket,
  deleteNotificationsOnClick,
  getSavedNotifications,
  softDeleteNotification,
  markAsReadNotification
};