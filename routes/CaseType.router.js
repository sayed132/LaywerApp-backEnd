const express = require("express");
const verifyToken = require("../middlewares/verifyToken");
const { createCaseType, updateCaseTypeController, restoreCaseTypeController, softDeleteCaseTypeController, getAllCaseTypesController, getAllTrashCaseTypesController, getAllCaseTypesControllerForAdmin } = require("../controllers/CaseType.controller");

const router = express.Router();

//create new case
router.post("/create", verifyToken, createCaseType);

//update single case
router.put("/update/:id", verifyToken, updateCaseTypeController)

//update single case
router.put("/restore/:id", verifyToken, restoreCaseTypeController)

//soft delete single case
router.delete("/delete/:id", verifyToken, softDeleteCaseTypeController)

//get all case
router.get("/all", verifyToken, getAllCaseTypesController)

//get all trash case
router.get("/all-trash", verifyToken, getAllTrashCaseTypesController)

//admin
router.get("/admin/all-case-types", verifyToken, getAllCaseTypesControllerForAdmin)

module.exports = router;