const { CustomError } = require("../middlewares/CustomError");
const CaseType = require("../models/CaseType.model");

// Create a new case type
const createCaseType = async (req, res, next) => {
    try {

        const userId = req.user.userId;

        if (!userId) {
            return res.status(404).json({
                status: "error",
                message: "your token expired or you are not login person, please login and try again",
            });
        }

        const updateData = { ...req.body };

        const newCaseType = new CaseType(updateData);
        await newCaseType.save();

        return res.status(200).json({ message: "Case Type created successfully", data: newCaseType });
    } catch (error) {
        next(error);
    }
};

// Update an existing case type
const updateCaseTypeController = async (req, res, next) => {
    const { id } = req.params;
    try {
        const userId = req.user.userId;

        if (!userId) {
            return res.status(404).json({
                status: "error",
                message: "Your token expired or you are not logged in. Please log in and try again.",
            });
        }

        const findCaseType = await CaseType.findById(id);

        if (!findCaseType) {
            throw new CustomError("Case type not found", 404);
        }

        const updates = req.body;

        const updatedCaseType = await CaseType.findByIdAndUpdate(findCaseType._id, updates, { new: true });

        if (!updatedCaseType) {
            return res.status(500).json({
                status: "error",
                message: "Failed to update the case type. Please try again later.",
            });
        }


        return res.status(200).json({
            status: "success",
            message: "Case type updated successfully",
            data: updates
        });
    } catch (error) {
        next(error);
    }
};

// Get all cases type
const getAllCaseTypesController = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        if (!userId) {
            return res.status(404).json({
                status: "error",
                message: "Your token expired or you are not logged in. Please log in and try again.",
            });
        }

        const caseTypes = await CaseType.find({ isDeleted: false, isTrash: false }).sort({ updatedAt: -1 });

        if (!caseTypes || caseTypes.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "No cases type found",
            });
        }

        return res.status(200).json({ message: "all case types get successfully", data: caseTypes });
    } catch (error) {
        next(error);
    }
};

// Get a single case by ID type
const getCaseTypeById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        if (!userId) {
            return res.status(404).json({
                status: "error",
                message: "Your token expired or you are not logged in. Please log in and try again.",
            });
        }

        const caseTypeData = await CaseType.findById(id);

        if (!caseTypeData || caseTypeData.isDeleted || caseTypeData.isTrash) {
            return res.status(404).json({
                status: "404",
                message: "your following case type id not in the database please provide the valid or existing id",
            });
        }

        return res.status(200).json({ message: "single case type get successfully", data: caseTypeData });
    } catch (error) {
        next(error);
    }
};

// Soft delete a case type
const softDeleteCaseTypeController = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        if (!userId) {
            return res.status(404).json({
                status: "error",
                message: "Your token expired or you are not logged in. Please log in and try again.",
            });
        }

        const { id } = req.params;

        const deletedCaseType = await CaseType.findByIdAndUpdate(id, { isDeleted: true, isTrash: true, isActive: false }, { new: true });

        if (!deletedCaseType) {
            throw new CustomError("Case type not found", 404);
        }

        return res.status(200).json({ message: "Case type soft-deleted successfully", deletedCount: 1 });
    } catch (error) {
        next(error);
    }
};

// restore a case type
const restoreCaseTypeController = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        if (!userId) {
            return res.status(404).json({
                status: "error",
                message: "Your token expired or you are not logged in. Please log in and try again.",
            });
        }

        const { id } = req.params;

        const restoreCaseType = await CaseType.findByIdAndUpdate(id, { isDeleted: false, isTrash: false, }, { new: true });

        if (!restoreCaseType) {
            throw new CustomError("Case type not found", 404);
        }

        return res.status(200).json({ message: "Case type restored got successfully", data: restoreCaseType });
    } catch (error) {
        next(error);
    }
};

// Get all cases in trash type
const getAllTrashCaseTypesController = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        if (!userId) {
            return res.status(404).json({
                status: "error",
                message: "Your token expired or you are not logged in. Please log in and try again.",
            });
        }

        const caseTypes = await CaseType.find({ isDeleted: true, isTrash: true });

        if (!caseTypes || caseTypes.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "No trash caseTypes found",
            });
        }

        return res.status(200).json({ message: "all trash caseTypes get successfully", data: caseTypes });
    } catch (error) {
        next(error);
    }
};


// Get all cases type
const getAllCaseTypesControllerForAdmin = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "Your token expired or you are not logged in. Please log in and try again.",
            });
        }

        // Extract pagination and query parameters
        let { page = 1, limit = 10, typeName } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);

        // Define the filter object
        const filter = { isDeleted: false, isTrash: false };
        if (typeName) {
            filter.typeName = { $regex: typeName, $options: "i" }; // Case-insensitive search
        }

        // Calculate skip and limit for pagination
        const skip = (page - 1) * limit;

        // Fetch case types with filters, sorting, and pagination
        const caseTypes = await CaseType.find(filter)
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit);

        // Count the total number of documents that match the filter
        const totalCaseTypes = await CaseType.countDocuments(filter);

        if (!caseTypes || caseTypes.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "No case types found",
            });
        }

        // Return the paginated data and meta information
        return res.status(200).json({
            status: "success",
            message: "All case types retrieved successfully",
            data: caseTypes,
            meta: {
                totalCaseTypes,
                totalPages: Math.ceil(totalCaseTypes / limit),
                currentPage: Number(page),
                limit: Number(limit),
            },
        });
    } catch (error) {
        next(error);
    }
};


module.exports = {
    createCaseType,
    updateCaseTypeController,
    getAllCaseTypesController,
    getCaseTypeById,
    softDeleteCaseTypeController,
    restoreCaseTypeController,
    getAllTrashCaseTypesController,
    getAllCaseTypesControllerForAdmin
};
