const mongoose = require("mongoose");

const TokenSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true, // Ensure only one document per userId
        },
        tokens: [
            {
                token: {
                    type: String,
                    required: true,
                },
                expire: {
                    type: Date,
                    default: () => new Date(+new Date() + 7 * 24 * 60 * 60 * 1000), // Default expiry: 7 days
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

const Token = mongoose.model("Token", TokenSchema);

module.exports = Token;
