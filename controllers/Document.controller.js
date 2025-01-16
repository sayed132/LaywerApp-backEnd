const path = require("path");

const Document = require("../models/Document.model");
const Case = require("../models/Case.model");
const User = require("../models/User.model");

//create document by user
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

//create document by lawyer
const createDocumentByLawyer = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "Unauthorized access. Please log in and try again.",
            });
        }

        // Find the user and check their role
        const user = await User.findById(userId);
        if (user.role !== "lawyer") {
            return res.status(403).json({
                status: "error",
                message: "Access denied. Only lawyers can perform this action.",
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
            lawyer: userId,
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

//get all document with grouped
const getAllDocuments = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "Unauthorized access. Please log in and try again.",
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                status: "error",
                message: "User not found.",
            });
        }

        const { search } = req.query;

        let filter = { isDelete: false };

        if (user.role === "lawyer") {
            filter.lawyer = userId;
        } else {
            filter.user = userId;
        }

        if (search) {
            filter.filePath = { $regex: search, $options: 'i' };
        }

        // Fetch all documents
        const documents = await Document.find(filter).populate("case").populate("user", "name email _id profilePicture").populate("lawyer", "name email _id profilePicture").sort({ updatedAt: -1 });

        const groupedDocuments = documents.reduce((acc, doc) => {
            const caseId = doc.case._id.toString();

            if (!acc[caseId]) {
                acc[caseId] = {
                    caseDetails: doc.case,
                    documents: [],
                };
            }

            acc[caseId].documents.push(doc);

            return acc;
        }, {});

        const result = Object.values(groupedDocuments);

        return res.status(200).json({
            message: "Fetched documents successfully",
            data: result,
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

        // Find the user and check their role
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                status: "error",
                message: "User not found.",
            });
        }

        let filter = { _id: id, isDelete: false };

        if (user.role === "lawyer") {
            // If the user is a lawyer, they might have access to documents associated with cases they are working on
            filter.lawyer = userId; // Ensure that the document is associated with this lawyer
        } else {
            // If the user is not a lawyer, they can only access their own documents
            filter.user = userId; // Ensure that the document is created by this user
        }

        // Fetch the document with the modified filter
        const document = await Document.findOne(filter)
            .populate("user", "name email _id profilePicture").populate("lawyer", "name email _id profilePicture");

        if (!document) {
            return res.status(404).json({
                status: "error",
                message: "Document not found or access denied.",
            });
        }

        return res.status(200).json({
            message: "Document fetched successfully",
            data: document,
        });
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

//update document by lawyer
const updateDocumentByLawyer = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "Unauthorized access. Please log in and try again.",
            });
        }

        // Find the user and check their role
        const user = await User.findById(userId);
        if (user.role !== "lawyer") {
            return res.status(403).json({
                status: "error",
                message: "Access denied. Only lawyers can perform this action.",
            });
        }

        const { filePath, case: caseId } = req.body;

        const document = await Document.findOne({ _id: id, lawyer: userId, isDelete: false });

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

// Soft Delete Document by lawyer
const softDeleteDocumentByLawyer = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "Unauthorized access. Please log in and try again.",
            });
        }

        // Find the user and check their role
        const user = await User.findById(userId);
        if (user.role !== "lawyer") {
            return res.status(403).json({
                status: "error",
                message: "Access denied. Only lawyers can perform this action.",
            });
        }

        const document = await Document.findOneAndUpdate(
            { _id: id, lawyer: userId, isDelete: false },
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
    createDocumentByLawyer,
    updateDocumentByLawyer,
    softDeleteDocumentByLawyer
};
