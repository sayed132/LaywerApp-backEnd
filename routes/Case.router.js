const express = require("express");
const verifyToken = require("../middlewares/verifyToken");
const { createCase, updateCaseController, getAllCasesController, getCaseByIdController, softDeleteCaseController, restoreCaseController, getAllTrashCasesController, getRemindersController, getUpcomingReminders, getAllCasesFromUser, getAllCasesStatusFromUser, updateCaseControllerByAdmin,} = require("../controllers/Case.controller");

const router = express.Router();

//create new case
router.post("/create", verifyToken, createCase);

//update single case
router.put("/update/:caseId", verifyToken, updateCaseController)

//update single case
router.put("/restore/:caseId", verifyToken, restoreCaseController)

//soft delete single case
router.delete("/delete/:caseId", verifyToken, softDeleteCaseController)

//get all user case
router.get("/myCases", verifyToken, getAllCasesFromUser)

//get all user case
router.get("/case-status", verifyToken, getAllCasesStatusFromUser)

//get all trash case
router.get("/all-trash", verifyToken, getAllTrashCasesController)

//get all reminder case
router.get("/all-reminder", verifyToken, getRemindersController)

//get all reminder case
router.get("/upcoming-reminder", verifyToken, getUpcomingReminders)

//get single case by id
router.get("/:caseId", verifyToken, getCaseByIdController)

//--------------------admin route-------------------------//
//get all case
router.get("/admin/all-case", verifyToken, getAllCasesController)

//update single case by admin
router.put("/admin/update/:caseId", verifyToken, updateCaseControllerByAdmin)

module.exports = router;