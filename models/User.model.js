const { mongoose } = require("mongoose");

const UserSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            trim: true,
            lowercase: true,
            unique: true
        },
        phone: {
            type: String,
            required: false,
            trim: true,
            default: ""
        },
        password: {
            type: String,
            required: true,
        },
        firstName: {
            type: String,
            trim: true,
        },
        lastName: {
            type: String,
            trim: true,
        },
        profilePicture: {
            type: String,
            default: "",
        },
        role: {
            type: String,
            default: "user",
            enum: [
                "admin",
                "lawyer",
                "user",
            ],
        },
        workTitle: {
            type: String,
            default: "",
        },
        specialty: [{
            type: String,
            default: "",
        }],
        ratings: [{
            type: String
        }],
        images: [{
            type: String
        }],
        gender: {
            type: String,
            trim: true,
            default: "",
        },
        experience: {
            type: String,
            default: "",
        },
        country: {
            type: String,
            trim: true,
            default: "",
        },
        address: {
            type: String,
            trim: true,
            default: "",
        },
        isActive: {
            type: Boolean,
            default: false,
        },
        isDelete: {
            type: Boolean,
            default: false,
        },
        isTrash: {
            type: Boolean,
            default: false,
        },
        isBlocked: {
            type: Boolean,
            default: false,
        },
        expoPushToken: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", UserSchema);

module.exports = User