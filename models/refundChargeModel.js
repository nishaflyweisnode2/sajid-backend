const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema(
    {
        refundAmount: {
            type: Number,
        },
    },
    { timestamps: true }
);

const Refund = mongoose.model('RefundCharges', refundSchema);

module.exports = Refund;
