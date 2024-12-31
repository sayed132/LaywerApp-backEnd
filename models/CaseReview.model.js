const { mongoose } = require("mongoose");


const CaseReviewSchema = new mongoose.Schema(
    {
        reviewBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        case: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Case",
        },
        lawyer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        description: {
            type: String,
            default: ""
        },
        ratings: {
            type: String,
            default: "0"
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
    },
    {
        timestamps: true,
    }
);

const CaseReview = mongoose.model("CaseReview", CaseReviewSchema);

module.exports = CaseReview