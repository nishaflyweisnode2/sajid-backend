const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
    },
    mobileNumber: {
        type: String,
    },
    image: {
        type: String,
    },
    email: {
        type: String,
    },
    password: {
        type: String,
    },
    otp: {
        type: String,
    },
    otpExpiration: {
        type: Date,
    },
    accountVerification: {
        type: Boolean,
        default: false
    },
    completeProfile: {
        type: Boolean,
        default: false,
    },
    userType: {
        type: String,
        enum: ["ADMIN", "USER", "PARTNER"],
        default: "User"
    },
    refferalCode: {
        type: String,
    },
    wallet: {
        type: Number,
        default: 0,
    },
    uploadId: {
        frontImage: {
            type: String,
            default: null,
        },
        backImage: {
            type: String,
            default: null,
        },
    },
    drivingLicense: {
        frontImage: {
            type: String,
            default: null,
        },
        backImage: {
            type: String,
            default: null,
        },
    },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
