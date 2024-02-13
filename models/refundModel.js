const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema(
    {
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Booking',
        },
        accountNo: {
            type: String,
        },
        upiId: {
            type: String,
        },
        branchName: {
            type: String,
        },
        ifscCode: {
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
        type: {
            type: String,
            enum: ['UPI', 'WALLET', 'OTHER'],
            default: 'PENDING',
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
