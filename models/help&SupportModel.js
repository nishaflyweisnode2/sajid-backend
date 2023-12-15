const mongoose = require('mongoose');

const helpAndSupportSchema = new mongoose.Schema(
    {
        mobileNumber: {
            type: String,
        },
        email: {
            type: String,
        },
        messages: [
            {
                message: { type: String },
                user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            },
        ],
    },
    { timestamps: true }
);

const HelpAndSupport = mongoose.model('HelpAndSupport', helpAndSupportSchema);

module.exports = HelpAndSupport;
