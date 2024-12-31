const { CustomError } = require("../middlewares/CustomError");
const CaseRequest = require("../models/CaseRequest.model");

// Create a new case
const createCaseRequest = async (req, res, next) => {
    try {

        const requestBy = req.user.userId;

        if (!requestBy) {
            return res.status(404).json({
                status: "error",
                message: "your token expired or you are not login person, please login and try again",
            });
        }

        const updateData = { ...req.body, requestBy: requestBy };

        const newCaseRequest = new CaseRequest(updateData);
        await newCaseRequest.save();

        return res.status(200).json({ message: "Case Request send successfully", data: newCaseRequest });
    } catch (error) {
        next(error);
    }
};

// Update an existing case
const updateCaseController = async (req, res, next) => {
    const { caseId } = req.params;
    try {
        const userId = req.user.userId;

        if (!userId) {
            return res.status(404).json({
                status: "error",
                message: "Your token expired or you are not logged in. Please log in and try again.",
            });
        }

        const findCase = await Case.findById(caseId);

        if (!findCase) {
            throw new CustomError("Case not found", 404);
        }

        const updates = req.body;

        const updatedCase = await Case.findByIdAndUpdate(findCase._id, updates, { new: true });

        if (!updatedCase) {
            return res.status(500).json({
                status: "error",
                message: "Failed to update the case. Please try again later.",
            });
        }

        const logReminderData = `${req.user?.email} active or reminder case. 
 updateData: ${JSON.stringify(updatedCase)}`;

        // Check if a reminder already exists for the case
        const existingReminder = await Reminder.findOne({ target: findCase._id });

        if (existingReminder) {
            // Update the existing reminder, ensuring all fields are properly updated
            existingReminder.message = `${userId} active or reminder case`;
            existingReminder.targetModel = "Case";
            existingReminder.reminderType = updatedCase.caseType;
            existingReminder.targetUser = updatedCase.createdBy;
            existingReminder.reminderBy = userId;
            existingReminder.additionalData = logReminderData;

            // Ensure the deadline is updated
            existingReminder.deadline = updates.deadline || updatedCase.deadline;

            // Ensure the reminder title is updated
            existingReminder.reminderTitle = updates.caseTitle || updatedCase.caseTitle;
            existingReminder.status = updates.status || updatedCase.status;

            await existingReminder.save();
        } else {
            // Create a new reminder
            await Reminder.create({
                message: `${userId} active or reminder case`,
                targetModel: "Case",
                reminderType: updatedCase?.caseType,
                target: updatedCase?._id,
                targetUser: updatedCase?.createdBy,
                reminderBy: userId,
                additionalData: logReminderData,
                deadline: updatedCase?.deadline,
                status: updatedCase?.status,
                reminderTitle: updatedCase?.caseTitle
            });
        }

        // Save notification 
        const notification = new Notification({
            user: updatedCase?.createdBy,
            sendBy: userId,
            notificationType: "case",
            targetId: updatedCase._id,
            message: `${req.user.email} updated your case.`,
        });

        if (
            notification.user.toString() !== notification.sendBy.toString()
        ) {
            await notification.save();

            // Emit socket event for the owner of the post
            if (global.io) {
                global.io.emit("new_notification", {
                    user: updatedCase?.createdBy,
                    sendBy: userId,
                    notificationType: "case",
                    targetId: updatedCase._id,
                    message: `${req.user.email} updated your case using socket.`,
                });
                console.log(
                    `New notification for case owner: ${updatedCase.createdBy}, message: ${notification.message}`
                );
            } else {
                console.error("Socket.io not initialized");
            }
        }


        return res.status(200).json({
            status: "success",
            message: "Case updated successfully",
            data: updates
        });
    } catch (error) {
        next(error);
    }
};

// Get all cases
const getAllCasesController = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        if (!userId) {
            return res.status(404).json({
                status: "error",
                message: "Your token expired or you are not logged in. Please log in and try again.",
            });
        }

        const cases = await Case.find({ isDelete: false, isTrash: false }).sort({ createdAt: -1 });

        if (!cases || cases.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "No cases found",
            });
        }

        return res.status(200).json({ message: "all cases get successfully", data: cases });
    } catch (error) {
        next(error);
    }
};

//get user all case
const getAllCasesFromUser = async (req, res, next) => {
    try {
        const userId = req.user.userId; // Get logged-in user's ID from the request

        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "Unauthorized access. Please log in and try again.",
            });
        }

        // Check for isActive parameter in the query
        const { isActive } = req.query;

        // Build the query dynamically
        const query = { createdBy: userId, isDelete: false, isTrash: false };
        if (isActive !== undefined) {
            query.isActive = isActive === "true"; // Convert string "true"/"false" to boolean
        }

        // Fetch cases based on the query
        const cases = await Case.find(query).sort({ updatedAt: -1 });

        if (!cases || cases.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "No cases found",
            });
        }

        // Calculate statistics
        const totalCases = cases.length;
        const activeCases = cases.filter((c) => c.isActive).length;
        const inactiveCases = cases.filter((c) => !c.isActive).length;
        const completedCases = cases.filter((c) => c.status === "complete").length;

        return res.status(200).json({
            message: "All cases fetched successfully",
            data: cases,
            stats: {
                totalCases,
                activeCases,
                inactiveCases,
                completedCases,
            },
        });
    } catch (error) {
        next(error);
    }
};

//get user case status
const getAllCasesStatusFromUser = async (req, res, next) => {
    try {
        const userId = req.user.userId; // Get logged-in user's ID from the request

        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "Unauthorized access. Please log in and try again.",
            });
        }



        // Fetch all cases for the user
        const cases = await Case.find({ createdBy: userId, isDelete: false, isTrash: false });

        if (!cases || cases.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "No cases found",
            });
        }

        // console.log(cases)
        // return

        // Calculate statistics
        const totalCases = cases?.length;
        const activeCases = cases?.filter((c) => c?.isActive).length;
        const inactiveCases = cases?.filter((c) => !c?.isActive).length;
        const completedCases = cases?.filter((c) => c?.status === "complete").length;

        return res.status(200).json({
            message: "All cases status fetched successfully",
            data: {
                totalCases,
                activeCases,
                inactiveCases,
                completedCases,
            },
        });
    } catch (error) {
        next(error);
    }
};

// Get a single case by ID
const getCaseByIdController = async (req, res, next) => {
    try {
        const { caseId } = req.params;
        const userId = req.user.userId;

        if (!userId) {
            return res.status(404).json({
                status: "error",
                message: "Your token expired or you are not logged in. Please log in and try again.",
            });
        }

        const caseData = await Case.findById(caseId,);

        if (!caseData || caseData.isDelete || caseData.isTrash) {
            return res.status(404).json({
                status: "404",
                message: "your following case id not in the database please provide the valid or existing id",
            });
        }

        return res.status(200).json({ message: "single case get successfully", data: caseData });
    } catch (error) {
        next(error);
    }
};

// Soft delete a case
const softDeleteCaseController = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        if (!userId) {
            return res.status(404).json({
                status: "error",
                message: "Your token expired or you are not logged in. Please log in and try again.",
            });
        }

        const { caseId } = req.params;

        const deletedCase = await Case.findByIdAndUpdate(caseId, { isDelete: true, isTrash: true, isActive: false }, { new: true });

        if (!deletedCase) {
            throw new CustomError("Case not found", 404);
        }

        return res.status(200).json({ message: "Case soft-deleted successfully", deletedCount: 1 });
    } catch (error) {
        next(error);
    }
};

// restore a case
const restoreCaseController = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        if (!userId) {
            return res.status(404).json({
                status: "error",
                message: "Your token expired or you are not logged in. Please log in and try again.",
            });
        }

        const { caseId } = req.params;

        const restoreCase = await Case.findByIdAndUpdate(caseId, { isDelete: false, isTrash: false, }, { new: true });

        if (!restoreCase) {
            throw new CustomError("Case not found", 404);
        }

        return res.status(200).json({ message: "Case restored got successfully", data: restoreCase });
    } catch (error) {
        next(error);
    }
};

// Get all cases in trash
const getAllTrashCasesController = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        if (!userId) {
            return res.status(404).json({
                status: "error",
                message: "Your token expired or you are not logged in. Please log in and try again.",
            });
        }

        const cases = await Case.find({ isDelete: true, isTrash: true });

        if (!cases || cases.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "No trash cases found",
            });
        }

        return res.status(200).json({ message: "all trash cases get successfully", data: cases });
    } catch (error) {
        next(error);
    }
};



module.exports = {
    createCaseRequest
};
