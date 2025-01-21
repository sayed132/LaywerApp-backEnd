const bcrypt = require("bcrypt");
const User = require("../models/User.model");
const { generateToken } = require("../utilities/token");
const { CustomError } = require("../middlewares/CustomError");
require("dotenv").config();
const Token = require("../models/Token.model");

// register user
const registerController = async (req, res) => {
    const { email, password, firstName, lastName, role } = req.body;

    if (!email || !password || !firstName || !lastName || !role) {
        return res.status(400).json({ message: "All required fields must be filled" });
    }

    try {
        // Check if the user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "User already exists" });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create and save new user
        const newUser = new User({ email, password: hashedPassword, firstName, lastName, role });
        const savedUser = await newUser.save();

        // Generate token for the new user
        const token = generateToken(savedUser);

        // Create a token document or update existing
        const tokenDoc = await Token.findOneAndUpdate(
            { userId: savedUser._id },
            { $push: { tokens: { token } } }, // Push the new token
            { upsert: true, new: true } // Create if doesn't exist
        );

        // Return only specific user fields
        const userResponse = {
            firstName: savedUser.firstName,
            lastName: savedUser.lastName,
            email: savedUser.email,
            profilePicture: savedUser.profilePicture,
            _id: savedUser._id,
            role: savedUser.role
        };

        res.status(200).json({
            message: "Registration successful! Please log in.",
            data: userResponse,
            token,
            status: "success",
        });
    } catch (error) {
        console.log("Error in registerController:", error);
        res.status(500).json({ message: "An internal server error occurred" });
    }
};

// login user
const loginController = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            status: "error",
            message: "Email and password are required!",
        });
    }

    try {
        // Find the user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                status: "error",
                message: "No user found with this email. Please create an account!",
            });
        }

        // Verify password
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({
                status: "error",
                message: "Invalid password. Please try again!",
            });
        }

        // Generate token
        const token = generateToken(user);

        // Update or create the token document
        const tokenDoc = await Token.findOneAndUpdate(
            { userId: user._id },
            { $push: { tokens: { token } } }, // Push the new token into tokens array
            { upsert: true, new: true } // Create if doesn't exist
        );

        // Return only specific user fields
        const userResponse = {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            profilePicture: user.profilePicture,
            role: user.role,
            _id: user._id,
        };

        res.status(200).json({
            status: "success",
            message: `${user.firstName} logged in successfully!`,
            token,
            data: userResponse,
        });
    } catch (error) {
        console.log("Error in loginController:", error);
        res.status(500).json({
            status: "error",
            message: "An error occurred during login. Please try again!",
        });
    }
};

//logout user
const logOutController = async (req, res) => {
    try {
        // The userId is already attached to req.user by the verifyToken middleware
        const userId = req.user.userId;
        const token = req.headers?.authorization?.split(" ")[1];  // Extract token from Authorization header

        if (!token) {
            return res.status(400).json({
                status: "failed",
                message: "No token provided",
            });
        }

        // Find and remove the token from the user's token array in the database
        const tokenRecord = await Token.findOne({
            userId: userId,
            "tokens.token": token,
        });

        if (!tokenRecord) {
            return res.status(403).json({
                status: "failed",
                message: "Token not found in the database",
            });
        }

        // Remove the token from the user's tokens array
        await Token.updateOne(
            { userId: userId },
            { $pull: { tokens: { token: token } } }  // Remove the matching token
        );

        // Clear the token from cookies (optional)
        res.clearCookie("token", { sameSite: "none", secure: "true" });

        // Send a success response
        return res.status(200).json({
            status: "success",
            message: "Logout successful!",
        });
    } catch (error) {
        return res.status(500).json({
            status: "failed",
            message: "An error occurred during logout",
            error: error.message,
        });
    }
};

//refetch user
const refetchUserController = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ _id: userId });

        if (!user) {
            res.status(400).json({
                status: "error",
                message: error.message,
                errorMessage: "no user found",
            });
        }

        // Define the fields to return
        const userResponse = {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            profilePicture: user.profilePicture,
            _id: user._id,
        };

        res.status(200).json({
            status: "success",
            message: "successfully received data and user token available",
            data: userResponse,
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message,
            errorMessage: "get me not found",
        });
    }
};

//refetch user
const getUserProfileController = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ _id: userId });

        if (!user) {
            res.status(400).json({
                status: "error",
                message: error.message,
                errorMessage: "no user found",
            });
        }

        // Define the fields to return
        const userResponse = {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            profilePicture: user.profilePicture,
            role: user.role,
            gender: user.gender,
            address: user.address,
            country: user.country,
            isActive: user.isActive,
            workTitle: user.workTitle,
            _id: user._id,
            images: user.images,
            specialty: user.specialty,
            experience: user.experience,
        };

        res.status(200).json({
            status: "success",
            message: "successfully received profile data",
            data: userResponse,
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message,
            errorMessage: "get me not found",
        });
    }
};

const generateFileUrl = (filename) => {
    return `/uploads/${filename}`;
};

//update profile picture
const uploadProfilePictureController = async (req, res, next) => {
    const { userId } = req.params;
    const { filename } = req.file;
    try {
        const user = await User.findByIdAndUpdate(
            userId,
            { profilePicture: generateFileUrl(filename) },
            { new: true }
        );
        if (!user) {
            throw new CustomError("User not found!", 404);
        }

        res
            .status(200)
            .json({ message: "Profile picture updated successfully!", data: user.profilePicture });
    } catch (error) {
        next(error);
    }
};

//update single user
const updateUserController = async (req, res) => {
    const { userId } = req.params;

    const updateFields = req.body;

    try {
        // Find the user to update
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                status: "error",
                message: "User not found",
            });
        }

        // Handle file upload if a file is present
        if (req.file) {
            console.log(req.file, "file")
            const fileUrl = generateFileUrl(req.file.filename); // 
            //Generate file URL
            updateFields.profilePicture = fileUrl; // Assuming you are saving the file as profilePicture
        }

        // Update only the fields provided in the request body
        Object.keys(updateFields).forEach((key) => {
            user[key] = updateFields[key]; // Dynamically update each field
        });


        // Save the updated user
        await user.save();


        res.status(200).json({
            status: "success",
            message: "Profile updated successfully",
            data: updateFields,
        });
    } catch (error) {
        console.log("Error in updateUserController:", error);
        res.status(500).json({
            status: "error",
            message: error.message,
            errorMessage: "An internal server error occurred",
        });
    }
};

//get lawyers
const getLawyersController = async (req, res, next) => {
    try {
        // Extract the specialty from the query parameters (if provided)
        const { specialty } = req.query;

        // Build the query for fetching lawyers
        let query = { role: "lawyer", isDelete: false };

        // If a specialty is provided, use regex for partial match
        if (specialty) {
            query.specialty = { $regex: specialty, $options: "i" }; // "i" makes it case-insensitive
        }

        // Fetch lawyers based on the query
        const lawyers = await User.find(query);

        if (!lawyers || lawyers.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "No lawyers found",
            });
        }

        // Process lawyers' data
        const processedLawyers = lawyers.map(lawyer => {
            // Calculate average rating for the lawyer
            const ratings = lawyer.ratings.map(rating => parseFloat(rating));
            const averageRating = ratings.length > 0 ? (ratings.reduce((acc, val) => acc + val, 0) / ratings.length).toFixed(2) : 0;

            // Identify recommended lawyers (ratings between 4.0 and 5.0)
            const isRecommended = averageRating >= 4.0 && averageRating <= 5.0;

            return {
                _id: lawyer._id,
                name: `${lawyer.firstName} ${lawyer.lastName}`,
                ratings: averageRating,
                address: lawyer.address,
                experience: lawyer.experience,
                profilePicture: lawyer.profilePicture,
                isRecommended: isRecommended,
                specialty: lawyer.specialty,
                accountDate: lawyer.createdAt,
                images: lawyer.images,
                phone: lawyer.phone,
                email: lawyer.email,
                workTitle: lawyer.workTitle,
                country: lawyer.country,
                gender: lawyer.gender
            };
        });

        // Separate recommended lawyers and others
        const recommendedLawyers = processedLawyers.filter(lawyer => lawyer.isRecommended);
        const allLawyers = processedLawyers;

        // Respond with both categories of lawyers
        return res.status(200).json({
            message: "Lawyers retrieved successfully",
            data: {
                recommendedLawyers, // lawyers with ratings between 4.0 and 5.0
                allLawyers // all lawyers with ratings between 0 and 5.0
            }
        });

    } catch (error) {
        next(error);
    }
};

//get lawyers
const getWishlist = async (req, res, next) => {
    try {
        // Extract the _id array from the request body
        const { ids } = req.body;

        // Validate if ids array is provided and is an array
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid or missing 'ids' array in the request body",
            });
        }

        // Build the query for fetching lawyers
        const query = {
            role: "lawyer",
            isDelete: false,
            _id: { $in: ids }, // Match _id with the provided ids
        };

        // Fetch lawyers based on the query
        const lawyers = await User.find(query);

        if (!lawyers || lawyers.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "No lawyers found matching the given IDs",
            });
        }

        // Process lawyers' data
        const processedLawyers = lawyers.map(lawyer => ({
            _id: lawyer._id,
            name: `${lawyer.firstName} ${lawyer.lastName}`,
            address: lawyer.address,
            experience: lawyer.experience,
            profilePicture: lawyer.profilePicture,
            specialty: lawyer.specialty,
            accountDate: lawyer.createdAt,
            images: lawyer.images,
            phone: lawyer.phone,
            email: lawyer.email
        }));

        // Respond with the matched lawyers
        return res.status(200).json({
            message: "Lawyers retrieved successfully",
            data: processedLawyers,
        });

    } catch (error) {
        next(error);
    }
};



module.exports = {
    registerController,
    loginController,
    logOutController,
    refetchUserController,
    getUserProfileController,
    updateUserController,
    uploadProfilePictureController,
    getLawyersController,
    getWishlist
};