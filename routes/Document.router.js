const express = require("express");
const { createDocument, getAllDocuments, getDocumentById, updateDocument, softDeleteDocument } = require("../controllers/Document.controller");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

//create new case
router.post("/create", verifyToken, createDocument);

//get all document
router.get("/all-document", verifyToken, getAllDocuments);

//get single document by id
router.get("/:id", verifyToken, getDocumentById);

//update single document
router.put("/update/:id", verifyToken, updateDocument);

//delete document
router.delete("/delete/:id", verifyToken, softDeleteDocument);


module.exports = router;