const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
    {
        bike: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Bike',
        },
        accessories: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Accessory',
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        pickupLocation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Location',
        },
        dropOffLocation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Location',
        },
        gst: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'GST',
        },
        pickupDate: {
            type: Date,
        },
        dropOffDate: {
            type: Date,
        },
        pickupTime: {
            type: String,
        },
        dropOffTime: {
            type: String,
        },
        status: {
            type: String,
            enum: ['PENDING', 'APPROVED', 'CANCELLED', 'COMPLETED'],
            default: 'PENDING',
        },
        depositedMoney: {
            type: Number,
        },
        price: {
            type: Number,
        },
        taxAmount: {
            type: Number,
        },
        totalPrice: {
            type: Number,
        },
        accessoriesPrice: {
            type: Number,
        },
        walletAmount: {
            type: Number,
        },
        isWalletUsed: {
            type: Boolean,
            default: false,
        },
        paymentStatus: {
            type: String,
            enum: ['PENDING', 'FAILED', 'PAID'],
            default: 'PENDING',
        },
        referenceId: {
            type: String,
        },
        isTimeExtended: {
            type: Boolean,
            default: false,
        },
        extendedDropOffDate: {
            type: Date,
            default: null,
        },
        extendedDropOffTime: {
            type: String,
            default: null,
        },
        extendedPrice: {
            type: Number,
        },
        totalExtendedPrice: {
            type: Number,
        },
        isExtendedPricePaid: {
            type: Boolean,
            default: false
        },
        offerCode: {
            type: String,
        },
        discountPrice: {
            type: Number,
        },
        isCouponApplied: {
            type: Boolean,
            default: false
        },
        tripStartTime: {
            type: Date,
        },
        tripEndTime: {
            type: Date,
        },
        isTripCompleted: {
            type: Boolean,
            default: false,
        },
        tripStartKm: {
            type: Number,
        },
        approvedOtp: {
            type: String,
        },
        isApprovedOtp: {
            type: Boolean,
            default: false
        },
        approvedImage: {
            type: String,
        },
        vechileNo: {
            type: String,
        },
        tripEndKm: {
            type: Number,
        },
        remarks: {
            type: String,
        },
        rejectRemarks: {
            type: String,
        },
        rejectOtp: {
            type: String,
        },
        isRejectOtp: {
            type: Boolean,
            default: false
        },
        tripEndOtp: {
            type: String,
        },
        isTripEndOtp: {
            type: Boolean,
            default: false
        },
        isSubscription: {
            type: Boolean,
            default: false,
        },
        subscriptionMonths: {
            type: Number,
            default: 0,
        },
        refundPreference: {
            type: String,
            enum: ['UPI', 'WALLET', 'OTHER'],
            default: 'UPI',
        },
        upiId: {
            type: String,
        },
        accountNo: {
            type: String,
        },
        branchName: {
            type: String,
        },
        ifscCode: {
            type: String,
        },
        accessoriesSize: {
            type: String,
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
            default: null
        },
        review: [{
            userReview: {
                type: String,
                default: null
            },
            adminReply: {
                type: String,
                default: null
            }
        }],
        pdfLink: {
            type: String,
            default: null
        },

    },
    { timestamps: true }
);

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
