const { CustomError } = require("../middlewares/CustomError");
const CaseRequest = require("../models/CaseRequest.model");
const Notification = require("../models/Notification.model");

// Create a new case request
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

// accept or reject case request by lawyer role
const acceptOrRejectCaseRequest = async (req, res, next) => {
    const { id } = req.params;
    try {
        const userId = req.user.userId;

        if (!userId) {
            return res.status(404).json({
                status: "error",
                message: "Your token expired or you are not logged in. Please log in and try again.",
            });
        }

        const findCaseRequest = await CaseRequest.findById(id);

        if (!findCaseRequest) {
            throw new CustomError("Case not found", 404);
        }

        const updates = req.body;

        const updatedCaseRequest = await CaseRequest.findByIdAndUpdate(findCaseRequest._id, updates, { new: true });

        if (!updatedCaseRequest) {
            return res.status(500).json({
                status: "error",
                message: "Failed to update the case Request. Please try again later.",
            });
        }

        // If the request is accepted, update the related Case's isActive to true
        if (updatedCaseRequest.isAccept) {
            const caseId = updatedCaseRequest.case;

            const updatedCase = await Case.findByIdAndUpdate(
                caseId,
                { isActive: true },
                { new: true }
            );

            if (!updatedCase) {
                return res.status(404).json({
                    status: "error",
                    message: "Associated case not found",
                });
            }
        }

        // Save notification 
        const notification = new Notification({
            user: updatedCaseRequest?.requestBy,
            sendBy: userId,
            notificationType: "connect lawyer",
            targetId: updatedCaseRequest._id,
            message: `${req.user.email} your connection request update.`,
        });

        if (
            notification.user.toString() !== notification.sendBy.toString()
        ) {
            await notification.save();

            // Emit socket event for the owner of the post
            if (global.io) {
                global.io.emit("new_notification", {
                    user: updatedCaseRequest?.requestBy,
                    sendBy: userId,
                    notificationType: "connect lawyer",
                    targetId: updatedCaseRequest._id,
                    message: `${req.user.email} your connection request update using socket.`,
                });

            } else {
                console.error("Socket.io not initialized");
            }
        }


        return res.status(200).json({
            status: "success",
            message: "Case request updated successfully",
            data: updates
        });
    } catch (error) {
        next(error);
    }
};

// Get all cases request by lawyer role
const getAllCasesRequestToLawyer = async (req, res, next) => {
    try {
        const userId = req.user.userId; // Get logged-in user's ID from the request

        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "Unauthorized access. Please log in and try again.",
            });
        }


        // Build the query dynamically
        const query = { receivedBy: userId, isDelete: false, isTrash: false, isAccept: false, isReject: false };

        // Fetch cases based on the query
        const cases = await CaseRequest.find(query).sort({ updatedAt: -1 }).populate("requestBy", "firstName lastName workTitle _id profilePicture email")
            .populate("case").populate("receivedBy", "firstName, lastName workTitle ratings profilePicture _id email");

        if (!cases || cases.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "No cases found",
            });
        }

        // Calculate statistics
        const totalCases = cases.length;
        const activeCases = cases.filter((c) => c.isActive).length;
        const rejectedCases = cases.filter((c) => c.isReject).length;
        const acceptCases = cases.filter((c) => c.isAccept).length;

        return res.status(200).json({
            message: "All cases request fetched successfully",
            data: cases,
            stats: {
                totalCases,
                activeCases,
                rejectedCases,
                acceptCases
            },
        });
    } catch (error) {
        next(error);
    }
};

// Get all accept cases request by lawyer role
const getAllAcceptCasesRequestToLawyer = async (req, res, next) => {
    try {
        const userId = req.user.userId; // Get logged-in user's ID from the request

        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "Unauthorized access. Please log in and try again.",
            });
        }


        // Build the query dynamically
        const query = { receivedBy: userId, isDelete: false, isTrash: false, isAccept: true, isReject: false };

        // Fetch cases based on the query
        const cases = await CaseRequest.find(query).sort({ updatedAt: -1 }).populate("requestBy", "firstName lastName workTitle _id profilePicture email")
            .populate("case").populate("receivedBy", "firstName, lastName workTitle ratings profilePicture _id email");

        if (!cases || cases.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "No cases found",
            });
        }

        // Calculate statistics
        const totalCases = cases.length;
        const activeCases = cases.filter((c) => c.isActive).length;
        const rejectedCases = cases.filter((c) => c.isReject).length;
        const acceptCases = cases.filter((c) => c.isAccept).length;

        return res.status(200).json({
            message: "All cases request fetched successfully",
            data: cases,
            stats: {
                totalCases,
                activeCases,
                rejectedCases,
                acceptCases
            },
        });
    } catch (error) {
        next(error);
    }
};

//get user case status
const getAllCasesStatusFromLawyer = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "Unauthorized access. Please log in and try again.",
            });
        }


        // Build the query dynamically
        const query = {
            receivedBy: userId,
            isDelete: false,
            isTrash: false,
            isAccept: true,
            isReject: false,
        };

        // Fetch cases with populated references
        const cases = await CaseRequest.find(query)
            .populate("case", "caseTitle caseType status isActive") // Fetch specific fields from the related `Case`
            .populate("requestBy", "name email") // Optional: Populate the requester details
            .sort({ updatedAt: -1 });

        if (!cases || cases.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "No cases found",
            });
        }

        // Calculate statistics
        const totalCases = cases.length;
        const reqCases = cases.filter((c) => c.case && !c.case.isAccept).length;
        const completedCases = cases.filter((c) => c.case && c.case.status === "complete").length;
        const rejectedCases = cases.filter((c) => c.isReject).length;
        const acceptCases = cases.filter((c) => c.isAccept).length;

        return res.status(200).json({
            message: "All cases status fetched successfully",
            data: {
                totalCases,
                reqCases,
                completedCases,
                rejectedCases,
                acceptCases,
            },
        });
    } catch (error) {
        next(error);
    }
};


// Get all cases request by user
const getAllCasesRequestToUser = async (req, res, next) => {
    try {
        const userId = req.user.userId; // Get logged-in user's ID from the request

        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "Unauthorized access. Please log in and try again.",
            });
        }


        // Build the query dynamically
        const query = { requestBy: userId, isDelete: false, isTrash: false };

        // Fetch cases based on the query
        const cases = await CaseRequest.find(query).sort({ updatedAt: -1 }).populate("requestBy", "firstName lastName workTitle _id profilePicture email")
            .populate("case").populate("receivedBy", "firstName lastName workTitle ratings profilePicture _id email");


        if (!cases || cases.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "No cases found",
            });
        }

        // Calculate statistics
        const totalCases = cases.length;
        const activeCases = cases.filter((c) => c.isActive).length;
        const rejectedCases = cases.filter((c) => c.isReject).length;
        const acceptCases = cases.filter((c) => c.isAccept).length;

        return res.status(200).json({
            message: "All cases request fetched successfully",
            data: cases,
            stats: {
                totalCases,
                activeCases,
                rejectedCases,
                acceptCases
            },
        });
    } catch (error) {
        next(error);
    }
};

// Get all cases request
const getAllCasesRequestController = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        if (!userId) {
            return res.status(404).json({
                status: "error",
                message: "Your token expired or you are not logged in. Please log in and try again.",
            });
        }

        const cases = await CaseRequest.find({ isDelete: false, isTrash: false }).sort({ createdAt: -1 }).populate("requestBy", "firstName lastName workTitle _id profilePicture email")
            .populate("case").populate("receivedBy", "firstName lastName workTitle ratings profilePicture _id email");


        if (!cases || cases.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "No cases found",
            });
        }

        return res.status(200).json({ message: "all case requests get successfully", data: cases });
    } catch (error) {
        next(error);
    }
};

// Get a single case Request by ID
const getCaseRequestByIdController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        if (!userId) {
            return res.status(404).json({
                status: "error",
                message: "Your token expired or you are not logged in. Please log in and try again.",
            });
        }

        const caseData = await CaseRequest.findById(id,).populate("requestBy", "firstName lastName workTitle _id profilePicture email")
            .populate("case").populate("receivedBy", "firstName lastName workTitle ratings profilePicture _id email");


        if (!caseData || caseData.isDelete || caseData.isTrash) {
            return res.status(404).json({
                status: "404",
                message: "your following case id not in the database please provide the valid or existing id",
            });
        }

        return res.status(200).json({ message: "single case request get successfully", data: caseData });
    } catch (error) {
        next(error);
    }
};


module.exports = {
    createCaseRequest,
    acceptOrRejectCaseRequest,
    getAllCasesRequestToLawyer,
    getAllCasesRequestController,
    getCaseRequestByIdController,
    getAllCasesRequestToUser,
    getAllAcceptCasesRequestToLawyer,
    getAllCasesStatusFromLawyer
};
