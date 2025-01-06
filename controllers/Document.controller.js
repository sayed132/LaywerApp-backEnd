const path = require("path");

const Document = require("../models/Document.model");
const Case = require("../models/Case.model");

const createDocument = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "Unauthorized access. Please log in and try again.",
            });
        }

        const caseId = req.body.case;
        const filePath = req.body.filePath

        // Validate caseId and filePath
        if (!caseId || !filePath) {
            return res.status(400).json({
                status: "error",
                message: "Case ID and file path are required.",
            });
        }

        // Extract file extension from filePath
        const fileExt = path.extname(filePath);

        // Create the document
        const newDocument = new Document({
            user: userId,
            case: caseId,
            filePath,
            fileExt,
        });

        await newDocument.save();

        // Find the associated case and update its caseFiles
        const updatedCase = await Case.findByIdAndUpdate(
            caseId,
            {
                $push: { caseFiles: { path: filePath } },
            },
            { new: true }
        );

        if (!updatedCase) {
            return res.status(404).json({
                status: "error",
                message: "Case not found.",
            });
        }

        return res.status(200).json({
            message: "Document uploaded and case updated successfully.",
            data: newDocument,
        });
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
        const userId = req.user.userId;

        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "Unauthorized access. Please log in and try again.",
            });
        }

        const { filePath, case: caseId } = req.body;

        const document = await Document.findOne({ _id: id, user: userId, isDelete: false });

        if (!document) {
            return res.status(404).json({ status: "error", message: "Document not found or access denied" });
        }

        const oldFilePath = document.filePath;

        // Update the document
        document.filePath = filePath || document.filePath;
        const updatedDocument = await document.save();

        if (filePath && caseId) {
            // Update the Case model's caseFiles
            await Case.findByIdAndUpdate(
                caseId,
                {
                    $pull: { caseFiles: { path: oldFilePath } }, // Remove old filePath
                    $push: { caseFiles: { path: filePath } }, // Add new filePath
                },
                { new: true }
            );
        }

        return res.status(200).json({ message: "Document updated successfully", data: updatedDocument });
    } catch (error) {
        next(error);
    }
};


// Soft Delete Document
const softDeleteDocument = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "Unauthorized access. Please log in and try again.",
            });
        }

        const document = await Document.findOneAndUpdate(
            { _id: id, user: userId, isDelete: false },
            { isDelete: true, isTrash: true },
            { new: true }
        );

        if (!document) {
            return res.status(404).json({ status: "error", message: "Document not found or access denied" });
        }

        const { case: caseId, filePath } = document;

        if (caseId && filePath) {
            // Remove the document's filePath from the Case model's caseFiles
            await Case.findByIdAndUpdate(
                caseId,
                { $pull: { caseFiles: { path: filePath } } },
                { new: true }
            );
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
