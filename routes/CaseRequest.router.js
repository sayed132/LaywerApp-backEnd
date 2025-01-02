const express = require("express");
const verifyToken = require("../middlewares/verifyToken");
const { createCaseRequest, acceptOrRejectCaseRequest, getAllCasesRequestToLawyer, getCaseRequestByIdController, getAllCasesRequestController, getAllCasesRequestToUser, getAllAcceptCasesRequestToLawyer } = require("../controllers/CaseRequest.controller");

const router = express.Router();


router.post("/create", verifyToken, createCaseRequest);


router.put("/accept/:id", verifyToken, acceptOrRejectCaseRequest);


router.get("/lawyer/all", verifyToken, getAllCasesRequestToLawyer);

router.get("/lawyer/all-accept", verifyToken, getAllAcceptCasesRequestToLawyer);

router.get("/user/all", verifyToken, getAllCasesRequestToUser);


router.get("/all", verifyToken, getAllCasesRequestController);


router.get("/:id", verifyToken, getCaseRequestByIdController);


module.exports = router;