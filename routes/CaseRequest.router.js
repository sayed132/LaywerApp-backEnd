const express = require("express");
const verifyToken = require("../middlewares/verifyToken");
const { createCaseRequest } = require("../controllers/CaseRequest.controller");

const router = express.Router();

//create new case
router.post("/create", verifyToken, createCaseRequest);


module.exports = router;