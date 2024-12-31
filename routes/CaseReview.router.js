const express = require("express");
const verifyToken = require("../middlewares/verifyToken");
const { createCaseReview, getUserReviews, getAllReviews, getReviewByIdController, softDeleteReviewController } = require("../controllers/CaseReview.controller");

const router = express.Router();

//create new case review
router.post("/create", verifyToken, createCaseReview);

//get my review
router.get("/my-reviews", verifyToken, getUserReviews);

//create new case review
router.get("/all", verifyToken, getAllReviews);

//create new case review
router.get("/:id", verifyToken, getReviewByIdController);

//create new case review
router.delete("/:id", verifyToken, softDeleteReviewController);


module.exports = router;