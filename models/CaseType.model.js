const { mongoose } = require("mongoose");

const CaseTypeSchema = new mongoose.Schema(
    {
        typeName: {
            type: String,
            required: true,
            unique: true, // Ensures each case type is unique
        },
        description: {
            type: String,
            default: "", // Optional field to describe the case type
        },
        isActive: {
            type: Boolean,
            default: true, // You can toggle whether the case type is active or not
        },
        isDeleted: {
            type: Boolean,
            default: false, // Soft delete flag
        },
        isTrash: {
            type: Boolean,
            default: false
        },
    },
    {
        timestamps: true, // Automatically includes createdAt and updatedAt fields
    }
);

const CaseType = mongoose.model("CaseType", CaseTypeSchema);

module.exports = CaseType;
