const { mongoose } = require("mongoose");

const DocumentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        case: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Case",
            required: true,
        },
        filePath: {
            type: String,
        },
        fileExt: {
            type: String,
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

const Document = mongoose.model("Document", DocumentSchema);

module.exports = Document