const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
    {
        bike: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Bike',
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        pickupLocation: {
            type: String,
            required: true,
        },
        dropOffLocation: {
            type: String,
            required: true,
        },
        pickupTime: {
            type: Date,
            required: true,
        },
        dropOffTime: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ['PENDING', 'APPROVED', 'CANCELLED', 'COMPLETED'],
            default: 'PENDING',
            required: true,
        },
        totalPrice: {
            type: Number,
            required: true,
        },
        paymentStatus: {
            type: String,
            enum: ['PENDING', 'PAID'],
            default: 'PENDING',
            required: true,
        },
    },
    { timestamps: true }
);

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
