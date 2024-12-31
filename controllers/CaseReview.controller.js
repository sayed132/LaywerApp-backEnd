const CaseReview = require("../models/CaseReview.model");
const User = require("../models/User.model");


// Create a new case review
const createCaseReview = async (req, res, next) => {
    try {
        const requestBy = req.user.userId; // User creating the review
        const { case: caseId, lawyer: lawyerId, description, ratings } = req.body;

        if (!requestBy) {
            return res.status(404).json({
                status: "error",
                message: "Your token expired or you are not logged in. Please login and try again.",
            });
        }

        // Validate ratings
        if (!ratings || ratings < 1 || ratings > 5) {
            return res.status(400).json({
                status: "error",
                message: "Ratings should be between 1 and 5.",
            });
        }

        // Find the lawyer being reviewed
        const lawyer = await User.findById(lawyerId);
        if (!lawyer || lawyer.role !== "lawyer") {
            return res.status(404).json({
                status: "error",
                message: "Lawyer not found.",
            });
        }

        // Create the review
        const caseReview = new CaseReview({
            reviewBy: requestBy,
            case: caseId,
            lawyer: lawyerId,
            description: description || "", // Default to empty string if not provided
            ratings,
        });

        await caseReview.save();

        // Add the rating to the lawyer's ratings array
        lawyer.ratings.push(ratings.toString()); // Convert to string if needed
        await lawyer.save();

        return res.status(200).json({
            message: "Your review has been created successfully.",
            data: caseReview,
        });
    } catch (error) {
        next(error);
    }
};


//get review by user
const getUserReviews = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        const reviews = await CaseReview.find({ reviewBy: userId })
            .populate("lawyer", "firstName lastName workTitle ratings profilePicture _id")
            .populate("case");

        if (!reviews || reviews.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "No reviews found for the user.",
            });
        }

        return res.status(200).json({
            message: "Reviews fetched successfully.",
            data: reviews,
        });
    } catch (error) {
        next(error);
    }
};

// Get all reviews
const getAllReviews = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        if (!userId) {
            return res.status(404).json({
                status: "error",
                message: "Your token expired or you are not logged in. Please log in and try again.",
            });
        }

        const reviews = await CaseReview.find({ isDelete: false, isTrash: false }).sort({ createdAt: -1 }).populate("lawyer", "firstName lastName workTitle ratings profilePicture _id").populate("case").populate("reviewBy", "firstName lastName workTitle  profilePicture _id");

        if (!reviews || reviews.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "No review found",
            });
        }

        return res.status(200).json({ message: "all reviews get successfully", data: reviews });
    } catch (error) {
        next(error);
    }
};

// Get a single review by ID
const getReviewByIdController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        if (!userId) {
            return res.status(404).json({
                status: "error",
                message: "Your token expired or you are not logged in. Please log in and try again.",
            });
        }

        const reviewData = await CaseReview.findById(id).populate("lawyer", "firstName lastName workTitle ratings profilePicture _id").populate("case").populate("reviewBy", "firstName lastName workTitle profilePicture _id");

        if (!reviewData || reviewData.isDelete || reviewData.isTrash) {
            return res.status(404).json({
                status: "404",
                message: "your following review id not in the database please provide the valid or existing id",
            });
        }

        return res.status(200).json({ message: "single review get successfully", data: reviewData });
    } catch (error) {
        next(error);
    }
};

// Soft delete a review
const softDeleteReviewController = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        if (!userId) {
            return res.status(404).json({
                status: "error",
                message: "Your token expired or you are not logged in. Please log in and try again.",
            });
        }

        const { id } = req.params;

        const deletedReview = await CaseReview.findByIdAndUpdate(id, { isDelete: true, isTrash: true, isActive: false }, { new: true });

        if (!deletedReview) {
            throw new CustomError("Review not found", 404);
        }

        return res.status(200).json({ message: "Review soft-deleted successfully", deletedCount: 1 });
    } catch (error) {
        next(error);
    }
};


module.exports = {
    createCaseReview,
    getUserReviews,
    getAllReviews,
    getReviewByIdController,
    softDeleteReviewController
};
