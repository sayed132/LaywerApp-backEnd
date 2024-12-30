const { mongoose } = require("mongoose");

const ImageSchema = new mongoose.Schema(
    {
        path: { type: String, required: true },
        isDeleted: { type: Boolean, default: false },
    },
);


const CaseSchema = new mongoose.Schema(
    {
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        caseTitle: {
            type: String,
            require: true
        },
        caseType: {
            type: String,
            require: true
        },
        description: {
            type: String,
            default: ""
        },
        preferredOutcome: {
            type: String,
            default: ""
        },
        caseFiles: {
            type: Array(ImageSchema)
        },
        status: {
            type: String,
            default: "pending"
        },
        filingDate: {
            type: Date,
            default: Date.now()
        },
        deadline: {
            type: Date,
            default: Date.now()
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

const Case = mongoose.model("Case", CaseSchema);

module.exports = Case