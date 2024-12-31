const { mongoose } = require("mongoose");

const CaseRequestSchema = new mongoose.Schema(
    {
        requestBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        case: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Case",
        },
        receivedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        description: {
            type: String,
            default: ""
        },
        status: {
            type: String,
            default: "pending"
        },
        isAccept: {
            type: Boolean,
            default: false,
        },
        isReject: {
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

const CaseRequest = mongoose.model("CaseRequest", CaseRequestSchema);

module.exports = CaseRequest