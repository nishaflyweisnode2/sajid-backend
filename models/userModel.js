const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
    },
    lastName: {
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
    deviceToken: {
        type: String
    },
    completeProfile: {
        type: Boolean,
        default: false,
    },
    currentLocation: {
        type: {
            type: String,
            default: "Point"
        },
        coordinates: {
            type: [Number],
            default: [0, 0]
        },
    },
    state: {
        type: String
    },
    isState: {
        type: String,
        default: false
    },
    city: { type: mongoose.Schema.ObjectId, ref: 'City' },
    isCity: {
        type: String,
        default: false
    },
    userType: {
        type: String,
        enum: ["ADMIN", "USER", "PARTNER", "FRANCHISE-PARTNER", "SUPPORT", "FINANCE"],
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
        aadharCardNo: {
            type: String,
            default: null,
        },
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
        drivingLicenseNo: {
            type: String,
            default: null,
        },
        frontImage: {
            type: String,
            default: null,
        },
        backImage: {
            type: String,
            default: null,
        },
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isRejectUser: {
        type: Boolean,
        default: false
    },
    remarks: {
        type: String,
    },
    qrCode: {
        type: String,
    },
    status: {
        type: Boolean,
        default: false
    },
    status: {
        type: Boolean,
        default: false
    },
    isDashBoard: {
        type: Boolean,
        default: false
    },
    isCommissionManage: {
        type: Boolean,
        default: false
    },
    isPrivacyPolicy: {
        type: Boolean,
        default: false
    },
    isOnBoardingManage: {
        type: Boolean,
        default: false
    },
    isBikeManagement: {
        type: Boolean,
        default: false
    },
    isTermAndConditions: {
        type: Boolean,
        default: false
    },
    ismanageCustomer: {
        type: Boolean,
        default: false
    },
    isPushNotification: {
        type: Boolean,
        default: false
    },
    isManagePromoCode: {
        type: Boolean,
        default: false
    },
    isAllAccessories: {
        type: Boolean,
        default: false
    },
    isManageStores: {
        type: Boolean,
        default: false
    },
    isCustomerStories: {
        type: Boolean,
        default: false
    },
    isTotalOrders: {
        type: Boolean,
        default: false
    },
    isRoleAccessManage: {
        type: Boolean,
        default: false
    },
   
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
