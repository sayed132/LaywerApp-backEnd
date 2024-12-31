const express = require("express");
const verifyToken = require("../middlewares/verifyToken");
const { createCaseRequest, acceptOrRejectCaseRequest, getAllCasesRequestToLawyer, getCaseRequestByIdController, getAllCasesRequestController } = require("../controllers/CaseRequest.controller");

const router = express.Router();

//create new case request
router.post("/create", verifyToken, createCaseRequest);

//create new case request
router.put("/accept/:id", verifyToken, acceptOrRejectCaseRequest);

//create new case request
router.get("/lawyer/all", verifyToken, getAllCasesRequestToLawyer);

//create new case request
router.get("/all", verifyToken, getAllCasesRequestController);

//create new case request
router.get("/:id", verifyToken, getCaseRequestByIdController);


module.exports = router;