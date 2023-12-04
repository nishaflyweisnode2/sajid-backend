const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
    {
        bike: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Bike',
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
        totalPrice: {
            type: Number,
        },
        paymentStatus: {
            type: String,
            enum: ['PENDING', 'FAILED', 'PAID'],
            default: 'PENDING',
        },
        isTimeExtended: {
            type: Boolean,
            default: false,
        },
        extendedDropOffDate: {
            type: String,
            default: null,
        },
        extendedDropOffTime: {
            type: String,
            default: null,
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
    },
    { timestamps: true }
);

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;