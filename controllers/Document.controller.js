const path = require("path");

const Document = require("../models/Document.model");

// Create a new case
const createDocument = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        if (!userId) {
            return res.status(404).json({
                status: "error",
                message: "Unauthorized access. Please log in and try again.",
            });
        }

        // Extract file extension from filePath
        const filePath = req.body.filePath;
        const fileExt = filePath ? path.extname(filePath) : null;

        // Add user and fileExt to the document data
        const updateData = { ...req.body, user: userId, fileExt };

        const newDocument = new Document(updateData);
        await newDocument.save();

        return res.status(200).json({ message: "Upload A New document successfully", data: newDocument });
    } catch (error) {
        next(error);
    }
};

// Get All Documents
const getAllDocuments = async (req, res, next) => {
    try {
        const userId = req.user.userId; // Get logged-in user's ID from the request

        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "Unauthorized access. Please log in and try again.",
            });
        }

        const { search } = req.query; // Get the search term from query params, if any

        // Build the query filter
        let filter = { user: userId, isDelete: false };

        if (search) {
            // If a search term is provided, filter documents by filePath (case-insensitive)
            filter.filePath = { $regex: search, $options: 'i' }; // This will match the search term in filePath
        }

        // Fetch documents based on the filter
        const documents = await Document.find(filter).populate(
            "user",
            "name email _id profilePicture"
        ).sort({ updatedAt: -1 }).populate("case");

        return res.status(200).json({
            message: "Fetched documents successfully",
            data: documents,
        });
    } catch (error) {
        next(error);
    }
};

// Get Single Document by ID
const getDocumentById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId; // Logged-in user's ID

        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "Unauthorized access. Please log in and try again.",
            });
        }

        const document = await Document.findOne({ _id: id, user: userId, isDelete: false }).populate(
            "user",
            "name email _id profilePicture"
        );

        if (!document) {
            return res.status(404).json({ status: "error", message: "Document not found or access denied" });
        }

        return res.status(200).json({ message: "Document fetched successfully", data: document });
    } catch (error) {
        next(error);
    }
};

// Update Document
const updateDocument = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId; // Logged-in user's ID

        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "Unauthorized access. Please log in and try again.",
            });
        }

        const document = await Document.findOneAndUpdate(
            { _id: id, user: userId, isDelete: false }, // Match document ID and user ID
            { ...req.body },
            { new: true }
        );

        if (!document) {
            return res.status(404).json({ status: "error", message: "Document not found or access denied" });
        }

        return res.status(200).json({ message: "Document updated successfully", data: document });
    } catch (error) {
        next(error);
    }
};

// Soft Delete Document
const softDeleteDocument = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId; // Logged-in user's ID

        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "Unauthorized access. Please log in and try again.",
            });
        }

        const document = await Document.findOneAndUpdate(
            { _id: id, user: userId, isDelete: false }, // Match document ID and user ID
            { isDelete: true, isTrash: true },
            { new: true }
        );

        if (!document) {
            return res.status(404).json({ status: "error", message: "Document not found or access denied" });
        }

        return res.status(200).json({ message: "Document soft deleted successfully", data: document });
    } catch (error) {
        next(error);
    }
};



module.exports = {
    createDocument,
    getAllDocuments,
    getDocumentById,
    updateDocument,
    softDeleteDocument,
};
