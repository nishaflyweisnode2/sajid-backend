const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
    },
    desc: {
        type: String,
    },
    code: {
        type: String,
    },
    discount: {
        type: Number,
    },
    isPercent: {
        type: Boolean,
        default: true,
    },
    expirationDate: {
        type: Date,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });


const Coupon = mongoose.model('Coupon', CouponSchema);

module.exports = Coupon;
