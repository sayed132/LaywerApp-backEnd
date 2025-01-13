const express = require("express");
const verifyToken = require("../middlewares/verifyToken");
const { createCaseRequest, acceptOrRejectCaseRequest, getAllCasesRequestToLawyer, getCaseRequestByIdController, getAllCasesRequestController, getAllCasesRequestToUser, getAllAcceptCasesRequestToLawyer, getAllCasesStatusFromLawyer } = require("../controllers/CaseRequest.controller");

const router = express.Router();

//send case req from user
router.post("/create", verifyToken, createCaseRequest);

//accept r rejected case
router.put("/accept/:id", verifyToken, acceptOrRejectCaseRequest);

//get reg case by lawyer
router.get("/lawyer/all", verifyToken, getAllCasesRequestToLawyer);

//get all accept case by lawyer
router.get("/lawyer/all-accept", verifyToken, getAllAcceptCasesRequestToLawyer);

//get case req by user
router.get("/user/all", verifyToken, getAllCasesRequestToUser);

//get all case request
router.get("/all", verifyToken, getAllCasesRequestController);

//get single case request
router.get("/:id", verifyToken, getCaseRequestByIdController);

//get case status from lawyer
router.get("/case-status", verifyToken, getAllCasesStatusFromLawyer);


module.exports = router;