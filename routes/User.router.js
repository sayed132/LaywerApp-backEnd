const express = require("express");
const { registerController, loginController, logOutController, refetchUserController, getUserProfileController, updateUserController, uploadProfilePictureController, getLawyersController, getWishlist } = require("../controllers/User.controller");
const verifyToken = require("../middlewares/verifyToken");
const upload = require("../middlewares/Upload");

const router = express.Router();


router.post("/register", registerController);

router.post("/login", loginController)


//logout user
router.post("/logout", verifyToken, logOutController);

//refetch user information
router.get("/get-me", verifyToken, refetchUserController);

//get lawyers
router.get("/get-lawyers", verifyToken, getLawyersController);

//get wish list lawyer
router.post("/my-wishlist", verifyToken, getWishlist);

//get user profile
router.get("/profile", verifyToken, getUserProfileController)

//update user profile
router.put("/update/:userId", verifyToken, upload.single('profilePicture'), updateUserController)

//update user profile
router.put("/updateProfile/:userId", verifyToken, upload.single('profilePicture'), uploadProfilePictureController)

module.exports = router;