const express = require("express");
const { createDocument, getAllDocuments, getDocumentById, updateDocument, softDeleteDocument, createDocumentByLawyer,
    updateDocumentByLawyer,
    softDeleteDocumentByLawyer } = require("../controllers/Document.controller");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

//create new case
router.post("/create", verifyToken, createDocument);

//create new case by lawyer
router.post("/create-by-lawyer", verifyToken, createDocumentByLawyer);

//get all document
router.get("/all-document", verifyToken, getAllDocuments);

//get single document by id
router.get("/:id", verifyToken, getDocumentById);

//update single document
router.put("/update/:id", verifyToken, updateDocument);

//update single document by lawyer
router.put("/update-by-lawyer/:id", verifyToken, updateDocumentByLawyer);

//delete document 
router.delete("/delete/:id", verifyToken, softDeleteDocument);

//delete document by lawyer
router.delete("/delete-by-lawyer/:id", verifyToken, softDeleteDocumentByLawyer);


module.exports = router;