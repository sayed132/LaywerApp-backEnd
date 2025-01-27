const { CustomError } = require("../middlewares/CustomError");
const Case = require("../models/Case.model");
const CaseRequest = require("../models/CaseRequest.model");
const Notification = require("../models/Notification.model");

// Create a new case request
const createCaseRequest = async (req, res, next) => {
    try {

        const requestBy = req.user.userId;
        console.log(requestBy)

        if (!requestBy) {
            return res.status(404).json({
                status: "error",
                message: "your token expired or you are not login person, please login and try again",
            });
        }

        const updateData = { ...req.body, requestBy: requestBy };

        const newCaseRequest = new CaseRequest(updateData);
        await newCaseRequest.save();

        // Save notification 
        const notification = new Notification({
            user: newCaseRequest?.receivedBy,
            sendBy: requestBy,
            notificationType: "connect lawyer",
            targetId: newCaseRequest._id,
            message: `${req.user.email} send a case request.`,
        });

        console.log(updateData)

        if (
            notification.user.toString() !== notification.sendBy.toString()
        ) {
            await notification.save();

            // Emit socket event for the owner of the post
            if (global.io) {
                global.io.emit("new_notification", {
                    user: newCaseRequest?.receivedBy,
                    sendBy: requestBy,
                    notificationType: "connect lawyer",
                    targetId: newCaseRequest._id,
                    message: `${req.user.email} send a case request.`,
                });

            } else {
                console.log("Socket.io not initialized");
            }
        }

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
            notificationType: "case request",
            targetId: updatedCaseRequest._id,
            message: `${req.user.email} update your case request`,
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
                    notificationType: "case request",
                    targetId: updatedCaseRequest._id,
                    message: `${req.user.email} update your case request`,
                });

            } else {
                console.log("Socket.io not initialized");
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

// update case request
const updateCaseByLawyer = async (req, res, next) => {
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

        // Save notification 
        const notification = new Notification({
            user: updatedCaseRequest?.requestBy,
            sendBy: userId,
            notificationType: "case status",
            targetId: updatedCaseRequest._id,
            message: `${req.user.email} update your case status`,
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
                    notificationType: "case status",
                    targetId: updatedCaseRequest._id,
                    message: `${req.user.email} update your case status`,
                });

            } else {
                console.log("Socket.io not initialized");
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
            isReject: false
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
        const completedCases = cases.filter((c) => c.status === "complete").length;
        const rejectedCases = cases.filter((c) => c.isReject).length;
        const acceptCases = cases.filter((c) => c.isAccept).length;

        return res.status(200).json({
            message: "All cases status fetched successfully",
            data: {
                totalCases,
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

//---------------------admin api controller--------------------//
//get all case req by admin
const getAllCasesRequestControllerByAdmin = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        if (req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only admins can access this resource.",
            });
        }
        // Extract query parameters
        const { page = 1, limit = 10, status, isAccept, isReject } = req.query;

        // Initialize filter object
        const filter = { isDelete: false, isTrash: false };

        // Add filtering conditions based on query parameters
        if (status) filter.status = status;
        if (typeof isAccept !== "undefined") filter.isAccept = isAccept === "true"; // Convert to boolean
        if (typeof isReject !== "undefined") filter.isReject = isReject === "true"; // Convert to boolean

        // Calculate pagination values
        const skip = (page - 1) * limit;

        // Fetch cases with filtering, sorting, pagination, and population
        const cases = await CaseRequest.find(filter)
            .sort({ createdAt: -1 }) // Sort by creation date in descending order
            .skip(skip) // Skip for pagination
            .limit(Number(limit)) // Limit number of results per page
            .populate("requestBy", "firstName lastName workTitle _id profilePicture email")
            .populate("case")
            .populate("receivedBy", "firstName lastName workTitle ratings profilePicture _id email");

        // Count total cases matching the filter
        const totalCases = await CaseRequest.countDocuments(filter);

        if (!cases || cases.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "No case requests found",
            });
        }

        // Return the data along with pagination meta info
        return res.status(200).json({
            status: "success",
            message: "All case requests retrieved successfully",
            data: cases,
            meta: {
                totalCases,
                totalPages: Math.ceil(totalCases / limit),
                currentPage: Number(page),
                limit: Number(limit),
            },
        });
    } catch (error) {
        next(error);
    }
};

//get single case req by admin
const getSingleCaseReqByAdmin = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        if (req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only admins can access this resource.",
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
    getAllCasesStatusFromLawyer,
    updateCaseByLawyer,
    getAllCasesRequestControllerByAdmin,
    getSingleCaseReqByAdmin,
};
