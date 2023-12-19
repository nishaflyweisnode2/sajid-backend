const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema(
    {
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Booking',
        },
        refundDetails: {
            type: String,
        },
        refundAmount: {
            type: Number,
        },
        refundCharges: {
            type: Number,
        },
        totalRefundAmount: {
            type: Number,
        },
        refundStatus: {
            type: String,
            enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
            default: 'PENDING',
        },
        userPaymentDetails: {
            type: String,
        },
        refundTransactionId: {
            type: String,
        },
        refundTransactionDate: {
            type: Date,
        },
    },
    { timestamps: true }
);

const Refund = mongoose.model('Refund', refundSchema);

module.exports = Refund;
